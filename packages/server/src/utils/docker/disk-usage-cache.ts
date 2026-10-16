/**
 * Small time-to-live cache with in-flight request coalescing.
 *
 * `docker system df` is relatively expensive: it walks images, containers,
 * volumes and the build cache and can take seconds on a busy host. The
 * monitoring page only needs a coarse, periodically refreshed view, so we
 * cache the result briefly and, crucially, deduplicate concurrent callers so
 * that several widgets asking for the same key at the same time share a single
 * underlying command instead of spawning one each.
 *
 * The cache is process-local and intentionally dependency-free. `now` can be
 * injected for deterministic tests.
 */
export interface TtlCacheOptions {
	/** How long a resolved value stays fresh, in milliseconds. */
	ttlMs: number;
	/** Clock source, defaults to `Date.now`. */
	now?: () => number;
}

interface Entry<T> {
	value: T;
	expiresAt: number;
}

export interface TtlCache<T> {
	/**
	 * Return a cached value when fresh, otherwise run `loader`. Concurrent calls
	 * for the same key share one loader promise.
	 */
	get(key: string, loader: () => Promise<T>): Promise<T>;
	/** Drop a single key, or the whole cache when no key is given. */
	invalidate(key?: string): void;
	/** Whether a fresh value is currently cached for the key. */
	has(key: string): boolean;
}

export const createTtlCache = <T>({
	ttlMs,
	now = Date.now,
}: TtlCacheOptions): TtlCache<T> => {
	const entries = new Map<string, Entry<T>>();
	const inFlight = new Map<string, Promise<T>>();

	return {
		has(key) {
			const entry = entries.get(key);
			return !!entry && entry.expiresAt > now();
		},
		get(key, loader) {
			const entry = entries.get(key);
			if (entry && entry.expiresAt > now()) {
				return Promise.resolve(entry.value);
			}

			const pending = inFlight.get(key);
			if (pending) {
				return pending;
			}

			const request = loader()
				.then((value) => {
					entries.set(key, { value, expiresAt: now() + ttlMs });
					return value;
				})
				.finally(() => {
					// Always release the slot so a failed load can be retried.
					inFlight.delete(key);
				});

			inFlight.set(key, request);
			return request;
		},
		invalidate(key) {
			if (key === undefined) {
				entries.clear();
				return;
			}
			entries.delete(key);
		},
	};
};
