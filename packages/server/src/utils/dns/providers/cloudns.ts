import type { cloudnsDnsConfigSchema } from "@notploy/server/db/schema";
import type { z } from "zod";
import { createDnsHttp, stripTrailingDot, toSubdomain } from "../http";
import type { DnsClient } from "../types";

type ClouDnsConfig = z.infer<typeof cloudnsDnsConfigSchema>;

interface ClouDnsRecord {
	id: string;
	host: string;
	type: string;
	record: string;
	ttl: string;
	priority?: string;
}

const API = "https://api.cloudns.net";

const client = (config: ClouDnsConfig) =>
	createDnsHttp("ClouDNS", { baseUrl: API });

const authParams = (config: ClouDnsConfig) => ({
	"auth-id": config.authId.trim(),
	"auth-password": config.authPassword.trim(),
	...(config.subAuthId ? { "sub-auth-id": config.subAuthId.trim() } : {}),
});

const toContent = (record: ClouDnsRecord) =>
	(record.type === "MX" || record.type === "SRV") && record.priority
		? `${record.priority} ${record.record}`
		: record.record;

export const cloudnsClient: DnsClient<ClouDnsConfig> = {
	async listZones(config) {
		const search = new URLSearchParams({
			...authParams(config),
			"page-size": "100",
		});
		const zones = await client(config).get<Record<string, { name: string }>>(
			`/dns/list-zones.json?${search.toString()}`,
		);
		return Object.values(zones ?? {}).map((zone) => ({
			id: stripTrailingDot(zone.name),
			name: stripTrailingDot(zone.name),
		}));
	},

	async listRecords(config, zoneId) {
		const search = new URLSearchParams({
			...authParams(config),
			"domain-name": stripTrailingDot(zoneId),
			"host-type": "",
			"rows-per-page": "100",
		});
		const records = await client(config).get<Record<string, ClouDnsRecord>>(
			`/dns/records.json?${search.toString()}`,
		);
		return Object.values(records ?? {}).map((record) => ({
			id: record.id,
			type: record.type,
			name: record.host === "@" ? zoneId : `${record.host}.${zoneId}`,
			content: toContent(record),
			ttl: Number(record.ttl),
		}));
	},

	async upsertRecord(config, record) {
		const subdomain = toSubdomain(record.name, record.zoneId) || "@";
		const value = record.content.trim();
		const match = record.type === "MX" ? /^(\d+)\s+(\S.*)$/.exec(value) : null;
		const params: Record<string, string> = {
			...authParams(config),
			"domain-name": stripTrailingDot(record.zoneId),
			host: subdomain,
			"record-type": record.type,
			record: match ? (match[2] as string) : value,
			ttl: String(record.ttl ?? 3600),
			...(match ? { priority: match[1] as string } : {}),
		};
		const existing = await this.listRecords(config, record.zoneId);
		const found = existing.find(
			(entry) =>
				entry.type === record.type &&
				toSubdomain(entry.name, record.zoneId) === subdomain,
		);
		if (found) {
			params["record-id"] = found.id;
			await client(config).post("/dns/mod-record.json", params);
			return { id: found.id };
		}
		const created = await client(config).post<{ data?: { id?: string } }>(
			"/dns/add-record.json",
			params,
		);
		return { id: created?.data?.id ?? `${record.type}:${subdomain}` };
	},

	async updateRecord(config, zoneId, recordId, record) {
		const value = record.content.trim();
		const match = record.type === "MX" ? /^(\d+)\s+(\S.*)$/.exec(value) : null;
		await client(config).post("/dns/mod-record.json", {
			...authParams(config),
			"domain-name": stripTrailingDot(zoneId),
			"record-id": recordId,
			host: toSubdomain(record.name, zoneId) || "@",
			"record-type": record.type,
			record: match ? (match[2] as string) : value,
			ttl: String(record.ttl ?? 3600),
			...(match ? { priority: match[1] as string } : {}),
		});
		return { id: recordId };
	},

	async deleteRecord(config, zoneId, recordId) {
		const search = new URLSearchParams({
			...authParams(config),
			"domain-name": stripTrailingDot(zoneId),
			"record-id": recordId,
		});
		await client(config).post(
			`/dns/delete-record.json?${search.toString()}`,
			{},
		);
	},

	async testConnection(config) {
		const search = new URLSearchParams({
			...authParams(config),
			"page-size": "1",
		});
		await client(config).get(`/dns/list-zones.json?${search.toString()}`);
	},
};