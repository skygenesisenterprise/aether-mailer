import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { organization } from "./account";
import { gitProvider } from "./git-provider";

/**
 * Community Console schema.
 *
 * The Community page follows the open-source activity of the repositories an
 * organization tracks on GitHub. It is deliberately split from the Traffic
 * Manager: traffic counts *visitors* (a web audience), community counts
 * *contributors* (a repository audience). The two never share a metric.
 *
 * The data model keeps three concerns apart:
 *
 * - **Sources** (`communitySources`): one GitHub connection being watched. The
 *   credentials live in the existing Git provider tables; a source only
 *   references them, so no GitHub secret is ever duplicated here.
 * - **Repositories** (`communityRepositories`): the repositories selected for
 *   tracking, with their metadata and the community-health profile GitHub
 *   reports. These rows are a cache of GitHub, never a second source of truth.
 * - **Activity** (`communityContributions`, `communityReleases`,
 *   `communityEvents`): the issues, pull requests, releases and events used by
 *   the overview, the attention list and the chronological feed.
 *
 * A sync replaces the activity rows of one repository (delete + insert inside a
 * transaction), so a closed issue or a merged pull request disappears instead of
 * lingering. There is no per-contribution history: the feed itself carries the
 * dates, which is enough for the first version. If long-term trends are needed
 * later, an aggregate table (`repository × day`) is the next step — not a row
 * per event.
 */

/** Connection state of a source, as shown in the header. */
export const communitySourceStatus = pgEnum("communitySourceStatus", [
	/** Last sync succeeded. */
	"connected",
	/** A sync is currently running. */
	"syncing",
	/** Last sync failed with an unexpected error. */
	"error",
	/** GitHub refused the call because the rate limit was reached. */
	"rate-limited",
	/** The GitHub App is missing or no longer installed. */
	"needs-authorization",
]);

/** Kind of contribution tracked in the attention list. */
export const communityContributionKind = pgEnum("communityContributionKind", [
	"issue",
	"pull-request",
]);

/** Normalized type of a feed event. */
export const communityEventType = pgEnum("communityEventType", [
	"issue-opened",
	"issue-closed",
	"pull-request-opened",
	"pull-request-review",
	"pull-request-merged",
	"pull-request-closed",
	"release-published",
	"repository-activity",
	"other",
]);

/**
 * A GitHub connection being watched.
 *
 * `owner` is the account or organization whose repositories are followed; it is
 * stored explicitly because a single GitHub App installation may cover several
 * accounts, and the Console only wants to follow one of them.
 */
export const communitySources = pgTable(
	"communitySources",
	{
		id: text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		organizationId: text("organizationId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		/**
		 * Git provider holding the credentials. Only `github` connections are
		 * accepted today; the column is a provider id so other providers can be
		 * added without a migration.
		 */
		gitProviderId: text("gitProviderId")
			.notNull()
			.references(() => gitProvider.gitProviderId, { onDelete: "cascade" }),
		/** GitHub account or organization slug being followed. */
		owner: text("owner").notNull(),
		enabled: boolean("enabled").notNull().default(true),
		status: communitySourceStatus("status").notNull().default("connected"),
		/** Last completed sync, successful or not. */
		lastSyncedAt: timestamp("lastSyncedAt", { withTimezone: true }),
		/** Last *successful* sync, used to report data freshness. */
		lastSuccessfulSyncAt: timestamp("lastSuccessfulSyncAt", {
			withTimezone: true,
		}),
		/** Actionable message shown next to the source; never a secret. */
		lastError: text("lastError"),
		lastErrorAt: timestamp("lastErrorAt", { withTimezone: true }),
		/** Number of GitHub calls spent by the last sync, for diagnostics. */
		lastApiCalls: integer("lastApiCalls").notNull().default(0),
		createdAt: timestamp("createdAt", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updatedAt", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		uniqueIndex("community_sources_org_provider_owner_idx").on(
			table.organizationId,
			table.gitProviderId,
			table.owner,
		),
		index("community_sources_org_idx").on(table.organizationId),
	],
);

/** Community-health profile of a repository, as reported by GitHub. */
export interface CommunityHealthProfile {
	/** GitHub `health_percentage`, `null` when the profile could not be read. */
	healthPercentage: number | null;
	/** Presence only — never a judgement on the content of the file. */
	hasReadme: boolean;
	hasContributing: boolean;
	hasCodeOfConduct: boolean;
	hasIssueTemplate: boolean;
	hasPullRequestTemplate: boolean;
	hasSecurityPolicy: boolean;
	hasLicense: boolean;
	hasDocs: boolean;
}

/** A repository tracked by the Community Console. */
export const communityRepositories = pgTable(
	"communityRepositories",
	{
		id: text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		sourceId: text("sourceId")
			.notNull()
			.references(() => communitySources.id, { onDelete: "cascade" }),
		owner: text("owner").notNull(),
		name: text("name").notNull(),
		/** `owner/name`, the stable key used by every GitHub call. */
		fullName: text("fullName").notNull(),
		description: text("description"),
		language: text("language"),
		isArchived: boolean("isArchived").notNull().default(false),
		isPrivate: boolean("isPrivate").notNull().default(false),
		stars: integer("stars").notNull().default(0),
		forks: integer("forks").notNull().default(0),
		openIssues: integer("openIssues").notNull().default(0),
		openPullRequests: integer("openPullRequests").notNull().default(0),
		defaultBranch: text("defaultBranch"),
		webUrl: text("webUrl"),
		topics: jsonb("topics").$type<string[]>().notNull().default([]),
		license: text("license"),
		/** Last push as reported by GitHub (`pushed_at`). */
		pushedAt: timestamp("pushedAt", { withTimezone: true }),
		/** Latest published release, flattened for the repository list. */
		lastReleaseTag: text("lastReleaseTag"),
		lastReleaseAt: timestamp("lastReleaseAt", { withTimezone: true }),
		health: jsonb("health").$type<CommunityHealthProfile>(),
		/** Last time this repository's rows were refreshed from GitHub. */
		syncedAt: timestamp("syncedAt", { withTimezone: true }),
		createdAt: timestamp("createdAt", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updatedAt", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		uniqueIndex("community_repositories_source_full_name_idx").on(
			table.sourceId,
			table.fullName,
		),
		index("community_repositories_source_idx").on(table.sourceId),
		index("community_repositories_pushed_idx").on(table.pushedAt),
	],
);

/**
 * An open issue or pull request waiting on the team.
 *
 * Only *open* items are stored: once an issue is closed or a pull request
 * merged, it belongs to the feed, not to the attention list. `attention` holds
 * the rule codes that flagged the item (`unassigned`, `unanswered`,
 * `awaiting-review`, `stale`) and `attentionReasons` the plain-English sentence
 * shown to the operator, so the prioritization is explicit and auditable rather
 * than an opaque score.
 */
export const communityContributions = pgTable(
	"communityContributions",
	{
		id: text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		repositoryId: text("repositoryId")
			.notNull()
			.references(() => communityRepositories.id, { onDelete: "cascade" }),
		kind: communityContributionKind("kind").notNull(),
		/** GitHub issue / pull request number. */
		number: integer("number").notNull(),
		title: text("title").notNull(),
		author: text("author"),
		authorAvatarUrl: text("authorAvatarUrl"),
		url: text("url").notNull(),
		isDraft: boolean("isDraft").notNull().default(false),
		/** Number of people a review was requested from. */
		reviewRequestedCount: integer("reviewRequestedCount").notNull().default(0),
		assigneeCount: integer("assigneeCount").notNull().default(0),
		commentCount: integer("commentCount").notNull().default(0),
		/** When the item was opened on GitHub. */
		openedAt: timestamp("openedAt", { withTimezone: true }).notNull(),
		/** When the item was last touched on GitHub. */
		updatedAtSource: timestamp("updatedAtSource", { withTimezone: true }),
		attention: jsonb("attention").$type<string[]>().notNull().default([]),
		attentionReasons: jsonb("attentionReasons")
			.$type<string[]>()
			.notNull()
			.default([]),
		syncedAt: timestamp("syncedAt", { withTimezone: true }),
	},
	(table) => [
		uniqueIndex("community_contributions_repo_kind_number_idx").on(
			table.repositoryId,
			table.kind,
			table.number,
		),
		index("community_contributions_repository_idx").on(table.repositoryId),
		index("community_contributions_updated_idx").on(table.updatedAtSource),
	],
);

/** A published (or pre-)release of a tracked repository. */
export const communityReleases = pgTable(
	"communityReleases",
	{
		id: text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		repositoryId: text("repositoryId")
			.notNull()
			.references(() => communityRepositories.id, { onDelete: "cascade" }),
		/** GitHub's release id, used to detect replacements. */
		externalId: text("externalId").notNull(),
		tagName: text("tagName").notNull(),
		name: text("name"),
		isDraft: boolean("isDraft").notNull().default(false),
		isPrerelease: boolean("isPrerelease").notNull().default(false),
		publishedAt: timestamp("publishedAt", { withTimezone: true }),
		url: text("url").notNull(),
		/** Release notes, truncated on ingest so the table stays bounded. */
		body: text("body"),
		author: text("author"),
		syncedAt: timestamp("syncedAt", { withTimezone: true }),
	},
	(table) => [
		uniqueIndex("community_releases_repo_external_idx").on(
			table.repositoryId,
			table.externalId,
		),
		index("community_releases_repo_published_idx").on(
			table.repositoryId,
			table.publishedAt,
		),
	],
);

/** One event of the chronological community feed. */
export const communityEvents = pgTable(
	"communityEvents",
	{
		id: text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		repositoryId: text("repositoryId")
			.notNull()
			.references(() => communityRepositories.id, { onDelete: "cascade" }),
		/** `owner/name`, denormalized so the feed renders without a join. */
		repositoryFullName: text("repositoryFullName").notNull(),
		/** GitHub's event id, unique per repository and used for upserts. */
		externalId: text("externalId").notNull(),
		type: communityEventType("type").notNull(),
		/** Raw GitHub event type, kept for diagnostics. */
		sourceType: text("sourceType").notNull(),
		actor: text("actor"),
		actorAvatarUrl: text("actorAvatarUrl"),
		title: text("title").notNull(),
		url: text("url"),
		occurredAt: timestamp("occurredAt", { withTimezone: true }).notNull(),
		syncedAt: timestamp("syncedAt", { withTimezone: true }),
	},
	(table) => [
		uniqueIndex("community_events_repo_external_idx").on(
			table.repositoryId,
			table.externalId,
		),
		index("community_events_occurred_idx").on(table.occurredAt),
		index("community_events_repo_occurred_idx").on(
			table.repositoryId,
			table.occurredAt,
		),
		index("community_events_type_idx").on(table.type),
	],
);

export const communitySourcesRelations = relations(
	communitySources,
	({ one, many }) => ({
		organization: one(organization, {
			fields: [communitySources.organizationId],
			references: [organization.id],
		}),
		gitProvider: one(gitProvider, {
			fields: [communitySources.gitProviderId],
			references: [gitProvider.gitProviderId],
		}),
		repositories: many(communityRepositories),
	}),
);

export const communityRepositoriesRelations = relations(
	communityRepositories,
	({ one, many }) => ({
		source: one(communitySources, {
			fields: [communityRepositories.sourceId],
			references: [communitySources.id],
		}),
		contributions: many(communityContributions),
		releases: many(communityReleases),
		events: many(communityEvents),
	}),
);

export const communityContributionsRelations = relations(
	communityContributions,
	({ one }) => ({
		repository: one(communityRepositories, {
			fields: [communityContributions.repositoryId],
			references: [communityRepositories.id],
		}),
	}),
);

export const communityReleasesRelations = relations(
	communityReleases,
	({ one }) => ({
		repository: one(communityRepositories, {
			fields: [communityReleases.repositoryId],
			references: [communityRepositories.id],
		}),
	}),
);

export const communityEventsRelations = relations(communityEvents, ({ one }) => ({
	repository: one(communityRepositories, {
		fields: [communityEvents.repositoryId],
		references: [communityRepositories.id],
	}),
}));

export type CommunitySource = typeof communitySources.$inferSelect;
export type NewCommunitySource = typeof communitySources.$inferInsert;
export type CommunityRepository = typeof communityRepositories.$inferSelect;
export type NewCommunityRepository = typeof communityRepositories.$inferInsert;
export type CommunityContribution =
	typeof communityContributions.$inferSelect;
export type NewCommunityContribution =
	typeof communityContributions.$inferInsert;
export type CommunityRelease = typeof communityReleases.$inferSelect;
export type NewCommunityRelease = typeof communityReleases.$inferInsert;
export type CommunityEvent = typeof communityEvents.$inferSelect;
export type NewCommunityEvent = typeof communityEvents.$inferInsert;

export type CommunitySourceStatus =
	(typeof communitySourceStatus.enumValues)[number];
export type CommunityContributionKind =
	(typeof communityContributionKind.enumValues)[number];
export type CommunityEventType = (typeof communityEventType.enumValues)[number];
