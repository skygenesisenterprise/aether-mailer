import { relations } from "drizzle-orm";
import { boolean, pgEnum, pgTable, text } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { z } from "zod";
import { gitProviderTypes } from "../../utils/providers/types";
import { organization } from "./account";
import { bitbucket } from "./bitbucket";
import { gitea } from "./gitea";
import { github } from "./github";
import { gitlab } from "./gitlab";
import { user } from "./user";

/**
 * Provider types a connection can be made with.
 *
 * The list lives in the provider contract (`utils/providers/types`) and is only
 * borrowed here, so the database enum and the adapter registry can never drift:
 * a provider the enum does not know cannot be connected, and a provider the
 * registry does not know cannot be reached through the generic procedures.
 */
export const gitProviderType = pgEnum("gitProviderType", gitProviderTypes);

export const gitProvider = pgTable("git_provider", {
	gitProviderId: text("gitProviderId")
		.notNull()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	name: text("name").notNull(),
	providerType: gitProviderType("providerType").notNull().default("github"),
	createdAt: text("createdAt")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	organizationId: text("organizationId")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	sharedWithOrganization: boolean("sharedWithOrganization")
		.notNull()
		.default(false),
});

export const gitProviderRelations = relations(gitProvider, ({ one }) => ({
	github: one(github, {
		fields: [gitProvider.gitProviderId],
		references: [github.gitProviderId],
	}),
	gitlab: one(gitlab, {
		fields: [gitProvider.gitProviderId],
		references: [gitlab.gitProviderId],
	}),
	bitbucket: one(bitbucket, {
		fields: [gitProvider.gitProviderId],
		references: [bitbucket.gitProviderId],
	}),
	gitea: one(gitea, {
		fields: [gitProvider.gitProviderId],
		references: [gitea.gitProviderId],
	}),
	organization: one(organization, {
		fields: [gitProvider.organizationId],
		references: [organization.id],
	}),
	user: one(user, {
		fields: [gitProvider.userId],
		references: [user.id],
	}),
}));

export const apiRemoveGitProvider = z.object({
	gitProviderId: z.string().min(1),
});

export const apiToggleShareGitProvider = z.object({
	gitProviderId: z.string().min(1),
	sharedWithOrganization: z.boolean(),
});

export const apiFindOneGitProvider = z.object({
	gitProviderId: z.string().min(1),
});

/**
 * Repository reference accepted by the provider contract.
 *
 * `fullName` is the form shown in the UI (`owner/name`); providers that address
 * sub-resources by numeric id also accept `id`.
 */
export const apiGitProviderRepositoryRef = z.object({
	fullName: z.string().trim().min(1).optional(),
	owner: z.string().trim().min(1).optional(),
	name: z.string().trim().min(1).optional(),
	id: z.string().trim().min(1).optional(),
});

export const apiListGitProviderRepositories = z.object({
	gitProviderId: z.string().min(1),
	limit: z.coerce.number().int().min(1).max(500).optional(),
});

export const apiSearchGitProviderRepositories = apiListGitProviderRepositories
	.extend({
		q: z.string().trim().min(1),
	});

export const apiListGitProviderBranches = z.object({
	gitProviderId: z.string().min(1),
	repository: apiGitProviderRepositoryRef,
});

export const apiGetGitProviderCommit = apiListGitProviderBranches.extend({
	ref: z.string().trim().min(1),
});
