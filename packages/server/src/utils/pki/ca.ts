import { createHash, generateKeyPairSync, randomBytes } from "node:crypto";
import forge from "node-forge";
import {
	INSTANCE_IDENTITY_EXTENSION_VERSION,
	type InstanceIdentityDocument,
	NOTPLOY_IDENTITY_EXTENSION_OID,
	type NotployCapability,
	type NotployProduct,
} from "./types";

/**
 * Native PKI / certificate authority (issue #75 §2).
 *
 * Notploy's trust model has two layers:
 *  - an offline **root** trust anchor, and
 *  - **issuing** CAs that sign instance certificates.
 *
 * Self-hosted instances bootstrap a *local* root and issuing CA so they can
 * validate their own trust chain without any online dependency. Cloud/Console
 * chain to a Notploy-issued CA. Either way, CA private keys never leave the
 * machine that generated them and are never returned by a public API.
 *
 * Only X.509 primitives are used here so instance certificates stay
 * interoperable and usable for mTLS.
 */

export interface InstanceKeyPair {
	privateKey: forge.pki.rsa.PrivateKey;
	publicKey: forge.pki.rsa.PublicKey;
	privateKeyPem: string;
	publicKeyPem: string;
}

export interface CertificateAuthority {
	/** Human-readable CA name, shown in diagnostics. */
	commonName: string;
	privateKey: forge.pki.rsa.PrivateKey;
	certificate: forge.pki.Certificate;
	certificatePem: string;
	privateKeyPem: string;
	/** SHA-256 fingerprint of the CA certificate, colon-separated hex. */
	fingerprint: string;
}

export interface IssuedCertificate {
	certificate: forge.pki.Certificate;
	certificatePem: string;
	fingerprint: string;
}

export const DEFAULT_KEY_SIZE = 2048;
export const DEFAULT_CA_VALIDITY_DAYS = 3650;
export const DEFAULT_INSTANCE_VALIDITY_DAYS = 825;

const ASN1 = forge.asn1;

/**
 * node-forge types extensions loosely (`any[]`), so the shape Notploy relies on
 * is declared here rather than trusted from the declaration.
 */
interface CertificateExtension {
	name?: string;
	id?: string;
	critical?: boolean;
	value?: string;
	cA?: boolean;
	pathLenConstraint?: number;
	keyCertSign?: boolean;
	cRLSign?: boolean;
	digitalSignature?: boolean;
	keyEncipherment?: boolean;
	clientAuth?: boolean;
	serverAuth?: boolean;
	altNames?: Array<{ type: number; value?: string; ip?: string }>;
}

/** Random positive serial number as a hex string, as X.509 requires. */
const randomSerialNumber = () => {
	const bytes = randomBytes(16);
	// Clear the top bit so the INTEGER stays positive.
	bytes[0] = (bytes[0] ?? 0) & 0x7f;
	return bytes.toString("hex");
};

/**
 * SHA-256 fingerprint of a certificate, colon-separated uppercase hex — the
 * canonical form operators compare against out-of-band sources.
 */
export const certificateFingerprint = (
	certificate: forge.pki.Certificate,
): string => {
	const der = ASN1.toDer(forge.pki.certificateToAsn1(certificate)).getBytes();
	const digest = createHash("sha256").update(der, "binary").digest("hex");
	return digest.toUpperCase().match(/.{2}/g)?.join(":") ?? digest.toUpperCase();
};

/**
 * Generates an RSA key pair. Uses Node's crypto for speed and converts to
 * node-forge, which is what the X.509 builder consumes.
 */
export const generateInstanceKeyPair = (
	keySize = DEFAULT_KEY_SIZE,
): InstanceKeyPair => {
	const { privateKey: privateKeyPem } = generateKeyPairSync("rsa", {
		modulusLength: keySize,
		publicKeyEncoding: { type: "spki", format: "pem" },
		privateKeyEncoding: { type: "pkcs8", format: "pem" },
	});

	const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
	const publicKey = forge.pki.setRsaPublicKey(privateKey.n, privateKey.e);

	return {
		privateKey,
		publicKey,
		privateKeyPem: forge.pki.privateKeyToPem(privateKey),
		publicKeyPem: forge.pki.publicKeyToPem(publicKey),
	};
};

/** SHA-256 fingerprint (hex, no separators) of a public key, used for binding. */
export const publicKeyFingerprint = (
	publicKey: forge.pki.PublicKey,
): string => {
	const der = ASN1.toDer(forge.pki.publicKeyToAsn1(publicKey)).getBytes();
	return createHash("sha256").update(der, "binary").digest("hex");
};

const caExtensions = (pathLength: number) => [
	{
		name: "basicConstraints",
		cA: true,
		pathLenConstraint: pathLength,
		critical: true,
	},
	{
		name: "keyUsage",
		keyCertSign: true,
		cRLSign: true,
		digitalSignature: true,
		critical: true,
	},
	{ name: "subjectKeyIdentifier" },
];

const instanceExtensions = (
	identity: InstanceIdentityDocument,
	subjectAltNames: string[],
	includeIdentityExtension: boolean,
) => {
	const extensions: CertificateExtension[] = [
		{ name: "basicConstraints", cA: false, critical: true },
		{
			name: "keyUsage",
			digitalSignature: true,
			keyEncipherment: true,
			critical: true,
		},
		{
			name: "extKeyUsage",
			clientAuth: true,
			serverAuth: true,
		},
		{ name: "subjectKeyIdentifier" },
		{ name: "authorityKeyIdentifier" },
	];

	if (subjectAltNames.length) {
		extensions.push({
			name: "subjectAltName",
			altNames: subjectAltNames.map((value) => {
				// IP addresses must be encoded as iPAddress SANs to be valid.
				return /^\d{1,3}(\.\d{1,3}){3}$/.test(value)
					? { type: 7, ip: value }
					: { type: 2, value };
			}),
		});
	}

	// Self-asserted identity metadata. Signed by the issuer like any other
	// extension; it answers "who", never "what am I allowed to do".
	// Certificates built by the shell installer omit it and rely on identity.json.
	if (includeIdentityExtension) {
		extensions.push({
			id: NOTPLOY_IDENTITY_EXTENSION_OID,
			critical: false,
			value: JSON.stringify(identity),
		});
	}

	return extensions;
};

const buildCertificate = (params: {
	subject: forge.pki.CertificateField[];
	publicKey: forge.pki.PublicKey;
	issuerCertificate: forge.pki.Certificate | null;
	signingKey: forge.pki.rsa.PrivateKey;
	issuerName: forge.pki.CertificateField[] | null;
	validityDays: number;
	extensions: CertificateExtension[];
	now?: Date;
	serialNumber?: string;
}): forge.pki.Certificate => {
	const certificate = forge.pki.createCertificate();
	certificate.publicKey = params.publicKey;
	certificate.serialNumber = params.serialNumber ?? randomSerialNumber();

	const now = params.now ?? new Date();
	certificate.validity.notBefore = new Date(now.getTime() - 5 * 60 * 1000);
	certificate.validity.notAfter = new Date(
		now.getTime() + params.validityDays * 24 * 60 * 60 * 1000,
	);

	certificate.setSubject(params.subject);
	certificate.setIssuer(params.issuerName ?? params.subject);
	certificate.setExtensions(params.extensions);

	if (params.issuerCertificate) {
		// Attach the issuer cert so node-forge can embed the authority key id.
		certificate.setIssuer(params.issuerName ?? params.subject);
	}

	certificate.sign(params.signingKey, forge.md.sha256.create());
	return certificate;
};

/**
 * Creates a self-signed root certificate authority. For self-hosted this is the
 * instance's own offline trust anchor; for Notploy it is the published root
 * whose private key is kept offline.
 */
export const createRootCertificateAuthority = (
	options: {
		commonName?: string;
		organization?: string;
		keySize?: number;
		validityDays?: number;
		now?: Date;
	} = {},
): CertificateAuthority => {
	const commonName = options.commonName ?? "Notploy Local Root CA";
	const organization = options.organization ?? "Notploy";
	const { privateKey, publicKey, privateKeyPem } = generateInstanceKeyPair(
		options.keySize,
	);

	const subject = [
		{ name: "commonName", value: commonName },
		{ name: "organizationName", value: organization },
	];

	const certificate = buildCertificate({
		subject,
		publicKey,
		issuerCertificate: null,
		signingKey: privateKey,
		issuerName: null,
		validityDays: options.validityDays ?? DEFAULT_CA_VALIDITY_DAYS,
		// A root keeps a generous path length so it can delegate to issuing CAs.
		extensions: caExtensions(1),
		now: options.now,
	});

	return {
		commonName,
		privateKey,
		certificate,
		certificatePem: forge.pki.certificateToPem(certificate),
		privateKeyPem,
		fingerprint: certificateFingerprint(certificate),
	};
};

/**
 * Creates an issuing CA signed by a parent CA. The issuing key is the one that
 * signs instance certificates, so it can be rotated without touching the root.
 */
export const createIssuingCertificateAuthority = (options: {
	parent: CertificateAuthority;
	commonName?: string;
	organization?: string;
	keySize?: number;
	validityDays?: number;
	now?: Date;
}): CertificateAuthority => {
	const commonName = options.commonName ?? "Notploy Instance Issuing CA";
	const organization = options.organization ?? "Notploy";
	const { privateKey, publicKey, privateKeyPem } = generateInstanceKeyPair(
		options.keySize,
	);

	const certificate = buildCertificate({
		subject: [
			{ name: "commonName", value: commonName },
			{ name: "organizationName", value: organization },
		],
		issuerName: options.parent.certificate.subject.attributes,
		publicKey,
		issuerCertificate: options.parent.certificate,
		signingKey: options.parent.privateKey,
		validityDays: options.validityDays ?? DEFAULT_CA_VALIDITY_DAYS,
		// pathLen 0: an issuing CA must not create another CA below it.
		extensions: caExtensions(0),
		now: options.now,
	});

	return {
		commonName,
		privateKey,
		certificate,
		certificatePem: forge.pki.certificateToPem(certificate),
		privateKeyPem,
		fingerprint: certificateFingerprint(certificate),
	};
};

/**
 * Issues an instance identity certificate signed by the given issuing CA. The
 * certificate carries the identity document in a private extension and is
 * usable for mTLS.
 */
export const issueInstanceCertificate = (options: {
	issuer: CertificateAuthority;
	publicKey: forge.pki.PublicKey;
	instanceId: string;
	product: NotployProduct;
	capabilities: NotployCapability[];
	subjectKeyFingerprint: string;
	createdAt?: Date;
	validityDays?: number;
	subjectAltNames?: string[];
	now?: Date;
	serialNumber?: string;
	/** Embed the identity document in the certificate. Default true. */
	includeIdentityExtension?: boolean;
}): IssuedCertificate => {
	const createdAt = options.createdAt ?? options.now ?? new Date();
	const identity: InstanceIdentityDocument = {
		version: INSTANCE_IDENTITY_EXTENSION_VERSION,
		instanceId: options.instanceId,
		product: options.product,
		capabilities: options.capabilities,
		subjectKeyFingerprint: options.subjectKeyFingerprint,
		createdAt: createdAt.toISOString(),
	};

	const certificate = buildCertificate({
		subject: [
			{ name: "commonName", value: `notploy-instance-${options.instanceId}` },
			{ name: "organizationName", value: "Notploy" },
			{ name: "organizationalUnitName", value: options.product },
		],
		issuerName: options.issuer.certificate.subject.attributes,
		publicKey: options.publicKey,
		issuerCertificate: options.issuer.certificate,
		signingKey: options.issuer.privateKey,
		validityDays: options.validityDays ?? DEFAULT_INSTANCE_VALIDITY_DAYS,
		extensions: instanceExtensions(
			identity,
			options.subjectAltNames ?? [],
			options.includeIdentityExtension ?? true,
		),
		now: options.now,
		serialNumber: options.serialNumber,
	});

	return {
		certificate,
		certificatePem: forge.pki.certificateToPem(certificate),
		fingerprint: certificateFingerprint(certificate),
	};
};
