import { relations } from "drizzle-orm";
import {
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { nanoid } from "nanoid";
import { z } from "zod";
import { cicdActionSchema, cicdProviders } from "../../lib/cicd-scope";
import { organization } from "./account";
import { applications } from "./application";
import { deployments } from "./deployment";
import { environments } from "./environment";
import { projects } from "./project";

/**
 * External systems allowed to drive a deployment.
 *
 * The CI/CD API is provider agnostic on purpose: only the metadata carried on
 * `cicdDeployments` and the deep links built from it differ per provider, so a
 * new one is a value here rather than a new code path.
 *
 * The list is shared with the token scope parser so a provider cannot be
 * accepted by a token and then rejected by the database enum (or worse, the
 * reverse).
 */
export const CICD_PROVIDERS = cicdProviders;

export const cicdProvider = pgEnum("cicdProvider", CICD_PROVIDERS);

/** Zod mirror of the `cicdProvider` enum. */
export const cicdProviderSchema = z.enum(CICD_PROVIDERS);

/**
 * External deployment metadata for a Notploy deployment.
 *
 * A row exists only when the deployment was requested through the CI/CD API
 * (see `packages/server/src/services/cicd.ts`), which is what lets the dashboard
 * and the API link a Notploy deployment back to the GitHub Actions run that
 * created it, and the workflow back to the deployment.
 *
 * `externalId` is the idempotency key. CI clients retry requests (a workflow
 * re-run, a flaky connection) and the unique index on
 * `(provider, externalId)` turns the second attempt into the first deployment
 * instead of a duplicate build.
 */
export const cicdDeployments = pgTable(
	"cicd_deployment",
	{
		cicdDeploymentId: text("cicdDeploymentId")
			.notNull()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		deploymentId: text("deploymentId")
			.notNull()
			.references(() => deployments.deploymentId, { onDelete: "cascade" }),
		organizationId: text("organizationId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		projectId: text("projectId").references(() => projects.projectId, {
			onDelete: "set null",
		}),
		environmentId: text("environmentId").references(
			() => environments.environmentId,
			{ onDelete: "set null" },
		),
		applicationId: text("applicationId").references(
			() => applications.applicationId,
			{ onDelete: "set null" },
		),
		provider: cicdProvider("provider").notNull().default("github"),
		/** `owner/repository` in the provider's own namespace. */
		repository: text("repository").notNull(),
		commitSha: text("commitSha").notNull(),
		/** Full ref the commit was built from, e.g. `refs/heads/main`. */
		ref: text("ref"),
		/** Workflow file name and workflow name as reported by the CI. */
		workflow: text("workflow"),
		workflowRunId: text("workflowRunId"),
		workflowRunUrl: text("workflowRunUrl"),
		runNumber: integer("runNumber"),
		/** Identity that requested the deployment (GitHub login, runner, ...). */
		actor: text("actor"),
		/** Deployment record created in the CI provider, when the client has one. */
		externalDeploymentId: text("externalDeploymentId"),
		/** Idempotency key, unique per provider. */
		externalId: text("externalId").notNull(),
		/** Deployed application URL, copied to the CI status when available. */
		environmentUrl: text("environmentUrl"),
		createdAt: text("createdAt")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
	},
	(t) => ({
		deploymentIdx: uniqueIndex("cicd_deployment_deploymentId_unique").on(
			t.deploymentId,
		),
		externalIdIdx: uniqueIndex("cicd_deployment_provider_externalId_unique").on(
			t.provider,
			t.externalId,
		),
		projectIdx: index("cicd_deployment_projectId_idx").on(t.projectId),
		orgIdx: index("cicd_deployment_organizationId_idx").on(t.organizationId),
	}),
);

export const cicdDeploymentsRelations = relations(
	cicdDeployments,
	({ one }) => ({
		deployment: one(deployments, {
			fields: [cicdDeployments.deploymentId],
			references: [deployments.deploymentId],
		}),
		project: one(projects, {
			fields: [cicdDeployments.projectId],
			references: [projects.projectId],
		}),
		environment: one(environments, {
			fields: [cicdDeployments.environmentId],
			references: [environments.environmentId],
		}),
		application: one(applications, {
			fields: [cicdDeployments.applicationId],
			references: [applications.applicationId],
		}),
	}),
);

export type CicdDeployment = typeof cicdDeployments.$inferSelect;
export type NewCicdDeployment = typeof cicdDeployments.$inferInsert;

/**
 * GitHub commit SHA (40 or 64 hex chars) or any other provider revision.
 *
 * Only the shape is enforced here; the clone step is what actually proves the
 * revision exists in the repository.
 */
export const cicdCommitShaRegex = /^[0-9a-fA-F]{7,64}$/;

const insertSchema = createInsertSchema(cicdDeployments, {
	repository: z.string().min(1),
	commitSha: z.string().min(1),
	externalId: z.string().min(1),
});

export const apiCreateCicdDeployment = insertSchema
	.pick({
		provider: true,
		repository: true,
		commitSha: true,
		ref: true,
		workflow: true,
		workflowRunId: true,
		workflowRunUrl: true,
		runNumber: true,
		actor: true,
		externalDeploymentId: true,
		externalId: true,
		environmentUrl: true,
		projectId: true,
		environmentId: true,
		applicationId: true,
	})
	.extend({
		deploymentId: z.string().min(1),
		organizationId: z.string().min(1),
provider: cicdProviderSchema.optional(),
		repository: z.string().min(1),
		commitSha: z.string().min(1),
		externalId: z.string().min(1),
		ref: z.string().min(1).optional(),
		workflowRunId: z.string().min(1).optional(),
	});

/**
 * Metadata a CI client reports about itself.
 *
 * Kept as a nested object so the action can send whatever GitHub exposes
 * (`github.repository`, `github.run_id`, ...) in a single field, and so the
 * shape stays stable when another provider reports its own keys.
 */
export const cicdSourceMetadata = z.object({
	provider: cicdProviderSchema.default("github"),
	repository: z.string().trim().min(3).max(300),
	commitSha: z.string().trim().regex(cicdCommitShaRegex, "Invalid commit sha"),
	ref: z.string().trim().max(300).optional(),
	workflow: z.string().trim().max(300).optional(),
	runId: z.string().trim().max(100).optional(),
	runUrl: z.string().trim().url().max(500).optional(),
	runNumber: z.number().int().min(0).optional(),
	actor: z.string().trim().max(300).optional(),
	/** Deployment created in the CI provider, for cross-linking. */
	deploymentId: z.string().trim().max(100).optional(),
});

export const apiCicdResolve = z.object({
	project: z.string().trim().min(1).max(200).optional(),
	environment: z.string().trim().min(1).max(200).optional(),
	application: z.string().trim().min(1).max(200),
});

export const apiCicdDeploy = apiCicdResolve
	.extend({
		title: z.string().trim().max(200).optional(),
		description: z.string().trim().max(2000).optional(),
		source: cicdSourceMetadata,
		/**
		 * Idempotency key. Two requests with the same key for the same
		 * application return the same deployment instead of building twice.
		 */
		idempotencyKey: z.string().trim().max(300).optional(),
	})
	.superRefine((value, ctx) => {
		if (!value.source.ref && !value.source.commitSha) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["source", "ref"],
				message: "A commit sha or a ref is required to deploy",
			});
		}
	});

export const apiCicdDeploymentId = z.object({
	deploymentId: z.string().min(1),
});

export const apiCicdDeploymentLogs = apiCicdDeploymentId.extend({
	tail: z.coerce.number().int().min(1).max(5000).default(500),
});

export const apiCicdList = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const apiCreateCicdToken = z.object({
	name: z.string().trim().min(1).max(32),
	projectId: z.string().min(1),
	actions: z.array(cicdActionSchema).min(1),
	environmentIds: z.array(z.string().min(1)).optional(),
	applicationIds: z.array(z.string().min(1)).optional(),
	provider: cicdProviderSchema.optional(),
	repository: z.string().trim().min(3).max(300).optional(),
	/** Token lifetime in seconds; omitted means no expiry. */
	expiresIn: z.number().int().positive().optional(),
});

