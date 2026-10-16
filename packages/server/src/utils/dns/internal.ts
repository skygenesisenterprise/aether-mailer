import { db } from "@notploy/server/db";
import {
	type DnsRecordType,
	type notployInternalDnsConfigSchema,
	dnsRecord,
	dnsZone,
} from "@notploy/server/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import type { z } from "zod";
import type { DnsClient, DnsRecord, DnsZone } from "./types";

type InternalConfig = z.infer<typeof notployInternalDnsConfigSchema>;

/**
 * The first-party adapter is scoped to a single provider row: zones and records
 * are stored by Notploy itself, so the provider id has to travel with the
 * config. It is attached by the service layer before the client is called.
 */
export interface InternalConfigWithProvider extends InternalConfig {
	dnsProviderId: string;
	organizationId: string;
}

const stripTrailingDot = (name: string) => name.replace(/\.$/, "");

const findProvider = (config: InternalConfigWithProvider) => {
	if (!config.dnsProviderId) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "The internal DNS provider is missing its identifier",
		});
	}
	return config.dnsProviderId;
};

const requireZone = async (
	config: InternalConfigWithProvider,
	zoneId: string,
) => {
	const zone = await db.query.dnsZone.findFirst({
		where: and(
			eq(dnsZone.dnsZoneId, zoneId),
			eq(dnsZone.dnsProviderId, findProvider(config)),
		),
	});
	if (!zone) {
		throw new TRPCError({ code: "NOT_FOUND", message: "DNS zone not found" });
	}
	return zone;
};

export const internalDnsClient: DnsClient<InternalConfigWithProvider> = {
	async listZones(config) {
		const zones = await db.query.dnsZone.findMany({
			where: eq(dnsZone.dnsProviderId, findProvider(config)),
			orderBy: (table, { asc }) => [asc(table.name)],
		});
		return zones.map((zone) => ({ id: zone.dnsZoneId, name: zone.name }));
	},

	async listRecords(config, zoneId) {
		await requireZone(config, zoneId);
		const records = await db.query.dnsRecord.findMany({
			where: eq(dnsRecord.dnsZoneId, zoneId),
			orderBy: (table, { asc }) => [asc(table.name), asc(table.type)],
		});
		return records.map(
			(record): DnsRecord => ({
				id: record.dnsRecordId,
				type: record.type,
				name: record.name,
				content: record.content,
				ttl: record.ttl,
				comment: record.comment ?? undefined,
				tags: record.tags ?? [],
			}),
		);
	},

	async upsertRecord(config, record) {
		const zone = await requireZone(config, record.zoneId);
		const name = stripTrailingDot(record.name);
		const existing = await db.query.dnsRecord.findFirst({
			where: and(
				eq(dnsRecord.dnsZoneId, zone.dnsZoneId),
				eq(dnsRecord.type, record.type as DnsRecordType),
				eq(dnsRecord.name, name),
			),
		});
		const ttl = record.ttl ?? config.defaultTtl;

		if (existing) {
			await db
				.update(dnsRecord)
				.set({
					content: record.content,
					ttl,
					comment: record.comment ?? null,
					tags: record.tags ?? [],
					updatedAt: new Date().toISOString(),
				})
				.where(eq(dnsRecord.dnsRecordId, existing.dnsRecordId));
			return { id: existing.dnsRecordId };
		}

		const created = await db
			.insert(dnsRecord)
			.values({
				dnsZoneId: zone.dnsZoneId,
				type: record.type as DnsRecordType,
				name,
				content: record.content,
				ttl,
				comment: record.comment ?? null,
				tags: record.tags ?? [],
				ownership: "managed",
			})
			.returning()
			.then((rows) => rows[0]);

		if (!created) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Error creating the DNS record",
			});
		}
		return { id: created.dnsRecordId };
	},

	async updateRecord(config, zoneId, recordId, record) {
		const zone = await requireZone(config, zoneId);
		const existing = await db.query.dnsRecord.findFirst({
			where: and(
				eq(dnsRecord.dnsRecordId, recordId),
				eq(dnsRecord.dnsZoneId, zone.dnsZoneId),
			),
		});
		if (!existing) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "DNS record not found",
			});
		}
		await db
			.update(dnsRecord)
			.set({
				type: record.type as DnsRecordType,
				name: stripTrailingDot(record.name),
				content: record.content,
				ttl: record.ttl ?? config.defaultTtl,
				comment: record.comment ?? null,
				tags: record.tags ?? [],
				updatedAt: new Date().toISOString(),
			})
			.where(eq(dnsRecord.dnsRecordId, recordId));
		return { id: recordId };
	},

	async deleteRecord(config, zoneId, recordId) {
		const zone = await requireZone(config, zoneId);
		await db
			.delete(dnsRecord)
			.where(
				and(
					eq(dnsRecord.dnsRecordId, recordId),
					eq(dnsRecord.dnsZoneId, zone.dnsZoneId),
				),
			);
	},

	async testConnection(config) {
		findProvider(config);
		await db.query.dnsZone.findFirst({
			where: eq(dnsZone.dnsProviderId, config.dnsProviderId),
		});
	},
};