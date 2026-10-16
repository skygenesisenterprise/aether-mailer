import { db } from "@notploy/server/db";
import {
	type apiCreateNetworkProvider,
	type NetworkPeerInput,
	type NetworkProviderConfig,
	networkPeer,
	networkProvider,
	networkProviderTypes,
} from "@notploy/server/db/schema";
import {
	getNetworkCapabilities,
	getNetworkProviderCategory,
} from "@notploy/server/utils/network";
import { isValidCidr } from "@notploy/server/utils/network/cidr";
import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import type { z } from "zod";
import { getRemoteDocker } from "../utils/servers/remote-docker";

export type NetworkProvider = typeof networkProvider.$inferSelect;
export type NetworkPeer = typeof networkPeer.$inferSelect;

export const NETWORK_PROVIDER_SECRET_MASK = "********";

/**
 * Configs store references to the secret store rather than raw credentials, so
 * there is normally nothing to mask. This pattern still catches any scalar
 * field a future adapter might add so it can never leak through the API.
 */
const SECRET_FIELD_PATTERN =
	/(privateKey|authKey|apiToken|password|secretKey|psk)$/i;

export const maskNetworkProviderConfig = (
	config: NetworkProviderConfig,
): NetworkProviderConfig => {
	const masked: Record<string, unknown> = { ...config };
	for (const [key, value] of Object.entries(masked)) {
		if (typeof value === "string" && SECRET_FIELD_PATTERN.test(key)) {
			masked[key] = NETWORK_PROVIDER_SECRET_MASK;
		}
	}
	return masked as NetworkProviderConfig;
};

export const mergeNetworkProviderConfig = (
	incoming: NetworkProviderConfig,
	existing: NetworkProviderConfig,
): NetworkProviderConfig => {
	if (incoming.providerType !== existing.providerType) {
		return incoming;
	}
	const merged: Record<string, unknown> = { ...incoming };
	for (const [key, value] of Object.entries(merged)) {
		if (
			value === NETWORK_PROVIDER_SECRET_MASK &&
			typeof (existing as Record<string, unknown>)[key] === "string"
		) {
			merged[key] = (existing as Record<string, unknown>)[key];
		}
	}
	return merged as NetworkProviderConfig;
};

const isUniqueNameViolation = (error: unknown) =>
	error instanceof Error &&
	error.message.includes("network_provider_org_name_idx");

const isUniquePeerAddressViolation = (error: unknown) =>
	error instanceof Error &&
	error.message.includes("network_peer_provider_address_idx");

type TransactionExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0];

const replacePeers = async (
	executor: TransactionExecutor,
	networkProviderId: string,
	organizationId: string,
	peers: NetworkPeerInput[],
) => {
	await executor
		.delete(networkPeer)
		.where(eq(networkPeer.networkProviderId, networkProviderId));
	if (peers.length === 0) {
		return;
	}
	await executor.insert(networkPeer).values(
		peers.map((peer) => ({
			networkProviderId,
			organizationId,
			name: peer.name,
			serverId: peer.serverId ?? null,
			address: peer.address,
			publicKey: peer.publicKey ?? null,
			endpoint: peer.endpoint ?? null,
			allowedIps: peer.allowedIps,
		})),
	);
};

export const createNetworkProvider = async (
	input: z.infer<typeof apiCreateNetworkProvider>,
	organizationId: string,
) => {
	try {
		return await db.transaction(async (tx) => {
			const [created] = await tx
				.insert(networkProvider)
				.values({
					name: input.name,
					providerType: input.config.providerType,
					config: input.config,
					organizationId,
				})
				.returning();

			if (!created) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Error creating the network provider",
				});
			}

			await replacePeers(
				tx,
				created.networkProviderId,
				organizationId,
				input.peers ?? [],
			);
			return created;
		});
	} catch (error) {
		if (isUniqueNameViolation(error)) {
			throw new TRPCError({
				code: "CONFLICT",
				message: `A network provider named "${input.name}" already exists in this organization`,
			});
		}
		if (isUniquePeerAddressViolation(error)) {
			throw new TRPCError({
				code: "CONFLICT",
				message: "Two peers share the same address in this network",
			});
		}
		throw error;
	}
};

export const findNetworkProviderById = async (networkProviderId: string) => {
	const provider = await db.query.networkProvider.findFirst({
		where: eq(networkProvider.networkProviderId, networkProviderId),
	});
	if (!provider) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Network provider not found",
		});
	}
	return provider;
};

export const findNetworkProviderInOrganization = async (
	networkProviderId: string,
	organizationId: string,
) => {
	const provider = await findNetworkProviderById(networkProviderId);
	if (provider.organizationId !== organizationId) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "You are not allowed to access this network provider",
		});
	}
	return provider;
};

export const findNetworkProvidersByOrganizationId = async (
	organizationId: string,
) => {
	return await db.query.networkProvider.findMany({
		where: eq(networkProvider.organizationId, organizationId),
		orderBy: [asc(networkProvider.name)],
	});
};

export const listNetworkProviderPeers = async (networkProviderId: string) => {
	return await db.query.networkPeer.findMany({
		where: eq(networkPeer.networkProviderId, networkProviderId),
		orderBy: [asc(networkPeer.name)],
	});
};

export const updateNetworkProvider = async (
	networkProviderId: string,
	name: string,
	config: NetworkProviderConfig,
	peers: NetworkPeerInput[],
	organizationId: string,
) => {
	const existing = await findNetworkProviderById(networkProviderId);
	const mergedConfig = mergeNetworkProviderConfig(config, existing.config);

	try {
		return await db.transaction(async (tx) => {
			const [updated] = await tx
				.update(networkProvider)
				.set({
					name,
					providerType: mergedConfig.providerType,
					config: mergedConfig,
				})
				.where(eq(networkProvider.networkProviderId, networkProviderId))
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Error updating the network provider",
				});
			}

			await replacePeers(tx, networkProviderId, organizationId, peers);
			return updated;
		});
	} catch (error) {
		if (isUniqueNameViolation(error)) {
			throw new TRPCError({
				code: "CONFLICT",
				message: `A network provider named "${name}" already exists in this organization`,
			});
		}
		if (isUniquePeerAddressViolation(error)) {
			throw new TRPCError({
				code: "CONFLICT",
				message: "Two peers share the same address in this network",
			});
		}
		throw error;
	}
};

export const removeNetworkProvider = async (networkProviderId: string) => {
	const removed = await db
		.delete(networkProvider)
		.where(eq(networkProvider.networkProviderId, networkProviderId))
		.returning()
		.then((res) => res[0]);

	if (!removed) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Network provider not found",
		});
	}
	return removed;
};

/**
 * Probes a provider. Docker providers are checked against the live daemon;
 * VPN providers validate their declarative config until the agent-side
 * handshake checks land. A provider that reports `connected` is safe to use
 * for routine operations.
 */
export const testNetworkProviderConnection = async (
	config: NetworkProviderConfig,
): Promise<void> => {
	switch (config.providerType) {
		case "docker": {
			const docker = await getRemoteDocker(config.serverId ?? null);
			try {
				await docker.listNetworks();
			} catch (error) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						error instanceof Error
							? error.message
							: "Docker daemon is unreachable",
				});
			}
			return;
		}
		case "wireguard": {
			if (!isValidCidr(config.cidr)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "WireGuard requires a valid tunnel CIDR",
				});
			}
			return;
		}
		case "tailscale": {
			if (!config.tailnet && !config.authKeySecretRef) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Provide a tailnet or an auth key secret reference",
				});
			}
			return;
		}
		case "openvpn": {
			if (!config.remote) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "OpenVPN requires a remote endpoint",
				});
			}
			return;
		}
		case "custom": {
			if (!/^https?:\/\//.test(config.baseUrl)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "The custom endpoint must start with http:// or https://",
				});
			}
			return;
		}
	}
};

export const getNetworkProviderHealth = async (
	config: NetworkProviderConfig,
	peerCount = 0,
): Promise<{
	status: "connected" | "degraded" | "unreachable" | "misconfigured";
	checkedAt: string;
	latencyMs: number | null;
	message?: string;
	peerCount?: number;
}> => {
	const checkedAt = new Date().toISOString();
	const startedAt = Date.now();
	try {
		await testNetworkProviderConnection(config);
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
			peerCount,
		};
	}
	return {
		status: "connected",
		checkedAt,
		latencyMs: Date.now() - startedAt,
		peerCount,
	};
};

export interface NetworkProviderDescriptor {
	providerType: NetworkProviderConfig["providerType"];
	category: ReturnType<typeof getNetworkProviderCategory>;
	capabilities: ReturnType<typeof getNetworkCapabilities>;
}

/**
 * Capability matrix for every provider type, so the Console can show what a
 * provider supports before one is connected.
 */
export const listNetworkProviderDescriptors =
	(): NetworkProviderDescriptor[] => {
		return networkProviderTypes.map((providerType) => ({
			providerType,
			category: getNetworkProviderCategory(providerType),
			capabilities: getNetworkCapabilities(providerType),
		}));
	};
