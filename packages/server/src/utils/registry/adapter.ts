/**
 * Generic OCI registry adapter.
 *
 * Every provider in the catalogue is addressed through the OCI Distribution
 * API, so one adapter covers managed, self-hosted and completely custom
 * registries. Provider descriptors only contribute defaults (endpoint, auth
 * transport, extra capabilities); nothing provider-specific leaks here.
 *
 * Credentials are supplied by the caller — resolved from the Secrets Manager or
 * read from the registry record — and are never logged or returned.
 */
import { registryProviderDescriptor } from "./providers";
import {
	classifyRegistryFailure,
	describeRegistryNetworkError,
	noRegistryCapabilities,
	type RegistryCapabilityMatrix,
	type RegistryCredentials,
	type RegistryHealth,
	type RegistryHealthStatus,
	type RegistryIdentity,
	type RegistryManifest,
	type RegistryProviderType,
	type RegistryRepository,
	type RegistryTag,
	registryFetch,
} from "./types";

export interface RegistryAdapterInput {
	providerType: RegistryProviderType;
	/** Endpoint as configured, with or without a scheme. */
	endpoint: string;
	credentials?: RegistryCredentials | null;
}

/**
 * The contract every registry is served through. Operations the endpoint cannot
 * perform are simply not implemented (see the capability matrix), so the caller
 * never has to know which provider it is talking to.
 */
export interface ContainerRegistryAdapter {
	testConnection(): Promise<RegistryConnectionResult>;
	getIdentity(): Promise<RegistryIdentity>;
	getCapabilities(): Promise<RegistryCapabilityMatrix>;
	health(): Promise<RegistryHealth>;
	listRepositories(): Promise<RegistryRepository[]>;
	getRepository(name: string): Promise<RegistryRepository | null>;
	listTags(repository: string): Promise<RegistryTag[]>;
	getManifest(repository: string, reference: string): Promise<RegistryManifest>;
	getDigest(repository: string, reference: string): Promise<string>;
	deleteImage(repository: string, digest: string): Promise<void>;
}

export interface RegistryConnectionResult {
	connected: boolean;
	authenticated: boolean;
	message: string;
	identity: RegistryIdentity | null;
	latencyMs: number | null;
	/** HTTP status of the probe, `null` when the endpoint could not be reached. */
	httpStatus: number | null;
}

const MANIFEST_ACCEPT = [
	"application/vnd.oci.image.manifest.v1+json",
	"application/vnd.oci.image.index.v1+json",
	"application/vnd.docker.distribution.manifest.v2+json",
	"application/vnd.docker.distribution.manifest.list.v2+json",
].join(", ");

/** Endpoints are https by default; a scheme must be given to use plain http. */
export const normalizeRegistryEndpoint = (endpoint: string): string => {
	const trimmed = endpoint.trim().replace(/\/+$/, "");
	if (!trimmed) return trimmed;
	if (/^https?:\/\//i.test(trimmed)) return trimmed;
	return `https://${trimmed}`;
};

/**
 * `fetch` that reports *why* it failed. A registry probe can die before any
 * HTTP exchange — DNS, TCP, TLS — and the runtime only says `fetch failed`,
 * which tells neither the user nor the health status anything actionable.
 */
const fetchRegistry = async (url: string, init: RequestInit = {}) => {
	try {
		return await registryFetch(url, init);
	} catch (error) {
		throw new Error(describeRegistryNetworkError(url, error), { cause: error });
	}
};

const basicAuthHeader = (credentials?: RegistryCredentials | null) => {
	const username = credentials?.username?.trim();
	const password = credentials?.password ?? "";
	if (!username || !password) return null;
	return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
};

/** Parses a `WWW-Authenticate: Bearer realm="…",service="…"` challenge. */
const parseBearerChallenge = (header: string | null) => {
	if (!header || !/^bearer/i.test(header)) return null;
	const params: Record<string, string> = {};
	for (const match of header
		.slice(header.indexOf(" ") + 1)
		.matchAll(/([a-z_]+)="([^"]*)"/gi)) {
		const key = match[1];
		const value = match[2];
		if (key && value !== undefined) params[key.toLowerCase()] = value;
	}
	if (!params.realm) return null;
	return { realm: params.realm, service: params.service ?? null };
};

export const createOciRegistryAdapter = (
	input: RegistryAdapterInput,
): ContainerRegistryAdapter => {
	const endpoint = normalizeRegistryEndpoint(input.endpoint);
	const credentials = input.credentials ?? null;
	const descriptor = registryProviderDescriptor(input.providerType);

	/**
	 * Whether this probe carries credentials at all. Registries challenge every
	 * anonymous request, so a `401` without credentials is not a rejection —
	 * reporting it as one would blame credentials the user never supplied.
	 */
	const anonymousRequest =
		!credentials?.username?.trim() && !credentials?.password;

	/** Caches the bearer token negotiated with the registry's auth service. */
	let bearerToken: string | null = null;
	let lastError: string | null = null;

	const authHeaders = (): Record<string, string> => {
		if (bearerToken) return { authorization: `Bearer ${bearerToken}` };
		const basic = basicAuthHeader(credentials);
		return basic ? { authorization: basic } : {};
	};

	/**
	 * Exchanges the registry challenge for a token. Docker Hub and most hosted
	 * registries answer `401` with a `Bearer` challenge instead of accepting
	 * basic auth directly.
	 */
	const negotiateToken = async (
		challengeHeader: string | null,
		scope: string | null,
	): Promise<boolean> => {
		const challenge = parseBearerChallenge(challengeHeader);
		if (!challenge) return false;
		const url = new URL(challenge.realm);
		if (challenge.service) url.searchParams.set("service", challenge.service);
		if (scope) url.searchParams.set("scope", scope);
		const basic = basicAuthHeader(credentials);
		const response = await fetchRegistry(url.toString(), {
			headers: basic ? { authorization: basic } : {},
		});
		if (!response.ok) return false;
		const payload = (await response.json()) as {
			token?: string;
			access_token?: string;
		};
		const token = payload.token ?? payload.access_token ?? null;
		if (!token) return false;
		bearerToken = token;
		return true;
	};

	/**
	 * Performs a registry request, retrying once through the token service when
	 * the registry answers with a `Bearer` challenge.
	 */
	const request = async (
		path: string,
		init: RequestInit & { scope?: string | null } = {},
	): Promise<Response> => {
		const { scope = null, ...rest } = init;
		const url = `${endpoint}${path}`;
		const response = await fetchRegistry(url, {
			...rest,
			headers: {
				...(rest.headers as Record<string, string> | undefined),
				...authHeaders(),
			},
		});
		if (response.status !== 401) return response;

		const challenge = response.headers.get("www-authenticate");
		if (!(await negotiateToken(challenge, scope))) return response;
		return await fetchRegistry(url, {
			...rest,
			headers: {
				...(rest.headers as Record<string, string> | undefined),
				...authHeaders(),
			},
		});
	};

	const ping = async () => {
		const startedAt = Date.now();
		const response = await request("/v2/", { method: "GET" });
		const latencyMs = Date.now() - startedAt;
		return { response, latencyMs };
	};

	const buildIdentity = (response: Response): RegistryIdentity => ({
		endpoint,
		apiVersion: response.headers.get("docker-distribution-api-version"),
		authRealm:
			parseBearerChallenge(response.headers.get("www-authenticate"))?.realm ??
			null,
		authService:
			parseBearerChallenge(response.headers.get("www-authenticate"))?.service ??
			null,
		/** Only credentials the registry actually accepted count as authenticated. */
		authenticated: response.ok && !anonymousRequest,
		anonymous: anonymousRequest,
	});

	/**
	 * Message for a `401`/`403`.
	 *
	 * With credentials the registry refused them, which is a configuration
	 * mistake. Without credentials nothing was refused: the registry is asking
	 * for a token, which is the normal handshake anonymous pulls also go through.
	 */
	const authenticationMessage = (status: number) =>
		anonymousRequest
			? `Connected anonymously. The registry answers HTTP ${status} until a repository is requested, which is how anonymous pulls work: name a repository to inspect or pull its public images.`
			: `The registry rejected the credentials (HTTP ${status}).`;

	const testConnection = async (): Promise<RegistryConnectionResult> => {
		try {
			const { response, latencyMs } = await ping();
			const identity = buildIdentity(response);
			if (response.ok) {
				return {
					connected: true,
					authenticated: !anonymousRequest,
					message: anonymousRequest
						? "Connected to the registry anonymously."
						: "Connected to the registry.",
					identity,
					latencyMs,
					httpStatus: response.status,
				};
			}
			if (response.status === 401 || response.status === 403) {
				const message = authenticationMessage(response.status);
				// Only a probe that carried credentials can conclude they are wrong.
				if (!anonymousRequest) lastError = message;
				return {
					// An anonymous endpoint answering the OCI auth challenge is working:
					// the challenge is the handshake public pulls go through too. Nothing
					// is misconfigured and no credential is missing.
					connected: anonymousRequest,
					authenticated: false,
					message,
					identity,
					latencyMs,
					httpStatus: response.status,
				};
			}
			const message = `The registry answered HTTP ${response.status}.`;
			lastError = message;
			return {
				connected: false,
				authenticated: false,
				message,
				identity,
				latencyMs,
				httpStatus: response.status,
			};
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "The registry could not be reached.";
			lastError = message;
			return {
				connected: false,
				authenticated: false,
				message,
				identity: null,
				latencyMs: null,
				httpStatus: null,
			};
		}
	};

	/**
	 * Whether the endpoint answered as a registry.
	 *
	 * A challenge (`401`/`403`) is an answer: the endpoint is up, speaks OCI and
	 * merely wants a token. Only a network failure means reachability is unknown.
	 */
	const isReachable = async (): Promise<boolean> => {
		try {
			const { response } = await ping();
			return response.ok || response.status === 401 || response.status === 403;
		} catch {
			return false;
		}
	};

	/**
	 * Capabilities are declared by the provider descriptor once the endpoint
	 * answers: an unreachable registry must not advertise working operations.
	 */
	const getCapabilities = async (): Promise<RegistryCapabilityMatrix> =>
		(await isReachable()) ? descriptor.capabilities : noRegistryCapabilities;

	const health = async (): Promise<RegistryHealth> => {
		const result = await testConnection();
		/** The endpoint answered as a registry, whatever it answered. */
		const responded =
			result.connected ||
			result.httpStatus === 401 ||
			result.httpStatus === 403;

		const base = {
			checkedAt: new Date().toISOString(),
			providerType: input.providerType,
			// A registry that is up advertises its capabilities even when the probe
			// could not authenticate; using them needs credentials, discovering them
			// does not.
			capabilities: responded
				? descriptor.capabilities
				: noRegistryCapabilities,
			repositoryCount: null as number | null,
			lastError,
			identity: result.identity,
			latencyMs: result.latencyMs,
		};

		if (!result.connected) {
			const status: RegistryHealthStatus = classifyRegistryFailure(
				result.message,
			);
			return {
				...base,
				status,
				message: result.message,
				remediation:
					status === "misconfigured"
						? "Verify the username and password (or secret reference) and that the account may read this registry."
						: "Verify the endpoint, that the Notploy server can reach it, and its TLS certificate.",
			};
		}

		// A reachable endpoint is only "connected" once the catalogue is readable;
		// without that permission the account can still pull, hence `degraded`.
		const repositories = await listRepositories().catch((error) => {
			lastError = error instanceof Error ? error.message : "Unknown error";
			return null;
		});

		if (repositories === null) {
			// An anonymous connection is not degraded by an unreachable catalogue:
			// nothing was misconfigured and no credential is missing, the catalogue
			// simply is not public. The limit is stated instead of penalised.
			if (anonymousRequest) {
				return {
					...base,
					status: "connected",
					message:
						"Connected anonymously. This registry does not expose a public catalogue, so name a repository to inspect it; anonymous pulls keep working for public images.",
					remediation:
						"Add credentials or a secret reference to list every repository at once.",
					lastError: null,
				};
			}

			return {
				...base,
				status: "degraded",
				message:
					"Connected, but the repository catalogue is not readable with these credentials.",
				remediation:
					"Grant the account catalogue (or registry admin) access to list repositories, or accept pull-only usage.",
				lastError,
			};
		}

		return {
			...base,
			status: "connected",
			message: null,
			remediation: null,
			repositoryCount: repositories.length,
			lastError: null,
		};
	};

	const listRepositories = async (): Promise<RegistryRepository[]> => {
		const response = await request("/v2/_catalog?n=200", {
			headers: { accept: "application/json" },
			scope: "registry:catalog:*",
		});
		if (!response.ok) {
			throw new Error(
				`The registry catalogue returned HTTP ${response.status}.`,
			);
		}
		const payload = (await response.json()) as { repositories?: unknown };
		const repositories = Array.isArray(payload.repositories)
			? payload.repositories.filter(
					(name): name is string => typeof name === "string",
				)
			: [];
		return repositories.sort().map((name) => ({ name, tagCount: null }));
	};

	const getRepository = async (
		name: string,
	): Promise<RegistryRepository | null> => {
		const tags = await listTags(name);
		return { name, tagCount: tags.length };
	};

	const listTags = async (repository: string): Promise<RegistryTag[]> => {
		const response = await request(
			`/v2/${encodeRepository(repository)}/tags/list?n=200`,
			{
				headers: { accept: "application/json" },
				scope: `repository:${repository}:pull`,
			},
		);
		if (!response.ok) {
			throw new Error(
				`The tag list returned HTTP ${response.status} for ${repository}.`,
			);
		}
		const payload = (await response.json()) as { tags?: unknown };
		const tags = Array.isArray(payload.tags)
			? payload.tags.filter((tag): tag is string => typeof tag === "string")
			: [];
		return tags.sort().map((tag) => ({ tag, digest: null }));
	};

	const getManifest = async (
		repository: string,
		reference: string,
	): Promise<RegistryManifest> => {
		const response = await request(
			`/v2/${encodeRepository(repository)}/manifests/${encodeURIComponent(reference)}`,
			{
				headers: { accept: MANIFEST_ACCEPT },
				scope: `repository:${repository}:pull`,
			},
		);
		if (!response.ok) {
			throw new Error(
				`The manifest returned HTTP ${response.status} for ${repository}:${reference}.`,
			);
		}
		const body = await response.text();
		let raw: unknown = body;
		try {
			raw = JSON.parse(body);
		} catch {
			// A non-JSON body is kept as-is: it is still a valid response.
		}
		const digest = response.headers.get("docker-content-digest");
		return {
			repository,
			reference,
			digest: digest ?? reference,
			mediaType:
				response.headers.get("content-type") ??
				(typeof raw === "object" && raw && "mediaType" in raw
					? String((raw as { mediaType?: unknown }).mediaType)
					: null),
			sizeBytes: body.length,
			raw,
		};
	};

	const getDigest = async (
		repository: string,
		reference: string,
	): Promise<string> => {
		const response = await request(
			`/v2/${encodeRepository(repository)}/manifests/${encodeURIComponent(reference)}`,
			{
				method: "HEAD",
				headers: { accept: MANIFEST_ACCEPT },
				scope: `repository:${repository}:pull`,
			},
		);
		if (!response.ok) {
			throw new Error(
				`The digest lookup returned HTTP ${response.status} for ${repository}:${reference}.`,
			);
		}
		const digest = response.headers.get("docker-content-digest");
		if (!digest) {
			throw new Error(
				`The registry did not report a digest for ${repository}:${reference}.`,
			);
		}
		return digest;
	};

	/** Deletes by digest: OCI deletes the artifact a digest resolves to. */
	const deleteImage = async (repository: string, digest: string) => {
		const response = await request(
			`/v2/${encodeRepository(repository)}/manifests/${encodeURIComponent(digest)}`,
			{
				method: "DELETE",
				scope: `repository:${repository}:*`,
			},
		);
		if (!response.ok && response.status !== 202) {
			throw new Error(
				`Deleting ${repository}@${digest} returned HTTP ${response.status}.`,
			);
		}
	};

	return {
		testConnection,
		getIdentity: async () => {
			const { response } = await ping();
			return buildIdentity(response);
		},
		getCapabilities,
		health,
		listRepositories,
		getRepository,
		listTags,
		getManifest,
		getDigest,
		deleteImage,
	};
};

/**
 * The OCI spec addresses repositories as repeated path segments. `encodeURI`
 * would escape the separators, so each segment is encoded on its own.
 */
const encodeRepository = (repository: string) =>
	repository
		.trim()
		.replace(/^\/+/, "")
		.split("/")
		.map((segment) => encodeURIComponent(segment))
		.join("/");
