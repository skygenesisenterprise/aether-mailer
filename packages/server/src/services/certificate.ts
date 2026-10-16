import fs from "node:fs";
import path from "node:path";
import { paths } from "@notploy/server/constants";
import { db } from "@notploy/server/db";
import {
	type apiCreateCertificate,
	certificates,
	domains,
	server,
} from "@notploy/server/db/schema";
import { removeDirectoryIfExistsContent } from "@notploy/server/utils/filesystem/directory";
import type { ParsedCertificate } from "@notploy/server/utils/tls/certificate";
import { parseCertificate } from "@notploy/server/utils/tls/certificate";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { quote } from "shell-quote";
import { stringify } from "yaml";
import type { z } from "zod";
import { encodeBase64 } from "../utils/docker/utils";
import { execAsyncRemote } from "../utils/process/execAsync";

export type Certificate = typeof certificates.$inferSelect;

/** Days before expiration at which a certificate is considered expiring. */
export const CERTIFICATE_EXPIRING_DAYS = 30;

export type CertificateStatus = "pending" | "active" | "expiring" | "expired";

/**
 * Certificate metadata safe to expose through the API. `privateKey` is
 * deliberately absent: it is secret material and never leaves the server.
 */
export type CertificatePublic = Omit<Certificate, "privateKey"> & {
	status: CertificateStatus;
	daysUntilExpiration: number | null;
};

/** Inventory row: a public certificate plus its target server label. */
export type CertificateInventoryItem = CertificatePublic & {
	server: { name: string; ipAddress: string } | null;
};

/**
 * Derives the lifecycle state Notploy displays. Mirrors the states of issue #59:
 * a certificate without validity dates cannot be judged yet, so it stays
 * `pending` until its metadata has been extracted.
 */
export const getCertificateStatus = (
	certificate: Pick<Certificate, "notBefore" | "notAfter">,
	now = new Date(),
): CertificateStatus => {
	if (!certificate.notBefore || !certificate.notAfter) return "pending";
	const notAfter = certificate.notAfter.getTime();
	const notBefore = certificate.notBefore.getTime();
	if (notAfter < now.getTime()) return "expired";
	if (notBefore > now.getTime()) return "pending";
	const daysLeft = (notAfter - now.getTime()) / 1000 / 60 / 60 / 24;
	return daysLeft <= CERTIFICATE_EXPIRING_DAYS ? "expiring" : "active";
};

export const toPublicCertificate = (
	certificate: Certificate,
): CertificatePublic => {
	const { privateKey: _privateKey, ...rest } = certificate;
	const now = Date.now();
	return {
		...rest,
		status: getCertificateStatus(certificate),
		daysUntilExpiration: certificate.notAfter
			? Math.floor((certificate.notAfter.getTime() - now) / 1000 / 60 / 60 / 24)
			: null,
	};
};

/**
 * Extracts the metadata Notploy persists alongside the PEM so the inventory can
 * show issuer, SANs and expiration without re-parsing on every read.
 */
const certificateMetadata = (certificateData: string) => {
	try {
		const parsed: ParsedCertificate = parseCertificate(certificateData);
		return {
			notBefore: parsed.notBefore,
			notAfter: parsed.notAfter,
			issuer: parsed.issuer,
			commonName: parsed.commonName,
			subjectAltNames: parsed.hostnames,
		};
	} catch {
		// Unparsable certificates are rejected by validation before reaching
		// this point; store what we can instead of failing the write.
		return {
			notBefore: null,
			notAfter: null,
			issuer: null,
			commonName: null,
			subjectAltNames: [],
		};
	}
};

export const findCertificateById = async (certificateId: string) => {
	const certificate = await db.query.certificates.findFirst({
		where: eq(certificates.certificateId, certificateId),
	});

	if (!certificate) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Certificate not found",
		});
	}

	return certificate;
};

export interface ResolverUsage {
	domainId: string;
	host: string;
}

/**
 * Domains and the control plane that reference a certificate resolver. Used to
 * refuse deleting a certificate that is still serving traffic. A resolver name
 * is the certificate's `certificatePath`: that is the directory Traefik watches
 * and the value users pick in the domain form.
 */
export const findResolverUsage = async (
	resolver: string,
): Promise<ResolverUsage[]> => {
	const inUse = await db
		.select({ domainId: domains.domainId, host: domains.host })
		.from(domains)
		.where(
			and(
				eq(domains.certificateType, "custom"),
				eq(domains.customCertResolver, resolver),
			),
		);

	const settings = await db.query.webServerSettings.findFirst({
		columns: { certificateType: true, customCertResolver: true },
	});

	if (
		settings?.certificateType === "custom" &&
		settings.customCertResolver === resolver
	) {
		inUse.push({ domainId: "control-plane", host: "notploy dashboard" });
	}

	return inUse;
};

export const createCertificate = async (
	certificateData: z.infer<typeof apiCreateCertificate>,
	organizationId: string,
) => {
	const certificate = await db
		.insert(certificates)
		.values({
			...certificateData,
			organizationId: organizationId,
			...certificateMetadata(certificateData.certificateData),
		})
		.returning();

	if (!certificate || certificate[0] === undefined) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Failed to create the certificate",
		});
	}

	const cer = certificate[0];

	// Awaited: returning before the files exist reports success for a
	// certificate Traefik cannot serve yet.
	try {
		await createCertificateFiles(cer);
	} catch (error) {
		// Roll back the row so a failed deploy does not leave a certificate
		// listed in the UI with no material on disk.
		await db
			.delete(certificates)
			.where(eq(certificates.certificateId, cer.certificateId));
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: `Failed to write the certificate files: ${(error as Error).message}`,
		});
	}

	return cer;
};

export const removeCertificateById = async (certificateId: string) => {
	const certificate = await findCertificateById(certificateId);
	const { CERTIFICATES_PATH } = paths(!!certificate.serverId);
	const certDir = path.join(CERTIFICATES_PATH, certificate.certificatePath);

	const uses = await findResolverUsage(certificate.certificatePath);
	if (uses.length) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `This certificate is still used by: ${uses
				.map((use) => use.host)
				.join(", ")}. Detach it from those domains first.`,
		});
	}

	if (certificate.serverId) {
		await execAsyncRemote(certificate.serverId, `rm -rf ${quote([certDir])}`);
	} else {
		await removeDirectoryIfExistsContent(certDir);
	}

	const result = await db
		.delete(certificates)
		.where(eq(certificates.certificateId, certificateId))
		.returning();

	if (!result) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Failed to delete the certificate",
		});
	}

	return result;
};

const PRIVATE_KEY_MODE = 0o600;
const CERTIFICATE_MODE = 0o644;

const createCertificateFiles = async (certificate: Certificate) => {
	const { CERTIFICATES_PATH } = paths(!!certificate.serverId);
	const certDir = path.join(CERTIFICATES_PATH, certificate.certificatePath);
	const crtPath = path.join(certDir, "chain.crt");
	const keyPath = path.join(certDir, "privkey.key");

	const traefikConfig = {
		tls: {
			certificates: [
				{
					certFile: crtPath,
					keyFile: keyPath,
				},
			],
		},
	};
	const yamlConfig = stringify(traefikConfig);
	const configFile = path.join(certDir, "certificate.yml");

	if (certificate.serverId) {
		const certificateData = encodeBase64(certificate.certificateData);
		const privateKey = encodeBase64(certificate.privateKey);
		const command = `
			mkdir -p ${quote([certDir])};
			echo "${certificateData}" | base64 -d > ${quote([crtPath])};
			chmod ${CERTIFICATE_MODE.toString(8)} ${quote([crtPath])};
			echo "${privateKey}" | base64 -d > ${quote([keyPath])};
			chmod ${PRIVATE_KEY_MODE.toString(8)} ${quote([keyPath])};
			echo "${yamlConfig}" > ${quote([configFile])};
		`;

		await execAsyncRemote(certificate.serverId, command);
	} else {
		if (!fs.existsSync(certDir)) {
			fs.mkdirSync(certDir, { recursive: true, mode: 0o700 });
		}

		fs.writeFileSync(crtPath, certificate.certificateData, {
			mode: CERTIFICATE_MODE,
		});
		fs.writeFileSync(keyPath, certificate.privateKey, { mode: PRIVATE_KEY_MODE });
		// writeFileSync only applies mode when creating the file, and umask can
		// strip bits, so set it explicitly.
		fs.chmodSync(keyPath, PRIVATE_KEY_MODE);
		fs.chmodSync(crtPath, CERTIFICATE_MODE);

		fs.writeFileSync(configFile, yamlConfig, { mode: 0o644 });
	}
};

export const updateCertificate = async (
	certificateId: string,
	updates: {
		name?: string;
		certificateData?: string;
		privateKey?: string;
	},
) => {
	const updated = await db
		.update(certificates)
		.set({
			...updates,
			...(updates.certificateData
				? certificateMetadata(updates.certificateData)
				: {}),
			updatedAt: new Date(),
		})
		.where(eq(certificates.certificateId, certificateId))
		.returning();

	if (!updated || updated[0] === undefined) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Failed to update the certificate",
		});
	}

	const cert = updated[0];

	// If cert data or private key changed, rewrite files
	if (updates.certificateData || updates.privateKey) {
		await createCertificateFiles(cert);
	}

	return cert;
};

/**
 * Columns safe to expose. `privateKey` is excluded at the SQL level so a list
 * request never loads secret material into memory.
 */
const publicColumns = {
	certificateId: certificates.certificateId,
	name: certificates.name,
	certificateData: certificates.certificateData,
	certificatePath: certificates.certificatePath,
	autoRenew: certificates.autoRenew,
	organizationId: certificates.organizationId,
	serverId: certificates.serverId,
	notBefore: certificates.notBefore,
	notAfter: certificates.notAfter,
	issuer: certificates.issuer,
	commonName: certificates.commonName,
	subjectAltNames: certificates.subjectAltNames,
	createdAt: certificates.createdAt,
	updatedAt: certificates.updatedAt,
} as const;

type PublicCertificateRow = {
	[K in keyof typeof publicColumns]: Certificate[K];
};

/** Certificates of an organization, without any secret material. */
export const findCertificatesByOrganization = async (
	organizationId: string,
): Promise<CertificateInventoryItem[]> => {
	// The inventory needs the target server label, so the server row is joined in.
	// It stays a projection: `privateKey` is never selected.
	const rows = await db
		.select({
			...publicColumns,
			serverName: server.name,
			serverIpAddress: server.ipAddress,
		})
		.from(certificates)
		.leftJoin(server, eq(certificates.serverId, server.serverId))
		.where(eq(certificates.organizationId, organizationId));

	return rows.map((row) => {
		const { serverName, serverIpAddress, ...certificateRow } = row;
		return {
			...toPublicCertificate(
				certificateRow as unknown as PublicCertificateRow as Certificate,
			),
			server:
				serverName && serverIpAddress
					? { name: serverName, ipAddress: serverIpAddress }
					: null,
		};
	});
};

export const findPublicCertificateById = async (certificateId: string) =>
	toPublicCertificate(await findCertificateById(certificateId));

