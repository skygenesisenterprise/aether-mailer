/**
 * Normalized Git provider contract.
 *
 * GitHub, GitLab, Bitbucket and Gitea each speak a different dialect, but the
 * rest of Notploy must not: an Application only needs to know that a source
 * repository can be listed, searched, cloned and pinned to a ref. This module is
 * the single place where that translation is described, mirroring the DNS
 * provider adapters in `utils/dns`, so provider differences stay contained in
 * `utils/providers/<provider>.ts` instead of leaking into Projects, Applications
 * and Deployments.
 */

/**
 * Provider types a connection can be made with.
 *
 * Declared here and borrowed by the `gitProviderType` database enum, so the
 * column and the adapter registry always agree on what exists.
 */
export const gitProviderTypes = [
	"github",
	"gitlab",
	"bitbucket",
	"gitea",
] as const;

export type GitProviderType = (typeof gitProviderTypes)[number];

/**
 * What a connected provider can do.
 *
 * Capabilities are declared instead of probed: the settings page and the
 * repository selector use them to hide what a provider cannot do, rather than
 * letting a user pick an option that then fails at deploy time.
 */
export const gitProviderCapabilities = [
	/** List the repositories the connection can access. */
	"repositories",
	/** Search repositories server-side. */
	"repositorySearch",
	/** List the branches of a repository. */
	"branches",
	/** Resolve a ref (branch, tag, sha) to a commit. */
	"commits",
	/** Report whether the connection may push to a repository. */
	"repositoryPermissions",
	/** List the organizations / groups / workspaces of the connection. */
	"organizations",
	/** Repositories of an organization, not only of the connected user. */
	"organizationRepositories",
	/** Private repositories are part of the repository list. */
	"privateRepositories",
	/** Receive provider webhooks for push and pull request events. */
	"webhooks",
	/** Application or installation based authorization (GitHub Apps, OAuth). */
	"appAuthorization",
] as const;

export type GitProviderCapability = (typeof gitProviderCapabilities)[number];

export type GitProviderCapabilityMatrix = Record<GitProviderCapability, boolean>;

export const gitProviderCapabilityLabels: Record<
	GitProviderCapability,
	string
> = {
	repositories: "Repositories",
	repositorySearch: "Repository search",
	branches: "Branches",
	commits: "Commits",
	repositoryPermissions: "Repository permissions",
	organizations: "Organizations",
	organizationRepositories: "Organization repositories",
	privateRepositories: "Private repositories",
	webhooks: "Webhooks",
	appAuthorization: "App authorization",
};

const allCapabilities = (value: boolean): GitProviderCapabilityMatrix =>
	Object.fromEntries(
		gitProviderCapabilities.map((capability) => [capability, value]),
	) as GitProviderCapabilityMatrix;

/** Every capability disabled — the safe default for an unknown adapter. */
export const noGitCapabilities = allCapabilities(false);

/** Every capability enabled. */
export const fullGitCapabilities = allCapabilities(true);

/**
 * Health of a connection.
 *
 * `connected` is stronger than "the API answered 200": it means the connection
 * can actually list repositories, which is what deploying from a source
 * repository requires. The other three states are what the user has to act on,
 * and each one maps to a different fix, so they are kept distinct:
 *
 * - `needsAuthorization`: the credentials are incomplete (no GitHub App
 *   installation, no OAuth token). Re-installing or re-authorizing is the fix.
 * - `misconfigured`: the connection exists but the provider rejects it (expired
 *   or revoked token, wrong secret). Reconnecting is the fix.
 * - `unreachable`: the provider itself could not be contacted.
 */
export type GitProviderHealthStatus =
	| "connected"
	| "needsAuthorization"
	| "misconfigured"
	| "unreachable";

export interface GitProviderHealth {
	status: GitProviderHealthStatus;
	checkedAt: string;
	/** Round-trip time of the probe, when one could be measured. */
	latencyMs: number | null;
	/** Actionable explanation, safe to show to the user. */
	message: string | null;
	/** What the user has to do, when the status is not `connected`. */
	remediation: string | null;
	/** Number of accessible repositories, when they could be listed. */
	repositoryCount?: number;
	/** Identity the connection acts as, when it could be resolved. */
	identity?: GitProviderIdentity | null;
	capabilities: GitProviderCapabilityMatrix;
}

/** Account the connection acts as. */
export interface GitProviderIdentity {
	/** Login, username or workspace slug. */
	login: string;
	name: string | null;
	email: string | null;
	avatarUrl: string | null;
	/** Base URL of the provider, which may be self-hosted. */
	url: string | null;
}

/** Organization, group or workspace owning repositories. */
export interface GitProviderOrganization {
	id: string;
	name: string;
	slug: string | null;
	avatarUrl: string | null;
}

/** A repository, normalized across providers. */
export interface GitProviderRepository {
	/** Provider-specific identifier, kept as a string so it survives JSON. */
	id: string;
	/** `owner/name` when the provider has namespaces, the plain name otherwise. */
	fullName: string;
	owner: string | null;
	name: string;
	private: boolean;
	defaultBranch: string | null;
	/** Provider-specific project id needed by some APIs (GitLab, Gitea). */
	numericId: number | null;
	webUrl: string | null;
	cloneUrl: string | null;
	updatedAt: string | null;
	/** Set when the connection may push; `null` when not reported. */
	canPush: boolean | null;
}

/**
 * Reference to a repository accepted by the contract.
 *
 * `fullName` is the human form (`owner/name`); providers that need their own id
 * (GitLab project id, Gitea id) get it through `id`, which callers already have
 * from the repository list.
 */
export interface GitProviderRepositoryRef {
	fullName?: string;
	owner?: string;
	name?: string;
	id?: string;
	/** Providers that address sub-resources by numeric id (GitLab, Gitea). */
	numericId?: number | null;
}

export interface GitProviderBranch {
	name: string;
	commitSha: string | null;
	protected: boolean;
}

export interface GitProviderCommit {
	sha: string;
	shortSha: string;
	message: string | null;
	author: string | null;
	committedAt: string | null;
	webUrl: string | null;
}

export interface GitProviderListOptions {
	/** Cap on returned items; adapters paginate internally until this is met. */
	limit?: number;
}

/**
 * The contract every Git provider implements.
 *
 * Methods are optional: a provider that cannot answer a question simply leaves
 * it out and declares the matching capability as `false`. Callers must therefore
 * check `getCapabilities()` instead of assuming a method exists — which is why
 * every optional method is guarded by a capability.
 */
export interface GitProviderAdapter<C = unknown> {
	readonly providerType: GitProviderType;
	/**
	 * True when the stored credentials are complete enough to attempt a call.
	 * A `false` here means "needs authorization", not "broken".
	 */
	hasRequirements(config: C): boolean;
	getCapabilities(): GitProviderCapabilityMatrix;
	/** Base URL of the provider, which may be a self-hosted instance. */
	getUrl(config: C): string | null;
	getIdentity(config: C): Promise<GitProviderIdentity>;
	getRepositories(
		config: C,
		options?: GitProviderListOptions,
	): Promise<GitProviderRepository[]>;
	searchRepositories?: (
		config: C,
		query: string,
		options?: GitProviderListOptions,
	) => Promise<GitProviderRepository[]>;
	getOrganizations?(config: C): Promise<GitProviderOrganization[]>;
	getBranches(
		config: C,
		repository: GitProviderRepositoryRef,
	): Promise<GitProviderBranch[]>;
	getCommit?(
		config: C,
		repository: GitProviderRepositoryRef,
		ref: string,
	): Promise<GitProviderCommit | null>;
	getRepositoryPermissions?(
		config: C,
		repository: GitProviderRepositoryRef,
	): Promise<{ pull: boolean; push: boolean } | null>;
	/**
	 * Cheap probe used by the health check. It must verify something meaningful
	 * (listing repositories), not just reach the host.
	 */
	testConnection(config: C): Promise<{ repositoryCount: number }>;
}

/**
 * Configuration handed to an adapter: the provider row plus its own credential
 * table. `type` carries the `providerType` so one generic loader can hand the
 * right adapter the right shape.
 */
export type GitProviderConfigOf<C> = C & { type: GitProviderType };

/**
 * Classifies a failed health probe.
 *
 * Kept pure (and exported) so the mapping is unit-testable: providers fail with
 * wildly different messages, and the user-facing status has to stay stable.
 */
export const classifyGitProviderFailure = (
	message: string,
): GitProviderHealthStatus => {
	// The provider was reached but refused the credentials.
	if (
		/unauthor|forbidden|401|403|bad credentials|invalid token|token expired|revoked|installation|not installed|invalid_grant|invalid api key/i.test(
			message,
		)
	) {
		return "misconfigured";
	}

	// The provider could not be contacted at all.
	if (
		/failed to fetch|fetch failed|enotfound|econnrefused|eai_again|etimedout|timeout|socket hang up|network|dns|getaddrinfo|certificate/i.test(
			message,
		)
	) {
		return "unreachable";
	}

	// Anything else is an error we cannot classify; treat it as unreachable so
	// the page shows a retry rather than claiming the connection is fine.
	return "unreachable";
};

/** Message shown when the credentials are incomplete. */
export const gitProviderAuthorizationMessages: Record<
	GitProviderType,
	string
> = {
	github: "Install the GitHub App on the account or organization whose repositories should be deployable.",
	gitlab: "Authorize Notploy again to grant access to your GitLab projects.",
	bitbucket: "Add an Atlassian API token (and account email) to reach the workspace repositories.",
	gitea: "Authorize Notploy again to grant access to your Gitea instance.",
};

/** Provider timeout for a health probe, so the page never hangs. */
export const GIT_PROVIDER_REQUEST_TIMEOUT_MS = 15_000;