import type { NetworkProviderConfig } from "@notploy/server/db/schema";
import {
	type NetworkCapabilityMatrix,
	networkProviderCategory,
	noNetworkCapabilities,
} from "./types";

/**
 * Capability matrix per provider type, surfaced in the UI so each provider
 * shows exactly what it supports before anything is connected. Keeping it in
 * one place means the adapter layer and the Console always agree.
 */
const capabilityMatrix: Record<
	NetworkProviderConfig["providerType"],
	NetworkCapabilityMatrix
> = {
	docker: {
		networks: true,
		bridge: true,
		overlay: true,
		ipam: true,
		internal: true,
		attachable: true,
		peers: false,
		subnets: true,
		mesh: false,
		multiServer: true,
		encrypted: false,
		remoteAccess: false,
		natTraversal: false,
		healthChecks: true,
		automaticSync: true,
		connectivityTest: true,
	},
	wireguard: {
		networks: true,
		bridge: false,
		overlay: false,
		ipam: false,
		internal: false,
		attachable: false,
		peers: true,
		subnets: true,
		mesh: true,
		multiServer: true,
		encrypted: true,
		remoteAccess: true,
		natTraversal: true,
		healthChecks: true,
		automaticSync: false,
		connectivityTest: true,
	},
	tailscale: {
		networks: true,
		bridge: false,
		overlay: false,
		ipam: false,
		internal: false,
		attachable: false,
		peers: true,
		subnets: true,
		mesh: true,
		multiServer: true,
		encrypted: true,
		remoteAccess: true,
		natTraversal: true,
		healthChecks: true,
		automaticSync: true,
		connectivityTest: true,
	},
	openvpn: {
		networks: true,
		bridge: false,
		overlay: false,
		ipam: false,
		internal: false,
		attachable: false,
		peers: true,
		subnets: true,
		mesh: false,
		multiServer: true,
		encrypted: true,
		remoteAccess: true,
		natTraversal: false,
		healthChecks: true,
		automaticSync: false,
		connectivityTest: true,
	},
	custom: {
		networks: true,
		bridge: false,
		overlay: false,
		ipam: false,
		internal: false,
		attachable: false,
		peers: false,
		subnets: true,
		mesh: false,
		multiServer: false,
		encrypted: false,
		remoteAccess: false,
		natTraversal: false,
		healthChecks: true,
		automaticSync: false,
		connectivityTest: true,
	},
};

export const getNetworkCapabilities = (
	providerType: NetworkProviderConfig["providerType"],
): NetworkCapabilityMatrix =>
	capabilityMatrix[providerType] ?? noNetworkCapabilities;

export const getNetworkProviderCategory = (
	providerType: NetworkProviderConfig["providerType"],
) => networkProviderCategory[providerType];

export * from "./cidr";
export * from "./types";
