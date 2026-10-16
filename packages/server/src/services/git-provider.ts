import { db } from "@notploy/server/db";
import { gitProvider, member } from "@notploy/server/db/schema";
import {
	type GitProviderAdapter,
	type GitProviderCapabilityMatrix,
	type GitProviderHealth,
	type GitProviderIdentity,
	type GitProviderListOptions,
	type GitProviderRepositoryRef,
	type GitProviderType,
	classifyGitProviderFailure,
	getGitProviderAdapter,
	gitProviderAuthorizationMessages,
	gitProviderLabels,
} from "@notploy/server/utils/providers";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";

export type GitProvider = typeof gitProvider.$inferSelect;

export const removeGitProvider = async (gitProviderId: string) => {
	const result = await db
		.delete(gitProvider)
		.where(eq(gitProvider.gitProviderId, gitProviderId))
		.returning();

	return result[0];
};

export const findGitProviderById = async (gitProviderId: string) => {
	const result = await db.query.gitProvider.findFirst({
		where: eq(gitProvider.gitProviderId, gitProviderId),
	});

	if (!result) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Git Provider not found",
		});
	}
	return result;
};

export const updateGitProvider = async (
	gitProviderId: string,
	input: Partial<GitProvider>,
) => {
	return await db
		.update(gitProvider)
		.set({
			...input,
		})
		.where(eq(gitProvider.gitProviderId, gitProviderId))
		.returning()
		.then((response) => response[0]);
};

// Returns true if the user can edit the git source configuration of an existing
// deploy that is connected to the given provider.
// Owner/admin: always yes.
// Member: only if they own the provider or it's shared with the org.
// Being in accessedGitProviders only grants permission to connect NEW deploys,
// not to modify the git config of an existing deploy owned by someone else.
export const canEditDeployGitSource = async (
	gitProviderId: string,
	session: { userId: string; activeOrganizationId: string },
): Promise<boolean> => {
	const { userId, activeOrganizationId } = session;

	const memberRecord = await db.query.member.findFirst({
		where: and(
			eq(member.userId, userId),
			eq(member.organizationId, activeOrganizationId),
		),
		columns: { role: true },
	});

	if (memberRecord?.role === "owner") return true;

	const provider = await db.query.gitProvider.findFirst({
		where: eq(gitProvider.gitProviderId, gitProviderId),
		columns: { userId: true, sharedWithOrganization: true },
	});

	if (!provider) return false;

	return provider.userId === userId || provider.sharedWithOrganization;
};

export const getAccessibleGitProviderIds = async (session: {
	userId: string;
	activeOrganizationId: string;
}): Promise<Set<string>> => {
	const { userId, activeOrganizationId } = session;

	const allOrgProviders = await db.query.gitProvider.findMany({
		where: eq(gitProvider.organizationId, activeOrganizationId),
		columns: {
			gitProviderId: true,
			userId: true,
			sharedWithOrganization: true,
		},
	});

	const memberRecord = await db.query.member.findFirst({
		where: and(
			eq(member.userId, userId),
			eq(member.organizationId, activeOrganizationId),
		),
		columns: { accessedGitProviders: true, role: true },
	});

	if (memberRecord?.role === "owner" || memberRecord?.role === "admin") {
		return new Set(allOrgProviders.map((p) => p.gitProviderId));
	}

	const assignedSet = new Set(memberRecord?.accessedGitProviders ?? []);

	const result = new Set<string>();
	for (const p of allOrgProviders) {
		if (
			p.userId === userId ||
			p.sharedWithOrganization ||
			assignedSet.has(p.gitProviderId)
		) {
			result.add(p.gitProviderId);
		}
	}
	return result;
};

/**
 * Authorizes read access to a specific git provider for the current session.
 * Throws if the provider belongs to a different organization (cross-org IDOR)
 * or if the caller is not entitled to it within the active organization.
 *
 * This only proves the caller may *use* the provider (e.g. pick it as a repo
 * source when creating a deploy) - it does NOT mean they may see its raw
 * credentials. Being able to use a shared provider and being able to read its
 * OAuth tokens / client secrets / private keys are different privileges; gate
 * the latter with canViewGitProviderSecrets before returning secret fields.
 */
export const assertGitProviderAccess = async (
	session: { userId: string; activeOrganizationId: string },
	provider: { gitProviderId: string; organizationId: string },
) => {
	if (provider.organizationId !== session.activeOrganizationId) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Git provider not found",
		});
	}

	const accessibleIds = await getAccessibleGitProviderIds(session);
	if (!accessibleIds.has(provider.gitProviderId)) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You don't have access to this git provider",
		});
	}
};

// Being allowed to use a shared provider (assertGitProviderAccess) must not
// imply being allowed to read its raw OAuth tokens / client secrets / private
// keys. Only the provider's owner or an org owner/admin gets those back.
export const canViewGitProviderSecrets = async (
	session: { userId: string; activeOrganizationId: string },
	provider: { userId: string; organizationId: string },
): Promise<boolean> => {
	if (provider.organizationId !== session.activeOrganizationId) return false;
	if (provider.userId === session.userId) return true;

	const memberRecord = await db.query.member.findFirst({
		where: and(
			eq(member.userId, session.userId),
			eq(member.organizationId, session.activeOrganizationId),
		),
		columns: { role: true },
	});

	return memberRecord?.role === "owner" || memberRecord?.role === "admin";
};

/**
 * Normalized access to a connected Git provider.
 *
 * Everything above this layer (the settings page, the application repository
 * selector, the deployment pipeline) uses these functions instead of talking to
 * GitHub/GitLab/Bitbucket/Gitea directly, which is what keeps provider specifics
 * out of the Project / Application / Deployment model.
 */

/**
 * A provider row together with its own credential table.
 *
 * The credential tables are one-to-one children of `git_provider`, so exactly
 * one of them is set; `config` is that child's row, and `type` carries the
 * `providerType` so a single loader can hand the right adapter the right shape.
 */
export type ConnectedGitProvider = {
	gitProvider: GitProvider;
	type: GitProviderType;
	config: Record<string, unknown>;
};

/**
 * Loads a provider with its credentials.
 *
 * Throws when the provider type has no credential row, which can only happen if
 * a provider was created without going through its own setup flow.
 */
export const loadConnectedGitProvider = async (
	gitProviderId: string,
): Promise<ConnectedGitProvider> => {
	const provider = await db.query.gitProvider.findFirst({
		where: eq(gitProvider.gitProviderId, gitProviderId),
		with: {
			github: true,
			gitlab: true,
			bitbucket: true,
			gitea: true,
		},
	});

	if (!provider) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Git Provider not found",
		});
	}

	const config =
		provider.github ??
		provider.gitlab ??
		provider.bitbucket ??
		provider.gitea ??
		null;

	if (!config) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `This ${provider.providerType} connection has no credentials stored`,
		});
	}

	return {
		gitProvider: provider,
		type: provider.providerType as GitProviderType,
		config: config as unknown as Record<string, unknown>,
	};
};

/** Adapter bound to a stored connection. */
export const getGitProviderAdapterFor = <C = unknown>(
	connected: ConnectedGitProvider,
): GitProviderAdapter<C> => getGitProviderAdapter<C>(connected.type);

/**
 * Reports whether a connection is usable for repository based deployments.
 *
 * `connected` is deliberately stricter than "the API answered 200": the probe
 * lists repositories through the adapter, so a connection that authenticates but
 * cannot see any repository (a GitHub App installed on the wrong account, a
 * revoked token) is reported with the status that matches the fix.
 */
export const getGitProviderHealth = async (
	gitProviderId: string,
): Promise<GitProviderHealth> => {
	const checkedAt = new Date().toISOString();
	const connected = await loadConnectedGitProvider(gitProviderId);
	const adapter = getGitProviderAdapterFor(connected);
	const capabilities = adapter.getCapabilities();

	if (!adapter.hasRequirements(connected.config)) {
		return {
			status: "needsAuthorization",
			checkedAt,
			latencyMs: null,
			message: `This ${connected.type} connection has no credentials yet`,
			remediation: gitProviderAuthorizationMessages[connected.type],
			capabilities,
		};
	}

	const startedAt = Date.now();
	try {
		const { repositoryCount } = await adapter.testConnection(connected.config);
		const latencyMs = Date.now() - startedAt;

		let identity: GitProviderIdentity | null = null;
		try {
			// The identity is a nice-to-have: a provider that lists repositories
			// but not `/user` is still usable, so a failure here must not flip the
			// status to broken.
			identity = await adapter.getIdentity(connected.config);
		} catch {
			identity = null;
		}

		return {
			status: "connected",
			checkedAt,
			latencyMs,
			message: null,
			remediation: null,
			repositoryCount,
			identity,
			capabilities,
		};
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "The provider is unreachable";

		return {
			status: classifyGitProviderFailure(message),
			checkedAt,
			latencyMs: null,
			message,
			// Both remaining failures are fixed by reconnecting; the provider host
			// itself is either refusing the credentials or not answering.
			remediation: gitProviderAuthorizationMessages[connected.type],
			capabilities,
		};
	}
};

/** Repositories the connection can deploy from. */
export const listGitProviderRepositories = async (
	gitProviderId: string,
	options?: GitProviderListOptions,
) => {
	const connected = await loadConnectedGitProvider(gitProviderId);
	const adapter = getGitProviderAdapterFor(connected);

	assertGitProviderAuthorized(connected, adapter);

	return adapter.getRepositories(connected.config, options);
};

/** Server-side repository search, when the provider supports it. */
export const searchGitProviderRepositories = async (
	gitProviderId: string,
	query: string,
	options?: GitProviderListOptions,
) => {
	const connected = await loadConnectedGitProvider(gitProviderId);
	const adapter = getGitProviderAdapterFor(connected);

	assertGitProviderAuthorized(connected, adapter);

	if (!adapter.searchRepositories) {
		// Falling back to filtering the full list keeps the selector usable on
		// providers without a search endpoint.
		const repositories = await adapter.getRepositories(connected.config, options);
		const needle = query.toLowerCase();
		return repositories.filter(
			(repository) =>
				repository.fullName.toLowerCase().includes(needle) ||
				repository.name.toLowerCase().includes(needle),
		);
	}

	return adapter.searchRepositories(connected.config, query, options);
};

/** Branches of a repository, in the normalized shape. */
export const listGitProviderBranches = async (
	gitProviderId: string,
	repository: GitProviderRepositoryRef,
) => {
	const connected = await loadConnectedGitProvider(gitProviderId);
	const adapter = getGitProviderAdapterFor(connected);

	assertGitProviderAuthorized(connected, adapter);

	return adapter.getBranches(connected.config, repository);
};

/** Identity the connection acts as. */
export const getGitProviderIdentity = async (gitProviderId: string) => {
	const connected = await loadConnectedGitProvider(gitProviderId);
	const adapter = getGitProviderAdapterFor(connected);

	assertGitProviderAuthorized(connected, adapter);

	return adapter.getIdentity(connected.config);
};

/**
 * Resolves a ref (branch, tag or short sha) to a commit.
 *
 * Returns `null` when the provider cannot answer or does not know the ref, so a
 * caller can decide between "not found" and "not supported".
 */
export const getGitProviderCommit = async (
	gitProviderId: string,
	repository: GitProviderRepositoryRef,
	ref: string,
) => {
	const connected = await loadConnectedGitProvider(gitProviderId);
	const adapter = getGitProviderAdapterFor(connected);

	assertGitProviderAuthorized(connected, adapter);

	if (!adapter.getCommit) return null;

	return adapter.getCommit(connected.config, repository, ref);
};

/** Whether the connection may read / write a repository. */
export const getGitProviderRepositoryPermissions = async (
	gitProviderId: string,
	repository: GitProviderRepositoryRef,
) => {
	const connected = await loadConnectedGitProvider(gitProviderId);
	const adapter = getGitProviderAdapterFor(connected);

	assertGitProviderAuthorized(connected, adapter);

	if (!adapter.getRepositoryPermissions) return null;

	return adapter.getRepositoryPermissions(connected.config, repository);
};

const assertGitProviderAuthorized = (
	connected: ConnectedGitProvider,
	adapter: GitProviderAdapter<unknown>,
) => {
	if (!adapter.hasRequirements(connected.config)) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `${gitProviderLabels[connected.type]} is not authorized yet. ${gitProviderAuthorizationMessages[connected.type]}`,
		});
	}
};
