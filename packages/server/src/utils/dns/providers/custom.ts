import type { customDnsConfigSchema } from "@notploy/server/db/schema";
import type { z } from "zod";
import { createDnsHttp, stripTrailingDot } from "../http";
import type { DnsClient } from "../types";

type CustomConfig = z.infer<typeof customDnsConfigSchema>;

interface CustomZone {
	id?: string;
	name: string;
}

interface CustomRecord {
	id: string;
	type: string;
	name: string;
	content: string;
	ttl?: number;
}

/**
 * Contract for organizations with their own DNS platform. Notploy does not need
 * to know the product natively — only this small documented interface:
 *
 *   GET    /zones
 *   GET    /zones/{zoneId}/records
 *   POST   /zones/{zoneId}/records
 *   PUT    /zones/{zoneId}/records/{recordId}
 *   DELETE /zones/{zoneId}/records/{recordId}
 *
 * Responses are JSON. Zones are `{ id?, name }` and records
 * `{ id, type, name, content, ttl? }`.
 */
const client = (config: CustomConfig) =>
	createDnsHttp("Custom DNS", {
		baseUrl: config.baseUrl,
		headers: {
			Authorization: `Bearer ${config.apiToken.trim()}`,
			...(config.allowInsecureTls ? {} : {}),
		},
	});

const unwrap = <T>(value: T | { data: T }): T =>
	value && typeof value === "object" && "data" in (value as object)
		? (value as { data: T }).data
		: (value as T);

export const customClient: DnsClient<CustomConfig> = {
	async listZones(config) {
		const response = await client(config).get<
			CustomZone[] | { data: CustomZone[] }
		>("/zones");
		return unwrap(response)
			.filter((zone) => !!zone?.name)
			.map((zone) => ({
				id: zone.id ?? stripTrailingDot(zone.name),
				name: stripTrailingDot(zone.name),
			}));
	},

	async listRecords(config, zoneId) {
		const response = await client(config).get<
			CustomRecord[] | { data: CustomRecord[] }
		>(`/zones/${encodeURIComponent(zoneId)}/records`);
		return unwrap(response)
			.filter((record) => !!record?.id)
			.map((record) => ({
				id: record.id,
				type: record.type,
				name: stripTrailingDot(record.name),
				content: record.content,
				ttl: record.ttl ?? 300,
			}));
	},

	async upsertRecord(config, record) {
		const existing = await this.listRecords(config, record.zoneId);
		const match = existing.find(
			(entry) =>
				entry.type === record.type &&
				stripTrailingDot(entry.name) === stripTrailingDot(record.name),
		);
		const payload = {
			type: record.type,
			name: stripTrailingDot(record.name),
			content: record.content,
			ttl: record.ttl ?? 300,
		};
		if (match) {
			await client(config).put(
				`/zones/${encodeURIComponent(record.zoneId)}/records/${encodeURIComponent(match.id)}`,
				payload,
			);
			return { id: match.id };
		}
		const created = await client(config).post<
			CustomRecord | { data: CustomRecord }
		>(`/zones/${encodeURIComponent(record.zoneId)}/records`, payload);
		return { id: unwrap(created).id };
	},

	async updateRecord(config, zoneId, recordId, record) {
		await client(config).put(
			`/zones/${encodeURIComponent(zoneId)}/records/${encodeURIComponent(recordId)}`,
			{
				type: record.type,
				name: stripTrailingDot(record.name),
				content: record.content,
				ttl: record.ttl ?? 300,
			},
		);
		return { id: recordId };
	},

	async deleteRecord(config, zoneId, recordId) {
		await client(config).delete(
			`/zones/${encodeURIComponent(zoneId)}/records/${encodeURIComponent(recordId)}`,
		);
	},

	async testConnection(config) {
		await client(config).get("/zones");
	},
};