import {
	type EntitlementPayload,
	isNotployCapability,
	type NotployCapability,
	type NotployProduct,
	productCapabilities,
	protectedProducts,
} from "./types";

/**
 * Central capability evaluation (issue #75 §5).
 *
 * Product authorization must not be scattered across `IS_CLOUD`, proprietary
 * checks and ad-hoc flags. Every decision funnels through `evaluateCapabilities`
 * and `hasCapability`, so there is a single source of truth that both the
 * runtime and the UI can query:
 *
 *   installation.hasCapability("cloud.fleet")
 *
 * Legacy `NOTPLOY_FLAVOR` / `IS_CLOUD` values are only ever *hints*: a protected
 * product's capabilities come from a signed entitlement, never from the
 * environment.
 */

export const capabilityLabels: Record<NotployCapability, string> = {
	"self.hosted": "Self-hosted",
	"self.local-registry": "Local registry",
	"self.offline": "Offline operation",
	"cloud.control-plane": "Cloud control plane",
	"cloud.managed-services": "Managed services",
	"cloud.fleet": "Fleet management",
	"console.instance-management": "Instance management",
	"console.fleet": "Fleet management",
	"console.remote-management": "Remote management",
};

export const capabilityDescriptions: Record<NotployCapability, string> = {
	"self.hosted": "Run the full Notploy control plane on your own host.",
	"self.local-registry":
		"Host and serve container images from a registry on the instance.",
	"self.offline":
		"Operate without any permanent connectivity to Notploy services.",
	"cloud.control-plane": "Run the managed Notploy Cloud control plane.",
	"cloud.managed-services":
		"Offer Notploy-operated managed services to tenants.",
	"cloud.fleet": "Manage a fleet of Notploy instances from the cloud.",
	"console.instance-management": "Manage individual Notploy instances.",
	"console.fleet": "Manage groups of instances from the Console.",
	"console.remote-management":
		"Perform privileged remote operations on managed instances.",
};

export interface CapabilityEvaluation {
	product: NotployProduct;
	/** Effective capabilities the instance may use. */
	capabilities: NotployCapability[];
	/** Capabilities of the product that were not granted. */
	missingCapabilities: NotployCapability[];
	/** Whether the product requires a signed entitlement to be usable. */
	requiresEntitlement: boolean;
	/** True when a protected product is missing its entitlement. */
	entitlementRequired: boolean;
	/** True when the double check exposes a capability not declared for the product. */
	has: (capability: string) => boolean;
}

/**
 * Evaluates the capabilities of an instance from its product and an optional
 * verified entitlement. Unknown capabilities are dropped; capabilities not
 * declared for the product are refused even when an entitlement claims them.
 */
export const evaluateCapabilities = (options: {
	product: NotployProduct;
	entitlement?: EntitlementPayload | null;
	/** Self-hosted keeps its built-in capabilities even without an entitlement. */
	allowProductDefaults?: boolean;
}): CapabilityEvaluation => {
	const requiresEntitlement = protectedProducts.includes(options.product);
	const allowDefaults = options.allowProductDefaults ?? !requiresEntitlement;

	const declared = productCapabilities[options.product];
	const grantedByEntitlement = options.entitlement?.capabilities ?? [];
	const granted = allowDefaults
		? new Set<NotployCapability>([...declared, ...grantedByEntitlement])
		: new Set<NotployCapability>(grantedByEntitlement);

	// Never hand out a capability that is not part of the product's declared set.
	const capabilities = declared.filter((capability) => granted.has(capability));
	const missingCapabilities = declared.filter(
		(capability) => !capabilities.includes(capability),
	);

	return {
		product: options.product,
		capabilities,
		missingCapabilities,
		requiresEntitlement,
		entitlementRequired:
			requiresEntitlement && capabilities.length < declared.length,
		has: (capability: string) => hasCapability(capabilities, capability),
	};
};

/**
 * Whether a set of capabilities includes one. Accepts the dot-namespaced ids;
 * an unknown id is always false so a typo cannot grant access by accident.
 */
export const hasCapability = (
	capabilities: readonly NotployCapability[],
	capability: string,
): boolean =>
	isNotployCapability(capability) && capabilities.includes(capability);

/**
 * Maps legacy flavour signals to a product. This is a *hint* only and must never
 * be the sole basis for unlocking a protected product; the entitlement's product
 * is authoritative.
 */
export const resolveProductHint = (options: {
	/** Explicit product override (NOTPLOY_PRODUCT); wins over every hint. */
	product?: string | null;
	flavor?: string | null;
	isCloud?: boolean;
}): NotployProduct => {
	const explicit = (options.product ?? "").toLowerCase();
	if (explicit === "cloud") return "cloud";
	if (explicit === "console") return "console";
	if (explicit === "self") return "self";

	const flavor = (options.flavor ?? "").toLowerCase();
	if (flavor === "cloud") return "cloud";
	if (flavor === "console") return "console";
	if (options.isCloud) return "cloud";
	return "self";
};
