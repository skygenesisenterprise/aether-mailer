import { relations } from "drizzle-orm";
import { boolean, pgEnum, pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { nanoid } from "nanoid";
import { z } from "zod";
import { organization } from "./account";
import { applications } from "./application";
import { encryptedText } from "./utils";
import { vaultSecret } from "./vault-provider";

/**
 * Container Registry.
 *
 * A registry is any endpoint that serves OCI artifacts, so the record is
 * provider-agnostic: `providerType` only supplies defaults (endpoint shape,
 * authentication transport, extra capabilities) and `registryUrl` is the OCI
 * endpoint itself. Credentials are either an inline fallback or, preferably, a
 * reference into the Secrets Manager so a registry record never has to hold a
 * raw secret.
 *
 * `registryType` predates the OCI redesign and is kept for compatibility; new
 * behaviour is derived from `providerType`.
 */
export const registryType = pgEnum("RegistryType", ["selfHosted", "cloud"]);

/**
 * Provider values. Declared once and reused by the Drizzle enum and the API
 * schemas; the catalogue itself (labels, endpoints, capabilities) lives in
 * `utils/registry/providers` so the database stays presentation-free.
 */
const registryProviderTypeValues = [
	"docker-hub",
	"ghcr",
	"gitlab",
	"ecr",
	"gar",
	"acr",
	"quay",
	"artifactory",
	"harbor",
	"zot",
	"distribution",
	"nexus",
	"generic-oci",
] as const;

export const registryProviderType = pgEnum(
	"RegistryProviderType",
	registryProviderTypeValues,
);

export const registryAuthMethod = pgEnum("RegistryAuthMethod", [
	"none",
	"basic",
	"token",
]);

export const registryCredentialSource = pgEnum("RegistryCredentialSource", [
	"secret",
	"inline",
]);

export const registry = pgTable("registry", {
	registryId: text("registryId")
		.notNull()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	registryName: text("registryName").notNull(),
	/** Which provider this registry is modelled on. Defaults to the generic path. */
	providerType: registryProviderType("providerType")
		.notNull()
		.default("generic-oci"),
	/** OCI endpoint, hostname[:port] or absolute URL. */
	registryUrl: text("registryUrl").notNull().default(""),
	/** Project / organization / repository prefix inside the registry. */
	namespace: text("namespace"),
	imagePrefix: text("imagePrefix"),
	authMethod: registryAuthMethod("authMethod").notNull().default("basic"),
	credentialSource: registryCredentialSource("credentialSource")
		.notNull()
		.default("inline"),
	/** Secret reference resolved through the Secrets Manager. */
	vaultSecretId: text("vaultSecretId").references(
		() => vaultSecret.vaultSecretId,
		{ onDelete: "set null" },
	),
	/** Inline fallback, used when `credentialSource` is `inline`. */
	username: text("username"),
	/** Encrypted at rest; legacy plaintext values are read as-is. */
	password: encryptedText("password"),
	/** Anonymous pulls are legitimate for public registries. */
	allowAnonymous: boolean("allowAnonymous").notNull().default(false),
	createdAt: text("createdAt")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	registryType: registryType("selfHosted").notNull().default("cloud"),
	organizationId: text("organizationId")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
});

export const registryRelations = relations(registry, ({ many }) => ({
	applications: many(applications, {
		relationName: "applicationRegistry",
	}),
	buildApplications: many(applications, {
		relationName: "applicationBuildRegistry",
	}),
	rollbackApplications: many(applications, {
		relationName: "applicationRollbackRegistry",
	}),
}));

// Registry usernames should NOT be lowercased.
// Some registries (e.g. AWS ECR) require a specific case: the username must be
// exactly "AWS" (uppercase) for ECR authentication. Docker Hub usernames are
// case-insensitive for login, so preserving case is safe for all providers.
const registryUsernameSchema = z.string().trim().min(1);

// Registry URLs must be hostname[:port] only — no shell metacharacters.
// An absolute http(s) URL is accepted so private/local endpoints can opt into
// plain HTTP explicitly. Empty string means "provider default endpoint".
const registryUrlSchema = z
	.string()
	.refine(
		(val) =>
			val === "" ||
			/^https?:\/\/[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?(:\d{1,5})?(\/.*)?$/.test(
				val,
			) ||
			/^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?(:\d{1,5})?$/.test(val),
		"Registry endpoint must be a hostname, hostname:port or an http(s) URL (e.g. registry.example.com, localhost:5000, https://harbor.internal)",
	);

const namespaceSchema = z
	.string()
	.trim()
	.max(255)
	.regex(
		/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/,
		"Namespace can only contain letters, numbers, dots, dashes, underscores and slashes",
	);

const createSchema = createInsertSchema(registry, {
	registryName: z.string().min(1),
	providerType: z.enum(registryProviderTypeValues),
	username: registryUsernameSchema.nullable().optional(),
	password: z.string().min(1).nullable().optional(),
	registryUrl: registryUrlSchema,
	namespace: namespaceSchema.nullable().optional(),
	organizationId: z.string().min(1),
	registryId: z.string().min(1),
	registryType: z.enum(["cloud", "selfHosted"]),
	imagePrefix: z.string().nullable().optional(),
});

/**
 * Registry credential rules.
 *
 * A secrets reference and inline credentials are mutually exclusive; an
 * anonymous registry needs neither. Enforced here so the Console, the API and
 * the CLI all reject the same inputs.
 */
interface RegistryCredentialInput {
	credentialSource?: "secret" | "inline" | null;
	vaultSecretId?: string | null;
	username?: string | null;
	authMethod?: "none" | "basic" | "token" | null;
	allowAnonymous?: boolean | null;
}

const withRegistryCredentialRules = <T extends z.ZodTypeAny>(schema: T) =>
	schema.superRefine((value: unknown, ctx) => {
		const input = value as RegistryCredentialInput;
		const anonymous =
			input.authMethod === "none" || input.allowAnonymous === true;
		if (anonymous) return;

		if (input.credentialSource === "secret") {
			if (!input.vaultSecretId) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["vaultSecretId"],
					message: "Select a secret from the Secrets Manager",
				});
			}
			return;
		}

		if (!input.username?.trim()) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["username"],
				message: "Username is required",
			});
		}
	});

export const apiCreateRegistry = withRegistryCredentialRules(
	createSchema.pick({}).extend({
		registryName: z.string().min(1),
		// A caller that does not name a provider still gets a working registry:
		// every OCI-compatible endpoint is served through the generic path.
		providerType: z.enum(registryProviderTypeValues).default("generic-oci"),
		username: registryUsernameSchema.nullable().optional(),
		password: z.string().min(1).nullable().optional(),
		registryUrl: registryUrlSchema,
		namespace: namespaceSchema.nullable().optional(),
		imagePrefix: z.string().nullable().optional(),
		authMethod: z.enum(["none", "basic", "token"]).default("basic"),
		credentialSource: z.enum(["secret", "inline"]).default("inline"),
		vaultSecretId: z.string().min(1).nullable().optional(),
		allowAnonymous: z.boolean().default(false),
		registryType: z.enum(["cloud", "selfHosted"]).default("cloud"),
	}),
).extend({
	serverId: z.string().optional(),
});

/** Test a registry before it is saved: only the connection inputs are needed. */
export const apiTestRegistry = withRegistryCredentialRules(
	createSchema.pick({}).extend({
		registryName: z.string().optional(),
		providerType: z.enum(registryProviderTypeValues).default("generic-oci"),
		username: registryUsernameSchema.nullable().optional(),
		password: z.string().min(1).nullable().optional(),
		registryUrl: registryUrlSchema,
		namespace: namespaceSchema.nullable().optional(),
		authMethod: z.enum(["none", "basic", "token"]).default("basic"),
		credentialSource: z.enum(["secret", "inline"]).default("inline"),
		vaultSecretId: z.string().min(1).nullable().optional(),
		allowAnonymous: z.boolean().default(false),
	}),
).extend({
	serverId: z.string().optional(),
});

export const apiTestRegistryById = createSchema
	.pick({ registryId: true })
	.extend({
		serverId: z.string().optional(),
	});

/**
 * Tests a connection that may not exist yet.
 *
 * Every connection field is optional and falls back to the stored registry when
 * `registryId` is given, so a form that keeps credentials server-side can still
 * re-test what it is editing.
 */
export const apiTestRegistryConnection = z.object({
	registryId: z.string().min(1).optional(),
	providerType: z.enum(registryProviderTypeValues).optional(),
	registryUrl: registryUrlSchema.optional(),
	namespace: namespaceSchema.nullable().optional(),
	authMethod: z.enum(["none", "basic", "token"]).optional(),
	credentialSource: z.enum(["secret", "inline"]).optional(),
	vaultSecretId: z.string().min(1).nullable().optional(),
	username: registryUsernameSchema.nullable().optional(),
	// Left empty by the form when the stored password should be reused.
	password: z.string().nullable().optional(),
	allowAnonymous: z.boolean().optional(),
});

export const apiRemoveRegistry = createSchema
	.pick({ registryId: true })
	.required();

export const apiFindOneRegistry = z.object({
	registryId: z.string().min(1),
});

export const apiUpdateRegistry = withRegistryCredentialRules(
	createSchema.partial().extend({
		registryId: z.string().min(1),
		username: registryUsernameSchema.nullable().optional(),
		// Omitted or empty keeps the stored value, so edits never reveal it.
		password: z.string().nullable().optional(),
		registryUrl: registryUrlSchema.optional(),
		namespace: namespaceSchema.nullable().optional(),
		authMethod: z.enum(["none", "basic", "token"]).optional(),
		credentialSource: z.enum(["secret", "inline"]).optional(),
		vaultSecretId: z.string().min(1).nullable().optional(),
		allowAnonymous: z.boolean().optional(),
	}),
).extend({
	serverId: z.string().optional(),
});

/** Repository / tag / manifest operations performed against a registry. */
export const apiRegistryRepository = z.object({
	registryId: z.string().min(1),
	repository: z.string().min(1).max(255),
});

export const apiRegistryTag = z.object({
	registryId: z.string().min(1),
	repository: z.string().min(1).max(255),
	tag: z.string().min(1).max(255),
});

/**
 * A reference inside a repository: a tag, or a `sha256:` digest when immutability
 * matters — a deployment may pin either one.
 */
export const apiRegistryReference = z.object({
	registryId: z.string().min(1),
	repository: z.string().min(1).max(255),
	reference: z.string().min(1).max(255),
});

/** Removes the artifact a digest resolves to, as the OCI API requires. */
export const apiRegistryDeleteImage = z.object({
	registryId: z.string().min(1),
	repository: z.string().min(1).max(255),
	digest: z
		.string()
		.min(1)
		.max(255)
		.regex(/^sha256:[a-f0-9]{64}$/, "Expected a sha256 digest"),
});

export const apiEnableSelfHostedRegistry = createSchema
	.pick({
		registryUrl: true,
		username: true,
		password: true,
	})
	.required();
