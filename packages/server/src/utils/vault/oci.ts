import type { ociVaultConfigSchema } from "@notploy/server/db/schema";
import { createSign } from "node:crypto";
import type { z } from "zod";
import { type VaultClient, vaultFetch } from "./types";

type OciConfig = z.infer<typeof ociVaultConfigSchema>;

const API_VERSION = "20160101";

const host = (config: OciConfig) => `vault.${config.region}.oraclecloud.com`;

/**
 * OCI request signing (Signature version 1): the date, request target and host
 * are signed with the API signing key, no session token involved.
 */
const signRequest = (config: OciConfig, pathAndQuery: string) => {
	const date = new Date().toUTCString();
	const signingString = `date: ${date}\n(request-target): get ${pathAndQuery}\nhost: ${host(config)}`;
	const privateKey = config.privateKey.replace(/\\n/g, "\n");
	let signature: string;
	try {
		signature = createSign("RSA-SHA256")
			.update(signingString)
			.sign(privateKey, "base64");
	} catch {
		throw new Error(
			"Oracle Cloud Vault: the API signing key is not a valid PEM key",
		);
	}
	return {
		date,
		authorization: `Signature version="1",keyId="${config.tenancyId}/${config.userId}/${config.fingerprint}",algorithm="rsa-sha256",headers="date (request-target) host",signature="${signature}"`,
	};
};

const request = async <T>(config: OciConfig, pathAndQuery: string): Promise<T> => {
	const { date, authorization } = signRequest(config, pathAndQuery);
	let response: Response;
	try {
		response = await vaultFetch(`https://${host(config)}${pathAndQuery}`, {
			headers: {
				Authorization: authorization,
				Date: date,
				Accept: "application/json",
			},
		});
	} catch {
		throw new Error(
			`Oracle Cloud Vault: "https://${host(config)}" is unreachable`,
		);
	}
	if (!response.ok) {
		let detail = "";
		try {
			const body = (await response.json()) as {
				code?: string;
				message?: string;
			};
			detail = body.message ?? body.code ?? "";
		} catch {}
		throw new Error(
			`Oracle Cloud Vault: request failed (status ${response.status}${detail ? `: ${detail}` : ""})`,
		);
	}
	return (await response.json()) as T;
};

interface OciSecretSummary {
	id?: string;
	displayName?: string;
	secretName?: string;
}

const parseList = (body: unknown): OciSecretSummary[] => {
	if (Array.isArray(body)) return body as OciSecretSummary[];
	const record = body as Record<string, unknown>;
	const list =
		record.items ?? record.resources ?? record.secrets ?? record.secretSummaries;
	return Array.isArray(list) ? (list as OciSecretSummary[]) : [];
};

const listSecrets = async (config: OciConfig) => {
	const body = await request<unknown>(
		config,
		`/${API_VERSION}/secrets?compartmentId=${encodeURIComponent(config.compartmentId)}`,
	);
	return parseList(body).filter((secret) => secret.id);
};

/**
 * References are the secret OCID (`ocid1.vaultsecret...`) or, for convenience,
 * the secret's display name within the configured compartment.
 */
const parseRef = (ref: string) => {
	const separatorIndex = ref.lastIndexOf(":");
	if (separatorIndex <= 0 || separatorIndex === ref.length - 1) {
		return { secret: ref, field: undefined as string | undefined };
	}
	return {
		secret: ref.slice(0, separatorIndex),
		field: ref.slice(separatorIndex + 1),
	};
};

const resolveSecretId = async (config: OciConfig, reference: string) => {
	if (reference.startsWith("ocid1.")) {
		return reference;
	}
	const secrets = await listSecrets(config);
	const match = secrets.find(
		(secret) =>
			(secret.displayName ?? "").toLowerCase() === reference.toLowerCase() ||
			(secret.secretName ?? "").toLowerCase() === reference.toLowerCase(),
	);
	if (!match?.id) {
		throw new Error(
			`Oracle Cloud Vault: no secret named "${reference}" in compartment ${config.compartmentId}`,
		);
	}
	return match.id;
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

export const ociClient: VaultClient<OciConfig> = {
	async getSecrets(config, refs) {
		const result: Record<string, string> = {};
		for (const ref of refs) {
			const { secret, field } = parseRef(ref);
			const secretId = await resolveSecretId(config, secret);
			const body = await request<unknown>(
				config,
				`/${API_VERSION}/secrets/${encodeURIComponent(secretId)}/payload`,
			);
			const bundle =
				(body as { secretBundle?: Record<string, unknown> }).secretBundle ??
				(body as Record<string, unknown>);
			const content = (bundle as { content?: unknown }).content;
			if (typeof content !== "string") {
				throw new Error(
					`Oracle Cloud Vault: secret "${secret}" returned no content`,
				);
			}
			let value = Buffer.from(content, "base64").toString("utf8");
			if (field) {
				let parsed: unknown;
				try {
					parsed = JSON.parse(value);
				} catch {
					throw new Error(
						`Oracle Cloud Vault: secret "${secret}" is not JSON — drop the ":${field}" suffix`,
					);
				}
				const picked = pickField(parsed, field);
				if (picked === undefined) {
					throw new Error(
						`Oracle Cloud Vault: field "${field}" not found in secret "${secret}"`,
					);
				}
				value = typeof picked === "string" ? picked : JSON.stringify(picked);
			}
			result[ref] = value;
		}
		return result;
	},

	async testConnection(config) {
		await listSecrets(config);
	},

	async listSecretNames(config) {
		const secrets = await listSecrets(config);
		return secrets
			.map(
				(secret) => secret.displayName ?? secret.secretName ?? secret.id ?? "",
			)
			.filter((name) => name.length > 0)
			.sort();
	},
};
