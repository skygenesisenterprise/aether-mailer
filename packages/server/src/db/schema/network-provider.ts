import { relations } from "drizzle-orm";
import {
	index,
	jsonb,
	pgEnum,
	pgTable,
	text,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { nanoid } from "nanoid";
import { z } from "zod";
import { cidrOverlaps, isValidCidr, isValidIp } from "../../utils/network/cidr";
import { organization } from "./account";
import { server } from "./server";

/**
 * A network provider is the connectivity layer behind one or more networks.
 * Docker's own networking is a provider, WireGuard/Tailscale/OpenVPN are
 * providers, and organizations with their own connectivity platform can plug
 * in through the `custom` adapter. The rest of Notploy only needs a provider
 * id and a network id, never the vendor specifics.
 *
 * Secrets are never stored inline: configs carry *references* to entries in the
 * existing secret store, keeping keys out of the database and the API.
 */
export const networkProviderTypes = [
	// Native container networking
	"docker",
	// VPN providers
	"wireguard",
	"tailscale",
	"openvpn",
	// Generic / custom adapter
	"custom",
] as const;

export type NetworkProviderType = (typeof networkProviderTypes)[number];

export const networkProviderType = pgEnum(
	"NetworkProviderType",
	networkProviderTypes,
);

const httpUrlSchema = (label: string) =>
	z
		.string()
		.trim()
		.min(1, { message: `${label} is required` })
		.refine((value) => /^https?:\/\//.test(value), {
			message: `${label} must start with http:// or https://`,
		});

// ---------------------------------------------------------------------------
// Native (Docker) provider
// ---------------------------------------------------------------------------

export const dockerNetworkConfigSchema = z.object({
	providerType: z.literal("docker"),
	// Driver new networks default to when none is chosen explicitly.
	defaultDriver: z.enum(["bridge", "overlay"]).default("bridge"),
	// Registered server whose daemon owns these networks. Omit for the local
	// Notploy server.
	serverId: z.string().trim().optional(),
});

// ---------------------------------------------------------------------------
// WireGuard
// ---------------------------------------------------------------------------

export const wireguardNetworkConfigSchema = z.object({
	providerType: z.literal("wireguard"),
	interfaceName: z.string().trim().min(1).default("wg0"),
	// Tunnel network, e.g. 10.80.0.0/16.
	cidr: z.string().trim().min(1),
	listenPort: z.number().int().min(1).max(65535).default(51820),
	// Public endpoint peers dial, e.g. vpn.example.com:51820.
	endpoint: z.string().trim().optional(),
	publicKey: z.string().trim().optional(),
	// Reference to the vault secret holding the private key — never the key.
	privateKeySecretRef: z.string().trim().optional(),
	dns: z.string().trim().optional(),
	mtu: z.number().int().min(576).max(65535).optional(),
	persistentKeepalive: z.number().int().min(0).max(65535).default(25),
});

// ---------------------------------------------------------------------------
// Tailscale
// ---------------------------------------------------------------------------

export const tailscaleNetworkConfigSchema = z.object({
	providerType: z.literal("tailscale"),
	tailnet: z.string().trim().optional(),
	// Reference to the vault secret holding the auth key.
	authKeySecretRef: z.string().trim().optional(),
	acceptRoutes: z.boolean().default(false),
	advertiseExitNode: z.boolean().default(false),
});

// ---------------------------------------------------------------------------
// OpenVPN
// ---------------------------------------------------------------------------

export const openvpnProtocols = ["udp", "tcp"] as const;

export const openvpnNetworkConfigSchema = z.object({
	providerType: z.literal("openvpn"),
	remote: z.string().trim().min(1),
	port: z.number().int().min(1).max(65535).default(1194),
	protocol: z.enum(openvpnProtocols).default("udp"),
	caSecretRef: z.string().trim().optional(),
	certSecretRef: z.string().trim().optional(),
	keySecretRef: z.string().trim().optional(),
	cipher: z.string().trim().optional(),
});

// ---------------------------------------------------------------------------
// Custom adapter
// ---------------------------------------------------------------------------

export const customNetworkConfigSchema = z.object({
	providerType: z.literal("custom"),
	baseUrl: httpUrlSchema("The endpoint"),
	apiTokenSecretRef: z.string().trim().optional(),
	cidr: z.string().trim().optional(),
	allowInsecureTls: z.boolean().default(false),
});

export const networkProviderConfigSchema = z.discriminatedUnion(
	"providerType",
	[
		dockerNetworkConfigSchema,
		wireguardNetworkConfigSchema,
		tailscaleNetworkConfigSchema,
		openvpnNetworkConfigSchema,
		customNetworkConfigSchema,
	],
);

export type NetworkProviderConfig = z.infer<typeof networkProviderConfigSchema>;

export const networkProvider = pgTable(
	"network_provider",
	{
		networkProviderId: text("networkProviderId")
			.notNull()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		name: text("name").notNull(),
		providerType: networkProviderType("providerType").notNull(),
		config: jsonb("config").$type<NetworkProviderConfig>().notNull(),
		organizationId: text("organizationId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		createdAt: text("createdAt")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
	},
	(table) => [
		uniqueIndex("network_provider_org_name_idx").on(
			table.organizationId,
			table.name,
		),
	],
);

/**
 * A peer is one endpoint inside a VPN network — typically a registered Notploy
 * server. Docker networks have no peers, so the table stays empty for them.
 */
export const networkPeer = pgTable(
	"network_peer",
	{
		networkPeerId: text("networkPeerId")
			.notNull()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		networkProviderId: text("networkProviderId")
			.notNull()
			.references(() => networkProvider.networkProviderId, {
				onDelete: "cascade",
			}),
		name: text("name").notNull(),
		serverId: text("serverId").references(() => server.serverId, {
			onDelete: "set null",
		}),
		address: text("address").notNull(),
		publicKey: text("publicKey"),
		endpoint: text("endpoint"),
		allowedIps: jsonb("allowedIps").$type<string[]>().notNull().default([]),
		organizationId: text("organizationId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		createdAt: text("createdAt")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
	},
	(table) => [
		uniqueIndex("network_peer_provider_address_idx").on(
			table.networkProviderId,
			table.address,
		),
		index("network_peer_provider_idx").on(table.networkProviderId),
	],
);

export const networkProviderRelations = relations(
	networkProvider,
	({ many }) => ({
		peers: many(networkPeer),
	}),
);

export const networkPeerRelations = relations(networkPeer, ({ one }) => ({
	provider: one(networkProvider, {
		fields: [networkPeer.networkProviderId],
		references: [networkProvider.networkProviderId],
	}),
	server: one(server, {
		fields: [networkPeer.serverId],
		references: [server.serverId],
	}),
}));

const networkProviderNameSchema = z
	.string()
	.min(1)
	.max(64)
	.regex(
		/^[a-zA-Z0-9_-]+$/,
		"Name can only contain letters, numbers, dashes and underscores",
	);

export const networkPeerInputSchema = z.object({
	name: z.string().trim().min(1).max(64),
	serverId: z.string().trim().optional(),
	address: z.string().trim().min(1),
	publicKey: z.string().trim().optional(),
	endpoint: z.string().trim().optional(),
	allowedIps: z.array(z.string().trim().min(1)).default([]),
});

export type NetworkPeerInput = z.infer<typeof networkPeerInputSchema>;

const peersField = z.array(networkPeerInputSchema).default([]);

/**
 * Validates the parts of a provider config that can only be checked in
 * context: CIDR syntax, peers living inside the network, and duplicate or
 * overlapping entries.
 */
const refineNetworkProvider = (
	input: {
		config: NetworkProviderConfig;
		peers?: NetworkPeerInput[];
	},
	ctx: z.RefinementCtx,
) => {
	const config = input.config;
	const peers = input.peers ?? [];

	const cidr =
		config.providerType === "wireguard"
			? config.cidr
			: config.providerType === "custom"
				? config.cidr
				: undefined;
	if (cidr && !isValidCidr(cidr)) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["config", "cidr"],
			message: "Enter a valid CIDR, e.g. 10.80.0.0/16 or fd00::/64",
		});
	}

	const seenAddresses = new Set<string>();
	for (const [index, peer] of peers.entries()) {
		if (!isValidIp(peer.address)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["peers", index, "address"],
				message: "Enter a valid IPv4 or IPv6 address",
			});
		}
		const key = peer.address.trim();
		if (seenAddresses.has(key)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["peers", index, "address"],
				message: `Peer address ${key} is already used by another peer`,
			});
		}
		seenAddresses.add(key);

		for (const [allowedIndex, allowedIp] of peer.allowedIps.entries()) {
			if (!isValidCidr(allowedIp)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["peers", index, "allowedIps", allowedIndex],
					message: `"${allowedIp}" is not a valid CIDR`,
				});
			}
		}
	}

	const allowedIps = peers.flatMap((peer) => peer.allowedIps);
	for (let index = 0; index < allowedIps.length; index += 1) {
		for (let other = index + 1; other < allowedIps.length; other += 1) {
			if (cidrOverlaps(allowedIps[index]!, allowedIps[other]!)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["peers"],
					message: `Allowed IP ranges ${allowedIps[index]} and ${allowedIps[other]} overlap`,
				});
			}
		}
	}
};

const createSchema = createInsertSchema(networkProvider);

export const apiCreateNetworkProvider = createSchema
	.pick({})
	.extend({
		name: networkProviderNameSchema,
		config: networkProviderConfigSchema,
		peers: peersField,
	})
	.superRefine(refineNetworkProvider);

export const apiUpdateNetworkProvider = createSchema
	.pick({})
	.extend({
		networkProviderId: z.string().min(1),
		name: networkProviderNameSchema,
		config: networkProviderConfigSchema,
		peers: peersField,
	})
	.superRefine(refineNetworkProvider);

export const apiFindOneNetworkProvider = z.object({
	networkProviderId: z.string().min(1),
});

export const apiRemoveNetworkProvider = z.object({
	networkProviderId: z.string().min(1),
});

export const apiTestNetworkProvider = z.object({
	networkProviderId: z.string().min(1).optional(),
	config: networkProviderConfigSchema.optional(),
	peers: z.array(networkPeerInputSchema).optional(),
});
