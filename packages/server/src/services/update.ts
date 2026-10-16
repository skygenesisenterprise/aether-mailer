import semver from "semver";

/**
 * Notploy update detection and availability.
 *
 * A GitHub release is *not* automatically an installable update: a release can
 * exist while the artifacts the installer needs are still being published. This
 * module separates the three concepts the rest of the app cares about:
 *
 * - the running version and the latest published version,
 * - whether the latest release is actually exploitable (its assets exist),
 * - and the resulting update status.
 *
 * The backend is the single source of truth: the frontend never talks to GitHub
 * directly, it reads the status computed here.
 */

/** Repository publishing the Notploy releases. */
export const NOTPLOY_GITHUB_REPOSITORY = "skygenesisenterprise/notploy";

/**
 * Self-hosted image published by .github/workflows/docker-publish.yml. Releases
 * are consumed from the GitHub Releases API, images from the GitHub Container
 * Registry, so no Docker Hub credential is involved anymore.
 */
export const NOTPLOY_IMAGE = `ghcr.io/${NOTPLOY_GITHUB_REPOSITORY}`;

/** Suffix docker-publish.yml appends to the self-hosted image: `v1.2.3-app` publishes `ghcr.io/skygenesisenterprise/notploy:v1.2.3-app`. */
const APP_TAG_SUFFIX = "-app";

/** Matches the self-hosted release tags only, so the other images of the publish matrix (`-cloud`, `-mcp`, ...) are ignored. */
const SELF_HOSTED_RELEASE_REGEX = /^v?(\d+)\.(\d+)\.(\d+)-app$/;

/** GitHub allows 60 anonymous requests per hour and IP, the dashboard polls this every few minutes. */
const RELEASES_CACHE_TTL_MS = 15 * 60 * 1000;
const RELEASES_REQUEST_TIMEOUT_MS = 10_000;
const RELEASES_URL = `https://api.github.com/repos/${NOTPLOY_GITHUB_REPOSITORY}/releases?per_page=100`;

/**
 * Assets an installation needs to be able to run. `docker-publish.yml` copies
 * `install.sh` to `install-notploy.sh` and publishes both; `install.sh` is the
 * canonical one the documentation points to, so it is what we require.
 */
export const REQUIRED_RELEASE_ASSETS = ["install.sh"] as const;

/**
 * Update lifecycle. `release_detected` is the transient state of a newer
 * release whose exploitability is not known yet; it resolves to either
 * `waiting_for_assets` or `ready`.
 */
export type UpdateStatus =
	| "up_to_date"
	| "release_detected"
	| "waiting_for_assets"
	| "ready"
	| "downloading"
	| "installing"
	| "completed"
	| "failed";

/** Statuses that mean a newer version exists. */
export const UPDATE_PENDING_STATUSES: UpdateStatus[] = [
	"release_detected",
	"waiting_for_assets",
	"ready",
	"downloading",
	"installing",
];

/** The only status for which the update can actually be started. */
export const UPDATE_INSTALLABLE_STATUS: UpdateStatus = "ready";

/** Backward-compatible shape consumed by the existing frontend and SDK. */
export interface IUpdateData {
	/** Release tag of the newest self-hosted release, also the container image tag (`v1.2.3-app`). */
	latestVersion: string | null;
	updateAvailable: boolean;
}

export const DEFAULT_UPDATE_DATA: IUpdateData = {
	latestVersion: null,
	updateAvailable: false,
};

/** Rich status returned by the update API. */
export interface IUpdateStatusData extends IUpdateData {
	/** Running version, normalized (`1.0.1`). */
	currentVersion: string;
	/** Latest version, normalized (`1.0.1`), when one is published. */
	latestNormalizedVersion: string | null;
	status: UpdateStatus;
	/** Whether the latest release has every asset an installation needs. */
	assetsReady: boolean;
	/** Assets that were expected but missing from the release. */
	missingAssets: string[];
	/** Human-readable GitHub release URL. */
	releaseUrl: string | null;
	publishedAt: string | null;
	checkedAt: string;
}

/** Returns current Notploy docker image tag or `latest` by default. */
export const getNotployImageTag = () => {
	return process.env.RELEASE_TAG || "latest";
};

/**
 * Normalize any version-ish string into a clean semver version (`1.0.1`).
 * GitHub tags (`v1.0.1-app`), installer names (`release-v1.0.1`) and bare
 * versions all collapse to the same value. Returns `null` when nothing
 * semver-like can be extracted.
 */
export const normalizeVersion = (version: string): string | null => {
	if (!version) return null;
	// The self-hosted image suffix (`-app`) is an artifact of the release tag,
	// not a prerelease identifier, so drop it before parsing.
	const cleaned = String(version)
		.trim()
		.replace(/-app$/i, "");
	const match = cleaned.match(/(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/);
	if (!match) return null;
	const parsed = semver.parse(match[1]);
	return parsed ? parsed.version : null;
};

interface SelfHostedRelease {
	/** Release tag, usable as is as the container image tag. */
	tag: string;
	/** Normalized version for display and comparison (`1.2.3`). */
	normalizedVersion: string;
	version: semver.SemVer;
	releaseUrl: string | null;
	publishedAt: string | null;
	assets: string[];
}

export interface ReleaseAssetCheck {
	available: boolean;
	reason: "missing_assets" | null;
	assets: string[];
	missing: string[];
}

/**
 * Whether a release carries every asset an installation needs. This is the
 * check that distinguishes "a tag exists" from "an update can be installed".
 */
export const checkReleaseAssets = (
	assets: (string | { name?: string } | null | undefined)[] | undefined,
): ReleaseAssetCheck => {
	const names = (assets ?? [])
		.map((asset) => (typeof asset === "string" ? asset : asset?.name))
		.filter((name): name is string => !!name);
	const missing = REQUIRED_RELEASE_ASSETS.filter(
		(required) => !names.includes(required),
	);
	return {
		available: missing.length === 0,
		reason: missing.length > 0 ? "missing_assets" : null,
		assets: names,
		missing: [...missing],
	};
};

/**
 * The core status rule:
 *
 * - no newer release, or an older one -> `up_to_date`
 * - newer release, assets unknown      -> `release_detected`
 * - newer release, assets missing      -> `waiting_for_assets`
 * - newer release, assets present      -> `ready`
 */
export const computeUpdateStatus = ({
	currentVersion,
	latestVersion,
	assetsReady,
}: {
	currentVersion: string;
	latestVersion: string | null;
	assetsReady?: boolean;
}): UpdateStatus => {
	if (!latestVersion) return "up_to_date";
	const current = semver.parse(currentVersion);
	const latest = semver.parse(latestVersion);
	if (!current || !latest || !semver.gt(latest, current)) {
		return "up_to_date";
	}
	if (assetsReady === undefined) return "release_detected";
	return assetsReady ? "ready" : "waiting_for_assets";
};

/**
 * Turns a bare version into the published release tag (`1.2.3` becomes
 * `v1.2.3-app`). Channels such as `latest`, `canary`, `feature` or a branch name
 * are returned untouched, they are already valid image tags.
 */
export const toReleaseTag = (version: string) => {
	const tag = version.trim();
	const release =
		parseSelfHostedRelease(tag) ?? parseSelfHostedRelease(`${tag}-app`);
	return release?.tag ?? tag;
};

const parseSelfHostedRelease = (tag: string): SelfHostedRelease | null => {
	const match = SELF_HOSTED_RELEASE_REGEX.exec(tag.trim());
	if (!match) return null;

	const normalizedVersion = `${match[1]}.${match[2]}.${match[3]}`;
	const version = semver.parse(normalizedVersion);
	if (!version) return null;

	return {
		tag: `v${normalizedVersion}${APP_TAG_SUFFIX}`,
		normalizedVersion,
		version,
		releaseUrl: null,
		publishedAt: null,
		assets: [],
	};
};

const getLatestOf = (releases: SelfHostedRelease[]) =>
	releases.reduce<SelfHostedRelease | null>(
		(latest, release) =>
			!latest || semver.gt(release.version, latest.version) ? release : latest,
		null,
	);

interface GitHubReleasePayload {
	draft?: boolean;
	prerelease?: boolean;
	tag_name?: string;
	html_url?: string;
	published_at?: string;
	assets?: { name?: string }[];
}

interface ReleasesCache {
	fetchedAt: number;
	releases: SelfHostedRelease[];
}

let releasesCache: ReleasesCache | undefined;
let releasesInFlight: Promise<SelfHostedRelease[]> | undefined;

const parseReleasesPayload = (
	payload: GitHubReleasePayload[],
): SelfHostedRelease[] =>
	payload
		.filter((release) => !release?.draft && !release?.prerelease)
		.map((release) => {
			const parsed = parseSelfHostedRelease(String(release?.tag_name));
			if (!parsed) return null;
			return {
				...parsed,
				releaseUrl: release.html_url ?? null,
				publishedAt: release.published_at ?? null,
				assets: (release.assets ?? [])
					.map((asset) => asset?.name)
					.filter((name): name is string => !!name),
			};
		})
		.filter((release): release is SelfHostedRelease => release !== null);

const fetchSelfHostedReleases = async (): Promise<SelfHostedRelease[]> => {
	const now = Date.now();
	if (releasesCache && now - releasesCache.fetchedAt < RELEASES_CACHE_TTL_MS) {
		return releasesCache.releases;
	}

	// Coalesce concurrent callers so a burst of dashboard renders cannot fan out
	// into several GitHub requests.
	if (releasesInFlight) {
		return releasesInFlight;
	}

	const request = (async () => {
		const response = await fetch(RELEASES_URL, {
			method: "GET",
			headers: {
				Accept: "application/vnd.github+json",
				"X-GitHub-Api-Version": "2022-11-28",
				"User-Agent": "notploy",
				// A token is optional, it only raises the rate limit from 60 to 5000
				// requests per hour.
				...(process.env.GITHUB_TOKEN
					? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
					: {}),
			},
			signal: AbortSignal.timeout(RELEASES_REQUEST_TIMEOUT_MS),
		});

		if (!response.ok) {
			throw new Error(`GitHub Releases answered with ${response.status}`);
		}

		const payload = (await response.json()) as GitHubReleasePayload[];
		if (!Array.isArray(payload)) {
			throw new Error("Unexpected GitHub Releases payload");
		}

		const parsed = parseReleasesPayload(payload);
		releasesCache = { fetchedAt: Date.now(), releases: parsed };
		return parsed;
	})();

	releasesInFlight = request;
	try {
		return await request;
	} finally {
		releasesInFlight = undefined;
	}
};

/**
 * Returns the highest published self-hosted release, or `null` when none is
 * reachable. On failure it keeps serving the last known releases so a GitHub
 * outage never makes an up-to-date install look obsolete.
 */
const getLatestSelfHostedRelease = async (): Promise<SelfHostedRelease | null> => {
	try {
		return getLatestOf(await fetchSelfHostedReleases());
	} catch (error) {
		// The update check is best-effort: an unreachable or rate-limited GitHub
		// must never surface as a server error in the logs on every call.
		console.warn(
			`Could not fetch releases from GitHub: ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
		return getLatestOf(releasesCache?.releases ?? []);
	}
};

/** Test/maintenance helper: forget the cached releases. */
export const invalidateUpdateCache = () => {
	releasesCache = undefined;
};

/**
 * Full update status. This is what the API exposes and the frontend renders:
 * version, availability, release metadata and the derived status.
 */
export const getUpdateStatus = async (
	currentVersion: string,
	channel: string = getNotployImageTag(),
): Promise<IUpdateStatusData> => {
	const checkedAt = new Date().toISOString();
	const normalizedCurrent = normalizeVersion(currentVersion) ?? currentVersion;

	const base: IUpdateStatusData = {
		currentVersion: normalizedCurrent,
		latestVersion: null,
		latestNormalizedVersion: null,
		updateAvailable: false,
		status: "up_to_date",
		assetsReady: false,
		missingAssets: [],
		releaseUrl: null,
		publishedAt: null,
		checkedAt,
	};

	// `canary` and `feature` installations change too often to be updated from a
	// dashboard, and docker-publish.yml does not publish those tags: they update
	// themselves.
	if (["canary", "feature"].includes(channel)) {
		return base;
	}

	const current = semver.parse(normalizedCurrent);
	if (!current) {
		return base;
	}

	const latestRelease = await getLatestSelfHostedRelease();
	if (!latestRelease) {
		return base;
	}

	const assetCheck = checkReleaseAssets(latestRelease.assets);
	const status = computeUpdateStatus({
		currentVersion: current.version,
		latestVersion: latestRelease.version.version,
		assetsReady: assetCheck.available,
	});

	return {
		currentVersion: current.version,
		latestVersion: latestRelease.tag,
		latestNormalizedVersion: latestRelease.normalizedVersion,
		updateAvailable: status !== "up_to_date",
		status,
		assetsReady: assetCheck.available,
		missingAssets: assetCheck.missing,
		releaseUrl: latestRelease.releaseUrl,
		publishedAt: latestRelease.publishedAt,
		checkedAt,
	};
};

/**
 * Backward-compatible view of {@link getUpdateStatus}. Existing consumers
 * (SDK, desktop, layout badge) keep working unchanged.
 */
export const getUpdateData = async (
	currentVersion: string,
	channel: string = getNotployImageTag(),
): Promise<IUpdateData> => {
	const status = await getUpdateStatus(currentVersion, channel);
	return {
		latestVersion: status.latestVersion,
		updateAvailable: status.updateAvailable,
	};
};

/** Whether an update may actually be installed right now. */
export const isUpdateInstallable = (status: IUpdateStatusData) =>
	status.status === UPDATE_INSTALLABLE_STATUS;
