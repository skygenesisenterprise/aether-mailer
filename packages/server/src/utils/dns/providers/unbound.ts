import type { unboundDnsConfigSchema } from "@notploy/server/db/schema";
import { execAsyncRemote } from "@notploy/server/utils/process/execAsync";
import type { z } from "zod";
import { stripTrailingDot, toSubdomain } from "../http";
import type { DnsClient, DnsRecord, DnsZone } from "../types";

type UnboundConfig = z.infer<typeof unboundDnsConfigSchema>;

const quote = (value: string) => `'${value.replace(/'/g, `'\\''`)}'`;

const unboundControl = (config: UnboundConfig, command: string) =>
	`unbound-control -c ${quote(config.configPath)} ${command}`;

/**
 * Unbound is a resolver rather than an authoritative server, so the adapter
 * manages `local-zone`/`local-data` entries through `unbound-control`.
 */
const parseLocalData = (output: string): DnsRecord[] => {
	const records: DnsRecord[] = [];
	for (const line of output.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed.startsWith("local-data:")) continue;
		const match = /^local-data:\s*"([^"]+)"/.exec(trimmed);
		if (!match?.[1]) continue;
		const [name, ttl, type, ...rest] = match[1].split(/\s+/);
		if (!name || !type) continue;
		const hasTtl = /^\d+$/.test(ttl ?? "");
		const recordType = hasTtl ? type : (ttl ?? "A");
		const content = (hasTtl ? rest : [type, ...rest]).join(" ");
		records.push({
			id: `${recordType}:${stripTrailingDot(name)}`,
			type: recordType,
			name: stripTrailingDot(name),
			content: content.replace(/^"|"$/g, ""),
			ttl: hasTtl ? Number(ttl) : 3600,
		});
	}
	return records;
};

export const unboundClient: DnsClient<UnboundConfig> = {
	async listZones(config) {
		const zones: DnsZone[] = [];
		for (const zone of config.zones ?? []) {
			zones.push({ id: stripTrailingDot(zone), name: stripTrailingDot(zone) });
		}
		return zones;
	},

	async listRecords(config, zoneId) {
		const { stdout } = await execAsyncRemote(
			config.serverId,
			`${unboundControl(config, "list_local_data")} | grep -F ${quote(stripTrailingDot(zoneId))}`,
		);
		return parseLocalData(stdout);
	},

	async upsertRecord(config, record) {
		const name = stripTrailingDot(record.name);
		const value = `"${name} ${record.ttl ?? 3600} IN ${record.type} ${record.content.trim()}"`;
		await execAsyncRemote(
			config.serverId,
			`${unboundControl(config, `local_data ${value}`)} && ${unboundControl(config, "local_data_remove_zone")} ${quote(name)} 2>/dev/null || true`,
		);
		return { id: `${record.type}:${name}` };
	},

	async updateRecord(config, zoneId, recordId, record) {
		const [type, name] = recordId.split(":");
		await execAsyncRemote(
			config.serverId,
			`${unboundControl(config, `local_data_remove ${quote(name ?? "")} ${quote(type ?? "")}`)} 2>/dev/null || true`,
		);
		return await this.upsertRecord(config, { ...record, zoneId });
	},

	async deleteRecord(config, _zoneId, recordId) {
		const [type, name] = recordId.split(":");
		await execAsyncRemote(
			config.serverId,
			`${unboundControl(config, `local_data_remove ${quote(name ?? "")} ${quote(type ?? "")}`)}`,
		);
	},

	async testConnection(config) {
		await execAsyncRemote(
			config.serverId,
			unboundControl(config, "status"),
		);
	},
};

const unusedSubdomain = toSubdomain;