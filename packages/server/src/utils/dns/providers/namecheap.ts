import type { namecheapDnsConfigSchema } from "@notploy/server/db/schema";
import { XMLParser } from "fast-xml-parser";
import type { z } from "zod";
import { createDnsHttp, stripTrailingDot, toSubdomain } from "../http";
import type { DnsClient, DnsZone } from "../types";

type NamecheapConfig = z.infer<typeof namecheapDnsConfigSchema>;

interface NamecheapHost {
	Name: string;
	Type: string;
	Address: string;
	MXPref: string;
	TTL: string;
}

const API = "https://api.namecheap.com";

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: "@_",
	isArray: (name) => name === "host" || name === "Domain",
});

const client = (config: NamecheapConfig) =>
	createDnsHttp("Namecheap", { baseUrl: API });

const authParams = (config: NamecheapConfig) => ({
	ApiUser: config.apiUser.trim(),
	ApiKey: config.apiKey.trim(),
	UserName: config.userName.trim(),
	ClientIp: config.clientIp.trim(),
});

const asArray = <T>(value: T | T[] | undefined): T[] =>
	value === undefined ? [] : Array.isArray(value) ? value : [value];

const call = async (
	config: NamecheapConfig,
	params: Record<string, string>,
): Promise<Record<string, unknown>> => {
	const search = new URLSearchParams({ ...authParams(config), ...params });
	const raw = await client(config).get<unknown>(
		`/xml.response?${search.toString()}`,
	);
	const parsed = parser.parse(
		typeof raw === "string" ? raw : JSON.stringify(raw),
	) as {
		ApiResponse?: {
			Status?: string;
			Errors?: { Error?: unknown };
			CommandResponse?: Record<string, unknown>;
		};
	};

	const response = parsed.ApiResponse;
	if (response?.Status !== "OK") {
		const errors = asArray(response?.Errors?.Error).map((entry) =>
			typeof entry === "string"
				? entry
				: ((entry as { "#text"?: string })["#text"] ?? ""),
		);
		throw new Error(
			`Namecheap: request failed${errors.filter(Boolean).length ? `: ${errors.filter(Boolean).join(", ")}` : ""}`,
		);
	}
	return response.CommandResponse ?? {};
};

const splitDomain = (domain: string) => {
	const parts = stripTrailingDot(domain).split(".");
	const tld = parts.pop() ?? "";
	const sld = parts.pop() ?? "";
	return { sld, tld };
};

const parseHosts = (commandResponse: Record<string, unknown>): NamecheapHost[] => {
	const result = commandResponse.DomainDNSGetHostsResult as
		| { host?: unknown }
		| undefined;
	return asArray(result?.host).map((entry) => {
		const host = entry as Record<string, string>;
		return {
			Name: host.Name ?? "@",
			Type: host.Type ?? "A",
			Address: host.Address ?? "",
			MXPref: host.MXPref ?? "10",
			TTL: host.TTL ?? "1800",
		};
	});
};

const toHost = (
	record: { type: string; name: string; content: string; ttl?: number },
	zone: string,
): NamecheapHost => {
	const value = record.content.trim();
	const match = record.type === "MX" ? /^(\d+)\s+(\S.*)$/.exec(value) : null;
	return {
		Name: toSubdomain(record.name, zone) || "@",
		Type: record.type,
		Address: match ? (match[2] as string) : value,
		MXPref: match ? (match[1] as string) : "10",
		TTL: String(record.ttl ?? 1800),
	};
};

const setHosts = async (
	config: NamecheapConfig,
	zone: string,
	hosts: NamecheapHost[],
) => {
	const { sld, tld } = splitDomain(zone);
	const params: Record<string, string> = {
		Command: "namecheap.domains.dns.setHosts",
		SLD: sld,
		TLD: tld,
	};
	hosts.forEach((host, index) => {
		const position = index + 1;
		params[`HostName${position}`] = host.Name;
		params[`RecordType${position}`] = host.Type;
		params[`Address${position}`] = host.Address;
		params[`TTL${position}`] = host.TTL;
		if (host.Type === "MX") {
			params[`MXPref${position}`] = host.MXPref;
		}
	});
	await call(config, params);
};

const fetchHosts = async (config: NamecheapConfig, zone: string) => {
	const { sld, tld } = splitDomain(zone);
	const response = await call(config, {
		Command: "namecheap.domains.dns.getHosts",
		SLD: sld,
		TLD: tld,
	});
	return parseHosts(response);
};

const sameRecord = (host: NamecheapHost, type: string, subdomain: string) =>
	host.Type === type && host.Name === subdomain;

export const namecheapClient: DnsClient<NamecheapConfig> = {
	async listZones(config) {
		const response = await call(config, {
			Command: "namecheap.domains.getList",
			PageSize: "100",
		});
		const result = response.DomainGetListResult as
			| { Domain?: unknown }
			| undefined;
		return asArray(result?.Domain)
			.map((entry) => {
				const attributes = (entry as { "@_Name"?: string })["@_Name"];
				const name = stripTrailingDot(
					attributes ?? (entry as { Name?: string }).Name ?? "",
				);
				return { id: name, name } satisfies DnsZone;
			})
			.filter((zone) => zone.name.length > 0);
	},

	async listRecords(config, zoneId) {
		const hosts = await fetchHosts(config, zoneId);
		return hosts.map((host) => ({
			id: `${host.Type}:${host.Name}`,
			type: host.Type,
			name: host.Name === "@" ? zoneId : `${host.Name}.${zoneId}`,
			content:
				host.Type === "MX" ? `${host.MXPref} ${host.Address}` : host.Address,
			ttl: Number(host.TTL),
		}));
	},

	async upsertRecord(config, record) {
		const subdomain = toSubdomain(record.name, record.zoneId) || "@";
		const hosts = await fetchHosts(config, record.zoneId);
		const next = hosts.filter(
			(host) => !sameRecord(host, record.type, subdomain),
		);
		next.push(toHost(record, record.zoneId));
		await setHosts(config, record.zoneId, next);
		return { id: `${record.type}:${subdomain}` };
	},

	async updateRecord(config, zoneId, recordId, record) {
		const [type, subdomain] = recordId.split(":");
		const hosts = await fetchHosts(config, zoneId);
		const next = hosts.filter(
			(host) => !sameRecord(host, type ?? "", subdomain ?? ""),
		);
		next.push(toHost({ ...record }, zoneId));
		await setHosts(config, zoneId, next);
		return { id: `${record.type}:${toSubdomain(record.name, zoneId) || "@"}` };
	},

	async deleteRecord(config, zoneId, recordId) {
		const [type, subdomain] = recordId.split(":");
		const hosts = await fetchHosts(config, zoneId);
		await setHosts(
			config,
			zoneId,
			hosts.filter((host) => !sameRecord(host, type ?? "", subdomain ?? "")),
		);
	},

	async testConnection(config) {
		await call(config, {
			Command: "namecheap.domains.getList",
			PageSize: "1",
		});
	},
};