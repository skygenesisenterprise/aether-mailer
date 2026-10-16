import { createTtlCache, type TtlCache } from "../docker/disk-usage-cache";
import { getRedis } from "./index";

export interface RedisTtlCacheOptions {
	/** Namespace used to prefix the Redis keys (keeps caches isolated). */
	namespace: string;
	/** How long a resolved value stays fresh, in milliseconds. */
	ttlMs: number;
	/** Clock source for the in-process cache, defaults to `Date.now`. */
	now?: () => number;
}

/**
 * A {@link TtlCache} backed by Redis.
 *
 * The in-process cache is always kept as a first-level cache and as a fallback
 * when Redis is not configured (or momentarily unreachable); Redis extends it
 * across processes and restarts, so an expensive value computed once — e.g.
 * `docker system df` — is shared by every app instance instead of being
 * recomputed per process.
 */
export const createRedisTtlCache = <T>({
	namespace,
	ttlMs,
	now,
}: RedisTtlCacheOptions): TtlCache<T> => {
	const local = createTtlCache<T>({ ttlMs, now });
	const redisKey = (key: string) => `notploy:cache:${namespace}:${key}`;

	return {
		has(key) {
			return local.has(key);
		},
		async get(key, loader) {
			const redis = getRedis();
			if (redis) {
				try {
					const cached = await redis.get(redisKey(key));
					if (cached !== null) {
						return JSON.parse(cached) as T;
					}
				} catch (error) {
					console.error(`[redis] cache read failed: ${String(error)}`);
				}
			}

			const value = await local.get(key, loader);

			if (redis) {
				try {
					await redis.set(redisKey(key), JSON.stringify(value), "PX", ttlMs);
				} catch (error) {
					console.error(`[redis] cache write failed: ${String(error)}`);
				}
			}

			return value;
		},
		invalidate(key) {
			local.invalidate(key);
			if (key === undefined) {
				return;
			}
			const redis = getRedis();
			if (redis) {
				redis.del(redisKey(key)).catch((error) => {
					console.error(`[redis] cache invalidate failed: ${String(error)}`);
				});
			}
		},
	};
};
