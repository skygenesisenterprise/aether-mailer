import { docker } from "@notploy/server/constants";
import type { dockerVaultConfigSchema } from "@notploy/server/db/schema";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import type { z } from "zod";
import type { VaultClient, VaultSecretRecord } from "./types";

type DockerConfig = z.infer<typeof dockerVaultConfigSchema>;

const mountPath = (config: DockerConfig) => resolve(config.mountPath);

const errorMessage = (error: unknown) =>
	error instanceof Error ? error.message : "unknown error";

const secretFile = (config: DockerConfig, ref: string) => {
	if (!/^[A-Za-z0-9._-]+$/.test(ref) || ref.includes("..")) {
		throw new Error(`Docker secrets: invalid secret name "${ref}"`);
	}
	const mount = mountPath(config);
	const target = resolve(join(mount, ref));
	if (target !== mount && !target.startsWith(`${mount}${sep}`)) {
		throw new Error(`Docker secrets: "${ref}" escapes the mount path`);
	}
	return target;
};

/**
 * Swarm secrets and configs are metadata-only through the Docker API: the
 * engine never returns their value. Listing them still lets the Console
 * discover the names a cluster exposes, while values are read from the files
 * mounted into the Notploy container.
 */
const listSwarmEntries = async (): Promise<{ name: string; source: string }[]> => {
	const entries: { name: string; source: string }[] = [];
	try {
		for (const secret of await docker.listSecrets()) {
			if (secret.Spec?.Name) {
				entries.push({ name: secret.Spec.Name, source: "Swarm secret" });
			}
		}
		for (const config of await docker.listConfigs()) {
			if (config.Spec?.Name) {
				entries.push({ name: config.Spec.Name, source: "Swarm config" });
			}
		}
	} catch {
		// A worker node or an engine without the manager role cannot list these.
		// Discovery is best-effort; values keep working from the mounted files.
	}
	return entries;
};

const listSwarmNames = async (): Promise<string[]> =>
	[...new Set((await listSwarmEntries()).map((entry) => entry.name))].sort();

/**
 * Reads the directory of secret files the agent can see. Docker mounts Swarm
 * secrets as files (by default under `/run/secrets`), which is the only way to
 * obtain their value.
 */
const readMountDirectory = async (config: DockerConfig) => {
	const mount = mountPath(config);
	try {
		const entries = await readdir(mount, { withFileTypes: true });
		return entries
			.filter((entry) => entry.isFile() && !entry.name.startsWith("."))
			.map((entry) => entry.name)
			.sort();
	} catch (error) {
		throw new Error(
			`Docker secrets: cannot read "${config.mountPath}" (${errorMessage(error)}). ` +
				`Mount the secrets directory into the Notploy service, e.g. ` +
				`docker service update --mount-add type=bind,source=/run/secrets,target=/run/secrets <service>.`,
		);
	}
};

/**
 * Combines the mounted files (the only readable source of a value) with the
 * Swarm secrets and configs the daemon knows about, so the Console can show
 * every name together with its source and whether it can be resolved.
 */
const collectSecretRecords = async (
	config: DockerConfig,
): Promise<VaultSecretRecord[]> => {
	const records = new Map<string, VaultSecretRecord>();
	let files: string[] = [];
	try {
		files = await readMountDirectory(config);
	} catch {
		// A missing mount only blocks resolving values, not discovery.
	}
	for (const name of files) {
		records.set(name, { name, source: "Mounted file", resolvable: true });
	}
	for (const entry of await listSwarmEntries()) {
		if (records.has(entry.name)) {
			continue;
		}
		records.set(entry.name, {
			name: entry.name,
			source: entry.source,
			resolvable: false,
			detail: "Not mounted in the Notploy container",
		});
	}
	return [...records.values()].sort((a, b) => a.name.localeCompare(b.name));
};

const pingDocker = async () => {
	try {
		await docker.ping();
	} catch (error) {
		throw new Error(
			`Docker secrets: the Docker daemon is unreachable (${errorMessage(error)}). ` +
				`Mount /var/run/docker.sock into the Notploy service so it can discover cluster secrets.`,
		);
	}
};

/**
 * Reads Docker/Swarm secrets (or any directory of secret files, such as a
 * bind-mounted folder of Docker configs) reachable by the Notploy agent. The
 * Docker socket is used to discover the Swarm secrets and configs of the
 * cluster; their values come from the mounted files, since Docker never exposes
 * them through its API.
 */
export const dockerClient: VaultClient<DockerConfig> = {
	async getSecrets(config, refs) {
		const result: Record<string, string> = {};
		for (const ref of refs) {
			const file = secretFile(config, ref);
			try {
				const content = await readFile(file, "utf8");
				// Docker stores the raw bytes of the secret; only a trailing
				// newline introduced by common `echo secret > file` flows is
				// dropped.
				result[ref] = content.replace(/\r?\n$/, "");
			} catch {
				// A broken mount is different from a secret that is simply absent:
				// report the mount so the fix is obvious.
				try {
					await readMountDirectory(config);
				} catch (mountError) {
					throw mountError;
				}
				const swarmNames = await listSwarmNames();
				if (swarmNames.includes(ref)) {
					throw new Error(
						`Docker secrets: "${ref}" exists in the Swarm but is not mounted in the Notploy container. ` +
							`Add it to the Notploy service with ` +
							`docker service update --secret-add source=${ref},target=/run/secrets/${ref} <service>.`,
					);
				}
				throw new Error(
					`Docker secrets: secret "${ref}" not found in ${config.mountPath}`,
				);
			}
		}
		return result;
	},

	async testConnection(config) {
		// The Docker socket is what makes the provider reachable: it powers
		// discovery of the cluster's secrets. The mount directory is only needed
		// to read a value at deploy time, so a missing one must not fail the
		// connection test — getSecrets reports it when a reference is resolved.
		await pingDocker();
		try {
			await readMountDirectory(config);
		} catch {
			// Discovery still works through the socket.
		}
	},

	async listSecretNames(config) {
		return (await collectSecretRecords(config)).map((record) => record.name);
	},

	async listSecretRecords(config) {
		return await collectSecretRecords(config);
	},
};
