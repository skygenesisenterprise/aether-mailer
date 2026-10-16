import type { technitiumDnsConfigSchema } from "@notploy/server/db/schema";
import type { z } from "zod";
import { type DnsClient, dnsFetch } from "./types";

type TechnitiumConfig = z.infer<typeof technitiumDnsConfigSchema>;

interface TechnitiumResponse {
	status: "ok" | "error";
	errorMessage?: string;
	response?: {
		zones?: {
			name: string;
			type: string;
			internal?: boolean;
			disabled?: boolean;
		}[];
		records?: {
			name: string;
			type: string;
			ttl: number;
			rData?: { [key: string]: unknown };
			disabled?: boolean;
		}[];
	};
}

const stripTrailingDot = (name: string) => name.replace(/\.$/, "");

const buildRecordId = (type: string, name: string) =>
	`${type}:${stripTrailingDot(name)}`;

const parseRecordId = (id: string) => {
	const separatorIndex = id.indexOf(":");
	if (separatorIndex === -1) {
		throw new Error(`Technitium: invalid record id "${id}"`);
	}
	return {
		type: id.slice(0, separatorIndex),
		name: id.slice(separatorIndex + 1),
	};
};

/**
 * Technitium returns each record as structured rData. A single logical record
 * is split into one row per value so it lines up with the other adapters.
 */
const formatContent = (record: {
	type: string;
	rData?: { [key: string]: unknown };
}) => {
	const rData = record.rData ?? {};
	switch (record.type) {
		case "A":
		case "AAAA":
		case "CNAME":
		case "PTR":
		case "NS":
			return String(rData.ipAddress ?? rData.cname ?? rData.ptrName ?? "");
		case "MX":
			return `${rData.preference ?? 10} ${rData.exchange ?? ""}`.trim();
		case "TXT":
			return String(rData.text ?? "");
		case "SRV":
			return `${rData.priority ?? 0} ${rData.weight ?? 0} ${rData.port ?? 0} ${rData.target ?? ""}`;
		case "CAA":
			return `${rData.flags ?? 0} ${rData.tag ?? ""} "${rData.value ?? ""}"`;
		default:
			return JSON.stringify(rData);
	}
};

const buildRData = (type: string, content: string) => {
	const value = content.trim();
	switch (type) {
		case "A":
		case "AAAA":
			return { ipAddress: value };
		case "CNAME":
			return { cname: value };
		case "PTR":
			return { ptrName: value };
		case "NS":
			return { nameServer: value };
		case "MX": {
			const match = /^(\d+)\s+(\S.*)$/.exec(value);
			return match
				? { preference: Number(match[1]), exchange: match[2] }
				: { preference: 10, exchange: value };
		}
		case "TXT":
			return { text: value };
		case "SRV": {
			const parts = value.split(/\s+/);
			const [priority, weight, port, target] = parts;
			if (parts.length !== 4 || !target) {
				throw new Error(
					`Technitium: an SRV value must be "priority weight port target", got "${value}"`,
				);
			}
			return {
				priority: Number(priority),
				weight: Number(weight),
				port: Number(port),
				target,
			};
		}
		case "CAA": {
			const match = /^(\d+)\s+(\S+)\s+"?([^"]+)"?$/.exec(value);
			if (!match) {
				throw new Error(
					`Technitium: a CAA value must be \`flags tag "value"\`, got "${value}"`,
				);
			}
			return {
				flags: Number(match[1]),
				tag: match[2],
				value: match[3],
			};
		}
		default:
			throw new Error(`Technitium: unsupported record type ${type}`);
	}
};

const technitiumFetch = async (
	config: TechnitiumConfig,
	path: string,
	params: Record<string, string> = {},
	init: RequestInit = {},
): Promise<TechnitiumResponse["response"]> => {
	const base = config.apiUrl.replace(/\/+$/, "");
	const search = new URLSearchParams({ token: config.apiToken.trim(), ...params });
	const response = await dnsFetch(`${base}${path}?${search.toString()}`, init);

	const body = (await response.json()) as TechnitiumResponse;
	if (!response.ok || body.status !== "ok") {
		throw new Error(
			`Technitium: request to ${path} failed${
				body.errorMessage ? `: ${body.errorMessage}` : ` (status ${response.status})`
			}`,
		);
	}
	return body.response;
};

export const technitiumClient: DnsClient<TechnitiumConfig> = {
	async listZones(config) {
		const response = await technitiumFetch(config, "/api/zones/list");
		return (response?.zones ?? [])
			.filter((zone) => !zone.disabled)
			.map((zone) => ({
				id: stripTrailingDot(zone.name),
				name: stripTrailingDot(zone.name),
			}));
	},

	async listRecords(config, zoneId) {
		const response = await technitiumFetch(config, "/api/zones/records/get", {
			domain: stripTrailingDot(zoneId),
			listZone: "true",
		});
		const records: {
			id: string;
			type: string;
			name: string;
			content: string;
			ttl: number;
		}[] = [];
		for (const record of response?.records ?? []) {
			if (record.disabled) continue;
			const content = formatContent(record);
			if (!content) continue;
			records.push({
				id: buildRecordId(record.type, record.name),
				type: record.type,
				name: stripTrailingDot(record.name),
				content,
				ttl: record.ttl,
			});
		}
		return records;
	},

	async upsertRecord(config, record) {
		// Technitium replaces the whole rrset for a name/type, so merge the
		// existing values with the new one first.
		const existing = await this.listRecords(config, record.zoneId);
		const values = new Set(
			existing
				.filter(
					(entry) =>
						entry.type === record.type &&
						entry.name === stripTrailingDot(record.name),
				)
				.map((entry) => entry.content),
		);
		values.add(record.content.trim());

		for (const value of values) {
			await technitiumFetch(config, "/api/zones/records/add", {
				domain: stripTrailingDot(record.name),
				type: record.type,
				ttl: String(record.ttl ?? 300),
				...Object.fromEntries(
					Object.entries(buildRData(record.type, value)).map(([key, val]) => [
						key,
						String(val),
					]),
				),
			});
		}
		return { id: buildRecordId(record.type, record.name) };
	},

	async updateRecord(config, zoneId, recordId, record) {
		const previous = parseRecordId(recordId);
		await technitiumFetch(config, "/api/zones/records/delete", {
			domain: stripTrailingDot(previous.name),
			type: previous.type,
		});
		await this.upsertRecord(config, {
			zoneId,
			type: record.type,
			name: record.name,
			content: record.content,
			ttl: record.ttl,
		});
		return { id: buildRecordId(record.type, record.name) };
	},

	async deleteRecord(config, zoneId, recordId) {
		const { type, name } = parseRecordId(recordId);
		await technitiumFetch(config, "/api/zones/records/delete", {
			domain: stripTrailingDot(name),
			type,
		});
	},

	async testConnection(config) {
		await technitiumFetch(config, "/api/zones/list");
	},
};

