import { createHash } from "node:crypto";
import forge from "node-forge";

export interface CertificateSubjectAltNames {
	dnsNames: string[];
	ipAddresses: string[];
}

export interface ParsedCertificate {
	subject: string;
	commonName: string | null;
	issuer: string;
	serialNumber: string;
	notBefore: Date;
	notAfter: Date;
	publicKeyFingerprint: string;
	san: CertificateSubjectAltNames;
	/** Every hostname the certificate can be served for, CN included. */
	hostnames: string[];
}

export interface CertificateValidationOptions {
	/** Hostnames the certificate must cover, e.g. the domains using it. */
	requiredHostnames?: string[];
	/** Refuse certificates that are expired or not valid yet. Default true. */
	requireValidPeriod?: boolean;
	/** Days of remaining validity below which the certificate is reported as expiring. Default 30. */
	expiringWithinDays?: number;
}

export interface CertificateValidationResult {
	valid: boolean;
	certificate: ParsedCertificate | null;
	errors: string[];
	warnings: string[];
	expired: boolean;
	expiringSoon: boolean;
	/** Hostnames from `requiredHostnames` not covered by the certificate SANs. */
	missingHostnames: string[];
}

const PEM_CERTIFICATE = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;

/** node-forge types SAN entries loosely, so the shape Notploy relies on is declared here. */
type AltNameEntry = forge.pki.CertificateField & { type?: number };

const firstCertificatePem = (pem: string): string => {
	const block = pem.match(PEM_CERTIFICATE);
	if (!block) {
		throw new Error("No PEM certificate found");
	}
	return block[0];
};
const PEM_PRIVATE_KEY =
	/-----BEGIN (?:RSA |EC |ENCRYPTED )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |ENCRYPTED )?PRIVATE KEY-----/;

const normalizeHostname = (hostname: string) =>
	hostname.trim().toLowerCase().replace(/\.$/, "");

const toIpv4 = (bytes: string) => {
	const parts = bytes
		.split(".")
		.map((part) => parseInt(part, 16).toString(10))
		.filter((part) => !Number.isNaN(part));
	return parts.length === 4 ? parts.join(".") : null;
};

const toIpv6 = (bytes: string) => {
	if (bytes.length !== 32) return null;
	const groups: string[] = [];
	for (let i = 0; i < 32; i += 4) {
		const word = bytes.slice(i, i + 4).split("").reverse().join("");
		groups.push(parseInt(word, 16).toString(16));
	}
	// Compress the longest run of zero groups, per RFC 5952.
	let bestStart = -1;
	let bestLength = 0;
	let currentStart = -1;
	let currentLength = 0;
	for (let i = 0; i < groups.length; i++) {
		if (groups[i] === "0") {
			if (currentStart === -1) currentStart = i;
			currentLength++;
			if (currentLength > bestLength) {
				bestLength = currentLength;
				bestStart = currentStart;
			}
		} else {
			currentStart = -1;
			currentLength = 0;
		}
	}
	if (bestLength < 2) return groups.join(":");
	const head = groups.slice(0, bestStart).join(":");
	const tail = groups.slice(bestStart + bestLength).join(":");
	return `${head}::${tail}`;
};

/** forge stores IP SANs as raw bytes; recover the textual form. */
const formatIpAddress = (value: forge.pki.CertificateField) => {
	const bytes = value.value as unknown as string;
	if (typeof bytes !== "string" || !bytes.length) return null;
	if (bytes.includes(".")) return toIpv4(bytes);
	if (bytes.length === 32) return toIpv6(bytes);
	return null;
};

const getCommonName = (attrs: forge.pki.CertificateField[]) => {
	for (const attr of attrs) {
		if (attr.name === "commonName" && typeof attr.value === "string") {
			return attr.value;
		}
	}
	return null;
};

/**
 * CN fallback for certificates issued before SANs were mandatory (and for the
 * rare single-host certs that omit them). A CN is only honoured when it looks
 * like a hostname, never when it is an email address.
 */
const commonNameAsHostname = (commonName: string | null) => {
	if (!commonName) return null;
	const value = normalizeHostname(commonName);
	if (value.includes("@") || !value.includes(".")) return null;
	return value;
};

/**
 * Wildcard matching per RFC 6125: a single leading `*` label matches exactly one
 * label, so `*.example.com` covers `a.example.com` but not `a.b.example.com`.
 */
export const hostnameMatchesCertificate = (
	hostname: string,
	pattern: string,
): boolean => {
	const host = normalizeHostname(hostname);
	const candidate = normalizeHostname(pattern);
	if (host === candidate) return true;
	if (!candidate.startsWith("*.")) return false;
	const suffix = candidate.slice(2);
	if (!host.endsWith(`.${suffix}`)) return false;
	const prefix = host.slice(0, host.length - suffix.length - 1);
	return prefix.length > 0 && !prefix.includes(".");
};

const rsaParams = (key: unknown) => {
	const candidate = key as { n?: forge.jsbn.BigInteger; e?: forge.jsbn.BigInteger };
	if (!candidate?.n || !candidate?.e) return null;
	return {
		n: candidate.n.toString(16),
		e: candidate.e.toString(16),
	};
};

const fingerprint = (key: unknown) => {
	const params = rsaParams(key);
	const source = params ? `${params.e}:${params.n}` : "";
	return createHash("sha256").update(source).digest("hex").slice(0, 16);
};

/**
 * Parses a PEM certificate into the metadata Notploy exposes. Throws when the
 * input is not a parsable certificate.
 */
export const parseCertificate = (pem: string): ParsedCertificate => {
	const certificate = forge.pki.certificateFromPem(firstCertificatePem(pem));
	// node-forge types the extension as an opaque object, so the SAN entries are
	// narrowed here instead of trusting the declaration.
	const sanExtension = certificate.getExtension(
		"subjectAltName",
	) as { altNames?: AltNameEntry[] } | undefined;

	const dnsNames: string[] = [];
	const ipAddresses: string[] = [];

	for (const altName of sanExtension?.altNames ?? []) {
		if (altName.type === 2 && typeof altName.value === "string") {
			dnsNames.push(normalizeHostname(altName.value));
		} else if (altName.type === 7) {
			const ip = formatIpAddress(altName);
			if (ip) ipAddresses.push(ip);
		}
	}

	const commonName = getCommonName(certificate.subject.attributes ?? []);
	const cnHostname = commonNameAsHostname(commonName);
	const hostnames = Array.from(
		new Set([...dnsNames, ...(cnHostname ? [cnHostname] : [])]),
	);

	return {
		subject: certificate.subject.getField("CN")?.value ?? "",
		commonName,
		issuer: certificate.issuer.getField("CN")?.value ?? "",
		serialNumber: certificate.serialNumber,
		notBefore: certificate.validity.notBefore,
		notAfter: certificate.validity.notAfter,
		publicKeyFingerprint: fingerprint(certificate.publicKey),
		san: { dnsNames, ipAddresses },
		hostnames,
	};
};

/**
 * Parses a private key and derives its public key so it can be compared with the
 * certificate. Accepts PKCS#1, PKCS#8 and SEC1 keys.
 */
export const parsePrivateKey = (
	pem: string,
	passphrase?: string,
): forge.pki.rsa.PrivateKey | forge.pki.PrivateKey => {
	if (!PEM_PRIVATE_KEY.test(pem)) {
		throw new Error("No PEM private key found");
	}
	try {
		return forge.pki.privateKeyFromPem(pem);
	} catch (error) {
		throw new Error(
			`Could not parse the private key: ${
				(error as Error).message || "the key is encrypted or in an unsupported format"
			}`,
		);
	}
};

/**
 * True when the certificate's public key belongs to the private key. Compared on
 * the RSA modulus and exponent because those are the stable, algorithm
 * independent parts of the key pair.
 */
export const privateKeyMatchesCertificate = (
	certificatePem: string,
	privateKeyPem: string,
): boolean => {
	// Parsing also validates that the material is a real certificate before the
	// key comparison runs.
	parseCertificate(certificatePem);
	const certificate = forge.pki.certificateFromPem(
		firstCertificatePem(certificatePem),
	);
	const privateKey = parsePrivateKey(privateKeyPem) as forge.pki.rsa.PrivateKey;

	const certificateParams = rsaParams(certificate.publicKey);
	const privateParams = rsaParams(privateKey);
	if (!certificateParams || !privateParams) return false;

	return (
		certificateParams.n === privateParams.n &&
		certificateParams.e === privateParams.e
	);
};

/**
 * Validates an imported certificate chain and key. Never throws: every problem
 * is reported so the UI can explain exactly why an upload was rejected.
 */
export const validateCertificate = (
	certificateData: string,
	privateKey: string,
	options: CertificateValidationOptions = {},
): CertificateValidationResult => {
	const errors: string[] = [];
	const warnings: string[] = [];
	const {
		requiredHostnames = [],
		requireValidPeriod = true,
		expiringWithinDays = 30,
	} = options;

	let certificate: ParsedCertificate | null = null;

	try {
		certificate = parseCertificate(certificateData);
	} catch (error) {
		return {
			valid: false,
			certificate: null,
			errors: [(error as Error).message],
			warnings,
			expired: false,
			expiringSoon: false,
			missingHostnames: requiredHostnames,
		};
	}

	if (!privateKey.trim()) {
		errors.push("A private key is required");
	} else {
		try {
			if (!privateKeyMatchesCertificate(certificateData, privateKey)) {
				errors.push("The private key does not match the certificate");
			}
		} catch (error) {
			errors.push((error as Error).message);
		}
	}

	const now = Date.now();
	const expired = certificate.notAfter.getTime() < now;
	const notYetValid = certificate.notBefore.getTime() > now;
	const daysRemaining = Math.floor(
		(certificate.notAfter.getTime() - now) / 1000 / 60 / 60 / 24,
	);
	const expiringSoon = !expired && daysRemaining <= expiringWithinDays;

	if (requireValidPeriod) {
		if (expired) {
			errors.push(
				`The certificate expired on ${certificate.notAfter.toISOString().slice(0, 10)}`,
			);
		}
		if (notYetValid) {
			errors.push(
				`The certificate is not valid before ${certificate.notBefore
					.toISOString()
					.slice(0, 10)}`,
			);
		}
	}

	if (expiringSoon) {
		warnings.push(
			`The certificate expires in ${daysRemaining} day(s) (${certificate.notAfter
				.toISOString()
				.slice(0, 10)})`,
		);
	}

	// Validate appended intermediates so a broken bundle is caught on import
	// rather than at handshake time.
	const chainBlocks = certificateData.match(PEM_CERTIFICATE)?.slice(1) ?? [];
	for (const chainBlock of chainBlocks) {
		try {
			parseCertificate(chainBlock);
		} catch {
			errors.push("The certificate chain contains an unparsable certificate");
			break;
		}
	}

	if (!certificate.hostnames.length) {
		warnings.push(
			"The certificate has no subject alternative name, so it can only be matched by common name",
		);
	}

	const missingHostnames = requiredHostnames.filter(
		(hostname) =>
			!certificate?.hostnames.some((pattern) =>
				hostnameMatchesCertificate(hostname, pattern),
			),
	);

	if (missingHostnames.length) {
		errors.push(`The certificate does not cover: ${missingHostnames.join(", ")}`);
	}

	return {
		valid: errors.length === 0,
		certificate,
		errors,
		warnings,
		expired,
		expiringSoon,
		missingHostnames,
	};
};

/**
 * Whether a certificate can serve a hostname. IP addresses are matched against
 * the IP SANs, hostnames against the DNS SANs and the common name.
 */
export const certificateCoversHostname = (
	certificate: ParsedCertificate,
	hostname: string,
): boolean => {
	const host = normalizeHostname(hostname);
	if (certificate.san.ipAddresses.includes(host)) return true;
	return certificate.hostnames.some((pattern) =>
		hostnameMatchesCertificate(host, pattern),
	);
};

export interface CertificateChainEntry {
	index: number;
	isLeaf: boolean;
	commonName: string | null;
	issuer: string;
	notAfter: string | null;
	daysUntilExpiration: number | null;
	unparsable: boolean;
}

/**
 * Describes every certificate of a bundled chain, leaf first. Intermediates are
 * reported individually because a chain that expires before its leaf breaks
 * clients long after the leaf itself looks healthy.
 */
export const getCertificateChainDetails = (
	pem: string,
	now = new Date(),
): CertificateChainEntry[] =>
	(pem.match(PEM_CERTIFICATE) ?? []).map((block, index) => {
		try {
			const parsed = parseCertificate(block);
			return {
				index,
				isLeaf: index === 0,
				commonName: parsed.commonName,
				issuer: parsed.issuer,
				notAfter: parsed.notAfter.toISOString(),
				daysUntilExpiration: Math.floor(
					(parsed.notAfter.getTime() - now.getTime()) / 1000 / 60 / 60 / 24,
				),
				unparsable: false,
			};
		} catch {
			return {
				index,
				isLeaf: index === 0,
				commonName: null,
				issuer: "",
				notAfter: null,
				daysUntilExpiration: null,
				unparsable: true,
			};
		}
	});
