import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	jsonb,
	pgEnum,
	pgTable,
	text,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
	ADDITIONAL_FLAG_ERROR,
	ADDITIONAL_FLAG_REGEX,
} from "../validations/destination";
import { organization } from "./account";

/**
 * Every object-storage provider Notploy can talk to.
 *
 * Notploy speaks S3, so a "provider" is above all a preset (endpoint, region,
 * path-style, TLS expectations) over the same protocol. Managed object-storage
 * services and self-hosted S3-compatible stores sit behind a single adapter,
 * which is what lets a bucket be attached to backups or, later, to an
 * application without either caring which vendor is behind it.
 */
export const objectStorageProviderTypes = [
	// Managed / external object storage
	"aws",
	"cloudflare-r2",
	"scaleway",
	"wasabi",
	"digitalocean",
	"backblaze",
	"ovh",
	"linode",
	"storj",
	"idrive",
	// Self-hosted / user-operated S3-compatible storage
	"minio",
	"rustfs",
	"ceph",
	"seaweedfs",
	"garage",
	// Generic escape hatch for any other S3-compatible endpoint
	"s3-compatible",
	// First-party: storage Notploy manages itself, with no external dependency
	"notploy-internal",
] as const;

export type ObjectStorageProviderType =
	(typeof objectStorageProviderTypes)[number];

export const objectStorageProviderType = pgEnum(
	"ObjectStorageProviderType",
	objectStorageProviderTypes,
);

export const objectStorageCategories = [
	"external",
	"self-hosted",
	"internal",
] as const;
export type ObjectStorageCategory = (typeof objectStorageCategories)[number];

export const objectStorageCategory = pgEnum(
	"ObjectStorageCategory",
	objectStorageCategories,
);

/**
 * Connection config shared by every provider. S3-compatible providers need an
 * endpoint and credentials; the first-party internal provider only needs a
 * storage root. Credentials are routed through `mask`/`merge` helpers so they
 * can be moved to a referenced secret store without touching callers.
 */
export const objectStorageConfigSchema = z.object({
	endpoint: z.string().trim().default(""),
	region: z.string().trim().default(""),
	accessKeyId: z.string().trim().default(""),
	secretAccessKey: z.string().trim().default(""),
	pathStyle: z.boolean().default(true),
	allowInsecureTls: z.boolean().default(false),
	additionalFlags: z
		.array(z.string().regex(ADDITIONAL_FLAG_REGEX, ADDITIONAL_FLAG_ERROR))
		.default([]),
	/** Internal provider only: Notploy-managed directory backing the buckets. */
	rootPath: z.string().trim().optional(),
});

export type ObjectStorageConfig = z.infer<typeof objectStorageConfigSchema>;

export interface ObjectStorageLifecycleRule {
	prefix?: string;
	expireDays?: number;
}

/**
 * A configured connection to an object-storage endpoint. Providers are
 * org-scoped resources: a bucket references one, and credentials never leave
 * the server unmasked.
 */
export const objectStorageProvider = pgTable(
	"object_storage_provider",
	{
		objectStorageProviderId: text("objectStorageProviderId")
			.notNull()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		name: text("name").notNull(),
		providerType: objectStorageProviderType("providerType").notNull(),
		category: objectStorageCategory("category").notNull(),
		config: jsonb("config").$type<ObjectStorageConfig>().notNull(),
		organizationId: text("organizationId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		createdAt: text("createdAt")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
	},
	(table) => [
		uniqueIndex("object_storage_provider_org_name_idx").on(
			table.organizationId,
			table.name,
		),
	],
);

/**
 * A bucket exposed by a provider. This is the resource backups (and later
 * applications) consume: they reference a bucket, not the raw S3 connection.
 */
export const objectStorageBucket = pgTable(
	"object_storage_bucket",
	{
		objectStorageBucketId: text("objectStorageBucketId")
			.notNull()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		objectStorageProviderId: text("objectStorageProviderId")
			.notNull()
			.references(() => objectStorageProvider.objectStorageProviderId, {
				onDelete: "cascade",
			}),
		name: text("name").notNull(),
		bucket: text("bucket").notNull(),
		region: text("region").notNull().default(""),
		endpoint: text("endpoint").notNull().default(""),
		versioning: boolean("versioning").notNull().default(false),
		lifecycle: jsonb("lifecycle")
			.$type<ObjectStorageLifecycleRule[]>()
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
		uniqueIndex("object_storage_bucket_provider_name_idx").on(
			table.objectStorageProviderId,
			table.bucket,
		),
		index("object_storage_bucket_org_idx").on(table.organizationId),
	],
);

export const objectStorageProviderRelations = relations(
	objectStorageProvider,
	({ many }) => ({
		buckets: many(objectStorageBucket),
	}),
);

export const objectStorageBucketRelations = relations(
	objectStorageBucket,
	({ one }) => ({
		provider: one(objectStorageProvider, {
			fields: [objectStorageBucket.objectStorageProviderId],
			references: [objectStorageProvider.objectStorageProviderId],
		}),
	}),
);

const objectStorageNameSchema = z
	.string()
	.min(1)
	.max(64)
	.regex(
		/^[a-zA-Z0-9_.-]+$/,
		"Name can only contain letters, numbers, dots, dashes and underscores",
	);

/**
 * S3-compatible providers have to carry an endpoint and credentials; the
 * first-party internal provider deliberately has neither.
 */
const requireS3Connection = (
	value: {
		providerType: ObjectStorageProviderType;
		config: ObjectStorageConfig;
	},
	ctx: z.RefinementCtx,
) => {
	if (value.providerType === "notploy-internal") {
		return;
	}
	if (!value.config.endpoint) {
		ctx.addIssue({
			code: "custom",
			path: ["config", "endpoint"],
			message: "Endpoint is required",
		});
	}
	if (!value.config.accessKeyId) {
		ctx.addIssue({
			code: "custom",
			path: ["config", "accessKeyId"],
			message: "Access Key ID is required",
		});
	}
	if (!value.config.secretAccessKey) {
		ctx.addIssue({
			code: "custom",
			path: ["config", "secretAccessKey"],
			message: "Secret Access Key is required",
		});
	}
};

const objectStorageProviderFields = {
	name: objectStorageNameSchema,
	providerType: z.enum(objectStorageProviderTypes),
	category: z.enum(objectStorageCategories),
	config: objectStorageConfigSchema,
	serverId: z.string().optional(),
};

export const apiCreateObjectStorageProvider = z
	.object(objectStorageProviderFields)
	.superRefine(requireS3Connection);

export const apiUpdateObjectStorageProvider = z
	.object({
		...objectStorageProviderFields,
		objectStorageProviderId: z.string().min(1),
	})
	.superRefine(requireS3Connection);

export const apiFindOneObjectStorageProvider = z.object({
	objectStorageProviderId: z.string().min(1),
});

export const apiRemoveObjectStorageProvider = z.object({
	objectStorageProviderId: z.string().min(1),
});

export const apiTestObjectStorageProvider = z.object({
	objectStorageProviderId: z.string().min(1).optional(),
	providerType: z.enum(objectStorageProviderTypes).optional(),
	category: z.enum(objectStorageCategories).optional(),
	config: objectStorageConfigSchema.optional(),
	bucket: z.string().min(1).optional(),
	serverId: z.string().optional(),
});

const createBucketSchema = createInsertSchema(objectStorageBucket);

export const apiCreateObjectStorageBucket = createBucketSchema.pick({}).extend({
	name: objectStorageNameSchema,
	objectStorageProviderId: z.string().min(1),
	bucket: z.string().min(1, { message: "Bucket name is required" }),
	region: z.string().default(""),
	endpoint: z.string().default(""),
	versioning: z.boolean().default(false),
	lifecycle: z
		.array(
			z.object({
				prefix: z.string().optional(),
				expireDays: z.number().int().positive().optional(),
			}),
		)
		.default([]),
});

export const apiUpdateObjectStorageBucket = apiCreateObjectStorageBucket.extend(
	{
		objectStorageBucketId: z.string().min(1),
	},
);

export const apiFindOneObjectStorageBucket = z.object({
	objectStorageBucketId: z.string().min(1),
});

export const apiRemoveObjectStorageBucket = z.object({
	objectStorageBucketId: z.string().min(1),
});

export const apiListObjectStorageBuckets = z.object({
	objectStorageProviderId: z.string().min(1),
});

export const apiTestObjectStorageBucket = z.object({
	objectStorageBucketId: z.string().min(1),
	serverId: z.string().optional(),
});

/**
 * Backups reference a destination row. This materializes (or reuses) the
 * destination that consumes a given Object Storage bucket, so the backup layer
 * keeps working while the Console configures storage centrally.
 */
export const apiCreateDestinationFromObjectStorageBucket = z.object({
	objectStorageBucketId: z.string().min(1),
});
