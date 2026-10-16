import { Redis } from "ioredis";

/**
 * Shared Redis connection for the Notploy control plane.
 *
 * Redis is optional. When `REDIS_URL` is unset (a plain self-hosted install)
 * every helper degrades to a no-op so the app keeps running on its in-process
 * fallbacks. When it is set — the root Docker Compose stack ships a `redis`
 * service — the control plane uses it for caching and queues.
 */

let client: Redis | null | undefined;

/** Whether a Redis connection is configured for this instance. */
export const isRedisEnabled = (): boolean =>
	typeof process.env.REDIS_URL === "string" && process.env.REDIS_URL.length > 0;

/**
 * Lazily create (and memoise) the shared Redis client.
 *
 * Returns `null` when `REDIS_URL` is unset, so callers can treat a missing
 * Redis as "feature disabled" rather than an error. BullMQ also uses this
 * connection, so `maxRetriesPerRequest` is disabled as BullMQ requires.
 */
export const getRedis = (): Redis | null => {
	if (client !== undefined) {
		return client;
	}

	const url = process.env.REDIS_URL;
	if (!url) {
		client = null;
		return client;
	}

	const redis = new Redis(url, {
		maxRetriesPerRequest: null,
		lazyConnect: true,
	});

	redis.on("error", (error: Error) => {
		console.error(`[redis] ${error.message}`);
	});

	redis.connect().catch((error: Error) => {
		console.error(`[redis] failed to connect: ${error.message}`);
	});

	client = redis;
	return client;
};

export const closeRedis = async (): Promise<void> => {
	if (!client) {
		return;
	}
	try {
		await client.quit();
	} finally {
		client = undefined;
	}
};
