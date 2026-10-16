import type { powerdnsDnsConfigSchema } from "@notploy/server/db/schema";
import type { z } from "zod";
import { type DnsClient, dnsFetch } from "./types";

type PowerdnsConfig = z.infer<typeof powerdnsDnsConfigSchema>;

interface PdnsRrset {
	name: string;
	type: string;
	ttl: number;
	records: { content: string; disabled?: boolean }[];
	changetype?: "REPLACE" | "DELETE";
}

interface PdnsZone {
	id: string;
	name: string;
	kind?: string;
	rrsets?: PdnsRrset[];
}

const ensureTrailingDot = (name: string) =>
	name.endsWith(".") ? name : `${name}.`;

const stripTrailingDot = (name: string) => name.replace(/\.$/, "");

const buildRecordId = (type: string, name: string, content: string) =>
	`${type}:${stripTrailingDot(name)}:${content}`;

const parseRecordId = (id: string) => {
	const firstSeparator = id.indexOf(":");
	const secondSeparator = id.indexOf(":", firstSeparator + 1);
	if (firstSeparator === -1 || secondSeparator === -1) {
		throw new Error(`PowerDNS: invalid record id "${id}"`);
	}
	return {
		type: id.slice(0, firstSeparator),
		name: id.slice(firstSeparator + 1, secondSeparator),
		content: id.slice(secondSeparator + 1),
	};
};

/**
 * PowerDNS keeps MX/SRV priorities inline in the record content, so values
 * round-trip unchanged.
 */
const formatContent = (record: { content: string }) => record.content.trim();

const pdnsFetch = async <T>(
	config: PowerdnsConfig,
	path: string,
	init: RequestInit = {},
): Promise<T> => {
	const base = config.apiUrl.replace(/\/+$/, "");
	const response = await dnsFetch(`${base}${path}`, {
		...init,
		headers: {
			"X-API-Key": config.apiKey.trim(),
			"Content-Type": "application/json",
			...init.headers,
		},
	});

	if (!response.ok) {
		let detail = `status ${response.status}`;
		try {
			const body = (await response.json()) as { error?: string };
			if (body?.error) detail = body.error;
		} catch {
			// The provider returned a non-JSON body; the status is enough.
		}
		throw new Error(`PowerDNS: request to ${path} failed: ${detail}`);
	}

	if (response.status === 204) {
		return undefined as T;
	}
	return (await response.json()) as T;
};

const zonesPath = (config: PowerdnsConfig) =>
	`/api/v1/servers/${encodeURIComponent(config.serverId)}/zones`;

const zoneDetailPath = (config: PowerdnsConfig, zoneId: string) =>
	`${zonesPath(config)}/${encodeURIComponent(ensureTrailingDot(zoneId))}`;

const getZone = async (config: PowerdnsConfig, zoneId: string) =>
	await pdnsFetch<PdnsZone>(config, zoneDetailPath(config, zoneId));

const patchZone = async (
	config: PowerdnsConfig,
	zoneId: string,
	rrsets: PdnsRrset[],
) => {
	await pdnsFetch<undefined>(config, zoneDetailPath(config, zoneId), {
		method: "PATCH",
		body: JSON.stringify({ rrsets }),
	});
};

export const powerdnsClient: DnsClient<PowerdnsConfig> = {
	async listZones(config) {
		const zones = await pdnsFetch<PdnsZone[]>(config, zonesPath(config));
		return zones.map((zone) => ({
			id: stripTrailingDot(zone.id ?? zone.name),
			name: stripTrailingDot(zone.name),
		}));
	},

	async listRecords(config, zoneId) {
		const zone = await getZone(config, zoneId);
		const records: {
			id: string;
			type: string;
			name: string;
			content: string;
			ttl: number;
		}[] = [];
		for (const rrset of zone.rrsets ?? []) {
			for (const record of rrset.records) {
				records.push({
					id: buildRecordId(rrset.type, rrset.name, record.content),
					type: rrset.type,
					name: stripTrailingDot(rrset.name),
					content: record.content,
					ttl: rrset.ttl,
				});
			}
		}
		return records;
	},

	async upsertRecord(config, record) {
		const fqdn = ensureTrailingDot(record.name);
		const zone = await getZone(config, record.zoneId);
		const existing = (zone.rrsets ?? []).find(
			(rrset) => rrset.type === record.type && rrset.name === fqdn,
		);

		const content = formatContent(record);
		const values = new Set(
			(existing?.records ?? [])
				.filter((entry) => !entry.disabled)
				.map((entry) => entry.content),
		);
		values.add(content);

		await patchZone(config, record.zoneId, [
			{
				name: fqdn,
				type: record.type,
				ttl: record.ttl ?? existing?.ttl ?? 300,
				changetype: "REPLACE",
				records: [...values].map((value) => ({
					content: value,
					disabled: false,
				})),
			},
		]);
		return { id: buildRecordId(record.type, record.name, content) };
	},

	async updateRecord(config, zoneId, recordId, record) {
		const previous = parseRecordId(recordId);
		const zone = await getZone(config, zoneId);
		const previousFqdn = ensureTrailingDot(previous.name);
		const existing = (zone.rrsets ?? []).find(
			(rrset) =>
				rrset.type === previous.type && rrset.name === previousFqdn,
		);

		const remaining = (existing?.records ?? [])
			.filter((entry) => !entry.disabled)
			.map((entry) => entry.content)
			.filter((value) => value !== previous.content);

		const rrsets: PdnsRrset[] = [];
		if (remaining.length === 0) {
			rrsets.push({
				name: previousFqdn,
				type: previous.type,
				ttl: existing?.ttl ?? 300,
				changetype: "DELETE",
				records: [],
			});
		} else {
			rrsets.push({
				name: previousFqdn,
				type: previous.type,
				ttl: existing?.ttl ?? 300,
				changetype: "REPLACE",
				records: remaining.map((value) => ({
					content: value,
					disabled: false,
				})),
			});
		}
		await patchZone(config, zoneId, rrsets);

		// Re-adding the value after the old rrset is rewritten keeps the update
		// atomic from the caller's point of view.
		await this.upsertRecord(config, {
			zoneId,
			type: record.type,
			name: record.name,
			content: record.content,
			ttl: record.ttl,
		});
		return { id: buildRecordId(record.type, record.name, record.content) };
	},

	async deleteRecord(config, zoneId, recordId) {
		const { type, name, content } = parseRecordId(recordId);
		const fqdn = ensureTrailingDot(name);
		const zone = await getZone(config, zoneId);
		const existing = (zone.rrsets ?? []).find(
			(rrset) => rrset.type === type && rrset.name === fqdn,
		);
		if (!existing) {
			throw new Error(`PowerDNS: record "${name}" (${type}) not found`);
		}

		const remaining = existing.records
			.filter((entry) => !entry.disabled)
			.map((entry) => entry.content)
			.filter((value) => value !== content);

		if (remaining.length === 0) {
			await patchZone(config, zoneId, [
				{
					name: fqdn,
					type,
					ttl: existing.ttl,
					changetype: "DELETE",
					records: [],
				},
			]);
			return;
		}

		await patchZone(config, zoneId, [
			{
				name: fqdn,
				type,
				ttl: existing.ttl,
				changetype: "REPLACE",
				records: remaining.map((value) => ({
					content: value,
					disabled: false,
				})),
			},
		]);
	},

	async testConnection(config) {
		await pdnsFetch<PdnsZone[]>(config, zonesPath(config));
	},
};