import type { vaultwardenVaultConfigSchema } from "@notploy/server/db/schema";
import type { z } from "zod";
import { type VaultClient, vaultFetch } from "./types";

type VaultwardenConfig = z.infer<typeof vaultwardenVaultConfigSchema>;

const trim = (value: string) => value.replace(/\/+$/, "");

const tokenCache = new Map<string, { token: string; expiresAt: number }>();

const cacheKey = (config: VaultwardenConfig) =>
	`${config.identityUrl}|${config.clientId}|${config.clientSecret}`;

const accessToken = async (config: VaultwardenConfig) => {
	const key = cacheKey(config);
	const cached = tokenCache.get(key);
	if (cached && cached.expiresAt > Date.now() + 60_000) {
		return cached.token;
	}

	let response: Response;
	try {
		response = await vaultFetch(`${trim(config.identityUrl)}/connect/token`, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				grant_type: "client_credentials",
				client_id: config.clientId,
				client_secret: config.clientSecret,
				scope: "sm.secret.read sm.project.read",
			}).toString(),
		});
	} catch {
		throw new Error(
			`Vaultwarden: the identity endpoint "${config.identityUrl}" is unreachable`,
		);
	}
	if (!response.ok) {
		let detail = "";
		try {
			const body = (await response.json()) as {
				error?: string;
				error_description?: string;
			};
			detail = body.error_description ?? body.error ?? "";
		} catch {}
		throw new Error(
			`Vaultwarden: authentication failed (status ${response.status}${detail ? `: ${detail}` : ""})`,
		);
	}
	const body = (await response.json()) as {
		access_token?: string;
		expires_in?: number;
	};
	if (!body.access_token) {
		throw new Error(
			"Vaultwarden: the identity endpoint returned no access token",
		);
	}
	tokenCache.set(key, {
		token: body.access_token,
		expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000,
	});
	return body.access_token;
};

const request = async <T>(
	config: VaultwardenConfig,
	path: string,
): Promise<T> => {
	const token = await accessToken(config);
	let response: Response;
	try {
		response = await vaultFetch(`${trim(config.apiUrl)}${path}`, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/json",
			},
		});
	} catch {
		throw new Error(`Vaultwarden: request to "${path}" failed or timed out`);
	}
	if (!response.ok) {
		if (response.status === 401 || response.status === 403) {
			tokenCache.delete(cacheKey(config));
		}
		let detail = "";
		try {
			const body = (await response.json()) as {
				message?: string;
				error?: string;
				error_description?: string;
			};
			detail =
				body.message ?? body.error_description ?? body.error ?? "";
		} catch {}
		throw new Error(
			`Vaultwarden: request to "${path}" failed (status ${response.status}${detail ? `: ${detail}` : ""})`,
		);
	}
	return (await response.json()) as T;
};

interface VaultwardenSecret {
	id?: string;
	key?: string;
	value?: string;
}

const parseList = (body: unknown): VaultwardenSecret[] => {
	if (Array.isArray(body)) return body as VaultwardenSecret[];
	const record = body as Record<string, unknown>;
	const list = record.data ?? record.secrets ?? record.items;
	return Array.isArray(list) ? (list as VaultwardenSecret[]) : [];
};

const listOrganizationSecrets = async (config: VaultwardenConfig) =>
	parseList(
		await request<unknown>(
			config,
			`/sm/organizations/${encodeURIComponent(config.organizationId)}/secrets`,
		),
	);

/**
 * References are the secret key (`MY_SECRET`) or its id (UUID).
 */
const findSecret = async (config: VaultwardenConfig, reference: string) => {
	const secrets = await listOrganizationSecrets(config);
	const match = secrets.find(
		(secret) =>
			secret.id === reference ||
			secret.key?.toLowerCase() === reference.toLowerCase(),
	);
	if (!match?.id) {
		throw new Error(
			`Vaultwarden: no secret "${reference}" in organization ${config.organizationId}`,
		);
	}
	return match;
};

export const vaultwardenClient: VaultClient<VaultwardenConfig> = {
	async getSecrets(config, refs) {
		const result: Record<string, string> = {};
		for (const ref of refs) {
			const secret = await findSecret(config, ref);
			if (typeof secret.value === "string") {
				result[ref] = secret.value;
				continue;
			}
			// The list endpoint may omit values: fall back to the detail endpoints.
			const detail = await request<VaultwardenSecret>(
				config,
				`/sm/secrets/${secret.id}`,
			);
			if (typeof detail.value === "string") {
				result[ref] = detail.value;
				continue;
			}
			const valueBody = await request<unknown>(
				config,
				`/sm/secrets/${secret.id}/value`,
			);
			const value =
				typeof valueBody === "string"
					? valueBody
					: (valueBody as { value?: string; data?: { value?: string } })
							.value ??
						(valueBody as { data?: { value?: string } }).data?.value;
			if (typeof value !== "string") {
				throw new Error(
					`Vaultwarden: could not read the value of secret "${ref}"`,
				);
			}
			result[ref] = value;
		}
		return result;
	},

	async testConnection(config) {
		await listOrganizationSecrets(config);
	},

	async listSecretNames(config) {
		const secrets = await listOrganizationSecrets(config);
		return secrets
			.map((secret) => secret.key ?? secret.id ?? "")
			.filter((name) => name.length > 0)
			.sort();
	},
};
