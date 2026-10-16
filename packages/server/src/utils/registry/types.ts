/**
 * Container Registry domain model.
 *
 * Notploy integrates with the registry infrastructure the user already runs
 * instead of forcing a specific vendor. A registry is any endpoint capable of
 * serving OCI artifacts — Docker Hub is just one provider — so providers are
 * described by a common contract and a provider that only speaks the OCI
 * Distribution API needs no dedicated adapter.
 *
 * These types are shared by the server adapters and the Console so the
 * capability/health contract stays identical on both sides.
 */

/**
 * Provider types Notploy can describe.
 *
 * `generic-oci` is the universal fallback: any OCI-compatible endpoint is
 * reachable through it, so the catalogue never becomes a hardcoded vendor list.
 */
export const registryProviderTypes = [
	"docker-hub",
	"ghcr",
	"gitlab",
	"ecr",
	"gar",
	"acr",
	"quay",
	"artifactory",
	"harbor",
	"zot",
	"distribution",
	"nexus",
	"generic-oci",
] as const;

export type RegistryProviderType = (typeof registryProviderTypes)[number];

export const registryProviderLabels: Record<RegistryProviderType, string> = {
	"docker-hub": "Docker Hub",
	ghcr: "GitHub Container Registry",
	gitlab: "GitLab Container Registry",
	ecr: "Amazon ECR",
	gar: "Google Artifact Registry",
	acr: "Azure Container Registry",
	quay: "Quay",
	artifactory: "JFrog Artifactory",
	harbor: "Harbor",
	zot: "Zot",
	distribution: "Docker Distribution / Registry",
	nexus: "Nexus",
	"generic-oci": "Generic OCI Registry",
};

export const registryProviderDescriptions: Record<
	RegistryProviderType,
	string
> = {
	"docker-hub": "Managed registry, the default for unqualified image names.",
	ghcr: "Registries served by GitHub for a user or an organization.",
	gitlab: "The registry bundled with a GitLab instance or GitLab.com.",
	ecr: "Amazon Elastic Container Registry, private repositories.",
	gar: "Google Artifact Registry, Docker repositories.",
	acr: "Azure Container Registry.",
	quay: "Quay.io, hosted or self-managed.",
	artifactory: "JFrog Artifactory Docker repositories.",
	harbor: "Self-hosted Harbor, with its own project namespace.",
	zot: "Self-hosted Zot, an OCI-native registry.",
	distribution: "The reference Docker Distribution registry (registry:2).",
	nexus: "Sonatype Nexus, Docker hosted repositories.",
	"generic-oci":
		"Any endpoint that implements the OCI Distribution API, managed or local.",
};

export const registryProviderCategoryOrder = [
	"managed",
	"selfHosted",
	"generic",
] as const;

export type RegistryProviderCategory =
	(typeof registryProviderCategoryOrder)[number];

export const registryProviderCategory: Record<
	RegistryProviderType,
	RegistryProviderCategory
> = {
	"docker-hub": "managed",
	ghcr: "managed",
	gitlab: "managed",
	ecr: "managed",
	gar: "managed",
	acr: "managed",
	quay: "managed",
	artifactory: "managed",
	harbor: "selfHosted",
	zot: "selfHosted",
	distribution: "selfHosted",
	nexus: "selfHosted",
	"generic-oci": "generic",
};

export const registryProviderCategoryLabels: Record<
	RegistryProviderCategory,
	string
> = {
	managed: "Managed",
	selfHosted: "Self-hosted",
	generic: "Generic",
};

export const registryProviderCategoryDescriptions: Record<
	RegistryProviderCategory,
	string
> = {
	managed: "A registry operated by a vendor, reached over the public internet.",
	selfHosted: "A registry you operate, typically on a private network.",
	generic: "Any OCI-compatible endpoint, described by its capabilities.",
};

/**
 * How a registry authenticates.
 *
 * `secret` resolves credentials from the Secrets Manager through a secret
 * reference; `inline` keeps them on the registry record as a fallback. Cloud
 * registries are addressed with a short-lived token placed in the password
 * field, so they use the same basic-auth transport.
 */
export const registryAuthMethods = ["none", "basic", "token"] as const;
export type RegistryAuthMethod = (typeof registryAuthMethods)[number];

export const registryAuthMethodLabels: Record<RegistryAuthMethod, string> = {
	none: "Anonymous",
	basic: "Username and password",
	token: "Access token",
};

export const registryCredentialSources = ["secret", "inline"] as const;
export type RegistryCredentialSource =
	(typeof registryCredentialSources)[number];

export const registryCredentialSourceLabels: Record<
	RegistryCredentialSource,
	string
> = {
	secret: "Secrets Manager reference",
	inline: "Stored on the registry",
};

/** Capabilities a registry may expose. Mirrors the adapter responsibilities. */
export const registryCapabilities = [
	"repositoryListing",
	"repositoryCreation",
	"repositoryDeletion",
	"tagListing",
	"manifestInspection",
	"digestInspection",
	"imageDeletion",
	"artifactSupport",
	"vulnerabilityScanning",
	"signatures",
	"sbom",
	"provenance",
	"retentionPolicies",
	"replication",
	"registryMirroring",
] as const;

export type RegistryCapability = (typeof registryCapabilities)[number];

export type RegistryCapabilityMatrix = Record<RegistryCapability, boolean>;

export const registryCapabilityLabels: Record<RegistryCapability, string> = {
	repositoryListing: "Repository listing",
	repositoryCreation: "Repository creation",
	repositoryDeletion: "Repository deletion",
	tagListing: "Tag listing",
	manifestInspection: "Manifest inspection",
	digestInspection: "Digest inspection",
	imageDeletion: "Image deletion",
	artifactSupport: "OCI artifacts",
	vulnerabilityScanning: "Vulnerability scanning",
	signatures: "Signatures",
	sbom: "SBOM",
	provenance: "Provenance / attestations",
	retentionPolicies: "Retention policies",
	replication: "Replication",
	registryMirroring: "Registry mirroring",
};

/**
 * Capabilities every OCI Distribution API endpoint provides, whether or not the
 * provider advertises them. Everything else is opt-in per provider.
 */
const baseOciCapabilities: RegistryCapability[] = [
	"repositoryListing",
	"tagListing",
	"manifestInspection",
	"digestInspection",
	"imageDeletion",
	"artifactSupport",
];

const allCapabilities = (value: boolean): RegistryCapabilityMatrix =>
	Object.fromEntries(
		registryCapabilities.map((capability) => [capability, value]),
	) as RegistryCapabilityMatrix;

/** Every capability disabled — the safe default for providers we cannot probe. */
export const noRegistryCapabilities = allCapabilities(false);

/** The capabilities the OCI Distribution API guarantees. */
export const ociRegistryCapabilities = (() => {
	const capabilities = allCapabilities(false);
	for (const capability of baseOciCapabilities) capabilities[capability] = true;
	return capabilities;
})();

/**
 * Credentials handed to an adapter. Resolved by the caller from the Secrets
 * Manager or from the registry record, and never persisted or logged here.
 */
export interface RegistryCredentials {
	username?: string | null;
	password?: string | null;
}

export type RegistryHealthStatus =
	| "connected"
	| "degraded"
	| "unreachable"
	| "misconfigured";

/**
 * Registry information resolved from the endpoint itself, never including
 * credentials.
 */
export interface RegistryIdentity {
	endpoint: string;
	/** `Docker-Distribution-Api-Version` served by the endpoint, when present. */
	apiVersion: string | null;
	/** Realm of the `WWW-Authenticate` challenge: identifies the auth service. */
	authRealm: string | null;
	/** Service named by the challenge, e.g. the registry host. */
	authService: string | null;
	/** Whether the endpoint accepted the supplied credentials. */
	authenticated: boolean;
	anonymous: boolean;
}

export interface RegistryHealth {
	status: RegistryHealthStatus;
	checkedAt: string;
	/** Round-trip time of the probe, when one could be measured. */
	latencyMs: number | null;
	/** Actionable explanation, safe to show to the user. */
	message: string | null;
	/** What the user has to do, when the status is not `connected`. */
	remediation: string | null;
	providerType: RegistryProviderType;
	capabilities: RegistryCapabilityMatrix;
	/** Number of repositories reported by the catalogue, when it can be read. */
	repositoryCount: number | null;
	/** Last error observed while talking to the registry, when any. */
	lastError: string | null;
	identity: RegistryIdentity | null;
}

/** A repository as listed by the registry. */
export interface RegistryRepository {
	name: string;
	/** Number of tags reported by the registry, when available. */
	tagCount: number | null;
}

export interface RegistryTag {
	tag: string;
	/** Digest the tag currently resolves to, when the registry reports it. */
	digest: string | null;
}

export interface RegistryManifest {
	repository: string;
	reference: string;
	/** Digest the reference resolves to, the immutable identity of the image. */
	digest: string;
	mediaType: string | null;
	sizeBytes: number | null;
	/** Raw manifest document, parsed when it is JSON. */
	raw: unknown;
}

/**
 * Classifies a failed registry probe.
 *
 * Kept pure (and exported) so the mapping is unit-testable: registries fail with
 * wildly different messages, and the user-facing status has to stay stable.
 */
export const classifyRegistryFailure = (
	message: string,
): RegistryHealthStatus => {
	if (
		/unauthor|forbidden|401|403|denied|authentication required|invalid username|invalid password|bad credentials/i.test(
			message,
		)
	) {
		return "misconfigured";
	}

	if (
		/timed? ?out|timeout|econnrefused|econnreset|enotfound|eai_again|network|fetch failed|certificate|self.signed|tls|could not resolve|refused the connection|did not answer|did not accept/i.test(
			message,
		)
	) {
		return "unreachable";
	}

	return "degraded";
};

export const REGISTRY_REQUEST_TIMEOUT_MS = 10_000;

const endpointHost = (url: string) => {
	try {
		return new URL(url).host;
	} catch {
		return url;
	}
};

/**
 * Turns a low-level `fetch` failure into something a user can act on.
 *
 * A registry probe can fail before any HTTP exchange happens — DNS, TCP, TLS —
 * and the runtime reports all of those as an opaque `fetch failed`. The status,
 * the message and the remediation the Console shows all depend on knowing which
 * one it was, so the cause is classified here and the endpoint is always named.
 */
export const describeRegistryNetworkError = (
	url: string,
	error: unknown,
): string => {
	const host = endpointHost(url);
	const failure = error as
		| { name?: string; cause?: { code?: string; message?: string } }
		| undefined;
	const code = failure?.cause?.code ?? "";
	const name = failure?.name ?? "";

	if (name === "TimeoutError" || name === "AbortError") {
		return `${host} did not answer within ${REGISTRY_REQUEST_TIMEOUT_MS / 1000} seconds.`;
	}

	switch (code) {
		case "ENOTFOUND":
		case "EAI_AGAIN":
			return `The Notploy server could not resolve ${host}. Check the endpoint and the DNS configuration of the server running Notploy.`;
		case "ECONNREFUSED":
			return `${host} refused the connection. Check that the registry is running and that its port is reachable from the Notploy server.`;
		case "ECONNRESET":
			return `The connection to ${host} was reset before the registry answered.`;
		case "ETIMEDOUT":
		case "UND_ERR_CONNECT_TIMEOUT":
			return `${host} did not accept the connection in time. Check the network path and any firewall in front of the registry.`;
		case "CERT_HAS_EXPIRED":
		case "DEPTH_ZERO_SELF_SIGNED_CERT":
		case "SELF_SIGNED_CERT_IN_CHAIN":
		case "UNABLE_TO_VERIFY_LEAF_SIGNATURE":
			return `The TLS certificate of ${host} could not be verified. Install its certificate authority on the Notploy server, or serve a trusted certificate.`;
		default:
			return `${host} could not be reached${
				failure?.cause?.message ? `: ${failure.cause.message}` : "."
			}`;
	}
};

/** `fetch` with a bounded timeout so a slow registry cannot hang the probe. */
export const registryFetch = async (url: string, init: RequestInit = {}) =>
	await fetch(url, {
		...init,
		signal: AbortSignal.timeout(REGISTRY_REQUEST_TIMEOUT_MS),
	});
