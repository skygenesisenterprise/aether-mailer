import type { DnsProviderConfig } from "@notploy/server/db/schema";
import { bindClient } from "./bind";
import { cloudflareClient } from "./cloudflare";
import {
	type InternalConfigWithProvider,
	internalDnsClient,
} from "./internal";
import { infomaniakClient } from "./infomaniak";
import { ovhClient } from "./ovh";
import { porkbunClient } from "./porkbun";
import { powerdnsClient } from "./powerdns";
import { route53Client } from "./route53";
import { technitiumClient } from "./technitium";
import { bunnyClient } from "./providers/bunny";
import { cloudnsClient } from "./providers/cloudns";
import { corednsClient } from "./providers/coredns";
import { customClient } from "./providers/custom";
import { desecClient } from "./providers/desec";
import { digitaloceanClient } from "./providers/digitalocean";
import { gandiClient } from "./providers/gandi";
import { godaddyClient } from "./providers/godaddy";
import { hetznerClient } from "./providers/hetzner";
import { linodeClient } from "./providers/linode";
import { namecheapClient } from "./providers/namecheap";
import { ns1Client } from "./providers/ns1";
import { unboundClient } from "./providers/unbound";
import { vultrClient } from "./providers/vultr";
import type { DnsCapabilityMatrix, DnsClient } from "./types";
import {
	dnsProviderCategory,
	fullDnsCapabilities,
	noDnsCapabilities,
} from "./types";

const clients: Record<DnsProviderConfig["providerType"], DnsClient> = {
	cloudflare: cloudflareClient as DnsClient,
	route53: route53Client as DnsClient,
	porkbun: porkbunClient as DnsClient,
	infomaniak: infomaniakClient as DnsClient,
	ovh: ovhClient as DnsClient,
	hetzner: hetznerClient as DnsClient,
	digitalocean: digitaloceanClient as DnsClient,
	gandi: gandiClient as DnsClient,
	vultr: vultrClient as DnsClient,
	linode: linodeClient as DnsClient,
	desec: desecClient as DnsClient,
	bunny: bunnyClient as DnsClient,
	ns1: ns1Client as DnsClient,
	godaddy: godaddyClient as DnsClient,
	namecheap: namecheapClient as DnsClient,
	cloudns: cloudnsClient as DnsClient,
	powerdns: powerdnsClient as DnsClient,
	bind: bindClient as DnsClient,
	technitium: technitiumClient as DnsClient,
	coredns: corednsClient as DnsClient,
	unbound: unboundClient as DnsClient,
	custom: customClient as DnsClient,
	"notploy-internal": internalDnsClient as unknown as DnsClient,
};

export const getDnsClient = (providerType: DnsProviderConfig["providerType"]) =>
	clients[providerType];

/**
 * Capability matrix per provider, surfaced in the UI so each connected provider
 * shows exactly what it supports. Keeping it in one place means the adapter
 * layer and the Console always agree.
 */
const managedCapabilities: DnsCapabilityMatrix = {
	...fullDnsCapabilities,
	healthChecks: true,
	automaticSync: true,
};

const selfHostedCapabilities: DnsCapabilityMatrix = {
	...fullDnsCapabilities,
	automaticSync: true,
};

const capabilityMatrix: Record<
	DnsProviderConfig["providerType"],
	DnsCapabilityMatrix
> = {
	cloudflare: { ...managedCapabilities },
	route53: { ...managedCapabilities },
	porkbun: { ...managedCapabilities },
	infomaniak: { ...managedCapabilities },
	ovh: { ...managedCapabilities },
	hetzner: { ...managedCapabilities },
	digitalocean: { ...managedCapabilities },
	gandi: { ...managedCapabilities },
	vultr: { ...managedCapabilities },
	linode: { ...managedCapabilities },
	desec: { ...managedCapabilities },
	bunny: { ...managedCapabilities },
	ns1: { ...managedCapabilities },
	godaddy: { ...managedCapabilities },
	namecheap: { ...managedCapabilities },
	cloudns: { ...managedCapabilities },
	powerdns: { ...selfHostedCapabilities },
	technitium: { ...selfHostedCapabilities },
	bind: { ...selfHostedCapabilities },
	coredns: { ...selfHostedCapabilities },
	unbound: { ...selfHostedCapabilities },
	custom: { ...managedCapabilities },
	"notploy-internal": {
		...fullDnsCapabilities,
		// Internal DNS cannot satisfy a public ACME challenge, but the
		// abstraction still supports DNS-01 for private/internal issuers.
		dns01: false,
	},
};

export const getDnsCapabilities = (
	providerType: DnsProviderConfig["providerType"],
): DnsCapabilityMatrix => capabilityMatrix[providerType] ?? noDnsCapabilities;

export const getDnsProviderCategory = (
	providerType: DnsProviderConfig["providerType"],
) => dnsProviderCategory[providerType];

export type { InternalConfigWithProvider };

export * from "./types";
export * from "./http";
export * from "./zone-file";