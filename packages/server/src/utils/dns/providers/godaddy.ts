import type { godaddyDnsConfigSchema } from "@notploy/server/db/schema";
import type { z } from "zod";
import { createDnsHttp, stripTrailingDot, toSubdomain } from "../http";
import type { DnsClient, DnsRecordInput } from "../types";

type GoDaddyConfig = z.infer<typeof godaddyDnsConfigSchema>;

interface GoDaddyRecord {
	type: string;
	name: string;
	data: string;
	ttl: number;
	priority?: number;
	port?: number;
	weight?: number;
	protocol?: string;
	service?: string;
}

const API = "https://api.godaddy.com";

const client = (config: GoDaddyConfig) =>
	createDnsHttp("GoDaddy", {
		baseUrl: API,
		headers: {
			Authorization: `sso-key ${config.apiKey.trim()}:${config.apiSecret.trim()}`,
		},
	});

const toContent = (record: GoDaddyRecord) => {
	if (record.type === "MX" && record.priority != null) {
		return `${record.priority} ${record.data}`;
	}
	if (record.type === "SRV") {
		return `${record.priority ?? 0} ${record.weight ?? 0} ${record.port ?? 0} ${record.data}`;
	}
	return record.data;
};

const toPayload = (record: DnsRecordInput, zone: string) => {
	const value = record.content.trim();
	const base = {
		type: record.type,
		name: toSubdomain(record.name, zone),
		ttl: record.ttl ?? 600,
	};
	if (record.type === "MX") {
		const match = /^(\d+)\s+(\S.*)$/.exec(value);
		return match
			? { ...base, data: match[2] as string, priority: Number(match[1]) }
			: { ...base, data: value, priority: 10 };
	}
	if (record.type === "SRV") {
		const parts = value.split(/\s+/);
		const [priority, weight, port, target] = parts;
		if (parts.length !== 4 || !target) {
			throw new Error(
				`GoDaddy: an SRV value must be "priority weight port target", got "${value}"`,
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
	return { ...base, data: value };
};

const getRecords = async (
	config: GoDaddyConfig,
	zoneId: string,
	type: string,
	name: string,
) => {
	const subdomain = toSubdomain(name, zoneId) || "@";
	try {
		const records = await client(config).get<GoDaddyRecord[]>(
			`/v1/domains/${encodeURIComponent(zoneId)}/records/${encodeURIComponent(type)}/${encodeURIComponent(subdomain)}`,
		);
		return (records ?? []).map((entry) => ({
			type: entry.type,
			name: subdomain,
			data: entry.data,
			ttl: entry.ttl,
			...(entry.priority != null ? { priority: entry.priority } : {}),
			...(entry.weight != null ? { weight: entry.weight } : {}),
			...(entry.port != null ? { port: entry.port } : {}),
		}));
	} catch {
		return [];
	}
};

export const godaddyClient: DnsClient<GoDaddyConfig> = {
	async listZones(config) {
		const zones = await client(config).get<{ domain: string }[]>(
			"/v1/domains?limit=1000",
		);
		return (zones ?? []).map((zone) => ({
			id: stripTrailingDot(zone.domain),
			name: stripTrailingDot(zone.domain),
		}));
	},

	async listRecords(config, zoneId) {
		const records = await client(config).get<GoDaddyRecord[]>(
			`/v1/domains/${encodeURIComponent(zoneId)}/records`,
		);
		return (records ?? []).map((record) => ({
			id: `${record.type}:${record.name}`,
			type: record.type,
			name: record.name === "@" ? zoneId : `${record.name}.${zoneId}`,
			content: toContent(record),
			ttl: record.ttl,
		}));
	},

	async upsertRecord(config, record) {
		const existing = await getRecords(config, record.zoneId, record.type, record.name);
		const payload = toPayload(record, record.zoneId);
		await client(config).put(
			`/v1/domains/${encodeURIComponent(record.zoneId)}/records/${encodeURIComponent(record.type)}/${encodeURIComponent(toSubdomain(record.name, record.zoneId) || "@")}`,
			[...existing, payload],
		);
		return { id: `${record.type}:${toSubdomain(record.name, record.zoneId) || "@"}` };
	},

	async updateRecord(config, zoneId, recordId, record) {
		const [type, name] = recordId.split(":");
		await client(config).put(
			`/v1/domains/${encodeURIComponent(zoneId)}/records/${encodeURIComponent(type ?? "")}/${encodeURIComponent(name ?? "@")}`,
			[toPayload({ ...record, zoneId }, zoneId)],
		);
		return { id: recordId };
	},

	async deleteRecord(config, zoneId, recordId) {
		const [type, name] = recordId.split(":");
		await client(config).delete(
			`/v1/domains/${encodeURIComponent(zoneId)}/records/${encodeURIComponent(type ?? "")}/${encodeURIComponent(name ?? "@")}`,
		);
	},

	async testConnection(config) {
		await client(config).get("/v1/domains?limit=1");
	},
};