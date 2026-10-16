import {
	classifyIdentityProviderFailure,
	type IdentityCapabilityMatrix,
	type IdentityProviderCategory,
	type IdentityProviderHealth,
	type IdentityProviderHealthStatus,
	type IdentityProviderIdentity,
	type IdentityProviderType,
	identityFetch,
	identityProviderCategory,
	identityProviderTypes,
	noIdentityCapabilities,
} from "@notploy/server/utils/identity";
import {
	parseLdapConfig,
	testLdapConnection,
} from "@notploy/server/utils/identity/ldap";
import {
	parseOauthConfig,
	testSocialConnection,
} from "@notploy/server/utils/identity/oauth";

/**
 * Provider row shape the health probe needs. Kept structural so the tRPC layer
 * can hand over a database row without the service depending on the schema.
 */
export interface IdentityProviderRecord {
	providerId: string;
	issuer: string;
	domain: string;
	oidcConfig: string | null;
	samlConfig: string | null;
	ldapConfig?: string | null;
	oauthConfig?: string | null;
}

export interface IdentityProviderDescriptor {
	providerType: IdentityProviderType;
	category: IdentityProviderCategory;
	capabilities: IdentityCapabilityMatrix;
}

/**
 * Capabilities each protocol exposes.
 *
 * OIDC and SAML are the protocols implemented today; LDAP / Active Directory
 * declare the directory-side capabilities they will provide so the UI can
 * render the same catalog ahead of the adapter shipping.
 */
export const getIdentityCapabilities = (
	protocol: IdentityProviderType,
): IdentityCapabilityMatrix => {
	const capabilities: IdentityCapabilityMatrix = { ...noIdentityCapabilities };
	const enable = (...keys: (keyof IdentityCapabilityMatrix)[]) => {
		for (const key of keys) capabilities[key] = true;
	};

	switch (protocol) {
		case "oidc":
			enable(
				"singleSignOn",
				"singleLogout",
				"refreshTokens",
				"pkce",
				"userProvisioning",
				"groupSync",
				"roleMapping",
				"jitProvisioning",
				"connectionDiagnostics",
			);
			break;
		case "saml":
			enable(
				"singleSignOn",
				"singleLogout",
				"userProvisioning",
				"groupSync",
				"roleMapping",
				"jitProvisioning",
				"certificateRotation",
				"connectionDiagnostics",
			);
			break;
		case "ldap":
		case "active-directory":
			enable(
				"singleSignOn",
				"directorySearch",
				"groupSync",
				"roleMapping",
				"userProvisioning",
				"connectionDiagnostics",
				"certificateRotation",
			);
			break;
		case "oauth2":
			enable(
				"singleSignOn",
				"userProvisioning",
				"jitProvisioning",
				"connectionDiagnostics",
			);
			break;
		case "custom":
			enable("singleSignOn", "connectionDiagnostics");
			break;
	}
	return capabilities;
};

/**
 * Capability matrix for every provider type, so the Console can show what a
 * provider supports before one is connected.
 */
export const listIdentityProviderDescriptors =
	(): IdentityProviderDescriptor[] =>
		identityProviderTypes.map((providerType) => ({
			providerType,
			category: identityProviderCategory[providerType],
			capabilities: getIdentityCapabilities(providerType),
		}));

export const resolveIdentityProviderProtocol = (
	provider: Pick<
		IdentityProviderRecord,
		"oidcConfig" | "samlConfig" | "ldapConfig" | "oauthConfig"
	>,
): IdentityProviderType => {
	if (provider.ldapConfig) {
		return parseLdapConfig(provider.ldapConfig)?.directoryType ?? "ldap";
	}
	if (provider.samlConfig) return "saml";
	if (provider.oidcConfig) return "oidc";
	if (provider.oauthConfig) return "oauth2";
	return "custom";
};

interface StoredOidcConfig {
	clientId?: string;
	clientSecret?: string;
	authorizationEndpoint?: string;
	tokenEndpoint?: string;
	userInfoEndpoint?: string;
	jwksEndpoint?: string;
	discoveryEndpoint?: string;
	skipDiscovery?: boolean;
	scopes?: string[];
}

interface StoredSamlConfig {
	entryPoint?: string;
	cert?: string;
	callbackUrl?: string;
	audience?: string;
	idpMetadata?: {
		metadata?: string;
		entityID?: string;
	};
}

const parseJsonObject = <T>(config: string | null): T | null => {
	if (!config) return null;
	try {
		const parsed = JSON.parse(config) as T;
		return parsed && typeof parsed === "object" ? parsed : null;
	} catch {
		return null;
	}
};

const parseOidcConfig = (config: string | null) =>
	parseJsonObject<StoredOidcConfig>(config);

const parseSamlConfig = (config: string | null) =>
	parseJsonObject<StoredSamlConfig>(config);

const stripTrailingSlashes = (value: string) =>
	value.trim().replace(/\/+$/, "");

interface HealthBase {
	checkedAt: string;
	protocol: IdentityProviderType;
	capabilities: IdentityCapabilityMatrix;
}

const failure = (
	base: HealthBase,
	status: IdentityProviderHealthStatus,
	message: string,
	remediation: string | null,
	identity: IdentityProviderIdentity | null = null,
): IdentityProviderHealth => ({
	...base,
	status,
	latencyMs: null,
	message,
	remediation,
	identity,
});

const notValidated = (
	base: HealthBase,
	message: string,
): IdentityProviderHealth => ({
	...base,
	status: "misconfigured",
	latencyMs: null,
	message,
	remediation: null,
	identity: null,
});

const probeOidc = async (
	provider: IdentityProviderRecord,
	base: HealthBase,
): Promise<IdentityProviderHealth> => {
	const oidc = parseOidcConfig(provider.oidcConfig);
	if (!oidc) {
		return notValidated(
			base,
			"The stored OIDC configuration could not be read.",
		);
	}
	if (!oidc.clientId?.trim()) {
		return notValidated(base, "No OIDC client ID is configured.");
	}

	if (oidc.skipDiscovery) {
		const missing = [
			["authorization endpoint", oidc.authorizationEndpoint],
			["token endpoint", oidc.tokenEndpoint],
			["JWKS endpoint", oidc.jwksEndpoint],
		]
			.filter(([, value]) => !value)
			.map(([label]) => label);
		if (missing.length > 0) {
			return notValidated(
				base,
				`Discovery is disabled and the ${missing.join(", ")} ${
					missing.length === 1 ? "is" : "are"
				} missing.`,
			);
		}
		return {
			...base,
			status: "connected",
			latencyMs: null,
			message: null,
			remediation: null,
			identity: {
				issuer: provider.issuer,
				authorizationEndpoint: oidc.authorizationEndpoint ?? null,
				tokenEndpoint: oidc.tokenEndpoint ?? null,
				userInfoEndpoint: oidc.userInfoEndpoint ?? null,
				jwksUri: oidc.jwksEndpoint ?? null,
			},
		};
	}

	const issuer = stripTrailingSlashes(provider.issuer);
	const discoveryUrl = oidc.discoveryEndpoint?.trim()
		? oidc.discoveryEndpoint.trim()
		: `${issuer}/.well-known/openid-configuration`;

	const startedAt = Date.now();
	let response: Response;
	try {
		response = await identityFetch(discoveryUrl, {
			headers: { accept: "application/json" },
		});
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "The provider is unreachable";
		return failure(
			base,
			"unreachable",
			`Could not reach the discovery endpoint: ${message}`,
			"Check that the issuer URL is reachable from the Notploy server.",
		);
	}
	const latencyMs = Date.now() - startedAt;

	if (!response.ok) {
		const status: IdentityProviderHealthStatus =
			response.status === 401 || response.status === 403
				? "misconfigured"
				: "unreachable";
		return {
			...base,
			status,
			latencyMs,
			message: `The discovery endpoint returned HTTP ${response.status}.`,
			remediation:
				status === "misconfigured"
					? "Verify the issuer URL and its access policy."
					: "Verify the issuer URL is correct and reachable.",
			identity: null,
		};
	}

	let document: Record<string, unknown>;
	try {
		document = (await response.json()) as Record<string, unknown>;
	} catch {
		return {
			...base,
			status: "misconfigured",
			latencyMs,
			message: "The discovery endpoint did not return valid JSON.",
			remediation: "Check that the issuer URL points to an OIDC provider.",
			identity: null,
		};
	}

	const documentIssuer =
		typeof document.issuer === "string" ? document.issuer : null;
	const authorizationEndpoint =
		typeof document.authorization_endpoint === "string"
			? document.authorization_endpoint
			: null;
	const tokenEndpoint =
		typeof document.token_endpoint === "string"
			? document.token_endpoint
			: null;
	const jwksUri =
		typeof document.jwks_uri === "string" ? document.jwks_uri : null;
	const userInfoEndpoint =
		typeof document.userinfo_endpoint === "string"
			? document.userinfo_endpoint
			: null;
	const scopesSupported = Array.isArray(document.scopes_supported)
		? document.scopes_supported.filter(
				(scope): scope is string => typeof scope === "string",
			)
		: undefined;

	const missingEndpoints = [
		["issuer", documentIssuer],
		["authorization endpoint", authorizationEndpoint],
		["token endpoint", tokenEndpoint],
		["JWKS URI", jwksUri],
	]
		.filter(([, value]) => !value)
		.map(([label]) => label);
	if (missingEndpoints.length > 0) {
		return {
			...base,
			status: "misconfigured",
			latencyMs,
			message: `The discovery document is missing: ${missingEndpoints.join(", ")}.`,
			remediation: "Verify the issuer URL points to a complete OIDC provider.",
			identity: null,
		};
	}

	if (documentIssuer && stripTrailingSlashes(documentIssuer) !== issuer) {
		return {
			...base,
			status: "misconfigured",
			latencyMs,
			message: `The discovery issuer (${documentIssuer}) does not match the configured issuer.`,
			remediation:
				"Set the issuer URL to the exact value the provider reports.",
			identity: {
				issuer: documentIssuer,
				authorizationEndpoint,
				tokenEndpoint,
				userInfoEndpoint,
				jwksUri,
				scopesSupported,
			},
		};
	}

	return {
		...base,
		status: "connected",
		latencyMs,
		message: null,
		remediation: null,
		identity: {
			issuer: documentIssuer,
			authorizationEndpoint,
			tokenEndpoint,
			userInfoEndpoint,
			jwksUri,
			scopesSupported,
		},
	};
};

const probeSaml = (
	provider: IdentityProviderRecord,
	base: HealthBase,
): IdentityProviderHealth => {
	const saml = parseSamlConfig(provider.samlConfig);
	if (!saml) {
		return notValidated(
			base,
			"The stored SAML configuration could not be read.",
		);
	}

	const entryPoint = saml.entryPoint?.trim() ?? "";
	const cert = saml.cert?.trim() ?? "";
	const callbackUrl = saml.callbackUrl?.trim() ?? "";
	const metadataEntityId = saml.idpMetadata?.entityID?.trim() || null;

	const missing = [
		["IdP SSO URL", entryPoint],
		["signing certificate", cert],
		["callback URL", callbackUrl],
	]
		.filter(([, value]) => !value)
		.map(([label]) => label);
	if (missing.length > 0) {
		return notValidated(
			base,
			`The SAML provider is missing: ${missing.join(", ")}.`,
		);
	}

	if (!/^https?:\/\//i.test(entryPoint)) {
		return notValidated(base, "The SAML IdP SSO URL must be an absolute URL.");
	}

	if (!/BEGIN CERTIFICATE/.test(cert)) {
		return notValidated(
			base,
			"The SAML signing certificate is not a PEM X.509 certificate.",
		);
	}

	return {
		...base,
		status: "connected",
		latencyMs: null,
		message: null,
		remediation: null,
		identity: {
			issuer: metadataEntityId ?? provider.issuer,
			ssoUrl: entryPoint,
		},
	};
};

/**
 * Probes a social provider. Its API is public, so a `connected` status means
 * the source is reachable from the Notploy server and answered with the shape
 * the adapter expects; the credentials are exercised by the sign-in round-trip.
 */
const probeSocial = async (
	provider: IdentityProviderRecord,
	base: HealthBase,
): Promise<IdentityProviderHealth> => {
	const oauth = parseOauthConfig(provider.oauthConfig ?? null);
	if (!oauth) {
		return notValidated(
			base,
			"The stored social sign-in configuration could not be read.",
		);
	}
	if (!oauth.clientId.trim()) {
		return notValidated(base, "No client ID is configured.");
	}

	const startedAt = Date.now();
	const result = await testSocialConnection(oauth);
	const latencyMs = Date.now() - startedAt;

	if (!result.connected) {
		return failure(
			base,
			classifyIdentityProviderFailure(result.message),
			result.message,
			"Verify the client ID and secret, and that the Notploy server can reach the provider.",
		);
	}

	return {
		...base,
		status: "connected",
		latencyMs,
		message: null,
		remediation: null,
		identity: { issuer: provider.issuer },
	};
};

/**
 * Probes a directory provider by binding with its service account and reading
 * the base DN. A `connected` status means the directory accepted the bind and
 * answered the search.
 */
const probeLdap = async (
	provider: IdentityProviderRecord,
	base: HealthBase,
): Promise<IdentityProviderHealth> => {
	const ldap = parseLdapConfig(provider.ldapConfig ?? null);
	if (!ldap) {
		return notValidated(
			base,
			"The stored directory configuration could not be read.",
		);
	}

	const startedAt = Date.now();
	const result = await testLdapConnection(ldap);
	const latencyMs = Date.now() - startedAt;

	if (!result.connected) {
		return failure(
			base,
			classifyIdentityProviderFailure(result.message),
			`The directory could not be reached: ${result.message}`,
			"Verify the server URL, bind DN, bind password and base DN, then test the connection again.",
		);
	}

	return {
		...base,
		status: "connected",
		latencyMs,
		message: null,
		remediation: null,
		identity: { issuer: ldap.url },
	};
};

/**
 * Probes an identity provider and reports structured diagnostics.
 *
 * OIDC performs a real discovery request so a `connected` status means the
 * provider metadata was fetched and validated; SAML is validated structurally
 * because there is no universal network endpoint to probe. No secret (client
 * secret, certificate material, bind password) is ever returned.
 */
export const getIdentityProviderHealth = async (
	provider: IdentityProviderRecord,
): Promise<IdentityProviderHealth> => {
	const protocol = resolveIdentityProviderProtocol(provider);
	const base: HealthBase = {
		checkedAt: new Date().toISOString(),
		protocol,
		capabilities: getIdentityCapabilities(protocol),
	};

	switch (protocol) {
		case "oidc":
			return await probeOidc(provider, base);
		case "saml":
			return probeSaml(provider, base);
		case "ldap":
		case "active-directory":
			return await probeLdap(provider, base);
		case "oauth2":
			return await probeSocial(provider, base);
		case "custom":
			return notValidated(base, "No supported protocol is configured.");
	}
};

/**
 * Exposed for tests: classifies a raw provider error message.
 * @internal
 */
export const classifyIdentityProviderError = classifyIdentityProviderFailure;
