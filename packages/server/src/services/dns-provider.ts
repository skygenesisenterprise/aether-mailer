import { db } from "@notploy/server/db";
import {
	type apiCreateDnsProvider,
	type DnsProviderConfig,
	dnsProvider,
	dnsProviderTypes,
} from "@notploy/server/db/schema";
import type { DnsRecordInput } from "@notploy/server/utils/dns";
import {
	getDnsCapabilities,
	getDnsClient,
	getDnsProviderCategory,
	parseZoneFile,
	serializeZoneFile,
} from "@notploy/server/utils/dns";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import type { z } from "zod";

export type DnsProvider = typeof dnsProvider.$inferSelect;

export const DNS_SECRET_MASK = "********";

const SENSITIVE_FIELDS: Record<DnsProviderConfig["providerType"], string[]> = {
	cloudflare: ["apiToken"],
	route53: ["secretAccessKey"],
	porkbun: ["secretApiKey"],
	infomaniak: ["apiToken"],
	ovh: ["applicationSecret", "consumerKey"],
	hetzner: ["apiToken"],
	digitalocean: ["apiToken"],
	gandi: ["apiKey"],
	vultr: ["apiKey"],
	linode: ["apiToken"],
	desec: ["apiToken"],
	bunny: ["apiKey"],
	ns1: ["apiKey"],
	godaddy: ["apiSecret"],
	namecheap: ["apiKey"],
	cloudns: ["authPassword"],
	powerdns: ["apiKey"],
	bind: ["tsigSecret"],
	technitium: ["apiToken"],
	coredns: ["password"],
	unbound: [],
	custom: ["apiToken"],
	"notploy-internal": [],
};

export const maskDnsProviderConfig = (
	config: DnsProviderConfig,
): DnsProviderConfig => {
	const masked: Record<string, unknown> = { ...config };
	for (const field of SENSITIVE_FIELDS[config.providerType]) {
		if (masked[field]) {
			masked[field] = DNS_SECRET_MASK;
		}
	}
	return masked as DnsProviderConfig;
};

export const mergeDnsProviderConfig = (
	incoming: DnsProviderConfig,
	existing: DnsProviderConfig,
): DnsProviderConfig => {
	const merged: Record<string, unknown> = { ...incoming };
	for (const field of SENSITIVE_FIELDS[incoming.providerType]) {
		if (merged[field] === DNS_SECRET_MASK) {
			if (incoming.providerType !== existing.providerType) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Credentials must be re-entered when changing the provider type",
				});
			}
			merged[field] = (existing as Record<string, unknown>)[field];
		}
	}
	return merged as DnsProviderConfig;
};

const isUniqueNameViolation = (error: unknown) =>
	error instanceof Error && error.message.includes("dns_provider_org_name_idx");

export const createDnsProvider = async (
	input: z.infer<typeof apiCreateDnsProvider>,
	organizationId: string,
) => {
	try {
		const newProvider = await db
			.insert(dnsProvider)
			.values({
				name: input.name,
				providerType: input.config.providerType,
				config: input.config,
				organizationId,
			})
			.returning()
			.then((value) => value[0]);

		if (!newProvider) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Error creating the DNS provider",
			});
		}
		return newProvider;
	} catch (error) {
		if (isUniqueNameViolation(error)) {
			throw new TRPCError({
				code: "CONFLICT",
				message: `A DNS provider named "${input.name}" already exists in this organization`,
			});
		}
		throw error;
	}
};

export const findDnsProviderById = async (dnsProviderId: string) => {
	const provider = await db.query.dnsProvider.findFirst({
		where: eq(dnsProvider.dnsProviderId, dnsProviderId),
	});
	if (!provider) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "DNS provider not found",
		});
	}
	return provider;
};

export const findDnsProviderInOrganization = async (
	dnsProviderId: string,
	organizationId: string,
) => {
	const provider = await findDnsProviderById(dnsProviderId);
	if (provider.organizationId !== organizationId) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "You are not allowed to access this DNS provider",
		});
	}
	return provider;
};

export const findDnsProvidersByOrganizationId = async (
	organizationId: string,
) => {
	return await db.query.dnsProvider.findMany({
		where: eq(dnsProvider.organizationId, organizationId),
		orderBy: (providers, { asc }) => [asc(providers.name)],
	});
};

export const updateDnsProvider = async (
	dnsProviderId: string,
	name: string,
	config: DnsProviderConfig,
) => {
	const existing = await findDnsProviderById(dnsProviderId);
	const mergedConfig = mergeDnsProviderConfig(config, existing.config);

	try {
		const updated = await db
			.update(dnsProvider)
			.set({
				name,
				providerType: mergedConfig.providerType,
				config: mergedConfig,
			})
			.where(eq(dnsProvider.dnsProviderId, dnsProviderId))
			.returning()
			.then((res) => res[0]);

		if (!updated) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Error updating the DNS provider",
			});
		}
		return updated;
	} catch (error) {
		if (isUniqueNameViolation(error)) {
			throw new TRPCError({
				code: "CONFLICT",
				message: `A DNS provider named "${name}" already exists in this organization`,
			});
		}
		throw error;
	}
};

export const removeDnsProvider = async (dnsProviderId: string) => {
	const removed = await db
		.delete(dnsProvider)
		.where(eq(dnsProvider.dnsProviderId, dnsProviderId))
		.returning()
		.then((res) => res[0]);

	if (!removed) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "DNS provider not found",
		});
	}
	return removed;
};

/**
 * The first-party internal adapter needs the provider and organization ids to
 * scope its own tables. They are injected here so callers keep passing a plain
 * config around.
 */
const withAdapterScope = (
	config: DnsProviderConfig,
	provider?: Pick<DnsProvider, "dnsProviderId" | "organizationId">,
) =>
	config.providerType === "notploy-internal"
		? {
				...config,
				dnsProviderId: provider?.dnsProviderId ?? "",
				organizationId: provider?.organizationId ?? "",
			}
		: config;

export const testDnsProviderConnection = async (
	config: DnsProviderConfig,
	provider?: Pick<DnsProvider, "dnsProviderId" | "organizationId">,
) => {
	const client = getDnsClient(config.providerType);
	try {
		await client.testConnection(withAdapterScope(config, provider) as never);
	} catch (error) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				error instanceof Error
					? error.message
					: "Error connecting to the DNS provider",
		});
	}
};

export const listDnsProviderZones = async (
	config: DnsProviderConfig,
	provider?: Pick<DnsProvider, "dnsProviderId" | "organizationId">,
) => {
	const client = getDnsClient(config.providerType);
	try {
		return await client.listZones(withAdapterScope(config, provider) as never);
	} catch (error) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				error instanceof Error
					? error.message
					: "Error listing zones for this DNS provider",
		});
	}
};

export const listDnsProviderRecords = async (
	config: DnsProviderConfig,
	zoneId: string,
	provider?: Pick<DnsProvider, "dnsProviderId" | "organizationId">,
) => {
	const client = getDnsClient(config.providerType);
	try {
		return await client.listRecords(
			withAdapterScope(config, provider) as never,
			zoneId,
		);
	} catch (error) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				error instanceof Error
					? error.message
					: "Error listing records for this zone",
		});
	}
};

export const createDnsProviderRecord = async (
	config: DnsProviderConfig,
	record: DnsRecordInput,
	provider?: Pick<DnsProvider, "dnsProviderId" | "organizationId">,
) => {
	const client = getDnsClient(config.providerType);
	try {
		return await client.upsertRecord(
			withAdapterScope(config, provider) as never,
			record,
		);
	} catch (error) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				error instanceof Error ? error.message : "Error creating the record",
		});
	}
};

export const updateDnsProviderRecord = async (
	config: DnsProviderConfig,
	zoneId: string,
	recordId: string,
	record: Omit<DnsRecordInput, "zoneId">,
	provider?: Pick<DnsProvider, "dnsProviderId" | "organizationId">,
) => {
	const client = getDnsClient(config.providerType);
	try {
		return await client.updateRecord(
			withAdapterScope(config, provider) as never,
			zoneId,
			recordId,
			record,
		);
	} catch (error) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				error instanceof Error ? error.message : "Error updating the record",
		});
	}
};

export const deleteDnsProviderRecord = async (
	config: DnsProviderConfig,
	zoneId: string,
	recordId: string,
	provider?: Pick<DnsProvider, "dnsProviderId" | "organizationId">,
) => {
	const client = getDnsClient(config.providerType);
	try {
		await client.deleteRecord(
			withAdapterScope(config, provider) as never,
			zoneId,
			recordId,
		);
	} catch (error) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				error instanceof Error ? error.message : "Error deleting the record",
		});
	}
};

export const exportDnsProviderZone = async (
	config: DnsProviderConfig,
	zoneName: string,
	zoneId: string,
	provider?: Pick<DnsProvider, "dnsProviderId" | "organizationId">,
) => {
	const records = await listDnsProviderRecords(config, zoneId, provider);
	return serializeZoneFile(zoneName, records);
};

export interface DnsZoneImportResult {
	created: number;
	failed: number;
	errors: string[];
}

/**
 * Parses a BIND-style zone file and writes every supported record through the
 * provider adapter, so an import works the same for managed, self-hosted and
 * internal providers.
 */
export const importDnsProviderZone = async (
	config: DnsProviderConfig,
	zoneId: string,
	zoneName: string,
	content: string,
	provider?: Pick<DnsProvider, "dnsProviderId" | "organizationId">,
): Promise<DnsZoneImportResult> => {
	const { records, errors } = parseZoneFile(content, zoneName);
	let created = 0;

	for (const record of records) {
		try {
			await createDnsProviderRecord(
				config,
				{ ...record, zoneId },
				provider,
			);
			created += 1;
		} catch (error) {
			errors.push(
				error instanceof Error
					? `${record.name} ${record.type}: ${error.message}`
					: `${record.name} ${record.type}: import failed`,
			);
		}
	}

	return { created, failed: records.length - created, errors };
};

export interface DnsProviderDescriptor {
	providerType: DnsProviderConfig["providerType"];
	category: ReturnType<typeof getDnsProviderCategory>;
	capabilities: ReturnType<typeof getDnsCapabilities>;
}

/**
 * Capability matrix for every provider type, so the UI can show what a provider
 * supports even before one is connected.
 */
export const listDnsProviderDescriptors = (): DnsProviderDescriptor[] => {
	return dnsProviderTypes.map((providerType) => ({
		providerType,
		category: getDnsProviderCategory(providerType),
		capabilities: getDnsCapabilities(providerType),
	}));
};

/**
 * Probes a provider and reports its health. The probe reuses the adapter's
 * `testConnection`, so a provider that reports `connected` is also reachable
 * for the routine zone/record operations.
 */
export const getDnsProviderHealth = async (
	config: DnsProviderConfig,
	provider?: Pick<DnsProvider, "dnsProviderId" | "organizationId">,
): Promise<{
	status: "connected" | "degraded" | "unreachable" | "misconfigured";
	checkedAt: string;
	latencyMs: number | null;
	message?: string;
	zoneCount?: number;
}> => {
	const checkedAt = new Date().toISOString();
	const client = getDnsClient(config.providerType);
	const scoped = withAdapterScope(config, provider) as never;
	const startedAt = Date.now();
	try {
		await client.testConnection(scoped);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "The provider is unreachable";
		return {
			status: /unauthor|forbidden|401|403/i.test(message)
				? "misconfigured"
				: "unreachable",
			checkedAt,
			latencyMs: null,
			message,
		};
	}

	const latencyMs = Date.now() - startedAt;
	try {
		const zones = await client.listZones(scoped);
		return {
			status: "connected",
			checkedAt,
			latencyMs,
			zoneCount: zones.length,
		};
	} catch (error) {
		return {
			status: "degraded",
			checkedAt,
			latencyMs,
			message:
				error instanceof Error
					? error.message
					: "The provider is reachable but zones could not be listed",
		};
	}
};