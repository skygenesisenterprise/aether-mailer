import { relations } from "drizzle-orm";
import {
	bigint,
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

/**
 * Traffic Manager schema.
 *
 * The Traffic Manager keeps three concerns apart, because they answer different
 * questions and come from different collectors:
 *
 * - **Web properties** (`webProperties`): the domains Notploy watches, grouped
 *   by the platform (website, docs, app, api, ...) they belong to.
 * - **Collection sources** (`trafficSources`): where the numbers come from. A
 *   property may be observed by a reverse proxy (Traefik access logs) and/or by
 *   web instrumentation (`traffic.js`), and each source carries its own health.
 * - **Aggregates**: HTTP observability and audience analytics.
 *
 * Granularity is chosen per signal so the tables stay bounded:
 *
 * | table                     | key                                          | resolution |
 * | ------------------------- | -------------------------------------------- | ---------- |
 * | `trafficHttpAggregates`    | property × bucket × status class             | 5 minutes  |
 * | `trafficHttpRoutes`        | property × day × route × status class        | 1 day      |
 * | `trafficAudienceAggregates`| property × bucket × page × referrer × device | 15 minutes |
 * | `trafficAudienceEvents`    | property × bucket × event name               | 15 minutes |
 * | `trafficAudienceSessions`  | property × session id                        | 1 row      |
 *
 * Raw requests and raw audience events are never stored: the collectors
 * aggregate on ingest, so retention is a `DELETE` per table instead of a
 * compaction job over unbounded rows. Sub-minute HTTP resolution, sub-minute
 * audience resolution and per-country breakdowns are the thresholds that would
 * justify a coarser/columnar store later; they are documented, not anticipated.
 */

export const trafficSourceType = pgEnum("trafficSourceType", [
	"traefik",
	"web-instrumentation",
	"external",
]);

/**
 * Source health as shown in the dashboard. `not-configured` and `unavailable`
 * are real states, not errors: the page renders them instead of inventing a zero
 * value.
 */
export const trafficSourceStatus = pgEnum("trafficSourceStatus", [
	"active",
	"degraded",
	"not-configured",
	"unavailable",
]);

/** HTTP status class. `other` covers 1xx responses and requests that never got one. */
export const trafficStatusClass = pgEnum("trafficStatusClass", [
	"2xx",
	"3xx",
	"4xx",
	"5xx",
	"other",
]);

export const trafficDeviceType = pgEnum("trafficDeviceType", [
	"desktop",
	"mobile",
	"tablet",
	"unknown",
]);

/**
 * A watched domain, attached to a platform label. Several domains may share a
 * platform (`notploy.com`, `www.notploy.com`), and several platforms may live in
 * the same organization.
 */
export const webProperties = pgTable(
	"webProperties",
	{
		id: text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		organizationId: text("organizationId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		/** Platform label: `website`, `docs`, `app`, `api`, ... */
		platform: text("platform").notNull(),
		name: text("name").notNull(),
		/** Apex domain, lowercase, without scheme nor port. */
		domain: text("domain").notNull(),
		/** Domains are matched including their sub-domains unless restricted. */
		matchesSubdomains: boolean("matchesSubdomains").notNull().default(true),
		enabled: boolean("enabled").notNull().default(true),
		createdAt: timestamp("createdAt", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updatedAt", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		uniqueIndex("web_properties_org_domain_idx").on(
			table.organizationId,
			table.domain,
		),
		index("web_properties_org_platform_idx").on(
			table.organizationId,
			table.platform,
		),
	],
);

/** Cursor of an incremental collector (kept so one log line is read once). */
export interface TrafficSourceCursor {
	/** Byte offset already ingested in the source file. */
	offset: number;
	/** Size observed when the cursor was written, used to detect truncation. */
	fileSize: number;
	updatedAt: string;
}

export interface TrafficSourceConfig {
	/** Absolute path of the Traefik access log, when the type is `traefik`. */
	logPath?: string;
	cursor?: TrafficSourceCursor;
	/** Origins allowed to post audience events (owned by the operator). */
	allowedOrigins?: string[];
	/** Provider name, when the type is `external`. */
	provider?: string;
}

/** One collector feeding one property. */
export const trafficSources = pgTable(
	"trafficSources",
	{
		id: text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		propertyId: text("propertyId")
			.notNull()
			.references(() => webProperties.id, { onDelete: "cascade" }),
		type: trafficSourceType("type").notNull(),
		status: trafficSourceStatus("status").notNull().default("not-configured"),
		enabled: boolean("enabled").notNull().default(false),
		/**
		 * Public identification key sent by the browser with the web
		 * instrumentation script. It is not a secret: abuse is handled by the
		 * origin allow-list, the rate limit and the event size cap.
		 */
		publicKey: text("publicKey"),
		config: jsonb("config").$type<TrafficSourceConfig>().notNull().default({}),
		/** Last event accepted by this source. */
		lastEventAt: timestamp("lastEventAt", { withTimezone: true }),
		/** Last successful aggregation run for this source. */
		lastAggregatedAt: timestamp("lastAggregatedAt", { withTimezone: true }),
		/** Last failure, shown as-is in the sources panel. */
		lastError: text("lastError"),
		lastErrorAt: timestamp("lastErrorAt", { withTimezone: true }),
		createdAt: timestamp("createdAt", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updatedAt", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		uniqueIndex("traffic_sources_property_type_idx").on(
			table.propertyId,
			table.type,
		),
		uniqueIndex("traffic_sources_public_key_idx").on(table.publicKey),
	],
);

/**
 * HTTP observability totals, one row per five-minute bucket and status class.
 *
 * `latencyBuckets` is a fixed-bin histogram (see `LATENCY_BUCKET_BOUNDS_MS`)
 * plus a final overflow bin. Keeping the histogram instead of raw durations is
 * what lets the API report a p95 without storing every request: it is an
 * approximation bounded by the histogram resolution, and the API labels it as
 * such.
 */
export const trafficHttpAggregates = pgTable(
	"trafficHttpAggregates",
	{
		id: text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		propertyId: text("propertyId")
			.notNull()
			.references(() => webProperties.id, { onDelete: "cascade" }),
		bucketStart: timestamp("bucketStart", { withTimezone: true }).notNull(),
		bucketSeconds: integer("bucketSeconds").notNull(),
		statusClass: trafficStatusClass("statusClass").notNull(),
		requests: integer("requests").notNull().default(0),
		bytesIn: bigint("bytesIn", { mode: "number" }).notNull().default(0),
		bytesOut: bigint("bytesOut", { mode: "number" }).notNull().default(0),
		latencyCount: integer("latencyCount").notNull().default(0),
		latencyMsSum: bigint("latencyMsSum", { mode: "number" })
			.notNull()
			.default(0),
		latencyMsMax: integer("latencyMsMax").notNull().default(0),
		latencyBuckets: jsonb("latencyBuckets")
			.$type<number[]>()
			.notNull()
			.default([]),
	},
	(table) => [
		uniqueIndex("traffic_http_aggregate_key_idx").on(
			table.propertyId,
			table.bucketStart,
			table.statusClass,
		),
		index("traffic_http_aggregate_time_idx").on(
			table.propertyId,
			table.bucketStart,
		),
	],
);

/**
 * HTTP route ranking, one row per day, route and status class.
 *
 * Routes are the highest-cardinality dimension of HTTP observability, so they
 * are aggregated by day: that is enough to rank the busiest routes and the
 * routes that fail most, without a row per bucket per route.
 */
export const trafficHttpRoutes = pgTable(
	"trafficHttpRoutes",
	{
		id: text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		propertyId: text("propertyId")
			.notNull()
			.references(() => webProperties.id, { onDelete: "cascade" }),
		dayStart: timestamp("dayStart", { withTimezone: true }).notNull(),
		route: text("route").notNull(),
		statusClass: trafficStatusClass("statusClass").notNull(),
		requests: integer("requests").notNull().default(0),
		bytesIn: bigint("bytesIn", { mode: "number" }).notNull().default(0),
		bytesOut: bigint("bytesOut", { mode: "number" }).notNull().default(0),
		latencyMsSum: bigint("latencyMsSum", { mode: "number" })
			.notNull()
			.default(0),
		latencyMsMax: integer("latencyMsMax").notNull().default(0),
	},
	(table) => [
		uniqueIndex("traffic_http_route_key_idx").on(
			table.propertyId,
			table.dayStart,
			table.route,
			table.statusClass,
		),
		index("traffic_http_route_rank_idx").on(
			table.propertyId,
			table.dayStart,
			table.route,
		),
	],
);

/** Audience page-views, aggregated by bucket × page × referrer × device. */
export const trafficAudienceAggregates = pgTable(
	"trafficAudienceAggregates",
	{
		id: text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		propertyId: text("propertyId")
			.notNull()
			.references(() => webProperties.id, { onDelete: "cascade" }),
		bucketStart: timestamp("bucketStart", { withTimezone: true }).notNull(),
		bucketSeconds: integer("bucketSeconds").notNull(),
		path: text("path").notNull(),
		/** Referrer host only — never the full referrer URL. */
		referrerHost: text("referrerHost").notNull().default(""),
		deviceType: trafficDeviceType("deviceType").notNull().default("unknown"),
		pageviews: integer("pageviews").notNull().default(0),
	},
	(table) => [
		uniqueIndex("traffic_audience_aggregate_key_idx").on(
			table.propertyId,
			table.bucketStart,
			table.path,
			table.referrerHost,
			table.deviceType,
		),
		index("traffic_audience_aggregate_time_idx").on(
			table.propertyId,
			table.bucketStart,
		),
		index("traffic_audience_aggregate_path_idx").on(
			table.propertyId,
			table.path,
			table.bucketStart,
		),
	],
);

/**
 * One row per session, written the first time a session id is seen.
 *
 * Sessions are counted from this table and unique visitors from
 * `count(DISTINCT visitorId)` over the same range. Both identifiers are random
 * values generated in the browser and stored client-side: no fingerprinting, no
 * IP address and no raw user agent is stored.
 */
export const trafficAudienceSessions = pgTable(
	"trafficAudienceSessions",
	{
		id: text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		propertyId: text("propertyId")
			.notNull()
			.references(() => webProperties.id, { onDelete: "cascade" }),
		sessionId: text("sessionId").notNull(),
		visitorId: text("visitorId").notNull(),
		/** UTC day (`YYYY-MM-DD`) the session started, used for retention. */
		dayBucket: text("dayBucket").notNull(),
		startedAt: timestamp("startedAt", { withTimezone: true }).notNull(),
		deviceType: trafficDeviceType("deviceType").notNull().default("unknown"),
		referrerHost: text("referrerHost").notNull().default(""),
		entryPath: text("entryPath").notNull().default("/"),
		pageviews: integer("pageviews").notNull().default(1),
	},
	(table) => [
		uniqueIndex("traffic_audience_session_key_idx").on(
			table.propertyId,
			table.sessionId,
		),
		index("traffic_audience_session_day_idx").on(
			table.propertyId,
			table.dayBucket,
		),
		index("traffic_audience_session_visitor_idx").on(
			table.propertyId,
			table.visitorId,
			table.dayBucket,
		),
	],
);

/** Explicitly instrumented audience events, aggregated by bucket × name. */
export const trafficAudienceEvents = pgTable(
	"trafficAudienceEvents",
	{
		id: text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		propertyId: text("propertyId")
			.notNull()
			.references(() => webProperties.id, { onDelete: "cascade" }),
		bucketStart: timestamp("bucketStart", { withTimezone: true }).notNull(),
		bucketSeconds: integer("bucketSeconds").notNull(),
		name: text("name").notNull(),
		count: integer("count").notNull().default(0),
	},
	(table) => [
		uniqueIndex("traffic_audience_event_key_idx").on(
			table.propertyId,
			table.bucketStart,
			table.name,
		),
		index("traffic_audience_event_time_idx").on(
			table.propertyId,
			table.bucketStart,
		),
	],
);

export const webPropertiesRelations = relations(
	webProperties,
	({ one, many }) => ({
		organization: one(organization, {
			fields: [webProperties.organizationId],
			references: [organization.id],
		}),
		sources: many(trafficSources),
	}),
);

export const trafficSourcesRelations = relations(trafficSources, ({ one }) => ({
	property: one(webProperties, {
		fields: [trafficSources.propertyId],
		references: [webProperties.id],
	}),
}));

export type WebProperty = typeof webProperties.$inferSelect;
export type NewWebProperty = typeof webProperties.$inferInsert;
export type TrafficSource = typeof trafficSources.$inferSelect;
export type NewTrafficSource = typeof trafficSources.$inferInsert;
export type TrafficHttpAggregate = typeof trafficHttpAggregates.$inferSelect;
export type NewTrafficHttpAggregate = typeof trafficHttpAggregates.$inferInsert;
export type TrafficHttpRoute = typeof trafficHttpRoutes.$inferSelect;
export type TrafficAudienceAggregate =
	typeof trafficAudienceAggregates.$inferSelect;
export type TrafficAudienceSession =
	typeof trafficAudienceSessions.$inferSelect;
export type TrafficAudienceEvent = typeof trafficAudienceEvents.$inferSelect;
export type TrafficSourceType = (typeof trafficSourceType.enumValues)[number];
export type TrafficSourceStatus =
	(typeof trafficSourceStatus.enumValues)[number];
export type TrafficStatusClass = (typeof trafficStatusClass.enumValues)[number];
export type TrafficDeviceType = (typeof trafficDeviceType.enumValues)[number];
