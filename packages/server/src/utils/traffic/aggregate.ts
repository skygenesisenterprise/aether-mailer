import type { TrafficStatusClass } from "@notploy/server/db/schema/traffic";
import {
	bucketStartFor,
	DEFAULT_BUCKET_SECONDS,
	type TrafficHttpEvent,
} from "./parse";

/**
 * Aggregation primitives for HTTP observability.
 *
 * The pipeline never stores a request. An event is folded into the
 * `(bucket × route × status class)` row that already exists, and latency is
 * accumulated in a fixed-bin histogram. Percentiles are therefore computed from
 * the histogram bounds: a p95 is reported as the upper bound of the bin that
 * crosses 95 % of the samples, which is an *approximation* the API labels as
 * such, rather than an exact number the stored data cannot produce.
 */

/** Upper bounds (ms) of the latency histogram bins, plus one overflow bin. */
export const LATENCY_BUCKET_BOUNDS_MS = [
	10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10_000,
] as const;

/** Number of bins actually stored: one per bound plus the overflow bin. */
export const LATENCY_BUCKET_COUNT = LATENCY_BUCKET_BOUNDS_MS.length + 1;

export const emptyLatencyHistogram = (): number[] =>
	new Array<number>(LATENCY_BUCKET_COUNT).fill(0);

/** Index of the bin a duration belongs to (last bin collects the overflow). */
export const latencyBucketIndex = (durationMs: number): number => {
	const duration = Number.isFinite(durationMs) ? Math.max(0, durationMs) : 0;
	for (let index = 0; index < LATENCY_BUCKET_BOUNDS_MS.length; index++) {
		const bound = LATENCY_BUCKET_BOUNDS_MS[index];
		if (bound !== undefined && duration <= bound) {
			return index;
		}
	}
	return LATENCY_BUCKET_BOUNDS_MS.length;
};

/** Add one sample to a histogram (returns the same array for convenience). */
export const addLatencySample = (
	histogram: number[],
	durationMs: number,
): number[] => {
	const index = latencyBucketIndex(durationMs);
	histogram[index] = (histogram[index] ?? 0) + 1;
	return histogram;
};

const histogramToArray = (histogram: number[] | null | undefined): number[] => {
	const normalized = emptyLatencyHistogram();
	if (!Array.isArray(histogram)) {
		return normalized;
	}
	for (let index = 0; index < normalized.length; index++) {
		normalized[index] = histogram[index] ?? 0;
	}
	return normalized;
};

export const mergeHistograms = (
	histograms: ReadonlyArray<number[] | null | undefined>,
): number[] => {
	const merged = emptyLatencyHistogram();
	for (const histogram of histograms) {
		for (let index = 0; index < merged.length; index++) {
			merged[index] = (merged[index] ?? 0) + (histogram?.[index] ?? 0);
		}
	}
	return merged;
};

export const histogramTotal = (
	histogram: number[] | null | undefined,
): number => {
	if (!Array.isArray(histogram)) {
		return 0;
	}
	return histogram.reduce((total, value) => total + (value ?? 0), 0);
};

/**
 * Approximate percentile from a histogram.
 *
 * Returns `null` when the histogram holds no sample — the caller renders
 * "données insuffisantes" instead of a fake zero.
 */
export const percentileFromHistogram = (
	histogram: number[] | null | undefined,
	percentile: number,
): number | null => {
	const bins = histogramToArray(histogram);
	const total = histogramTotal(bins);
	if (total === 0) {
		return null;
	}
	const overflowBound = LATENCY_BUCKET_BOUNDS_MS.at(-1) ?? 0;
	const target = Math.max(0, Math.min(1, percentile)) * total;
	let cumulative = 0;
	for (let index = 0; index < bins.length; index++) {
		cumulative += bins[index] ?? 0;
		if (cumulative >= target) {
			// The overflow bin only proves the duration is above the last bound, so
			// it reports that bound rather than an invented maximum.
			return LATENCY_BUCKET_BOUNDS_MS[index] ?? overflowBound;
		}
	}
	return overflowBound;
};

/** One aggregated HTTP row, matching `trafficHttpAggregates`. */
export interface HttpAggregateRow {
	bucketStart: Date;
	bucketSeconds: number;
	route: string;
	statusClass: TrafficStatusClass;
	requests: number;
	bytesIn: number;
	bytesOut: number;
	latencyCount: number;
	latencyMsSum: number;
	latencyMsMax: number;
	latencyBuckets: number[];
}

/** Identity used to merge two events into the same aggregate row. */
export const httpAggregateKey = (
	event: TrafficHttpEvent,
	bucketSeconds: number,
): string =>
	`${bucketStartFor(event.timestamp, bucketSeconds).toISOString()}|${event.route}|${event.statusClass}`;

/**
 * Fold a batch of normalised events into aggregate rows.
 *
 * The input order does not matter and the output is keyed by
 * `(bucket, route, status class)`, which is exactly the unique index of the
 * aggregate table: the caller can therefore upsert the rows idempotently, and
 * re-running a collector over the same window changes nothing.
 */
export const aggregateHttpEvents = (
	events: readonly TrafficHttpEvent[],
	options: { bucketSeconds?: number } = {},
): HttpAggregateRow[] => {
	const bucketSeconds = options.bucketSeconds ?? DEFAULT_BUCKET_SECONDS;
	const rows = new Map<string, HttpAggregateRow>();

	for (const event of events) {
		const key = httpAggregateKey(event, bucketSeconds);
		let row = rows.get(key);
		if (!row) {
			row = {
				bucketStart: bucketStartFor(event.timestamp, bucketSeconds),
				bucketSeconds,
				route: event.route,
				statusClass: event.statusClass,
				requests: 0,
				bytesIn: 0,
				bytesOut: 0,
				latencyCount: 0,
				latencyMsSum: 0,
				latencyMsMax: 0,
				latencyBuckets: emptyLatencyHistogram(),
			};
			rows.set(key, row);
		}

		row.requests += 1;
		row.bytesIn += event.bytesIn;
		row.bytesOut += event.bytesOut;
		row.latencyCount += 1;
		row.latencyMsSum += Math.round(event.durationMs);
		row.latencyMsMax = Math.max(row.latencyMsMax, Math.round(event.durationMs));
		addLatencySample(row.latencyBuckets, event.durationMs);
	}

	return [...rows.values()].sort(
		(a, b) => a.bucketStart.getTime() - b.bucketStart.getTime(),
	);
};

export interface ErrorRateInput {
	requests: number;
	/** Requests answered with a 4xx or 5xx status. */
	errors: number;
}

/**
 * Error rate as a percentage.
 *
 * Returns `null` when no request was recorded, so the caller can distinguish
 * "0 % of nothing" from a genuine zero error rate.
 */
export const errorRateOf = ({
	requests,
	errors,
}: ErrorRateInput): number | null =>
	requests > 0 ? (errors / requests) * 100 : null;

/** Percentage change between two values, `null` when the base is unusable. */
export const changeRateOf = (
	current: number,
	previous: number,
): number | null => {
	if (
		!Number.isFinite(current) ||
		!Number.isFinite(previous) ||
		previous <= 0
	) {
		return null;
	}
	return ((current - previous) / previous) * 100;
};
