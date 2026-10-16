import { join } from "node:path";
import { paths } from "@notploy/server/constants";
import type { apiGitlabTestConnection } from "@notploy/server/db/schema";
import {
	findGitlabById,
	type Gitlab,
	updateGitlab,
} from "@notploy/server/services/gitlab";
import type { InferResultType } from "@notploy/server/types/with";
import { TRPCError } from "@trpc/server";
import { quote } from "shell-quote";
import type { z } from "zod";
import {
	type GitProviderAdapter,
	type GitProviderRepositoryRef,
	GIT_PROVIDER_REQUEST_TIMEOUT_MS,
	fullGitCapabilities,
} from "./types";

export const refreshGitlabToken = async (gitlabProviderId: string) => {
	const gitlabProvider = await findGitlabById(gitlabProviderId);
	const currentTime = Math.floor(Date.now() / 1000);

	const safetyMargin = 60;
	if (
		gitlabProvider.expiresAt &&
		currentTime + safetyMargin < gitlabProvider.expiresAt
	) {
		return;
	}

	// Use internal URL for token refresh when GitLab is on same instance as Notploy
	const baseUrl = gitlabProvider.gitlabInternalUrl || gitlabProvider.gitlabUrl;
	const response = await fetch(`${baseUrl}/oauth/token`, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			grant_type: "refresh_token",
			refresh_token: gitlabProvider.refreshToken as string,
			client_id: gitlabProvider.applicationId as string,
			client_secret: gitlabProvider.secret as string,
		}),
	});

	if (!response.ok) {
		throw new Error(`Failed to refresh token: ${response.statusText}`);
	}

	const data = await response.json();

	const expiresAt = data.expires_in
		? Math.floor(Date.now() / 1000) + data.expires_in
		: null;

	await updateGitlab(gitlabProviderId, {
		accessToken: data.access_token,
		refreshToken: data.refresh_token,
		expiresAt,
	});
	return data;
};

export const haveGitlabRequirements = (gitlabProvider: Gitlab) => {
	return !!(gitlabProvider?.accessToken && gitlabProvider?.refreshToken);
};

const getErrorCloneRequirements = (entity: {
	gitlabRepository?: string | null;
	gitlabOwner?: string | null;
	gitlabBranch?: string | null;
	gitlabPathNamespace?: string | null;
}) => {
	const reasons: string[] = [];
	const { gitlabBranch, gitlabOwner, gitlabRepository, gitlabPathNamespace } =
		entity;

	if (!gitlabRepository) reasons.push("1. Repository not assigned.");
	if (!gitlabOwner) reasons.push("2. Owner not specified.");
	if (!gitlabBranch) reasons.push("3. Branch not defined.");
	if (!gitlabPathNamespace) reasons.push("4. Path namespace not defined.");

	return reasons;
};

export type ApplicationWithGitlab = InferResultType<
	"applications",
	{ gitlab: true }
>;

export type ComposeWithGitlab = InferResultType<"compose", { gitlab: true }>;

export type GitlabInfo =
	| ApplicationWithGitlab["gitlab"]
	| ComposeWithGitlab["gitlab"];

const getGitlabRepoClone = (
	gitlab: GitlabInfo,
	gitlabPathNamespace: string | null,
) => {
	const url = gitlab?.gitlabInternalUrl || gitlab?.gitlabUrl;
	const repoClone = `${url?.replace(/^https?:\/\//, "")}/${gitlabPathNamespace}.git`;
	return repoClone;
};

const getGitlabCloneUrl = (gitlab: GitlabInfo, repoClone: string) => {
	const url = gitlab?.gitlabInternalUrl || gitlab?.gitlabUrl;
	const isSecure = url?.startsWith("https://");
	const cloneUrl = `http${isSecure ? "s" : ""}://oauth2:${gitlab?.accessToken}@${repoClone}`;
	return cloneUrl;
};

interface CloneGitlabRepository {
	appName: string;
	gitlabBranch: string | null;
	gitlabId: string | null;
	gitlabPathNamespace: string | null;
	enableSubmodules: boolean;
	serverId: string | null;
	type?: "application" | "compose";
	outputPathOverride?: string;
}

export const cloneGitlabRepository = async ({
	type = "application",
	...entity
}: CloneGitlabRepository) => {
	let command = "set -e;";
	const {
		appName,
		gitlabBranch,
		gitlabId,
		gitlabPathNamespace,
		enableSubmodules,
		serverId,
		outputPathOverride,
	} = entity;
	const { COMPOSE_PATH, APPLICATIONS_PATH } = paths(!!serverId);

	if (!gitlabId) {
		command += `echo "Error: ❌ Gitlab Provider not found"; exit 1;`;
		return command;
	}

	await refreshGitlabToken(gitlabId);
	const gitlab = await findGitlabById(gitlabId);

	const requirements = getErrorCloneRequirements(entity);

	// Check if requirements are met
	if (requirements.length > 0) {
		command += `echo "❌ [ERROR] GitLab Repository configuration failed for application: ${appName}"; echo "Reasons:"; echo "${requirements.join("\n")}"; exit 1;`;
		return command;
	}

	const basePath = type === "compose" ? COMPOSE_PATH : APPLICATIONS_PATH;
	const outputPath = outputPathOverride ?? join(basePath, appName, "code");
	command += `rm -rf ${outputPath};`;
	command += `mkdir -p ${outputPath};`;
	const repoClone = getGitlabRepoClone(gitlab, gitlabPathNamespace);
	const cloneUrl = getGitlabCloneUrl(gitlab, repoClone);
	command += `echo ${quote([`Cloning Repo ${repoClone} to ${outputPath}: ✅`])};`;
	command += `git clone --branch ${quote([String(gitlabBranch ?? "")])} --depth 1 ${enableSubmodules ? "--recurse-submodules" : ""} ${quote([String(cloneUrl ?? "")])} ${quote([String(outputPath ?? "")])} --progress;`;
	return command;
};

export const getGitlabRepositories = async (gitlabId?: string) => {
	if (!gitlabId) {
		return [];
	}

	await refreshGitlabToken(gitlabId);

	const gitlabProvider = await findGitlabById(gitlabId);

	const allProjects = await validateGitlabProvider(gitlabProvider);

	const filteredRepos = allProjects.filter((repo: any) => {
		const { full_path, kind } = repo.namespace;
		const groupName = gitlabProvider.groupName?.toLowerCase();

		if (groupName) {
			return groupName
				.split(",")
				.some((name: string) =>
					full_path.toLowerCase().startsWith(name.trim().toLowerCase()),
				);
		}
		return kind === "user";
	});
	const mappedRepositories = filteredRepos.map((repo: any) => {
		return {
			id: repo.id,
			name: repo.name,
			url: repo.path_with_namespace,
			owner: {
				username: repo.namespace.path,
			},
		};
	});

	return mappedRepositories as {
		id: number;
		name: string;
		url: string;
		owner: {
			username: string;
		};
	}[];
};

export const getGitlabBranches = async (input: {
	id?: number;
	gitlabId?: string;
	owner: string;
	repo: string;
}) => {
	if (!input.gitlabId || !input.id || input.id === 0) {
		return [];
	}

	const gitlabProvider = await findGitlabById(input.gitlabId);

	const allBranches = [];
	let page = 1;
	const perPage = 100; // GitLab's max per page is 100
	const baseUrl = (
		gitlabProvider.gitlabInternalUrl || gitlabProvider.gitlabUrl
	).replace(/\/+$/, "");

	while (true) {
		const branchesResponse = await fetch(
			`${baseUrl}/api/v4/projects/${input.id}/repository/branches?page=${page}&per_page=${perPage}`,
			{
				headers: {
					Authorization: `Bearer ${gitlabProvider.accessToken}`,
				},
			},
		);

		if (!branchesResponse.ok) {
			throw new Error(
				`Failed to fetch branches: ${branchesResponse.statusText}`,
			);
		}

		const branches = await branchesResponse.json();

		if (branches.length === 0) {
			break;
		}

		allBranches.push(...branches);
		page++;

		// Check if we've reached the total using headers (optional optimization)
		const total = branchesResponse.headers.get("x-total");
		if (total && allBranches.length >= Number.parseInt(total)) {
			break;
		}
	}

	return allBranches as {
		id: string;
		name: string;
		commit: {
			id: string;
		};
	}[];
};

export const testGitlabConnection = async (
	input: z.infer<typeof apiGitlabTestConnection>,
) => {
	const { gitlabId, groupName } = input;

	if (!gitlabId) {
		throw new Error("Gitlab provider not found");
	}

	await refreshGitlabToken(gitlabId);

	const gitlabProvider = await findGitlabById(gitlabId);

	const repositories = await validateGitlabProvider(gitlabProvider);

	const filteredRepos = repositories.filter((repo: any) => {
		const { full_path, kind } = repo.namespace;

		if (groupName) {
			return groupName
				.split(",")
				.some((name: string) =>
					full_path.toLowerCase().startsWith(name.trim().toLowerCase()),
				);
		}
		return kind === "user";
	});

	return filteredRepos.length;
};

export const validateGitlabProvider = async (gitlabProvider: Gitlab) => {
	try {
		const allProjects = [];
		let page = 1;
		const perPage = 100; // GitLab's max per page is 100
		const baseUrl = (
			gitlabProvider.gitlabInternalUrl || gitlabProvider.gitlabUrl
		).replace(/\/+$/, "");

		while (true) {
			const response = await fetch(
				`${baseUrl}/api/v4/projects?membership=true&page=${page}&per_page=${perPage}`,
				{
					headers: {
						Authorization: `Bearer ${gitlabProvider.accessToken}`,
					},
				},
			);

			if (!response.ok) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Failed to fetch repositories: ${response.statusText}`,
				});
			}

			const projects = await response.json();

			if (projects.length === 0) {
				break;
			}

			allProjects.push(...projects);
			page++;

			const total = response.headers.get("x-total");
			if (total && allProjects.length >= Number.parseInt(total)) {
				break;
			}
		}

		return allProjects;
	} catch (error) {
		throw error;
	}
};

/**
 * Shared request helper for the GitLab adapter.
 *
 * The internal URL is preferred when present: for a self-hosted GitLab running
 * next to Notploy it avoids a round trip through the public hostname, and it is
 * what token refresh already uses.
 */
const gitlabApiBase = (gitlabProvider: Gitlab) =>
	(gitlabProvider.gitlabInternalUrl || gitlabProvider.gitlabUrl).replace(
		/\/+$/,
		"",
	);

const gitlabFetch = async <T>(
	gitlabProvider: Gitlab,
	path: string,
	init?: RequestInit,
): Promise<T> => {
	const response = await fetch(`${gitlabApiBase(gitlabProvider)}${path}`, {
		...init,
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${gitlabProvider.accessToken}`,
			...(init?.headers ?? {}),
		},
		signal: AbortSignal.timeout(GIT_PROVIDER_REQUEST_TIMEOUT_MS),
	});

	if (!response.ok) {
		throw new TRPCError({
			code: response.status === 401 || response.status === 403 ? "UNAUTHORIZED" : "BAD_REQUEST",
			message: `GitLab API ${response.status}: ${response.statusText}`,
		});
	}

	return (await response.json()) as T;
};

type GitlabProject = {
	id: number;
	name: string;
	path_with_namespace: string;
	name_with_namespace?: string;
	default_branch?: string | null;
	visibility?: string;
	web_url?: string;
	http_url_to_repo?: string;
	ssh_url_to_repo?: string;
	last_activity_at?: string;
	namespace?: { path: string; full_path?: string };
	permissions?: { project_access?: { access_level?: number } | null } | null;
};

const normalizeGitlabProject = (project: GitlabProject) => ({
	id: String(project.id),
	fullName: project.path_with_namespace,
	owner: project.namespace?.full_path?.split("/")[0] ?? null,
	name: project.name,
	private: !!project.visibility && project.visibility !== "public",
	defaultBranch: project.default_branch ?? null,
	// GitLab branches are addressed by project id, so it has to survive.
	numericId: project.id,
	webUrl: project.web_url ?? null,
	cloneUrl: project.http_url_to_repo ?? null,
	updatedAt: project.last_activity_at ?? null,
	// 30 = Developer, 40 = Maintainer; below that the project is read-only.
	canPush:
		project.permissions?.project_access?.access_level !== undefined
			? (project.permissions?.project_access?.access_level ?? 0) >= 30
			: null,
});

/**
 * Resolves the project id a repository reference refers to.
 *
 * GitLab addresses branches and commits by numeric project id, so a reference
 * carrying only `owner/name` is resolved through the search endpoint.
 */
const resolveGitlabProjectId = async (
	gitlabProvider: Gitlab,
	repository: GitProviderRepositoryRef,
): Promise<number> => {
	if (repository.id) {
		const numeric = Number(repository.id);
		if (!Number.isNaN(numeric)) return numeric;
	}
	if (repository.numericId) return repository.numericId;

	const fullName =
		repository.fullName ??
		(repository.owner && repository.name
			? `${repository.owner}/${repository.name}`
			: null);

	if (!fullName) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "A GitLab project must be identified by its id or its path",
		});
	}

	const project = await gitlabFetch<GitlabProject>(
		gitlabProvider,
		`/api/v4/projects/${encodeURIComponent(fullName)}`,
	);

	return project.id;
};

/**
 * GitLab implementation of the normalized provider contract.
 *
 * The token is refreshed before every call, so an expired OAuth token is not
 * reported as a broken connection: the refresh either succeeds and the health
 * check passes, or fails with an `invalid_grant` the user has to fix by
 * re-authorizing.
 */
export const gitlabGitProviderAdapter: GitProviderAdapter<Gitlab> = {
	providerType: "gitlab",

	hasRequirements: haveGitlabRequirements,

	getCapabilities: () => ({
		...fullGitCapabilities,
	}),

	getUrl: (gitlabProvider) => gitlabProvider.gitlabUrl ?? null,

	getIdentity: async (gitlabProvider) => {
		if (!haveGitlabRequirements(gitlabProvider)) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "GitLab is not authorized yet",
			});
		}

		const user = await gitlabFetch<{
			username: string;
			name?: string;
			email?: string;
			avatar_url?: string;
			web_url?: string;
		}>(gitlabProvider, "/api/v4/user");

		return {
			login: user.username,
			name: user.name ?? null,
			email: user.email ?? null,
			avatarUrl: user.avatar_url ?? null,
			url: user.web_url ?? gitlabApiBase(gitlabProvider),
		};
	},

	getRepositories: async (gitlabProvider, options) => {
		if (!haveGitlabRequirements(gitlabProvider)) return [];

		const allProjects = await validateGitlabProvider(gitlabProvider);
		const filtered = filterGitlabProjects(allProjects, gitlabProvider);
		const limited = options?.limit
			? filtered.slice(0, options.limit)
			: filtered;

		return limited.map((project) => normalizeGitlabProject(project));
	},

	searchRepositories: async (gitlabProvider, query, options) => {
		const projects = await gitlabFetch<GitlabProject[]>(
			gitlabProvider,
			`/api/v4/projects?membership=true&search=${encodeURIComponent(
				query,
			)}&per_page=${Math.min(options?.limit ?? 30, 100)}`,
		);

		return projects.map((project) => normalizeGitlabProject(project));
	},

	getOrganizations: async (gitlabProvider) => {
		const groups = await gitlabFetch<
			{ id: number; name: string; full_path: string; avatar_url?: string }[]
		>(gitlabProvider, "/api/v4/groups?per_page=100");

		return groups.map((group) => ({
			id: String(group.id),
			name: group.name,
			slug: group.full_path,
			avatarUrl: group.avatar_url ?? null,
		}));
	},

	getBranches: async (gitlabProvider, repository) => {
		const projectId = await resolveGitlabProjectId(gitlabProvider, repository);

		return gitlabFetch<
			{ name: string; commit: { id: string }; protected: boolean }[]
		>(
			gitlabProvider,
			`/api/v4/projects/${projectId}/repository/branches?per_page=100`,
		).then((branches) =>
			branches.map((branch) => ({
				name: branch.name,
				commitSha: branch.commit?.id ?? null,
				protected: !!branch.protected,
			})),
		);
	},

	getCommit: async (gitlabProvider, repository, ref) => {
		const projectId = await resolveGitlabProjectId(gitlabProvider, repository);

		try {
			const commit = await gitlabFetch<{
				id: string;
				short_id: string;
				title?: string;
				message?: string;
				author_name?: string;
				authored_date?: string;
				web_url?: string;
			}>(gitlabProvider, `/api/v4/projects/${projectId}/repository/commits/${ref}`);

			return {
				sha: commit.id,
				shortSha: commit.short_id,
				message: commit.message ?? commit.title ?? null,
				author: commit.author_name ?? null,
				committedAt: commit.authored_date ?? null,
				webUrl: commit.web_url ?? null,
			};
		} catch (error) {
			if ((error as { code?: string })?.code === "BAD_REQUEST") return null;
			throw error;
		}
	},

	getRepositoryPermissions: async (gitlabProvider, repository) => {
		const projectId = await resolveGitlabProjectId(gitlabProvider, repository);

		try {
			const project = await gitlabFetch<GitlabProject>(
				gitlabProvider,
				`/api/v4/projects/${projectId}`,
			);
			const accessLevel = project.permissions?.project_access?.access_level;
			return {
				pull: accessLevel !== undefined,
				push: (accessLevel ?? 0) >= 30,
			};
		} catch (error) {
			if ((error as { code?: string })?.code === "BAD_REQUEST") return null;
			throw error;
		}
	},

	testConnection: async (gitlabProvider) => {
		if (!haveGitlabRequirements(gitlabProvider)) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "GitLab is not authorized yet",
			});
		}

		const allProjects = await validateGitlabProvider(gitlabProvider);

		return {
			repositoryCount: filterGitlabProjects(allProjects, gitlabProvider).length,
		};
	},
};

/**
 * Applies the provider's group filter, the same rule the dashboard has always
 * used: without a group only the user's own projects are in scope.
 */
const filterGitlabProjects = (projects: unknown[], gitlabProvider: Gitlab) => {
	const groupName = gitlabProvider.groupName?.toLowerCase();

	return (projects as GitlabProject[]).filter((project) => {
		const fullPath = project.path_with_namespace;
		if (!fullPath) return false;

		if (groupName) {
			return groupName
				.split(",")
				.some((name: string) =>
					fullPath.toLowerCase().startsWith(name.trim().toLowerCase()),
				);
		}

		return fullPath.split("/").length === 2;
	});
};
