import forge from "node-forge";
import { certificateFingerprint, publicKeyFingerprint } from "./ca";
import {
	INSTANCE_IDENTITY_EXPIRING_DAYS,
	INSTANCE_IDENTITY_EXTENSION_VERSION,
	INSTANCE_IDENTITY_STATUS_LABELS,
	type InstanceCertificateInfo,
	type InstanceIdentityDocument,
	type InstanceIdentityStatus,
	isNotployCapability,
	isNotployProduct,
	NOTPLOY_IDENTITY_EXTENSION_OID,
	type NotployCapability,
} from "./types";

/**
 * X.509 trust-chain verification for instance certificates (issue #75 §2, §6).
 *
 * Verification is explicit and never throws: callers receive the list of
 * problems so a broken identity can be explained instead of crashing startup.
 */

const firstCertificatePem = (pem: string): string => {
	const block = pem.match(
		/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/,
	);
	if (!block?.[0]) {
		throw new Error("No PEM certificate found");
	}
	return block[0];
};

/** Validates a parsed identity document, throwing on any malformed field. */
const validateIdentityDocument = (
	parsed: unknown,
): InstanceIdentityDocument => {
	const document = parsed as Partial<InstanceIdentityDocument>;
	if (
		document.version !== INSTANCE_IDENTITY_EXTENSION_VERSION ||
		typeof document.instanceId !== "string" ||
		!document.instanceId ||
		typeof document.product !== "string" ||
		!isNotployProduct(document.product) ||
		!Array.isArray(document.capabilities) ||
		typeof document.subjectKeyFingerprint !== "string" ||
		typeof document.createdAt !== "string"
	) {
		throw new Error("The Notploy instance identity document is malformed");
	}

	const capabilities = document.capabilities.filter(
		(value): value is NotployCapability =>
			typeof value === "string" && isNotployCapability(value),
	);

	return {
		version: document.version,
		instanceId: document.instanceId,
		product: document.product,
		capabilities,
		subjectKeyFingerprint: document.subjectKeyFingerprint,
		createdAt: document.createdAt,
	};
};

/**
 * Extracts the Notploy identity document from an instance certificate. Throws
 * when the certificate does not carry a valid document.
 */
export const parseIdentityDocument = (
	certificate: forge.pki.Certificate,
): InstanceIdentityDocument => {
	// @types/node-forge mistypes the `id` option as a number; at runtime forge
	// looks it up as the dotted OID string, so the cast is required.
	const extension = certificate.getExtension({
		id: NOTPLOY_IDENTITY_EXTENSION_OID,
	} as unknown as { id: number }) as { value?: unknown } | undefined;

	if (!extension || typeof extension.value !== "string") {
		throw new Error(
			"The certificate has no Notploy instance identity extension",
		);
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(extension.value);
	} catch {
		throw new Error(
			"The Notploy instance identity extension is not valid JSON",
		);
	}

	return validateIdentityDocument(parsed);
};

/** Identity document stored next to the certificate, for certs built without the extension. */
export const parseIdentityDocumentJson = (
	raw: string,
): InstanceIdentityDocument => {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new Error("The Notploy instance identity document is not valid JSON");
	}
	return validateIdentityDocument(parsed);
};

/** Non-throwing variant, for callers that fall back to identity.json. */
export const tryParseIdentityDocument = (
	certificate: forge.pki.Certificate,
): InstanceIdentityDocument | null => {
	try {
		return parseIdentityDocument(certificate);
	} catch {
		return null;
	}
};

/** Public metadata of an instance certificate, independent of the extension. */
export interface CertificateMetadata {
	serialNumber: string;
	fingerprint: string;
	subjectCommonName: string | null;
	issuerCommonName: string | null;
	notBefore: Date;
	notAfter: Date;
	subjectKeyFingerprint: string;
}

export const parseCertificateMetadata = (pem: string): CertificateMetadata => {
	const certificate = forge.pki.certificateFromPem(firstCertificatePem(pem));
	return {
		serialNumber: certificate.serialNumber,
		fingerprint: certificateFingerprint(certificate),
		subjectCommonName:
			(certificate.subject.getField("CN")?.value as string) ?? null,
		issuerCommonName:
			(certificate.issuer.getField("CN")?.value as string) ?? null,
		notBefore: certificate.validity.notBefore,
		notAfter: certificate.validity.notAfter,
		subjectKeyFingerprint: publicKeyFingerprint(certificate.publicKey),
	};
};

export type InstanceCertificateParse =
	| { valid: true; info: InstanceCertificateInfo }
	| { valid: false; error: string };

/** Parses an instance certificate without throwing. */
export const tryParseInstanceCertificate = (
	pem: string,
): InstanceCertificateParse => {
	try {
		return { valid: true, info: parseInstanceCertificate(pem) };
	} catch (error) {
		return { valid: false, error: (error as Error).message };
	}
};

/**
 * Merges an identity document with the certificate metadata. The fingerprint is
 * taken from the certificate's public key, never from the (self-asserted)
 * document, so the binding always reflects the actual key.
 */
export const composeInstanceCertificateInfo = (
	document: InstanceIdentityDocument,
	metadata: CertificateMetadata,
): InstanceCertificateInfo => ({
	instanceId: document.instanceId,
	product: document.product,
	capabilities: document.capabilities,
	createdAt: document.createdAt,
	subjectKeyFingerprint: metadata.subjectKeyFingerprint,
	serialNumber: metadata.serialNumber,
	fingerprint: metadata.fingerprint,
	subjectCommonName: metadata.subjectCommonName,
	issuerCommonName: metadata.issuerCommonName,
	notBefore: metadata.notBefore,
	notAfter: metadata.notAfter,
});

/** Composes identity info from a known document and the certificate metadata. */
export const buildInstanceCertificateInfo = (
	pem: string,
	document: InstanceIdentityDocument,
): InstanceCertificateInfo =>
	composeInstanceCertificateInfo(document, parseCertificateMetadata(pem));

/** Parses an instance certificate into its public metadata. */
export const parseInstanceCertificate = (
	pem: string,
): InstanceCertificateInfo => {
	const certificate = forge.pki.certificateFromPem(firstCertificatePem(pem));
	const document = parseIdentityDocument(certificate);
	return composeInstanceCertificateInfo(
		document,
		parseCertificateMetadata(pem),
	);
};

export interface ChainVerificationResult {
	valid: boolean;
	errors: string[];
	/** Full identity info when an identity document could be resolved. */
	info: InstanceCertificateInfo | null;
	/** Certificate metadata, available even without an identity document. */
	metadata: CertificateMetadata | null;
}

const isWithinValidity = (
	certificate: forge.pki.Certificate,
	now: Date,
): boolean =>
	certificate.validity.notBefore.getTime() <= now.getTime() &&
	certificate.validity.notAfter.getTime() >= now.getTime();

const namesMatch = (
	child: forge.pki.Certificate,
	parent: forge.pki.Certificate,
): boolean =>
	child.issuer.getField("CN")?.value === parent.subject.getField("CN")?.value;

/**
 * Verifies an instance certificate chains to `trustAnchorPem` and is currently
 * valid. The chain is walked leaf → intermediates → trust anchor, checking the
 * signature, the issuer/subject link and the validity window at every step.
 */ export const verifyCertificateChain = (options: {
	leafPem: string;
	trustAnchorPem: string;
	intermediatePems?: string[];
	now?: Date;
	/** Document to use when the certificate has no identity extension (installer). */
	identityDocumentFallback?: InstanceIdentityDocument | null;
}): ChainVerificationResult => {
	const errors: string[] = [];
	let info: InstanceCertificateInfo | null = null;
	let metadata: CertificateMetadata | null = null;

	let leaf: forge.pki.Certificate;
	let trustAnchor: forge.pki.Certificate;
	try {
		leaf = forge.pki.certificateFromPem(firstCertificatePem(options.leafPem));
		trustAnchor = forge.pki.certificateFromPem(
			firstCertificatePem(options.trustAnchorPem),
		);
		metadata = parseCertificateMetadata(options.leafPem);
	} catch (error) {
		return {
			valid: false,
			errors: [(error as Error).message],
			info: null,
			metadata: null,
		};
	}

	const document =
		tryParseIdentityDocument(leaf) ?? options.identityDocumentFallback ?? null;
	if (document) {
		info = composeInstanceCertificateInfo(document, metadata);
	}

	const now = options.now ?? new Date();
	const chain: forge.pki.Certificate[] = [
		leaf,
		...(options.intermediatePems ?? []).map((pem) =>
			forge.pki.certificateFromPem(firstCertificatePem(pem)),
		),
		trustAnchor,
	];

	for (let i = 0; i < chain.length - 1; i++) {
		const child = chain[i];
		const parent = chain[i + 1];
		if (!child || !parent) continue;
		if (!namesMatch(child, parent)) {
			errors.push(
				`Certificate "${child.subject.getField("CN")?.value ?? "unknown"}" is not issued by "${parent.subject.getField("CN")?.value ?? "unknown"}"`,
			);
			continue;
		}
		// node-forge verifies as parent.verify(child).
		try {
			if (!parent.verify(child)) {
				errors.push(
					`The signature of "${child.subject.getField("CN")?.value ?? "unknown"}" is invalid`,
				);
			}
		} catch (error) {
			errors.push((error as Error).message);
		}
	}

	// The last link is the trust anchor verifying itself.
	const anchor = chain[chain.length - 1];
	if (!anchor || !anchor.verify(anchor)) {
		errors.push("The trust anchor is not a valid self-signed certificate");
	}

	for (const certificate of chain) {
		if (!isWithinValidity(certificate, now)) {
			const name = certificate.subject.getField("CN")?.value ?? "unknown";
			errors.push(
				`Certificate "${name}" is outside its validity window (${certificate.validity.notBefore.toISOString().slice(0, 10)} → ${certificate.validity.notAfter.toISOString().slice(0, 10)})`,
			);
		}
	}

	return { valid: errors.length === 0, errors, info, metadata };
};

/** Whole days between now and a date; negative once it has passed. */
export const daysUntil = (date: Date, now = new Date()): number =>
	Math.floor((date.getTime() - now.getTime()) / 1000 / 60 / 60 / 24);

/** Lifecycle status derived from the certificate validity window. */
export const getIdentityStatus = (
	notAfter: Date,
	now = new Date(),
): InstanceIdentityStatus => {
	if (notAfter.getTime() < now.getTime()) return "expired";
	if (daysUntil(notAfter, now) <= INSTANCE_IDENTITY_EXPIRING_DAYS)
		return "expiring";
	return "active";
};

export const describeIdentityStatus = (
	status: InstanceIdentityStatus,
): string => INSTANCE_IDENTITY_STATUS_LABELS[status];
