import {
	communityContributions,
	communityEvents,
	communityReleases,
	communityRepositories,
	communitySources,
	db,
	github,
} from "@notploy/server/db";
import {
	and,
	count,
	countDistinct,
	desc,
	eq,
	gte,
	inArray,
	lte,
	or,
	sql,
} from "drizzle-orm";
import { findGitProviderById } from "@notploy/server/services/git-provider";
import {
	classifyGithubFailure,
	describeGithubFailure,
	DEFAULT_ATTENTION_THRESHOLDS,
	EMPTY_COMMUNITY_HEALTH,
	eventActorOf,
	eventUrlOf,
	classifyCommunityEvent,
	describeCommunityEvent,
	mapGithubIssue,
	mapGithubPullRequest,
	mapGithubRelease,
	mapGithubRepository,
	resolveAttentionThresholds,
	summarizeCommunityHealth,
} from "@notploy/server/utils/community/mappers";
import type { Github } from "@notploy/server/services/github";
import { authGithub } from "@notploy/server/utils/providers/github";
import type { Octokit } from "octokit";

/**
 * Community Console service.
 *
 * The Console never calls GitHub from the browser: every read goes through this
 * service, which owns the credentials and the persisted cache. GitHub is the
 * source of truth; the tables here are a bounded projection of it, refreshed by
 * {@link syncCommunitySource}. A read therefore never depends on GitHub being
 * reachable, and a sync failure degrades the "freshness" indicator instead of
 * the page.
 *
 * Volumetry is bounded on purpose:
 * - one HTTP round trip per repository for metadata, plus a capped page of open
 *   issues, open pull requests, releases and events;
 * - the community-health profile comes from a single `/community/profile` call
 *   rather than one probe per file;
 * - events are pruned to the retention window (`COMMUNITY_EVENT_RETENTION_DAYS`,
 *   90 days by default — GitHub itself only serves 90 days of events).
 */

export type CommunityErrorCode =
	| "SOURCE_NOT_FOUND"
	| "SOURCE_INVALID"
	| "SOURCE_EXISTS"
	| "REPOSITORY_NOT_FOUND"
	| "REPOSITORY_INVALID"
	| "REPOSITORY_EXISTS"
	| "PROVIDER_UNSUPPORTED"
	| "GITHUB_UNAUTHORIZED"
	| "RATE_LIMITED";

export class CommunityServiceError extends Error {
	readonly code: CommunityErrorCode;
	constructor(code: CommunityErrorCode, message: string) {
		super(message);
		this.code = code;
		this.name = "CommunityServiceError";
	}
}

/* -------------------------------------------------------------------------- */
/* Range helpers                                                              */
/* -------------------------------------------------------------------------- */

export const COMMUNITY_RANGE_PRESETS = [
	"24h",
	"7d",
	"30d",
	"90d",
	"custom",
] as const;
export type CommunityRangePreset = (typeof COMMUNITY_RANGE_PRESETS)[number];

export interface CommunityRangeInput {
	preset?: CommunityRangePreset;
	from?: string;
	to?: string;
}

const PRESET_MS: Record<Exclude<CommunityRangePreset, "custom">, number> = {
	"24h": 24 * 60 * 60 * 1000,
	"7d": 7 * 24 * 60 * 60 * 1000,
	"30d": 30 * 24 * 60 * 60 * 1000,
	"90d": 90 * 24 * 60 * 60 * 1000,
};

/** Resolves a preset (or an explicit window) into a validated `[from, to]`. */
export const resolveCommunityRange = (
	input: CommunityRangeInput,
	now: Date = new Date(),
): { from: Date; to: Date } => {
	const preset = input.preset ?? "30d";
	if (preset === "custom") {
		if (!input.from || !input.to) {
			throw new CommunityServiceError(
				"SOURCE_INVALID",
				"A custom range requires both `from` and `to`",
			);
		}
		const from = new Date(input.from);
		const to = new Date(input.to);
		if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
			throw new CommunityServiceError(
				"SOURCE_INVALID",
				"`from` and `to` must be valid ISO 8601 dates",
			);
		}
		if (from > to) {
			throw new CommunityServiceError(
				"SOURCE_INVALID",
				"`from` must be earlier than `to`",
			);
		}
		return { from, to };
	}
	return { from: new Date(now.getTime() - PRESET_MS[preset]), to: now };
};

export const getCommunityEventRetentionDays = (): number => {
	const parsed = Number.parseInt(
		process.env.COMMUNITY_EVENT_RETENTION_DAYS ?? "",
		10,
	);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 90;
};

/** Per-run budget so a large account cannot exhaust the API rate limit. */
export const getCommunitySyncBudget = (): {
	repositories: number;
	issues: number;
	pulls: number;
	releases: number;
	events: number;
} => {
	const read = (key: string, fallback: number) => {
		const parsed = Number.parseInt(process.env[key] ?? "", 10);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
	};
	return {
		repositories: read("COMMUNITY_SYNC_MAX_REPOSITORIES", 25),
		issues: read("COMMUNITY_SYNC_MAX_ISSUES", 100),
		pulls: read("COMMUNITY_SYNC_MAX_PULLS", 100),
		releases: read("COMMUNITY_SYNC_MAX_RELEASES", 20),
		events: read("COMMUNITY_SYNC_MAX_EVENTS", 100),
	};
};

/* -------------------------------------------------------------------------- */
/* Sources                                                                    */
/* -------------------------------------------------------------------------- */

export interface CommunitySourceView {
	id: string;
	gitProviderId: string;
	providerName: string;
	owner: string;
	enabled: boolean;
	status: string;
	lastSyncedAt: string | null;
	lastSuccessfulSyncAt: string | null;
	lastError: string | null;
	repositoryCount: number;
}

export const listCommunitySources = async (
	organizationId: string,
): Promise<CommunitySourceView[]> => {
	const rows = await db.query.communitySources.findMany({
		where: eq(communitySources.organizationId, organizationId),
		with: {
			gitProvider: true,
			repositories: { columns: { id: true } },
		},
		orderBy: desc(communitySources.createdAt),
	});

	return rows.map((row) => ({
		id: row.id,
		gitProviderId: row.gitProviderId,
		providerName: row.gitProvider?.name ?? "GitHub",
		owner: row.owner,
		enabled: row.enabled,
		status: row.status,
		lastSyncedAt: row.lastSyncedAt?.toISOString() ?? null,
		lastSuccessfulSyncAt: row.lastSuccessfulSyncAt?.toISOString() ?? null,
		lastError: row.lastError,
		repositoryCount: row.repositories.length,
	}));
};

/**
 * Loads the GitHub credentials of a connection.
 *
 * The `github` row holds the App id, private key and installation id; the
 * Community console borrows it and never copies a secret into its own tables.
 */
const loadGithubCredentials = async (
	gitProviderId: string,
): Promise<Github | null> => {
	const credentials = await db.query.github.findFirst({
		where: eq(github.gitProviderId, gitProviderId),
	});
	return credentials ?? null;
};

const assertGithubSource = async (
	organizationId: string,
	gitProviderId: string,
): Promise<void> => {
	const provider = await findGitProviderById(gitProviderId);
	if (provider.organizationId !== organizationId) {
		throw new CommunityServiceError(
			"SOURCE_NOT_FOUND",
			"This Git provider does not belong to the active organization",
		);
	}
	const credentials = await loadGithubCredentials(gitProviderId);
	if (provider.providerType !== "github" || !credentials) {
		throw new CommunityServiceError(
			"PROVIDER_UNSUPPORTED",
			"Only GitHub connections can be followed by the Community page for now",
		);
	}
};

export const createCommunitySource = async (input: {
	organizationId: string;
	gitProviderId: string;
	owner: string;
}) => {
	const owner = input.owner.trim();
	if (!owner || !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(owner)) {
		throw new CommunityServiceError(
			"SOURCE_INVALID",
			"`owner` must be a valid GitHub account or organization slug",
		);
	}

	await assertGithubSource(input.organizationId, input.gitProviderId);

	const existing = await db.query.communitySources.findFirst({
		where: and(
			eq(communitySources.organizationId, input.organizationId),
			eq(communitySources.gitProviderId, input.gitProviderId),
			eq(communitySources.owner, owner),
		),
	});
	if (existing) {
		throw new CommunityServiceError(
			"SOURCE_EXISTS",
			`${owner} is already followed through this connection`,
		);
	}

	const [created] = await db
		.insert(communitySources)
		.values({
			organizationId: input.organizationId,
			gitProviderId: input.gitProviderId,
			owner,
		})
		.returning();

	if (!created) {
		throw new CommunityServiceError(
			"SOURCE_INVALID",
			"Could not create the community source",
		);
	}
	return created;
};

const findSource = async (organizationId: string, sourceId: string) => {
	const source = await db.query.communitySources.findFirst({
		where: and(
			eq(communitySources.id, sourceId),
			eq(communitySources.organizationId, organizationId),
		),
	});
	if (!source) {
		throw new CommunityServiceError(
			"SOURCE_NOT_FOUND",
			"Community source not found",
		);
	}
	return source;
};

export const updateCommunitySource = async (input: {
	organizationId: string;
	sourceId: string;
	enabled?: boolean;
}) => {
	await findSource(input.organizationId, input.sourceId);
	const [updated] = await db
		.update(communitySources)
		.set({
			...(input.enabled === undefined ? {} : { enabled: input.enabled }),
			updatedAt: new Date(),
		})
		.where(eq(communitySources.id, input.sourceId))
		.returning();
	return updated;
};

export const removeCommunitySource = async (
	organizationId: string,
	sourceId: string,
) => {
	await findSource(organizationId, sourceId);
	await db.delete(communitySources).where(eq(communitySources.id, sourceId));
	return { deleted: true };
};

/* -------------------------------------------------------------------------- */
/* GitHub access                                                              */
/* -------------------------------------------------------------------------- */

const createGithubClient = async (gitProviderId: string): Promise<Octokit> => {
	const provider = await findGitProviderById(gitProviderId);
	const credentials = await loadGithubCredentials(gitProviderId);
	if (provider.providerType !== "github" || !credentials) {
		throw new CommunityServiceError(
			"PROVIDER_UNSUPPORTED",
			"This connection is not a GitHub connection",
		);
	}
	if (
		!credentials.githubAppId ||
		!credentials.githubPrivateKey ||
		!credentials.githubInstallationId
	) {
		throw new CommunityServiceError(
			"GITHUB_UNAUTHORIZED",
			"The GitHub App is not installed for this connection",
		);
	}
	return authGithub(credentials);
};

const splitFullName = (
	fullName: string,
): { owner: string; name: string } | null => {
	const parts = fullName.trim().split("/");
	if (parts.length !== 2) {
		return null;
	}
	const [owner, name] = parts;
	if (!owner || !name) {
		return null;
	}
	return { owner, name };
};

/* -------------------------------------------------------------------------- */
/* Tracked repositories                                                       */
/* -------------------------------------------------------------------------- */

export const trackCommunityRepository = async (input: {
	organizationId: string;
	sourceId: string;
	fullName: string;
}) => {
	const source = await findSource(input.organizationId, input.sourceId);
	const coordinates = splitFullName(input.fullName);
	if (!coordinates) {
		throw new CommunityServiceError(
			"REPOSITORY_INVALID",
			"A repository must be identified as `owner/name`",
		);
	}
	if (coordinates.owner.toLowerCase() !== source.owner.toLowerCase()) {
		throw new CommunityServiceError(
			"REPOSITORY_INVALID",
			`This source follows ${source.owner}; ${coordinates.owner} is outside its scope`,
		);
	}

	const existing = await db.query.communityRepositories.findFirst({
		where: and(
			eq(communityRepositories.sourceId, source.id),
			eq(communityRepositories.fullName, input.fullName),
		),
	});
	if (existing) {
		return existing;
	}

	const octokit = await createGithubClient(source.gitProviderId);

	try {
		const { data } = await octokit.rest.repos.get({
			owner: coordinates.owner,
			repo: coordinates.name,
		});
		const mapped = mapGithubRepository(data);
		if (!mapped) {
			throw new CommunityServiceError(
				"REPOSITORY_INVALID",
				"GitHub returned an unusable repository payload",
			);
		}
		const [created] = await db
			.insert(communityRepositories)
			.values({
				sourceId: source.id,
				...mapped,
			})
			.returning();
		if (!created) {
			throw new CommunityServiceError(
				"REPOSITORY_INVALID",
				"Could not track this repository",
			);
		}
		return created;
	} catch (error) {
		if (error instanceof CommunityServiceError) {
			throw error;
		}
		const status = classifyGithubFailure(error);
		throw new CommunityServiceError(
			status === "rate-limited" ? "RATE_LIMITED" : "GITHUB_UNAUTHORIZED",
			describeGithubFailure(error),
		);
	}
};

export const untrackCommunityRepository = async (
	organizationId: string,
	repositoryId: string,
) => {
	const repository = await db.query.communityRepositories.findFirst({
		where: eq(communityRepositories.id, repositoryId),
		with: { source: { columns: { organizationId: true } } },
	});
	if (!repository || repository.source?.organizationId !== organizationId) {
		throw new CommunityServiceError(
			"REPOSITORY_NOT_FOUND",
			"Tracked repository not found",
		);
	}
	await db
		.delete(communityRepositories)
		.where(eq(communityRepositories.id, repositoryId));
	return { deleted: true };
};

/** Repositories GitHub reports as reachable by the connection's installation. */
export const listGithubInstallationRepositories = async (
	organizationId: string,
	sourceId: string,
): Promise<{ fullName: string; description: string | null }[]> => {
	const source = await findSource(organizationId, sourceId);
	const octokit = await createGithubClient(source.gitProviderId);
	const repositories = (await octokit.paginate(
		octokit.rest.apps.listReposAccessibleToInstallation,
		{ per_page: 100 },
	)) as unknown as Array<{
		full_name: string;
		owner?: { login?: string } | null;
		description?: string | null;
		archived?: boolean;
	}>;

	return repositories
		.filter((repository) =>
			repository.full_name
				.toLowerCase()
				.startsWith(`${source.owner.toLowerCase()}/`),
		)
		.map((repository) => ({
			fullName: repository.full_name,
			description: repository.description ?? null,
		}));
};

/* -------------------------------------------------------------------------- */
/* Sync                                                                       */
/* -------------------------------------------------------------------------- */

export interface CommunitySyncReport {
	sourceId: string;
	status: "connected" | "error" | "rate-limited" | "needs-authorization";
	repositories: number;
	contributions: number;
	releases: number;
	events: number;
	apiCalls: number;
	error: string | null;
	startedAt: string;
	finishedAt: string;
}

const fetchRepositoryData = async (
	octokit: Octokit,
	owner: string,
	name: string,
	budget: ReturnType<typeof getCommunitySyncBudget>,
	now: Date,
	thresholds: typeof DEFAULT_ATTENTION_THRESHOLDS,
) => {
	let apiCalls = 0;

	const repositoryResponse = await octokit.rest.repos.get({ owner, repo: name });
	apiCalls += 1;
	const mapped = mapGithubRepository(repositoryResponse.data);
	if (!mapped) {
		return null;
	}

	const [issuesResponse, pullsResponse, releasesResponse, profileResponse] =
		await Promise.all([
			octokit.rest.issues.listForRepo({
				owner,
				repo: name,
				state: "open",
				per_page: Math.min(budget.issues, 100),
			}),
			octokit.rest.pulls.list({
				owner,
				repo: name,
				state: "open",
				per_page: Math.min(budget.pulls, 100),
			}),
			octokit.rest.repos.listReleases({
				owner,
				repo: name,
				per_page: Math.min(budget.releases, 100),
			}),
			octokit.rest.repos
				.getCommunityProfileMetrics({ owner, repo: name })
				.catch(() => null),
		]);
	apiCalls += profileResponse ? 4 : 3;

	const contributions = [
		...issuesResponse.data
			.map((issue) => mapGithubIssue(issue, now, thresholds))
			.filter((value): value is NonNullable<typeof value> => value !== null),
		...pullsResponse.data
			.map((pull) => mapGithubPullRequest(pull, now, thresholds))
			.filter((value): value is NonNullable<typeof value> => value !== null),
	];

	const releases = releasesResponse.data
		.map((release) => mapGithubRelease(release))
		.filter((value): value is NonNullable<typeof value> => value !== null);

	const health = profileResponse
		? summarizeCommunityHealth(profileResponse.data)
		: { ...EMPTY_COMMUNITY_HEALTH };

	const eventsResponse = await octokit.rest.activity
		.listRepoEvents({
			owner,
			repo: name,
			per_page: Math.min(budget.events, 100),
		})
		.catch(() => null);
	apiCalls += eventsResponse ? 1 : 0;

	const retentionDays = getCommunityEventRetentionDays();
	const cutoff = now.getTime() - retentionDays * 24 * 60 * 60 * 1000;

	const events = (eventsResponse?.data ?? [])
		.map((event) => {
			const occurredAt = new Date(event.created_at ?? "");
			if (Number.isNaN(occurredAt.getTime()) || occurredAt.getTime() < cutoff) {
				return null;
			}
			const actor = eventActorOf(event);
			return {
				externalId: String(event.id ?? `${event.type}-${event.created_at}`),
				type: classifyCommunityEvent(event),
				sourceType: event.type ?? "UnknownEvent",
				actor: actor.login,
				actorAvatarUrl: actor.avatarUrl,
				title: describeCommunityEvent(event),
				url: eventUrlOf(event),
				occurredAt,
			};
		})
		.filter((value): value is NonNullable<typeof value> => value !== null);

	const openIssues = contributions.filter((item) => item.kind === "issue").length;
	const openPulls = contributions.length - openIssues;
	const latestRelease = releases
		.filter((release) => !release.isDraft)
		.sort(
			(a, b) =>
				(b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0),
		)[0];

	return {
		repository: {
			...mapped,
			openIssues,
			openPullRequests: openPulls,
			health,
			lastReleaseTag: latestRelease?.tagName ?? null,
			lastReleaseAt: latestRelease?.publishedAt ?? null,
		},
		contributions,
		releases,
		events,
		apiCalls,
	};
};

export const syncCommunitySource = async (input: {
	organizationId: string;
	sourceId: string;
	/** When set, only this tracked repository is refreshed. */
	repositoryId?: string;
}): Promise<CommunitySyncReport> => {
	const startedAt = new Date();
	const source = await findSource(input.organizationId, input.sourceId);
	const budget = getCommunitySyncBudget();
	const thresholds = resolveAttentionThresholds();
	const now = new Date();

	const octokit = await createGithubClient(source.gitProviderId);

	const repositories = await db.query.communityRepositories.findMany({
		where: input.repositoryId
			? and(
					eq(communityRepositories.sourceId, source.id),
					eq(communityRepositories.id, input.repositoryId),
				)
			: eq(communityRepositories.sourceId, source.id),
		limit: budget.repositories,
	});

	await db
		.update(communitySources)
		.set({ status: "syncing", updatedAt: now })
		.where(eq(communitySources.id, source.id));

	let apiCalls = 0;
	let contributionsCount = 0;
	let releasesCount = 0;
	let eventsCount = 0;
	let failure: string | null = null;

	try {
		for (const repository of repositories) {
			const data = await fetchRepositoryData(
				octokit,
				repository.owner,
				repository.name,
				budget,
				now,
				thresholds,
			);
			if (!data) continue;
			apiCalls += data.apiCalls;

			await db.transaction(async (tx) => {
				await tx
					.update(communityRepositories)
					.set({
						...data.repository,
						syncedAt: now,
						updatedAt: now,
					})
					.where(eq(communityRepositories.id, repository.id));

				await tx
					.delete(communityContributions)
					.where(eq(communityContributions.repositoryId, repository.id));
				if (data.contributions.length > 0) {
					await tx.insert(communityContributions).values(
						data.contributions.map((item) => ({
							repositoryId: repository.id,
							kind: item.kind,
							number: item.number,
							title: item.title,
							author: item.author,
							authorAvatarUrl: item.authorAvatarUrl,
							url: item.url,
							isDraft: item.isDraft,
							reviewRequestedCount: item.reviewRequestedCount,
							assigneeCount: item.assigneeCount,
							commentCount: item.commentCount,
							openedAt: item.openedAt,
							updatedAtSource: item.updatedAtSource,
							attention: item.attention,
							attentionReasons: item.reasons,
							syncedAt: now,
						})),
					);
				}

				await tx
					.delete(communityReleases)
					.where(eq(communityReleases.repositoryId, repository.id));
				if (data.releases.length > 0) {
					await tx.insert(communityReleases).values(
						data.releases.map((release) => ({
							repositoryId: repository.id,
							...release,
							syncedAt: now,
						})),
					);
				}

				// Events are upserted rather than replaced: older events stay in
				// the feed while the newest page is refreshed.
				if (data.events.length > 0) {
					await tx
						.insert(communityEvents)
						.values(
							data.events.map((event) => ({
								repositoryId: repository.id,
								repositoryFullName: repository.fullName,
								...event,
								syncedAt: now,
							})),
						)
						.onConflictDoNothing({
							target: [communityEvents.repositoryId, communityEvents.externalId],
						});
				}
			});

			contributionsCount += data.contributions.length;
			releasesCount += data.releases.length;
			eventsCount += data.events.length;
		}
	} catch (error) {
		failure = describeGithubFailure(error);
		const status = classifyGithubFailure(error);
		const lastErrorAt = new Date();
		await db
			.update(communitySources)
			.set({
				status,
				lastError: failure,
				lastErrorAt,
				lastSyncedAt: lastErrorAt,
				lastApiCalls: apiCalls,
				updatedAt: lastErrorAt,
			})
			.where(eq(communitySources.id, source.id));

		return {
			sourceId: source.id,
			status,
			repositories: repositories.length,
			contributions: contributionsCount,
			releases: releasesCount,
			events: eventsCount,
			apiCalls,
			error: failure,
			startedAt: startedAt.toISOString(),
			finishedAt: lastErrorAt.toISOString(),
		};
	}

	// Retention: drop events older than the window so the feed stays bounded.
	const retentionCutoff = new Date(
		now.getTime() - getCommunityEventRetentionDays() * 24 * 60 * 60 * 1000,
	);
	const syncedRepositoryIds = repositories.map((repository) => repository.id);
	if (syncedRepositoryIds.length > 0) {
		await db
			.delete(communityEvents)
			.where(
				and(
					inArray(communityEvents.repositoryId, syncedRepositoryIds),
					lte(communityEvents.occurredAt, retentionCutoff),
				),
			);
	}

	const finishedAt = new Date();
	await db
		.update(communitySources)
		.set({
			status: "connected",
			lastSyncedAt: finishedAt,
			lastSuccessfulSyncAt: finishedAt,
			lastError: null,
			lastErrorAt: null,
			lastApiCalls: apiCalls,
			updatedAt: finishedAt,
		})
		.where(eq(communitySources.id, source.id));

	return {
		sourceId: source.id,
		status: "connected",
		repositories: repositories.length,
		contributions: contributionsCount,
		releases: releasesCount,
		events: eventsCount,
		apiCalls,
		error: null,
		startedAt: startedAt.toISOString(),
		finishedAt: finishedAt.toISOString(),
	};
};

/** Syncs every enabled source of an organization (used by the scheduler). */
export const syncOrganizationCommunity = async (
	organizationId?: string,
): Promise<CommunitySyncReport[]> => {
	const sources = await db.query.communitySources.findMany({
		where: organizationId
			? and(
					eq(communitySources.organizationId, organizationId),
					eq(communitySources.enabled, true),
				)
			: eq(communitySources.enabled, true),
	});

	const reports: CommunitySyncReport[] = [];
	for (const source of sources) {
		try {
			reports.push(
				await syncCommunitySource({
					organizationId: source.organizationId,
					sourceId: source.id,
				}),
			);
		} catch (error) {
			console.error(
				`[community] sync failed for source ${source.id}: ${String(error)}`,
			);
		}
	}
	return reports;
};

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

export interface CommunityOverview {
	repositories: number;
	openIssues: number;
	openPullRequests: number;
	awaitingReview: number;
	unansweredIssues: number;
	unassigned: number;
	contributionsInPeriod: number;
	mergedPullRequests: number;
	activeContributors: number;
	releasesInPeriod: number;
	lastSyncedAt: string | null;
	sourceStatuses: { status: string; count: number }[];
	/** Historical comparisons are not stored yet; the UI must not invent them. */
	comparisonAvailable: false;
}

const attentionCount = async (
	organizationId: string,
	rule: string,
): Promise<number> => {
	const rows = await db
		.select({ value: count() })
		.from(communityContributions)
		.innerJoin(
			communityRepositories,
			eq(communityContributions.repositoryId, communityRepositories.id),
		)
		.innerJoin(
			communitySources,
			eq(communityRepositories.sourceId, communitySources.id),
		)
		.where(
			and(
				eq(communitySources.organizationId, organizationId),
				sql`${communityContributions.attention} @> ${JSON.stringify([rule])}::jsonb`,
			),
		);
	return Number(rows[0]?.value ?? 0);
};

export const getCommunityOverview = async (input: {
	organizationId: string;
	range?: { from: Date; to: Date };
}): Promise<CommunityOverview> => {
	const range = input.range ?? resolveCommunityRange({ preset: "30d" });
	const orgId = input.organizationId;

	const repositories = await db
		.select({
			id: communityRepositories.id,
			openIssues: communityRepositories.openIssues,
			openPullRequests: communityRepositories.openPullRequests,
		})
		.from(communityRepositories)
		.innerJoin(
			communitySources,
			eq(communityRepositories.sourceId, communitySources.id),
		)
		.where(eq(communitySources.organizationId, orgId));

	const [awaitingReview, unansweredIssues, unassigned] = await Promise.all([
		attentionCount(orgId, "awaiting-review"),
		attentionCount(orgId, "unanswered"),
		attentionCount(orgId, "unassigned"),
	]);

	const eventScoped = and(
		eq(communitySources.organizationId, orgId),
		gte(communityEvents.occurredAt, range.from),
		lte(communityEvents.occurredAt, range.to),
	);

	const [eventTotals, mergedTotals, contributors, releaseTotals, sourceRows] =
		await Promise.all([
			db
				.select({ value: count() })
				.from(communityEvents)
				.innerJoin(
					communityRepositories,
					eq(communityEvents.repositoryId, communityRepositories.id),
				)
				.innerJoin(
					communitySources,
					eq(communityRepositories.sourceId, communitySources.id),
				)
				.where(eventScoped),
			db
				.select({ value: count() })
				.from(communityEvents)
				.innerJoin(
					communityRepositories,
					eq(communityEvents.repositoryId, communityRepositories.id),
				)
				.innerJoin(
					communitySources,
					eq(communityRepositories.sourceId, communitySources.id),
				)
				.where(
					and(
						eventScoped,
						eq(communityEvents.type, "pull-request-merged"),
					),
				),
			db
				.select({ value: countDistinct(communityEvents.actor) })
				.from(communityEvents)
				.innerJoin(
					communityRepositories,
					eq(communityEvents.repositoryId, communityRepositories.id),
				)
				.innerJoin(
					communitySources,
					eq(communityRepositories.sourceId, communitySources.id),
				)
				.where(and(eventScoped, sql`${communityEvents.actor} is not null`)),
			db
				.select({ value: count() })
				.from(communityReleases)
				.innerJoin(
					communityRepositories,
					eq(communityReleases.repositoryId, communityRepositories.id),
				)
				.innerJoin(
					communitySources,
					eq(communityRepositories.sourceId, communitySources.id),
				)
				.where(
					and(
						eq(communitySources.organizationId, orgId),
						eq(communityReleases.isDraft, false),
						gte(communityReleases.publishedAt, range.from),
						lte(communityReleases.publishedAt, range.to),
					),
				),
			db
				.select({
					id: communitySources.id,
					status: communitySources.status,
					lastSuccessfulSyncAt: communitySources.lastSuccessfulSyncAt,
				})
				.from(communitySources)
				.where(eq(communitySources.organizationId, orgId)),
		]);

	const statusCounts = new Map<string, number>();
	for (const row of sourceRows) {
		statusCounts.set(row.status, (statusCounts.get(row.status) ?? 0) + 1);
	}

	const lastSyncedAt = sourceRows
		.map((row) => row.lastSuccessfulSyncAt)
		.filter((value): value is Date => value instanceof Date)
		.sort((a, b) => b.getTime() - a.getTime())[0];

	return {
		repositories: repositories.length,
		openIssues: repositories.reduce((sum, row) => sum + row.openIssues, 0),
		openPullRequests: repositories.reduce(
			(sum, row) => sum + row.openPullRequests,
			0,
		),
		awaitingReview,
		unansweredIssues,
		unassigned,
		contributionsInPeriod: Number(eventTotals[0]?.value ?? 0),
		mergedPullRequests: Number(mergedTotals[0]?.value ?? 0),
		activeContributors: Number(contributors[0]?.value ?? 0),
		releasesInPeriod: Number(releaseTotals[0]?.value ?? 0),
		lastSyncedAt: lastSyncedAt?.toISOString() ?? null,
		sourceStatuses: [...statusCounts.entries()].map(([status, value]) => ({
			status,
			count: value,
		})),
		comparisonAvailable: false,
	};
};

export interface CommunityRepositoryView {
	id: string;
	sourceId: string;
	owner: string;
	name: string;
	fullName: string;
	description: string | null;
	language: string | null;
	isArchived: boolean;
	isPrivate: boolean;
	stars: number;
	forks: number;
	openIssues: number;
	openPullRequests: number;
	defaultBranch: string | null;
	webUrl: string | null;
	topics: string[];
	license: string | null;
	pushedAt: string | null;
	lastReleaseTag: string | null;
	lastReleaseAt: string | null;
	health: CommunityHealthProfileView | null;
	syncedAt: string | null;
}

export interface CommunityHealthProfileView {
	healthPercentage: number | null;
	hasReadme: boolean;
	hasContributing: boolean;
	hasCodeOfConduct: boolean;
	hasIssueTemplate: boolean;
	hasPullRequestTemplate: boolean;
	hasSecurityPolicy: boolean;
	hasLicense: boolean;
	hasDocs: boolean;
}

export const listCommunityRepositories = async (input: {
	organizationId: string;
	sourceId?: string;
	search?: string;
}): Promise<CommunityRepositoryView[]> => {
	const conditions = [
		eq(communitySources.organizationId, input.organizationId),
		input.sourceId ? eq(communityRepositories.sourceId, input.sourceId) : undefined,
		input.search
			? or(
					sql`${communityRepositories.fullName} ilike ${`%${input.search}%`}`,
					sql`coalesce(${communityRepositories.description}, '') ilike ${`%${input.search}%`}`,
				)
			: undefined,
	].filter((value): value is NonNullable<typeof value> => value !== undefined);

	const rows = await db
		.select({
			repository: communityRepositories,
			sourceId: communitySources.id,
		})
		.from(communityRepositories)
		.innerJoin(
			communitySources,
			eq(communityRepositories.sourceId, communitySources.id),
		)
		.where(and(...conditions))
		.orderBy(desc(communityRepositories.pushedAt));

	return rows.map(({ repository }) => ({
		id: repository.id,
		sourceId: repository.sourceId,
		owner: repository.owner,
		name: repository.name,
		fullName: repository.fullName,
		description: repository.description,
		language: repository.language,
		isArchived: repository.isArchived,
		isPrivate: repository.isPrivate,
		stars: repository.stars,
		forks: repository.forks,
		openIssues: repository.openIssues,
		openPullRequests: repository.openPullRequests,
		defaultBranch: repository.defaultBranch,
		webUrl: repository.webUrl,
		topics: repository.topics,
		license: repository.license,
		pushedAt: repository.pushedAt?.toISOString() ?? null,
		lastReleaseTag: repository.lastReleaseTag,
		lastReleaseAt: repository.lastReleaseAt?.toISOString() ?? null,
		health: repository.health ?? null,
		syncedAt: repository.syncedAt?.toISOString() ?? null,
	}));
};

export interface CommunityAttentionItem {
	id: string;
	repositoryFullName: string;
	repositoryUrl: string | null;
	kind: string;
	number: number;
	title: string;
	author: string | null;
	url: string;
	isDraft: boolean;
	openedAt: string;
	updatedAtSource: string | null;
	attention: string[];
	reasons: string[];
}

export const listCommunityAttention = async (input: {
	organizationId: string;
	repositoryIds?: string[];
	limit?: number;
}): Promise<CommunityAttentionItem[]> => {
	const conditions = [
		eq(communitySources.organizationId, input.organizationId),
		sql`${communityContributions.attention} != '[]'::jsonb`,
		input.repositoryIds && input.repositoryIds.length > 0
			? inArray(communityContributions.repositoryId, input.repositoryIds)
			: undefined,
	].filter((value): value is NonNullable<typeof value> => value !== undefined);

	const rows = await db
		.select({
			contribution: communityContributions,
			fullName: communityRepositories.fullName,
			repositoryUrl: communityRepositories.webUrl,
		})
		.from(communityContributions)
		.innerJoin(
			communityRepositories,
			eq(communityContributions.repositoryId, communityRepositories.id),
		)
		.innerJoin(
			communitySources,
			eq(communityRepositories.sourceId, communitySources.id),
		)
		.where(and(...conditions))
		.orderBy(desc(communityContributions.updatedAtSource))
		.limit(Math.min(input.limit ?? 50, 200));

	return rows.map(({ contribution, fullName, repositoryUrl }) => ({
		id: contribution.id,
		repositoryFullName: fullName,
		repositoryUrl,
		kind: contribution.kind,
		number: contribution.number,
		title: contribution.title,
		author: contribution.author,
		url: contribution.url,
		isDraft: contribution.isDraft,
		openedAt: contribution.openedAt.toISOString(),
		updatedAtSource: contribution.updatedAtSource?.toISOString() ?? null,
		attention: contribution.attention,
		reasons: contribution.attentionReasons,
	}));
};

export interface CommunityActivityItem {
	id: string;
	repositoryId: string;
	repositoryFullName: string;
	type: string;
	sourceType: string;
	actor: string | null;
	actorAvatarUrl: string | null;
	title: string;
	url: string | null;
	occurredAt: string;
}

export const listCommunityActivity = async (input: {
	organizationId: string;
	range?: { from: Date; to: Date };
	repositoryIds?: string[];
	types?: string[];
	limit?: number;
	offset?: number;
}): Promise<{ items: CommunityActivityItem[]; total: number }> => {
	const range = input.range ?? resolveCommunityRange({ preset: "30d" });

	const conditions = [
		eq(communitySources.organizationId, input.organizationId),
		gte(communityEvents.occurredAt, range.from),
		lte(communityEvents.occurredAt, range.to),
		input.repositoryIds && input.repositoryIds.length > 0
			? inArray(communityEvents.repositoryId, input.repositoryIds)
			: undefined,
		input.types && input.types.length > 0
			? inArray(communityEvents.type, input.types as never)
			: undefined,
	].filter((value): value is NonNullable<typeof value> => value !== undefined);

	const where = and(...conditions);

	const [rows, totals] = await Promise.all([
		db
			.select({
				id: communityEvents.id,
				repositoryId: communityEvents.repositoryId,
				repositoryFullName: communityEvents.repositoryFullName,
				type: communityEvents.type,
				sourceType: communityEvents.sourceType,
				actor: communityEvents.actor,
				actorAvatarUrl: communityEvents.actorAvatarUrl,
				title: communityEvents.title,
				url: communityEvents.url,
				occurredAt: communityEvents.occurredAt,
			})
			.from(communityEvents)
			.innerJoin(
				communityRepositories,
				eq(communityEvents.repositoryId, communityRepositories.id),
			)
			.innerJoin(
				communitySources,
				eq(communityRepositories.sourceId, communitySources.id),
			)
			.where(where)
			.orderBy(desc(communityEvents.occurredAt))
			.limit(Math.min(input.limit ?? 30, 100))
			.offset(Math.max(input.offset ?? 0, 0)),
		db
			.select({ value: count() })
			.from(communityEvents)
			.innerJoin(
				communityRepositories,
				eq(communityEvents.repositoryId, communityRepositories.id),
			)
			.innerJoin(
				communitySources,
				eq(communityRepositories.sourceId, communitySources.id),
			)
			.where(where),
	]);

	return {
		items: rows.map((row) => ({
			...row,
			occurredAt: row.occurredAt.toISOString(),
		})),
		total: Number(totals[0]?.value ?? 0),
	};
};

export interface CommunityReleaseView {
	id: string;
	repositoryFullName: string;
	repositoryUrl: string | null;
	tagName: string;
	name: string | null;
	isDraft: boolean;
	isPrerelease: boolean;
	publishedAt: string | null;
	url: string;
	body: string | null;
	author: string | null;
}

export const listCommunityReleases = async (input: {
	organizationId: string;
	repositoryIds?: string[];
	limit?: number;
}): Promise<CommunityReleaseView[]> => {
	const conditions = [
		eq(communitySources.organizationId, input.organizationId),
		eq(communityReleases.isDraft, false),
		input.repositoryIds && input.repositoryIds.length > 0
			? inArray(communityReleases.repositoryId, input.repositoryIds)
			: undefined,
	].filter((value): value is NonNullable<typeof value> => value !== undefined);

	const rows = await db
		.select({
			release: communityReleases,
			fullName: communityRepositories.fullName,
			repositoryUrl: communityRepositories.webUrl,
		})
		.from(communityReleases)
		.innerJoin(
			communityRepositories,
			eq(communityReleases.repositoryId, communityRepositories.id),
		)
		.innerJoin(
			communitySources,
			eq(communityRepositories.sourceId, communitySources.id),
		)
		.where(and(...conditions))
		.orderBy(desc(communityReleases.publishedAt))
		.limit(Math.min(input.limit ?? 10, 50));

	return rows.map(({ release, fullName, repositoryUrl }) => ({
		id: release.id,
		repositoryFullName: fullName,
		repositoryUrl,
		tagName: release.tagName,
		name: release.name,
		isDraft: release.isDraft,
		isPrerelease: release.isPrerelease,
		publishedAt: release.publishedAt?.toISOString() ?? null,
		url: release.url,
		body: release.body,
		author: release.author,
	}));
};

/**
 * Ecosystem-health hints: which contribution resources each tracked repository
 * has. Reported as presence only, deliberately without a quality verdict.
 */
export const getCommunityHealthReport = async (input: {
	organizationId: string;
	repositoryIds?: string[];
}) => {
	const repositories = await listCommunityRepositories({
		organizationId: input.organizationId,
	});
	const scoped = input.repositoryIds?.length
		? repositories.filter((repository) =>
				input.repositoryIds?.includes(repository.id),
			)
		: repositories;

	const required: {
		key: keyof CommunityHealthProfileView;
		label: string;
	}[] = [
		{ key: "hasReadme", label: "README" },
		{ key: "hasContributing", label: "CONTRIBUTING.md" },
		{ key: "hasCodeOfConduct", label: "Code of conduct" },
		{ key: "hasIssueTemplate", label: "Issue template" },
		{ key: "hasPullRequestTemplate", label: "Pull request template" },
		{ key: "hasSecurityPolicy", label: "SECURITY.md" },
		{ key: "hasLicense", label: "License" },
	];

	const items = scoped.map((repository) => {
		const health = repository.health;
		const missing = required
			.filter(({ key }) => !health?.[key])
			.map(({ label }) => label);
		return {
			repositoryId: repository.id,
			repositoryFullName: repository.fullName,
			webUrl: repository.webUrl,
			healthPercentage: health?.healthPercentage ?? null,
			missing,
			checkedAt: repository.syncedAt,
		};
	});

	return {
		checkedRepositories: scoped.length,
		items,
	};
};
