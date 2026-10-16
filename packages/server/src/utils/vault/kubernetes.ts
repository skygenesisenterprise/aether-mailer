import type { kubernetesVaultConfigSchema } from "@notploy/server/db/schema";
import type { z } from "zod";
import { type VaultClient, vaultFetch } from "./types";

type KubernetesConfig = z.infer<typeof kubernetesVaultConfigSchema>;

const api = (config: KubernetesConfig, path: string) =>
	`${config.apiUrl.replace(/\/+$/, "")}${path}`;

const request = async <T>(config: KubernetesConfig, path: string): Promise<T> => {
	const response = await vaultFetch(api(config, path), {
		headers: {
			Authorization: `Bearer ${config.token}`,
			Accept: "application/json",
		},
	});
	if (!response.ok) {
		let detail = "";
		try {
			const body = (await response.json()) as { message?: string };
			detail = body.message ?? "";
		} catch {}
		throw new Error(
			`Kubernetes: request to "${path}" failed (status ${response.status}${detail ? `: ${detail}` : ""})`,
		);
	}
	return (await response.json()) as T;
};

const namespacePath = (config: KubernetesConfig) =>
	`/api/v1/namespaces/${encodeURIComponent(config.namespace)}`;

/**
 * References look like `secret-name` (single-key secret) or
 * `secret-name:key` for multi-key secrets.
 */
const parseRef = (ref: string) => {
	const separatorIndex = ref.lastIndexOf(":");
	if (
		separatorIndex <= 0 ||
		separatorIndex === ref.length - 1
	) {
		return { name: ref, key: undefined as string | undefined };
	}
	return { name: ref.slice(0, separatorIndex), key: ref.slice(separatorIndex + 1) };
};

type SecretResponse = { data?: Record<string, string> };

export const kubernetesClient: VaultClient<KubernetesConfig> = {
	async getSecrets(config, refs) {
		const byName = new Map<string, string[]>();
		for (const ref of refs) {
			const { name } = parseRef(ref);
			byName.set(name, [...(byName.get(name) ?? []), ref]);
		}

		const result: Record<string, string> = {};
		for (const [name, nameRefs] of byName) {
			const secret = await request<SecretResponse>(
				config,
				`${namespacePath(config)}/secrets/${encodeURIComponent(name)}`,
			);
			const data = secret.data ?? {};
			const keys = Object.keys(data);
			for (const ref of nameRefs) {
				const { key } = parseRef(ref);
				const resolvedKey = key ?? (keys.length === 1 ? keys[0] : undefined);
				if (!resolvedKey) {
					throw new Error(
						keys.length === 0
							? `Kubernetes: secret "${name}" has no data`
							: `Kubernetes: secret "${name}" holds several keys (${keys.join(", ")}) — use "${name}:<key>"`,
					);
				}
				const value = data[resolvedKey];
				if (value === undefined) {
					throw new Error(
						`Kubernetes: key "${resolvedKey}" not found in secret "${name}" (available: ${keys.join(", ")})`,
					);
				}
				result[ref] = Buffer.from(value, "base64").toString("utf8");
			}
		}
		return result;
	},

	async testConnection(config) {
		await request<unknown>(config, namespacePath(config));
	},

	async listSecretNames(config) {
		const body = await request<{
			items?: {
				metadata?: { name?: string };
				type?: string;
			}[];
		}>(config, `${namespacePath(config)}/secrets`);
		return (body.items ?? [])
			.filter(
				(item) =>
					item.metadata?.name &&
					item.type !== "kubernetes.io/service-account-token",
			)
			.map((item) => item.metadata?.name as string)
			.sort();
	},
};
