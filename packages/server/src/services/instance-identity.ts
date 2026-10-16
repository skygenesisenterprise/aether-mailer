import fs from "node:fs";
import {
	allowUnlicensedDevInstance,
	IS_CLOUD,
	NOTPLOY_ENTITLEMENT_PUBLIC_KEY,
	NOTPLOY_ENTITLEMENT_PUBLIC_KEY_FILE,
	NOTPLOY_FLAVOR,
	NOTPLOY_PRODUCT,
	paths,
} from "../constants/index";
import {
	type CapabilityEvaluation,
	evaluateCapabilities,
	resolveProductHint,
} from "../utils/pki/capabilities";
import { verifyEntitlementForInstance } from "../utils/pki/entitlement";
import {
	generateLocalInstanceIdentity,
	isIdentityRevoked,
	loadInstanceIdentity,
	rotateLocalInstanceIdentity,
	writeEntitlementToken,
} from "../utils/pki/instance";
import {
	type EntitlementPayload,
	type IdentityDiagnostic,
	type InstanceIdentity,
	type NotployCapability,
	type NotployProduct,
	protectedProducts,
} from "../utils/pki/types";

/**
 * Runtime installation identity (issue #75 §1, §5, §6).
 *
 * Assembles the locally stored identity, the verified Notploy entitlement and
 * the centralized capability evaluation into one `Installation` object. Both the
 * runtime and the UI query capabilities through `installation.hasCapability`,
 * so product authorization has a single source of truth.
 */

export interface Installation {
	/** Effective product, derived from the identity and entitlement. */
	product: NotployProduct;
	/** Legacy flavour hint (NOTPLOY_FLAVOR / IS_CLOUD), never authoritative. */
	productHint: NotployProduct;
	/** Effective capabilities after evaluation. */
	capabilities: NotployCapability[];
	/** Product capabilities that were not authorized. */
	missingCapabilities: NotployCapability[];
	identity: InstanceIdentity | null;
	/** Verified entitlement, if one was present and valid. */
	entitlement: EntitlementPayload | null;
	diagnostics: IdentityDiagnostic[];
	identityDir: string;
	hasCapability: (capability: string) => boolean;
}

/** Resolves the entitlement public key from config, file or nothing. */
export const getEntitlementPublicKey = (): string => {
	if (NOTPLOY_ENTITLEMENT_PUBLIC_KEY_FILE) {
		try {
			return fs.readFileSync(NOTPLOY_ENTITLEMENT_PUBLIC_KEY_FILE, "utf8");
		} catch {
			return "";
		}
	}
	return NOTPLOY_ENTITLEMENT_PUBLIC_KEY;
};

export interface GetInstallationOptions {
	identityDir?: string;
	now?: Date;
	/** Overrides the configured entitlement public key (tests, tooling). */
	entitlementPublicKey?: string;
	/**
	 * Overrides the development-only bypass (tests, tooling). Defaults to
	 * `allowUnlicensedDevInstance()`, which is false in production.
	 */
	allowUnlicensed?: boolean;
}

const isProtected = (product: NotployProduct) =>
	protectedProducts.includes(product);

const defaultIdentityDir = () => paths().IDENTITY_PATH;

/**
 * Product this instance was launched as (`self`, `cloud` or `console`).
 *
 * Resolved from the launcher (`NOTPLOY_PRODUCT`, then `NOTPLOY_FLAVOR`, then
 * `IS_CLOUD`) and used for display decisions such as the UI surface and the
 * product name. It is deliberately distinct from `getInstallation().product`,
 * which is authoritative for *authorization* but can differ: the persisted
 * instance identity is reused while coherent, even when the instance is started
 * under another product.
 */
export const getConfiguredProduct = (): NotployProduct =>
	resolveProductHint({
		product: NOTPLOY_PRODUCT,
		flavor: NOTPLOY_FLAVOR,
		isCloud: IS_CLOUD,
	});

/**
 * True only for a managed Cloud deployment.
 *
 * `IS_CLOUD` is also true for the Console, but the Console is the operator
 * surface and deliberately keeps the self-hosted feature set (web-server
 * monitoring, docker disk usage, ...). Use this predicate instead of a bare
 * `IS_CLOUD` whenever a behaviour must stay Cloud-only.
 */
export const isManagedCloud = (): boolean =>
	IS_CLOUD && getConfiguredProduct() !== "console";

/**
 * Whether scheduling (backups, volume backups, cron jobs, docker cleanup) is
 * delegated to the external BullMQ-backed jobs service.
 *
 * Cloud and Console always have one. Self-hosted uses it when `JOBS_URL` is
 * set (the Docker Compose stack ships a `schedules` service); without it,
 * self-hosted keeps scheduling in-process via node-schedule.
 */
export const isExternalJobsEnabled = (): boolean =>
	IS_CLOUD || Boolean(process.env.JOBS_URL);

/**
 * Builds the installation view. Never throws: invalid identity or entitlement
 * material is reported as diagnostics so the caller can show a precise message.
 */
export const getInstallation = (
	options: GetInstallationOptions = {},
): Installation => {
	const identityDir = options.identityDir ?? defaultIdentityDir();
	const now = options.now ?? new Date();
	// Development-only: a protected product runs on the built-in capabilities
	// without a signed entitlement. Always false in production.
	const allowUnlicensed =
		options.allowUnlicensed ?? allowUnlicensedDevInstance();

	const loaded = loadInstanceIdentity(identityDir, { now });
	const diagnostics = [...loaded.diagnostics];

	const publicKey = options.entitlementPublicKey ?? getEntitlementPublicKey();
	let entitlement: EntitlementPayload | null = null;

	if (loaded.entitlementToken) {
		if (!publicKey.trim()) {
			diagnostics.push({
				code: "entitlement.invalid",
				severity: "error",
				message:
					"An entitlement token is present but no Notploy entitlement public key is configured",
				remediation:
					"Set NOTPLOY_ENTITLEMENT_PUBLIC_KEY or NOTPLOY_ENTITLEMENT_PUBLIC_KEY_FILE to Notploy's public key.",
			});
		} else {
			const verified = verifyEntitlementForInstance(
				loaded.entitlementToken,
				publicKey,
				{
					subjectKeyFingerprint: loaded.publicKeyFingerprint ?? "",
					now,
				},
			);
			if (verified.valid) {
				entitlement = verified.payload;
			} else {
				diagnostics.push({
					code: verified.reason.includes("expired")
						? "entitlement.expired"
						: "entitlement.invalid",
					severity: "error",
					message: verified.reason,
					remediation:
						"Request a new entitlement for this instance from Notploy and place it in entitlement.token.",
				});
			}
		}
	}

	const productHint = resolveProductHint({
		flavor: NOTPLOY_FLAVOR,
		isCloud: IS_CLOUD,
	});

	let identity = loaded.identity;
	if (identity) {
		// A local revocation list is authoritative for this instance.
		if (isIdentityRevoked(identityDir, identity.certificate.fingerprint)) {
			identity = { ...identity, status: "revoked" };
			diagnostics.push({
				code: "identity.revoked",
				severity: "error",
				message: `Instance certificate ${identity.certificate.fingerprint} is revoked`,
				remediation:
					"Rotate the instance identity to obtain a certificate that is not revoked.",
			});
		}
	}

	const product = identity?.product ?? entitlement?.product ?? productHint;

	if (
		identity &&
		entitlement &&
		identity.instanceId !== entitlement.instanceId
	) {
		diagnostics.push({
			code: "entitlement.mismatch",
			severity: "error",
			message:
				"The entitlement was issued for instance " +
				entitlement.instanceId +
				" but the identity is " +
				identity.instanceId,
			remediation:
				"Request an entitlement bound to this instance and replace entitlement.token.",
		});
	}

	const evaluation: CapabilityEvaluation = evaluateCapabilities({
		product,
		entitlement,
		// In development, protected products keep their declared capabilities so
		// the cloud code paths are exercisable without a signed entitlement.
		allowProductDefaults: allowUnlicensed ? true : undefined,
	});

	if (isProtected(product) && !entitlement) {
		diagnostics.push({
			code: "entitlement.missing",
			severity: allowUnlicensed ? "warning" : "error",
			message: `Product "${product}" requires a Notploy-signed entitlement`,
			remediation: allowUnlicensed
				? "Running unlicensed is allowed only in development (NOTPLOY_ALLOW_UNLICENSED_DEV). Enroll this instance with a signed entitlement before deploying."
				: "Enroll this instance with a signed entitlement; a local installer flag is not a security boundary.",
		});
	}

	if (entitlement && evaluation.missingCapabilities.length) {
		diagnostics.push({
			code: "entitlement.capabilities_partial",
			severity: "warning",
			message: `The entitlement does not grant: ${evaluation.missingCapabilities.join(", ")}`,
			remediation:
				"Request a broader entitlement if this instance needs those capabilities.",
		});
	}

	return {
		product,
		productHint,
		capabilities: evaluation.capabilities,
		missingCapabilities: evaluation.missingCapabilities,
		identity,
		entitlement,
		diagnostics,
		identityDir,
		hasCapability: (capability: string) => evaluation.has(capability),
	};
};

export interface InstallationValidation {
	/** False when any diagnostic is an error. */
	healthy: boolean;
	product: NotployProduct;
	diagnostics: IdentityDiagnostic[];
}

/**
 * Startup verification (issue #75 §6): identity exists, certificate and trust
 * chain are valid, the certificate has not expired, the product is valid and the
 * required capabilities are authorized. Returns diagnostics instead of failing
 * opaquely.
 */
export const validateInstallation = (
	options: GetInstallationOptions = {},
): InstallationValidation => {
	const installation = getInstallation(options);
	return {
		healthy: !installation.diagnostics.some(
			(diagnostic) => diagnostic.severity === "error",
		),
		product: installation.product,
		diagnostics: installation.diagnostics,
	};
};

export interface InitializeInstallationOptions {
	identityDir?: string;
	product?: NotployProduct;
	instanceId?: string;
	subjectAltNames?: string[];
	/** Notploy-signed entitlement required for cloud/console. */
	entitlementToken?: string;
	/** Overrides the configured entitlement public key (tests, tooling). */
	entitlementPublicKey?: string;
	now?: Date;
	force?: boolean;
}

/**
 * Bootstraps the installation identity from the installer.
 *
 * Self-hosted (`self`) generates a local trust anchor and works offline. Cloud
 * and Console fail closed without a signed entitlement: the installer flag alone
 * is not an authorization.
 */
export const initializeInstallationIdentity = (
	options: InitializeInstallationOptions = {},
): InstanceIdentity => {
	const identityDir = options.identityDir ?? defaultIdentityDir();
	const product =
		options.product ??
		resolveProductHint({ flavor: NOTPLOY_FLAVOR, isCloud: IS_CLOUD });

	if (isProtected(product) && !options.entitlementToken) {
		throw new Error(
			`Product "${product}" requires a signed entitlement; run the installer with a valid entitlement token.`,
		);
	}

	const generated = generateLocalInstanceIdentity({
		identityDir,
		product,
		instanceId: options.instanceId,
		subjectAltNames: options.subjectAltNames,
		now: options.now,
		force: options.force,
	});

	if (options.entitlementToken && isProtected(product)) {
		// Fail closed at install time too: persisting a token the runtime would
		// reject only defers the failure to startup.
		const verified = verifyEntitlementForInstance(
			options.entitlementToken,
			options.entitlementPublicKey ?? getEntitlementPublicKey(),
			{
				subjectKeyFingerprint:
					generated.identity.certificate.subjectKeyFingerprint,
				now: options.now,
			},
		);
		if (!verified.valid) {
			throw new Error(`The entitlement is invalid: ${verified.reason}`);
		}
	}

	if (options.entitlementToken) {
		writeEntitlementToken(identityDir, options.entitlementToken);
	}

	return generated.identity;
};

/** Rotates the instance certificate in place, preserving the instance id. */
export const rotateInstallationIdentity = (
	options: { identityDir?: string; now?: Date } = {},
): InstanceIdentity =>
	rotateLocalInstanceIdentity({
		identityDir: options.identityDir ?? defaultIdentityDir(),
		now: options.now,
	}).identity;
