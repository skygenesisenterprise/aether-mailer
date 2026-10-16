import { dnsFetch } from "./types";

/**
 * Small shared client for the JSON HTTP APIs most managed providers expose.
 * Centralising error handling keeps every adapter's failures uniform and
 * ensures provider error text never leaks credentials.
 */
export interface DnsHttpOptions {
	baseUrl: string;
	headers?: Record<string, string>;
}

export class DnsHttpError extends Error {
	constructor(
		public readonly provider: string,
		public readonly path: string,
		public readonly status: number,
		detail?: string,
	) {
		super(
			`${provider}: request to ${path} failed${
				detail ? `: ${detail}` : ` (status ${status})`
			}`,
		);
		this.name = "DnsHttpError";
	}
}

const extractDetail = async (response: Response) => {
	try {
		const body = await response.text();
		if (!body) return undefined;
		try {
			const parsed = JSON.parse(body) as Record<string, unknown>;
			const candidate =
				parsed.message ??
				parsed.error ??
				parsed.errorMessage ??
				parsed.errors ??
				parsed.detail;
			if (typeof candidate === "string") return candidate;
			if (Array.isArray(candidate)) {
				return candidate
					.map((entry) =>
						typeof entry === "string"
							? entry
							: ((entry as { message?: string }).message ?? ""),
					)
					.filter(Boolean)
					.join(", ");
			}
		} catch {
			// Not JSON — fall back to the raw body, trimmed to a sane length.
			return body.slice(0, 200);
		}
		return body.slice(0, 200);
	} catch {
		return undefined;
	}
};

export const createDnsHttp = (provider: string, options: DnsHttpOptions) => {
	const base = options.baseUrl.replace(/\/+$/, "");

	const request = async <T>(
		path: string,
		init: RequestInit = {},
	): Promise<T> => {
		const response = await dnsFetch(`${base}${path}`, {
			...init,
			headers: {
				Accept: "application/json",
				...options.headers,
				...init.headers,
			},
		});

		if (!response.ok) {
			throw new DnsHttpError(
				provider,
				path,
				response.status,
				await extractDetail(response),
			);
		}

		if (response.status === 204) return undefined as T;
		const text = await response.text();
		if (!text) return undefined as T;
		return JSON.parse(text) as T;
	};

	return {
		get: <T>(path: string) => request<T>(path),
		post: <T>(path: string, body: unknown) =>
			request<T>(path, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			}),
		put: <T>(path: string, body: unknown) =>
			request<T>(path, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			}),
		patch: <T>(path: string, body: unknown) =>
			request<T>(path, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			}),
		delete: <T = void>(path: string) => request<T>(path, { method: "DELETE" }),
	};
};

export const stripTrailingDot = (name: string) => name.replace(/\.$/, "");

export const ensureTrailingDot = (name: string) =>
	name.endsWith(".") ? name : `${name}.`;

export const buildRecordId = (type: string, name: string) =>
	`${type}:${stripTrailingDot(name)}`;

export const parseRecordId = (provider: string, id: string) => {
	const separatorIndex = id.indexOf(":");
	if (separatorIndex === -1) {
		throw new Error(`${provider}: invalid record id "${id}"`);
	}
	return {
		type: id.slice(0, separatorIndex),
		name: id.slice(separatorIndex + 1),
	};
};

/** The subdomain part of a name relative to its zone, with "" for the apex. */
export const toSubdomain = (name: string, zone: string) => {
	const fqdn = stripTrailingDot(name);
	const zoneName = stripTrailingDot(zone);
	if (fqdn === zoneName) return "";
	const suffix = `.${zoneName}`;
	return fqdn.endsWith(suffix) ? fqdn.slice(0, -suffix.length) : fqdn;
};

/** Rebuilds an absolute name from a provider's zone-relative value. */
export const toFqdn = (subdomain: string, zone: string) => {
	const zoneName = stripTrailingDot(zone);
	if (!subdomain || subdomain === "@") return zoneName;
	return subdomain.endsWith(zoneName) ? subdomain : `${subdomain}.${zoneName}`;
};

export const quoteTxt = (value: string) =>
	value.startsWith('"') ? value : JSON.stringify(value);

export const unquoteTxt = (value: string) =>
	value.replace(/^"|"$/g, "").replace(/\\"/g, '"');

/** Formats `priority value` pairs (MX) from a single inline content string. */
export const parsePriorityValue = (value: string, fallbackPriority = 10) => {
	const match = /^(\d+)\s+(\S.*)$/.exec(value.trim());
	return match
		? { priority: Number(match[1]), value: match[2] as string }
		: { priority: fallbackPriority, value: value.trim() };
};

export const formatPriorityValue = (
	priority: number | undefined,
	value: string,
) => (priority != null ? `${priority} ${value}` : value);