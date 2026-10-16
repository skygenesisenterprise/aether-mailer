/**
 * Community Console — pure mapping and rule helpers.
 *
 * Everything here is side-effect free and independent of both GitHub's client
 * and the database, so the rules that decide *what needs attention* and *how an
 * event is labelled* can be unit-tested from fixtures. The service that talks to
 * GitHub and Postgres imports these functions instead of re-implementing them.
 */

import type {
	CommunityContributionKind,
	CommunityEventType,
	CommunityHealthProfile,
} from "@notploy/server/db/schema";

/* -------------------------------------------------------------------------- */
/* Attention rules                                                            */
/* -------------------------------------------------------------------------- */

/**
 * The reasons a contribution is surfaced in the "needs attention" list.
 *
 * Rules are explicit and additive: an item can be flagged by several at once,
 * and every flag carries the sentence shown to the operator. This replaces a
 * composite score, which would hide *why* something is prioritized.
 */
export const COMMUNITY_ATTENTION_RULES = [
	"awaiting-review",
	"stale",
	"unanswered",
	"unassigned",
] as const;

export type CommunityAttentionRule =
	(typeof COMMUNITY_ATTENTION_RULES)[number];

export const COMMUNITY_ATTENTION_LABELS: Record<
	CommunityAttentionRule,
	string
> = {
	"awaiting-review": "Awaiting review",
	stale: "Stale",
	unanswered: "Unanswered",
	unassigned: "Unassigned",
};

export interface CommunityAttentionThresholds {
	/** Days without an update before an open pull request is considered stale. */
	stalePullRequestDays: number;
	/** Days without a comment before an open issue is considered unanswered. */
	unansweredIssueDays: number;
	/** Days without an update before an open issue is considered stale. */
	staleIssueDays: number;
}

export const DEFAULT_ATTENTION_THRESHOLDS: CommunityAttentionThresholds = {
	stalePullRequestDays: 7,
	unansweredIssueDays: 3,
	staleIssueDays: 30,
};

const readPositiveInt = (value: string | undefined, fallback: number): number => {
	const parsed = Number.parseInt(value ?? "", 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

/** Reads the thresholds from the environment, falling back to the defaults. */
export const resolveAttentionThresholds = (
	env: NodeJS.ProcessEnv = process.env,
): CommunityAttentionThresholds => ({
	stalePullRequestDays: readPositiveInt(
		env.COMMUNITY_STALE_PR_DAYS,
		DEFAULT_ATTENTION_THRESHOLDS.stalePullRequestDays,
	),
	unansweredIssueDays: readPositiveInt(
		env.COMMUNITY_UNANSWERED_ISSUE_DAYS,
		DEFAULT_ATTENTION_THRESHOLDS.unansweredIssueDays,
	),
	staleIssueDays: readPositiveInt(
		env.COMMUNITY_STALE_ISSUE_DAYS,
		DEFAULT_ATTENTION_THRESHOLDS.staleIssueDays,
	),
});

export interface AttentionInput {
	kind: CommunityContributionKind;
	/** Drafts are work in progress and are never prioritized. */
	isDraft: boolean;
	/** Number of requested reviewers (pull requests only). */
	reviewRequestedCount: number;
	assigneeCount: number;
	commentCount: number;
	openedAt: Date;
	/** Last update on GitHub; falls back to `openedAt` when absent. */
	updatedAt: Date | null;
	/** Reference instant, injectable so the rules are testable. */
	now: Date;
}

export interface AttentionResult {
	attention: CommunityAttentionRule[];
	reasons: string[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

const daysBetween = (from: Date, to: Date): number =>
	Math.floor((to.getTime() - from.getTime()) / DAY_MS);

/**
 * Applies every attention rule to one contribution.
 *
 * The output is deterministic for a given `now`, so the same item is flagged the
 * same way during a sync and in the tests.
 */
export const computeContributionAttention = (
	input: AttentionInput,
	thresholds: CommunityAttentionThresholds = DEFAULT_ATTENTION_THRESHOLDS,
): AttentionResult => {
	const attention: CommunityAttentionRule[] = [];
	const reasons: string[] = [];
	const lastTouched = input.updatedAt ?? input.openedAt;
	const ageDays = daysBetween(lastTouched, input.now);
	const openedDays = daysBetween(input.openedAt, input.now);

	if (input.kind === "pull-request") {
		if (!input.isDraft) {
			if (input.reviewRequestedCount > 0) {
				attention.push("awaiting-review");
				reasons.push(
					`A review was requested from ${input.reviewRequestedCount} ${
						input.reviewRequestedCount === 1 ? "reviewer" : "reviewers"
					} and the pull request is still open.`,
				);
			}
			if (ageDays >= thresholds.stalePullRequestDays) {
				attention.push("stale");
				reasons.push(
					`No update for ${ageDays} days (threshold: ${thresholds.stalePullRequestDays}).`,
				);
			}
		}
	} else {
		if (input.commentCount === 0 && openedDays >= thresholds.unansweredIssueDays) {
			attention.push("unanswered");
			reasons.push(
				`No comment since it was opened ${openedDays} days ago (threshold: ${thresholds.unansweredIssueDays}).`,
			);
		}
		if (ageDays >= thresholds.staleIssueDays) {
			attention.push("stale");
			reasons.push(
				`No update for ${ageDays} days (threshold: ${thresholds.staleIssueDays}).`,
			);
		}
	}

	if (input.assigneeCount === 0) {
		attention.push("unassigned");
		reasons.push("No assignee is set.");
	}

	return { attention, reasons };
};

/* -------------------------------------------------------------------------- */
/* Event classification                                                       */
/* -------------------------------------------------------------------------- */

export interface GithubEventLike {
	type?: string | null;
	/** Octokit payloads are per-event unions; they are read structurally. */
	payload?: unknown;
	actor?: { login?: string | null; avatar_url?: string | null } | null;
}

const payloadOf = (event: GithubEventLike): Record<string, unknown> =>
	(event.payload ?? {}) as Record<string, unknown>;

const actionOf = (event: GithubEventLike): string | null => {
	const action = payloadOf(event).action;
	return typeof action === "string" ? action : null;
};

/**
 * Maps a GitHub repository event to the Console's normalized vocabulary.
 *
 * Unmapped events are `other` rather than dropped: the feed shows them as
 * repository activity, which is honest about what happened without pretending to
 * understand it.
 */
export const classifyCommunityEvent = (
	event: GithubEventLike,
): CommunityEventType => {
	const type = event.type ?? "";
	const action = actionOf(event);
	const payload = payloadOf(event);

	switch (type) {
		case "IssuesEvent":
			if (action === "closed") return "issue-closed";
			if (action === "opened") return "issue-opened";
			return "other";
		case "PullRequestEvent":
			if (action === "closed") {
				// GitHub reports a merge as a `closed` action with `merged: true`.
				const merged = (payload.pull_request as { merged?: boolean } | undefined)
					?.merged;
				return merged ? "pull-request-merged" : "pull-request-closed";
			}
			if (action === "opened") return "pull-request-opened";
			return "other";
		case "PullRequestReviewEvent":
			return "pull-request-review";
		case "ReleaseEvent":
			return action === "published" ? "release-published" : "other";
		case "PushEvent":
		case "CreateEvent":
		case "DeleteEvent":
		case "ForkEvent":
		case "WatchEvent":
		case "PublicEvent":
			return "repository-activity";
		default:
			return "other";
	}
};

interface PullRequestPayload {
	number?: number;
	title?: string;
	html_url?: string;
	merged?: boolean;
	user?: { login?: string } | null;
}

interface IssuePayload {
	number?: number;
	title?: string;
	html_url?: string;
	user?: { login?: string } | null;
}

interface ReleasePayload {
	tag_name?: string;
	name?: string | null;
	html_url?: string;
}

/** Short human sentence describing an event, used as the feed title. */
export const describeCommunityEvent = (event: GithubEventLike): string => {
	const type = event.type ?? "";
	const payload = payloadOf(event);

	switch (type) {
		case "IssuesEvent": {
			const issue = payload.issue as IssuePayload | undefined;
			const action = actionOf(event);
			return `${action === "closed" ? "Closed" : "Opened"} issue #${
				issue?.number ?? "?"
			} — ${issue?.title ?? "untitled"}`;
		}
		case "PullRequestEvent": {
			const pull = payload.pull_request as PullRequestPayload | undefined;
			const action = actionOf(event);
			const verb =
				action === "opened"
					? "Opened"
					: pull?.merged
						? "Merged"
						: action === "closed"
							? "Closed"
							: "Updated";
			return `${verb} pull request #${pull?.number ?? "?"} — ${
				pull?.title ?? "untitled"
			}`;
		}
		case "PullRequestReviewEvent": {
			const pull = payload.pull_request as PullRequestPayload | undefined;
			const state =
				(payload.review as { state?: string } | undefined)?.state ?? "reviewed";
			return `Reviewed pull request #${pull?.number ?? "?"} (${state.toLowerCase()})`;
		}
		case "ReleaseEvent": {
			const release = payload.release as ReleasePayload | undefined;
			return `Published release ${release?.tag_name ?? release?.name ?? ""}`.trim();
		}
		case "PushEvent": {
			const commits = payload.commits as unknown[] | undefined;
			const count = Array.isArray(commits) ? commits.length : 0;
			return count > 0
				? `Pushed ${count} commit${count === 1 ? "" : "s"}`
				: "Pushed to the repository";
		}
		case "ForkEvent":
			return "Repository forked";
		case "WatchEvent":
			return "Repository starred";
		case "CreateEvent": {
			const ref = payload.ref as string | undefined;
			const refType = payload.ref_type as string | undefined;
			return ref ? `Created ${refType ?? "reference"} ${ref}` : "Repository activity";
		}
		default:
			return type.replace(/Event$/, "") || "Repository activity";
	}
};

/** Web link carried by an event, when GitHub provides one. */
export const eventUrlOf = (event: GithubEventLike): string | null => {
	const payload = payloadOf(event);
	const type = event.type ?? "";
	if (type === "IssuesEvent") {
		return (payload.issue as IssuePayload | undefined)?.html_url ?? null;
	}
	if (type === "PullRequestEvent" || type === "PullRequestReviewEvent") {
		return (payload.pull_request as PullRequestPayload | undefined)?.html_url ?? null;
	}
	if (type === "ReleaseEvent") {
		return (payload.release as ReleasePayload | undefined)?.html_url ?? null;
	}
	return null;
};

/** Actor of an event, when GitHub provides one. */
export const eventActorOf = (
	event: GithubEventLike,
): { login: string | null; avatarUrl: string | null } => {
	// Prefer the actor of the sub-resource (issue / PR author) when available,
	// because that is who the reader cares about, not the event emitter.
	const payload = payloadOf(event);
	const author =
		(payload.issue as IssuePayload | undefined)?.user?.login ??
		(payload.pull_request as PullRequestPayload | undefined)?.user?.login ??
		event.actor?.login ??
		null;
	return {
		login: author,
		avatarUrl: event.actor?.avatar_url ?? null,
	};
};

/* -------------------------------------------------------------------------- */
/* GitHub resource mapping                                                    */
/* -------------------------------------------------------------------------- */

export interface GithubRepositoryLike {
	id?: number;
	name?: string;
	full_name?: string;
	owner?: { login?: string } | null;
	description?: string | null;
	language?: string | null;
	archived?: boolean;
	private?: boolean;
	stargazers_count?: number;
	forks_count?: number;
	open_issues_count?: number;
	default_branch?: string | null;
	html_url?: string | null;
	topics?: string[] | null;
	license?: { spdx_id?: string | null; name?: string | null } | null;
	pushed_at?: string | null;
}

export interface MappedRepository {
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
	defaultBranch: string | null;
	webUrl: string | null;
	topics: string[];
	license: string | null;
	pushedAt: Date | null;
}

const toDate = (value: string | null | undefined): Date | null => {
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
};

export const mapGithubRepository = (
	repository: GithubRepositoryLike,
): MappedRepository | null => {
	const fullName = repository.full_name ?? "";
	const [owner, name] = fullName.split("/");
	if (!owner || !name || !repository.id) {
		return null;
	}
	return {
		owner,
		name,
		fullName,
		description: repository.description ?? null,
		language: repository.language ?? null,
		isArchived: !!repository.archived,
		isPrivate: !!repository.private,
		stars: repository.stargazers_count ?? 0,
		forks: repository.forks_count ?? 0,
		// `open_issues_count` counts issues *and* pull requests; the caller
		// replaces it with the figures it computes, this is only a fallback.
		openIssues: repository.open_issues_count ?? 0,
		defaultBranch: repository.default_branch ?? null,
		webUrl: repository.html_url ?? null,
		topics: Array.isArray(repository.topics) ? repository.topics : [],
		license:
			repository.license?.spdx_id ?? repository.license?.name ?? null,
		pushedAt: toDate(repository.pushed_at),
	};
};

export interface GithubIssueLike {
	number: number;
	title: string;
	state?: string;
	user?: { login?: string; avatar_url?: string } | null;
	html_url?: string;
	comments?: number;
	assignees?: unknown[] | null;
	created_at?: string | null;
	updated_at?: string | null;
	/** Present only on pull requests returned by the issues endpoint. */
	pull_request?: unknown;
}

export interface GithubPullLike {
	number: number;
	title: string;
	state?: string;
	draft?: boolean;
	user?: { login?: string; avatar_url?: string } | null;
	html_url?: string;
	comments?: number;
	review_comments?: number;
	assignees?: unknown[] | null;
	requested_reviewers?: unknown[] | null;
	created_at?: string | null;
	updated_at?: string | null;
}

export interface MappedContribution {
	kind: CommunityContributionKind;
	number: number;
	title: string;
	author: string | null;
	authorAvatarUrl: string | null;
	url: string;
	isDraft: boolean;
	reviewRequestedCount: number;
	assigneeCount: number;
	commentCount: number;
	openedAt: Date;
	updatedAtSource: Date | null;
}

export const mapGithubIssue = (
	issue: GithubIssueLike,
	now: Date,
	thresholds: CommunityAttentionThresholds = DEFAULT_ATTENTION_THRESHOLDS,
): (MappedContribution & AttentionResult) | null => {
	if (issue.pull_request) {
		return null;
	}
	const openedAt = toDate(issue.created_at);
	if (!openedAt || !issue.html_url) {
		return null;
	}
	const updatedAtSource = toDate(issue.updated_at);
	const base: MappedContribution = {
		kind: "issue",
		number: issue.number,
		title: issue.title,
		author: issue.user?.login ?? null,
		authorAvatarUrl: issue.user?.avatar_url ?? null,
		url: issue.html_url,
		isDraft: false,
		reviewRequestedCount: 0,
		assigneeCount: issue.assignees?.length ?? 0,
		commentCount: issue.comments ?? 0,
		openedAt,
		updatedAtSource,
	};
	return {
		...base,
		...computeContributionAttention(
			{
				kind: "issue",
				isDraft: false,
				reviewRequestedCount: 0,
				assigneeCount: base.assigneeCount,
				commentCount: base.commentCount,
				openedAt,
				updatedAt: updatedAtSource,
				now,
			},
			thresholds,
		),
	};
};

export const mapGithubPullRequest = (
	pull: GithubPullLike,
	now: Date,
	thresholds: CommunityAttentionThresholds = DEFAULT_ATTENTION_THRESHOLDS,
): (MappedContribution & AttentionResult) | null => {
	const openedAt = toDate(pull.created_at);
	if (!openedAt || !pull.html_url) {
		return null;
	}
	const updatedAtSource = toDate(pull.updated_at);
	const isDraft = !!pull.draft;
	const reviewRequestedCount = pull.requested_reviewers?.length ?? 0;
	const assigneeCount = pull.assignees?.length ?? 0;
	const commentCount = (pull.comments ?? 0) + (pull.review_comments ?? 0);
	const base: MappedContribution = {
		kind: "pull-request",
		number: pull.number,
		title: pull.title,
		author: pull.user?.login ?? null,
		authorAvatarUrl: pull.user?.avatar_url ?? null,
		url: pull.html_url,
		isDraft,
		reviewRequestedCount,
		assigneeCount,
		commentCount,
		openedAt,
		updatedAtSource,
	};
	return {
		...base,
		...computeContributionAttention(
			{
				kind: "pull-request",
				isDraft,
				reviewRequestedCount,
				assigneeCount,
				commentCount,
				openedAt,
				updatedAt: updatedAtSource,
				now,
			},
			thresholds,
		),
	};
};

export interface GithubReleaseLike {
	id?: number;
	tag_name?: string;
	name?: string | null;
	draft?: boolean;
	prerelease?: boolean;
	published_at?: string | null;
	created_at?: string | null;
	html_url?: string | null;
	body?: string | null;
	author?: { login?: string } | null;
}

export interface MappedRelease {
	externalId: string;
	tagName: string;
	name: string | null;
	isDraft: boolean;
	isPrerelease: boolean;
	publishedAt: Date | null;
	url: string;
	body: string | null;
	author: string | null;
}

/** Release notes are truncated so a single huge body cannot bloat the table. */
export const RELEASE_BODY_LIMIT = 4000;

export const mapGithubRelease = (
	release: GithubReleaseLike,
): MappedRelease | null => {
	if (!release.id || !release.tag_name || !release.html_url) {
		return null;
	}
	const body = release.body ?? null;
	return {
		externalId: String(release.id),
		tagName: release.tag_name,
		name: release.name ?? null,
		isDraft: !!release.draft,
		isPrerelease: !!release.prerelease,
		publishedAt: toDate(release.published_at ?? release.created_at),
		url: release.html_url,
		body: body && body.length > RELEASE_BODY_LIMIT ? body.slice(0, RELEASE_BODY_LIMIT) : body,
		author: release.author?.login ?? null,
	};
};

/* -------------------------------------------------------------------------- */
/* Community health profile                                                   */
/* -------------------------------------------------------------------------- */

export interface GithubCommunityProfileLike {
	health_percentage?: number | null;
	files?: {
		code_of_conduct?: { url?: string | null } | null;
		contributing?: { url?: string | null } | null;
		issue_template?: { url?: string | null } | null;
		pull_request_template?: { url?: string | null } | null;
		readme?: { url?: string | null } | null;
		license?: { url?: string | null } | null;
	} | null;
}

const hasFile = (file: { url?: string | null } | null | undefined): boolean =>
	!!file?.url;

/**
 * Turns GitHub's community profile into the Console's health flags.
 *
 * Only *presence* is reported. A file may be present and empty, and the page
 * says so: the flags are improvement hints, not a quality certification.
 */
export const summarizeCommunityHealth = (
	profile: GithubCommunityProfileLike | null,
): CommunityHealthProfile => ({
	healthPercentage:
		typeof profile?.health_percentage === "number"
			? profile.health_percentage
			: null,
	hasReadme: hasFile(profile?.files?.readme),
	hasContributing: hasFile(profile?.files?.contributing),
	hasCodeOfConduct: hasFile(profile?.files?.code_of_conduct),
	hasIssueTemplate: hasFile(profile?.files?.issue_template),
	hasPullRequestTemplate: hasFile(profile?.files?.pull_request_template),
	// GitHub does not expose SECURITY.md through the community profile, so this
	// flag is filled from a dedicated contents probe by the service.
	hasSecurityPolicy: false,
	hasLicense: hasFile(profile?.files?.license),
	// Same as above: the docs folder is probed separately.
	hasDocs: false,
});

export const EMPTY_COMMUNITY_HEALTH: CommunityHealthProfile = {
	healthPercentage: null,
	hasReadme: false,
	hasContributing: false,
	hasCodeOfConduct: false,
	hasIssueTemplate: false,
	hasPullRequestTemplate: false,
	hasSecurityPolicy: false,
	hasLicense: false,
	hasDocs: false,
};

/* -------------------------------------------------------------------------- */
/* Authorization / rate-limit classification                                  */
/* -------------------------------------------------------------------------- */

/**
 * Maps a GitHub failure to the source status the header should show.
 *
 * Kept pure so the classification is unit-tested: GitHub returns 403 for both a
 * rate limit and a missing permission, and the two demand different fixes.
 */
export const classifyGithubFailure = (
	error: unknown,
): "rate-limited" | "needs-authorization" | "error" => {
	const status = (error as { status?: number })?.status;
	const message = (error as { message?: string })?.message ?? "";
	const response = (error as { response?: { headers?: Record<string, string> } })
		?.response;
	const remaining = response?.headers?.["x-ratelimit-remaining"];

	if (status === 401) {
		return "needs-authorization";
	}
	if (status === 403) {
		if (remaining === "0" || /rate limit/i.test(message)) {
			return "rate-limited";
		}
		return "needs-authorization";
	}
	if (status === 404) {
		// A 404 most often means the App is no longer installed on the account.
		return "needs-authorization";
	}
	return "error";
};

/** Actionable message shown next to a failed source; never a raw stack. */
export const describeGithubFailure = (error: unknown): string => {
	const status = classifyGithubFailure(error);
	const message = (error as { message?: string })?.message ?? String(error);
	switch (status) {
		case "rate-limited":
			return "GitHub rate limit reached. The next scheduled sync will catch up.";
		case "needs-authorization":
			return "GitHub refused the request. Check that the GitHub App is still installed with access to these repositories.";
		default:
			return `GitHub sync failed: ${message}`.slice(0, 500);
	}
};
