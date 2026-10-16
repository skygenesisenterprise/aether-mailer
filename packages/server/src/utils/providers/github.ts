import { join } from "node:path";
import { paths } from "@notploy/server/constants";
import type { apiFindGithubBranches } from "@notploy/server/db/schema";
import { findGithubById, type Github } from "@notploy/server/services/github";
import type { InferResultType } from "@notploy/server/types/with";
import { createAppAuth } from "@octokit/auth-app";
import { TRPCError } from "@trpc/server";
import { Octokit } from "octokit";
import { quote } from "shell-quote";
import type { z } from "zod";
import {
	type GitProviderAdapter,
	type GitProviderRepositoryRef,
	fullGitCapabilities,
} from "./types";

export const DEFAULT_GITHUB_URL = "https://github.com";
export const DEFAULT_GITHUB_API_URL = "https://api.github.com";

export const parseGithubBaseUrl = (
	githubUrl?: string | null,
): { url: string } | { error: string } => {
	const raw = githubUrl?.trim();
	if (!raw) {
		return { url: DEFAULT_GITHUB_URL };
	}

	const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw)
		? raw
		: `https://${raw}`;

	let parsed: URL;
	try {
		parsed = new URL(withScheme);
	} catch {
		return { error: `"${raw}" is not a valid URL` };
	}

	if (parsed.protocol !== "https:") {
		return { error: "Only https is supported for GitHub instances" };
	}

	// "acme.ghe.com." resolves the same as "acme.ghe.com", but the trailing dot
	// would slip past the checks below.
	if (parsed.hostname.endsWith(".")) {
		parsed.hostname = parsed.hostname.replace(/\.+$/, "");
	}

	const { hostname } = parsed;

	if (!hostname.includes(".")) {
		return { error: `"${hostname}" is not a fully qualified hostname` };
	}

	return { url: `${parsed.protocol}//${parsed.host}` };
};

export const normalizeGithubUrl = (githubUrl?: string | null): string => {
	const result = parseGithubBaseUrl(githubUrl);
	return "url" in result ? result.url : DEFAULT_GITHUB_URL;
};

export const deriveGithubApiUrl = (githubUrl?: string | null): string => {
	const normalized = normalizeGithubUrl(githubUrl);
	const { protocol, host } = new URL(normalized);

	if (host === "github.com" || host === "www.github.com") {
		return DEFAULT_GITHUB_API_URL;
	}

	// Data residency tenants keep the api. prefix; GHES does not have one.
	if (host === "ghe.com" || host.endsWith(".ghe.com")) {
		return `${protocol}//api.${host}`;
	}

	return `${protocol}//${host}/api/v3`;
};

export const authGithub = (githubProvider: Github): Octokit => {
	if (!haveGithubRequirements(githubProvider)) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Github Account not configured correctly",
		});
	}

	const octokit: Octokit = new Octokit({
		authStrategy: createAppAuth,
		auth: {
			appId: githubProvider?.githubAppId || 0,
			privateKey: githubProvider?.githubPrivateKey || "",
			installationId: githubProvider?.githubInstallationId,
		},
		baseUrl: deriveGithubApiUrl(githubProvider?.githubUrl),
	});

	return octokit;
};

export const getGithubToken = async (
	octokit: ReturnType<typeof authGithub>,
) => {
	const installation = (await octokit.auth({
		type: "installation",
	})) as {
		token: string;
	};

	return installation.token;
};

/**
 * Check if a GitHub user has write/admin permissions on a repository
 * This is used to validate PR authors before allowing preview deployments
 */
export const checkUserRepositoryPermissions = async (
	githubProvider: Github,
	owner: string,
	repo: string,
	username: string,
): Promise<{ hasWriteAccess: boolean; permission: string | null }> => {
	try {
		const octokit = authGithub(githubProvider);

		// Check if user is a collaborator with write permissions
		const { data: permission } =
			await octokit.rest.repos.getCollaboratorPermissionLevel({
				owner,
				repo,
				username,
			});

		// Allow only users with 'write', 'admin', or 'maintain' permissions
		// Currently exists Read, Triage, Write, Maintain, Admin
		const allowedPermissions = ["write", "admin", "maintain"];
		const hasWriteAccess = allowedPermissions.includes(permission.permission);

		return {
			hasWriteAccess,
			permission: permission.permission,
		};
	} catch (error) {
		// If user is not a collaborator, GitHub API returns 404
		console.warn(
			`User ${username} is not a collaborator of ${owner}/${repo}:`,
			error,
		);
		return {
			hasWriteAccess: false,
			permission: null,
		};
	}
};

export const haveGithubRequirements = (githubProvider: Github) => {
	return !!(
		githubProvider?.githubAppId &&
		githubProvider?.githubPrivateKey &&
		githubProvider?.githubInstallationId
	);
};

const getErrorCloneRequirements = (entity: {
	repository?: string | null;
	owner?: string | null;
	branch?: string | null;
}) => {
	const reasons: string[] = [];
	const { repository, owner, branch } = entity;

	if (!repository) reasons.push("1. Repository not assigned.");
	if (!owner) reasons.push("2. Owner not specified.");
	if (!branch) reasons.push("3. Branch not defined.");

	return reasons;
};

export type ApplicationWithGithub = InferResultType<
	"applications",
	{ github: true }
>;

export type ComposeWithGithub = InferResultType<"compose", { github: true }>;

interface CloneGithubRepository {
	appName: string;
	owner: string | null;
	branch: string | null;
	githubId: string | null;
	repository: string | null;
	type?: "application" | "compose";
	enableSubmodules: boolean;
	serverId: string | null;
	outputPathOverride?: string;
	/**
	 * Build this exact revision instead of the tip of `branch`.
	 *
	 * A shallow clone cannot contain an arbitrary commit, so the revision is
	 * fetched on its own afterwards. Used by the CI/CD API so a workflow deploys
	 * the commit it was triggered for instead of whatever the branch points at.
	 */
	commitSha?: string;
}
export const cloneGithubRepository = async ({
	type = "application",
	...entity
}: CloneGithubRepository) => {
	let command = "set -e;";
	const isCompose = type === "compose";
	const {
		appName,
		repository,
		owner,
		branch,
		githubId,
		enableSubmodules,
		serverId,
		outputPathOverride,
		commitSha,
	} = entity;
	const { APPLICATIONS_PATH, COMPOSE_PATH } = paths(!!serverId);

	if (!githubId) {
		command += `echo "Error: ❌ Github Provider not found"; exit 1;`;

		return command;
	}

	const requirements = getErrorCloneRequirements(entity);

	// Check if requirements are met
	if (requirements.length > 0) {
		command += `echo "GitHub Repository configuration failed for application: ${appName}"; echo "Reasons:"; echo "${requirements.join("\n")}"; exit 1;`;
		return command;
	}

	const githubProvider = await findGithubById(githubId);
	const basePath = isCompose ? COMPOSE_PATH : APPLICATIONS_PATH;
	const outputPath = outputPathOverride ?? join(basePath, appName, "code");
	const octokit = authGithub(githubProvider);
	const token = await getGithubToken(octokit);
	const cloneBase = new URL(normalizeGithubUrl(githubProvider.githubUrl));
	const repoclone = `${cloneBase.host}/${owner}/${repository}.git`;
	command += `rm -rf ${outputPath};`;
	command += `mkdir -p ${outputPath};`;
	const cloneUrl = `${cloneBase.protocol}//oauth2:${token}@${repoclone}`;

	command += `echo ${quote([`Cloning Repo ${repoclone} to ${outputPath}: ✅`])};`;
	command += `git clone --branch ${quote([String(branch ?? "")])} --depth 1 ${enableSubmodules ? "--recurse-submodules" : ""} ${quote([String(cloneUrl ?? "")])} ${quote([String(outputPath ?? "")])} --progress;`;

	if (commitSha) {
		command += `echo ${quote([`Checking out commit ${commitSha}: ✅`])};`;
		command += `cd ${quote([String(outputPath)])};`;
		command += `git fetch --depth 1 origin ${quote([commitSha])};`;
		command += `git checkout FETCH_HEAD;`;
		command += `git reset --hard FETCH_HEAD;`;
		command += `git submodule update --init --recursive 2>/dev/null || true;`;
	}

	return command;
};

export const getGithubRepositories = async (githubId?: string) => {
	if (!githubId) {
		return [];
	}

	const githubProvider = await findGithubById(githubId);

	const octokit = new Octokit({
		authStrategy: createAppAuth,
		auth: {
			appId: githubProvider.githubAppId,
			privateKey: githubProvider.githubPrivateKey,
			installationId: githubProvider.githubInstallationId,
		},
		baseUrl: deriveGithubApiUrl(githubProvider.githubUrl),
	});

	const repositories = (await octokit.paginate(
		octokit.rest.apps.listReposAccessibleToInstallation,
	)) as unknown as Awaited<
		ReturnType<typeof octokit.rest.apps.listReposAccessibleToInstallation>
	>["data"]["repositories"];

	return repositories;
};

export const getGithubBranches = async (
	input: z.infer<typeof apiFindGithubBranches>,
) => {
	if (!input.githubId) {
		return [];
	}
	const githubProvider = await findGithubById(input.githubId);

	const octokit = new Octokit({
		authStrategy: createAppAuth,
		auth: {
			appId: githubProvider.githubAppId,
			privateKey: githubProvider.githubPrivateKey,
			installationId: githubProvider.githubInstallationId,
		},
		baseUrl: deriveGithubApiUrl(githubProvider.githubUrl),
	});

	const branches = (await octokit.paginate(octokit.rest.repos.listBranches, {
		owner: input.owner,
		repo: input.repo,
	})) as unknown as Awaited<
		ReturnType<typeof octokit.rest.repos.listBranches>
	>["data"];

	return branches;
};

/**
 * GitHub implementation of the normalized provider contract.
 *
 * Auth is a GitHub App installation, so the identity is the account the app is
 * installed on (fetched with a JWT, since installation tokens cannot read
 * `/app/installations`). Repositories come from the installation, which is
 * exactly the set Notploy is allowed to deploy from.
 */
export const githubGitProviderAdapter: GitProviderAdapter<Github> = {
	providerType: "github",

	hasRequirements: haveGithubRequirements,

	getCapabilities: () => ({
		...fullGitCapabilities,
	}),

	getUrl: (githubProvider) => normalizeGithubUrl(githubProvider.githubUrl),

	getIdentity: async (githubProvider) => {
		if (!haveGithubRequirements(githubProvider)) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "The GitHub App is not installed yet",
			});
		}

		const baseUrl = deriveGithubApiUrl(githubProvider.githubUrl);
		const octokit = new Octokit({
			authStrategy: createAppAuth,
			auth: {
				appId: githubProvider.githubAppId,
				privateKey: githubProvider.githubPrivateKey,
			},
			baseUrl,
		});

		const { data } = await octokit.rest.apps.getInstallation({
			installation_id: Number(githubProvider.githubInstallationId),
		});

		const account = data.account as {
			login?: string;
			avatar_url?: string;
			html_url?: string;
		};

		return {
			login: account.login ?? `installation-${githubProvider.githubInstallationId}`,
			name: data.app_slug ?? null,
			email: null,
			avatarUrl: account.avatar_url ?? null,
			url: account.html_url ?? null,
		};
	},

	getRepositories: async (githubProvider, options) => {
		const octokit = authGithub(githubProvider);
		const repositories = (await octokit.paginate(
			octokit.rest.apps.listReposAccessibleToInstallation,
			options?.limit ? { per_page: Math.min(options.limit, 100) } : undefined,
		)) as unknown as Awaited<
			ReturnType<typeof octokit.rest.apps.listReposAccessibleToInstallation>
		>["data"]["repositories"];

		return repositories.map((repository) => ({
			id: String(repository.id),
			fullName: repository.full_name,
			owner: repository.owner?.login ?? null,
			name: repository.name,
			private: !!repository.private,
			defaultBranch: repository.default_branch ?? null,
			numericId: null,
			webUrl: repository.html_url ?? null,
			cloneUrl: repository.clone_url ?? null,
			updatedAt: repository.updated_at ?? null,
			canPush: repository.permissions?.push ?? null,
		}));
	},

	searchRepositories: async (githubProvider, query, options) => {
		const octokit = authGithub(githubProvider);
		const { data } = await octokit.rest.search.repos({
			q: query,
			per_page: Math.min(options?.limit ?? 30, 100),
		});

		return data.items.map((repository) => ({
			id: String(repository.id),
			fullName: repository.full_name,
			owner: repository.owner?.login ?? null,
			name: repository.name,
			private: !!repository.private,
			defaultBranch: repository.default_branch ?? null,
			numericId: null,
			webUrl: repository.html_url ?? null,
			cloneUrl: repository.clone_url ?? null,
			updatedAt: repository.updated_at ?? null,
			canPush: repository.permissions?.push ?? null,
		}));
	},

	getOrganizations: async (githubProvider) => {
		const octokit = authGithub(githubProvider);
		const { data } = await octokit.rest.orgs.listForAuthenticatedUser();

		return data.map((organization) => ({
			id: String(organization.id),
			// `GET /user/orgs` only returns the slug, not a display name.
			name: organization.login,
			slug: organization.login,
			avatarUrl: organization.avatar_url ?? null,
		}));
	},

	getBranches: async (githubProvider, repository) => {
		const { owner, repo } = resolveRepositoryCoordinates(repository);
		const octokit = authGithub(githubProvider);
		const branches = (await octokit.paginate(
			octokit.rest.repos.listBranches,
			{ owner, repo },
		)) as unknown as Awaited<
			ReturnType<typeof octokit.rest.repos.listBranches>
		>["data"];

		return branches.map((branch) => ({
			name: branch.name,
			commitSha: branch.commit?.sha ?? null,
			protected: !!branch.protected,
		}));
	},

	getCommit: async (githubProvider, repository, ref) => {
		const { owner, repo } = resolveRepositoryCoordinates(repository);
		const octokit = authGithub(githubProvider);

		try {
			const { data } = await octokit.rest.repos.getBranch({
				owner,
				repo,
				branch: ref,
			});
			return {
				sha: data.commit.sha,
				shortSha: data.commit.sha.slice(0, 7),
				message: data.commit.commit?.message ?? null,
				author:
					data.commit.commit?.author?.name ??
					data.commit.author?.login ??
					null,
				committedAt: data.commit.commit?.author?.date ?? null,
				webUrl: data.commit.html_url ?? null,
			};
		} catch (error) {
			if (isNotFound(error)) return null;
			throw error;
		}
	},

	getRepositoryPermissions: async (githubProvider, repository) => {
		const { owner, repo } = resolveRepositoryCoordinates(repository);
		const octokit = authGithub(githubProvider);

		try {
			const { data } = await octokit.rest.repos.get({ owner, repo });
			return {
				pull: !!data.permissions?.pull,
				push: !!data.permissions?.push,
			};
		} catch (error) {
			if (isNotFound(error)) return null;
			throw error;
		}
	},

	testConnection: async (githubProvider) => {
		if (!haveGithubRequirements(githubProvider)) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "The GitHub App is not installed yet",
			});
		}

		const octokit = authGithub(githubProvider);
		// `listReposAccessibleToInstallation` is the check that matters: HTTP 200
		// on an empty installation would still be useless for a deployment.
		const repositories = (await octokit.paginate(
			octokit.rest.apps.listReposAccessibleToInstallation,
		)) as unknown as Awaited<
			ReturnType<typeof octokit.rest.apps.listReposAccessibleToInstallation>
		>["data"]["repositories"];

		return { repositoryCount: repositories.length };
	},
};

/**
 * Splits a repository reference into the `owner`/`repo` pair every GitHub call
 * needs, accepting both the id returned by the repository list and the
 * `owner/name` shown in the UI.
 */
const resolveRepositoryCoordinates = (
	repository: GitProviderRepositoryRef,
): { owner: string; repo: string } => {
	const fullName = repository.fullName;
	if (fullName && fullName.includes("/")) {
		const [owner, repo] = fullName.split("/");
		return { owner: owner as string, repo: repo as string };
	}

	if (repository.owner && repository.name) {
		return { owner: repository.owner, repo: repository.name };
	}

	throw new TRPCError({
		code: "BAD_REQUEST",
		message: "A repository must be identified by `owner/name` or by its id",
	});
};

const isNotFound = (error: unknown) => {
	const status = (error as { status?: number })?.status;
	return status === 404;
};
