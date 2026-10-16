import type {
	TrafficDeviceType,
	TrafficStatusClass,
} from "@notploy/server/db/schema/traffic";

/**
 * Normalisation layer of the HTTP observability pipeline.
 *
 * A Traefik access log line carries far more than the Traffic Manager is
 * allowed to keep. This module is the single place where a line is turned into
 * the small, privacy-safe shape the rest of the pipeline works with:
 *
 * - the client address, the client port, the router/service internals and every
 *   header are dropped on parse;
 * - the query string and fragment are dropped from the request path, so tokens
 *   and secrets never reach the aggregates;
 * - path identifiers (ids, uuids, hashes, long tokens) are collapsed so the
 *   route ranking stays meaningful without storing the raw URL.
 *
 * Everything here is pure and synchronous: the collector, the API and the tests
 * all share it, and none of them need a database to run it.
 */

/** Fields the pipeline keeps from a Traefik access log entry. */
export interface TrafficHttpEvent {
	/** `StartUTC` of the request. */
	timestamp: Date;
	/** Normalised request host (lowercase, no port). */
	host: string;
	/** Normalised route, without query string nor fragment. */
	route: string;
	method: string;
	status: number;
	statusClass: TrafficStatusClass;
	/** Request body size (`RequestContentSize`). */
	bytesIn: number;
	/** Response body size (`DownstreamContentSize`). */
	bytesOut: number;
	/** Total request duration (`Duration`, converted from nanoseconds). */
	durationMs: number;
	/** `ServiceName`, used to recognise Notploy's own control plane. */
	serviceName: string | null;
	protocol: string | null;
}

/** Result of parsing a chunk of access log. */
export interface ParsedTrafficLog {
	events: TrafficHttpEvent[];
	/** Lines that were not usable: truncated by rotation, empty or malformed. */
	invalidLines: number;
}

/** The Traefik service name of Notploy's own dashboard, when observed locally. */
export const NOTPLOY_SERVICE_NAME = "notploy-service-app@file";

const MAX_ROUTE_LENGTH = 240;
const MAX_ROUTE_SEGMENTS = 8;

const UUID_SEGMENT =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_SEGMENT = /^[0-9a-f]{16,}$/i;
const NUMERIC_SEGMENT = /^\d+$/;
/** Opaque ids: long base64url/nanoid tokens, but not readable words. */
const OPAQUE_SEGMENT = /^[A-Za-z0-9_-]{24,}$/;
/**
 * Web assets grouped by extension. Data endpoints (`.json`, `.xml`, `.txt`, …)
 * are deliberately absent: `/api/logs.json` is API traffic worth seeing, not a
 * static file worth collapsing.
 */
const STATIC_EXTENSION =
	/\.(css|js|mjs|map|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|eot|mp4|webm)$/i;
/** Next.js data route: `/_next/data/<buildId>/<page>.json`. */
const NEXT_DATA_ROUTE = /^\/_next\/data\/[^/]+\/(.+)$/i;

/**
 * Drop the query string and the fragment. Anything after `?` may carry an
 * access token, an email address or a search query, none of which belongs in an
 * aggregate key.
 */
export const stripQueryAndHash = (rawPath: string): string => {
	const withoutHash = rawPath.split("#", 1)[0] ?? "";
	const withoutQuery = withoutHash.split("?", 1)[0] ?? "";
	return withoutQuery;
};

const normalizeSegment = (segment: string): string => {
	if (segment === "") {
		return segment;
	}
	if (UUID_SEGMENT.test(segment) || NUMERIC_SEGMENT.test(segment)) {
		return ":id";
	}
	if (HEX_SEGMENT.test(segment)) {
		return ":hash";
	}
	if (OPAQUE_SEGMENT.test(segment) && !/^[a-z-]+$/i.test(segment)) {
		return ":token";
	}
	return segment;
};

/**
 * Collapse a request path into a stable route used as an aggregate key.
 *
 * The route is lower-cased on purpose: `/Dashboard` and `/dashboard` are the
 * same destination for traffic reporting, and merging them keeps the ranking
 * readable. Static assets are grouped by extension so an application does not
 * flood the ranking with one row per bundle.
 */
export const normalizeRoute = (rawPath: string | null | undefined): string => {
	if (!rawPath) {
		return "/";
	}
	const pathOnly = stripQueryAndHash(rawPath).trim();
	if (pathOnly === "" || pathOnly === "/") {
		return "/";
	}

	// A Next.js data route hydrates the page it belongs to, so it is attributed
	// to that page instead of forming a route of its own. The build id changes on
	// every deployment and must never create a new route per release.
	const dataRoute = NEXT_DATA_ROUTE.exec(pathOnly);
	const path = dataRoute
		? `/${(dataRoute[1] ?? "").replace(/\.json$/i, "")}`
		: pathOnly;

	if (!dataRoute && STATIC_EXTENSION.test(path)) {
		const extension = path.split(".").pop()?.toLowerCase() ?? "asset";
		return `/:static/${extension}`;
	}

	const trailingSlashTrimmed =
		path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path;
	const segments = trailingSlashTrimmed
		.split("/")
		.filter((segment) => segment !== "");

	const bounded = segments
		.slice(0, MAX_ROUTE_SEGMENTS)
		.map(normalizeSegment)
		.join("/");

	if (bounded === "") {
		return "/";
	}

	const route = `/${bounded}`.toLowerCase();
	if (route.length > MAX_ROUTE_LENGTH) {
		return `${route.slice(0, MAX_ROUTE_LENGTH)}…`;
	}
	return route;
};

/** Lowercase host without port, IPv6 brackets nor trailing dot. */
export const normalizeHost = (host: string | null | undefined): string => {
	if (!host) {
		return "";
	}
	let value = host.trim().toLowerCase();
	if (value.startsWith("[")) {
		const closing = value.indexOf("]");
		value = closing === -1 ? value : value.slice(1, closing);
	} else {
		value = value.split(":", 1)[0] ?? value;
	}
	return value.replace(/\.$/, "");
};

/** Host of a referrer URL, or `""` when there is none/unparseable. */
export const referrerHostOf = (referrer: string | null | undefined): string => {
	if (!referrer) {
		return "";
	}
	try {
		return normalizeHost(new URL(referrer).host);
	} catch {
		return "";
	}
};

/** HTTP status class used as an aggregate key. */
export const statusClassOf = (status: number): TrafficStatusClass => {
	if (!Number.isFinite(status) || status <= 0) {
		return "other";
	}
	if (status < 200) {
		return "other";
	}
	if (status < 300) {
		return "2xx";
	}
	if (status < 400) {
		return "3xx";
	}
	if (status < 500) {
		return "4xx";
	}
	return "5xx";
};

/**
 * Coarse device category derived from the `User-Agent` header.
 *
 * The user agent string itself is never stored: it is reduced to four values on
 * ingest and the raw value is discarded with the rest of the headers. This is
 * category counting, not device identification — no fingerprinting involved.
 */
export const deviceTypeOf = (
	userAgent: string | null | undefined,
): TrafficDeviceType => {
	if (!userAgent) {
		return "unknown";
	}
	const ua = userAgent.toLowerCase();
	if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(ua)) {
		return "tablet";
	}
	if (/mobi|iphone|ipod|android|blackberry|windows phone/.test(ua)) {
		return "mobile";
	}
	if (
		/bot|crawler|spider|crawling|preview|curl|wget|python-requests/.test(ua)
	) {
		return "unknown";
	}
	return "desktop";
};

const asFiniteNumber = (value: unknown, fallback = 0): number =>
	typeof value === "number" && Number.isFinite(value) ? value : fallback;

const asString = (value: unknown): string | null =>
	typeof value === "string" && value.length > 0 ? value : null;

/**
 * Parse one access log line into a normalised event.
 *
 * Returns `null` for anything that is not a complete Traefik JSON entry: a line
 * truncated by log rotation, a plain-text line, or an entry missing its start
 * time. Partial records are dropped rather than guessed at.
 */
export const parseTraefikAccessLogLine = (
	line: string,
): TrafficHttpEvent | null => {
	const trimmed = line.trim();
	if (trimmed === "" || !trimmed.startsWith("{") || !trimmed.endsWith("}")) {
		return null;
	}
	let raw: Record<string, unknown>;
	try {
		raw = JSON.parse(trimmed) as Record<string, unknown>;
	} catch {
		return null;
	}
	if (raw === null || typeof raw !== "object") {
		return null;
	}

	const startUtc = asString(raw.StartUTC) ?? asString(raw.StartLocal);
	if (!startUtc) {
		return null;
	}
	const timestamp = new Date(startUtc);
	if (Number.isNaN(timestamp.getTime())) {
		return null;
	}

	const host = normalizeHost(
		asString(raw.RequestHost) ?? asString(raw.RequestAddr),
	);
	if (host === "") {
		return null;
	}

	const status = asFiniteNumber(
		raw.DownstreamStatus,
		asFiniteNumber(raw.OriginStatus),
	);
	// Traefik reports `Duration` in nanoseconds.
	const durationMs = Math.max(0, asFiniteNumber(raw.Duration) / 1e6);

	return {
		timestamp,
		host,
		route: normalizeRoute(asString(raw.RequestPath)),
		method: (asString(raw.RequestMethod) ?? "GET").toUpperCase().slice(0, 16),
		status,
		statusClass: statusClassOf(status),
		bytesIn: Math.max(0, asFiniteNumber(raw.RequestContentSize)),
		bytesOut: Math.max(0, asFiniteNumber(raw.DownstreamContentSize)),
		durationMs,
		serviceName: asString(raw.ServiceName),
		protocol: asString(raw.RequestProtocol),
	};
};

/**
 * Parse a chunk of access log.
 *
 * `maxEvents` bounds the work done by a single ingestion run so a huge log file
 * cannot stall the dashboard; the caller keeps its cursor on the lines actually
 * consumed.
 */
export const parseTraefikAccessLog = (
	raw: string | null | undefined,
	options: { maxEvents?: number } = {},
): ParsedTrafficLog => {
	const events: TrafficHttpEvent[] = [];
	let invalidLines = 0;
	if (!raw) {
		return { events, invalidLines };
	}
	const maxEvents = options.maxEvents ?? Number.POSITIVE_INFINITY;

	for (const line of raw.split("\n")) {
		if (events.length >= maxEvents) {
			break;
		}
		if (line.trim() === "") {
			continue;
		}
		const event = parseTraefikAccessLogLine(line);
		if (event) {
			events.push(event);
		} else {
			invalidLines++;
		}
	}

	return { events, invalidLines };
};

/** A property usable for domain resolution, without touching the database. */
export interface ResolvableProperty {
	id: string;
	domain: string;
	matchesSubdomains: boolean;
}

/**
 * Resolve a request host to the property that owns it.
 *
 * Exact domain first, then the longest matching parent domain when sub-domains
 * are allowed, so `docs.notploy.com` wins over a declared `notploy.com` when
 * both are watched separately.
 */
export const resolvePropertyId = (
	host: string,
	properties: readonly ResolvableProperty[],
): string | undefined => {
	const normalizedHost = normalizeHost(host);
	if (normalizedHost === "") {
		return undefined;
	}

	let best: ResolvableProperty | undefined;
	for (const property of properties) {
		const domain = normalizeHost(property.domain);
		if (domain === "") {
			continue;
		}
		const matches =
			normalizedHost === domain ||
			(property.matchesSubdomains && normalizedHost.endsWith(`.${domain}`));
		if (!matches) {
			continue;
		}
		if (!best || domain.length > normalizeHost(best.domain).length) {
			best = property;
		}
	}
	return best?.id;
};

/** Bucket size used by the collectors: five minutes. */
export const DEFAULT_BUCKET_SECONDS = 300;

/**
 * Floor a timestamp to the start of its aggregation bucket.
 *
 * Buckets are aligned on Unix time so every collector — whatever process or
 * restart produced it — writes the same key for the same instant.
 */
export const bucketStartFor = (
	date: Date,
	bucketSeconds: number = DEFAULT_BUCKET_SECONDS,
): Date => {
	const safeBucket = Math.max(1, Math.floor(bucketSeconds));
	const ms = Math.floor(date.getTime() / (safeBucket * 1000));
	return new Date(ms * safeBucket * 1000);
};

/** UTC day (`YYYY-MM-DD`) of a timestamp, used for session retention. */
export const dayBucketOf = (date: Date): string =>
	date.toISOString().slice(0, 10);
