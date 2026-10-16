import type { linodeDnsConfigSchema } from "@notploy/server/db/schema";
import type { z } from "zod";
import {
	createDnsHttp,
	parsePriorityValue,
	stripTrailingDot,
	toSubdomain,
} from "../http";
import type { DnsClient, DnsRecordInput } from "../types";

type LinodeConfig = z.infer<typeof linodeDnsConfigSchema>;

interface LinodeDomain {
	id: number;
	domain: string;
}

interface LinodeRecord {
	id: number;
	type: string;
	name: string;
	target: string;
	priority: number;
	ttl_sec: number;
}

const API = "https://api.linode.com/v4";

const client = (config: LinodeConfig) =>
	createDnsHttp("Linode", {
		baseUrl: API,
		headers: { Authorization: `Bearer ${config.apiToken.trim()}` },
	});

const toContent = (record: LinodeRecord) =>
	record.type === "MX"
		? `${record.priority ?? 10} ${record.target}`
		: record.target;

const toPayload = (record: DnsRecordInput, zone: string) => {
	const base = {
		type: record.type,
		name: toSubdomain(record.name, zone),
		ttl_sec: record.ttl ?? 300,
	};
	const value = record.content.trim();
	if (record.type === "MX") {
		const { priority, value: target } = parsePriorityValue(value, 10);
		return { ...base, target, priority };
	}
	return { ...base, target: value };
};

export const linodeClient: DnsClient<LinodeConfig> = {
	async listZones(config) {
		const result = await client(config).get<{
			data: LinodeDomain[];
			pages: number;
		}>("/domains?page_size=500");
		return (result.data ?? []).map((domain) => ({
			id: String(domain.id),
			name: stripTrailingDot(domain.domain),
		}));
	},

	async listRecords(config, zoneId) {
		const result = await client(config).get<{
			data: LinodeRecord[];
		}>(`/domains/${encodeURIComponent(zoneId)}/records?page_size=500`);
		return (result.data ?? []).map((record) => ({
			id: String(record.id),
			type: record.type,
			name: record.name || zoneId,
			content: toContent(record),
			ttl: record.ttl_sec,
		}));
	},

	async upsertRecord(config, record) {
		const zone = await client(config).get<LinodeDomain>(
			`/domains/${encodeURIComponent(record.zoneId)}`,
		);
		const existing = await this.listRecords(config, record.zoneId);
		const name = toSubdomain(record.name, zone.domain);
		const match = existing.find(
			(entry) =>
				entry.type === record.type &&
				toSubdomain(entry.name, zone.domain) === name,
		);
		const payload = toPayload(record, zone.domain);
		if (match) {
			await client(config).put(
				`/domains/${encodeURIComponent(record.zoneId)}/records/${encodeURIComponent(match.id)}`,
				payload,
			);
			return { id: match.id };
		}
		const created = await client(config).post<LinodeRecord>(
			`/domains/${encodeURIComponent(record.zoneId)}/records`,
			payload,
		);
		return { id: String(created.id) };
	},

	async updateRecord(config, zoneId, recordId, record) {
		const zone = await client(config).get<LinodeDomain>(
			`/domains/${encodeURIComponent(zoneId)}`,
		);
		await client(config).put(
			`/domains/${encodeURIComponent(zoneId)}/records/${encodeURIComponent(recordId)}`,
			toPayload({ ...record, zoneId }, zone.domain),
		);
		return { id: recordId };
	},

	async deleteRecord(config, zoneId, recordId) {
		await client(config).delete(
			`/domains/${encodeURIComponent(zoneId)}/records/${encodeURIComponent(recordId)}`,
		);
	},

	async testConnection(config) {
		await client(config).get("/domains?page_size=1");
	},
};