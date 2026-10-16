export type DomainScope = "public" | "localhost" | "lan" | "local" | "custom";

export interface DomainRequirements {
	scope: DomainScope;
	requiresPublicDns: boolean;
	allowsPublicAcme: boolean;
}

/**
 * Suffixes that only resolve inside a private network. `.lan` is the
 * conventional home/office TLD and `.local` is reserved for mDNS/Bonjour
 * (RFC 6762), so neither is reachable through public DNS nor eligible for a
 * public ACME certificate.
 */
const LAN_SUFFIXES = ["lan"] as const;
const MDNS_SUFFIXES = ["local"] as const;

/** Names reserved for private use by RFC 8375 / RFC 6761. */
const INTERNAL_SUFFIXES = ["home.arpa", "internal"];

const hasSuffix = (hostname: string, suffix: string) =>
	hostname === suffix || hostname.endsWith(`.${suffix}`);

const internalRequirements = (scope: DomainScope): DomainRequirements => ({
	scope,
	requiresPublicDns: false,
	allowsPublicAcme: false,
});

/**
 * Number of trailing labels kept as the internal DNS zone, mirroring how
 * registrable domains work: `gitlab.notploy.lan` belongs to `notploy.lan`.
 */
const INTERNAL_ZONE_LABEL_COUNT = 2;

export const deriveInternalDnsZone = (host: string) => {
	const labels = host.trim().toLowerCase().replace(/\.$/, "").split(".");
	if (labels.length <= INTERNAL_ZONE_LABEL_COUNT) {
		return labels.join(".");
	}
	return labels.slice(-INTERNAL_ZONE_LABEL_COUNT).join(".");
};

export const getDomainRequirements = (host: string): DomainRequirements => {
	const hostname = host.trim().toLowerCase().replace(/\.$/, "");

	if (hasSuffix(hostname, "localhost")) {
		return internalRequirements("localhost");
	}

	if (MDNS_SUFFIXES.some((suffix) => hasSuffix(hostname, suffix))) {
		return internalRequirements("local");
	}

	if (LAN_SUFFIXES.some((suffix) => hasSuffix(hostname, suffix))) {
		return internalRequirements("lan");
	}

	if (
		INTERNAL_SUFFIXES.some((suffix) => hasSuffix(hostname, suffix)) ||
		hostname.split(".").includes("internal")
	) {
		return internalRequirements("custom");
	}

	return { scope: "public", requiresPublicDns: true, allowsPublicAcme: true };
};

/**
 * Whether the hostname can only be reached inside the private network. Used by
 * the UI to hide public-DNS helpers and to warn before a public certificate
 * resolver is selected.
 */
export const isInternalDomainScope = (scope: DomainScope) => scope !== "public";
