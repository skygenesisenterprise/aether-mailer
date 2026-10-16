import { getRedis } from "./redis";

/**
 * Fixed-window rate limiter.
 *
 * Redis is used when it is configured so the budget is shared by every app
 * instance; without Redis the limiter falls back to an in-process window, which
 * is enough for a single-container install (the deployment shape the public
 * ingest endpoint targets) and degrades to "best effort" rather than "no limit"
 * on multi-instance installs.
 *
 * A fixed window is deliberate: the ingest endpoint only needs to stop abusive
 * floods, and a counter with a TTL costs one Redis round-trip per batch.
 */

export interface RateLimitOptions {
	/** Allowed consumptions per window. */
	limit: number;
	windowSeconds: number;
}

export interface RateLimitResult {
	allowed: boolean;
	limit: number;
	remaining: number;
	/** Seconds to wait before retrying, `0` when the request was allowed. */
	retryAfterSeconds: number;
}

export interface RateLimiter {
	consume(key: string, options: RateLimitOptions): Promise<RateLimitResult>;
}

interface MemoryWindow {
	count: number;
	resetAt: number;
}

/** Hard cap on tracked keys so an attacker cannot grow the fallback unbounded. */
const MAX_MEMORY_KEYS = 10_000;

export const createRateLimiter = (options: {
	/** Prefix isolating this limiter's counters. */
	namespace: string;
	now?: () => number;
}): RateLimiter => {
	const now = options.now ?? (() => Date.now());
	const windows = new Map<string, MemoryWindow>();
	const redisKey = (key: string) =>
		`notploy:ratelimit:${options.namespace}:${key}`;

	const pruneExpired = (): void => {
		const current = now();
		for (const [key, window] of windows) {
			if (window.resetAt <= current) {
				windows.delete(key);
			}
		}
	};

	const consumeInMemory = (
		key: string,
		{ limit, windowSeconds }: RateLimitOptions,
	): RateLimitResult => {
		const current = now();
		const existing = windows.get(key);
		const window =
			existing && existing.resetAt > current
				? existing
				: { count: 0, resetAt: current + windowSeconds * 1000 };

		if (windows.size >= MAX_MEMORY_KEYS && !windows.has(key)) {
			pruneExpired();
		}

		window.count += 1;
		windows.set(key, window);

		const allowed = window.count <= limit;
		return {
			allowed,
			limit,
			remaining: Math.max(0, limit - window.count),
			retryAfterSeconds: allowed
				? 0
				: Math.max(1, Math.ceil((window.resetAt - current) / 1000)),
		};
	};

	return {
		async consume(key, { limit, windowSeconds }) {
			const redis = getRedis();
			if (!redis) {
				return consumeInMemory(key, { limit, windowSeconds });
			}
			try {
				const redisKeyValue = redisKey(key);
				const results = await redis
					.multi()
					.incr(redisKeyValue)
					.expire(redisKeyValue, windowSeconds, "NX")
					.exec();
				const count = Number(results?.[0]?.[1] ?? 1);
				const ttl = await redis.ttl(redisKeyValue);
				const allowed = count <= limit;
				return {
					allowed,
					limit,
					remaining: Math.max(0, limit - count),
					retryAfterSeconds: allowed ? 0 : Math.max(1, ttl),
				};
			} catch (error) {
				console.error(`[rate-limit] redis failure: ${String(error)}`);
				// A Redis outage must not take the site's analytics endpoint down,
				// nor open it wide: fall back to the local window.
				return consumeInMemory(key, { limit, windowSeconds });
			}
		},
	};
};

/** Shared limiter for the public audience ingest endpoint. */
export const audienceIngestRateLimiter = createRateLimiter({
	namespace: "traffic-ingest",
});

/** Default budget for one identified site: 240 batches per minute. */
export const AUDIENCE_INGEST_LIMIT = 240;
export const AUDIENCE_INGEST_WINDOW_SECONDS = 60;

/**
 * Budget for one visitor address, applied on top of the per-site budget so a
 * single abusive client cannot exhaust the site's quota.
 */
export const AUDIENCE_INGEST_PER_CLIENT_LIMIT = 60;
