/**
 * Social (OAuth 2.0) adapter.
 *
 * Some sources expose neither OIDC nor SAML. GitHub is the first: it only
 * speaks plain OAuth 2.0, returns its token as JSON only when asked to, and
 * splits the profile across `/user` and `/user/emails` (the email is private by
 * default). All of that vendor knowledge lives in a descriptor registry, so
 * supporting another social source is a new entry rather than a new flow.
 *
 * The client secret is never logged or returned.
 */
import {
	type IdentityOauthConfig,
	identityOauthConfigSchema,
} from "@notploy/server/db/schema/sso";

export type { IdentityOauthConfig };

const SOCIAL_REQUEST_TIMEOUT_MS = 10_000;

/** Identity resolved from a social source. Never includes the access token. */
export interface SocialAuthenticatedUser {
	/** Stable account id reported by the source. */
	id: string;
	email: string;
	name: string;
}

export interface SocialProviderDescriptor {
	label: string;
	authorizationUrl: string;
	tokenUrl: string;
	/** Base API URL, used by the health probe to prove reachability. */
	apiUrl: string;
	defaultScopes: string[];
	/** Reads the profile for an access token, resolving a usable email. */
	loadProfile: (accessToken: string) => Promise<SocialAuthenticatedUser | null>;
}

const socialFetch = (url: string, init: RequestInit = {}) =>
	fetch(url, {
		...init,
		headers: { accept: "application/json", ...(init.headers ?? {}) },
		signal: AbortSignal.timeout(SOCIAL_REQUEST_TIMEOUT_MS),
	});

const githubProfile = async (
	accessToken: string,
): Promise<SocialAuthenticatedUser | null> => {
	const authHeaders = { authorization: `Bearer ${accessToken}` };
	const [userResponse, emailsResponse] = await Promise.all([
		socialFetch("https://api.github.com/user", { headers: authHeaders }),
		socialFetch("https://api.github.com/user/emails", { headers: authHeaders }),
	]);
	if (!userResponse.ok) return null;

	const user = (await userResponse.json()) as {
		id?: number | string;
		login?: string;
		name?: string | null;
		email?: string | null;
	};
	const id = user.id != null ? String(user.id) : "";
	if (!id) return null;

	// A GitHub account hides its email unless it is public, so the verified
	// address is read from the dedicated endpoint.
	let email = user.email?.trim() ?? "";
	if (emailsResponse.ok) {
		const emails = (await emailsResponse.json()) as Array<{
			email?: string;
			primary?: boolean;
			verified?: boolean;
		}>;
		const preferred =
			emails.find((entry) => entry.primary && entry.verified) ??
			emails.find((entry) => entry.verified) ??
			null;
		if (preferred?.email) email = preferred.email;
	}
	if (!email) return null;

	return {
		id,
		email: email.toLowerCase(),
		name: user.name?.trim() || user.login?.trim() || email,
	};
};

export const socialProviderDescriptors: Record<
	IdentityOauthConfig["provider"],
	SocialProviderDescriptor
> = {
	github: {
		label: "GitHub",
		authorizationUrl: "https://github.com/login/oauth/authorize",
		tokenUrl: "https://github.com/login/oauth/access_token",
		apiUrl: "https://api.github.com",
		defaultScopes: ["read:user", "user:email"],
		loadProfile: githubProfile,
	},
};

/**
 * Reads a stored social configuration. Tolerates the schema `default()`s so a
 * partially stored config still parses.
 */
export const parseOauthConfig = (
	config: string | null,
): IdentityOauthConfig | null => {
	if (!config) return null;
	try {
		const parsed = identityOauthConfigSchema.safeParse(JSON.parse(config));
		return parsed.success ? parsed.data : null;
	} catch {
		return null;
	}
};

export const socialProviderDescriptor = (config: IdentityOauthConfig) =>
	socialProviderDescriptors[config.provider];

export const socialScopes = (config: IdentityOauthConfig) =>
	config.scopes?.length
		? config.scopes
		: socialProviderDescriptor(config).defaultScopes;

/** Authorization URL the browser is sent to, with the CSRF `state` attached. */
export const buildSocialAuthorizeUrl = (input: {
	config: IdentityOauthConfig;
	redirectUri: string;
	state: string;
}): string => {
	const descriptor = socialProviderDescriptor(input.config);
	const url = new URL(descriptor.authorizationUrl);
	url.searchParams.set("client_id", input.config.clientId);
	url.searchParams.set("redirect_uri", input.redirectUri);
	url.searchParams.set("scope", socialScopes(input.config).join(" "));
	url.searchParams.set("state", input.state);
	url.searchParams.set("response_type", "code");
	return url.toString();
};

/**
 * Exchanges the authorization code for an access token. Returns `null` when the
 * source rejects the exchange (bad secret, replayed code, revoked app).
 */
export const exchangeSocialCode = async (input: {
	config: IdentityOauthConfig;
	code: string;
	redirectUri: string;
}): Promise<string | null> => {
	const descriptor = socialProviderDescriptor(input.config);
	const response = await socialFetch(descriptor.tokenUrl, {
		method: "POST",
		headers: { "content-type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			client_id: input.config.clientId,
			client_secret: input.config.clientSecret,
			code: input.code,
			redirect_uri: input.redirectUri,
		}).toString(),
	});
	if (!response.ok) return null;

	const payload = (await response.json()) as {
		access_token?: string;
		error?: string;
	};
	return payload.access_token?.trim() ? payload.access_token : null;
};

export const fetchSocialUser = async (input: {
	config: IdentityOauthConfig;
	accessToken: string;
}): Promise<SocialAuthenticatedUser | null> =>
	await socialProviderDescriptor(input.config).loadProfile(input.accessToken);

/**
 * Proves the source is reachable. Its API is public, so this only checks
 * network reachability and a well-formed response — the credentials themselves
 * are exercised by the authorization round-trip.
 */
export const testSocialConnection = async (
	config: IdentityOauthConfig,
): Promise<{ connected: boolean; message: string }> => {
	const descriptor = socialProviderDescriptor(config);
	try {
		const response = await socialFetch(descriptor.apiUrl);
		if (!response.ok) {
			return {
				connected: false,
				message: `The ${descriptor.label} API returned HTTP ${response.status}.`,
			};
		}
		return {
			connected: true,
			message: `Connected to ${descriptor.label}.`,
		};
	} catch (error) {
		return {
			connected: false,
			message:
				error instanceof Error
					? error.message
					: `${descriptor.label} could not be reached.`,
		};
	}
};
