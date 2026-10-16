import { syncOrganizationCommunity } from "@notploy/server/services/community";
import { scheduleJob, scheduledJobs } from "node-schedule";

/**
 * Scheduled Community refresh.
 *
 * Community data changes slowly compared to infrastructure, so a single
 * periodic sync is enough: it keeps the cache fresh without hammering the GitHub
 * API. The same service backs the manual "Sync now" action, and both are
 * idempotent (the sync re-reads and re-writes the projection), so a manual run
 * and a scheduled run can never produce a divergent state.
 */

export const COMMUNITY_SYNC_JOB_NAME = "community-sync";

const DEFAULT_SYNC_CRON = "*/30 * * * *";

export const getCommunitySyncCron = (): string =>
	process.env.COMMUNITY_SYNC_CRON?.trim() || DEFAULT_SYNC_CRON;

export interface CommunityJobsStatus {
	sync: { enabled: boolean; cronExpression: string };
}

export const startCommunitySync = async (options?: {
	cron?: string;
}): Promise<CommunityJobsStatus> => {
	const cron = options?.cron?.trim() || getCommunitySyncCron();

	const existing = scheduledJobs[COMMUNITY_SYNC_JOB_NAME];
	if (existing) {
		existing.cancel();
	}

	scheduleJob(COMMUNITY_SYNC_JOB_NAME, cron, async () => {
		try {
			const reports = await syncOrganizationCommunity();
			const failed = reports.filter((report) => report.error);
			console.log(
				`[community] sync: ${reports.length} sources, ${failed.length} failed`,
			);
			for (const report of failed) {
				console.error(
					`[community] source ${report.sourceId}: ${report.error ?? "unknown error"}`,
				);
			}
		} catch (error) {
			console.error(`[community] sync failed: ${String(error)}`);
		}
	});

	return { sync: { enabled: true, cronExpression: cron } };
};

export const stopCommunitySync = (): void => {
	scheduledJobs[COMMUNITY_SYNC_JOB_NAME]?.cancel();
};

export const getCommunitySyncStatus = (): CommunityJobsStatus => ({
	sync: {
		enabled: !!scheduledJobs[COMMUNITY_SYNC_JOB_NAME],
		cronExpression: getCommunitySyncCron(),
	},
});
