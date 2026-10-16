import type { genericVaultConfigSchema } from "@notploy/server/db/schema";
import type { z } from "zod";
import { type VaultClient, vaultFetch } from "./types";

type GenericConfig = z.infer<typeof genericVaultConfigSchema>;

const rootUrl = (config: GenericConfig) => config.baseUrl.replace(/\/+$/, "");

const buildHeaders = (config: GenericConfig) => {
	const headers: Record<string, string> = { Accept: "*/*" };
	if (config.token) {
		headers.Authorization = `Bearer ${config.token}`;
	}
	return headers;
};

/**
 * References look like `path/to/document` or `path/to/document:field.name`,
 * where the optional `:field` picks a value inside a JSON document.
 */
const parseRef = (ref: string) => {
	const separatorIndex = ref.lastIndexOf(":");
	const field = separatorIndex > 0 ? ref.slice(separatorIndex + 1) : "";
	if (
		separatorIndex <= 0 ||
		separatorIndex === ref.length - 1 ||
		!/^[A-Za-z0-9_.-]+$/.test(field)
	) {
		return { path: ref, field: undefined as string | undefined };
	}
	return { path: ref.slice(0, separatorIndex), field };
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

const fetchDocument = async (config: GenericConfig, path: string) => {
	const url = `${rootUrl(config)}/${path.replace(/^\/+/, "")}`;
	let response: Response;
	try {
		response = await vaultFetch(url, { headers: buildHeaders(config) });
	} catch {
		throw new Error(`Generic provider: "${url}" is unreachable`);
	}
	if (!response.ok) {
		throw new Error(
			`Generic provider: GET "${path}" failed (status ${response.status})`,
		);
	}
	const text = await response.text();
	try {
		return JSON.parse(text) as unknown;
	} catch {
		return text;
	}
};

export const genericClient: VaultClient<GenericConfig> = {
	async getSecrets(config, refs) {
		const result: Record<string, string> = {};
		for (const ref of refs) {
			const { path, field } = parseRef(ref);
			const document = await fetchDocument(config, path);
			let value: unknown;
			if (field) {
				value = pickField(document, field);
				if (value === undefined) {
					throw new Error(
						`Generic provider: field "${field}" not found in "${path}"`,
					);
				}
			} else if (typeof document === "string") {
				value = document;
			} else if (
				document !== null &&
				typeof document === "object" &&
				typeof (document as { value?: unknown }).value === "string"
			) {
				value = (document as { value: string }).value;
			} else {
				throw new Error(
					`Generic provider: "${path}" returned a JSON document — use "${path}:<field>" to select a value`,
				);
			}
			result[ref] = typeof value === "string" ? value : JSON.stringify(value);
		}
		return result;
	},

	async testConnection(config) {
		let response: Response;
		try {
			response = await vaultFetch(rootUrl(config), {
				headers: buildHeaders(config),
			});
		} catch {
			throw new Error(`Generic provider: "${config.baseUrl}" is unreachable`);
		}
		if (response.status >= 500) {
			throw new Error(
				`Generic provider: endpoint replied with status ${response.status}`,
			);
		}
	},

	// Discovery is provider-specific, so browsing is intentionally not offered:
	// references are written by path.
};
