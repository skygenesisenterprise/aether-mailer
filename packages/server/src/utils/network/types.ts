import type { NetworkProviderConfig } from "@notploy/server/db/schema";

/**
 * A network provider is the connectivity layer behind one or more networks.
 * Docker's native networking is just one provider: the abstraction keeps VPN
 * providers (WireGuard, Tailscale, OpenVPN) first-class instead of bolting them
 * on as a secondary toggle.
 */
export type NetworkProviderCategory = "native" | "vpn" | "byo";

export const networkCapabilities = [
	"networks",
	"bridge",
	"overlay",
	"ipam",
	"internal",
	"attachable",
	"peers",
	"subnets",
	"mesh",
	"multiServer",
	"encrypted",
	"remoteAccess",
	"natTraversal",
	"healthChecks",
	"automaticSync",
	"connectivityTest",
] as const;

export type NetworkCapability = (typeof networkCapabilities)[number];

export type NetworkCapabilityMatrix = Record<NetworkCapability, boolean>;

export const networkCapabilityLabels: Record<NetworkCapability, string> = {
	networks: "Networks",
	bridge: "Bridge",
	overlay: "Overlay",
	ipam: "IPAM",
	internal: "Internal",
	attachable: "Attachable",
	peers: "Peers",
	subnets: "Subnets",
	mesh: "Mesh",
	multiServer: "Multi-server",
	encrypted: "Encrypted",
	remoteAccess: "Remote access",
	natTraversal: "NAT traversal",
	healthChecks: "Health checks",
	automaticSync: "Automatic sync",
	connectivityTest: "Connectivity test",
};

const allCapabilities = (value: boolean): NetworkCapabilityMatrix =>
	Object.fromEntries(
		networkCapabilities.map((capability) => [capability, value]),
	) as NetworkCapabilityMatrix;

/** Every capability disabled — the safe default for unknown adapters. */
export const noNetworkCapabilities = allCapabilities(false);

/** Every capability enabled — used by adapters that support the full model. */
export const fullNetworkCapabilities = allCapabilities(true);

export type NetworkProviderHealthStatus =
	| "connected"
	| "degraded"
	| "unreachable"
	| "misconfigured";

export interface NetworkProviderHealth {
	status: NetworkProviderHealthStatus;
	checkedAt: string;
	/** Round-trip time of the health probe, when one could be measured. */
	latencyMs: number | null;
	message?: string;
	/** Number of peers reachable at the last check, when known. */
	peerCount?: number;
}

export const networkProviderCategory: Record<
	NetworkProviderConfig["providerType"],
	NetworkProviderCategory
> = {
	docker: "native",
	wireguard: "vpn",
	tailscale: "vpn",
	openvpn: "vpn",
	custom: "byo",
};
