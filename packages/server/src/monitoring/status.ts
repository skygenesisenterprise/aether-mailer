/**
 * Shared monitoring semantics for resource utilization.
 *
 * This module is intentionally free of any UI or framework dependency so the
 * same status/threshold model can be consumed by the dashboard, server list,
 * notifications, webhooks, desktop, mobile or the CLI.
 *
 * Percentages only make sense for capacity metrics (CPU, memory, disk). I/O
 * metrics such as network and block I/O describe throughput, not capacity, and
 * must not be forced into this model unless a real capacity is known.
 */

export type MetricStatus = "normal" | "warning" | "critical";

export interface MetricThresholds {
	warning: number;
	critical: number;
}

export type MetricKind = "cpu" | "memory" | "disk";

export type MetricThresholdConfig = Record<MetricKind, MetricThresholds>;

/**
 * Default thresholds used when no metric-specific or user configuration
 * exists. Kept in one place so components never hardcode their own values.
 */
export const DEFAULT_THRESHOLDS: MetricThresholds = {
	warning: 80,
	critical: 90,
};

export const DEFAULT_METRIC_THRESHOLDS: MetricThresholdConfig = {
	cpu: { ...DEFAULT_THRESHOLDS },
	memory: { ...DEFAULT_THRESHOLDS },
	disk: { ...DEFAULT_THRESHOLDS },
};

export interface MetricUsage {
	used: number;
	total: number;
	percentage: number;
	status: MetricStatus;
}

const toFiniteNumber = (value: unknown): number => {
	const parsed =
		typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
	return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Clamp a percentage into the `[0, 100]` range so progress values can never be
 * invalid. Non-numeric input resolves to `0`.
 */
export const clampPercentage = (value: unknown): number => {
	const parsed = toFiniteNumber(value);
	return Math.min(100, Math.max(0, parsed));
};

/**
 * Compute a utilization percentage from used/total values. A zero (or invalid)
 * total yields `0` instead of `Infinity`/`NaN`.
 */
export const getUsagePercentage = (used: unknown, total: unknown): number => {
	const usedValue = toFiniteNumber(used);
	const totalValue = toFiniteNumber(total);
	if (totalValue <= 0) {
		return 0;
	}
	return clampPercentage((usedValue / totalValue) * 100);
};

/**
 * Normalize thresholds, filling missing values with defaults, clamping into
 * `[0, 100]` and swapping inverted pairs so `warning <= critical` always holds.
 */
/** A threshold is usable only when it is a finite number. */
const thresholdOr = (value: unknown, fallback: number): number => {
	const parsed =
		typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
	return Number.isFinite(parsed) ? clampPercentage(parsed) : fallback;
};

export const normalizeThresholds = (
	thresholds?: Partial<MetricThresholds> | null,
): MetricThresholds => {
	const warning = thresholdOr(
		thresholds?.warning,
		DEFAULT_THRESHOLDS.warning,
	);
	const critical = thresholdOr(
		thresholds?.critical,
		DEFAULT_THRESHOLDS.critical,
	);
	if (critical < warning) {
		return { warning: critical, critical: warning };
	}
	return { warning, critical };
};

/**
 * Resolve the thresholds for a metric, merging metric-specific overrides on top
 * of the centralized defaults. This is the extension point for future
 * persistent settings (e.g. `webServerSettings.metricsConfig`).
 */
export const getThresholdsForMetric = (
	kind: MetricKind,
	config?: Partial<Record<MetricKind, Partial<MetricThresholds>>> | null,
): MetricThresholds =>
	normalizeThresholds({
		...DEFAULT_METRIC_THRESHOLDS[kind],
		...config?.[kind],
	});

/**
 * Single source of truth for turning a percentage and thresholds into a
 * semantic status:
 *
 * - `percentage < warning`            -> normal
 * - `percentage >= warning < critical` -> warning
 * - `percentage >= critical`          -> critical
 *
 * Invalid (non-finite) percentages are treated as `normal` so missing data
 * never raises a false alarm. Values above 100 correctly report `critical`.
 */
export const getMetricStatus = (
	percentage: unknown,
	thresholds: Partial<MetricThresholds> = DEFAULT_THRESHOLDS,
): MetricStatus => {
	const parsed =
		typeof percentage === "number"
			? percentage
			: Number.parseFloat(String(percentage ?? ""));
	if (!Number.isFinite(parsed)) {
		return "normal";
	}
	const { warning, critical } = normalizeThresholds(thresholds);
	if (parsed >= critical) {
		return "critical";
	}
	if (parsed >= warning) {
		return "warning";
	}
	return "normal";
};

/**
 * Build a normalized capacity metric. When `percentage` is omitted it is
 * derived from `used`/`total` (used for memory and disk); CPU passes its own
 * percentage and leaves `total` at `0`.
 */
export const createMetricUsage = ({
	used,
	total = 0,
	percentage,
	kind = "cpu",
	thresholds,
}: {
	used: unknown;
	total?: unknown;
	percentage?: number;
	kind?: MetricKind;
	thresholds?: Partial<MetricThresholds> | null;
}): MetricUsage => {
	const resolvedUsed = toFiniteNumber(used);
	const resolvedTotal = toFiniteNumber(total);
	const resolvedPercentage =
		percentage === undefined
			? getUsagePercentage(resolvedUsed, resolvedTotal)
			: clampPercentage(percentage);
	const resolvedThresholds =
		thresholds ?? getThresholdsForMetric(kind);
	return {
		used: resolvedUsed,
		total: resolvedTotal,
		percentage: resolvedPercentage,
		status: getMetricStatus(resolvedPercentage, resolvedThresholds),
	};
};
