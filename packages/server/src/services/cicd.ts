import { db } from "@notploy/server/db";
import {
	type apiCreateCicdDeployment,
	applications,
	cicdDeployments,
	deployments,
	domains,
	environments,
	projects,
} from "@notploy/server/db/schema";
import type { CicdProvider } from "@notploy/server/lib/cicd-scope";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, or, sql } from "drizzle-orm";
import type { z } from "zod";
import { getNotployUrl } from "./admin";

/**
 * CI/CD API services.
 *
 * The point of this module is that a CI client never has to know how Notploy
 * stores projects: it sends names (or ids) plus the CI metadata and gets back a
 * deployment it can poll and link to. Everything touching the `cicd_deployment`
 * table lives here so the dashboard and the public API cannot drift apart.
 */

/**
 * GitHub deployment states, as accepted by the GitHub Deployments API. Kept
 * server-side so a client never has to guess the mapping.
 */
export const CICD_GITHUB_STATUSES = [
	"queued",
	"in_progress",
	"success",
	"failure",
	"error",
	"inactive",
] as const;

export type CicdGithubStatus = (typeof CICD_GITHUB_STATUSES)[number];

/**
 * Maps a Notploy deployment state onto a GitHub deployment state.
 *
 * - `done` → `success`: the container is up.
 * - `error` → `failure`: the build or the container startup failed. Notploy has
 *   a single error state, so a request rejected by the API is reported by the
 *   client itself (no deployment is created) and never reaches this mapping.
 * - `cancelled` → `inactive`: the workflow was cancelled and the deployment was
 *   stopped, which GitHub models as a deployment that is no longer current.
 * - `running` → `in_progress`.
 */
export const toGithubDeploymentStatus = (
	status: "running" | "done" | "error" | "cancelled" | null | undefined,
): CicdGithubStatus => {
	switch (status) {
		case "done":
			return "success";
		case "error":
			return "failure";
		case "cancelled":
			return "inactive";
		default:
			return "in_progress";
	}
};

/**
 * Reported for a deployment that exists but has not been picked up by a worker
 * yet. Distinct from `toGithubDeploymentStatus` because a Notploy deployment row
 * says `running` from the moment it is created.
 */
export const QUEUED_GITHUB_STATUS: CicdGithubStatus = "queued";

export interface CicdTarget {
	projectId: string;
	projectName: string;
	environmentId: string;
	environmentName: string;
	applicationId: string;
	applicationName: string;
	appName: string;
	applicationStatus: string | null;
	sourceType: string;
	branch: string | null;
	/** `owner/repository` of the application, when it is deployed from Git. */
	repository: string | null;
	serverId: string | null;
	/** Deep link to the application page in the Notploy dashboard. */
	dashboardUrl: string;
	/** Public URL of the application, when it has a domain. */
	environmentUrl: string | null;
}

export const buildApplicationDashboardUrl = async (input: {
	projectId: string;
	environmentId: string;
	applicationId: string;
}) => {
	const base = await getNotployUrl();
	return `${base}/dashboard/project/${input.projectId}/environment/${input.environmentId}/services/application/${input.applicationId}`;
};

/**
 * Public URL of an application, from its first enabled domain.
 *
 * Published as `environment_url` on the CI deployment status so the deployment
 * history links straight to the running application.
 */
const environmentUrlFromDomains = (
	applicationDomains: Array<{ host: string; https: boolean; enabled: boolean }>,
): string | null => {
	const domain = applicationDomains.find((entry) => entry.enabled);
	if (!domain) return null;
	return `${domain.https ? "https" : "http"}://${domain.host}`;
};

const matchesNameOrId = (input: string, row: { name: string; environmentId?: string }) =>
	input === row.name ||
	input.toLowerCase() === row.name.toLowerCase() ||
	(row.environmentId !== undefined && input === row.environmentId);

/**
 * Resolves the project / environment / application a CI request targets.
 *
 * Accepts ids or the names shown in the dashboard in any combination, and always
 * constrains the lookup to the caller's organization. That organization check
 * (plus the token scope checked by the caller) is what prevents a CI/CD token
 * limited to one project from reaching another project's services.
 */
export const resolveCicdTarget = async (input: {
	organizationId: string;
	projectId: string;
	project?: string;
	environment?: string;
	application: string;
}): Promise<CicdTarget> => {
	const project = await db.query.projects.findFirst({
		where: eq(projects.projectId, input.projectId),
		columns: { projectId: true, name: true, organizationId: true },
	});

	if (!project) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "The project this token is scoped to does not exist",
		});
	}

	if (project.organizationId !== input.organizationId) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "This token cannot access the requested project",
		});
	}

	if (input.project && !matchesNameOrId(input.project, project)) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: `Project "${input.project}" not found in this organization`,
		});
	}

	// The environment is optional: an application belongs to exactly one, so
	// omitting it means "wherever the application lives".
	let requestedEnvironmentId: string | undefined;
	if (input.environment) {
		const environment = await db.query.environments.findFirst({
			where: and(
				eq(environments.projectId, project.projectId),
				or(
					eq(environments.environmentId, input.environment),
					eq(sql`lower(${environments.name})`, input.environment.toLowerCase()),
				),
			),
			columns: { environmentId: true, name: true, projectId: true },
		});
		if (!environment) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: `Environment "${input.environment}" not found in project "${project.name}"`,
			});
		}
		requestedEnvironmentId = environment.environmentId;
	}

	const application = await findApplicationInProject({
		projectId: project.projectId,
		application: input.application,
		environmentId: requestedEnvironmentId,
	});

	if (!application) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: `Application "${input.application}" not found in project "${project.name}"`,
		});
	}

	const environment = await db.query.environments.findFirst({
		where: eq(environments.environmentId, application.environmentId),
		columns: { environmentId: true, name: true },
	});

	if (!environment) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "The environment of this application no longer exists",
		});
	}

	const applicationDomains = await db.query.domains.findMany({
		where: eq(domains.applicationId, application.applicationId),
		columns: { host: true, https: true, enabled: true },
	});

	return {
		projectId: project.projectId,
		projectName: project.name,
		environmentId: environment.environmentId,
		environmentName: environment.name,
		applicationId: application.applicationId,
		applicationName: application.name,
		appName: application.appName,
		applicationStatus: application.applicationStatus,
		sourceType: application.sourceType,
		branch: application.branch,
		repository:
			application.repository && application.owner
				? `${application.owner}/${application.repository}`
				: application.repository,
		serverId: application.serverId,
		dashboardUrl: await buildApplicationDashboardUrl({
			projectId: project.projectId,
			environmentId: environment.environmentId,
			applicationId: application.applicationId,
		}),
		environmentUrl: environmentUrlFromDomains(applicationDomains),
	};
};

/**
 * Finds an application by id, `appName` or (case-insensitive) name inside a
 * project, optionally restricted to one environment.
 */
const findApplicationInProject = async (input: {
	projectId: string;
	application: string;
	environmentId?: string;
}) => {
	const needle = input.application.toLowerCase();

	const rows = await db
		.select({
			applicationId: applications.applicationId,
			name: applications.name,
			appName: applications.appName,
			applicationStatus: applications.applicationStatus,
			sourceType: applications.sourceType,
			branch: applications.branch,
			repository: applications.repository,
			owner: applications.owner,
			serverId: applications.serverId,
			environmentId: applications.environmentId,
		})
		.from(applications)
		.innerJoin(
			environments,
			eq(applications.environmentId, environments.environmentId),
		)
		.where(
			and(
				eq(environments.projectId, input.projectId),
				input.environmentId
					? eq(environments.environmentId, input.environmentId)
					: undefined,
				or(
					eq(applications.applicationId, input.application),
					eq(applications.appName, input.application),
					eq(sql`lower(${applications.name})`, needle),
				),
			),
		)
		.limit(2);

	// Ambiguous names are rejected instead of picked arbitrarily: a CI token
	// pointed at the wrong application would deploy the wrong thing.
	if (rows.length > 1) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Application "${input.application}" is ambiguous in this project, use its id or appName instead`,
		});
	}

	return rows[0];
};

/**
 * Creates the `cicd_deployment` row that ties a Notploy deployment to the CI run
 * that requested it.
 *
 * Idempotent on `(provider, externalId)`: a retried request returns the existing
 * row with `created: false` instead of a second deployment, so re-running a
 * workflow cannot spawn uncontrolled duplicate deployments.
 */
export const createCicdDeployment = async (
	metadata: z.infer<typeof apiCreateCicdDeployment>,
): Promise<{ record: typeof cicdDeployments.$inferSelect; created: boolean }> => {
	const provider = (metadata.provider ?? "github") as CicdProvider;

	const existing = await findCicdDeploymentByExternalId(
		provider,
		metadata.externalId,
	);
	if (existing) {
		return { record: existing, created: false };
	}

	try {
		const [record] = await db
			.insert(cicdDeployments)
			.values({ ...metadata, provider })
			.returning();
		return { record: record as typeof cicdDeployments.$inferSelect, created: true };
	} catch (error) {
		// Two retries racing on the same idempotency key: the loser reports the
		// winner's deployment instead of failing the workflow.
		const raced = await findCicdDeploymentByExternalId(
			provider,
			metadata.externalId,
		);
		if (raced) {
			return { record: raced, created: false };
		}
		throw error;
	}
};

export const findCicdDeploymentByExternalId = async (
	provider: CicdProvider,
	externalId: string,
) =>
	(await db.query.cicdDeployments.findFirst({
		where: and(
			eq(cicdDeployments.provider, provider),
			eq(cicdDeployments.externalId, externalId),
		),
	})) ?? undefined;

export const findCicdDeploymentByDeploymentId = async (deploymentId: string) =>
	(await db.query.cicdDeployments.findFirst({
		where: eq(cicdDeployments.deploymentId, deploymentId),
	})) ?? undefined;

export const findCicdDeploymentsByProject = async (
	projectId: string,
	limit = 25,
) =>
	db.query.cicdDeployments.findMany({
		where: eq(cicdDeployments.projectId, projectId),
		orderBy: desc(cicdDeployments.createdAt),
		limit,
		with: {
			deployment: {
				columns: {
					deploymentId: true,
					status: true,
					title: true,
					createdAt: true,
					startedAt: true,
					finishedAt: true,
					errorMessage: true,
					applicationId: true,
				},
				with: {
					application: { columns: { name: true } },
				},
			},
		},
	});

/**
 * Everything a CI client needs to report on a deployment: the Notploy state, the
 * GitHub state to publish, and the links between both systems.
 */
export const getCicdDeploymentView = async (deploymentId: string) => {
	const deployment = await db.query.deployments.findFirst({
		where: eq(deployments.deploymentId, deploymentId),
		columns: {
			deploymentId: true,
			status: true,
			title: true,
			description: true,
			errorMessage: true,
			createdAt: true,
			startedAt: true,
			finishedAt: true,
			logPath: true,
			applicationId: true,
		},
		with: {
			cicdDeployment: true,
			application: {
				columns: { name: true, applicationStatus: true },
				with: {
					domains: { columns: { host: true, https: true, enabled: true } },
					environment: {
						columns: { environmentId: true, name: true, projectId: true },
						with: { project: { columns: { projectId: true, name: true } } },
					},
				},
			},
		},
	});

	if (!deployment) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Deployment not found",
		});
	}

	const cicd = deployment.cicdDeployment ?? null;
	const project = deployment.application?.environment.project;
	const environment = deployment.application?.environment;

	// A Notploy deployment row says `running` from the moment it is created, so
	// "queued" is detected by the application not having been moved to `running`
	// yet: that is the first thing every worker does with a deployment job.
	const queued =
		deployment.status === "running" &&
		deployment.application?.applicationStatus !== "running";

	return {
		deploymentId: deployment.deploymentId,
		status: deployment.status ?? "running",
		githubStatus: queued
			? QUEUED_GITHUB_STATUS
			: toGithubDeploymentStatus(deployment.status),
		queued,
		title: deployment.title,
		description: deployment.description,
		errorMessage: deployment.errorMessage,
		createdAt: deployment.createdAt,
		startedAt: deployment.startedAt,
		finishedAt: deployment.finishedAt,
		logsAvailable: !!deployment.logPath,
		applicationId: deployment.applicationId,
		projectId: project?.projectId ?? cicd?.projectId ?? null,
		environmentId: environment?.environmentId ?? cicd?.environmentId ?? null,
		projectName: project?.name ?? null,
		environmentName: environment?.name ?? null,
		applicationName: deployment.application?.name ?? null,
		deploymentUrl:
			project && environment && deployment.applicationId
				? await buildApplicationDashboardUrl({
						projectId: project.projectId,
						environmentId: environment.environmentId,
						applicationId: deployment.applicationId,
					})
				: null,
		environmentUrl:
			cicd?.environmentUrl ??
			environmentUrlFromDomains(deployment.application?.domains ?? []),
		cicd: cicd
			? {
					provider: cicd.provider,
					repository: cicd.repository,
					commitSha: cicd.commitSha,
					ref: cicd.ref,
					workflow: cicd.workflow,
					workflowRunId: cicd.workflowRunId,
					workflowRunUrl: cicd.workflowRunUrl,
					runNumber: cicd.runNumber,
					actor: cicd.actor,
					externalDeploymentId: cicd.externalDeploymentId,
					externalId: cicd.externalId,
				}
			: null,
	};
};
