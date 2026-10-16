import { db } from "@notploy/server/db";
import { type apiCreateNetwork, network } from "@notploy/server/db/schema";
import { TRPCError } from "@trpc/server";
import type Dockerode from "dockerode";
import { and, eq, inArray, isNull } from "drizzle-orm";
import type { z } from "zod";
import { IS_CLOUD } from "../constants";
import type { ApplicationNested } from "../utils/builders";
import { getRemoteDocker } from "../utils/servers/remote-docker";

const RESERVED_NETWORKS = [
	"bridge",
	"host",
	"none",
	"ingress",
	"docker_gwbridge",
	"notploy-network",
];

/**
 * Dedicated per-service network used when `isolatedNetwork` is on. The prefix
 * keeps it out of the way of user networks and the reserved ones.
 */
export const ISOLATED_NETWORK_PREFIX = "notploy-iso";

export const isolatedNetworkName = (appName: string) =>
	`${ISOLATED_NETWORK_PREFIX}-${appName}`;

/**
 * Makes sure a service's dedicated overlay network exists, creating it if
 * needed. Idempotent, so it is safe to call on every deploy. The service stays
 * attached to notploy-network as well, which is how Traefik keeps serving its
 * domains while it is otherwise isolated.
 */
export const ensureIsolatedNetwork = async (
	appName: string,
	serverId?: string | null,
) => {
	const name = isolatedNetworkName(appName);
	const docker = await getRemoteDocker(serverId ?? null);
	try {
		await docker.getNetwork(name).inspect();
		return name;
	} catch (error) {
		const statusCode = (error as { statusCode?: number })?.statusCode;
		if (statusCode !== 404) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message:
					error instanceof Error
						? error.message
						: "Failed to inspect the isolated network",
				cause: error,
			});
		}
	}

	try {
		await docker.createNetwork({
			Name: name,
			Driver: "overlay",
			Attachable: true,
			CheckDuplicate: true,
		});
	} catch (error) {
		// A concurrent deploy may have created it first; that is fine.
		const message = error instanceof Error ? error.message : "";
		if (!/already exists/i.test(message)) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: message || "Failed to create the isolated network",
				cause: error,
			});
		}
	}

	return name;
};

type DockerNetworkInfo = {
	Id?: string;
	Name: string;
	Driver: string;
	Internal?: boolean;
	Attachable?: boolean;
	Ingress?: boolean;
	EnableIPv4?: boolean;
	EnableIPv6?: boolean;
	Options?: Record<string, string> | null;
	IPAM?: {
		Driver?: string;
		Config?: Array<{
			Subnet?: string;
			Gateway?: string;
			IPRange?: string;
		}> | null;
	};
};

// EnableIPv4 is missing from dockerode's NetworkCreateOptions but supported
// by the daemon (API >= 1.47); the body is sent as-is
type NetworkCreateOptions = Dockerode.NetworkCreateOptions & {
	EnableIPv4?: boolean;
};

const parseMtu = (value: string | undefined) => {
	const mtu = Number.parseInt(value ?? "", 10);
	return Number.isNaN(mtu) ? null : mtu;
};

const isImportableDockerNetwork = (dockerNetwork: DockerNetworkInfo) =>
	!RESERVED_NETWORKS.includes(dockerNetwork.Name) &&
	!dockerNetwork.Ingress &&
	(dockerNetwork.Driver === "bridge" || dockerNetwork.Driver === "overlay");

const mapDockerNetworkToRow = (
	dockerNetwork: DockerNetworkInfo,
	organizationId: string,
	serverId: string | null,
) => ({
	name: dockerNetwork.Name,
	dockerId: dockerNetwork.Id ?? null,
	driver: dockerNetwork.Driver as "bridge" | "overlay",
	internal: dockerNetwork.Internal ?? false,
	attachable: dockerNetwork.Attachable ?? false,
	// Older daemons don't report EnableIPv4; IPv4 is always on there
	enableIPv4: dockerNetwork.EnableIPv4 ?? true,
	enableIPv6: dockerNetwork.EnableIPv6 ?? false,
	mtu: parseMtu(dockerNetwork.Options?.["com.docker.network.driver.mtu"]),
	ipam: {
		driver: dockerNetwork.IPAM?.Driver,
		config: (dockerNetwork.IPAM?.Config ?? []).map((c) => ({
			subnet: c.Subnet,
			gateway: c.Gateway,
			ipRange: c.IPRange,
		})),
	},
	organizationId,
	serverId,
});

const findNetworksByServer = async (
	organizationId: string,
	serverId: string | null,
) => {
	return await db.query.network.findMany({
		where: and(
			eq(network.organizationId, organizationId),
			serverId ? eq(network.serverId, serverId) : isNull(network.serverId),
		),
	});
};

export const findNetworksToSync = async (
	organizationId: string,
	serverId: string | null,
) => {
	if (IS_CLOUD && !serverId) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Server is required",
		});
	}

	const docker = await getRemoteDocker(serverId);
	let dockerNetworks: DockerNetworkInfo[] = [];
	try {
		dockerNetworks = (await docker.listNetworks()) as DockerNetworkInfo[];
	} catch (error) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				error instanceof Error
					? error.message
					: "Failed to list Docker networks",
			cause: error,
		});
	}

	const existing = await findNetworksByServer(organizationId, serverId);
	const existingNames = new Set(existing.map((row) => row.name));
	const dockerByName = new Map(dockerNetworks.map((d) => [d.Name, d] as const));

	const importable = dockerNetworks
		.filter(
			(dockerNetwork) =>
				isImportableDockerNetwork(dockerNetwork) &&
				!existingNames.has(dockerNetwork.Name),
		)
		.map((dockerNetwork) => ({
			name: dockerNetwork.Name,
			driver: dockerNetwork.Driver,
			internal: dockerNetwork.Internal ?? false,
			attachable: dockerNetwork.Attachable ?? false,
			subnets: (dockerNetwork.IPAM?.Config ?? [])
				.map((c) => c.Subnet)
				.filter((s): s is string => !!s),
		}));

	const missing = existing
		.filter((row) => !dockerByName.has(row.name))
		.map((row) => ({ networkId: row.networkId, name: row.name }));

	const changed = existing
		.filter((row) => {
			if (!row.dockerId) return false;
			const dockerNetwork = dockerByName.get(row.name);
			return !!dockerNetwork?.Id && dockerNetwork.Id !== row.dockerId;
		})
		.map((row) => {
			const dockerNetwork = dockerByName.get(row.name);
			return {
				networkId: row.networkId,
				name: row.name,
				driver: dockerNetwork?.Driver,
				internal: dockerNetwork?.Internal ?? false,
				attachable: dockerNetwork?.Attachable ?? false,
			};
		});

	return { importable, missing, changed };
};

export const importDockerNetworks = async (
	organizationId: string,
	serverId: string | null,
	names: string[],
) => {
	if (IS_CLOUD && !serverId) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Server is required",
		});
	}

	const docker = await getRemoteDocker(serverId);
	const existing = await findNetworksByServer(organizationId, serverId);
	const existingNames = new Set(existing.map((row) => row.name));

	const imported: string[] = [];
	const errors: { name: string; error: string }[] = [];

	for (const name of names) {
		if (existingNames.has(name)) {
			errors.push({ name, error: "Already imported" });
			continue;
		}
		try {
			const info = (await docker
				.getNetwork(name)
				.inspect()) as DockerNetworkInfo;
			if (!isImportableDockerNetwork(info)) {
				errors.push({ name, error: "Network is reserved or not supported" });
				continue;
			}
			await db
				.insert(network)
				.values(mapDockerNetworkToRow(info, organizationId, serverId));
			imported.push(name);
		} catch (error) {
			errors.push({
				name,
				error:
					error instanceof Error ? error.message : "Failed to inspect network",
			});
		}
	}

	return { imported, errors };
};

export const resyncNetwork = async (
	networkId: string,
	organizationId: string,
) => {
	const row = await findNetworkById(networkId);
	if (row.organizationId !== organizationId) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Network not found",
		});
	}

	const docker = await getRemoteDocker(row.serverId ?? null);
	let info: DockerNetworkInfo;
	try {
		info = (await docker.getNetwork(row.name).inspect()) as DockerNetworkInfo;
	} catch (error) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				error instanceof Error
					? error.message
					: "Failed to inspect Docker network",
			cause: error,
		});
	}

	const [updated] = await db
		.update(network)
		.set(mapDockerNetworkToRow(info, organizationId, row.serverId))
		.where(eq(network.networkId, networkId))
		.returning();

	if (!updated) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Network not found",
		});
	}

	return updated;
};

export const findNetworkById = async (networkId: string) => {
	const [row] = await db
		.select()
		.from(network)
		.where(eq(network.networkId, networkId))
		.limit(1);

	if (!row) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Network not found",
		});
	}

	return row;
};

export const createNetwork = async (
	input: z.infer<typeof apiCreateNetwork>,
	organizationId: string,
) => {
	if (IS_CLOUD) {
		if (!input.serverId) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Server is required",
			});
		}
	}

	const created = await db.transaction(async (tx) => {
		const [row] = await tx
			.insert(network)
			.values({
				...input,
				organizationId,
			})
			.returning();

		if (!row) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to create network",
			});
		}

		await createDockerNetworkFromRow(row);

		return row;
	});

	return created;
};

const createDockerNetworkFromRow = async (row: typeof network.$inferSelect) => {
	const ipam = row.ipam ?? {};
	const ipamConfig = (ipam.config ?? [])
		.map((c) => {
			const entry: Record<string, string> = {};
			if (c.subnet) entry.Subnet = c.subnet;
			if (c.gateway) entry.Gateway = c.gateway;
			if (c.ipRange) entry.IPRange = c.ipRange;
			return entry;
		})
		.filter((e) => Object.keys(e).length > 0);

	const docker = await getRemoteDocker(row.serverId ?? null);
	try {
		const createOptions: NetworkCreateOptions = {
			Name: row.name,
			Driver: row.driver,
			CheckDuplicate: true,
			Internal: row.internal,
			Attachable: row.attachable,
			EnableIPv4: row.enableIPv4,
			EnableIPv6: row.enableIPv6,
			Options: row.mtu
				? { "com.docker.network.driver.mtu": String(row.mtu) }
				: undefined,
			IPAM: {
				Driver: ipam.driver || "default",
				Config: ipamConfig.length > 0 ? ipamConfig : undefined,
			},
		};
		const created = await docker.createNetwork(createOptions);

		await db
			.update(network)
			.set({ dockerId: created.id })
			.where(eq(network.networkId, row.networkId));
	} catch (error) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				error instanceof Error
					? error.message
					: "Failed to create Docker network",
			cause: error,
		});
	}
};

export const recreateNetwork = async (networkId: string) => {
	const row = await findNetworkById(networkId);
	await createDockerNetworkFromRow(row);
	return row;
};

export const resolveServiceNetworks = async (
	application: Partial<ApplicationNested>,
) => {
	if (application.networkSwarm) {
		return application.networkSwarm;
	}

	const { networkIds, detachNotployNetwork } = application;
	const rows =
		networkIds && networkIds.length > 0
			? await db.query.network.findMany({
					where: and(
						inArray(network.networkId, networkIds),
						eq(network.driver, "overlay"),
					),
					columns: { name: true },
				})
			: [];

	const networks = detachNotployNetwork ? [] : ["notploy-network"];
	for (const row of rows) {
		networks.push(row.name);
	}

	// A service with an isolated network keeps its own dedicated overlay so it
	// is separated from the rest, while notploy-network keeps Traefik routing
	// its domains. Databases have no such flag, so this is a no-op for them.
	if (application.isolatedNetwork && application.appName) {
		const name = await ensureIsolatedNetwork(
			application.appName,
			application.serverId ?? null,
		);
		if (!networks.includes(name)) {
			networks.push(name);
		}
	}

	return networks.map((name) => ({ Target: name }));
};

export const inspectNetwork = async (networkId: string) => {
	const row = await findNetworkById(networkId);

	const docker = await getRemoteDocker(row.serverId ?? null);
	try {
		return await docker.getNetwork(row.name).inspect();
	} catch (error) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				error instanceof Error
					? error.message
					: "Failed to inspect Docker network",
			cause: error,
		});
	}
};

export const removeNetwork = async (networkId: string) => {
	const row = await findNetworkById(networkId);

	const docker = await getRemoteDocker(row.serverId ?? null);
	let dockerNetwork: Dockerode.NetworkInspectInfo | undefined;
	try {
		dockerNetwork = await docker.getNetwork(row.name).inspect();
	} catch (error) {
		const statusCode = (error as { statusCode?: number })?.statusCode;
		if (statusCode !== 404) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message:
					error instanceof Error
						? error.message
						: "Failed to inspect Docker network",
				cause: error,
			});
		}
	}

	if (dockerNetwork) {
		if (
			RESERVED_NETWORKS.includes(dockerNetwork.Name) ||
			dockerNetwork.Ingress ||
			dockerNetwork.ConfigOnly
		) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "System and configuration networks cannot be removed.",
			});
		}
		const connectedContainers = Object.keys(dockerNetwork.Containers ?? {});
		if (connectedContainers.length > 0) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: `This network is connected to ${connectedContainers.length} container(s). Disconnect them before removing the network.`,
			});
		}
	}

	try {
		await docker.getNetwork(row.name).remove();
	} catch (error) {
		const statusCode = (error as { statusCode?: number })?.statusCode;
		if (statusCode !== 404) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message:
					error instanceof Error
						? error.message
						: "Failed to remove Docker network",
				cause: error,
			});
		}
	}

	const [deleted] = await db
		.delete(network)
		.where(eq(network.networkId, networkId))
		.returning();

	if (!deleted) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Network not found",
		});
	}

	return deleted;
};
