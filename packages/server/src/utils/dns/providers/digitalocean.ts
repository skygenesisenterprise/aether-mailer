import type { digitaloceanDnsConfigSchema } from "@notploy/server/db/schema";
import type { z } from "zod";
import {
	createDnsHttp,
	parsePriorityValue,
	stripTrailingDot,
	toSubdomain,
} from "../http";
import type { DnsClient, DnsRecordInput } from "../types";

type DigitalOceanConfig = z.infer<typeof digitaloceanDnsConfigSchema>;

interface DoDomain {
	name: string;
}

interface DoRecord {
	id: number;
	type: string;
	name: string;
	data: string;
	priority: number | null;
	port: number | null;
	weight: number | null;
	flags: number | null;
	tag: string | null;
	ttl: number;
}

const API = "https://api.digitalocean.com";

const client = (config: DigitalOceanConfig) =>
	createDnsHttp("DigitalOcean", {
		baseUrl: API,
		headers: { Authorization: `Bearer ${config.apiToken.trim()}` },
	});

/** DigitalOcean splits structured records across dedicated fields. */
const toContent = (record: DoRecord) => {
	switch (record.type) {
		case "MX":
			return `${record.priority ?? 10} ${record.data}`;
		case "SRV":
			return `${record.priority ?? 0} ${record.weight ?? 0} ${record.port ?? 0} ${record.data}`;
		case "CAA":
			return `${record.flags ?? 0} ${record.tag ?? ""} "${record.data}"`;
		default:
			return record.data;
	}
};

const toPayload = (record: DnsRecordInput, zone: string) => {
	const base = {
		type: record.type,
		name: toSubdomain(record.name, zone),
		ttl: record.ttl ?? 1800,
	};
	const value = record.content.trim();
	switch (record.type) {
		case "MX": {
			const { priority, value: target } = parsePriorityValue(value, 10);
			return { ...base, data: target, priority };
		}
		case "SRV": {
			const parts = value.split(/\s+/);
			const [priority, weight, port, target] = parts;
			if (parts.length !== 4 || !target) {
				throw new Error(
					`DigitalOcean: an SRV value must be "priority weight port target", got "${value}"`,
				);
			}
			return {
				...base,
				data: target,
				priority: Number(priority),
				weight: Number(weight),
				port: Number(port),
			};
		}
		case "CAA": {
			const match = /^(\d+)\s+(\S+)\s+"?([^"]+)"?$/.exec(value);
			if (!match) {
				throw new Error(
					`DigitalOcean: a CAA value must be \`flags tag "value"\`, got "${value}"`,
				);
			}
			return {
				...base,
				flags: Number(match[1]),
				tag: match[2] as string,
				data: match[3] as string,
			};
		}
		default:
			return { ...base, data: value };
	}
};

export const digitaloceanClient: DnsClient<DigitalOceanConfig> = {
	async listZones(config) {
		const result = await client(config).get<{ domains: DoDomain[] }>(
			"/v2/domains?per_page=200",
		);
		return (result.domains ?? []).map((domain) => ({
			id: stripTrailingDot(domain.name),
			name: stripTrailingDot(domain.name),
		}));
	},

	async listRecords(config, zoneId) {
		const result = await client(config).get<{ domain_records: DoRecord[] }>(
			`/v2/domains/${encodeURIComponent(zoneId)}/records?per_page=200`,
		);
		return (result.domain_records ?? []).map((record) => ({
			id: String(record.id),
			type: record.type,
			name: `${toFqdnName(record.name, zoneId)}`,
			content: toContent(record),
			ttl: record.ttl,
		}));
	},

	async upsertRecord(config, record) {
		const existing = await this.listRecords(config, record.zoneId);
		const name = toSubdomain(record.name, record.zoneId);
		const match = existing.find(
			(entry) =>
				entry.type === record.type &&
				toSubdomain(entry.name, record.zoneId) === name,
		);
		const payload = toPayload(record, record.zoneId);
		if (match) {
			await client(config).put(
				`/v2/domains/${encodeURIComponent(record.zoneId)}/records/${encodeURIComponent(match.id)}`,
				payload,
			);
			return { id: match.id };
		}
		const created = await client(config).post<{ domain_record: DoRecord }>(
			`/v2/domains/${encodeURIComponent(record.zoneId)}/records`,
			payload,
		);
		return { id: String(created.domain_record.id) };
	},

	async updateRecord(config, zoneId, recordId, record) {
		await client(config).put(
			`/v2/domains/${encodeURIComponent(zoneId)}/records/${encodeURIComponent(recordId)}`,
			toPayload({ ...record, zoneId }, zoneId),
		);
		return { id: recordId };
	},

	async deleteRecord(config, zoneId, recordId) {
		await client(config).delete(
			`/v2/domains/${encodeURIComponent(zoneId)}/records/${encodeURIComponent(recordId)}`,
		);
	},

	async testConnection(config) {
		await client(config).get("/v2/domains?per_page=1");
	},
};

const toFqdnName = (name: string, zone: string) => {
	const zoneName = stripTrailingDot(zone);
	if (!name || name === "@") return zoneName;
	return name.endsWith(zoneName) ? name : `${name}.${zoneName}`;
};