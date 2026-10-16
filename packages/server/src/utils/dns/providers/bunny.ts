import type { bunnyDnsConfigSchema } from "@notploy/server/db/schema";
import type { z } from "zod";
import { createDnsHttp, stripTrailingDot, toSubdomain } from "../http";
import type { DnsClient } from "../types";

type BunnyConfig = z.infer<typeof bunnyDnsConfigSchema>;

interface BunnyZone {
	Id: number;
	Name: string;
}

interface BunnyRecord {
	Id: number;
	Type: number;
	Name: string;
	Value: string;
	Ttl: number;
	Priority?: number;
}

/** Bunny numbers record types instead of using their names. */
const TYPE_TO_ID: Record<string, number> = {
	A: 0,
	AAAA: 1,
	CNAME: 2,
	TXT: 3,
	MX: 4,
	SRV: 5,
	CAA: 8,
	NS: 9,
	PTR: 10,
};

const ID_TO_TYPE = Object.fromEntries(
	Object.entries(TYPE_TO_ID).map(([name, id]) => [id, name]),
) as Record<number, string>;

const API = "https://api.bunny.net";

const client = (config: BunnyConfig) =>
	createDnsHttp("Bunny", {
		baseUrl: API,
		headers: { AccessKey: config.apiKey.trim() },
	});

const toContent = (record: BunnyRecord) => {
	const type = ID_TO_TYPE[record.Type];
	if ((type === "MX" || type === "SRV") && record.Priority != null) {
		return `${record.Priority} ${record.Value}`;
	}
	return record.Value;
};

export const bunnyClient: DnsClient<BunnyConfig> = {
	async listZones(config) {
		const zones = await client(config).get<BunnyZone[]>(
			"/dnszone?page=1&perPage=1000",
		);
		return (zones ?? []).map((zone) => ({
			id: String(zone.Id),
			name: stripTrailingDot(zone.Name),
		}));
	},

	async listRecords(config, zoneId) {
		const records = await client(config).get<BunnyRecord[]>(
			`/dnszone/${encodeURIComponent(zoneId)}/records`,
		);
		return (records ?? []).map((record) => ({
			id: String(record.Id),
			type: ID_TO_TYPE[record.Type] ?? String(record.Type),
			name: record.Name === "" ? zoneId : record.Name,
			content: toContent(record),
			ttl: record.Ttl,
		}));
	},

	async upsertRecord(config, record) {
		const zone = await client(config).get<BunnyZone>(
			`/dnszone/${encodeURIComponent(record.zoneId)}`,
		);
		const existing = await this.listRecords(config, record.zoneId);
		const name = toSubdomain(record.name, zone.Name);
		const match = existing.find(
			(entry) =>
				entry.type === record.type &&
				toSubdomain(entry.name, zone.Name) === name,
		);
		const payload = {
			Type: TYPE_TO_ID[record.type],
			Name: name,
			Value: record.content.trim(),
			Ttl: record.ttl ?? 300,
		};
		if (payload.Type === undefined) {
			throw new Error(`Bunny: unsupported record type ${record.type}`);
		}
		if (match) {
			await client(config).post(
				`/dnszone/${encodeURIComponent(record.zoneId)}/records/${encodeURIComponent(match.id)}`,
				payload,
			);
			return { id: match.id };
		}
		const created = await client(config).put<BunnyRecord>(
			`/dnszone/${encodeURIComponent(record.zoneId)}/records`,
			payload,
		);
		return { id: String(created.Id) };
	},

	async updateRecord(config, zoneId, recordId, record) {
		const zone = await client(config).get<BunnyZone>(
			`/dnszone/${encodeURIComponent(zoneId)}`,
		);
		const type = TYPE_TO_ID[record.type];
		if (type === undefined) {
			throw new Error(`Bunny: unsupported record type ${record.type}`);
		}
		await client(config).post(
			`/dnszone/${encodeURIComponent(zoneId)}/records/${encodeURIComponent(recordId)}`,
			{
				Type: type,
				Name: toSubdomain(record.name, zone.Name),
				Value: record.content.trim(),
				Ttl: record.ttl ?? 300,
			},
		);
		return { id: recordId };
	},

	async deleteRecord(config, zoneId, recordId) {
		await client(config).delete(
			`/dnszone/${encodeURIComponent(zoneId)}/records/${encodeURIComponent(recordId)}`,
		);
	},

	async testConnection(config) {
		await client(config).get("/dnszone?page=1&perPage=1");
	},
};