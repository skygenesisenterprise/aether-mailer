import type { desecDnsConfigSchema } from "@notploy/server/db/schema";
import type { z } from "zod";
import { createDnsHttp, stripTrailingDot, toSubdomain } from "../http";
import type { DnsClient } from "../types";

type DesecConfig = z.infer<typeof desecDnsConfigSchema>;

interface DesecDomain {
	name: string;
}

interface DesecRrset {
	subname: string;
	type: string;
	ttl: number;
	records: string[];
}

const API = "https://desec.io/api/v1";

const client = (config: DesecConfig) =>
	createDnsHttp("deSEC", {
		baseUrl: API,
		headers: { Authorization: `Token ${config.apiToken.trim()}` },
	});

export const desecClient: DnsClient<DesecConfig> = {
	async listZones(config) {
		const domains = await client(config).get<DesecDomain[]>("/domains/");
		return (domains ?? []).map((domain) => ({
			id: stripTrailingDot(domain.name),
			name: stripTrailingDot(domain.name),
		}));
	},

	async listRecords(config, zoneId) {
		const rrsets = await client(config).get<DesecRrset[]>(
			`/domains/${encodeURIComponent(zoneId)}/rrsets/`,
		);
		const records: {
			id: string;
			type: string;
			name: string;
			content: string;
			ttl: number;
		}[] = [];
		for (const rrset of rrsets ?? []) {
			const subname = rrset.subname ?? "";
			const name = subname ? `${subname}.${zoneId}` : zoneId;
			for (const value of rrset.records ?? []) {
				records.push({
					id: `${rrset.type}:${subname}`,
					type: rrset.type,
					name: stripTrailingDot(name),
					content: value,
					ttl: rrset.ttl,
				});
			}
		}
		return records;
	},

	async upsertRecord(config, record) {
		const subname = toSubdomain(record.name, record.zoneId);
		await client(config).put(
			`/domains/${encodeURIComponent(record.zoneId)}/rrsets/${encodeURIComponent(subname || "@")}/${encodeURIComponent(record.type)}/`,
			{
				ttl: record.ttl ?? 3600,
				records: record.content
					.split("\n")
					.map((value) => value.trim())
					.filter(Boolean),
			},
		);
		return { id: `${record.type}:${subname}` };
	},

	async updateRecord(config, zoneId, recordId, record) {
		const [type, subname] = recordId.split(":");
		await client(config).delete(
			`/domains/${encodeURIComponent(zoneId)}/rrsets/${encodeURIComponent(subname || "@")}/${encodeURIComponent(type as string)}/`,
		);
		return await this.upsertRecord(config, { ...record, zoneId });
	},

	async deleteRecord(config, zoneId, recordId) {
		const [type, subname] = recordId.split(":");
		await client(config).delete(
			`/domains/${encodeURIComponent(zoneId)}/rrsets/${encodeURIComponent(subname || "@")}/${encodeURIComponent(type ?? "")}/`,
		);
	},

	async testConnection(config) {
		await client(config).get("/domains/");
	},
};