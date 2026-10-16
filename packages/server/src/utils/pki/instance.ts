import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import forge from "node-forge";
import { privateKeyMatchesCertificate } from "../tls/certificate";
import {
	type CertificateAuthority,
	certificateFingerprint,
	createRootCertificateAuthority,
	DEFAULT_INSTANCE_VALIDITY_DAYS,
	DEFAULT_KEY_SIZE,
	generateInstanceKeyPair,
	issueInstanceCertificate,
	publicKeyFingerprint,
} from "./ca";
import {
	type IdentityDiagnostic,
	type InstanceIdentity,
	type InstanceIdentityDocument,
	type NotployCapability,
	type NotployProduct,
	productCapabilities,
} from "./types";
import {
	buildInstanceCertificateInfo,
	daysUntil,
	getIdentityStatus,
	parseIdentityDocumentJson,
	verifyCertificateChain,
} from "./verify";

/**
 * Local instance identity store (issue #75 §1, §3).
 *
 * Everything lives under `identityDir` (default `/etc/notploy/identity`):
 *
 *   instance.key  — private key, mode 0600, never leaves the instance
 *   instance.crt  — signed instance certificate
 *   ca.crt        — trust anchor to validate the identity chain
 *   ca.key        — local CA signing key (self-hosted only), mode 0600
 *   identity.json — non-secret identity metadata
 *   entitlement.token — optional Notploy-signed entitlement (cloud/console)
 *
 * Private keys are never returned by a public API and never included in the
 * secret-free `InstanceIdentity` projection.
 */

export interface IdentityFiles {
	directory: string;
	privateKeyPath: string;
	certificatePath: string;
	trustAnchorPath: string;
	caKeyPath: string;
	documentPath: string;
	entitlementPath: string;
	revocationsPath: string;
}

export const identityFileNames = {
	privateKey: "instance.key",
	certificate: "instance.crt",
	trustAnchor: "ca.crt",
	caKey: "ca.key",
	document: "identity.json",
	entitlement: "entitlement.token",
	revocations: "revocations.json",
} as const;

const DIRECTORY_MODE = 0o700;
const PRIVATE_KEY_MODE = 0o600;
const PUBLIC_FILE_MODE = 0o644;

export const identityFiles = (identityDir: string): IdentityFiles => ({
	directory: identityDir,
	privateKeyPath: path.join(identityDir, identityFileNames.privateKey),
	certificatePath: path.join(identityDir, identityFileNames.certificate),
	trustAnchorPath: path.join(identityDir, identityFileNames.trustAnchor),
	caKeyPath: path.join(identityDir, identityFileNames.caKey),
	documentPath: path.join(identityDir, identityFileNames.document),
	entitlementPath: path.join(identityDir, identityFileNames.entitlement),
	revocationsPath: path.join(identityDir, identityFileNames.revocations),
});

const writeSecret = (filePath: string, contents: string) => {
	fs.writeFileSync(filePath, contents, { mode: PRIVATE_KEY_MODE });
	// writeFileSync only applies the mode on creation, and umask can strip bits.
	fs.chmodSync(filePath, PRIVATE_KEY_MODE);
};

const writePublic = (filePath: string, contents: string) => {
	fs.writeFileSync(filePath, contents, { mode: PUBLIC_FILE_MODE });
	fs.chmodSync(filePath, PUBLIC_FILE_MODE);
};

export interface GenerateIdentityOptions {
	identityDir: string;
	product?: NotployProduct;
	instanceId?: string;
	keySize?: number;
	validityDays?: number;
	subjectAltNames?: string[];
	now?: Date;
	/** Overwrite an existing identity. Default false to protect live keys. */
	force?: boolean;
	/** Embed the identity document in the certificate. Default true. */
	includeIdentityExtension?: boolean;
}

export interface GeneratedInstanceIdentity {
	identity: InstanceIdentity;
	files: IdentityFiles;
	/** Public key, returned only to the caller performing the bootstrap. */
	publicKeyPem: string;
}

/**
 * Bootstraps a self-hosted instance identity entirely locally: generates the key
 * pair, creates a local trust anchor and signs the instance certificate. No
 * network access is required and no Notploy account is involved.
 */
export const generateLocalInstanceIdentity = (
	options: GenerateIdentityOptions,
): GeneratedInstanceIdentity => {
	const files = identityFiles(options.identityDir);
	if (fs.existsSync(files.privateKeyPath) && !options.force) {
		throw new Error(
			`An instance identity already exists at ${files.privateKeyPath}; set force to replace it`,
		);
	}

	const product = options.product ?? "self";
	const capabilities: NotployCapability[] = [...productCapabilities[product]];
	const instanceId = options.instanceId ?? randomUUID();
	const now = options.now ?? new Date();

	const keyPair = generateInstanceKeyPair(options.keySize ?? DEFAULT_KEY_SIZE);
	const trustAnchor = createRootCertificateAuthority({
		commonName: "Notploy Local Instance Root CA",
		now,
	});
	const issued = issueInstanceCertificate({
		issuer: trustAnchor,
		publicKey: keyPair.publicKey,
		instanceId,
		product,
		capabilities,
		subjectKeyFingerprint: publicKeyFingerprint(keyPair.publicKey),
		createdAt: now,
		validityDays: options.validityDays ?? DEFAULT_INSTANCE_VALIDITY_DAYS,
		subjectAltNames: options.subjectAltNames,
		now,
		includeIdentityExtension: options.includeIdentityExtension,
	});

	fs.mkdirSync(files.directory, { recursive: true, mode: DIRECTORY_MODE });
	fs.chmodSync(files.directory, DIRECTORY_MODE);
	writeSecret(files.privateKeyPath, keyPair.privateKeyPem);
	writeSecret(files.caKeyPath, trustAnchor.privateKeyPem);
	writePublic(files.certificatePath, issued.certificatePem);
	writePublic(files.trustAnchorPath, trustAnchor.certificatePem);

	const document: InstanceIdentityDocument = {
		version: 1,
		instanceId,
		product,
		capabilities,
		subjectKeyFingerprint: publicKeyFingerprint(keyPair.publicKey),
		createdAt: now.toISOString(),
	};
	writePublic(files.documentPath, `${JSON.stringify(document, null, 2)}\n`);

	return {
		identity: {
			instanceId,
			product,
			capabilities,
			status: getIdentityStatus(issued.certificate.validity.notAfter, now),
			trustAnchor: "local",
			createdAt: document.createdAt,
			expiresAt: issued.certificate.validity.notAfter.toISOString(),
			daysUntilExpiration: daysUntil(issued.certificate.validity.notAfter, now),
			certificate: buildInstanceCertificateInfo(
				issued.certificatePem,
				document,
			),
			diagnostics: [],
		},
		files,
		publicKeyPem: keyPair.publicKeyPem,
	};
};

/** Reads the local CA private key and certificate, for rotation. */
export const loadLocalCertificateAuthority = (
	identityDir: string,
): CertificateAuthority | null => {
	const files = identityFiles(identityDir);
	if (
		!fs.existsSync(files.caKeyPath) ||
		!fs.existsSync(files.trustAnchorPath)
	) {
		return null;
	}
	const certificatePem = fs.readFileSync(files.trustAnchorPath, "utf8");
	const privateKeyPem = fs.readFileSync(files.caKeyPath, "utf8");
	const certificate = forge.pki.certificateFromPem(certificatePem);
	return {
		commonName: (certificate.subject.getField("CN")?.value as string) ?? "",
		privateKey: forge.pki.privateKeyFromPem(privateKeyPem),
		certificate,
		certificatePem,
		privateKeyPem,
		fingerprint: certificateFingerprint(certificate),
	};
};

export interface RawIdentityFiles {
	privateKey: string | null;
	certificate: string | null;
	trustAnchor: string | null;
	document: string | null;
	entitlementToken: string | null;
}

const readIfExists = (filePath: string): string | null =>
	fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;

export const readRawIdentityFiles = (identityDir: string): RawIdentityFiles => {
	const files = identityFiles(identityDir);
	return {
		privateKey: readIfExists(files.privateKeyPath),
		certificate: readIfExists(files.certificatePath),
		trustAnchor: readIfExists(files.trustAnchorPath),
		document: readIfExists(files.documentPath),
		entitlementToken: readIfExists(files.entitlementPath),
	};
};

export interface InstanceIdentityLoadResult {
	identity: InstanceIdentity | null;
	/** Raw Notploy-signed token, still to be verified by the caller. */
	entitlementToken: string | null;
	diagnostics: IdentityDiagnostic[];
	files: IdentityFiles;
	publicKeyFingerprint: string | null;
}

/**
 * Loads and locally validates the instance identity. Never throws: a missing or
 * broken identity yields diagnostics so the runtime can explain what is wrong.
 */
export const loadInstanceIdentity = (
	identityDir: string,
	options: { now?: Date } = {},
): InstanceIdentityLoadResult => {
	const files = identityFiles(identityDir);
	const now = options.now ?? new Date();
	const raw = readRawIdentityFiles(identityDir);
	const diagnostics: IdentityDiagnostic[] = [];

	if (!raw.certificate || !raw.trustAnchor || !raw.privateKey) {
		diagnostics.push({
			code: "identity.missing",
			severity: "warning",
			message: `No instance identity was found in ${identityDir}`,
			remediation:
				"Run the installer with --self to bootstrap a local identity, or enroll this instance with a signed entitlement.",
		});
		return {
			identity: null,
			entitlementToken: raw.entitlementToken,
			diagnostics,
			files,
			publicKeyFingerprint: null,
		};
	}

	// Certificates generated by the shell installer carry the identity document
	// in identity.json instead of the X.509 extension.
	let fallbackDocument = null;
	if (raw.document) {
		try {
			fallbackDocument = parseIdentityDocumentJson(raw.document);
		} catch {
			fallbackDocument = null;
		}
	}

	const chain = verifyCertificateChain({
		leafPem: raw.certificate,
		trustAnchorPem: raw.trustAnchor,
		now,
		identityDocumentFallback: fallbackDocument,
	});

	if (!chain.info) {
		diagnostics.push({
			code: "identity.certificate_invalid",
			severity: "error",
			message:
				chain.errors[0] ??
				"The instance certificate carries no Notploy identity document",
			remediation:
				"Re-bootstrap the instance identity; the certificate cannot be parsed.",
		});
		return {
			identity: null,
			entitlementToken: raw.entitlementToken,
			diagnostics,
			files,
			publicKeyFingerprint: null,
		};
	}

	// The private key must actually belong to the certificate, otherwise the
	// instance cannot authenticate with the identity it presents.
	try {
		if (!privateKeyMatchesCertificate(raw.certificate, raw.privateKey)) {
			diagnostics.push({
				code: "identity.key_mismatch",
				severity: "error",
				message: "The instance private key does not match the certificate",
				remediation:
					"Restore the matching instance.key, or rotate the identity to regenerate the pair.",
			});
		}
	} catch (error) {
		diagnostics.push({
			code: "identity.key_mismatch",
			severity: "error",
			message: (error as Error).message,
			remediation: "Re-bootstrap the instance identity.",
		});
	}

	if (chain.errors.length) {
		diagnostics.push({
			code: "identity.chain_invalid",
			severity: "error",
			message: chain.errors.join("; "),
			remediation:
				"Restore the original ca.crt, or rotate the instance identity to chain to a valid trust anchor.",
		});
	}

	const status = getIdentityStatus(chain.info.notAfter, now);
	if (status === "expired") {
		diagnostics.push({
			code: "identity.expired",
			severity: "error",
			message: `The instance certificate expired on ${chain.info.notAfter.toISOString().slice(0, 10)}`,
			remediation:
				"Rotate the instance identity; the certificate is no longer valid.",
		});
	} else if (status === "expiring") {
		diagnostics.push({
			code: "identity.expiring",
			severity: "warning",
			message: `The instance certificate expires in ${daysUntil(chain.info.notAfter, now)} day(s)`,
			remediation: "Rotate the instance identity before it expires.",
		});
	}

	const hasError = diagnostics.some(
		(diagnostic) => diagnostic.severity === "error",
	);

	if (!hasError && status === "active") {
		diagnostics.push({
			code: "identity.provisioned",
			severity: "ok",
			message: `Instance identity ${chain.info.instanceId} is valid until ${chain.info.notAfter.toISOString().slice(0, 10)}`,
			remediation: null,
		});
	}

	return {
		identity: {
			instanceId: chain.info.instanceId,
			product: chain.info.product,
			capabilities: chain.info.capabilities,
			status: hasError ? "invalid" : status,
			trustAnchor: "local",
			createdAt: chain.info.createdAt,
			expiresAt: chain.info.notAfter.toISOString(),
			daysUntilExpiration: daysUntil(chain.info.notAfter, now),
			certificate: chain.info,
			diagnostics,
		},
		entitlementToken: raw.entitlementToken,
		diagnostics,
		files,
		publicKeyFingerprint: chain.info.subjectKeyFingerprint,
	};
};

/** Persists a Notploy-signed entitlement token, mode 0600. */
export const writeEntitlementToken = (
	identityDir: string,
	token: string,
): void => {
	const files = identityFiles(identityDir);
	fs.mkdirSync(files.directory, { recursive: true, mode: DIRECTORY_MODE });
	writeSecret(files.entitlementPath, `${token.trim()}\n`);
};

/**
 * Reads the local revocation list: SHA-256 certificate fingerprints to refuse,
 * one per line (JSON array also accepted). Kept local so revocation does not
 * introduce an online dependency for self-hosted installs.
 */
export const loadRevokedFingerprints = (identityDir: string): string[] => {
	const { revocationsPath } = identityFiles(identityDir);
	if (!fs.existsSync(revocationsPath)) return [];
	try {
		const contents = fs.readFileSync(revocationsPath, "utf8");
		const parsed: unknown = JSON.parse(contents);
		if (Array.isArray(parsed)) {
			return parsed
				.filter((value): value is string => typeof value === "string")
				.map((value) => value.trim().toUpperCase());
		}
		return [];
	} catch {
		return [];
	}
};

/** True when the certificate fingerprint is present in the revocation list. */
export const isIdentityRevoked = (
	identityDir: string,
	fingerprint: string,
): boolean =>
	loadRevokedFingerprints(identityDir).includes(
		fingerprint.trim().toUpperCase(),
	);

/**
 * Rotates the instance certificate: a fresh key pair is issued by the existing
 * local CA, keeping the same instance id and product. The previous certificate
 * is archived next to the new one so a failed rollout stays recoverable.
 */
export const rotateLocalInstanceIdentity = (options: {
	identityDir: string;
	validityDays?: number;
	subjectAltNames?: string[];
	now?: Date;
}): GeneratedInstanceIdentity => {
	const files = identityFiles(options.identityDir);
	const now = options.now ?? new Date();
	const trustAnchor = loadLocalCertificateAuthority(options.identityDir);
	if (!trustAnchor) {
		throw new Error(
			"The local instance CA is missing; re-bootstrap the identity instead of rotating it",
		);
	}

	const raw = readRawIdentityFiles(options.identityDir);
	if (!raw.certificate || !raw.document) {
		throw new Error("No existing instance identity to rotate");
	}
	const document = JSON.parse(raw.document) as InstanceIdentityDocument;

	const keyPair = generateInstanceKeyPair(DEFAULT_KEY_SIZE);
	const issued = issueInstanceCertificate({
		issuer: trustAnchor,
		publicKey: keyPair.publicKey,
		instanceId: document.instanceId,
		product: document.product,
		capabilities: document.capabilities,
		subjectKeyFingerprint: publicKeyFingerprint(keyPair.publicKey),
		createdAt: now,
		validityDays: options.validityDays ?? DEFAULT_INSTANCE_VALIDITY_DAYS,
		subjectAltNames: options.subjectAltNames,
		now,
	});

	// Archive the outgoing certificate so a rotation can be rolled back.
	fs.writeFileSync(`${files.certificatePath}.previous`, raw.certificate, {
		mode: PUBLIC_FILE_MODE,
	});
	writeSecret(files.privateKeyPath, keyPair.privateKeyPem);
	writePublic(files.certificatePath, issued.certificatePem);

	const nextDocument: InstanceIdentityDocument = {
		...document,
		subjectKeyFingerprint: publicKeyFingerprint(keyPair.publicKey),
		createdAt: now.toISOString(),
	};
	writePublic(files.documentPath, `${JSON.stringify(nextDocument, null, 2)}\n`);

	return {
		identity: {
			instanceId: document.instanceId,
			product: document.product,
			capabilities: document.capabilities,
			status: getIdentityStatus(issued.certificate.validity.notAfter, now),
			trustAnchor: "local",
			createdAt: nextDocument.createdAt,
			expiresAt: issued.certificate.validity.notAfter.toISOString(),
			daysUntilExpiration: daysUntil(issued.certificate.validity.notAfter, now),
			certificate: buildInstanceCertificateInfo(
				issued.certificatePem,
				nextDocument,
			),
			diagnostics: [],
		},
		files,
		publicKeyPem: keyPair.publicKeyPem,
	};
};
