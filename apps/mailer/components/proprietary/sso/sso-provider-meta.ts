/**
 * Presentation metadata for Identity & Access providers.
 *
 * Kept local (like the DNS provider meta) so the Console does not import the
 * server identity module into the client bundle. The protocol of a stored
 * provider is derived from which configuration it carries.
 */

export type ProviderProtocol =
	| "oidc"
	| "saml"
	| "ldap"
	| "active-directory"
	| "oauth2"
	| "custom";

export const providerProtocolLabels: Record<ProviderProtocol, string> = {
	oidc: "OIDC",
	saml: "SAML 2.0",
	ldap: "LDAP",
	"active-directory": "Active Directory",
	oauth2: "OAuth 2.0",
	custom: "Custom",
};

export const providerCategoryLabels: Record<string, string> = {
	federated: "Federated identity",
	directory: "Directory services",
	social: "Social sign-in",
	custom: "Custom",
};

/**
 * Protocols the Console lets an operator pick, in presentation order. `custom`
 * is intentionally omitted: it is a derived state, never a chosen protocol.
 */
export const providerProtocolOrder: ProviderProtocol[] = [
	"oidc",
	"saml",
	"ldap",
	"active-directory",
	"oauth2",
];

export const providerCategoryOrder = [
	"federated",
	"directory",
	"social",
] as const;

export const providerProtocolCategory: Record<ProviderProtocol, string> = {
	oidc: "federated",
	saml: "federated",
	ldap: "directory",
	"active-directory": "directory",
	oauth2: "social",
	custom: "custom",
};

export const providerProtocolDescriptions: Record<ProviderProtocol, string> = {
	oidc: "Any OIDC-compliant provider, discovered from its issuer URL.",
	saml: "Federated sign-in through a SAML 2.0 identity provider.",
	ldap: "Directory-bound authentication against an LDAP server.",
	"active-directory":
		"Directory-bound authentication against Active Directory.",
	oauth2: "Sign-in with an account from a developer platform (GitHub).",
	custom: "Your own identity infrastructure through the generic adapter.",
};

/** Protocols with a working adapter. The rest are advertised but not wired yet. */
export const implementedProviderProtocols: ProviderProtocol[] = [
	"oidc",
	"saml",
	"ldap",
	"active-directory",
	"oauth2",
];

export const isProviderProtocolImplemented = (protocol: string) =>
	implementedProviderProtocols.includes(protocol as ProviderProtocol);

export const identityCapabilityLabels: Record<string, string> = {
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

export const identityCapabilityOrder = [
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

export const identityHealthLabels: Record<string, string> = {
	connected: "Connected",
	degraded: "Degraded",
	unreachable: "Unreachable",
	misconfigured: "Misconfigured",
	authenticationExpired: "Authentication expired",
};

export const protocolLabel = (protocol: string) =>
	providerProtocolLabels[protocol as ProviderProtocol] ?? protocol;

export const capabilityLabel = (capability: string) =>
	identityCapabilityLabels[capability] ?? capability;

/**
 * Which protocol a provider is configured with. A stored provider carries at
 * most one of `oidcConfig` / `samlConfig` / `ldapConfig`; anything else is a
 * custom provider. The directory flavor is read from `directoryType`.
 */
export const resolveProviderProtocol = (provider: {
	oidcConfig: string | null;
	samlConfig: string | null;
	ldapConfig?: string | null;
	oauthConfig?: string | null;
}): ProviderProtocol => {
	if (provider.oauthConfig) return "oauth2";
	if (provider.ldapConfig) {
		try {
			const parsed = JSON.parse(provider.ldapConfig) as {
				directoryType?: string;
			};
			return parsed.directoryType === "active-directory"
				? "active-directory"
				: "ldap";
		} catch {
			return "ldap";
		}
	}
	if (provider.samlConfig) return "saml";
	if (provider.oidcConfig) return "oidc";
	return "custom";
};
