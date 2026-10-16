import type { ns1DnsConfigSchema } from "@notploy/server/db/schema";
import type { z } from "zod";
import { createDnsHttp, stripTrailingDot } from "../http";
import type { DnsClient } from "../types";

type Ns1Config = z.infer<typeof ns1DnsConfigSchema>;

interface Ns1Zone {
	id: string;
	zone: string;
}

interface Ns1Record {
	id: string;
	domain: string;
	type: string;
	ttl: number;
	short_answers?: string[];
	answers?: { answer: string[] }[];
}

const API = "https://api.nsone.net/v1";

const client = (config: Ns1Config) =>
	createDnsHttp("NS1", {
		baseUrl: API,
		headers: { "X-NSONE-Key": config.apiKey.trim() },
	});

const answerValues = (record: Ns1Record) =>
	record.short_answers?.length
		? record.short_answers
		: (record.answers ?? []).flatMap((answer) => answer.answer ?? []);

export const ns1Client: DnsClient<Ns1Config> = {
	async listZones(config) {
		const zones = await client(config).get<Ns1Zone[]>("/zones");
		return (zones ?? []).map((zone) => ({
			id: stripTrailingDot(zone.zone),
			name: stripTrailingDot(zone.zone),
		}));
	},

	async listRecords(config, zoneId) {
		const records = await client(config).get<Ns1Record[]>(
			`/zones/${encodeURIComponent(zoneId)}`,
		);
		const flat: {
			id: string;
			type: string;
			name: string;
			content: string;
			ttl: number;
		}[] = [];
		for (const record of records ?? []) {
			if (!record.type) continue;
			for (const value of answerValues(record)) {
				flat.push({
					id: `${record.type}:${record.domain}`,
					type: record.type,
					name: stripTrailingDot(record.domain),
					content: value,
					ttl: record.ttl,
				});
			}
		}
		return flat;
	},

	async upsertRecord(config, record) {
		const values = record.content
			.split("\n")
			.map((value) => value.trim())
			.filter(Boolean);
		await client(config).post(
			`/zones/${encodeURIComponent(record.zoneId)}/${encodeURIComponent(record.type)}/${encodeURIComponent(stripTrailingDot(record.name))}`,
			{
				zone: record.zoneId,
				domain: stripTrailingDot(record.name),
				type: record.type,
				ttl: record.ttl ?? 300,
				answers: values.map((value) => ({ answer: [value] })),
			},
		);
		return { id: `${record.type}:${stripTrailingDot(record.name)}` };
	},

	async updateRecord(config, zoneId, recordId, record) {
		const [type, name] = recordId.split(":");
		await client(config).delete(
			`/zones/${encodeURIComponent(zoneId)}/${encodeURIComponent(type ?? "")}/${encodeURIComponent(name ?? "")}`,
		);
		return await this.upsertRecord(config, { ...record, zoneId });
	},

	async deleteRecord(config, zoneId, recordId) {
		const [type, name] = recordId.split(":");
		await client(config).delete(
			`/zones/${encodeURIComponent(zoneId)}/${encodeURIComponent(type ?? "")}/${encodeURIComponent(name ?? "")}`,
		);
	},

	async testConnection(config) {
		await client(config).get("/zones");
	},
};