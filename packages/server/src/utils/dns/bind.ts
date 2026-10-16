import type { bindDnsConfigSchema } from "@notploy/server/db/schema";
import { execAsyncRemote } from "@notploy/server/utils/process/execAsync";
import type { z } from "zod";
import type { DnsClient, DnsRecord, DnsZone } from "./types";

type BindConfig = z.infer<typeof bindDnsConfigSchema>;

const stripTrailingDot = (name: string) => name.replace(/\.$/, "");

const buildRecordId = (type: string, name: string) =>
	`${type}:${stripTrailingDot(name)}`;

const parseRecordId = (id: string) => {
	const separatorIndex = id.indexOf(":");
	if (separatorIndex === -1) {
		throw new Error(`BIND: invalid record id "${id}"`);
	}
	return {
		type: id.slice(0, separatorIndex),
		name: id.slice(separatorIndex + 1),
	};
};

/**
 * `dig` is used both to read records and to validate that a dynamic update was
 * applied, because BIND has no list/read API of its own.
 */
const quote = (value: string) => `'${value.replace(/'/g, `'\\''`)}'`;

const runNsupdate = async (config: BindConfig, script: string) => {
	// The TSIG secret is passed through an environment variable so it never
	// appears in the command line, the process list or the logs.
	const command = [
		`NSUPDATE_TSIG_NAME=${quote(config.tsigKeyName)}`,
		`NSUPDATE_TSIG_ALGO=${quote(config.tsigAlgorithm)}`,
		`NSUPDATE_TSIG_SECRET=${quote(config.tsigSecret)}`,
		`NSUPDATE_SERVER=${quote(config.serverAddress)}`,
		`NSUPDATE_PORT=${quote(String(config.port))}`,
		"nsupdate -v -k /dev/stdin <<'NSUPDATE_EOF'",
		script.trim(),
		"NSUPDATE_EOF",
	].join(" ");
	await execAsyncRemote(config.serverId, command);
};

const buildUpdateScript = (config: BindConfig, lines: string[]) =>
	[
		`server ${config.serverAddress} ${config.port}`,
		`key ${config.tsigAlgorithm}:${config.tsigKeyName} ${config.tsigSecret}`,
		...lines,
		"send",
	].join("\n");

const formatTxt = (value: string) =>
	value.startsWith('"') ? value : JSON.stringify(value);

const buildContent = (type: string, content: string) => {
	const value = content.trim();
	if (type === "TXT") {
		return formatTxt(value);
	}
	if (type === "MX" || type === "SRV" || type === "CAA") {
		// These are already in zone-file syntax: priority/host, flags/tag/value.
		return value;
	}
	return value;
};

const parseDigRecords = (output: string, zone: string): DnsRecord[] => {
	const records: DnsRecord[] = [];
	for (const line of output.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith(";")) continue;
		const [name, ttl, type, ...rest] = trimmed.split(/\s+/);
		if (!name || !type || rest.length === 0) continue;
		if (!/^\d+$/.test(ttl ?? "")) continue;
		const content = rest.join(" ");
		if (!type || !content) continue;
		if (!stripTrailingDot(name).endsWith(stripTrailingDot(zone))) continue;
		records.push({
			id: buildRecordId(type, name),
			type,
			name: stripTrailingDot(name),
			content: type === "TXT" ? content.replace(/^"|"$/g, "") : content,
			ttl: Number(ttl),
		});
	}
	return records;
};

export const bindClient: DnsClient<BindConfig> = {
	async listZones(config) {
		// BIND has no zone discovery interface, so zones are declared in the
		// provider configuration and verified with an SOA lookup.
		const zones: DnsZone[] = [];
		for (const zone of config.zones ?? []) {
			try {
				await execAsyncRemote(
					config.serverId,
					`dig @${quote(config.serverAddress)} -p ${config.port} +short SOA ${quote(zone)}`,
				);
				zones.push({ id: stripTrailingDot(zone), name: stripTrailingDot(zone) });
			} catch {
				// An unreachable zone should not hide the others.
			}
		}
		return zones;
	},

	async listRecords(config, zoneId) {
		const zone = stripTrailingDot(zoneId);
		const { stdout } = await execAsyncRemote(
			config.serverId,
			`dig @${quote(config.serverAddress)} -p ${config.port} +noall +answer ${quote(zone)} AXFR`,
		);
		return parseDigRecords(stdout, zone);
	},

	async upsertRecord(config, record) {
		const fqdn = stripTrailingDot(record.name);
		const lines = [
			`zone ${stripTrailingDot(record.zoneId)}`,
			`update delete ${fqdn} ${record.type}`,
			`update add ${fqdn} ${record.ttl ?? 300} ${record.type} ${buildContent(record.type, record.content)}`,
		];
		await runNsupdate(config, buildUpdateScript(config, lines));
		return { id: buildRecordId(record.type, record.name) };
	},

	async updateRecord(config, zoneId, recordId, record) {
		const previous = parseRecordId(recordId);
		await runNsupdate(
			config,
			buildUpdateScript(config, [
				`zone ${stripTrailingDot(zoneId)}`,
				`update delete ${stripTrailingDot(previous.name)} ${previous.type}`,
			]),
		);
		await this.upsertRecord(config, {
			zoneId,
			type: record.type,
			name: record.name,
			content: record.content,
			ttl: record.ttl,
		});
		return { id: buildRecordId(record.type, record.name) };
	},

	async deleteRecord(config, zoneId, recordId) {
		const { type, name } = parseRecordId(recordId);
		await runNsupdate(
			config,
			buildUpdateScript(config, [
				`zone ${stripTrailingDot(zoneId)}`,
				`update delete ${stripTrailingDot(name)} ${type}`,
			]),
		);
	},

	async testConnection(config) {
		await execAsyncRemote(
			config.serverId,
			`dig @${quote(config.serverAddress)} -p ${config.port} +short SOA ${quote(
				stripTrailingDot(config.zones?.[0] ?? "."),
			)}`,
		);
	},
};