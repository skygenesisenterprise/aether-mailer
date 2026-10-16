import { db } from "@notploy/server/db";
import {
	type TrafficSource,
	trafficAudienceAggregates,
	trafficAudienceEvents,
	trafficAudienceSessions,
	trafficHttpAggregates,
	trafficHttpRoutes,
} from "@notploy/server/db/schema";
import {
	LATENCY_BUCKET_COUNT,
	percentileFromHistogram,
} from "@notploy/server/utils/traffic/aggregate";
import { and, asc, desc, gte, inArray, lt, type SQL, sql } from "drizzle-orm";
import {
	AUDIENCE_BUCKET_SECONDS,
	getTrafficRuntimeConfig,
	listTrafficProperties,
	type TrafficPropertyWithSources,
} from "./traffic";

/**
 * Read-side of the Traffic Manager.
 *
 * Everything the dashboard shows is aggregated in SQL or from small grouped
 * result sets — never by shipping raw events to the browser. Each report also
 * carries enough metadata for the page to distinguish "no data on this period"
 * from "source not configured" and "collector down", instead of rendering a
 * zero that would be a lie.
 */

export type TrafficRangePreset = "1h" | "24h" | "7d" | "30d" | "custom";

/** A single query never spans more than three months. */
export const MAX_TRAFFIC_RANGE_DAYS = 90;

export interface TrafficRangeInput {
	preset?: TrafficRangePreset;
	/** ISO 8601, required with the `custom` preset. */
	from?: string;
	to?: string;
}

export interface ResolvedTrafficRange {
	from: Date;
	to: Date;
	/** Interval chosen for the HTTP series, in seconds. */
	intervalSeconds: number;
	previousFrom: Date;
	previousTo: Date;
}

const PRESET_DURATIONS_MS: Record<
	Exclude<TrafficRangePreset, "custom">,
	number
> = {
	"1h": 60 * 60 * 1000,
	"24h": 24 * 60 * 60 * 1000,
	"7d": 7 * 24 * 60 * 60 * 1000,
	"30d": 30 * 24 * 60 * 60 * 1000,
};

const PRESET_INTERVALS_SECONDS: Record<
	Exclude<TrafficRangePreset, "custom">,
	number
> = {
	"1h": 300,
	"24h": 900,
	"7d": 3600,
	"30d": 21_600,
};

export class TrafficRangeError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "TrafficRangeError";
	}
}

/**
 * Resolve a preset (or a custom window) into the concrete dates the queries use,
 * plus the comparison window of the same length immediately before it.
 */
export const resolveTrafficRange = (
	input: TrafficRangeInput = {},
	now: Date = new Date(),
): ResolvedTrafficRange => {
	const preset = input.preset ?? "24h";
	if (preset === "custom") {
		const from = input.from ? new Date(input.from) : new Date(Number.NaN);
		const to = input.to ? new Date(input.to) : new Date(Number.NaN);
		if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
			throw new TrafficRangeError(
				"A custom range requires both `from` and `to` as ISO 8601 timestamps",
			);
		}
		if (from.getTime() >= to.getTime()) {
			throw new TrafficRangeError("`from` must be earlier than `to`");
		}
		const spanMs = to.getTime() - from.getTime();
		if (spanMs > MAX_TRAFFIC_RANGE_DAYS * 24 * 60 * 60 * 1000) {
			throw new TrafficRangeError(
				`A range cannot span more than ${MAX_TRAFFIC_RANGE_DAYS} days`,
			);
		}
		return {
			from,
			to,
			// Aim for a readable number of points whatever the window: 120 buckets.
			intervalSeconds: pickInterval(spanMs),
			previousFrom: new Date(from.getTime() - spanMs),
			previousTo: from,
		};
	}

	const duration = PRESET_DURATIONS_MS[preset];
	const to = now;
	const from = new Date(now.getTime() - duration);
	return {
		from,
		to,
		intervalSeconds: PRESET_INTERVALS_SECONDS[preset],
		previousFrom: new Date(from.getTime() - duration),
		previousTo: from,
	};
};

/** Round a duration to a power-of-two-ish interval that yields ≤ 256 points. */
const pickInterval = (spanMs: number): number => {
	const candidates = [300, 900, 1800, 3600, 7200, 21600, 43_200, 86_400];
	const spanSeconds = spanMs / 1000;
	const match = candidates.find((candidate) => spanSeconds / candidate <= 256);
	return match ?? 86_400;
};

export type TrafficSectionState =
	| "ok"
	| "partial"
	| "no-data"
	| "not-configured"
	| "unavailable";

export interface TrafficSectionAvailability {
	state: TrafficSectionState;
	/** Short, user-facing explanations of the state. */
	reasons: string[];
}

export interface TrafficScope {
	organizationId: string;
	from: Date;
	to: Date;
	properties: TrafficPropertyWithSources[];
	propertyIds: string[];
}

export interface TrafficScopeInput {
	organizationId: string;
	from: Date;
	to: Date;
	/** Restrict to specific properties (a domain selected in the UI). */
	propertyIds?: string[];
	/** Restrict to a platform (`website`, `docs`, ...). */
	platform?: string;
}

export const resolveTrafficScope = async (
	input: TrafficScopeInput,
): Promise<TrafficScope> => {
	const all = await listTrafficProperties(input.organizationId);
	const selected = all.filter((property) => {
		if (input.propertyIds?.length && !input.propertyIds.includes(property.id)) {
			return false;
		}
		if (input.platform && property.platform !== input.platform) {
			return false;
		}
		return true;
	});
	return {
		organizationId: input.organizationId,
		from: input.from,
		to: input.to,
		properties: selected,
		propertyIds: selected.map((property) => property.id),
	};
};

/**
 * Derive what the UI may say about a section.
 *
 * The order matters: a section with no declared source is *not configured*
 * (the operator has to declare something), a section whose collector reported a
 * failure is *unavailable*, and a healthy collector with no rows on the period
 * is *no data on this period* — three different situations that deserve three
 * different messages.
 */
const describeSection = (options: {
	properties: readonly TrafficPropertyWithSources[];
	type: TrafficSource["type"];
	hasRows: boolean;
	hasAnyRows: boolean;
	label: string;
}): TrafficSectionAvailability => {
	const reasons: string[] = [];
	if (options.properties.length === 0) {
		return {
			state: "not-configured",
			reasons: ["No web property is selected for this view."],
		};
	}
	const sources = options.properties.flatMap((property) =>
		property.sources.filter((source) => source.type === options.type),
	);
	if (sources.length === 0) {
		return {
			state: "not-configured",
			reasons: [
				`No ${options.label} source is declared for the selected properties.`,
			],
		};
	}
	const enabled = sources.filter((source) => source.enabled);
	if (enabled.length === 0) {
		return {
			state: "not-configured",
			reasons: [`Every ${options.label} source is disabled.`],
		};
	}
	const failing = enabled.filter((source) => source.status === "unavailable");
	if (failing.length === enabled.length) {
		return {
			state: "unavailable",
			reasons: [
				...new Set(
					failing
						.map((source) => source.lastError)
						.filter((error): error is string => !!error),
				),
			],
		};
	}
	if (failing.length > 0) {
		reasons.push(
			`${failing.length} of ${enabled.length} ${options.label} sources are unavailable.`,
		);
	}
	const never = enabled.filter((source) => !source.lastEventAt);
	if (never.length > 0) {
		reasons.push(
			`${never.length} of ${enabled.length} ${options.label} sources have not received any data yet.`,
		);
	}
	if (!options.hasRows) {
		reasons.push("No data was recorded on the selected period.");
		return {
			state: failing.length > 0 || never.length > 0 ? "partial" : "no-data",
			reasons,
		};
	}
	if (!options.hasAnyRows) {
		reasons.push(
			"Data exists outside the selected period; the retention policy may have removed the rest.",
		);
		return { state: "partial", reasons };
	}
	return {
		state: reasons.length > 0 ? "partial" : "ok",
		reasons,
	};
};

// ---------------------------------------------------------------------------
// HTTP queries
// ---------------------------------------------------------------------------

const propertyFilter = (
	column: SQL | ReturnType<typeof sql>,
	propertyIds: readonly string[],
) =>
	sql`${column} in (${sql.join(
		propertyIds.map((id) => sql`${id}`),
		sql`, `,
	)})`;

export interface HttpSummary {
	requests: number;
	errors: number;
	/** Percentage of 4xx + 5xx over all requests, `null` when there is none. */
	errorRate: number | null;
	bytesIn: number;
	bytesOut: number;
	/** Approximate p95 built from the stored latency histogram. */
	p95Ms: number | null;
	avgMs: number | null;
	maxMs: number | null;
	latencySamples: number;
}

export interface AudienceSummary {
	pageviews: number;
	sessions: number;
	visitors: number;
}

const EMPTY_HTTP_SUMMARY: HttpSummary = {
	requests: 0,
	errors: 0,
	errorRate: null,
	bytesIn: 0,
	bytesOut: 0,
	p95Ms: null,
	avgMs: null,
	maxMs: null,
	latencySamples: 0,
};

const EMPTY_AUDIENCE_SUMMARY: AudienceSummary = {
	pageviews: 0,
	sessions: 0,
	visitors: 0,
};

/** Merge the stored latency histogram of a period into one array. */
const loadLatencyHistogram = async (
	propertyIds: readonly string[],
	from: Date,
	to: Date,
): Promise<number[]> => {
	if (propertyIds.length === 0) {
		return [];
	}
	// Raw SQL: parameters are passed as text and cast explicitly, because a
	// `postgres.js` prepared statement cannot serialise a JS `Date` on its own
	// outside the query builder.
	const rows = (await db.execute(sql`
		select gs.idx::int as idx,
			coalesce(sum((agg."latencyBuckets" ->> gs.idx)::numeric), 0)::float8 as samples
		from "trafficHttpAggregates" agg
		cross join generate_series(0, ${LATENCY_BUCKET_COUNT - 1}) as gs(idx)
		where ${propertyFilter(sql`agg."propertyId"`, propertyIds)}
			and agg."bucketStart" >= ${from.toISOString()}::timestamptz
			and agg."bucketStart" < ${to.toISOString()}::timestamptz
		group by gs.idx
		order by gs.idx
	`)) as unknown as Array<{ idx: number; samples: number }>;

	const histogram = new Array<number>(LATENCY_BUCKET_COUNT).fill(0);
	for (const row of rows) {
		if (row.idx >= 0 && row.idx < histogram.length) {
			histogram[row.idx] = Number(row.samples ?? 0);
		}
	}
	return histogram;
};

const loadHttpTotals = async (
	propertyIds: readonly string[],
	from: Date,
	to: Date,
) => {
	if (propertyIds.length === 0) {
		return { totals: EMPTY_HTTP_SUMMARY, rows: 0 };
	}
	const [row] = await db
		.select({
			requests: sql<number>`coalesce(sum(${trafficHttpAggregates.requests}),0)::float8`,
			errors: sql<number>`coalesce(sum(case when ${trafficHttpAggregates.statusClass}::text in ('4xx','5xx') then ${trafficHttpAggregates.requests} else 0 end),0)::float8`,
			bytesIn: sql<number>`coalesce(sum(${trafficHttpAggregates.bytesIn}),0)::float8`,
			bytesOut: sql<number>`coalesce(sum(${trafficHttpAggregates.bytesOut}),0)::float8`,
			latencyCount: sql<number>`coalesce(sum(${trafficHttpAggregates.latencyCount}),0)::float8`,
			latencyMsSum: sql<number>`coalesce(sum(${trafficHttpAggregates.latencyMsSum}),0)::float8`,
			latencyMsMax: sql<number>`coalesce(max(${trafficHttpAggregates.latencyMsMax}),0)::float8`,
			rows: sql<number>`count(*)::int`,
		})
		.from(trafficHttpAggregates)
		.where(
			and(
				inArray(trafficHttpAggregates.propertyId, [...propertyIds]),
				gte(trafficHttpAggregates.bucketStart, from),
				lt(trafficHttpAggregates.bucketStart, to),
			),
		);

	const requests = Number(row?.requests ?? 0);
	const errors = Number(row?.errors ?? 0);
	const latencySamples = Number(row?.latencyCount ?? 0);
	const histogram = await loadLatencyHistogram(propertyIds, from, to);

	return {
		totals: {
			requests,
			errors,
			errorRate: requests > 0 ? (errors / requests) * 100 : null,
			bytesIn: Number(row?.bytesIn ?? 0),
			bytesOut: Number(row?.bytesOut ?? 0),
			p95Ms: percentileFromHistogram(histogram, 0.95),
			avgMs:
				latencySamples > 0
					? Number(row?.latencyMsSum ?? 0) / latencySamples
					: null,
			maxMs: latencySamples > 0 ? Number(row?.latencyMsMax ?? 0) : null,
			latencySamples,
		} satisfies HttpSummary,
		rows: Number(row?.rows ?? 0),
	};
};

const loadAudienceTotals = async (
	propertyIds: readonly string[],
	from: Date,
	to: Date,
): Promise<{ totals: AudienceSummary; rows: number }> => {
	if (propertyIds.length === 0) {
		return { totals: EMPTY_AUDIENCE_SUMMARY, rows: 0 };
	}
	const [pageviewRow] = await db
		.select({
			pageviews: sql<number>`coalesce(sum(${trafficAudienceAggregates.pageviews}),0)::float8`,
			rows: sql<number>`count(*)::int`,
		})
		.from(trafficAudienceAggregates)
		.where(
			and(
				inArray(trafficAudienceAggregates.propertyId, [...propertyIds]),
				gte(trafficAudienceAggregates.bucketStart, from),
				lt(trafficAudienceAggregates.bucketStart, to),
			),
		);

	const [sessionRow] = await db
		.select({
			sessions: sql<number>`count(*)::int`,
			visitors: sql<number>`count(distinct ${trafficAudienceSessions.visitorId})::int`,
		})
		.from(trafficAudienceSessions)
		.where(
			and(
				inArray(trafficAudienceSessions.propertyId, [...propertyIds]),
				gte(trafficAudienceSessions.startedAt, from),
				lt(trafficAudienceSessions.startedAt, to),
			),
		);

	return {
		totals: {
			pageviews: Number(pageviewRow?.pageviews ?? 0),
			sessions: Number(sessionRow?.sessions ?? 0),
			visitors: Number(sessionRow?.visitors ?? 0),
		},
		rows: Number(pageviewRow?.rows ?? 0),
	};
};

/** Whether rows exist at all (outside the range) for a section. */
const httpHasAnyRows = async (
	propertyIds: readonly string[],
): Promise<boolean> => {
	if (propertyIds.length === 0) {
		return false;
	}
	const [row] = await db
		.select({ rows: sql<number>`count(*)::int` })
		.from(trafficHttpAggregates)
		.where(inArray(trafficHttpAggregates.propertyId, [...propertyIds]));
	return Number(row?.rows ?? 0) > 0;
};

const audienceHasAnyRows = async (
	propertyIds: readonly string[],
): Promise<boolean> => {
	if (propertyIds.length === 0) {
		return false;
	}
	const [row] = await db
		.select({ rows: sql<number>`count(*)::int` })
		.from(trafficAudienceAggregates)
		.where(inArray(trafficAudienceAggregates.propertyId, [...propertyIds]));
	return Number(row?.rows ?? 0) > 0;
};

export interface TrafficOverview {
	range: {
		from: string;
		to: string;
		intervalSeconds: number;
		/** Buckets the chart should draw (used to render empty periods). */
		expectedPoints: number;
	};
	http: HttpSummary & {
		availability: TrafficSectionAvailability;
		/** Latency percentiles are approximated from a histogram. */
		latencyApproximated: true;
	};
	audience: AudienceSummary & {
		availability: TrafficSectionAvailability;
	};
	/** Same metrics over the immediately preceding window, `null` without data. */
	previous: {
		http: { requests: number; errors: number } | null;
		audience: AudienceSummary | null;
	};
	lastEventAt: string | null;
	retention: { httpDays: number; audienceDays: number };
	generatedAt: string;
}

export const getTrafficOverview = async (input: {
	organizationId: string;
	range: ResolvedTrafficRange;
	propertyIds?: string[];
	platform?: string;
	compare?: boolean;
}): Promise<TrafficOverview> => {
	const scope = await resolveTrafficScope({
		organizationId: input.organizationId,
		from: input.range.from,
		to: input.range.to,
		propertyIds: input.propertyIds,
		platform: input.platform,
	});
	const config = getTrafficRuntimeConfig();

	const [
		[{ totals: http, rows: httpRows }, httpAny],
		[{ totals: audience, rows: audienceRows }, audienceAny],
	] = await Promise.all([
		Promise.all([
			loadHttpTotals(scope.propertyIds, scope.from, scope.to),
			httpHasAnyRows(scope.propertyIds),
		]),
		Promise.all([
			loadAudienceTotals(scope.propertyIds, scope.from, scope.to),
			audienceHasAnyRows(scope.propertyIds),
		]),
	]);

	const httpAvailability = describeSection({
		properties: scope.properties,
		type: "traefik",
		hasRows: httpRows > 0,
		hasAnyRows: httpAny,
		label: "HTTP observability",
	});
	const audienceAvailability = describeSection({
		properties: scope.properties,
		type: "web-instrumentation",
		hasRows: audienceRows > 0,
		hasAnyRows: audienceAny,
		label: "audience",
	});

	let previous: TrafficOverview["previous"] = {
		http: null,
		audience: null,
	};
	if (input.compare) {
		const [previousHttp, previousAudience] = await Promise.all([
			loadHttpTotals(
				scope.propertyIds,
				input.range.previousFrom,
				input.range.previousTo,
			),
			loadAudienceTotals(
				scope.propertyIds,
				input.range.previousFrom,
				input.range.previousTo,
			),
		]);
		previous = {
			http:
				previousHttp.rows > 0
					? {
							requests: previousHttp.totals.requests,
							errors: previousHttp.totals.errors,
						}
					: null,
			audience: previousAudience.rows > 0 ? previousAudience.totals : null,
		};
	}

	const lastEventAt = scope.properties
		.flatMap((property) => property.sources)
		.map((source) => source.lastEventAt)
		.filter((value): value is Date => value instanceof Date)
		.sort((a, b) => b.getTime() - a.getTime())[0];

	const spanSeconds = (scope.to.getTime() - scope.from.getTime()) / 1000;

	return {
		range: {
			from: scope.from.toISOString(),
			to: scope.to.toISOString(),
			intervalSeconds: input.range.intervalSeconds,
			expectedPoints: Math.max(
				1,
				Math.ceil(spanSeconds / input.range.intervalSeconds),
			),
		},
		http: {
			...http,
			availability: httpAvailability,
			latencyApproximated: true,
		},
		audience: { ...audience, availability: audienceAvailability },
		previous,
		lastEventAt: lastEventAt ? lastEventAt.toISOString() : null,
		retention: {
			httpDays: config.httpRetentionDays,
			audienceDays: config.audienceRetentionDays,
		},
		generatedAt: new Date().toISOString(),
	};
};

export interface TrafficTimeseriesPoint {
	bucket: string;
	requests: number;
	errors: number;
	pageviews: number;
	sessions: number;
	visitors: number;
}

export interface TrafficTimeseries {
	intervalSeconds: number;
	points: TrafficTimeseriesPoint[];
}

/**
 * Group an expression into fixed buckets aligned on Unix time.
 *
 * The interval is written as a validated integer literal rather than as a bound
 * parameter on purpose: Postgres only accepts a SELECT expression in `GROUP BY`
 * when the generated SQL is textually identical, and a parameterised interval
 * would emit a fresh placeholder for every occurrence.
 */
const bucketExpression = (column: SQL, intervalSeconds: number): SQL => {
	const interval = sql.raw(String(Math.max(1, Math.floor(intervalSeconds))));
	return sql`to_timestamp(floor(extract(epoch from ${column}) / ${interval}) * ${interval})`;
};

/**
 * HTTP and audience series on a single, aligned axis.
 *
 * The interval is widened to the audience resolution when the audience series is
 * asked for, so both lines describe the same buckets instead of pretending an
 * hourly counter has a five-minute resolution.
 */
export const getTrafficTimeseries = async (input: {
	organizationId: string;
	range: ResolvedTrafficRange;
	propertyIds?: string[];
	platform?: string;
	includeHttp?: boolean;
	includeAudience?: boolean;
}): Promise<TrafficTimeseries> => {
	const scope = await resolveTrafficScope({
		organizationId: input.organizationId,
		from: input.range.from,
		to: input.range.to,
		propertyIds: input.propertyIds,
		platform: input.platform,
	});
	const includeAudience = input.includeAudience ?? true;
	const includeHttp = input.includeHttp ?? true;
	const intervalSeconds = includeAudience
		? Math.max(input.range.intervalSeconds, AUDIENCE_BUCKET_SECONDS)
		: input.range.intervalSeconds;

	if (scope.propertyIds.length === 0) {
		return { intervalSeconds, points: [] };
	}

	const points = new Map<string, TrafficTimeseriesPoint>();
	const ensurePoint = (bucket: Date): TrafficTimeseriesPoint => {
		const key = bucket.toISOString();
		const existing = points.get(key);
		if (existing) {
			return existing;
		}
		const created: TrafficTimeseriesPoint = {
			bucket: key,
			requests: 0,
			errors: 0,
			pageviews: 0,
			sessions: 0,
			visitors: 0,
		};
		points.set(key, created);
		return created;
	};

	if (includeHttp) {
		const httpBucket = bucketExpression(
			sql`${trafficHttpAggregates.bucketStart}`,
			intervalSeconds,
		);
		const rows = await db
			.select({
				bucket: sql<Date>`${httpBucket}`,
				requests: sql<number>`coalesce(sum(${trafficHttpAggregates.requests}),0)::float8`,
				errors: sql<number>`coalesce(sum(case when ${trafficHttpAggregates.statusClass}::text in ('4xx','5xx') then ${trafficHttpAggregates.requests} else 0 end),0)::float8`,
			})
			.from(trafficHttpAggregates)
			.where(
				and(
					inArray(trafficHttpAggregates.propertyId, scope.propertyIds),
					gte(trafficHttpAggregates.bucketStart, scope.from),
					lt(trafficHttpAggregates.bucketStart, scope.to),
				),
			)
			.groupBy(httpBucket)
			.orderBy(asc(httpBucket));

		for (const row of rows) {
			const point = ensurePoint(new Date(row.bucket));
			point.requests = Number(row.requests ?? 0);
			point.errors = Number(row.errors ?? 0);
		}
	}

	if (includeAudience) {
		const audienceBucket = bucketExpression(
			sql`${trafficAudienceAggregates.bucketStart}`,
			intervalSeconds,
		);
		const pageviewRows = await db
			.select({
				bucket: sql<Date>`${audienceBucket}`,
				pageviews: sql<number>`coalesce(sum(${trafficAudienceAggregates.pageviews}),0)::float8`,
			})
			.from(trafficAudienceAggregates)
			.where(
				and(
					inArray(trafficAudienceAggregates.propertyId, scope.propertyIds),
					gte(trafficAudienceAggregates.bucketStart, scope.from),
					lt(trafficAudienceAggregates.bucketStart, scope.to),
				),
			)
			.groupBy(audienceBucket)
			.orderBy(asc(audienceBucket));

		for (const row of pageviewRows) {
			const point = ensurePoint(new Date(row.bucket));
			point.pageviews = Number(row.pageviews ?? 0);
		}

		const sessionBucket = bucketExpression(
			sql`${trafficAudienceSessions.startedAt}`,
			intervalSeconds,
		);
		const sessionRows = await db
			.select({
				bucket: sql<Date>`${sessionBucket}`,
				sessions: sql<number>`count(*)::int`,
				// Distinct visitors *per bucket*: a returning visitor counts once per
				// bucket, so the series is a lower bound of unique visitors.
				visitors: sql<number>`count(distinct ${trafficAudienceSessions.visitorId})::int`,
			})
			.from(trafficAudienceSessions)
			.where(
				and(
					inArray(trafficAudienceSessions.propertyId, scope.propertyIds),
					gte(trafficAudienceSessions.startedAt, scope.from),
					lt(trafficAudienceSessions.startedAt, scope.to),
				),
			)
			.groupBy(sessionBucket)
			.orderBy(asc(sessionBucket));

		for (const row of sessionRows) {
			const point = ensurePoint(new Date(row.bucket));
			point.sessions = Number(row.sessions ?? 0);
			point.visitors = Number(row.visitors ?? 0);
		}
	}

	return {
		intervalSeconds,
		points: [...points.values()].sort(
			(a, b) => new Date(a.bucket).getTime() - new Date(b.bucket).getTime(),
		),
	};
};

export interface HttpStatusBreakdown {
	statusClass: string;
	requests: number;
	share: number;
}

export interface HttpDomainBreakdown {
	propertyId: string;
	platform: string;
	domain: string;
	requests: number;
	errors: number;
	bytesIn: number;
	bytesOut: number;
}

export interface HttpRouteRow {
	route: string;
	requests: number;
	errors: number;
	errorRate: number | null;
	bytesOut: number;
	avgMs: number | null;
	maxMs: number | null;
}

export interface HttpReport {
	statusBreakdown: HttpStatusBreakdown[];
	domains: HttpDomainBreakdown[];
	topRoutes: HttpRouteRow[];
	topErrorRoutes: HttpRouteRow[];
	/** Information a reverse proxy access log simply does not carry. */
	unavailable: { metric: string; reason: string }[];
}

export const getHttpReport = async (input: {
	organizationId: string;
	range: ResolvedTrafficRange;
	propertyIds?: string[];
	platform?: string;
	limit?: number;
}): Promise<HttpReport> => {
	const scope = await resolveTrafficScope({
		organizationId: input.organizationId,
		from: input.range.from,
		to: input.range.to,
		propertyIds: input.propertyIds,
		platform: input.platform,
	});
	const limit = Math.min(Math.max(input.limit ?? 10, 1), 50);
	const unavailable = [
		{
			metric: "Cache",
			reason:
				"The Traefik access log does not carry a cache status; a cache-hit metric needs a CDN or proxy that reports one (for example a `Cf-Cache-Status`-aware collector).",
		},
		{
			metric: "Geolocation",
			reason:
				"Request addresses are dropped on ingest on purpose, so no country breakdown can be derived from this source.",
		},
	];
	if (scope.propertyIds.length === 0) {
		return {
			statusBreakdown: [],
			domains: [],
			topRoutes: [],
			topErrorRoutes: [],
			unavailable,
		};
	}

	const statusRows = await db
		.select({
			statusClass: trafficHttpAggregates.statusClass,
			requests: sql<number>`coalesce(sum(${trafficHttpAggregates.requests}),0)::float8`,
		})
		.from(trafficHttpAggregates)
		.where(
			and(
				inArray(trafficHttpAggregates.propertyId, scope.propertyIds),
				gte(trafficHttpAggregates.bucketStart, scope.from),
				lt(trafficHttpAggregates.bucketStart, scope.to),
			),
		)
		.groupBy(trafficHttpAggregates.statusClass);

	const totalRequests = statusRows.reduce(
		(total, row) => total + Number(row.requests ?? 0),
		0,
	);
	const statusBreakdown = statusRows
		.map<HttpStatusBreakdown>((row) => ({
			statusClass: row.statusClass,
			requests: Number(row.requests ?? 0),
			share:
				totalRequests > 0
					? (Number(row.requests ?? 0) / totalRequests) * 100
					: 0,
		}))
		.sort((a, b) => a.statusClass.localeCompare(b.statusClass));

	// Domain breakdown: aggregate per property, then resolve the domain from the
	// properties already loaded for this scope (no extra round-trip).
	const perProperty = await db
		.select({
			propertyId: trafficHttpAggregates.propertyId,
			requests: sql<number>`coalesce(sum(${trafficHttpAggregates.requests}),0)::float8`,
			errors: sql<number>`coalesce(sum(case when ${trafficHttpAggregates.statusClass}::text in ('4xx','5xx') then ${trafficHttpAggregates.requests} else 0 end),0)::float8`,
			bytesIn: sql<number>`coalesce(sum(${trafficHttpAggregates.bytesIn}),0)::float8`,
			bytesOut: sql<number>`coalesce(sum(${trafficHttpAggregates.bytesOut}),0)::float8`,
		})
		.from(trafficHttpAggregates)
		.where(
			and(
				inArray(trafficHttpAggregates.propertyId, scope.propertyIds),
				gte(trafficHttpAggregates.bucketStart, scope.from),
				lt(trafficHttpAggregates.bucketStart, scope.to),
			),
		)
		.groupBy(trafficHttpAggregates.propertyId);

	const domains = perProperty
		.map<HttpDomainBreakdown | null>((row) => {
			const property = scope.properties.find(
				(candidate) => candidate.id === row.propertyId,
			);
			if (!property) {
				return null;
			}
			return {
				propertyId: row.propertyId,
				platform: property.platform,
				domain: property.domain,
				requests: Number(row.requests ?? 0),
				errors: Number(row.errors ?? 0),
				bytesIn: Number(row.bytesIn ?? 0),
				bytesOut: Number(row.bytesOut ?? 0),
			};
		})
		.filter((row): row is HttpDomainBreakdown => row !== null)
		.sort((a, b) => b.requests - a.requests);

	const routeDayStart = new Date(scope.from);
	routeDayStart.setUTCHours(0, 0, 0, 0);
	const routeRows = await db
		.select({
			route: trafficHttpRoutes.route,
			requests: sql<number>`coalesce(sum(${trafficHttpRoutes.requests}),0)::float8`,
			errors: sql<number>`coalesce(sum(case when ${trafficHttpRoutes.statusClass}::text in ('4xx','5xx') then ${trafficHttpRoutes.requests} else 0 end),0)::float8`,
			bytesOut: sql<number>`coalesce(sum(${trafficHttpRoutes.bytesOut}),0)::float8`,
			latencyMsSum: sql<number>`coalesce(sum(${trafficHttpRoutes.latencyMsSum}),0)::float8`,
			latencyMsMax: sql<number>`coalesce(max(${trafficHttpRoutes.latencyMsMax}),0)::float8`,
		})
		.from(trafficHttpRoutes)
		.where(
			and(
				inArray(trafficHttpRoutes.propertyId, scope.propertyIds),
				gte(trafficHttpRoutes.dayStart, routeDayStart),
				lt(trafficHttpRoutes.dayStart, scope.to),
			),
		)
		.groupBy(trafficHttpRoutes.route);

	const mappedRoutes = routeRows.map<HttpRouteRow>((row) => {
		const requests = Number(row.requests ?? 0);
		const errors = Number(row.errors ?? 0);
		return {
			route: row.route,
			requests,
			errors,
			errorRate: requests > 0 ? (errors / requests) * 100 : null,
			bytesOut: Number(row.bytesOut ?? 0),
			avgMs: requests > 0 ? Number(row.latencyMsSum ?? 0) / requests : null,
			maxMs: requests > 0 ? Number(row.latencyMsMax ?? 0) : null,
		};
	});

	return {
		statusBreakdown,
		domains,
		topRoutes: [...mappedRoutes]
			.sort((a, b) => b.requests - a.requests)
			.slice(0, limit),
		topErrorRoutes: mappedRoutes
			.filter((row) => row.errors > 0)
			.sort((a, b) => b.errors - a.errors)
			.slice(0, limit),
		unavailable,
	};
};

// ---------------------------------------------------------------------------
// Audience queries
// ---------------------------------------------------------------------------

export interface AudienceReport {
	topPages: { path: string; pageviews: number }[];
	referrers: { referrerHost: string; pageviews: number }[];
	devices: { deviceType: string; pageviews: number; share: number }[];
	events: { name: string; count: number }[];
	series: TrafficTimeseriesPoint[];
	/** How each number is produced, so the page can document them once. */
	methods: { metric: string; definition: string }[];
	availability: TrafficSectionAvailability;
	unavailable: { metric: string; reason: string }[];
}

export const getAudienceReport = async (input: {
	organizationId: string;
	range: ResolvedTrafficRange;
	propertyIds?: string[];
	platform?: string;
	limit?: number;
}): Promise<AudienceReport> => {
	const scope = await resolveTrafficScope({
		organizationId: input.organizationId,
		from: input.range.from,
		to: input.range.to,
		propertyIds: input.propertyIds,
		platform: input.platform,
	});
	const limit = Math.min(Math.max(input.limit ?? 10, 1), 50);
	const [audienceRows, audienceAny] = await Promise.all([
		loadAudienceTotals(scope.propertyIds, scope.from, scope.to),
		audienceHasAnyRows(scope.propertyIds),
	]);
	const availability = describeSection({
		properties: scope.properties,
		type: "web-instrumentation",
		hasRows: audienceRows.rows > 0,
		hasAnyRows: audienceAny,
		label: "audience",
	});

	const methods = [
		{
			metric: "Pages vues",
			definition:
				"Page views are counted by the instrumentation script on each page load and each client-side route change.",
		},
		{
			metric: "Sessions",
			definition:
				"A session is an identifier generated in the browser (sessionStorage, 30 minutes of inactivity) and counted once, whatever the number of batches it appears in.",
		},
		{
			metric: "Visiteurs estimés",
			definition:
				"Unique visitors count the distinct visitor identifiers stored in the browser (localStorage, reset after 180 days). It is an estimate: clearing storage or changing device creates a new visitor.",
		},
	];

	const unavailable = [
		{
			metric: "Profil démographique",
			reason:
				"No personal data is collected, so there is no demographic or identity breakdown.",
		},
	];

	if (scope.propertyIds.length === 0) {
		return {
			topPages: [],
			referrers: [],
			devices: [],
			events: [],
			series: await getTrafficTimeseries({
				organizationId: input.organizationId,
				range: input.range,
				propertyIds: input.propertyIds,
				platform: input.platform,
				includeHttp: false,
				includeAudience: true,
			}).then((series) => series.points),
			methods,
			availability,
			unavailable,
		};
	}

	const [topPages, referrers, devices, events] = await Promise.all([
		db
			.select({
				path: trafficAudienceAggregates.path,
				pageviews: sql<number>`coalesce(sum(${trafficAudienceAggregates.pageviews}),0)::float8`,
			})
			.from(trafficAudienceAggregates)
			.where(
				and(
					inArray(trafficAudienceAggregates.propertyId, scope.propertyIds),
					gte(trafficAudienceAggregates.bucketStart, scope.from),
					lt(trafficAudienceAggregates.bucketStart, scope.to),
				),
			)
			.groupBy(trafficAudienceAggregates.path)
			.orderBy(desc(sql`sum(${trafficAudienceAggregates.pageviews})`))
			.limit(limit),
		db
			.select({
				referrerHost: trafficAudienceAggregates.referrerHost,
				pageviews: sql<number>`coalesce(sum(${trafficAudienceAggregates.pageviews}),0)::float8`,
			})
			.from(trafficAudienceAggregates)
			.where(
				and(
					inArray(trafficAudienceAggregates.propertyId, scope.propertyIds),
					gte(trafficAudienceAggregates.bucketStart, scope.from),
					lt(trafficAudienceAggregates.bucketStart, scope.to),
				),
			)
			.groupBy(trafficAudienceAggregates.referrerHost)
			.orderBy(desc(sql`sum(${trafficAudienceAggregates.pageviews})`))
			.limit(limit),
		db
			.select({
				deviceType: trafficAudienceAggregates.deviceType,
				pageviews: sql<number>`coalesce(sum(${trafficAudienceAggregates.pageviews}),0)::float8`,
			})
			.from(trafficAudienceAggregates)
			.where(
				and(
					inArray(trafficAudienceAggregates.propertyId, scope.propertyIds),
					gte(trafficAudienceAggregates.bucketStart, scope.from),
					lt(trafficAudienceAggregates.bucketStart, scope.to),
				),
			)
			.groupBy(trafficAudienceAggregates.deviceType),
		db
			.select({
				name: trafficAudienceEvents.name,
				count: sql<number>`coalesce(sum(${trafficAudienceEvents.count}),0)::float8`,
			})
			.from(trafficAudienceEvents)
			.where(
				and(
					inArray(trafficAudienceEvents.propertyId, scope.propertyIds),
					gte(trafficAudienceEvents.bucketStart, scope.from),
					lt(trafficAudienceEvents.bucketStart, scope.to),
				),
			)
			.groupBy(trafficAudienceEvents.name)
			.orderBy(desc(sql`sum(${trafficAudienceEvents.count})`))
			.limit(limit),
	]);

	const deviceTotal = devices.reduce(
		(total, row) => total + Number(row.pageviews ?? 0),
		0,
	);

	const series = await getTrafficTimeseries({
		organizationId: input.organizationId,
		range: input.range,
		propertyIds: input.propertyIds,
		platform: input.platform,
		includeHttp: false,
		includeAudience: true,
	});

	return {
		topPages: topPages.map((row) => ({
			path: row.path,
			pageviews: Number(row.pageviews ?? 0),
		})),
		referrers: referrers.map((row) => ({
			referrerHost: row.referrerHost,
			pageviews: Number(row.pageviews ?? 0),
		})),
		devices: devices
			.map((row) => ({
				deviceType: row.deviceType,
				pageviews: Number(row.pageviews ?? 0),
				share:
					deviceTotal > 0
						? (Number(row.pageviews ?? 0) / deviceTotal) * 100
						: 0,
			}))
			.sort((a, b) => b.pageviews - a.pageviews),
		events: events.map((row) => ({
			name: row.name,
			count: Number(row.count ?? 0),
		})),
		series: series.points,
		methods,
		availability,
		unavailable,
	};
};

// ---------------------------------------------------------------------------
// Sources health
// ---------------------------------------------------------------------------

export interface TrafficSourceHealth {
	sourceId: string;
	propertyId: string;
	platform: string;
	domain: string;
	propertyName: string;
	propertyEnabled: boolean;
	type: TrafficSource["type"];
	enabled: boolean;
	/** Status persisted by the collector. */
	status: TrafficSource["status"];
	/** Status derived from freshness, which is what the page shows. */
	derivedStatus: TrafficSource["status"];
	lastEventAt: string | null;
	lastAggregatedAt: string | null;
	lastError: string | null;
	lastErrorAt: string | null;
	/** Minutes since the last reception, `null` when there was none. */
	lagMinutes: number | null;
	publicKey: string | null;
	logPath: string | null;
	warnings: string[];
}

export const getTrafficSourceHealth = async (input: {
	organizationId: string;
	propertyIds?: string[];
	platform?: string;
	now?: Date;
}): Promise<TrafficSourceHealth[]> => {
	const properties = await listTrafficProperties(input.organizationId);
	const now = input.now ?? new Date();
	const staleAfterMs = getTrafficRuntimeConfig().staleAfterMinutes * 60 * 1000;

	const selected = properties.filter((property) => {
		if (input.propertyIds?.length && !input.propertyIds.includes(property.id)) {
			return false;
		}
		if (input.platform && property.platform !== input.platform) {
			return false;
		}
		return true;
	});

	return selected.flatMap((property) =>
		property.sources.map<TrafficSourceHealth>((source) => {
			const warnings: string[] = [];
			const lagMs = source.lastEventAt
				? now.getTime() - source.lastEventAt.getTime()
				: null;

			let derivedStatus = source.status;
			if (!source.enabled || !property.enabled) {
				derivedStatus = "not-configured";
			} else if (source.status === "unavailable") {
				derivedStatus = "unavailable";
			} else if (lagMs === null) {
				derivedStatus = "not-configured";
				warnings.push(
					"Configured and enabled, but no event has ever been received by this source.",
				);
			} else if (lagMs > staleAfterMs) {
				derivedStatus = "degraded";
				warnings.push(
					`No event received for ${Math.round(lagMs / 60000)} minutes.`,
				);
			} else {
				derivedStatus = "active";
			}

			if (source.lastError) {
				warnings.push(source.lastError);
			}
			if (!property.enabled) {
				warnings.push("The web property is disabled, so it is not collected.");
			}
			if (source.type === "traefik" && !source.enabled) {
				warnings.push(
					"Enable this source to read the reverse proxy access log for this domain.",
				);
			}

			return {
				sourceId: source.id,
				propertyId: property.id,
				platform: property.platform,
				domain: property.domain,
				propertyName: property.name,
				propertyEnabled: property.enabled,
				type: source.type,
				enabled: source.enabled,
				status: source.status,
				derivedStatus,
				lastEventAt: source.lastEventAt
					? source.lastEventAt.toISOString()
					: null,
				lastAggregatedAt: source.lastAggregatedAt
					? source.lastAggregatedAt.toISOString()
					: null,
				lastError: source.lastError,
				lastErrorAt: source.lastErrorAt
					? source.lastErrorAt.toISOString()
					: null,
				lagMinutes: lagMs === null ? null : Math.round(lagMs / 60000),
				publicKey: source.publicKey,
				logPath: source.config?.logPath ?? null,
				warnings,
			};
		}),
	);
};

/** Platforms currently declared, used by the header filter. */
export const listTrafficPlatforms = async (
	organizationId: string,
): Promise<string[]> => {
	const properties = await listTrafficProperties(organizationId);
	return [...new Set(properties.map((property) => property.platform))].sort();
};
