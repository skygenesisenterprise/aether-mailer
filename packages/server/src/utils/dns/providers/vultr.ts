import type { vultrDnsConfigSchema } from "@notploy/server/db/schema";
import type { z } from "zod";
import {
	createDnsHttp,
	parsePriorityValue,
	stripTrailingDot,
	toSubdomain,
} from "../http";
import type { DnsClient, DnsRecordInput } from "../types";

type VultrConfig = z.infer<typeof vultrDnsConfigSchema>;

interface VultrZone {
	domain: string;
}

interface VultrRecord {
	RECORDID: string;
	type: string;
	name: string;
	data: string;
	priority?: number;
	ttl: number;
}

const API = "https://api.vultr.com/v2";

const client = (config: VultrConfig) =>
	createDnsHttp("Vultr", {
		baseUrl: API,
		headers: { Authorization: `Bearer ${config.apiKey.trim()}` },
	});

const toContent = (record: VultrRecord) =>
	record.type === "MX" && record.priority != null
		? `${record.priority} ${record.data}`
		: record.data;

const toPayloadFinal = (record: DnsRecordInput, zone: string) => {
	const base = {
		type: record.type,
		name: toSubdomain(record.name, zone),
		ttl: record.ttl ?? 300,
	};
	const value = record.content.trim();
	if (record.type === "MX") {
		const { priority, value: target } = parsePriorityValue(value, 10);
		return { ...base, data: target, priority };
	}
	return { ...base, data: value };
};

export const vultrClient: DnsClient<VultrConfig> = {
	async listZones(config) {
		const result = await client(config).get<{ domains: VultrZone[] }>(
			"/domains?per_page=500",
		);
		return (result.domains ?? []).map((zone) => ({
			id: stripTrailingDot(zone.domain),
			name: stripTrailingDot(zone.domain),
		}));
	},

	async listRecords(config, zoneId) {
		const result = await client(config).get<{ records: VultrRecord[] }>(
			`/domains/${encodeURIComponent(zoneId)}/records?per_page=500`,
		);
		return (result.records ?? []).map((record) => ({
			id: record.RECORDID,
			type: record.type,
			name: toFqdn(record.name, zoneId),
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
		const payload = toPayloadFinal(record, record.zoneId);
		if (match) {
			await client(config).patch(
				`/domains/${encodeURIComponent(record.zoneId)}/records/${encodeURIComponent(match.id)}`,
				payload,
			);
			return { id: match.id };
		}
		const created = await client(config).post<{ record: VultrRecord }>(
			`/domains/${encodeURIComponent(record.zoneId)}/records`,
			payload,
		);
		return { id: created.record.RECORDID };
	},

	async updateRecord(config, zoneId, recordId, record) {
		await client(config).patch(
			`/domains/${encodeURIComponent(zoneId)}/records/${encodeURIComponent(recordId)}`,
			toPayloadFinal({ ...record, zoneId }, zoneId),
		);
		return { id: recordId };
	},

	async deleteRecord(config, zoneId, recordId) {
		await client(config).delete(
			`/domains/${encodeURIComponent(zoneId)}/records/${encodeURIComponent(recordId)}`,
		);
	},

	async testConnection(config) {
		await client(config).get("/domains?per_page=1");
	},
};

const toFqdn = (name: string, zone: string) => {
	const zoneName = stripTrailingDot(zone);
	if (!name || name === "@") return zoneName;
	return name.endsWith(zoneName) ? name : `${name}.${zoneName}`;
};