import type {
	DnsProviderConfig,
	DnsRecordType,
} from "@notploy/server/db/schema";

export interface DnsZone {
	id: string;
	name: string;
}

export interface DnsRecordInput {
	zoneId: string;
	type: DnsRecordType;
	name: string;
	content: string;
	ttl?: number;
	proxied?: boolean;
	comment?: string;
	tags?: string[];
}

export interface DnsRecord {
	id: string;
	type: string;
	name: string;
	content: string;
	ttl: number;
	proxied?: boolean;
	/** Free-form note attached to the record, when the provider supports it. */
	comment?: string;
	/** Labels used to group records, when the provider supports them. */
	tags?: string[];
}

export interface DnsClient<C extends DnsProviderConfig = DnsProviderConfig> {
	listZones(config: C): Promise<DnsZone[]>;
	listRecords(config: C, zoneId: string): Promise<DnsRecord[]>;
	upsertRecord(config: C, record: DnsRecordInput): Promise<{ id: string }>;
	updateRecord(
		config: C,
		zoneId: string,
		recordId: string,
		record: Omit<DnsRecordInput, "zoneId">,
	): Promise<{ id: string }>;
	deleteRecord(config: C, zoneId: string, recordId: string): Promise<void>;
	testConnection(config: C): Promise<void>;
}

/**
 * Providers fall into three categories. The UI groups providers by them and
 * the rest of Notploy never has to know which concrete product sits behind an
 * adapter.
 */
export type DnsProviderCategory = "managed" | "self-hosted" | "internal";

/**
 * Capability matrix exposed to the UI so each connected provider can show what
 * it actually supports. Providers are not required to implement every entry:
 * unsupported capabilities are reported as `false` rather than failing.
 */
export const dnsCapabilities = [
	"zones",
	"a",
	"aaaa",
	"cname",
	"mx",
	"txt",
	"ns",
	"srv",
	"caa",
	"ptr",
	"wildcard",
	"recordCrud",
	"dns01",
	"healthChecks",
	"automaticSync",
] as const;

export type DnsCapability = (typeof dnsCapabilities)[number];

export type DnsCapabilityMatrix = Record<DnsCapability, boolean>;

export const dnsCapabilityLabels: Record<DnsCapability, string> = {
	zones: "Zones",
	a: "A",
	aaaa: "AAAA",
	cname: "CNAME",
	mx: "MX",
	txt: "TXT",
	ns: "NS",
	srv: "SRV",
	caa: "CAA",
	ptr: "PTR",
	wildcard: "Wildcard",
	recordCrud: "Record CRUD",
	dns01: "DNS-01",
	healthChecks: "Health checks",
	automaticSync: "Automatic sync",
};

const allCapabilities = (value: boolean): DnsCapabilityMatrix =>
	Object.fromEntries(
		dnsCapabilities.map((capability) => [capability, value]),
	) as DnsCapabilityMatrix;

/** Every capability disabled — used as the safe default for unknown adapters. */
export const noDnsCapabilities = allCapabilities(false);

/** Every capability enabled — used by adapters that manage records natively. */
export const fullDnsCapabilities = allCapabilities(true);

export const dnsProviderCategory: Record<
	DnsProviderConfig["providerType"],
	DnsProviderCategory
> = {
	cloudflare: "managed",
	route53: "managed",
	porkbun: "managed",
	infomaniak: "managed",
	ovh: "managed",
	hetzner: "managed",
	digitalocean: "managed",
	gandi: "managed",
	vultr: "managed",
	linode: "managed",
	desec: "managed",
	bunny: "managed",
	ns1: "managed",
	godaddy: "managed",
	namecheap: "managed",
	cloudns: "managed",
	powerdns: "self-hosted",
	bind: "self-hosted",
	technitium: "self-hosted",
	coredns: "self-hosted",
	unbound: "self-hosted",
	custom: "managed",
	"notploy-internal": "internal",
};

export type DnsProviderHealthStatus =
	| "connected"
	| "degraded"
	| "unreachable"
	| "misconfigured";

export interface DnsProviderHealth {
	status: DnsProviderHealthStatus;
	checkedAt: string;
	/** Round-trip time of the health probe, when one could be measured. */
	latencyMs: number | null;
	message?: string;
	zoneCount?: number;
}

export const DNS_REQUEST_TIMEOUT_MS = 15_000;

export const dnsFetch = async (url: string, init: RequestInit = {}) => {
	return await fetch(url, {
		...init,
		signal: AbortSignal.timeout(DNS_REQUEST_TIMEOUT_MS),
	});
};