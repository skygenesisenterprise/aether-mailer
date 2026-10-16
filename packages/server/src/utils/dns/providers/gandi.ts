import type { gandiDnsConfigSchema } from "@notploy/server/db/schema";
import type { z } from "zod";
import { createDnsHttp, stripTrailingDot, toSubdomain } from "../http";
import type { DnsClient, DnsRecordInput } from "../types";

type GandiConfig = z.infer<typeof gandiDnsConfigSchema>;

interface GandiDomain {
	fqdn: string;
}

interface GandiRrset {
	rrset_name: string;
	rrset_type: string;
	rrset_ttl: number;
	rrset_values: string[];
}

const API = "https://api.gandi.net/v5/livedns";

const client = (config: GandiConfig) =>
	createDnsHttp("Gandi", {
		baseUrl: API,
		headers: {
			Authorization: `Apikey ${config.apiKey.trim()}`,
			...(config.sharingId ? { "X-Sharing-Id": config.sharingId } : {}),
		},
	});

const buildValues = (record: DnsRecordInput) =>
	record.content
		.split("\n")
		.map((value) => value.trim())
		.filter(Boolean);

export const gandiClient: DnsClient<GandiConfig> = {
	async listZones(config) {
		const domains = await client(config).get<GandiDomain[]>("/domains");
		return (domains ?? []).map((domain) => ({
			id: stripTrailingDot(domain.fqdn),
			name: stripTrailingDot(domain.fqdn),
		}));
	},

	async listRecords(config, zoneId) {
		const rrsets = await client(config).get<GandiRrset[]>(
			`/domains/${encodeURIComponent(zoneId)}/records`,
		);
		const records: {
			id: string;
			type: string;
			name: string;
			content: string;
			ttl: number;
		}[] = [];
		for (const rrset of rrsets ?? []) {
			const name =
				rrset.rrset_name === "@" || rrset.rrset_name === ""
					? zoneId
					: `${rrset.rrset_name}.${zoneId}`;
			for (const value of rrset.rrset_values ?? []) {
				records.push({
					id: `${rrset.rrset_type}:${rrset.rrset_name}`,
					type: rrset.rrset_type,
					name: stripTrailingDot(name),
					content: value,
					ttl: rrset.rrset_ttl,
				});
			}
		}
		return records;
	},

	async upsertRecord(config, record) {
		const subdomain = toSubdomain(record.name, record.zoneId) || "@";
		await client(config).put(
			`/domains/${encodeURIComponent(record.zoneId)}/records/${encodeURIComponent(subdomain)}/${encodeURIComponent(record.type)}`,
			{
				rrset_ttl: record.ttl ?? 300,
				rrset_values: buildValues(record),
			},
		);
		return { id: `${record.type}:${subdomain}` };
	},

	async updateRecord(config, zoneId, recordId, record) {
		const [type, name] = recordId.split(":");
		if (name) {
			await client(config).delete(
				`/domains/${encodeURIComponent(zoneId)}/records/${encodeURIComponent(name)}/${encodeURIComponent(type as string)}`,
			);
		}
		return await this.upsertRecord(config, { ...record, zoneId });
	},

	async deleteRecord(config, zoneId, recordId) {
		const [type, name] = recordId.split(":");
		await client(config).delete(
			`/domains/${encodeURIComponent(zoneId)}/records/${encodeURIComponent(name ?? "@")}/${encodeURIComponent(type ?? "")}`,
		);
	},

	async testConnection(config) {
		await client(config).get("/domains");
	},
};