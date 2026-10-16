import { join } from "node:path";
import { paths } from "@notploy/server/constants";
import type {
	apiBitbucketTestConnection,
	apiFindBitbucketBranches,
} from "@notploy/server/db/schema";
import {
	type Bitbucket,
	findBitbucketById,
} from "@notploy/server/services/bitbucket";
import type { InferResultType } from "@notploy/server/types/with";
import { TRPCError } from "@trpc/server";
import { quote } from "shell-quote";
import type { z } from "zod";
import {
	type GitProviderAdapter,
	type GitProviderRepository,
	type GitProviderRepositoryRef,
	GIT_PROVIDER_REQUEST_TIMEOUT_MS,
	noGitCapabilities,
} from "./types";

export type ApplicationWithBitbucket = InferResultType<
	"applications",
	{ bitbucket: true }
>;

export type ComposeWithBitbucket = InferResultType<
	"compose",
	{ bitbucket: true }
>;

export const getBitbucketCloneUrl = (
	bitbucketProvider: {
		apiToken?: string | null;
		bitbucketUsername?: string | null;
		appPassword?: string | null;
		bitbucketEmail?: string | null;
		bitbucketWorkspaceName?: string | null;
	} | null,
	repoClone: string,
) => {
	if (!bitbucketProvider) {
		throw new Error("Bitbucket provider is required");
	}

	if (bitbucketProvider.apiToken) {
		return `https://x-bitbucket-api-token-auth:${bitbucketProvider.apiToken}@${repoClone}`;
	}

	// For app passwords, use username:app_password format
	if (!bitbucketProvider.bitbucketUsername || !bitbucketProvider.appPassword) {
		throw new Error(
			"Username and app password are required when not using API token",
		);
	}
	return `https://${bitbucketProvider.bitbucketUsername}:${bitbucketProvider.appPassword}@${repoClone}`;
};

export const getBitbucketHeaders = (bitbucketProvider: Bitbucket) => {
	if (bitbucketProvider.apiToken) {
		// According to Bitbucket official docs, for API calls with API tokens:
		// "You will need both your Atlassian account email and an API token"
		// Use: {atlassian_account_email}:{api_token}

		if (!bitbucketProvider.bitbucketEmail) {
			throw new Error(
				"Atlassian account email is required when using API token for API calls",
			);
		}

		return {
			Authorization: `Basic ${Buffer.from(`${bitbucketProvider.bitbucketEmail}:${bitbucketProvider.apiToken}`).toString("base64")}`,
		};
	}

	// For app passwords, use HTTP Basic auth with username and app password
	if (!bitbucketProvider.bitbucketUsername || !bitbucketProvider.appPassword) {
		throw new Error(
			"Username and app password are required when not using API token",
		);
	}
	return {
		Authorization: `Basic ${Buffer.from(`${bitbucketProvider.bitbucketUsername}:${bitbucketProvider.appPassword}`).toString("base64")}`,
	};
};

interface CloneBitbucketRepository {
	appName: string;
	bitbucketRepository: string | null;
	bitbucketRepositorySlug?: string | null;
	bitbucketOwner: string | null;
	bitbucketBranch: string | null;
	bitbucketId: string | null;
	enableSubmodules: boolean;
	serverId: string | null;
	type?: "application" | "compose";
	outputPathOverride?: string;
}

export const cloneBitbucketRepository = async ({
	type = "application",
	...entity
}: CloneBitbucketRepository) => {
	let command = "set -e;";
	const {
		appName,
		bitbucketRepository,
		bitbucketOwner,
		bitbucketBranch,
		bitbucketId,
		enableSubmodules,
		serverId,
		outputPathOverride,
	} = entity;
	const { COMPOSE_PATH, APPLICATIONS_PATH } = paths(!!serverId);

	if (!bitbucketId) {
		command += `echo "Error: ❌ Bitbucket Provider not found"; exit 1;`;
		return command;
	}
	const bitbucket = await findBitbucketById(bitbucketId);

	if (!bitbucket) {
		command += `echo "Error: ❌ Bitbucket Provider not found"; exit 1;`;
		return command;
	}
	const basePath = type === "compose" ? COMPOSE_PATH : APPLICATIONS_PATH;
	const outputPath = outputPathOverride ?? join(basePath, appName, "code");
	command += `rm -rf ${outputPath};`;
	command += `mkdir -p ${outputPath};`;
	const repoToUse = entity.bitbucketRepositorySlug || bitbucketRepository;
	const repoclone = `bitbucket.org/${bitbucketOwner}/${repoToUse}.git`;
	const cloneUrl = getBitbucketCloneUrl(bitbucket, repoclone);
	command += `echo ${quote([`Cloning Repo ${repoclone} to ${outputPath}: ✅`])};`;
	command += `git clone --branch ${quote([String(bitbucketBranch ?? "")])} --depth 1 ${enableSubmodules ? "--recurse-submodules" : ""} ${quote([String(cloneUrl ?? "")])} ${quote([String(outputPath ?? "")])} --progress;`;
	return command;
};

export const getBitbucketRepositories = async (bitbucketId?: string) => {
	if (!bitbucketId) {
		return [];
	}
	const bitbucketProvider = await findBitbucketById(bitbucketId);

	const username =
		bitbucketProvider.bitbucketWorkspaceName ||
		bitbucketProvider.bitbucketUsername;
	let url = `https://api.bitbucket.org/2.0/repositories/${username}?pagelen=100`;
	let repositories: {
		name: string;
		url: string;
		slug: string;
		owner: { username: string };
	}[] = [];

	try {
		while (url) {
			const response = await fetch(url, {
				method: "GET",
				headers: getBitbucketHeaders(bitbucketProvider),
			});

			if (!response.ok) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Failed to fetch repositories: ${response.statusText}`,
				});
			}

			const data = await response.json();

			const mappedData = data.values.map((repo: any) => ({
				name: repo.name,
				url: repo.links.html.href,
				slug: repo.slug,
				owner: {
					username: repo.workspace.slug,
				},
			}));
			repositories = repositories.concat(mappedData);
			url = data.next || null;
		}
		return repositories;
	} catch (error) {
		throw error;
	}
};

export const getBitbucketBranches = async (
	input: z.infer<typeof apiFindBitbucketBranches>,
) => {
	if (!input.bitbucketId) {
		return [];
	}
	const bitbucketProvider = await findBitbucketById(input.bitbucketId);
	const { owner, repo } = input;
	let url = `https://api.bitbucket.org/2.0/repositories/${owner}/${repo}/refs/branches?pagelen=1`;
	let allBranches: {
		name: string;
		commit: {
			sha: string;
		};
	}[] = [];

	try {
		while (url) {
			const response = await fetch(url, {
				method: "GET",
				headers: getBitbucketHeaders(bitbucketProvider),
			});

			if (!response.ok) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `HTTP error! status: ${response.status}`,
				});
			}

			const data = await response.json();

			const mappedData = data.values.map((branch: any) => {
				return {
					name: branch.name,
					commit: {
						sha: branch.target.hash,
					},
				};
			});
			allBranches = allBranches.concat(mappedData);
			url = data.next || null;
		}

		return allBranches as {
			name: string;
			commit: {
				sha: string;
			};
		}[];
	} catch (error) {
		throw error;
	}
};

export const testBitbucketConnection = async (
	input: z.infer<typeof apiBitbucketTestConnection>,
) => {
	const bitbucketProvider = await findBitbucketById(input.bitbucketId);

	if (!bitbucketProvider) {
		throw new Error("Bitbucket provider not found");
	}

	const { bitbucketUsername, workspaceName } = input;

	const username = workspaceName || bitbucketUsername;

	const url = `https://api.bitbucket.org/2.0/repositories/${username}`;
	try {
		const response = await fetch(url, {
			method: "GET",
			headers: getBitbucketHeaders(bitbucketProvider),
		});

		if (!response.ok) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: `Failed to fetch repositories: ${response.statusText}`,
			});
		}

		const data = await response.json();

		const mappedData = data.values.map((repo: any) => {
			return {
				name: repo.name,
				url: repo.links.html.href,
				owner: {
					username: repo.workspace.slug,
				},
			};
		}) as [];

		return mappedData.length;
	} catch (error) {
		throw error;
	}
};

/**
 * Bitbucket Cloud implementation of the normalized provider contract.
 *
 * Bitbucket has no application-install model, so the connection is a static
 * Atlassian API token (or an app password) plus the workspace to act in. That
 * has two consequences the rest of Notploy has to know about: the identity is
 * the Atlassian account, and repositories are always scoped to a workspace —
 * which is why `organizations` and `webhooks` are reported as unsupported.
 */
export const bitbucketGitProviderAdapter: GitProviderAdapter<Bitbucket> = {
	providerType: "bitbucket",

	hasRequirements: (bitbucketProvider) =>
		!!(
			bitbucketProvider?.apiToken ||
			(bitbucketProvider?.bitbucketUsername && bitbucketProvider?.appPassword)
		),

	getCapabilities: () => ({
		...noGitCapabilities,
		repositories: true,
		repositorySearch: true,
		branches: true,
		commits: true,
		repositoryPermissions: true,
		privateRepositories: true,
	}),

	getUrl: () => "https://bitbucket.org",

	getIdentity: async (bitbucketProvider) => {
		const user = await bitbucketFetch<{
			username: string;
			uuid?: string;
			display_name?: string;
			nickname?: string;
		}>(bitbucketProvider, "/2.0/user");

		return {
			login: user.username,
			name: user.display_name ?? user.nickname ?? null,
			email: bitbucketProvider.bitbucketEmail ?? null,
			avatarUrl: null,
			url: "https://bitbucket.org",
		};
	},

	getRepositories: async (bitbucketProvider, options) => {
		if (!bitbucketGitProviderAdapter.hasRequirements(bitbucketProvider)) {
			return [];
		}

		const workspace = bitbucketWorkspace(bitbucketProvider);
		const perPage = Math.min(options?.limit ?? 100, 100);
		const repositories = await bitbucketPaginate<BitbucketRepository>(
			bitbucketProvider,
			`/2.0/repositories/${workspace}?pagelen=${perPage}`,
			options?.limit,
		);

		return repositories.map(normalizeBitbucketRepository);
	},

	searchRepositories: async (bitbucketProvider, query, options) => {
		const workspace = bitbucketWorkspace(bitbucketProvider);
		const perPage = Math.min(options?.limit ?? 30, 100);
		const repositories = await bitbucketPaginate<BitbucketRepository>(
			bitbucketProvider,
			`/2.0/repositories/${workspace}?q=${encodeURIComponent(
				`name~"${query}"`,
			)}&pagelen=${perPage}`,
			options?.limit,
		);

		return repositories.map(normalizeBitbucketRepository);
	},

	getBranches: async (bitbucketProvider, repository) => {
		const { workspace, repoSlug } = resolveBitbucketRepository(repository);
		const branches = await bitbucketPaginate<{
			name: string;
			target?: { hash?: string };
		}>(
			bitbucketProvider,
			`/2.0/repositories/${workspace}/${repoSlug}/refs/branches?pagelen=100`,
		);

		return branches.map((branch) => ({
			name: branch.name,
			commitSha: branch.target?.hash ?? null,
			// Bitbucket exposes protection through its own rules API, which needs
			// per-repository calls; reporting `false` is honest about not knowing.
			protected: false,
		}));
	},

	getCommit: async (bitbucketProvider, repository, ref) => {
		const { workspace, repoSlug } = resolveBitbucketRepository(repository);

		try {
			const commit = await bitbucketFetch<{
				hash: string;
				message?: string;
				author?: { raw?: string; user?: { display_name?: string } };
				date?: string;
				links?: { html?: { href?: string } };
			}>(bitbucketProvider, `/2.0/repositories/${workspace}/${repoSlug}/commit/${ref}`);

			return {
				sha: commit.hash,
				shortSha: commit.hash.slice(0, 7),
				message: commit.message ?? null,
				author: commit.author?.user?.display_name ?? commit.author?.raw ?? null,
				committedAt: commit.date ?? null,
				webUrl: commit.links?.html?.href ?? null,
			};
		} catch (error) {
			if (bitbucketIsNotFound(error)) return null;
			throw error;
		}
	},

	getRepositoryPermissions: async (bitbucketProvider, repository) => {
		const { workspace, repoSlug } = resolveBitbucketRepository(repository);

		try {
			await bitbucketFetch(
				bitbucketProvider,
				`/2.0/repositories/${workspace}/${repoSlug}`,
			);
			// Bitbucket Cloud does not expose the permission level of the token;
			// reaching the repository at all is what can be asserted.
			return { pull: true, push: false };
		} catch (error) {
			if (bitbucketIsNotFound(error)) return null;
			throw error;
		}
	},

	testConnection: async (bitbucketProvider) => {
		if (!bitbucketGitProviderAdapter.hasRequirements(bitbucketProvider)) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Bitbucket credentials are missing",
			});
		}

		const workspace = bitbucketWorkspace(bitbucketProvider);
		const repositories = await bitbucketPaginate<BitbucketRepository>(
			bitbucketProvider,
			`/2.0/repositories/${workspace}?pagelen=100`,
		);

		return { repositoryCount: repositories.length };
	},
};

type BitbucketRepository = {
	uuid?: string;
	name: string;
	slug: string;
	full_name: string;
	workspace?: { slug?: string; name?: string };
	is_private?: boolean;
	mainbranch?: { name?: string } | null;
	updated_on?: string;
	links?: { html?: { href?: string }; clone?: { name?: string; href?: string }[] };
};

const normalizeBitbucketRepository = (
	repository: BitbucketRepository,
): GitProviderRepository => {
	const workspace = repository.workspace?.slug ?? null;
	const cloneLink = repository.links?.clone?.find(
		(link) => link.name === "https",
	);

	return {
		id: repository.uuid ?? `${workspace}/${repository.slug}`,
		fullName: repository.full_name,
		owner: workspace,
		name: repository.name,
		private: !!repository.is_private,
		defaultBranch: repository.mainbranch?.name ?? null,
		numericId: null,
		webUrl: repository.links?.html?.href ?? null,
		cloneUrl: cloneLink?.href ?? null,
		updatedAt: repository.updated_on ?? null,
		canPush: null,
	};
};

const bitbucketWorkspace = (bitbucketProvider: Bitbucket) => {
	const workspace =
		bitbucketProvider.bitbucketWorkspaceName || bitbucketProvider.bitbucketUsername;

	if (!workspace) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "A Bitbucket workspace or username is required",
		});
	}

	return workspace;
};

const resolveBitbucketRepository = (
	repository: GitProviderRepositoryRef,
): { workspace: string; repoSlug: string } => {
	const parts = (repository.fullName ?? "").split("/");
	if (parts.length === 2 && parts[0] && parts[1]) {
		return { workspace: parts[0], repoSlug: parts[1] };
	}

	if (repository.owner && repository.name) {
		return { workspace: repository.owner, repoSlug: repository.name };
	}

	throw new TRPCError({
		code: "BAD_REQUEST",
		message: "A Bitbucket repository must be identified by `workspace/repo`",
	});
};

const bitbucketFetch = async <T>(
	bitbucketProvider: Bitbucket,
	path: string,
): Promise<T> => {
	const response = await fetch(`https://api.bitbucket.org${path}`, {
		method: "GET",
		headers: getBitbucketHeaders(bitbucketProvider),
		signal: AbortSignal.timeout(GIT_PROVIDER_REQUEST_TIMEOUT_MS),
	});

	if (!response.ok) {
		throw new TRPCError({
			code:
				response.status === 401 || response.status === 403
					? "UNAUTHORIZED"
					: "BAD_REQUEST",
			message: `Bitbucket API ${response.status}: ${response.statusText}`,
		});
	}

	return (await response.json()) as T;
};

/** Follows `next` until `limit` items were collected or the API stops paging. */
const bitbucketPaginate = async <T>(
	bitbucketProvider: Bitbucket,
	firstUrl: string,
	limit?: number,
): Promise<T[]> => {
	const results: T[] = [];
	let url: string | null = firstUrl;

	while (url) {
		// Annotated explicitly: inferring `page` from `url` would be circular,
		// since `url` is re-assigned from `page.next` on the next iteration.
		const page: { values?: T[]; next?: string } = await bitbucketFetch<{
			values?: T[];
			next?: string;
		}>(bitbucketProvider, url);
		results.push(...(page.values ?? []));

		if (limit && results.length >= limit) {
			return results.slice(0, limit);
		}
		url = page.next ?? null;
	}

	return results;
};

const bitbucketIsNotFound = (error: unknown) =>
	(error as { code?: string })?.code === "BAD_REQUEST" &&
	/not found/i.test((error as Error)?.message ?? "");
