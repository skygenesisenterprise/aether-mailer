/**
 * Identity & Access provider model.
 *
 * Notploy integrates with the identity infrastructure the user already runs
 * instead of forcing a specific vendor. Providers are addressed by protocol
 * (OIDC, SAML 2.0, LDAP, Active Directory) rather than by product, so a new
 * OIDC-compatible vendor needs no dedicated implementation.
 *
 * These types are shared by the server adapters and the Console so the
 * capability/health contract stays identical on both sides.
 */

/**
 * Provider types Notploy can describe.
 *
 * `ldap`, `active-directory`, `oauth2` and `custom` are part of the target
 * architecture (issue #46) and are already surfaced in the capability catalog;
 * incremental implementations plug into the same contract without a redesign.
 */
export const identityProviderTypes = [
	"oidc",
	"saml",
	"ldap",
	"active-directory",
	"oauth2",
	"custom",
] as const;

export type IdentityProviderType = (typeof identityProviderTypes)[number];

export const identityProviderLabels: Record<IdentityProviderType, string> = {
	oidc: "OpenID Connect",
	saml: "SAML 2.0",
	ldap: "LDAP",
	"active-directory": "Active Directory",
	oauth2: "OAuth 2.0",
	custom: "Custom provider",
};

export const identityProviderDescriptions: Record<
	IdentityProviderType,
	string
> = {
	oidc: "Any OIDC-compliant provider discovered from its issuer URL.",
	saml: "Federated sign-in through a SAML 2.0 identity provider.",
	ldap: "Directory-bound authentication against an LDAP server.",
	"active-directory":
		"Directory-bound authentication against Active Directory.",
	oauth2:
		"Sign-in with a social account that exposes plain OAuth 2.0 (GitHub).",
	custom: "Your own identity infrastructure through the generic adapter.",
};

export const identityProviderCategoryOrder = [
	"federated",
	"directory",
	"social",
	"custom",
] as const;

export type IdentityProviderCategory =
	(typeof identityProviderCategoryOrder)[number];

export const identityProviderCategory: Record<
	IdentityProviderType,
	IdentityProviderCategory
> = {
	oidc: "federated",
	saml: "federated",
	ldap: "directory",
	"active-directory": "directory",
	oauth2: "social",
	custom: "custom",
};

export const identityProviderCategoryLabels: Record<
	IdentityProviderCategory,
	string
> = {
	federated: "Federated identity",
	directory: "Directory services",
	social: "Social sign-in",
	custom: "Custom",
};

export const identityProviderCategoryDescriptions: Record<
	IdentityProviderCategory,
	string
> = {
	federated:
		"Standards-based federation (OIDC, SAML 2.0) usable by any compatible provider.",
	directory:
		"Directory-backed identity with search, bind and group synchronization.",
	social:
		"Sign-in with an account from a developer platform that speaks OAuth 2.0.",
	custom:
		"A generic adapter for identity infrastructure Notploy does not model yet.",
};

/** Capabilities a provider may expose. Mirrors the adapter responsibilities. */
export const identityCapabilities = [
	"singleSignOn",
	"singleLogout",
	"refreshTokens",
	"pkce",
	"userProvisioning",
	"groupSync",
	"roleMapping",
	"directorySearch",
	"jitProvisioning",
	"certificateRotation",
	"connectionDiagnostics",
] as const;

export type IdentityCapability = (typeof identityCapabilities)[number];

export type IdentityCapabilityMatrix = Record<IdentityCapability, boolean>;

export const identityCapabilityLabels: Record<IdentityCapability, string> = {
	singleSignOn: "Single sign-on",
	singleLogout: "Single logout",
	refreshTokens: "Refresh tokens",
	pkce: "PKCE",
	userProvisioning: "User provisioning",
	groupSync: "Group sync",
	roleMapping: "Role mapping",
	directorySearch: "Directory search",
	jitProvisioning: "JIT provisioning",
	certificateRotation: "Certificate rotation",
	connectionDiagnostics: "Connection diagnostics",
};

const allCapabilities = (value: boolean): IdentityCapabilityMatrix =>
	Object.fromEntries(
		identityCapabilities.map((capability) => [capability, value]),
	) as IdentityCapabilityMatrix;

/** Every capability disabled — the safe default for adapters not implemented yet. */
export const noIdentityCapabilities = allCapabilities(false);

/** Every capability enabled. */
export const fullIdentityCapabilities = allCapabilities(true);

/**
 * Whether a provider may still authenticate users when the identity provider is
 * temporarily unavailable. Self-hosted installs must not depend on a SaaS IdP.
 */
export const identityProviderFallbackAvailable = true;

export type IdentityProviderHealthStatus =
	| "connected"
	| "degraded"
	| "unreachable"
	| "misconfigured"
	| "authenticationExpired";

/** Identity information resolved from the provider, never including secrets. */
export interface IdentityProviderIdentity {
	/** Issuer / entity id reported by the provider. */
	issuer: string | null;
	/** OIDC endpoints discovered from the provider's metadata. */
	authorizationEndpoint?: string | null;
	tokenEndpoint?: string | null;
	userInfoEndpoint?: string | null;
	jwksUri?: string | null;
	/** SAML endpoint / entity id. */
	ssoUrl?: string | null;
	/** Scopes advertised as supported, when the provider reports them. */
	scopesSupported?: string[];
}

export interface IdentityProviderHealth {
	status: IdentityProviderHealthStatus;
	checkedAt: string;
	/** Round-trip time of the probe, when one could be measured. */
	latencyMs: number | null;
	/** Actionable explanation, safe to show to the user. */
	message: string | null;
	/** What the user has to do, when the status is not `connected`. */
	remediation: string | null;
	protocol: IdentityProviderType;
	capabilities: IdentityCapabilityMatrix;
	identity?: IdentityProviderIdentity | null;
}

/**
 * Classifies a failed health probe.
 *
 * Kept pure (and exported) so the mapping is unit-testable: providers fail with
 * wildly different messages, and the user-facing status has to stay stable.
 */
export const classifyIdentityProviderFailure = (
	message: string,
): IdentityProviderHealthStatus => {
	if (
		/token expired|expired|invalid_grant|invalid client|invalid_client|refresh token/i.test(
			message,
		)
	) {
		return "authenticationExpired";
	}

	if (
		/unauthor|forbidden|401|403|bad credentials|invalid client|invalid_client|invalid api key|client secret/i.test(
			message,
		)
	) {
		return "misconfigured";
	}

	if (
		/timed? ?out|timeout|econnrefused|enotfound|network|fetch failed/i.test(
			message,
		)
	) {
		return "unreachable";
	}

	return "degraded";
};

export const IDENTITY_REQUEST_TIMEOUT_MS = 10_000;

/** `fetch` with a bounded timeout so a slow IdP cannot hang the health probe. */
export const identityFetch = async (url: string, init: RequestInit = {}) =>
	await fetch(url, {
		...init,
		signal: AbortSignal.timeout(IDENTITY_REQUEST_TIMEOUT_MS),
	});
