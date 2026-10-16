import type { corednsDnsConfigSchema } from "@notploy/server/db/schema";
import { Buffer } from "node:buffer";
import type { z } from "zod";
import { createDnsHttp, stripTrailingDot } from "../http";
import type { DnsClient, DnsRecord, DnsZone } from "../types";

type CoreDnsConfig = z.infer<typeof corednsDnsConfigSchema>;

interface EtcdRangeResponse {
	kvs?: { key: string; value: string }[];
}

interface EtcdValue {
	host: string;
	port?: number;
	priority?: number;
	weight?: number;
	ttl?: number;
}

const decode = (value: string) =>
	Buffer.from(value, "base64").toString("utf8");

const encode = (value: string) => Buffer.from(value, "utf8").toString("base64");

/**
 * CoreDNS has no management API: its etcd plugin reads records from etcd using
 * the `/skydns` layout, so the adapter drives the etcd v3 HTTP gateway.
 */
const client = (config: CoreDnsConfig) => {
	const endpoint = config.etcdEndpoints.split(",")[0]?.trim() ?? "";
	return createDnsHttp("CoreDNS", {
		baseUrl: endpoint,
		headers: {
			...(config.username && config.password
				? { Authorization: `Basic ${btoa(`${config.username}:${config.password}`)}` }
				: {}),
		},
	});
};

/** Skydns reverses the domain labels into a path under /skydns. */
const toSkydnsKey = (name: string) => {
	const labels = stripTrailingDot(name).split(".").reverse();
	return `/skydns/${labels.join("/")}`;
};

const fromSkydnsKey = (key: string) => {
	const labels = key.replace(/^\/skydns\/?/, "").split("/").filter(Boolean);
	return labels.reverse().join(".");
};

const formatContent = (value: EtcdValue, type: string) => {
	if (type === "MX") return `${value.priority ?? 10} ${value.host}`;
	if (type === "SRV") {
		return `${value.priority ?? 0} ${value.weight ?? 0} ${value.port ?? 0} ${value.host}`;
	}
	return value.host;
};

export const corednsClient: DnsClient<CoreDnsConfig> = {
	async listZones(config) {
		// CoreDNS zones are declared because etcd stores records, not zones.
		const zones: DnsZone[] = [];
		for (const zone of config.zones ?? []) {
			zones.push({ id: stripTrailingDot(zone), name: stripTrailingDot(zone) });
		}
		return zones;
	},

	async listRecords(config, zoneId) {
		const prefix = toSkydnsKey(zoneId);
		const response = await client(config).post<EtcdRangeResponse>(
			"/v3/kv/range",
			{
				key: encode(prefix),
				range_end: encode(`${prefix}0`),
			},
		);

		const records: DnsRecord[] = [];
		for (const kv of response.kvs ?? []) {
			let value: EtcdValue;
			try {
				value = JSON.parse(decode(kv.value)) as EtcdValue;
			} catch {
				continue;
			}
			const name = fromSkydnsKey(kv.key);
			const type = value.port
				? "SRV"
				: value.priority && !value.port
					? "MX"
					: name.includes("_acme-challenge")
						? "TXT"
						: "A";
			records.push({
				id: kv.key,
				type,
				name,
				content: formatContent(value, type),
				ttl: value.ttl ?? 300,
			});
		}
		return records;
	},

	async upsertRecord(config, record) {
		const key = toSkydnsKey(record.name);
		const value: EtcdValue = { host: record.content.trim() };
		if (record.ttl) value.ttl = record.ttl;
		if (record.type === "MX" || record.type === "SRV") {
			const parts = record.content.trim().split(/\s+/);
			if (record.type === "SRV") {
				const [priority, weight, port, host] = parts;
				Object.assign(value, {
					host,
					priority: Number(priority),
					weight: Number(weight),
					port: Number(port),
				});
			} else {
				value.priority = Number(parts[0]);
				value.host = parts.slice(1).join(" ");
			}
		}
		await client(config).post("/v3/kv/put", {
			key: encode(key),
			value: encode(JSON.stringify(value)),
		});
		return { id: key };
	},

	async updateRecord(config, zoneId, recordId, record) {
		await client(config).post("/v3/kv/deleterange", {
			key: encode(recordId),
		});
		return await this.upsertRecord(config, { ...record, zoneId });
	},

	async deleteRecord(config, _zoneId, recordId) {
		await client(config).post("/v3/kv/deleterange", {
			key: encode(recordId),
		});
	},

	async testConnection(config) {
		await client(config).post<EtcdRangeResponse>("/v3/kv/range", {
			key: encode("/skydns/"),
		});
	},
};