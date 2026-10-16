import type { onepasswordVaultConfigSchema } from "@notploy/server/db/schema";
import type { z } from "zod";
import { type VaultClient, vaultFetch } from "./types";

type OnePasswordConfig = z.infer<typeof onepasswordVaultConfigSchema>;

const baseUrl = (config: OnePasswordConfig) =>
	config.connectUrl.replace(/\/+$/, "");

const request = async <T>(config: OnePasswordConfig, path: string): Promise<T> => {
	let response: Response;
	try {
		response = await vaultFetch(`${baseUrl(config)}${path}`, {
			headers: {
				Authorization: `Bearer ${config.token}`,
				Accept: "application/json",
			},
		});
	} catch {
		throw new Error(
			`1Password Connect: the server at "${config.connectUrl}" is unreachable`,
		);
	}
	if (!response.ok) {
		throw new Error(
			`1Password Connect: request to "${path}" failed (status ${response.status})`,
		);
	}
	return (await response.json()) as T;
};

/**
 * References look like `<vaultId>/<itemId>` (password field) or
 * `<vaultId>/<itemId>/<field label>`.
 */
const parseRef = (ref: string) => {
	const [vaultId, itemId, ...fieldParts] = ref.split("/");
	if (!vaultId || !itemId) {
		throw new Error(
			`Invalid 1Password reference "${ref}": expected format <vaultId>/<itemId>[/<field>]`,
		);
	}
	return {
		vaultId,
		itemId,
		field: fieldParts.length > 0 ? fieldParts.join("/") : undefined,
	};
};

interface ConnectItem {
	id?: string;
	title?: string;
	fields?: {
		id?: string;
		label?: string;
		type?: string;
		value?: string | null;
	}[];
}

const fieldLabels = (item: ConnectItem) =>
	(item.fields ?? [])
		.map((field) => field.label ?? field.id ?? "unnamed")
		.join(", ");

const pickField = (item: ConnectItem, requested?: string) => {
	const fields = (item.fields ?? []).filter(
		(field) => field.value !== undefined && field.value !== null,
	);
	if (requested) {
		const match = fields.find(
			(field) =>
				field.label?.toLowerCase() === requested.toLowerCase() ||
				field.id === requested,
		);
		if (!match) {
			throw new Error(
				`1Password: field "${requested}" not found (available: ${fieldLabels(item) || "none"})`,
			);
		}
		return match;
	}

	const password = fields.find(
		(field) => field.label?.toLowerCase() === "password",
	);
	if (password) {
		return password;
	}
	if (fields.length === 1) {
		const single = fields[0];
		if (single) {
			return single;
		}
	}
	throw new Error(
		`1Password: the item holds several fields (${fieldLabels(item)}) — use <vaultId>/<itemId>/<field>`,
	);
};

export const onepasswordClient: VaultClient<OnePasswordConfig> = {
	async getSecrets(config, refs) {
		const result: Record<string, string> = {};
		const byItem = new Map<string, string[]>();
		for (const ref of refs) {
			const { vaultId, itemId } = parseRef(ref);
			const key = `${vaultId}/${itemId}`;
			byItem.set(key, [...(byItem.get(key) ?? []), ref]);
		}

		for (const [itemRef, itemRefs] of byItem) {
			const [vaultId, itemId] = itemRef.split("/");
			const item = await request<ConnectItem>(
				config,
				`/v1/vaults/${vaultId}/items/${itemId}`,
			);
			for (const ref of itemRefs) {
				const { field } = parseRef(ref);
				const match = pickField(item, field);
				result[ref] = match.value ?? "";
			}
		}
		return result;
	},

	async testConnection(config) {
		const vaults = await request<unknown>(config, "/v1/vaults");
		if (!Array.isArray(vaults)) {
			throw new Error("1Password Connect: unexpected response for /v1/vaults");
		}
	},

	async listSecretNames(config) {
		const vaults = await request<{ id?: string; name?: string }[]>(
			config,
			"/v1/vaults",
		);
		const names: string[] = [];
		for (const vault of vaults.slice(0, 10)) {
			if (!vault.id) continue;
			try {
				const items = await request<{ id?: string; title?: string }[]>(
					config,
					`/v1/vaults/${vault.id}/items`,
				);
				for (const item of items) {
					if (!item.id) continue;
					names.push(`${vault.id}/${item.id}`);
					if (names.length >= 500) return names;
				}
			} catch {
				// A vault without read access is skipped rather than failing the list.
			}
		}
		return names;
	},
};
