import type { gcpVaultConfigSchema } from "@notploy/server/db/schema";
import { createSign } from "node:crypto";
import type { z } from "zod";
import { type VaultClient, vaultFetch } from "./types";

type GcpConfig = z.infer<typeof gcpVaultConfigSchema>;

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API_BASE = "https://secretmanager.googleapis.com/v1";
const SCOPE = "https://www.googleapis.com/auth/cloud-platform";

const base64url = (value: string | Buffer) =>
	Buffer.from(value).toString("base64url");

const signJwt = (config: GcpConfig) => {
	const now = Math.floor(Date.now() / 1000);
	const unsigned = `${base64url(
		JSON.stringify({ alg: "RS256", typ: "JWT" }),
	)}.${base64url(
		JSON.stringify({
			iss: config.clientEmail,
			scope: SCOPE,
			aud: TOKEN_URL,
			iat: now,
			exp: now + 3600,
		}),
	)}`;
	const privateKey = config.privateKey.replace(/\\n/g, "\n");
	let signature: string;
	try {
		signature = createSign("RSA-SHA256")
			.update(unsigned)
			.sign(privateKey, "base64url");
	} catch {
		throw new Error(
			"Google Secret Manager: the service account private key is not a valid PEM key",
		);
	}
	return `${unsigned}.${signature}`;
};

const tokenCache = new Map<string, { token: string; expiresAt: number }>();

const cacheKey = (config: GcpConfig) =>
	`${config.clientEmail}|${config.projectId}|${config.privateKey}`;

const accessToken = async (config: GcpConfig) => {
	const key = cacheKey(config);
	const cached = tokenCache.get(key);
	if (cached && cached.expiresAt > Date.now() + 60_000) {
		return cached.token;
	}

	let response: Response;
	try {
		response = await vaultFetch(TOKEN_URL, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
				assertion: signJwt(config),
			}).toString(),
		});
	} catch {
		throw new Error(
			"Google Secret Manager: the token endpoint is unreachable",
		);
	}
	if (!response.ok) {
		let detail = "";
		try {
			const body = (await response.json()) as {
				error_description?: string;
				error?: string;
			};
			detail = body.error_description ?? body.error ?? "";
		} catch {}
		throw new Error(
			`Google Secret Manager: authentication failed (status ${response.status}${detail ? `: ${detail}` : ""})`,
		);
	}
	const body = (await response.json()) as {
		access_token?: string;
		expires_in?: number;
	};
	if (!body.access_token) {
		throw new Error(
			"Google Secret Manager: the token endpoint returned no access token",
		);
	}
	tokenCache.set(key, {
		token: body.access_token,
		expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000,
	});
	return body.access_token;
};

const request = async <T>(
	config: GcpConfig,
	path: string,
	init?: RequestInit,
): Promise<T> => {
	const token = await accessToken(config);
	let response: Response;
	try {
		response = await vaultFetch(`${API_BASE}${path}`, {
			...init,
			headers: {
				...init?.headers,
				Authorization: `Bearer ${token}`,
				Accept: "application/json",
			},
		});
	} catch {
		throw new Error(
			`Google Secret Manager: request to "${path}" failed or timed out`,
		);
	}
	if (!response.ok) {
		if (response.status === 401 || response.status === 403) {
			tokenCache.delete(cacheKey(config));
		}
		let detail = "";
		try {
			const body = (await response.json()) as {
				error?: { message?: string };
			};
			detail = body.error?.message ?? "";
		} catch {}
		throw new Error(
			`Google Secret Manager: request to "${path}" failed (status ${response.status}${detail ? `: ${detail}` : ""})`,
		);
	}
	return (await response.json()) as T;
};

const parseRef = (ref: string) => {
	const separatorIndex = ref.lastIndexOf(":");
	if (separatorIndex <= 0 || separatorIndex === ref.length - 1) {
		return { id: ref, field: undefined as string | undefined };
	}
	return {
		id: ref.slice(0, separatorIndex),
		field: ref.slice(separatorIndex + 1),
	};
};

const pickField = (document: unknown, path: string) => {
	let value: unknown = document;
	for (const segment of path.split(".")) {
		if (value === null || typeof value !== "object") {
			return undefined;
		}
		value = (value as Record<string, unknown>)[segment];
	}
	return value;
};

export const gcpClient: VaultClient<GcpConfig> = {
	async getSecrets(config, refs) {
		const result: Record<string, string> = {};
		for (const ref of refs) {
			const { id, field } = parseRef(ref);
			if (!/^[A-Za-z0-9_-]+$/.test(id)) {
				throw new Error(
					`Google Secret Manager: invalid secret id "${id}" (letters, digits, dashes and underscores only)`,
				);
			}
			const body = await request<{ payload?: { data?: string } }>(
				config,
				`/projects/${encodeURIComponent(config.projectId)}/secrets/${encodeURIComponent(id)}/versions/latest:access`,
			);
			if (!body.payload?.data) {
				throw new Error(
					`Google Secret Manager: secret "${id}" returned no payload`,
				);
			}
			let value = Buffer.from(body.payload.data, "base64").toString("utf8");
			if (field) {
				let parsed: unknown;
				try {
					parsed = JSON.parse(value);
				} catch {
					throw new Error(
						`Google Secret Manager: secret "${id}" is not JSON — drop the ":${field}" suffix`,
					);
				}
				const picked = pickField(parsed, field);
				if (picked === undefined) {
					throw new Error(
						`Google Secret Manager: field "${field}" not found in secret "${id}"`,
					);
				}
				value = typeof picked === "string" ? picked : JSON.stringify(picked);
			}
			result[ref] = value;
		}
		return result;
	},

	async testConnection(config) {
		await request(config, `/projects/${encodeURIComponent(config.projectId)}/secrets?pageSize=1`);
	},

	async listSecretNames(config) {
		const body = await request<{ secrets?: { name?: string }[] }>(
			config,
			`/projects/${encodeURIComponent(config.projectId)}/secrets?pageSize=1000`,
		);
		return (body.secrets ?? [])
			.map((secret) => secret.name?.split("/").pop() ?? "")
			.filter((name) => name.length > 0)
			.sort();
	},
};
