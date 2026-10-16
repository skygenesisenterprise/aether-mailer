import type { LucideIcon } from "lucide-react";
import { Boxes, Cable, Lock, Network, Shield, Waypoints } from "lucide-react";

/**
 * Network providers have no single consistent brand mark, so each type gets a
 * semantic lucide glyph instead. WireGuard/Tailscale/OpenVPN read as encrypted
 * tunnels; Docker reads as container networking.
 */
const DockerNetworkIcon: LucideIcon = Boxes;
const WireguardNetworkIcon: LucideIcon = Shield;
const TailscaleNetworkIcon: LucideIcon = Waypoints;
const OpenvpnNetworkIcon: LucideIcon = Lock;
const CustomNetworkIcon: LucideIcon = Cable;

/** Fallback used when a provider type has no dedicated glyph. */
export const DefaultNetworkProviderIcon = Network;

export const networkProviderIcons = {
	docker: DockerNetworkIcon,
	wireguard: WireguardNetworkIcon,
	tailscale: TailscaleNetworkIcon,
	openvpn: OpenvpnNetworkIcon,
	custom: CustomNetworkIcon,
} as const;

export type NetworkProviderIconKey = keyof typeof networkProviderIcons;
