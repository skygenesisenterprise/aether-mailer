import fs from "node:fs";
import path from "node:path";
import { paths } from "@notploy/server/constants";
import { db } from "@notploy/server/db";
import {
	type NewTrafficHttpAggregate,
	type TrafficSource,
	type TrafficSourceConfig,
	type TrafficSourceStatus,
	type TrafficSourceType,
	type TrafficStatusClass,
	trafficAudienceAggregates,
	trafficAudienceEvents,
	trafficAudienceSessions,
	trafficHttpAggregates,
	trafficHttpRoutes,
	trafficSources,
	type WebProperty,
	webProperties,
} from "@notploy/server/db/schema";
import {
	aggregateHttpEvents,
	emptyLatencyHistogram,
	type HttpAggregateRow,
	LATENCY_BUCKET_COUNT,
} from "@notploy/server/utils/traffic/aggregate";
import {
	type AudienceIngestPayload,
	normalizeAudienceEvents,
} from "@notploy/server/utils/traffic/audience";
import {
	bucketStartFor,
	DEFAULT_BUCKET_SECONDS,
	dayBucketOf,
	deviceTypeOf,
	normalizeHost,
	parseTraefikAccessLog,
	resolvePropertyId,
	type TrafficHttpEvent,
} from "@notploy/server/utils/traffic/parse";
import {
	and,
	asc,
	eq,
	gte,
	inArray,
	isNotNull,
	lt,
	lte,
	sql,
} from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * Traffic Manager service.
 *
 * Two collectors feed the same model:
 *
 * - `ingestTraefikAccessLog` reads the reverse proxy access log **once per log
 *   file** (several watched domains usually share one Traefik log) and keeps a
 *   byte cursor on every source so a line is read once. Aggregates are written
 *   as `stored + incoming` inside a transaction, which makes a re-run over the
 *   same window a no-op.
 * - `ingestAudienceEvents` accepts the small batches posted by `traffic.js`,
 *   validates them, resolves the source by its public key and aggregates them.
 *
 * Nothing here stores a raw request, a request body, a header, a cookie, a
 * referrer URL or an IP address: only normalised aggregates and counters.
 */

/**
 * Audience aggregation resolution, in seconds (fifteen minutes).
 *
 * Coarser than the HTTP buckets because the audience key is multidimensional
 * (page × referrer × device): fifteen minutes keeps the "last hour" view useful
 * (four points) while bounding the row growth of a page × referrer × device
 * cross product.
 */
export const AUDIENCE_BUCKET_SECONDS = 900;

/** Errors the API layer maps to tRPC error codes. */
export type TrafficErrorCode =
	| "PROPERTY_NOT_FOUND"
	| "PROPERTY_DOMAIN_INVALID"
	| "PROPERTY_DOMAIN_EXISTS"
	| "SOURCE_NOT_FOUND"
	| "SOURCE_DISABLED"
	| "ORIGIN_NOT_ALLOWED"
	| "AUDIENCE_INGEST_DISABLED";

export class TrafficServiceError extends Error {
	readonly code: TrafficErrorCode;
	constructor(code: TrafficErrorCode, message: string) {
		super(message);
		this.name = "TrafficServiceError";
		this.code = code;
	}
}

const envInt = (name: string, fallback: number): number => {
	const parsed = Number.parseInt(process.env[name] ?? "", 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

/** Operator-tunable settings of the Traffic Manager, documented in `.env.example`. */
export const getTrafficRuntimeConfig = () => ({
	/** HTTP aggregate resolution, in seconds. */
	bucketSeconds: DEFAULT_BUCKET_SECONDS,
	/** Bounds of one collector run, so a huge log cannot stall the app. */
	maxEventsPerRun: envInt("TRAFFIC_MAX_EVENTS_PER_RUN", 20_000),
	maxBytesPerRun: envInt("TRAFFIC_MAX_LOG_BYTES_PER_RUN", 5_000_000),
	/** Retention of the aggregate tables, in days. */
	httpRetentionDays: envInt("TRAFFIC_HTTP_RETENTION_DAYS", 30),
	audienceRetentionDays: envInt("TRAFFIC_AUDIENCE_RETENTION_DAYS", 90),
	/** A source with no reception for that long is reported as degraded. */
	staleAfterMinutes: envInt("TRAFFIC_SOURCE_STALE_MINUTES", 60),
	/** `TRAFFIC_AUDIENCE_INGEST=false` refuses every audience event. */
	audienceIngestEnabled: process.env.TRAFFIC_AUDIENCE_INGEST !== "false",
	defaultTraefikLogPath:
		process.env.TRAFFIC_TRAEFIK_LOG_PATH ??
		path.join(paths().DYNAMIC_TRAEFIK_PATH, "access.log"),
});

const DOMAIN_PATTERN =
	/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

const assertValidDomain = (domain: string): string => {
	const normalized = normalizeHost(domain);
	if (!DOMAIN_PATTERN.test(normalized)) {
		throw new TrafficServiceError(
			"PROPERTY_DOMAIN_INVALID",
			`"${domain}" is not a valid domain name`,
		);
	}
	return normalized;
};

export const generateTrafficPublicKey = (): string => `pk_${nanoid(32)}`;

/**
 * Start a new Traefik source at the *end* of the access log.
 *
 * Cursors are per source but the log is shared, so a source added later must
 * not re-read what the sources already registered consumed — that would count
 * a request twice. A new domain therefore starts from the current end of file.
 */
const initialCursorFor = (
	logPath: string,
): TrafficSourceConfig["cursor"] | undefined => {
	try {
		const stat = fs.statSync(logPath);
		return {
			offset: stat.size,
			fileSize: stat.size,
			updatedAt: new Date().toISOString(),
		};
	} catch {
		return undefined;
	}
};

// ---------------------------------------------------------------------------
// Properties and sources
// ---------------------------------------------------------------------------

export interface TrafficPropertyWithSources extends WebProperty {
	sources: TrafficSource[];
}

/**
 * Properties of an organization with their sources.
 *
 * Two explicit queries instead of the relational API: the collectors are also
 * loaded by long-lived processes (Next.js dev server, scheduled worker) where a
 * relation registry cached from before a deployment must never make a new table
 * invisible. Selecting from the imported table objects keeps the query correct
 * whatever the surrounding module cache holds.
 */
export const listTrafficProperties = async (
	organizationId: string,
): Promise<TrafficPropertyWithSources[]> => {
	const properties = await db
		.select()
		.from(webProperties)
		.where(eq(webProperties.organizationId, organizationId))
		.orderBy(asc(webProperties.platform), asc(webProperties.domain));

	if (properties.length === 0) {
		return [];
	}

	const sources = await db
		.select()
		.from(trafficSources)
		.where(
			inArray(
				trafficSources.propertyId,
				properties.map((property) => property.id),
			),
		);

	const byProperty = new Map<string, TrafficSource[]>();
	for (const source of sources) {
		const bucket = byProperty.get(source.propertyId) ?? [];
		bucket.push(source);
		byProperty.set(source.propertyId, bucket);
	}

	return properties.map((property) => ({
		...property,
		sources: (byProperty.get(property.id) ?? []).sort((a, b) =>
			a.type.localeCompare(b.type),
		),
	}));
};

export const findTrafficProperty = async (
	organizationId: string,
	propertyId: string,
): Promise<TrafficPropertyWithSources> => {
	const properties = await listTrafficProperties(organizationId);
	const property = properties.find((candidate) => candidate.id === propertyId);
	if (!property) {
		throw new TrafficServiceError(
			"PROPERTY_NOT_FOUND",
			"Web property not found in this organization",
		);
	}
	return property;
};

export interface CreateTrafficPropertyInput {
	organizationId: string;
	platform: string;
	name?: string;
	domain: string;
	matchesSubdomains?: boolean;
	/** Source created alongside the property. Defaults to the Traefik collector. */
	sourceType?: TrafficSourceType;
	logPath?: string;
	allowedOrigins?: string[];
}

export const createTrafficProperty = async (
	input: CreateTrafficPropertyInput,
): Promise<TrafficPropertyWithSources> => {
	const domain = assertValidDomain(input.domain);
	const platform = input.platform.trim().toLowerCase() || "website";
	const sourceType = input.sourceType ?? "traefik";
	const logPath = input.logPath?.trim();

	const [existing] = await db
		.select({ id: webProperties.id })
		.from(webProperties)
		.where(
			and(
				eq(webProperties.organizationId, input.organizationId),
				eq(webProperties.domain, domain),
			),
		)
		.limit(1);
	if (existing) {
		throw new TrafficServiceError(
			"PROPERTY_DOMAIN_EXISTS",
			`${domain} is already watched by this organization`,
		);
	}

	return db.transaction(async (tx) => {
		const [property] = await tx
			.insert(webProperties)
			.values({
				organizationId: input.organizationId,
				platform,
				name: input.name?.trim() || domain,
				domain,
				matchesSubdomains: input.matchesSubdomains ?? true,
			})
			.returning();
		if (!property) {
			throw new Error("Failed to create the web property");
		}

		const config: TrafficSourceConfig = {
			...(sourceType === "traefik"
				? {
						logPath: logPath ?? getTrafficRuntimeConfig().defaultTraefikLogPath,
					}
				: {}),
			...(input.allowedOrigins?.length
				? { allowedOrigins: input.allowedOrigins }
				: {}),
		};
		if (sourceType === "traefik") {
			const cursor = initialCursorFor(
				config.logPath ?? getTrafficRuntimeConfig().defaultTraefikLogPath,
			);
			if (cursor) {
				config.cursor = cursor;
			}
		}

		const [source] = await tx
			.insert(trafficSources)
			.values({
				propertyId: property.id,
				type: sourceType,
				enabled: true,
				status: "not-configured",
				publicKey:
					sourceType === "web-instrumentation"
						? generateTrafficPublicKey()
						: null,
				config,
			})
			.returning();
		if (!source) {
			throw new Error("Failed to create the traffic source");
		}

		return { ...property, sources: [source] };
	});
};

export interface UpdateTrafficPropertyInput {
	organizationId: string;
	propertyId: string;
	name?: string;
	platform?: string;
	matchesSubdomains?: boolean;
	enabled?: boolean;
}

export const updateTrafficProperty = async (
	input: UpdateTrafficPropertyInput,
): Promise<TrafficPropertyWithSources> => {
	await findTrafficProperty(input.organizationId, input.propertyId);
	await db
		.update(webProperties)
		.set({
			...(input.name !== undefined ? { name: input.name.trim() } : {}),
			...(input.platform !== undefined
				? { platform: input.platform.trim().toLowerCase() }
				: {}),
			...(input.matchesSubdomains !== undefined
				? { matchesSubdomains: input.matchesSubdomains }
				: {}),
			...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
			updatedAt: new Date(),
		})
		.where(
			and(
				eq(webProperties.id, input.propertyId),
				eq(webProperties.organizationId, input.organizationId),
			),
		);
	return findTrafficProperty(input.organizationId, input.propertyId);
};

export const deleteTrafficProperty = async (
	organizationId: string,
	propertyId: string,
): Promise<void> => {
	await db
		.delete(webProperties)
		.where(
			and(
				eq(webProperties.id, propertyId),
				eq(webProperties.organizationId, organizationId),
			),
		);
};

export interface UpsertTrafficSourceInput {
	organizationId: string;
	propertyId: string;
	type: TrafficSourceType;
	enabled?: boolean;
	logPath?: string | null;
	allowedOrigins?: string[] | null;
	/** Issue a fresh public key (invalidates the previously installed script). */
	rotatePublicKey?: boolean;
}

export const upsertTrafficSource = async (
	input: UpsertTrafficSourceInput,
): Promise<TrafficSource> => {
	const property = await findTrafficProperty(
		input.organizationId,
		input.propertyId,
	);
	const source = property.sources.find(
		(candidate) => candidate.type === input.type,
	);

	const nextConfig: TrafficSourceConfig = { ...(source?.config ?? {}) };
	if (input.logPath !== undefined) {
		if (input.logPath === null || input.logPath.trim() === "") {
			delete nextConfig.logPath;
		} else {
			nextConfig.logPath = input.logPath.trim();
		}
	}
	if (input.allowedOrigins !== undefined) {
		const origins = (input.allowedOrigins ?? [])
			.map((origin) => origin.trim().toLowerCase())
			.filter((origin) => origin !== "");
		if (origins.length === 0) {
			delete nextConfig.allowedOrigins;
		} else {
			nextConfig.allowedOrigins = origins;
		}
	}

	const publicKey =
		input.type === "web-instrumentation"
			? input.rotatePublicKey || !source?.publicKey
				? generateTrafficPublicKey()
				: source.publicKey
			: (source?.publicKey ?? null);

	const enabled = input.enabled ?? source?.enabled ?? false;
	const wasEnabled = source?.enabled ?? false;

	if (!source) {
		if (input.type === "traefik") {
			const cursor = initialCursorFor(
				nextConfig.logPath ?? getTrafficRuntimeConfig().defaultTraefikLogPath,
			);
			if (cursor) {
				nextConfig.cursor = cursor;
			}
		}
		const [created] = await db
			.insert(trafficSources)
			.values({
				propertyId: property.id,
				type: input.type,
				enabled,
				status: "not-configured",
				publicKey,
				config: nextConfig,
			})
			.returning();
		if (!created) {
			throw new TrafficServiceError(
				"SOURCE_NOT_FOUND",
				"Failed to create the traffic source",
			);
		}
		return created;
	}

	const [updated] = await db
		.update(trafficSources)
		.set({
			enabled,
			publicKey,
			config: nextConfig,
			...(wasEnabled && !enabled
				? { status: "not-configured" as TrafficSourceStatus }
				: {}),
			updatedAt: new Date(),
		})
		.where(eq(trafficSources.id, source.id))
		.returning();
	if (!updated) {
		throw new TrafficServiceError(
			"SOURCE_NOT_FOUND",
			"Traffic source not found",
		);
	}
	return updated;
};

/**
 * The four web properties of an SGE instance, declared with the sources Notploy
 * knows how to feed. Declaring a property only says "we watch this domain":
 * every source starts in `not-configured`, and the dashboard keeps showing the
 * absence of data until a collector actually receives something.
 */
export const RECOMMENDED_SGE_PROPERTIES = [
	{ platform: "website", domain: "notploy.com", name: "Notploy Website" },
	{ platform: "docs", domain: "docs.notploy.com", name: "Notploy Docs" },
	{ platform: "app", domain: "app.notploy.com", name: "Notploy Cloud" },
	{ platform: "api", domain: "api.notploy.com", name: "Notploy API" },
] as const;

export const declareRecommendedProperties = async (
	organizationId: string,
): Promise<{ created: number; existing: number }> => {
	let created = 0;
	let existing = 0;
	for (const preset of RECOMMENDED_SGE_PROPERTIES) {
		const domain = assertValidDomain(preset.domain);
		const [current] = await db
			.select({ id: webProperties.id })
			.from(webProperties)
			.where(
				and(
					eq(webProperties.organizationId, organizationId),
					eq(webProperties.domain, domain),
				),
			)
			.limit(1);
		if (current) {
			existing++;
			continue;
		}
		await createTrafficProperty({
			organizationId,
			platform: preset.platform,
			name: preset.name,
			domain,
			sourceType: "traefik",
		});
		created++;
	}
	return { created, existing };
};

// ---------------------------------------------------------------------------
// HTTP ingestion (Traefik access log)
// ---------------------------------------------------------------------------

interface IncrementalChunk {
	/** Complete lines only: a partial trailing record is left for the next run. */
	content: string;
	/** Byte offset the content starts at. */
	startOffset: number;
	nextOffset: number;
	fileSize: number;
	truncated: boolean;
	/** Bytes dropped because a single record exceeded the read budget. */
	droppedBytes: number;
}

/**
 * Read the bytes after `offset`, stopping at the last complete line.
 *
 * A partial line is deliberately left for the next run instead of being parsed:
 * Traefik appends while we read, so the tail of the file is routinely an
 * incomplete record.
 */
const readIncrementalChunk = (
	logPath: string,
	offset: number,
	maxBytes: number,
): IncrementalChunk => {
	const stat = fs.statSync(logPath);
	const fileSize = stat.size;
	const truncated = fileSize < offset;
	const start = truncated ? 0 : offset;
	const available = fileSize - start;
	const bytesToRead = Math.max(0, Math.min(maxBytes, available));

	if (bytesToRead === 0) {
		return {
			content: "",
			startOffset: start,
			nextOffset: start,
			fileSize,
			truncated,
			droppedBytes: 0,
		};
	}

	const buffer = Buffer.alloc(bytesToRead);
	const fd = fs.openSync(logPath, "r");
	let bytesRead = 0;
	try {
		bytesRead = fs.readSync(fd, buffer, 0, bytesToRead, start);
	} finally {
		fs.closeSync(fd);
	}

	const lastNewline = buffer.lastIndexOf(0x0a, bytesRead - 1);
	if (lastNewline === -1) {
		// Either the writer has not finished its first line (wait for the next
		// run) or a single record is larger than the read budget (drop it, so the
		// cursor can never get stuck and block all subsequent traffic).
		const hitBudget = bytesToRead >= maxBytes;
		return {
			content: "",
			startOffset: start,
			nextOffset: hitBudget ? start + bytesRead : start,
			fileSize,
			truncated,
			droppedBytes: hitBudget ? bytesRead : 0,
		};
	}

	return {
		content: buffer.subarray(0, lastNewline + 1).toString("utf8"),
		startOffset: start,
		nextOffset: start + lastNewline + 1,
		fileSize,
		truncated,
		droppedBytes: 0,
	};
};

const dayStartFor = (date: Date): Date => {
	const copy = new Date(date);
	copy.setUTCHours(0, 0, 0, 0);
	return copy;
};

interface HttpRouteRow {
	dayStart: Date;
	route: string;
	statusClass: TrafficStatusClass;
	requests: number;
	bytesIn: number;
	bytesOut: number;
	latencyMsSum: number;
	latencyMsMax: number;
}

/** Fold events into daily route rows, keyed by day × route × status class. */
const aggregateRouteRows = (
	events: readonly TrafficHttpEvent[],
): HttpRouteRow[] => {
	const rows = new Map<string, HttpRouteRow>();
	for (const event of events) {
		const dayStart = dayStartFor(event.timestamp);
		const key = `${dayStart.toISOString()}|${event.route}|${event.statusClass}`;
		const durationMs = Math.round(event.durationMs);
		const existing = rows.get(key);
		if (existing) {
			existing.requests += 1;
			existing.bytesIn += event.bytesIn;
			existing.bytesOut += event.bytesOut;
			existing.latencyMsSum += durationMs;
			existing.latencyMsMax = Math.max(existing.latencyMsMax, durationMs);
			continue;
		}
		rows.set(key, {
			dayStart,
			route: event.route,
			statusClass: event.statusClass,
			requests: 1,
			bytesIn: event.bytesIn,
			bytesOut: event.bytesOut,
			latencyMsSum: durationMs,
			latencyMsMax: durationMs,
		});
	}
	return [...rows.values()];
};

type TrafficTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Persist `(bucket, status class)` rows, merging histograms.
 *
 * Scalar counters are incremented in SQL; the latency histogram is merged in
 * JavaScript because JSON arrays cannot be summed in a single statement without
 * unnesting them. The surrounding transaction therefore reads the rows
 * `FOR UPDATE` and writes the merged histogram back, so the scheduled run and a
 * manual "Collect now" can never lose each other's samples.
 */
const persistHttpAggregates = async (
	tx: TrafficTransaction,
	propertyId: string,
	rows: readonly HttpAggregateRow[],
): Promise<void> => {
	if (rows.length === 0) {
		return;
	}
	const timestamps = rows.map((row) => row.bucketStart.getTime());
	const minBucket = new Date(Math.min(...timestamps));
	const maxBucket = new Date(Math.max(...timestamps));

	const storedRows = await tx
		.select({
			bucketStart: trafficHttpAggregates.bucketStart,
			statusClass: trafficHttpAggregates.statusClass,
			latencyBuckets: trafficHttpAggregates.latencyBuckets,
		})
		.from(trafficHttpAggregates)
		.where(
			and(
				eq(trafficHttpAggregates.propertyId, propertyId),
				gte(trafficHttpAggregates.bucketStart, minBucket),
				lte(trafficHttpAggregates.bucketStart, maxBucket),
			),
		)
		.for("update");

	const stored = new Map(
		storedRows.map((row) => [
			`${row.bucketStart.toISOString()}|${row.statusClass}`,
			row.latencyBuckets ?? [],
		]),
	);

	const values: NewTrafficHttpAggregate[] = rows.map((row) => {
		const storedHistogram =
			stored.get(`${row.bucketStart.toISOString()}|${row.statusClass}`) ?? [];
		const histogram = emptyLatencyHistogram();
		for (let index = 0; index < LATENCY_BUCKET_COUNT; index++) {
			histogram[index] =
				(storedHistogram[index] ?? 0) + (row.latencyBuckets[index] ?? 0);
		}
		return {
			propertyId,
			bucketStart: row.bucketStart,
			bucketSeconds: row.bucketSeconds,
			statusClass: row.statusClass,
			requests: row.requests,
			bytesIn: row.bytesIn,
			bytesOut: row.bytesOut,
			latencyCount: row.latencyCount,
			latencyMsSum: row.latencyMsSum,
			latencyMsMax: row.latencyMsMax,
			latencyBuckets: histogram,
		};
	});

	await tx
		.insert(trafficHttpAggregates)
		.values(values)
		.onConflictDoUpdate({
			target: [
				trafficHttpAggregates.propertyId,
				trafficHttpAggregates.bucketStart,
				trafficHttpAggregates.statusClass,
			],
			set: {
				requests: sql`${trafficHttpAggregates.requests} + ${sql.raw("excluded.requests")}`,
				bytesIn: sql`${trafficHttpAggregates.bytesIn} + ${sql.raw('excluded."bytesIn"')}`,
				bytesOut: sql`${trafficHttpAggregates.bytesOut} + ${sql.raw('excluded."bytesOut"')}`,
				latencyCount: sql`${trafficHttpAggregates.latencyCount} + ${sql.raw('excluded."latencyCount"')}`,
				latencyMsSum: sql`${trafficHttpAggregates.latencyMsSum} + ${sql.raw('excluded."latencyMsSum"')}`,
				latencyMsMax: sql`greatest(${trafficHttpAggregates.latencyMsMax}, ${sql.raw('excluded."latencyMsMax"')})`,
				// Already merged in JavaScript above, so it is written as-is.
				latencyBuckets: sql`${sql.raw('excluded."latencyBuckets"')}`,
			},
		});
};

const persistHttpRoutes = async (
	tx: TrafficTransaction,
	propertyId: string,
	rows: readonly HttpRouteRow[],
): Promise<void> => {
	if (rows.length === 0) {
		return;
	}
	await tx
		.insert(trafficHttpRoutes)
		.values(
			rows.map((row) => ({
				propertyId,
				dayStart: row.dayStart,
				route: row.route,
				statusClass: row.statusClass,
				requests: row.requests,
				bytesIn: row.bytesIn,
				bytesOut: row.bytesOut,
				latencyMsSum: row.latencyMsSum,
				latencyMsMax: row.latencyMsMax,
			})),
		)
		.onConflictDoUpdate({
			target: [
				trafficHttpRoutes.propertyId,
				trafficHttpRoutes.dayStart,
				trafficHttpRoutes.route,
				trafficHttpRoutes.statusClass,
			],
			set: {
				requests: sql`${trafficHttpRoutes.requests} + ${sql.raw("excluded.requests")}`,
				bytesIn: sql`${trafficHttpRoutes.bytesIn} + ${sql.raw('excluded."bytesIn"')}`,
				bytesOut: sql`${trafficHttpRoutes.bytesOut} + ${sql.raw('excluded."bytesOut"')}`,
				latencyMsSum: sql`${trafficHttpRoutes.latencyMsSum} + ${sql.raw('excluded."latencyMsSum"')}`,
				latencyMsMax: sql`greatest(${trafficHttpRoutes.latencyMsMax}, ${sql.raw('excluded."latencyMsMax"')})`,
			},
		});
};

export interface TraefikIngestSourceReport {
	sourceId: string;
	propertyId: string;
	domain: string;
	logPath: string;
	status: TrafficSourceStatus;
	eventsAccepted: number;
	/** Requests whose host is not watched by any property. */
	eventsUnmatched: number;
	invalidLines: number;
	droppedBytes: number;
	truncatedFile: boolean;
	error: string | null;
}

export interface TraefikIngestReport {
	sources: TraefikIngestSourceReport[];
	eventsAccepted: number;
	eventsUnmatched: number;
	propertiesTouched: number;
	ranAt: string;
}

const markSourceUnavailable = async (
	sourceId: string,
	error: string,
): Promise<void> => {
	await db
		.update(trafficSources)
		.set({
			status: "unavailable",
			lastError: error,
			lastErrorAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(trafficSources.id, sourceId));
};

/**
 * Run the Traefik collector.
 *
 * Without `organizationId` the run covers every enabled Traefik source (that is
 * what the scheduled job does); with it, only that organization's sources (that
 * is what the "Collect now" button does). Sources sharing a log file are served
 * by a single read, and each keeps its own cursor.
 */
export const ingestTraefikAccessLog = async (options?: {
	organizationId?: string;
	maxEvents?: number;
	maxBytes?: number;
}): Promise<TraefikIngestReport> => {
	const config = getTrafficRuntimeConfig();
	const maxEvents = options?.maxEvents ?? config.maxEventsPerRun;
	const maxBytes = options?.maxBytes ?? config.maxBytesPerRun;

	const sources = await db
		.select({ source: trafficSources, property: webProperties })
		.from(trafficSources)
		.innerJoin(webProperties, eq(webProperties.id, trafficSources.propertyId))
		.where(
			and(
				eq(trafficSources.type, "traefik"),
				eq(trafficSources.enabled, true),
				options?.organizationId
					? eq(webProperties.organizationId, options.organizationId)
					: undefined,
			),
		)
		.then((rows) =>
			rows.map((row) => ({ ...row.source, property: row.property })),
		);

	const report: TraefikIngestReport = {
		sources: [],
		eventsAccepted: 0,
		eventsUnmatched: 0,
		propertiesTouched: 0,
		ranAt: new Date().toISOString(),
	};
	if (sources.length === 0) {
		return report;
	}

	// Only enabled properties can receive traffic: a disabled property stops
	// being a resolution target instead of silently accumulating data.
	const resolvable = sources
		.filter((source) => source.property.enabled)
		.map((source) => source.property)
		.filter(
			(property, index, all) =>
				all.findIndex((candidate) => candidate.id === property.id) === index,
		)
		.map((property) => ({
			id: property.id,
			domain: property.domain,
			matchesSubdomains: property.matchesSubdomains,
		}));

	const groupedByPath = new Map<string, typeof sources>();
	for (const source of sources) {
		const logPath =
			source.config?.logPath?.trim() || config.defaultTraefikLogPath;
		const group = groupedByPath.get(logPath) ?? [];
		group.push(source);
		groupedByPath.set(logPath, group);
	}

	const eventsByProperty = new Map<string, TrafficHttpEvent[]>();
	let remainingEvents = maxEvents;

	for (const [logPath, group] of groupedByPath) {
		const startOffset = Math.min(
			...group.map((source) => source.config?.cursor?.offset ?? 0),
		);

		const reports = group.map<TraefikIngestSourceReport>((source) => ({
			sourceId: source.id,
			propertyId: source.propertyId,
			domain: source.property.domain,
			logPath,
			status: source.status,
			eventsAccepted: 0,
			eventsUnmatched: 0,
			invalidLines: 0,
			droppedBytes: 0,
			truncatedFile: false,
			error: null,
		}));
		report.sources.push(...reports);
		const reportBySourceId = new Map(
			reports.map((entry) => [entry.sourceId, entry]),
		);

		if (remainingEvents <= 0) {
			for (const entry of reports) {
				entry.status = "degraded";
				entry.error =
					"Per-run event budget exhausted; this log will be read again on the next run.";
			}
			continue;
		}

		let chunk: IncrementalChunk;
		try {
			if (!fs.existsSync(logPath)) {
				throw new Error(`Access log not found at ${logPath}`);
			}
			chunk = readIncrementalChunk(logPath, startOffset, maxBytes);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unable to read access log";
			for (const source of group) {
				const entry = reportBySourceId.get(source.id);
				if (entry) {
					entry.status = "unavailable";
					entry.error = message;
				}
				await markSourceUnavailable(source.id, message);
			}
			continue;
		}

		// Consume only the lines the event budget allows: the cursor must never
		// advance past an unparsed line, or that traffic would be lost.
		const lines = chunk.content
			.split("\n")
			.filter((line) => line.trim() !== "");
		const consumedLines = lines.slice(0, Math.max(0, remainingEvents));
		const consumedBytes = consumedLines.reduce(
			(total, line) => total + Buffer.byteLength(line, "utf8") + 1,
			0,
		);
		const nextOffset = chunk.startOffset + consumedBytes;
		remainingEvents -= consumedLines.length;

		for (const entry of reports) {
			entry.truncatedFile = chunk.truncated;
			entry.droppedBytes = chunk.droppedBytes;
		}

		const { events, invalidLines } = parseTraefikAccessLog(
			consumedLines.join("\n"),
		);
		for (const entry of reports) {
			entry.invalidLines = invalidLines;
		}

		const matchedByProperty = new Map<string, TrafficHttpEvent[]>();
		let unmatched = 0;
		for (const event of events) {
			const propertyId = resolvePropertyId(event.host, resolvable);
			if (!propertyId) {
				unmatched++;
				continue;
			}
			const bucket = matchedByProperty.get(propertyId) ?? [];
			bucket.push(event);
			matchedByProperty.set(propertyId, bucket);
		}
		report.eventsUnmatched += unmatched;
		for (const entry of reports) {
			entry.eventsUnmatched = unmatched;
		}

		// Each source is updated with the same cursor: they share the file, so
		// they must share the bookkeeping of what has been consumed.
		for (const source of group) {
			const entry = reportBySourceId.get(source.id);
			const matched = matchedByProperty.get(source.propertyId) ?? [];
			if (entry) {
				entry.eventsAccepted = matched.length;
			}
		}

		const cursorConfig = (source: (typeof group)[number]) =>
			({
				...source.config,
				cursor: {
					offset: nextOffset,
					fileSize: chunk.fileSize,
					updatedAt: new Date().toISOString(),
				},
			}) satisfies TrafficSourceConfig;

		try {
			await db.transaction(async (tx) => {
				for (const [propertyId, propertyEvents] of matchedByProperty) {
					await persistHttpAggregates(
						tx,
						propertyId,
						aggregateHttpEvents(propertyEvents, {
							bucketSeconds: config.bucketSeconds,
						}),
					);
					await persistHttpRoutes(
						tx,
						propertyId,
						aggregateRouteRows(propertyEvents),
					);

					const bucket = eventsByProperty.get(propertyId) ?? [];
					bucket.push(...propertyEvents);
					eventsByProperty.set(propertyId, bucket);
				}

				for (const source of group) {
					const matched = matchedByProperty.get(source.propertyId) ?? [];
					const lastEvent = matched.at(-1);
					const entry = reportBySourceId.get(source.id);
					const hasReceived = matched.length > 0 || !!source.lastEventAt;
					await tx
						.update(trafficSources)
						.set({
							// "active" means the collector ran and the source has seen
							// traffic at some point; a source that never received
							// anything stays "not-configured" so the dashboard can say
							// so instead of showing an empty success.
							status: hasReceived
								? "active"
								: ("not-configured" as TrafficSourceStatus),
							config: cursorConfig(source),
							lastAggregatedAt: new Date(),
							...(lastEvent ? { lastEventAt: lastEvent.timestamp } : {}),
							lastError: null,
							lastErrorAt: null,
							updatedAt: new Date(),
						})
						.where(eq(trafficSources.id, source.id));
					if (entry) {
						entry.status = hasReceived ? "active" : "not-configured";
					}
				}
			});
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to persist the HTTP aggregates";
			for (const source of group) {
				const entry = reportBySourceId.get(source.id);
				if (entry) {
					entry.status = "unavailable";
					entry.error = message;
				}
				await markSourceUnavailable(source.id, message);
			}
		}

		for (const entry of reports) {
			report.eventsAccepted += entry.eventsAccepted;
		}
	}

	report.propertiesTouched = eventsByProperty.size;
	return report;
};

// ---------------------------------------------------------------------------
// Audience ingestion (web instrumentation)
// ---------------------------------------------------------------------------

export interface AudienceIngestInput {
	payload: AudienceIngestPayload;
	/** `Origin` header of the ingest request. */
	origin?: string | null;
	/** `User-Agent` header, reduced to a device category and then discarded. */
	userAgent?: string | null;
	now?: Date;
}

export interface AudienceIngestResult {
	propertyId: string;
	sourceId: string;
	pageviews: number;
	events: number;
	newSessions: number;
	/** Events dropped because they carried no usable path or name. */
	dropped: number;
}

/** Resolve a public instrumentation key to its enabled source and property. */
export const findAudienceSourceByPublicKey = async (publicKey: string) => {
	const [row] = await db
		.select({ source: trafficSources, property: webProperties })
		.from(trafficSources)
		.innerJoin(webProperties, eq(webProperties.id, trafficSources.propertyId))
		.where(eq(trafficSources.publicKey, publicKey))
		.limit(1);
	const source = row ? { ...row.source, property: row.property } : undefined;
	if (!source) {
		throw new TrafficServiceError(
			"SOURCE_NOT_FOUND",
			"Unknown traffic property key",
		);
	}
	if (source.type !== "web-instrumentation" || !source.enabled) {
		throw new TrafficServiceError(
			"SOURCE_DISABLED",
			"Web instrumentation is not enabled for this property",
		);
	}
	if (!source.property.enabled) {
		throw new TrafficServiceError(
			"SOURCE_DISABLED",
			"The web property is disabled",
		);
	}
	return source;
};

/**
 * Validate the origin of an ingest request.
 *
 * A public key is public by construction (it ships in the site's HTML), so the
 * real protection is here: when the source declares `allowedOrigins`, only those
 * origins may post. When it does not, the property's own domain and its
 * sub-domains are accepted, which covers the SGE sites without extra
 * configuration.
 */
export const isAudienceOriginAllowed = (options: {
	origin: string | null | undefined;
	allowedOrigins: string[] | undefined;
	propertyDomain: string;
}): boolean => {
	if (!options.origin) {
		// Server-side calls (curl, tests) carry no Origin. They still have to
		// present a valid key and stay inside the rate limit.
		return true;
	}
	let originHost: string;
	try {
		originHost = normalizeHost(new URL(options.origin).host);
	} catch {
		return false;
	}
	const allowList = options.allowedOrigins?.length
		? options.allowedOrigins
		: [options.propertyDomain];
	return allowList.some((entry) => {
		const normalized = normalizeHost(entry);
		return (
			normalized !== "" &&
			(normalized === originHost || originHost.endsWith(`.${normalized}`))
		);
	});
};

interface AudienceSessionSeed {
	sessionId: string;
	visitorId: string;
	startedAt: Date;
	referrerHost: string;
	entryPath: string;
}

export const ingestAudienceEvents = async (
	input: AudienceIngestInput,
): Promise<AudienceIngestResult> => {
	const config = getTrafficRuntimeConfig();
	if (!config.audienceIngestEnabled) {
		throw new TrafficServiceError(
			"AUDIENCE_INGEST_DISABLED",
			"Audience ingestion is disabled on this instance",
		);
	}

	const source = await findAudienceSourceByPublicKey(input.payload.publicKey);
	if (
		!isAudienceOriginAllowed({
			origin: input.origin,
			allowedOrigins: source.config?.allowedOrigins,
			propertyDomain: source.property.domain,
		})
	) {
		throw new TrafficServiceError(
			"ORIGIN_NOT_ALLOWED",
			"This origin is not allowed to send traffic events",
		);
	}

	const now = input.now ?? new Date();
	const deviceType = deviceTypeOf(input.userAgent);
	const normalized = normalizeAudienceEvents(input.payload, {
		now,
		siteHost: source.property.domain,
	});
	if (normalized.length === 0) {
		return {
			propertyId: source.propertyId,
			sourceId: source.id,
			pageviews: 0,
			events: 0,
			newSessions: 0,
			dropped: input.payload.events.length,
		};
	}

	const pageviewRows = new Map<
		string,
		{ bucketStart: Date; path: string; referrerHost: string; pageviews: number }
	>();
	const eventRows = new Map<
		string,
		{ bucketStart: Date; name: string; count: number }
	>();
	const sessions = new Map<string, AudienceSessionSeed>();
	for (const event of normalized) {
		const bucketStart = bucketStartFor(
			event.timestamp,
			AUDIENCE_BUCKET_SECONDS,
		);
		if (event.kind === "pageview") {
			const key = `${bucketStart.toISOString()}|${event.path}|${event.referrerHost}`;
			const row = pageviewRows.get(key);
			if (row) {
				row.pageviews += 1;
			} else {
				pageviewRows.set(key, {
					bucketStart,
					path: event.path,
					referrerHost: event.referrerHost,
					pageviews: 1,
				});
			}
		} else {
			const key = `${bucketStart.toISOString()}|${event.name}`;
			const row = eventRows.get(key);
			if (row) {
				row.count += 1;
			} else {
				eventRows.set(key, { bucketStart, name: event.name, count: 1 });
			}
		}

		const session = sessions.get(event.sessionId);
		if (session) {
			if (event.timestamp < session.startedAt) {
				session.startedAt = event.timestamp;
				session.entryPath = event.path;
				session.referrerHost = event.referrerHost;
			}
			continue;
		}
		sessions.set(event.sessionId, {
			sessionId: event.sessionId,
			visitorId: event.visitorId,
			startedAt: event.timestamp,
			referrerHost: event.referrerHost,
			entryPath: event.path,
		});
	}

	const newSessions = await db.transaction(async (tx) => {
		for (const row of pageviewRows.values()) {
			await tx
				.insert(trafficAudienceAggregates)
				.values({
					propertyId: source.propertyId,
					bucketStart: row.bucketStart,
					bucketSeconds: AUDIENCE_BUCKET_SECONDS,
					path: row.path,
					referrerHost: row.referrerHost,
					deviceType,
					pageviews: row.pageviews,
				})
				.onConflictDoUpdate({
					target: [
						trafficAudienceAggregates.propertyId,
						trafficAudienceAggregates.bucketStart,
						trafficAudienceAggregates.path,
						trafficAudienceAggregates.referrerHost,
						trafficAudienceAggregates.deviceType,
					],
					set: {
						pageviews: sql`${trafficAudienceAggregates.pageviews} + ${row.pageviews}`,
					},
				});
		}

		for (const row of eventRows.values()) {
			await tx
				.insert(trafficAudienceEvents)
				.values({
					propertyId: source.propertyId,
					bucketStart: row.bucketStart,
					bucketSeconds: AUDIENCE_BUCKET_SECONDS,
					name: row.name,
					count: row.count,
				})
				.onConflictDoUpdate({
					target: [
						trafficAudienceEvents.propertyId,
						trafficAudienceEvents.bucketStart,
						trafficAudienceEvents.name,
					],
					set: { count: sql`${trafficAudienceEvents.count} + ${row.count}` },
				});
		}

		let created = 0;
		for (const session of sessions.values()) {
			// The unique key on (property, session) is the de-duplication guard:
			// a session is counted once however many batches it appears in.
			const inserted = await tx
				.insert(trafficAudienceSessions)
				.values({
					propertyId: source.propertyId,
					sessionId: session.sessionId,
					visitorId: session.visitorId,
					dayBucket: dayBucketOf(session.startedAt),
					startedAt: session.startedAt,
					deviceType,
					referrerHost: session.referrerHost,
					entryPath: session.entryPath,
					pageviews: 1,
				})
				.onConflictDoNothing({
					target: [
						trafficAudienceSessions.propertyId,
						trafficAudienceSessions.sessionId,
					],
				})
				.returning({ id: trafficAudienceSessions.id });

			if (inserted.length > 0) {
				created += 1;
				continue;
			}
			await tx
				.update(trafficAudienceSessions)
				.set({ pageviews: sql`${trafficAudienceSessions.pageviews} + 1` })
				.where(
					and(
						eq(trafficAudienceSessions.propertyId, source.propertyId),
						eq(trafficAudienceSessions.sessionId, session.sessionId),
					),
				);
		}

		const lastTimestamp = normalized.reduce(
			(latest, event) => (event.timestamp > latest ? event.timestamp : latest),
			normalized[0]?.timestamp ?? now,
		);
		await tx
			.update(trafficSources)
			.set({
				status: "active",
				lastEventAt: lastTimestamp,
				lastAggregatedAt: new Date(),
				lastError: null,
				lastErrorAt: null,
				updatedAt: new Date(),
			})
			.where(eq(trafficSources.id, source.id));

		return created;
	});

	const pageviews = [...pageviewRows.values()].reduce(
		(total, row) => total + row.pageviews,
		0,
	);

	return {
		propertyId: source.propertyId,
		sourceId: source.id,
		pageviews,
		events: [...eventRows.values()].reduce(
			(total, row) => total + row.count,
			0,
		),
		newSessions,
		dropped: input.payload.events.length - normalized.length,
	};
};

// ---------------------------------------------------------------------------
// Retention
// ---------------------------------------------------------------------------

export interface TrafficRetentionReport {
	httpAggregates: number;
	httpRoutes: number;
	audienceAggregates: number;
	audienceEvents: number;
	audienceSessions: number;
	httpRetentionDays: number;
	audienceRetentionDays: number;
	ranAt: string;
}

/**
 * Delete aggregates older than the configured retention.
 *
 * Raw requests are not stored, so this is the whole retention story: one
 * `DELETE` per table, run by the scheduled job. Both windows are environment
 * driven (`TRAFFIC_HTTP_RETENTION_DAYS`, `TRAFFIC_AUDIENCE_RETENTION_DAYS`) and
 * surfaced on the page so an operator can see the policy that applies.
 */
export const runTrafficRetention = async (options?: {
	now?: Date;
}): Promise<TrafficRetentionReport> => {
	const config = getTrafficRuntimeConfig();
	const now = options?.now ?? new Date();
	const httpCutoff = new Date(
		now.getTime() - config.httpRetentionDays * 24 * 60 * 60 * 1000,
	);
	const audienceCutoff = new Date(
		now.getTime() - config.audienceRetentionDays * 24 * 60 * 60 * 1000,
	);

	return db.transaction(async (tx) => {
		const httpAggregates = await tx
			.delete(trafficHttpAggregates)
			.where(lt(trafficHttpAggregates.bucketStart, httpCutoff))
			.returning({ id: trafficHttpAggregates.id });
		const httpRoutes = await tx
			.delete(trafficHttpRoutes)
			.where(lt(trafficHttpRoutes.dayStart, httpCutoff))
			.returning({ id: trafficHttpRoutes.id });
		const audienceAggregates = await tx
			.delete(trafficAudienceAggregates)
			.where(lt(trafficAudienceAggregates.bucketStart, audienceCutoff))
			.returning({ id: trafficAudienceAggregates.id });
		const audienceEvents = await tx
			.delete(trafficAudienceEvents)
			.where(lt(trafficAudienceEvents.bucketStart, audienceCutoff))
			.returning({ id: trafficAudienceEvents.id });
		const audienceSessions = await tx
			.delete(trafficAudienceSessions)
			.where(lt(trafficAudienceSessions.dayBucket, dayBucketOf(audienceCutoff)))
			.returning({ id: trafficAudienceSessions.id });

		return {
			httpAggregates: httpAggregates.length,
			httpRoutes: httpRoutes.length,
			audienceAggregates: audienceAggregates.length,
			audienceEvents: audienceEvents.length,
			audienceSessions: audienceSessions.length,
			httpRetentionDays: config.httpRetentionDays,
			audienceRetentionDays: config.audienceRetentionDays,
			ranAt: now.toISOString(),
		};
	});
};

/** Most recent reception across the organization's sources. */
export const lastTrafficEventAt = async (
	organizationId: string,
): Promise<Date | null> => {
	const [row] = await db
		.select({
			lastEventAt: sql<Date | null>`max(${trafficSources.lastEventAt})`,
		})
		.from(trafficSources)
		.innerJoin(webProperties, eq(webProperties.id, trafficSources.propertyId))
		.where(
			and(
				eq(webProperties.organizationId, organizationId),
				isNotNull(trafficSources.lastEventAt),
			),
		);
	return row?.lastEventAt ?? null;
};
