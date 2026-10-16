import { constants as fsConstants } from "node:fs";
import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import { db } from "@notploy/server/db";
import {
	type apiCreateObjectStorageProvider,
	destinations,
	type ObjectStorageCategory,
	type ObjectStorageConfig,
	type ObjectStorageProviderType,
	objectStorageBucket,
	objectStorageProvider,
} from "@notploy/server/db/schema";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { quote } from "shell-quote";
import type { z } from "zod";
import { IS_CLOUD, paths } from "../constants";
import { execAsync, execAsyncRemote } from "../utils/process/execAsync";

export type ObjectStorageProvider = typeof objectStorageProvider.$inferSelect;
export type ObjectStorageBucket = typeof objectStorageBucket.$inferSelect;

export const OBJECT_STORAGE_SECRET_MASK = "********";

export interface ObjectStorageProviderMeta {
	providerType: ObjectStorageProviderType;
	category: ObjectStorageCategory;
	label: string;
	/** Endpoint users should start from; they can always override it. */
	endpointTemplate: string;
	defaultRegion: string;
	pathStyle: boolean;
	rcloneProvider: string;
	docsUrl?: string;
}

/**
 * Presets per provider. S3 is the common denominator, so the only thing that
 * really varies is the endpoint, a few path-style/TLS expectations, and the
 * rclone provider key used for connection testing.
 */
export const OBJECT_STORAGE_PROVIDER_META: Record<
	ObjectStorageProviderType,
	ObjectStorageProviderMeta
> = {
	aws: {
		providerType: "aws",
		category: "external",
		label: "Amazon Web Services (S3)",
		endpointTemplate: "https://s3.<region>.amazonaws.com",
		defaultRegion: "us-east-1",
		pathStyle: false,
		rcloneProvider: "AWS",
		docsUrl: "https://docs.aws.amazon.com/s3/",
	},
	"cloudflare-r2": {
		providerType: "cloudflare-r2",
		category: "external",
		label: "Cloudflare R2",
		endpointTemplate: "https://<accountid>.r2.cloudflarestorage.com",
		defaultRegion: "auto",
		pathStyle: true,
		rcloneProvider: "Cloudflare",
		docsUrl: "https://developers.cloudflare.com/r2/",
	},
	scaleway: {
		providerType: "scaleway",
		category: "external",
		label: "Scaleway Object Storage",
		endpointTemplate: "https://s3.<region>.scw.cloud",
		defaultRegion: "fr-par",
		pathStyle: true,
		rcloneProvider: "Scaleway",
		docsUrl: "https://www.scaleway.com/en/docs/object-storage/",
	},
	wasabi: {
		providerType: "wasabi",
		category: "external",
		label: "Wasabi Object Storage",
		endpointTemplate: "https://s3.<region>.wasabisys.com",
		defaultRegion: "eu-central-1",
		pathStyle: true,
		rcloneProvider: "Wasabi",
		docsUrl: "https://wasabi.com/",
	},
	digitalocean: {
		providerType: "digitalocean",
		category: "external",
		label: "DigitalOcean Spaces",
		endpointTemplate: "https://<region>.digitaloceanspaces.com",
		defaultRegion: "nyc3",
		pathStyle: false,
		rcloneProvider: "DigitalOcean",
		docsUrl: "https://docs.digitalocean.com/products/spaces/",
	},
	backblaze: {
		providerType: "backblaze",
		category: "external",
		label: "Backblaze B2 (S3-compatible)",
		endpointTemplate: "https://s3.<region>.backblazeb2.com",
		defaultRegion: "us-west-004",
		pathStyle: true,
		rcloneProvider: "Backblaze",
		docsUrl: "https://www.backblaze.com/docs/cloud-storage-s3-compatible-api",
	},
	ovh: {
		providerType: "ovh",
		category: "external",
		label: "OVHcloud Object Storage",
		endpointTemplate: "https://s3.<region>.io.cloud.ovh.net",
		defaultRegion: "gra",
		pathStyle: false,
		rcloneProvider: "OVH",
		docsUrl: "https://www.ovhcloud.com/en/public-cloud/object-storage/",
	},
	linode: {
		providerType: "linode",
		category: "external",
		label: "Akamai / Linode Object Storage",
		endpointTemplate: "https://<region>.linodeobjects.com",
		defaultRegion: "eu-central-1",
		pathStyle: false,
		rcloneProvider: "Linode",
		docsUrl: "https://www.linode.com/docs/products/storage/object-storage/",
	},
	storj: {
		providerType: "storj",
		category: "external",
		label: "Storj (S3-compatible gateway)",
		endpointTemplate: "https://gateway.storjshare.io",
		defaultRegion: "",
		pathStyle: true,
		rcloneProvider: "Storj",
		docsUrl: "https://www.storj.io/",
	},
	idrive: {
		providerType: "idrive",
		category: "external",
		label: "IDrive e2",
		endpointTemplate: "https://<region>.idrivee2-<n>.com",
		defaultRegion: "",
		pathStyle: true,
		rcloneProvider: "IDrive",
		docsUrl: "https://www.idrive.com/e2/",
	},
	minio: {
		providerType: "minio",
		category: "self-hosted",
		label: "MinIO",
		endpointTemplate: "https://minio.example.com:9000",
		defaultRegion: "us-east-1",
		pathStyle: true,
		rcloneProvider: "Minio",
		docsUrl: "https://min.io/",
	},
	rustfs: {
		providerType: "rustfs",
		category: "self-hosted",
		label: "RustFS",
		endpointTemplate: "https://rustfs.example.com:9000",
		defaultRegion: "us-east-1",
		pathStyle: true,
		rcloneProvider: "Other",
		docsUrl: "https://rustfs.com/",
	},
	ceph: {
		providerType: "ceph",
		category: "self-hosted",
		label: "Ceph (RADOS Gateway)",
		endpointTemplate: "https://ceph-rgw.example.com",
		defaultRegion: "default",
		pathStyle: true,
		rcloneProvider: "Ceph",
		docsUrl: "https://docs.ceph.com/en/latest/radosgw/s3/",
	},
	seaweedfs: {
		providerType: "seaweedfs",
		category: "self-hosted",
		label: "SeaweedFS",
		endpointTemplate: "https://seaweedfs.example.com",
		defaultRegion: "",
		pathStyle: true,
		rcloneProvider: "SeaweedFS",
		docsUrl: "https://github.com/seaweedfs/seaweedfs",
	},
	garage: {
		providerType: "garage",
		category: "self-hosted",
		label: "Garage",
		endpointTemplate: "https://garage.example.com",
		defaultRegion: "garage",
		pathStyle: true,
		rcloneProvider: "Other",
		docsUrl: "https://garagehq.deuxfleurs.fr/",
	},
	"s3-compatible": {
		providerType: "s3-compatible",
		category: "external",
		label: "Any S3-compatible endpoint",
		endpointTemplate: "https://s3.example.com",
		defaultRegion: "",
		pathStyle: true,
		rcloneProvider: "Other",
	},
	"notploy-internal": {
		providerType: "notploy-internal",
		category: "internal",
		label: "Notploy Internal Storage",
		endpointTemplate: "",
		defaultRegion: "notploy",
		pathStyle: false,
		// The internal provider does not speak S3: it stores buckets as
		// directories under Notploy's own storage root.
		rcloneProvider: "local",
	},
};

export const listObjectStorageDescriptors = (): ObjectStorageProviderMeta[] =>
	Object.values(OBJECT_STORAGE_PROVIDER_META);

export const maskObjectStorageConfig = (
	config: ObjectStorageConfig,
): ObjectStorageConfig => ({
	...config,
	secretAccessKey: config.secretAccessKey
		? OBJECT_STORAGE_SECRET_MASK
		: config.secretAccessKey,
});

export const mergeObjectStorageConfig = (
	incoming: ObjectStorageConfig,
	existing: ObjectStorageConfig,
): ObjectStorageConfig => ({
	...incoming,
	secretAccessKey:
		incoming.secretAccessKey === OBJECT_STORAGE_SECRET_MASK
			? existing.secretAccessKey
			: incoming.secretAccessKey,
});

const isUniqueProviderNameViolation = (error: unknown) =>
	error instanceof Error &&
	error.message.includes("object_storage_provider_org_name_idx");

const isUniqueBucketNameViolation = (error: unknown) =>
	error instanceof Error &&
	error.message.includes("object_storage_bucket_provider_name_idx");

// ---------------------------------------------------------------------------
// Provider CRUD
// ---------------------------------------------------------------------------

export const createObjectStorageProvider = async (
	input: z.infer<typeof apiCreateObjectStorageProvider>,
	organizationId: string,
) => {
	try {
		const created = await db
			.insert(objectStorageProvider)
			.values({
				name: input.name,
				providerType: input.providerType,
				category: input.category,
				config: input.config,
				organizationId,
			})
			.returning()
			.then((value) => value[0]);

		if (!created) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Error creating the object storage provider",
			});
		}
		return created;
	} catch (error) {
		if (isUniqueProviderNameViolation(error)) {
			throw new TRPCError({
				code: "CONFLICT",
				message: `An object storage provider named "${input.name}" already exists in this organization`,
			});
		}
		throw error;
	}
};

export const findObjectStorageProviderById = async (
	objectStorageProviderId: string,
) => {
	const provider = await db.query.objectStorageProvider.findFirst({
		where: eq(
			objectStorageProvider.objectStorageProviderId,
			objectStorageProviderId,
		),
	});
	if (!provider) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Object storage provider not found",
		});
	}
	return provider;
};

export const findObjectStorageProviderInOrganization = async (
	objectStorageProviderId: string,
	organizationId: string,
) => {
	const provider = await findObjectStorageProviderById(objectStorageProviderId);
	if (provider.organizationId !== organizationId) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "You are not allowed to access this object storage provider",
		});
	}
	return provider;
};

/**
 * The organization's first-party storage provider, if it created one. Mirrors
 * `findInternalDnsProvider`: the internal provider is never created implicitly.
 */
export const findInternalObjectStorageProvider = async (
	organizationId: string,
) =>
	db.query.objectStorageProvider.findFirst({
		where: and(
			eq(objectStorageProvider.organizationId, organizationId),
			eq(objectStorageProvider.providerType, "notploy-internal"),
		),
	});

export const findObjectStorageProvidersByOrganizationId = async (
	organizationId: string,
) =>
	await db.query.objectStorageProvider.findMany({
		where: eq(objectStorageProvider.organizationId, organizationId),
		orderBy: (providers, { asc }) => [asc(providers.name)],
	});

export const updateObjectStorageProvider = async (
	objectStorageProviderId: string,
	input: Pick<
		z.infer<typeof apiCreateObjectStorageProvider>,
		"name" | "providerType" | "category" | "config"
	>,
) => {
	const existing = await findObjectStorageProviderById(objectStorageProviderId);
	const mergedConfig = mergeObjectStorageConfig(input.config, existing.config);

	try {
		const updated = await db
			.update(objectStorageProvider)
			.set({
				name: input.name,
				providerType: input.providerType,
				category: input.category,
				config: mergedConfig,
			})
			.where(
				eq(
					objectStorageProvider.objectStorageProviderId,
					objectStorageProviderId,
				),
			)
			.returning()
			.then((res) => res[0]);

		if (!updated) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Error updating the object storage provider",
			});
		}
		return updated;
	} catch (error) {
		if (isUniqueProviderNameViolation(error)) {
			throw new TRPCError({
				code: "CONFLICT",
				message: `An object storage provider named "${input.name}" already exists in this organization`,
			});
		}
		throw error;
	}
};

export const removeObjectStorageProvider = async (
	objectStorageProviderId: string,
) => {
	const removed = await db
		.delete(objectStorageProvider)
		.where(
			eq(
				objectStorageProvider.objectStorageProviderId,
				objectStorageProviderId,
			),
		)
		.returning()
		.then((res) => res[0]);

	if (!removed) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Object storage provider not found",
		});
	}
	return removed;
};

// ---------------------------------------------------------------------------
// Bucket CRUD
// ---------------------------------------------------------------------------

export const createObjectStorageBucket = async (
	input: Omit<
		typeof objectStorageBucket.$inferInsert,
		"objectStorageBucketId" | "organizationId" | "createdAt"
	>,
	organizationId: string,
) => {
	try {
		const created = await db
			.insert(objectStorageBucket)
			.values({
				...input,
				organizationId,
			})
			.returning()
			.then((value) => value[0]);

		if (!created) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Error creating the object storage bucket",
			});
		}
		return created;
	} catch (error) {
		if (isUniqueBucketNameViolation(error)) {
			throw new TRPCError({
				code: "CONFLICT",
				message: `Bucket "${input.bucket}" already exists for this provider`,
			});
		}
		throw error;
	}
};

export const findObjectStorageBucketById = async (
	objectStorageBucketId: string,
) => {
	const bucket = await db.query.objectStorageBucket.findFirst({
		where: eq(objectStorageBucket.objectStorageBucketId, objectStorageBucketId),
	});
	if (!bucket) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Object storage bucket not found",
		});
	}
	return bucket;
};

export const findObjectStorageBucketInOrganization = async (
	objectStorageBucketId: string,
	organizationId: string,
) => {
	const bucket = await findObjectStorageBucketById(objectStorageBucketId);
	if (bucket.organizationId !== organizationId) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "You are not allowed to access this object storage bucket",
		});
	}
	return bucket;
};

export const findObjectStorageBucketsByOrganizationId = async (
	organizationId: string,
	bucketId?: string,
) =>
	await db.query.objectStorageBucket.findMany({
		where: bucketId
			? and(
					eq(objectStorageBucket.organizationId, organizationId),
					eq(objectStorageBucket.objectStorageBucketId, bucketId),
				)
			: eq(objectStorageBucket.organizationId, organizationId),
		orderBy: [desc(objectStorageBucket.createdAt)],
	});

export const findObjectStorageBucketsByProviderId = async (
	objectStorageProviderId: string,
) =>
	await db.query.objectStorageBucket.findMany({
		where: eq(
			objectStorageBucket.objectStorageProviderId,
			objectStorageProviderId,
		),
		orderBy: (buckets, { asc }) => [asc(buckets.name)],
	});

export const updateObjectStorageBucket = async (
	objectStorageBucketId: string,
	data: Partial<typeof objectStorageBucket.$inferInsert>,
) => {
	const updated = await db
		.update(objectStorageBucket)
		.set(data)
		.where(eq(objectStorageBucket.objectStorageBucketId, objectStorageBucketId))
		.returning()
		.then((res) => res[0]);

	if (!updated) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Error updating the object storage bucket",
		});
	}
	return updated;
};

export const removeObjectStorageBucket = async (
	objectStorageBucketId: string,
) => {
	const removed = await db
		.delete(objectStorageBucket)
		.where(eq(objectStorageBucket.objectStorageBucketId, objectStorageBucketId))
		.returning()
		.then((res) => res[0]);

	if (!removed) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Object storage bucket not found",
		});
	}
	return removed;
};

// ---------------------------------------------------------------------------
// Connection testing / health
// ---------------------------------------------------------------------------

interface RcloneConnectionInput {
	providerType: ObjectStorageProviderType;
	config: ObjectStorageConfig;
	bucket?: string;
	serverId?: string;
}

const buildRcloneFlags = ({
	providerType,
	config,
}: Pick<RcloneConnectionInput, "providerType" | "config">) => {
	const meta = OBJECT_STORAGE_PROVIDER_META[providerType];
	const pathStyle = config.pathStyle ?? meta.pathStyle;
	const flags = [
		`--s3-provider=${quote([meta.rcloneProvider])}`,
		`--s3-access-key-id=${quote([config.accessKeyId])}`,
		`--s3-secret-access-key=${quote([config.secretAccessKey])}`,
		`--s3-endpoint=${quote([config.endpoint])}`,
		"--s3-no-check-bucket",
		"--retries 1",
		"--low-level-retries 1",
		"--timeout 10s",
		"--contimeout 5s",
	];
	if (config.region) {
		flags.splice(4, 0, `--s3-region=${quote([config.region])}`);
	}
	if (pathStyle) {
		flags.push("--s3-force-path-style");
	}
	if (config.allowInsecureTls) {
		flags.push("--no-check-certificate");
	}
	if (config.additionalFlags?.length) {
		flags.push(...config.additionalFlags);
	}
	return flags;
};

/**
 * Validates an S3-compatible connection with rclone. Passing a bucket lists its
 * objects; without one it lists buckets, which is enough to prove the
 * credentials and endpoint work.
 */
/**
 * Root directory backing the first-party internal provider. Providers may
 * override it, otherwise it lives under the Notploy config path so it survives
 * restarts and can itself be backed up.
 */
export const internalObjectStorageRoot = (rootPath?: string) =>
	rootPath?.trim() || `${paths().BASE_PATH}/object-storage`;

const sanitizeBucketPath = (bucket: string) =>
	bucket.replace(/[^a-zA-Z0-9._-]/g, "_");

const ensureInternalStorageRoot = async (rootPath?: string) => {
	const root = internalObjectStorageRoot(rootPath);
	await mkdir(root, { recursive: true });
	await access(root, fsConstants.W_OK);
	return root;
};

const ensureInternalStorageBucket = async (
	rootPath: string | undefined,
	bucket: string,
) => {
	const root = internalObjectStorageRoot(rootPath);
	await mkdir(path.join(root, sanitizeBucketPath(bucket)), { recursive: true });
};

export const testObjectStorageConnection = async ({
	providerType,
	config,
	bucket,
	serverId,
}: RcloneConnectionInput) => {
	// The internal provider is Notploy's own storage root, so a connection test
	// just proves the directory exists and is writable.
	if (providerType === "notploy-internal") {
		try {
			await ensureInternalStorageRoot(config.rootPath);
			if (bucket) {
				await ensureInternalStorageBucket(config.rootPath, bucket);
			}
		} catch (error) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message:
					error instanceof Error
						? error.message
						: "The internal storage root is not writable",
				cause: error,
			});
		}
		return;
	}

	const flags = buildRcloneFlags({ providerType, config });
	const target = bucket ? `:s3:${quote([bucket])}` : ":s3:";
	const command = `rclone lsd ${flags.join(" ")} ${target}`;

	try {
		if (IS_CLOUD) {
			if (!serverId) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Server not found",
				});
			}
			await execAsyncRemote(serverId, command);
		} else {
			await execAsync(command);
		}
	} catch (error) {
		if (error instanceof TRPCError) {
			throw error;
		}
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				error instanceof Error
					? error.message
					: "Error connecting to the object storage endpoint",
			cause: error,
		});
	}
};

export interface ObjectStorageHealth {
	status: "connected" | "degraded" | "unreachable" | "misconfigured";
	checkedAt: string;
	latencyMs: number | null;
	message?: string;
	bucketCount?: number;
}

/**
 * Probes a provider's endpoint and reports its health. Reuses the same rclone
 * call as a real backup, so "connected" means the provider is usable.
 */
export const getObjectStorageProviderHealth = async (
	provider: Pick<ObjectStorageProvider, "providerType" | "config">,
	serverId?: string,
): Promise<ObjectStorageHealth> => {
	const checkedAt = new Date().toISOString();
	const startedAt = Date.now();
	try {
		await testObjectStorageConnection({
			providerType: provider.providerType,
			config: provider.config,
			serverId,
		});
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: "The object storage endpoint is unreachable";
		return {
			status: /unauthor|forbidden|signature|401|403|invalidaccesskey/i.test(
				message,
			)
				? "misconfigured"
				: "unreachable",
			checkedAt,
			latencyMs: null,
			message,
		};
	}
	return {
		status: "connected",
		checkedAt,
		latencyMs: Date.now() - startedAt,
	};
};

/**
 * Resolves the full S3 connection behind a bucket. This is the seam backups
 * (and, later, applications) use: they reference a bucket and never touch the
 * provider's credentials directly.
 */
/**
 * How many backup destinations reference each bucket. Surfaces "usage/status"
 * in the Console without a separate metrics store.
 */
export const getObjectStorageBucketUsage = async (organizationId: string) => {
	const rows = await db
		.select({ objectStorageBucketId: destinations.objectStorageBucketId })
		.from(destinations)
		.where(eq(destinations.organizationId, organizationId));
	const usage: Record<string, number> = {};
	for (const row of rows) {
		if (row.objectStorageBucketId) {
			usage[row.objectStorageBucketId] =
				(usage[row.objectStorageBucketId] ?? 0) + 1;
		}
	}
	return usage;
};

export const resolveObjectStorageConnection = async (
	objectStorageBucketId: string,
	organizationId: string,
) => {
	const bucket = await findObjectStorageBucketInOrganization(
		objectStorageBucketId,
		organizationId,
	);
	const provider = await findObjectStorageProviderInOrganization(
		bucket.objectStorageProviderId,
		organizationId,
	);

	if (provider.providerType === "notploy-internal") {
		const root = internalObjectStorageRoot(provider.config.rootPath);
		return {
			backend: "local" as const,
			bucketId: bucket.objectStorageBucketId,
			bucket: bucket.bucket,
			rootPath: root,
			path: path.join(root, sanitizeBucketPath(bucket.bucket)),
			region: bucket.region || provider.config.region || "notploy",
			endpoint: "",
			providerType: provider.providerType,
			pathStyle: false,
			allowInsecureTls: false,
			additionalFlags: [] as string[],
			accessKey: "",
			secretAccessKey: "",
		};
	}

	return {
		backend: "s3" as const,
		bucketId: bucket.objectStorageBucketId,
		bucket: bucket.bucket,
		region: bucket.region || provider.config.region,
		endpoint: bucket.endpoint || provider.config.endpoint,
		providerType: provider.providerType,
		pathStyle: provider.config.pathStyle,
		allowInsecureTls: provider.config.allowInsecureTls,
		additionalFlags: provider.config.additionalFlags,
		accessKey: provider.config.accessKeyId,
		secretAccessKey: provider.config.secretAccessKey,
	};
};

/**
 * Materializes (or reuses) the backup destination that consumes an Object
 * Storage bucket. Backups keep storing a `destinationId`, while the Console
 * only has to configure the bucket once.
 */
export const createDestinationFromObjectStorageBucket = async (
	objectStorageBucketId: string,
	organizationId: string,
) => {
	const existing = await db.query.destinations.findFirst({
		where: and(
			eq(destinations.organizationId, organizationId),
			eq(destinations.objectStorageBucketId, objectStorageBucketId),
		),
	});
	if (existing) {
		return existing;
	}

	const connection = await resolveObjectStorageConnection(
		objectStorageBucketId,
		organizationId,
	);
	if (connection.backend !== "s3") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Internal storage buckets cannot back a backup destination yet",
		});
	}

	const created = await db
		.insert(destinations)
		.values({
			name: connection.bucket,
			provider:
				OBJECT_STORAGE_PROVIDER_META[connection.providerType].rcloneProvider,
			accessKey: connection.accessKey,
			secretAccessKey: connection.secretAccessKey,
			bucket: connection.bucket,
			region: connection.region,
			endpoint: connection.endpoint,
			additionalFlags: connection.additionalFlags,
			objectStorageBucketId,
			organizationId,
		})
		.returning()
		.then((rows) => rows[0]);

	if (!created) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Error creating the backup destination",
		});
	}
	return created;
};
