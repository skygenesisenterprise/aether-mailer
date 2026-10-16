import { jsonb, pgEnum, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { nanoid } from "nanoid";
import { z } from "zod";
import { organization } from "./account";
import { encryptedText } from "./utils";

export const vaultProviderType = pgEnum("VaultProviderType", [
	"hashicorp",
	"infisical",
	"aws",
	"aws-parameter-store",
	"doppler",
	"azure",
	"scaleway",
	"phase",
	"gcp",
	"oci",
	"onepassword",
	"vaultwarden",
	"kubernetes",
	"docker",
	"generic",
]);

export const hashicorpVaultConfigSchema = z.object({
	providerType: z.literal("hashicorp"),
	url: z.string().url(),
	token: z.string().min(1),
	namespace: z.string().optional(),
	mount: z.string().min(1).default("secret"),
});

export const infisicalVaultConfigSchema = z.object({
	providerType: z.literal("infisical"),
	siteUrl: z.string().url().default("https://app.infisical.com"),
	clientId: z.string().min(1),
	clientSecret: z.string().min(1),
	projectId: z.string().min(1),
	environmentSlug: z.string().min(1),
	secretPath: z.string().default("/"),
});

export const awsVaultConfigSchema = z.object({
	providerType: z.literal("aws"),
	region: z.string().min(1),
	accessKeyId: z.string().min(1),
	secretAccessKey: z.string().min(1),
	endpoint: z.string().url().optional(),
});

export const awsParameterStoreVaultConfigSchema = z.object({
	providerType: z.literal("aws-parameter-store"),
	region: z.string().min(1),
	accessKeyId: z.string().min(1),
	secretAccessKey: z.string().min(1),
	endpoint: z.string().url().optional(),
	parameterPath: z
		.string()
		.trim()
		.refine((path) => path === "" || path.startsWith("/"), {
			message: "Parameter discovery path must start with /",
		})
		.optional(),
});

export const dopplerVaultConfigSchema = z.object({
	providerType: z.literal("doppler"),
	serviceToken: z.string().min(1),
	project: z.string().optional(),
	config: z.string().optional(),
});

export const azureVaultConfigSchema = z.object({
	providerType: z.literal("azure"),
	vaultUri: z.string().url(),
	tenantId: z.string().min(1),
	clientId: z.string().min(1),
	clientSecret: z.string().min(1),
});

export const scalewayVaultConfigSchema = z.object({
	providerType: z.literal("scaleway"),
	region: z.string().min(1).default("fr-par"),
	projectId: z.string().min(1),
	secretKey: z.string().min(1),
	apiUrl: z.string().url().default("https://api.scaleway.com"),
});

export const phaseVaultConfigSchema = z.object({
	providerType: z.literal("phase"),
	token: z.string().min(1),
	appId: z.string().min(1),
	env: z.string().min(1),
	path: z.string().default("/"),
	apiUrl: z.string().url().default("https://api.phase.dev"),
});

export const gcpVaultConfigSchema = z.object({
	providerType: z.literal("gcp"),
	projectId: z.string().min(1),
	clientEmail: z.string().min(1),
	privateKey: z.string().min(1),
});

export const ociVaultConfigSchema = z.object({
	providerType: z.literal("oci"),
	region: z.string().min(1),
	tenancyId: z.string().min(1),
	userId: z.string().min(1),
	fingerprint: z.string().min(1),
	privateKey: z.string().min(1),
	compartmentId: z.string().min(1),
});

export const onepasswordVaultConfigSchema = z.object({
	providerType: z.literal("onepassword"),
	connectUrl: z.string().url(),
	token: z.string().min(1),
});

export const vaultwardenVaultConfigSchema = z.object({
	providerType: z.literal("vaultwarden"),
	identityUrl: z.string().url().default("https://identity.bitwarden.com"),
	apiUrl: z.string().url().default("https://api.bitwarden.com"),
	clientId: z.string().min(1),
	clientSecret: z.string().min(1),
	organizationId: z.string().min(1),
});

export const kubernetesVaultConfigSchema = z.object({
	providerType: z.literal("kubernetes"),
	apiUrl: z.string().url(),
	token: z.string().min(1),
	namespace: z.string().min(1).default("default"),
});

export const dockerVaultConfigSchema = z.object({
	providerType: z.literal("docker"),
	mountPath: z.string().min(1).default("/run/secrets"),
});

export const genericVaultConfigSchema = z.object({
	providerType: z.literal("generic"),
	baseUrl: z.string().url(),
	token: z.string().optional(),
});

export const vaultProviderConfigSchema = z.discriminatedUnion("providerType", [
	hashicorpVaultConfigSchema,
	infisicalVaultConfigSchema,
	awsVaultConfigSchema,
	awsParameterStoreVaultConfigSchema,
	dopplerVaultConfigSchema,
	azureVaultConfigSchema,
	scalewayVaultConfigSchema,
	phaseVaultConfigSchema,
	gcpVaultConfigSchema,
	ociVaultConfigSchema,
	onepasswordVaultConfigSchema,
	vaultwardenVaultConfigSchema,
	kubernetesVaultConfigSchema,
	dockerVaultConfigSchema,
	genericVaultConfigSchema,
]);

export type VaultProviderConfig = z.infer<typeof vaultProviderConfigSchema>;

export const vaultProviderAssignmentSchema = z.object({
	projectId: z.string().min(1),
	environmentIds: z.array(z.string().min(1)).default([]),
});

export type VaultProviderAssignment = z.infer<
	typeof vaultProviderAssignmentSchema
>;

export const vaultProvider = pgTable(
	"vault_provider",
	{
		vaultProviderId: text("vaultProviderId")
			.notNull()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		name: text("name").notNull(),
		providerType: vaultProviderType("providerType").notNull(),
		config: jsonb("config").$type<VaultProviderConfig>().notNull(),
		assignments: jsonb("assignments")
			.$type<VaultProviderAssignment[]>()
			.notNull()
			.default([]),
		organizationId: text("organizationId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		createdAt: text("createdAt")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
	},
	(table) => [
		uniqueIndex("vault_provider_org_name_idx").on(
			table.organizationId,
			table.name,
		),
	],
);

const vaultProviderNameSchema = z
	.string()
	.min(1)
	.max(64)
	.regex(
		/^[a-zA-Z0-9_-]+$/,
		"Name can only contain letters, numbers, dashes and underscores",
	);

const createSchema = createInsertSchema(vaultProvider);

export const apiCreateVaultProvider = createSchema.pick({}).extend({
	name: vaultProviderNameSchema,
	config: vaultProviderConfigSchema,
	assignments: z.array(vaultProviderAssignmentSchema),
});

export const apiUpdateVaultProvider = createSchema.pick({}).extend({
	vaultProviderId: z.string().min(1),
	name: vaultProviderNameSchema,
	config: vaultProviderConfigSchema,
	assignments: z.array(vaultProviderAssignmentSchema),
});

export const apiFindOneVaultProvider = z.object({
	vaultProviderId: z.string().min(1),
});

/**
 * Secrets stored and managed directly by Notploy. Values are encrypted at rest
 * (AES-256-GCM) and resolve like any other vault reference, so a provider can
 * hold both externally-managed and Notploy-managed secrets.
 */
export const vaultSecret = pgTable(
	"vault_secret",
	{
		vaultSecretId: text("vaultSecretId")
			.notNull()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		vaultProviderId: text("vaultProviderId")
			.notNull()
			.references(() => vaultProvider.vaultProviderId, {
				onDelete: "cascade",
			}),
		name: text("name").notNull(),
		value: encryptedText("value").notNull(),
		description: text("description"),
		createdAt: text("createdAt")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
		updatedAt: text("updatedAt")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
	},
	(table) => [
		uniqueIndex("vault_secret_provider_name_idx").on(
			table.vaultProviderId,
			table.name,
		),
	],
);

const vaultSecretNameSchema = z
	.string()
	.min(1)
	.max(255)
	.regex(
		/^[a-zA-Z0-9._-]+$/,
		"Name can only contain letters, numbers, dots, dashes and underscores",
	);

export const apiCreateVaultSecret = z.object({
	vaultProviderId: z.string().min(1),
	name: vaultSecretNameSchema,
	value: z.string().min(1),
	description: z.string().max(500).optional(),
});

export const apiUpdateVaultSecret = z.object({
	vaultSecretId: z.string().min(1),
	name: vaultSecretNameSchema,
	// Omitted or empty keeps the stored value, so edits never have to reveal it.
	value: z.string().optional(),
	description: z.string().max(500).optional(),
});

export const apiRemoveVaultSecret = z.object({
	vaultSecretId: z.string().min(1),
});

export const apiRemoveVaultProvider = z.object({
	vaultProviderId: z.string().min(1),
});

export const apiTestVaultProvider = z.object({
	vaultProviderId: z.string().min(1).optional(),
	config: vaultProviderConfigSchema.optional(),
});

export const apiListVaultSecretNames = z.object({
	vaultProviderId: z.string().min(1),
	projectId: z.string().min(1),
	environmentId: z.string().optional(),
});
