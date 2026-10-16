// @ts-nocheck — plain browser script served as a static asset. It is deliberately
// written for evergreen browsers only (defer + fetch/sendBeacon), and it is not
// part of the TypeScript build: tsconfig includes `*.js` with `checkJs`.
/**
 * Notploy Traffic Manager — web instrumentation.
 *
 * First-party, dependency-free and deliberately small. Include it on a watched
 * property with its public key:
 *
 *   <script defer src="https://<notploy-host>/traffic.js"
 *           data-property-key="pk_..." data-endpoint="https://<notploy-host>"></script>
 *
 * What it sends: the current path, the referrer host, an event name when one is
 * tracked, and two random identifiers kept in the browser (session in
 * sessionStorage, visitor in localStorage). What it never sends: no cookie, no
 * IP-completing information, no user agent, no fingerprint (no canvas/WebGL
 * probes, no font probing), and no arbitrary event properties.
 *
 * Sessions: a session ends after 30 minutes without activity.
 * Visitors: the visitor identifier is reset after 180 days.
 * Opt-out: `navigator.doNotTrack === "1"`, `window.globalPrivacyControl`, or
 * `localStorage.notploy_traffic_optout = "1"` disables everything.
 *
 * Public API: `window.notployTraffic.track("event_name")` and
 * `window.notployTraffic.pageview()`.
 */
(() => {
	if (window.notployTraffic?.version) {
		return;
	}

	let script = document.currentScript;
	if (!script) {
		const scripts = document.getElementsByTagName("script");
		for (let index = scripts.length - 1; index >= 0; index--) {
			const candidate = scripts[index];
			if (candidate?.src?.includes("traffic.js")) {
				script = candidate;
				break;
			}
		}
	}
	if (!script) {
		return;
	}

	const propertyKey =
		script.getAttribute("data-property-key") ?? script.getAttribute("data-key");
	if (!propertyKey) {
		return;
	}

	let endpoint = (script.getAttribute("data-endpoint") ?? "").replace(/\/+$/, "");
	if (!endpoint) {
		try {
			endpoint = new URL(script.src).origin;
		} catch {
			return;
		}
	}

	const respectDnt = script.getAttribute("data-respect-dnt") !== "false";
	let sampleRate = Number.parseFloat(script.getAttribute("data-sample-rate") ?? "1");
	if (!(sampleRate > 0) || sampleRate > 1) {
		sampleRate = 1;
	}

	let optedOut = false;
	try {
		optedOut = window.localStorage.getItem("notploy_traffic_optout") === "1";
	} catch {
		// Storage denied (private mode, cookie policy): stay quiet rather than
		// degrade into a stateless ping for every page view.
		optedOut = true;
	}
	if (optedOut) {
		return;
	}
	if (
		(respectDnt && (navigator.doNotTrack === "1" || window.doNotTrack === "1")) ||
		window.globalPrivacyControl === true
	) {
		return;
	}
	if (sampleRate < 1 && Math.random() > sampleRate) {
		return;
	}

	const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
	const VISITOR_TTL_MS = 180 * 24 * 60 * 60 * 1000;
	const MAX_QUEUE = 20;
	const ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

	const randomId = (length) => {
		let output = "";
		if (window.crypto?.getRandomValues) {
			const bytes = new Uint8Array(length);
			window.crypto.getRandomValues(bytes);
			for (let index = 0; index < length; index++) {
				output += ID_ALPHABET[bytes[index] % ID_ALPHABET.length];
			}
			return output;
		}
		for (let index = 0; index < length; index++) {
			output += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)];
		}
		return output;
	};

	const readJson = (key, storage) => {
		try {
			const raw = storage.getItem(key);
			return raw ? JSON.parse(raw) : null;
		} catch {
			return null;
		}
	};

	const writeJson = (key, storage, value) => {
		try {
			storage.setItem(key, JSON.stringify(value));
		} catch {
			// Storage full or denied: the identifier lives for this page only.
		}
	};

	const sessionId = () => {
		const now = Date.now();
		const stored = readJson("notploy_traffic_session", window.sessionStorage);
		if (
			stored &&
			typeof stored.id === "string" &&
			typeof stored.at === "number" &&
			now - stored.at < SESSION_TIMEOUT_MS
		) {
			writeJson("notploy_traffic_session", window.sessionStorage, {
				id: stored.id,
				at: now,
			});
			return stored.id;
		}
		const created = { id: randomId(24), at: now };
		writeJson("notploy_traffic_session", window.sessionStorage, created);
		return created.id;
	};

	const visitorId = () => {
		const now = Date.now();
		const stored = readJson("notploy_traffic_visitor", window.localStorage);
		if (
			stored &&
			typeof stored.id === "string" &&
			typeof stored.at === "number" &&
			now - stored.at < VISITOR_TTL_MS
		) {
			return stored.id;
		}
		const created = { id: randomId(24), at: now };
		writeJson("notploy_traffic_visitor", window.localStorage, created);
		return created.id;
	};

	// The referrer is reduced to its host here, before it leaves the browser: the
	// full URL (which may contain private paths or query strings) never reaches
	// the collector.
	const referrerHost = () => {
		const referrer = document.referrer || "";
		if (!referrer) {
			return "";
		}
		try {
			const host = new URL(referrer).host;
			return host === window.location.host ? "" : host;
		} catch {
			return "";
		}
	};

	let queue = [];
	let flushTimer = null;

	const flush = () => {
		if (!queue.length) {
			return;
		}
		const batch = queue.slice(0, MAX_QUEUE);
		const payload = JSON.stringify({ publicKey: propertyKey, events: batch });
		if (navigator.sendBeacon) {
			try {
				const sent = navigator.sendBeacon(
					`${endpoint}/api/traffic/events`,
					new Blob([payload], { type: "application/json" }),
				);
				if (sent) {
					queue = queue.slice(batch.length);
					return;
				}
			} catch {
				// Fall through to `fetch`, which keeps the request alive on unload.
			}
		}
		try {
			fetch(`${endpoint}/api/traffic/events`, {
				method: "POST",
				body: payload,
				headers: { "content-type": "application/json" },
				keepalive: true,
				credentials: "omit",
				mode: "cors",
			}).catch(() => {});
			queue = queue.slice(batch.length);
		} catch {
			// Keep the queue: the next flush retries it.
		}
	};

	const enqueue = (event) => {
		queue.push(event);
		if (queue.length >= MAX_QUEUE) {
			flush();
			return;
		}
		if (!flushTimer) {
			flushTimer = window.setTimeout(() => {
				flushTimer = null;
				flush();
			}, 5000);
		}
	};

	const track = (name, options) => {
		if (!name) {
			return;
		}
		const isPageview = name === "pageview";
		enqueue({
			type: isPageview ? "pageview" : "event",
			name: isPageview ? undefined : String(name).slice(0, 64).toLowerCase(),
			path: isPageview
				? (options?.path ?? window.location.pathname)
				: undefined,
			referrer: referrerHost(),
			sessionId: sessionId(),
			visitorId: visitorId(),
			timestamp: new Date().toISOString(),
		});
	};

	const pageview = () => {
		track("pageview");
	};

	// Single-page applications: every route change is a page view. Both
	// navigation APIs are patched and `popstate` covers the back button, so the
	// collector sees the same journey whatever navigation API the site uses.
	const patchHistory = () => {
		for (const method of ["pushState", "replaceState"]) {
			const original = window.history[method];
			if (typeof original !== "function" || original.__notployPatched) {
				continue;
			}
			const patched = (...args) => {
				const result = original.apply(window.history, args);
				pageview();
				return result;
			};
			patched.__notployPatched = true;
			window.history[method] = patched;
		}
		window.addEventListener("popstate", pageview);
	};

	window.notployTraffic = {
		version: "1.0.0",
		track,
		pageview,
		flush,
	};

	patchHistory();
	pageview();
	window.addEventListener("pagehide", flush);
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "hidden") {
			flush();
		}
	});
})();
