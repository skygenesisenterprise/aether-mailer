import { db } from "@notploy/server/db";
import { dnsProvider, dnsZone } from "@notploy/server/db/schema";
import {
	deriveInternalDnsZone,
	getDomainRequirements,
} from "@notploy/server/utils/domain-scope";
import { and, eq } from "drizzle-orm";
import { createDnsProviderRecord } from "./dns-provider";
import { findServerById } from "./server";
import { getWebServerSettings } from "./web-server-settings";

export type InternalDnsSyncStatus = "created" | "no-provider" | "no-ip" | "skipped";

export interface InternalDnsSyncResult {
	status: InternalDnsSyncStatus;
	providerId?: string;
	zone?: string;
	recordName?: string;
	message?: string;
}

const resolveServerIp = async (serverId?: string | null) => {
	if (serverId) {
		try {
			const server = await findServerById(serverId);
			if (server?.ipAddress) {
				return server.ipAddress;
			}
		} catch {
			// Fall back to the panel IP when the server no longer exists.
		}
	}
	const settings = await getWebServerSettings();
	return settings?.serverIp ?? null;
};

export const findInternalDnsProvider = async (organizationId: string) =>
	db.query.dnsProvider.findFirst({
		where: and(
			eq(dnsProvider.organizationId, organizationId),
			eq(dnsProvider.providerType, "notploy-internal"),
		),
	});

export const ensureInternalDnsZone = async (
	provider: { dnsProviderId: string; organizationId: string },
	name: string,
) => {
	const existing = await db.query.dnsZone.findFirst({
		where: and(
			eq(dnsZone.dnsProviderId, provider.dnsProviderId),
			eq(dnsZone.name, name),
		),
	});
	if (existing) {
		return existing.dnsZoneId;
	}

	const created = await db
		.insert(dnsZone)
		.values({
			dnsProviderId: provider.dnsProviderId,
			organizationId: provider.organizationId,
			name,
			scope: "internal",
		})
		.returning()
		.then((rows) => rows[0]);

	if (!created) {
		throw new Error("Error creating the internal DNS zone");
	}
	return created.dnsZoneId;
};

/**
 * Registers a LAN/internal domain in the organization's Notploy Internal DNS
 * provider so `gitlab.notploy.lan` or `gitlab.notploy.local` resolves without
 * any external DNS. Public and localhost domains are ignored. The provider is
 * never created implicitly: when none exists the caller receives `no-provider`
 * and can point the user at the DNS settings page.
 */
export const syncDomainToInternalDns = async ({
	host,
	serverId,
	organizationId,
}: {
	host: string;
	serverId?: string | null;
	organizationId: string;
}): Promise<InternalDnsSyncResult> => {
	const requirements = getDomainRequirements(host);
	if (requirements.scope === "public" || requirements.scope === "localhost") {
		return { status: "skipped" };
	}

	const provider = await findInternalDnsProvider(organizationId);
	if (!provider) {
		return {
			status: "no-provider",
			message: "No Notploy Internal DNS provider is configured",
		};
	}

	const ip = await resolveServerIp(serverId);
	if (!ip) {
		return {
			status: "no-ip",
			providerId: provider.dnsProviderId,
			message: "No server IP could be resolved for this domain",
		};
	}

	const zoneName = deriveInternalDnsZone(host);
	const zoneId = await ensureInternalDnsZone(provider, zoneName);
	const type: "A" | "AAAA" = ip.includes(":") ? "AAAA" : "A";

	await createDnsProviderRecord(
		provider.config,
		{ zoneId, type, name: host, content: ip },
		provider,
	);

	return {
		status: "created",
		providerId: provider.dnsProviderId,
		zone: zoneName,
		recordName: host,
	};
};
