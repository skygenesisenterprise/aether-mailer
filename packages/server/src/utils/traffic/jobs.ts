import {
	ingestTraefikAccessLog,
	runTrafficRetention,
} from "@notploy/server/services/traffic";
import { scheduledJobs, scheduleJob } from "node-schedule";

/**
 * Scheduled Traffic Manager jobs.
 *
 * Two jobs, both idempotent:
 *
 * - **collection** reads whatever the reverse proxy appended since the last run
 *   (the cursor is stored on each source, so a missed run is caught up rather
 *   than lost) and folds it into the aggregates;
 * - **retention** drops the aggregates older than the configured windows.
 *
 * They are registered from the server bootstrap next to the other cron jobs, and
 * the dashboard can trigger the collection manually ("Collect now") through the
 * same service — a manual run and a scheduled run never conflict, because both
 * respect the same cursor and write inside a transaction.
 */

export const TRAFFIC_COLLECTOR_JOB_NAME = "traffic-traefik-collector";
export const TRAFFIC_RETENTION_JOB_NAME = "traffic-retention";

const DEFAULT_COLLECTOR_CRON = "*/5 * * * *";
const DEFAULT_RETENTION_CRON = "20 3 * * *";

export interface TrafficJobsOptions {
	/** Overrides `TRAFFIC_COLLECTOR_CRON`. */
	collectorCron?: string;
	/** Overrides `TRAFFIC_RETENTION_CRON`. */
	retentionCron?: string;
	/** Skip the retention job (used by tests and the manual run). */
	scheduleRetention?: boolean;
}

export interface TrafficJobsStatus {
	collector: { enabled: boolean; cronExpression: string };
	retention: { enabled: boolean; cronExpression: string };
}

export const getTrafficCollectorCron = (): string =>
	process.env.TRAFFIC_COLLECTOR_CRON?.trim() || DEFAULT_COLLECTOR_CRON;

export const getTrafficRetentionCron = (): string =>
	process.env.TRAFFIC_RETENTION_CRON?.trim() || DEFAULT_RETENTION_CRON;

/** Register (or replace) the scheduled jobs. Returns the effective schedule. */
export const startTrafficCollector = async (
	options: TrafficJobsOptions = {},
): Promise<TrafficJobsStatus> => {
	const collectorCron =
		options.collectorCron?.trim() || getTrafficCollectorCron();
	const retentionCron =
		options.retentionCron?.trim() || getTrafficRetentionCron();

	const existingCollector = scheduledJobs[TRAFFIC_COLLECTOR_JOB_NAME];
	if (existingCollector) {
		existingCollector.cancel();
	}
	scheduleJob(TRAFFIC_COLLECTOR_JOB_NAME, collectorCron, async () => {
		try {
			const report = await ingestTraefikAccessLog();
			if (report.eventsAccepted > 0 || report.sources.some((s) => s.error)) {
				console.log(
					`[traffic] collector: ${report.eventsAccepted} events over ${report.propertiesTouched} properties, ${report.sources.length} sources`,
				);
			}
		} catch (error) {
			console.error(`[traffic] collector failed: ${String(error)}`);
		}
	});

	const scheduleRetention = options.scheduleRetention ?? true;
	const existingRetention = scheduledJobs[TRAFFIC_RETENTION_JOB_NAME];
	if (existingRetention) {
		existingRetention.cancel();
	}
	if (scheduleRetention) {
		scheduleJob(TRAFFIC_RETENTION_JOB_NAME, retentionCron, async () => {
			try {
				const report = await runTrafficRetention();
				console.log(
					`[traffic] retention: ${report.httpAggregates} HTTP buckets, ${report.audienceAggregates} audience buckets removed`,
				);
			} catch (error) {
				console.error(`[traffic] retention failed: ${String(error)}`);
			}
		});
	}

	return {
		collector: { enabled: true, cronExpression: collectorCron },
		retention: {
			enabled: scheduleRetention,
			cronExpression: retentionCron,
		},
	};
};

export const stopTrafficCollector = (): void => {
	scheduledJobs[TRAFFIC_COLLECTOR_JOB_NAME]?.cancel();
	scheduledJobs[TRAFFIC_RETENTION_JOB_NAME]?.cancel();
};

export const getTrafficCollectorStatus = (): TrafficJobsStatus => ({
	collector: {
		enabled: !!scheduledJobs[TRAFFIC_COLLECTOR_JOB_NAME],
		cronExpression: getTrafficCollectorCron(),
	},
	retention: {
		enabled: !!scheduledJobs[TRAFFIC_RETENTION_JOB_NAME],
		cronExpression: getTrafficRetentionCron(),
	},
});
