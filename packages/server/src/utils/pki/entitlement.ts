import { createPublicKey, sign, verify } from "node:crypto";
import {
	type EntitlementPayload,
	type EntitlementVerification,
	INSTANCE_IDENTITY_EXTENSION_VERSION,
	isNotployCapability,
	isNotployProduct,
	type NotployCapability,
} from "./types";

/**
 * Signed entitlements.
 *
 * An entitlement answers "what is this instance authorized to use?" and is
 * deliberately *not* part of the certificate: identity and licensing must stay
 * separate. It is produced by Notploy's entitlement authority and verified
 * locally against Notploy's public key, so a `cloud`/`console` install cannot be
 * unlocked by an environment variable alone.
 *
 * Token format (compact, shell-verifiable with `openssl dgst -verify`):
 *
 *   notploy-entitlement-v1.<base64url(payload)>.<base64url(signature)>
 *
 * The signature is RSASSA-PKCS1-v1_5 over the SHA-256 digest of the exact
 * payload bytes, so any canonicalisation drift invalidates verification rather
 * than silently changing the granted capabilities.
 */

export const ENTITLEMENT_TOKEN_PREFIX = "notploy-entitlement-v1";

const utf8 = (value: string) => Buffer.from(value, "utf8");

/** Recursively sorts object keys so the signed bytes are deterministic. */
const stableStringify = (value: unknown): string => {
	if (Array.isArray(value)) {
		return `[${value.map((item) => stableStringify(item)).join(",")}]`;
	}
	if (value && typeof value === "object") {
		const entries = Object.entries(value as Record<string, unknown>)
			.filter(([, item]) => item !== undefined)
			.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
		return `{${entries
			.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
			.join(",")}}`;
	}
	return JSON.stringify(value);
};

const base64UrlEncode = (buffer: Buffer) =>
	buffer
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");

const base64UrlDecode = (value: string) => {
	const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
	const padding =
		normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
	return Buffer.from(normalized + padding, "base64");
};

/** Payload bytes that are actually signed / verified. */
export const entitlementSigningBytes = (payload: EntitlementPayload): Buffer =>
	utf8(stableStringify(payload));

/**
 * Validates the *shape* of an entitlement payload. Applied after signature
 * verification, so a valid signature over a malformed payload is still refused.
 */
export const parseEntitlementPayload = (
	value: unknown,
):
	| { valid: true; payload: EntitlementPayload }
	| { valid: false; reason: string } => {
	if (!value || typeof value !== "object") {
		return { valid: false, reason: "The entitlement payload is not an object" };
	}
	const raw = value as Record<string, unknown>;

	if (typeof raw.version !== "number" || raw.version < 1) {
		return { valid: false, reason: "The entitlement payload has no version" };
	}
	if (typeof raw.instanceId !== "string" || !raw.instanceId.trim()) {
		return {
			valid: false,
			reason: "The entitlement payload has no instance id",
		};
	}
	if (typeof raw.product !== "string" || !isNotployProduct(raw.product)) {
		return { valid: false, reason: `Unknown product: ${String(raw.product)}` };
	}
	if (!Array.isArray(raw.capabilities)) {
		return {
			valid: false,
			reason: "The entitlement payload has no capabilities",
		};
	}
	const capabilities = raw.capabilities.filter(
		(item): item is NotployCapability =>
			typeof item === "string" && isNotployCapability(item),
	);
	if (capabilities.length !== raw.capabilities.length) {
		return {
			valid: false,
			reason: "The entitlement payload contains unknown capabilities",
		};
	}
	if (
		typeof raw.subjectKeyFingerprint !== "string" ||
		!raw.subjectKeyFingerprint.trim()
	) {
		return {
			valid: false,
			reason: "The entitlement payload is not bound to an instance key",
		};
	}
	if (
		typeof raw.issuedAt !== "string" ||
		Number.isNaN(Date.parse(raw.issuedAt))
	) {
		return {
			valid: false,
			reason: "The entitlement payload has no issue date",
		};
	}
	if (raw.expiresAt !== null && typeof raw.expiresAt !== "string") {
		return {
			valid: false,
			reason: "The entitlement payload has an invalid expiry",
		};
	}
	if (
		typeof raw.expiresAt === "string" &&
		Number.isNaN(Date.parse(raw.expiresAt))
	) {
		return {
			valid: false,
			reason: "The entitlement payload has an invalid expiry",
		};
	}

	return {
		valid: true,
		payload: {
			version: INSTANCE_IDENTITY_EXTENSION_VERSION,
			instanceId: raw.instanceId,
			product: raw.product,
			capabilities,
			subjectKeyFingerprint: raw.subjectKeyFingerprint,
			issuedAt: raw.issuedAt,
			expiresAt: raw.expiresAt as string | null,
			issuer: typeof raw.issuer === "string" ? raw.issuer : "Notploy",
		},
	};
};

/**
 * Signs an entitlement payload with an RS256 private key. Used by Notploy's
 * entitlement authority and by tests/tooling; never called by a self-hosted
 * instance.
 */
export const signEntitlement = (
	payload: EntitlementPayload,
	privateKeyPem: string,
): string => {
	const signature = sign(
		"sha256",
		entitlementSigningBytes(payload),
		privateKeyPem,
	);
	return `${ENTITLEMENT_TOKEN_PREFIX}.${base64UrlEncode(entitlementSigningBytes(payload))}.${base64UrlEncode(signature)}`;
};

/**
 * Verifies an entitlement token against Notploy's public key. Never throws: the
 * reason is returned so the runtime can emit a precise diagnostic.
 */
export const verifyEntitlementToken = (
	token: string,
	publicKeyPem: string,
): EntitlementVerification => {
	const parts = token.trim().split(".");
	if (parts.length !== 3) {
		return { valid: false, reason: "The entitlement token is malformed" };
	}
	const [prefix, payloadPart, signaturePart] = parts as [
		string,
		string,
		string,
	];
	if (prefix !== ENTITLEMENT_TOKEN_PREFIX) {
		return {
			valid: false,
			reason: "The entitlement token has an unknown version",
		};
	}

	let payloadJson: string;
	let payload: unknown;
	let signature: Buffer;
	try {
		const payloadBytes = base64UrlDecode(payloadPart);
		payloadJson = payloadBytes.toString("utf8");
		payload = JSON.parse(payloadJson);
		signature = base64UrlDecode(signaturePart);
	} catch {
		return { valid: false, reason: "The entitlement token is not decodable" };
	}

	let publicKey: ReturnType<typeof createPublicKey>;
	try {
		publicKey = createPublicKey(publicKeyPem);
	} catch {
		return {
			valid: false,
			reason: "The Notploy entitlement public key is invalid",
		};
	}

	const signatureValid = verify(
		"sha256",
		utf8(payloadJson),
		publicKey,
		signature,
	);
	if (!signatureValid) {
		return { valid: false, reason: "The entitlement signature is invalid" };
	}

	return parseEntitlementPayload(payload);
};

/**
 * Verifies a token and its binding to an instance: signature, expiry and the
 * key fingerprint the entitlement was issued for.
 */
export const verifyEntitlementForInstance = (
	token: string,
	publicKeyPem: string,
	options: { subjectKeyFingerprint: string; now?: Date },
): EntitlementVerification => {
	const verified = verifyEntitlementToken(token, publicKeyPem);
	if (!verified.valid) return verified;

	const { payload } = verified;
	const now = (options.now ?? new Date()).getTime();
	if (payload.expiresAt && Date.parse(payload.expiresAt) < now) {
		return {
			valid: false,
			reason: `The entitlement expired on ${payload.expiresAt}`,
		};
	}
	if (
		payload.subjectKeyFingerprint.toLowerCase() !==
		options.subjectKeyFingerprint.toLowerCase()
	) {
		return {
			valid: false,
			reason: "The entitlement was issued for a different instance key",
		};
	}

	return { valid: true, payload };
};
