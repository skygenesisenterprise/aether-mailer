import fs from "node:fs";
import path from "node:path";
import Docker from "dockerode";

export const IS_CLOUD = process.env.IS_CLOUD === "true";

/**
 * Legacy flavour hint. Kept for compatibility during the migration to the
 * capability model (issue #75 §12); it is never the sole basis for unlocking a
 * protected product.
 */
export const NOTPLOY_FLAVOR = process.env.NOTPLOY_FLAVOR;

/**
 * Product the instance was launched as (`self`, `cloud` or `console`).
 *
 * This is the launcher's explicit declaration and takes precedence over the
 * legacy `NOTPLOY_FLAVOR` / `IS_CLOUD` hints. It is *not* an authorization: a
 * protected product still fails closed without a signed entitlement. It answers
 * "which surface was started", which is what the console/cloud UI needs even
 * when a persisted instance identity was minted for another product.
 */
export const NOTPLOY_PRODUCT = process.env.NOTPLOY_PRODUCT;

/**
 * Public key Notploy signs cloud/console entitlements with. Only the public half
 * ships here; the signing key is kept offline. Empty by default so a protected
 * product fails closed until a real key is configured.
 */
export const NOTPLOY_ENTITLEMENT_PUBLIC_KEY =
	process.env.NOTPLOY_ENTITLEMENT_PUBLIC_KEY ?? "";

/** Optional path to the entitlement public key, for file-based deployments. */
export const NOTPLOY_ENTITLEMENT_PUBLIC_KEY_FILE =
	process.env.NOTPLOY_ENTITLEMENT_PUBLIC_KEY_FILE;

/**
 * Development-only escape hatch for protected products (cloud/console).
 *
 * Local development must be able to boot a protected product without a real
 * Notploy-signed entitlement, which is only minted by Notploy's authority. It is
 * never a security downgrade: the check is ignored whenever NODE_ENV=production,
 * so a leaked environment variable can never unlock a protected product on a
 * real host. Opt in explicitly with NOTPLOY_ALLOW_UNLICENSED_DEV=1; the dev
 * Compose service sets it automatically.
 */
export const allowUnlicensedDevInstance = (): boolean =>
	process.env.NODE_ENV !== "production" &&
	["1", "true", "yes"].includes(
		(process.env.NOTPLOY_ALLOW_UNLICENSED_DEV ?? "").toLowerCase(),
	);

export const NOTPLOY_DOCKER_API_VERSION =
	process.env.NOTPLOY_DOCKER_API_VERSION;
export const NOTPLOY_DOCKER_HOST = process.env.NOTPLOY_DOCKER_HOST;
export const NOTPLOY_DOCKER_PORT = process.env.NOTPLOY_DOCKER_PORT
	? Number(process.env.NOTPLOY_DOCKER_PORT)
	: undefined;

export const CLEANUP_CRON_JOB = "50 23 * * *";

// Body size limits for the OpenAPI catch-all route (pages/api/[...trpc].ts).
const parseByteSize = (envVar: string, fallback: number): number => {
	const raw = process.env[envVar];
	if (!raw) return fallback;
	const parsed = Number(raw);
	if (!Number.isInteger(parsed) || parsed <= 0) {
		console.warn(`Invalid ${envVar}="${raw}", using default ${fallback}`);
		return fallback;
	}
	return parsed;
};

export const OPENAPI_MAX_JSON_BODY_SIZE = parseByteSize(
	"OPENAPI_MAX_JSON_BODY_SIZE",
	10 * 1024 * 1024, // 10mb
);

export const OPENAPI_MAX_UPLOAD_SIZE = parseByteSize(
	"OPENAPI_MAX_UPLOAD_SIZE",
	1024 * 1024 * 1024, // 1gb
);

type DockerSocketCandidate = {
	label: string;
	path: string;
};

const getDockerConfig = (): Docker => {
	const versionOption = NOTPLOY_DOCKER_API_VERSION
		? { version: NOTPLOY_DOCKER_API_VERSION }
		: {};

	// Explicit remote Docker host configuration
	if (NOTPLOY_DOCKER_HOST) {
		console.info(
			`Using remote Docker host: ${NOTPLOY_DOCKER_HOST}${NOTPLOY_DOCKER_PORT ? `:${NOTPLOY_DOCKER_PORT}` : ""}`,
		);
		return new Docker({
			host: NOTPLOY_DOCKER_HOST,
			...(NOTPLOY_DOCKER_PORT && { port: NOTPLOY_DOCKER_PORT }),
			...versionOption,
		});
	}

	// Local socket auto-detection (Rancher Desktop, Colima, standard Docker)
	const dockerSocketCandidates: Array<DockerSocketCandidate> = [];

	if (process.env.DOCKER_HOST) {
		dockerSocketCandidates.push({
			label: "DOCKER_HOST environment variable",
			path: process.env.DOCKER_HOST.replace("unix://", ""),
		});
	}

	if (process.env.HOME) {
		dockerSocketCandidates.push({
			label: "Rancher Desktop socket",
			path: `${process.env.HOME}/.rd/docker.sock`,
		});
	}

	dockerSocketCandidates.push({
		label: "Standard Docker socket",
		path: "/var/run/docker.sock",
	});

	for (const candidate of dockerSocketCandidates) {
		try {
			if (candidate.path && fs.existsSync(candidate.path)) {
				console.info(
					`Using Docker socket (${candidate.label}): ${candidate.path}`,
				);
				return new Docker({
					socketPath: candidate.path,
					...versionOption,
				});
			}
		} catch (e) {
			console.info(
				`Docker socket initialization failed for ${candidate.label} (${candidate.path}): ${e instanceof Error ? e.message : "Unknown error"}`,
			);
		}
	}

	console.info(
		"Using default Docker configuration. You can set the DOCKER_HOST environment variable to specify a custom Docker socket path.",
	);
	return new Docker({ ...versionOption });
};

// Igual que db: el módulo se evalúa una vez por copia bundleada, el cache
// evita crear un cliente (y loguear la detección del socket) por cada una.
const globalForDocker = globalThis as unknown as {
	docker?: Docker;
};

if (!globalForDocker.docker) {
	globalForDocker.docker = getDockerConfig();
}

export const docker = globalForDocker.docker;

export const paths = (isServer = false) => {
	// `NOTPLOY_CONFIG_PATH` lets a containerized install share its config (Traefik
	// dynamic files, certificates, applications…) through a volume with the
	// Compose-managed Traefik service instead of the in-container `.docker` dir.
	const BASE_PATH =
		process.env.NOTPLOY_CONFIG_PATH ||
		(isServer || process.env.NODE_ENV === "production"
			? "/etc/notploy"
			: path.join(process.cwd(), ".docker"));
	const MAIN_TRAEFIK_PATH = `${BASE_PATH}/traefik`;
	const DYNAMIC_TRAEFIK_PATH = `${MAIN_TRAEFIK_PATH}/dynamic`;

	return {
		BASE_PATH,
		MAIN_TRAEFIK_PATH,
		DYNAMIC_TRAEFIK_PATH,
		LOGS_PATH: `${BASE_PATH}/logs`,
		APPLICATIONS_PATH: `${BASE_PATH}/applications`,
		COMPOSE_PATH: `${BASE_PATH}/compose`,
		SSH_PATH: `${BASE_PATH}/ssh`,
		CERTIFICATES_PATH: `${DYNAMIC_TRAEFIK_PATH}/certificates`,
		MONITORING_PATH: `${BASE_PATH}/monitoring`,
		IDENTITY_PATH: `${BASE_PATH}/identity`,
		REGISTRY_PATH: `${BASE_PATH}/registry`,
		SCHEDULES_PATH: `${BASE_PATH}/schedules`,
		VOLUME_BACKUPS_PATH: `${BASE_PATH}/volume-backups`,
		VOLUME_BACKUP_LOCK_PATH: `${BASE_PATH}/volume-backup-lock`,
		PATCH_REPOS_PATH: `${BASE_PATH}/patch-repos`,
	};
};
