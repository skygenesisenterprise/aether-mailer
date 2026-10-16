/**
 * Vendor presets for Identity & Access providers.
 *
 * Notploy still configures providers by protocol (OIDC, SAML 2.0, LDAP, Active
 * Directory) — the preset only pre-fills the issuer, scopes and claim mapping a
 * given vendor is known to use. Anything not listed here stays reachable through
 * the generic entry of its protocol, so the catalog never becomes a whitelist.
 *
 * Kept local (like `sso-provider-meta`) so the Console does not import the
 * server identity module into the client bundle.
 */

import {
	type ProviderProtocol,
	providerCategoryLabels,
	providerCategoryOrder,
} from "./sso-provider-meta";

export interface PresetClaimMapping {
	id: string;
	email: string;
	emailVerified?: string;
	name: string;
	image?: string;
}

/** Directory defaults a preset can seed when the operator picks it. */
export interface PresetDirectoryDefaults {
	urlPlaceholder?: string;
	baseDnPlaceholder?: string;
	userSearchFilter?: string;
	emailAttribute?: string;
	nameAttribute?: string;
	idAttribute?: string;
}

/** Presets only ever target a selectable protocol, never the derived `custom`. */
export type PresetProtocol = Exclude<ProviderProtocol, "custom">;

export interface IdentityProviderPreset {
	/** Stable id, also used as the suggested Provider ID. */
	id: string;
	label: string;
	protocol: PresetProtocol;
	category: string;
	description: string;
	/** Fixed OIDC issuer pre-filled into the form, when the vendor has one. */
	issuer?: string;
	/** Hint shown in the issuer field when the issuer is tenant-specific. */
	issuerPlaceholder?: string;
	scopes?: string[];
	mapping?: PresetClaimMapping;
	/** Hint for the SAML IdP SSO URL. */
	entryPointPlaceholder?: string;
	directory?: PresetDirectoryDefaults;
}

export const identityProviderPresets: IdentityProviderPreset[] = [
	{
		id: "oidc",
		label: "OpenID Connect",
		protocol: "oidc",
		category: "federated",
		description: "Any OIDC-compliant provider, discovered from its issuer URL.",
		issuerPlaceholder: "https://idp.example.com",
	},
	{
		id: "google-workspace",
		label: "Google Workspace",
		protocol: "oidc",
		category: "federated",
		description:
			"Google Workspace or Google Cloud identity, via accounts.google.com.",
		issuer: "https://accounts.google.com",
	},
	{
		id: "microsoft-entra-id",
		label: "Microsoft Entra ID",
		protocol: "oidc",
		category: "federated",
		description:
			"Microsoft Entra ID (formerly Azure AD). Use your tenant-specific issuer.",
		issuerPlaceholder: "https://login.microsoftonline.com/{tenant-id}/v2.0",
		// Microsoft Graph UserInfo returns `email`, not `preferred_username`.
		mapping: {
			id: "sub",
			email: "email",
			emailVerified: "email_verified",
			name: "name",
		},
	},
	{
		id: "okta",
		label: "Okta",
		protocol: "oidc",
		category: "federated",
		description: "Okta org, or a custom authorization server issuer.",
		issuerPlaceholder: "https://{your-domain}.okta.com",
	},
	{
		id: "auth0",
		label: "Auth0",
		protocol: "oidc",
		category: "federated",
		description: "Auth0 tenant.",
		issuerPlaceholder: "https://{your-tenant}.auth0.com/",
	},
	{
		id: "keycloak",
		label: "Keycloak",
		protocol: "oidc",
		category: "federated",
		description: "Keycloak realm, self-hosted or managed.",
		issuerPlaceholder: "https://{host}/realms/{realm}",
	},
	{
		id: "onelogin",
		label: "OneLogin",
		protocol: "oidc",
		category: "federated",
		description: "OneLogin OIDC application.",
		issuerPlaceholder: "https://{subdomain}.onelogin.com/oidc/2",
	},
	{
		id: "jumpcloud",
		label: "JumpCloud",
		protocol: "oidc",
		category: "federated",
		description: "JumpCloud single sign-on.",
		issuer: "https://oauth.id.jumpcloud.com/",
	},
	{
		id: "gitlab",
		label: "GitLab",
		protocol: "oidc",
		category: "federated",
		description: "GitLab.com, or a self-managed instance exposing OIDC.",
		issuer: "https://gitlab.com",
		issuerPlaceholder: "https://gitlab.com",
	},
	{
		id: "saml",
		label: "SAML 2.0",
		protocol: "saml",
		category: "federated",
		description: "Federated sign-in through a SAML 2.0 identity provider.",
		entryPointPlaceholder: "https://idp.example.com/sso",
	},
	{
		id: "github",
		label: "GitHub",
		protocol: "oauth2",
		category: "social",
		description: "Sign in with a GitHub account, through an OAuth app you own.",
		issuer: "https://github.com",
		scopes: ["read:user", "user:email"],
	},
	{
		id: "ldap",
		label: "LDAP",
		protocol: "ldap",
		category: "directory",
		description: "Directory-bound authentication against an LDAP server.",
		directory: {
			urlPlaceholder: "ldap://ldap.example.com:389",
			baseDnPlaceholder: "ou=users,dc=example,dc=com",
			userSearchFilter: "(mail={{username}})",
			emailAttribute: "mail",
			nameAttribute: "cn",
			idAttribute: "entryUUID",
		},
	},
	{
		id: "active-directory",
		label: "Active Directory",
		protocol: "active-directory",
		category: "directory",
		description:
			"Directory-bound authentication against Active Directory or Samba AD.",
		directory: {
			urlPlaceholder: "ldaps://dc01.corp.example.com:636",
			baseDnPlaceholder: "DC=corp,DC=example,DC=com",
			userSearchFilter: "(userPrincipalName={{username}})",
			emailAttribute: "mail",
			nameAttribute: "displayName",
			idAttribute: "objectGUID",
		},
	},
];

/** Presets grouped for the selector, in the meta's category order. */
export const providerPresetGroups = providerCategoryOrder
	.map((category) => ({
		category,
		label: providerCategoryLabels[category] ?? category,
		presets: identityProviderPresets.filter(
			(preset) => preset.category === category,
		),
	}))
	.filter((group) => group.presets.length > 0);

export const findProviderPreset = (presetId: string) =>
	identityProviderPresets.find((preset) => preset.id === presetId);

/**
 * Vendor name for a stored provider, when it matches a named preset. Generic
 * entries return `null` so callers fall back to the protocol label ("OIDC")
 * instead of repeating it ("OpenID Connect").
 */
export const vendorLabelForProvider = (provider: {
	protocol: ProviderProtocol;
	issuer: string | null;
}): string | null => {
	const preset = findProviderPreset(presetForProvider(provider));
	if (!preset || preset.id === preset.protocol) return null;
	return preset.label;
};

const presetIdForProtocol = (protocol: ProviderProtocol) =>
	identityProviderPresets.find((preset) => preset.protocol === protocol)?.id ??
	"oidc";

/** Vendor hosts we can recognise from a stored issuer. */
const presetIdByHost: Array<[RegExp, string]> = [
	[/(^|\.)github\.com$/, "github"],
	[/(^|\.)accounts\.google\.com$/, "google-workspace"],
	[/(^|\.)login\.microsoftonline\.com$/, "microsoft-entra-id"],
	[/(^|\.)okta\.com$/, "okta"],
	[/(^|\.)okta-emea\.com$/, "okta"],
	[/(^|\.)auth0\.com$/, "auth0"],
	[/(^|\.)onelogin\.com$/, "onelogin"],
	[/(^|\.)jumpcloud\.com$/, "jumpcloud"],
	[/(^|\.)gitlab\.com$/, "gitlab"],
];

const issuerHost = (issuer: string | null) => {
	if (!issuer) return "";
	try {
		return new URL(issuer).host.toLowerCase();
	} catch {
		return "";
	}
};

/**
 * Best preset to describe a stored provider, so editing preselects the vendor
 * the operator originally chose. Falls back to the generic entry of the
 * provider's protocol for anything we cannot recognise.
 */
export const presetForProvider = (provider: {
	protocol: ProviderProtocol;
	issuer: string | null;
}): string => {
	if (provider.protocol === "oauth2") {
		const host = issuerHost(provider.issuer);
		const match = presetIdByHost.find(([pattern]) => pattern.test(host));
		if (match) return match[1];
	}
	if (provider.protocol === "oidc") {
		const issuer = provider.issuer ?? "";
		if (/\/realms\//i.test(issuer)) return "keycloak";
		const host = issuerHost(provider.issuer);
		const match = presetIdByHost.find(([pattern]) => pattern.test(host));
		if (match) return match[1];
	}
	return presetIdForProtocol(provider.protocol);
};
