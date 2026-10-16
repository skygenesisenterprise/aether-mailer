import type { hetznerDnsConfigSchema } from "@notploy/server/db/schema";
import type { z } from "zod";
import { createDnsHttp, stripTrailingDot, toSubdomain } from "../http";
import type { DnsClient } from "../types";

type HetznerConfig = z.infer<typeof hetznerDnsConfigSchema>;

interface HetznerZone {
	id: string;
	name: string;
}

interface HetznerRecord {
	id: string;
	type: string;
	name: string;
	value: string;
	ttl: number | null;
}

const API = "https://dns.hetzner.com/api/v1";

const client = (config: HetznerConfig) =>
	createDnsHttp("Hetzner", {
		baseUrl: API,
		headers: { "Auth-API-Token": config.apiToken.trim() },
	});

export const hetznerClient: DnsClient<HetznerConfig> = {
	async listZones(config) {
		const result = await client(config).get<{ zones: HetznerZone[] }>("/zones");
		return (result.zones ?? []).map((zone) => ({
			id: zone.id,
			name: stripTrailingDot(zone.name),
		}));
	},

	async listRecords(config, zoneId) {
		const result = await client(config).get<{ records: HetznerRecord[] }>(
			`/records?zone_id=${encodeURIComponent(zoneId)}`,
		);
		return (result.records ?? []).map((record) => ({
			id: record.id,
			type: record.type,
			name: record.name,
			content: record.value,
			ttl: record.ttl ?? 300,
		}));
	},

	async upsertRecord(config, record) {
		const zone = await client(config).get<{ zone: HetznerZone }>(
			`/zones/${encodeURIComponent(record.zoneId)}`,
		);
		const existing = await this.listRecords(config, record.zoneId);
		const target = toSubdomain(record.name, zone.zone.name);
		const match = existing.find(
			(entry) =>
				entry.type === record.type && toSubdomain(entry.name, zone.zone.name) === target,
		);
		const payload = {
			zone_id: record.zoneId,
			type: record.type,
			name: target,
			value: record.content.trim(),
			ttl: record.ttl ?? 300,
		};
		if (match) {
			await client(config).put(
				`/records/${encodeURIComponent(match.id)}`,
				payload,
			);
			return { id: match.id };
		}
		const created = await client(config).post<{ record: HetznerRecord }>(
			"/records",
			payload,
		);
		return { id: created.record.id };
	},

	async updateRecord(config, zoneId, recordId, record) {
		const zone = await client(config).get<{ zone: HetznerZone }>(
			`/zones/${encodeURIComponent(zoneId)}`,
		);
		await client(config).put(`/records/${encodeURIComponent(recordId)}`, {
			zone_id: zoneId,
			type: record.type,
			name: toSubdomain(record.name, zone.zone.name),
			value: record.content.trim(),
			ttl: record.ttl ?? 300,
		});
		return { id: recordId };
	},

	async deleteRecord(config, _zoneId, recordId) {
		await client(config).delete(`/records/${encodeURIComponent(recordId)}`);
	},

	async testConnection(config) {
		await client(config).get("/zones");
	},
};