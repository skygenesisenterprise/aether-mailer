import type { gitProvider } from "@notploy/server/db/schema";
import { bitbucketGitProviderAdapter } from "./bitbucket";
import { giteaGitProviderAdapter } from "./gitea";
import { githubGitProviderAdapter } from "./github";
import { gitlabGitProviderAdapter } from "./gitlab";
import {
	type GitProviderAdapter,
	type GitProviderCapabilityMatrix,
	type GitProviderType,
	gitProviderTypes,
	noGitCapabilities,
} from "./types";

/**
 * Registry of the normalized Git provider adapters, mirroring
 * `utils/dns/index.ts`.
 *
 * Every consumer of a source repository — the settings page, the application
 * repository selector, the deployment pipeline, the CI/CD API — goes through
 * this registry, so adding a provider is a value plus an adapter and never a
 * new `if (provider === ...)` chain in the Product/Application/Deployment code.
 */
const adapters = {
	github: githubGitProviderAdapter,
	gitlab: gitlabGitProviderAdapter,
	bitbucket: bitbucketGitProviderAdapter,
	gitea: giteaGitProviderAdapter,
} as const satisfies Record<GitProviderType, GitProviderAdapter<never>>;

export type GitProviderRow = typeof gitProvider.$inferSelect;

export const getGitProviderAdapter = <C = unknown>(
	providerType: GitProviderType,
): GitProviderAdapter<C> => {
	const adapter = adapters[providerType];

	if (!adapter) {
		// Unknown provider: a client with no capabilities rather than a crash, so
		// the UI can still render the connection and explain it is unsupported.
		return {
			providerType,
			hasRequirements: () => false,
			getCapabilities: () => noGitCapabilities,
			getUrl: () => null,
			getIdentity: async () => {
				throw new Error(`Git provider "${providerType}" is not supported`);
			},
			getRepositories: async () => [],
			getBranches: async () => [],
			testConnection: async () => {
				throw new Error(`Git provider "${providerType}" is not supported`);
			},
		};
	}

	return adapter as unknown as GitProviderAdapter<C>;
};

export const getGitProviderCapabilities = (
	providerType: GitProviderType,
): GitProviderCapabilityMatrix => getGitProviderAdapter(providerType).getCapabilities();

/**
 * Providers that can be connected, with what each of them supports. The settings
 * page renders this even before a provider exists, so a user can see whether
 * their Git host is usable before filling in a form.
 */
export interface GitProviderDescriptor {
	providerType: GitProviderType;
	label: string;
	capabilities: GitProviderCapabilityMatrix;
	/** Requires an application install or an OAuth grant instead of a token. */
	requiresAppAuthorization: boolean;
}

export const gitProviderLabels: Record<GitProviderType, string> = {
	github: "GitHub",
	gitlab: "GitLab",
	bitbucket: "Bitbucket",
	gitea: "Gitea",
};

export const listGitProviderDescriptors = (): GitProviderDescriptor[] =>
	gitProviderTypes.map((providerType) => {
		const capabilities = getGitProviderCapabilities(providerType);
		return {
			providerType,
			label: gitProviderLabels[providerType],
			capabilities,
			requiresAppAuthorization: capabilities.appAuthorization,
		};
	});

export * from "./types";