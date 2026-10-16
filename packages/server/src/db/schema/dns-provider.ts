import { relations } from "drizzle-orm";
import {
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { nanoid } from "nanoid";
import { z } from "zod";
import { organization } from "./account";

/**
 * Every provider Notploy can talk to. Notploy never assumes DNS means one SaaS
 * vendor: managed providers, infrastructure the user operates themselves, and
 * Notploy's own internal DNS all sit behind the same adapter contract.
 */
export const dnsProviderTypes = [
	// Managed DNS services
	"cloudflare",
	"route53",
	"porkbun",
	"infomaniak",
	"ovh",
	"hetzner",
	"digitalocean",
	"gandi",
	"vultr",
	"linode",
	"desec",
	"bunny",
	"ns1",
	"godaddy",
	"namecheap",
	"cloudns",
	// Self-hosted / user-operated
	"powerdns",
	"bind",
	"technitium",
	"coredns",
	"unbound",
	// Generic / custom adapter
	"custom",
	// First-party
	"notploy-internal",
] as const;

export type DnsProviderType = (typeof dnsProviderTypes)[number];

export const dnsProviderType = pgEnum("DnsProviderType", dnsProviderTypes);

const httpUrlSchema = (label: string) =>
	z
		.string()
		.trim()
		.min(1, { message: `${label} is required` })
		.refine((value) => /^https?:\/\//.test(value), {
			message: `${label} must start with http:// or https://`,
		});

// ---------------------------------------------------------------------------
// Managed providers
// ---------------------------------------------------------------------------

export const cloudflareDnsConfigSchema = z.object({
	providerType: z.literal("cloudflare"),
	apiToken: z.string().trim().min(1),
});

export const route53DnsConfigSchema = z.object({
	providerType: z.literal("route53"),
	accessKeyId: z.string().trim().min(1),
	secretAccessKey: z.string().trim().min(1),
});

export const porkbunDnsConfigSchema = z.object({
	providerType: z.literal("porkbun"),
	apiKey: z.string().trim().min(1),
	secretApiKey: z.string().trim().min(1),
});

export const infomaniakDnsConfigSchema = z.object({
	providerType: z.literal("infomaniak"),
	apiToken: z.string().trim().min(1),
});

export const ovhApiEndpoints = [
	"ovh-eu",
	"ovh-ca",
	"ovh-us",
	"kimsufi-eu",
	"kimsufi-ca",
	"soyoustart-eu",
	"soyoustart-ca",
] as const;

export const ovhDnsConfigSchema = z.object({
	providerType: z.literal("ovh"),
	endpoint: z.enum(ovhApiEndpoints).default("ovh-eu"),
	applicationKey: z.string().trim().min(1),
	applicationSecret: z.string().trim().min(1),
	consumerKey: z.string().trim().min(1),
});

export const hetznerDnsConfigSchema = z.object({
	providerType: z.literal("hetzner"),
	apiToken: z.string().trim().min(1),
});

export const digitaloceanDnsConfigSchema = z.object({
	providerType: z.literal("digitalocean"),
	apiToken: z.string().trim().min(1),
});

export const gandiDnsConfigSchema = z.object({
	providerType: z.literal("gandi"),
	apiKey: z.string().trim().min(1),
	sharingId: z.string().trim().optional(),
});

export const vultrDnsConfigSchema = z.object({
	providerType: z.literal("vultr"),
	apiKey: z.string().trim().min(1),
});

export const linodeDnsConfigSchema = z.object({
	providerType: z.literal("linode"),
	apiToken: z.string().trim().min(1),
});

export const desecDnsConfigSchema = z.object({
	providerType: z.literal("desec"),
	apiToken: z.string().trim().min(1),
});

export const bunnyDnsConfigSchema = z.object({
	providerType: z.literal("bunny"),
	apiKey: z.string().trim().min(1),
});

export const ns1DnsConfigSchema = z.object({
	providerType: z.literal("ns1"),
	apiKey: z.string().trim().min(1),
});

export const godaddyDnsConfigSchema = z.object({
	providerType: z.literal("godaddy"),
	apiKey: z.string().trim().min(1),
	apiSecret: z.string().trim().min(1),
	shopperId: z.string().trim().optional(),
});

export const namecheapDnsConfigSchema = z.object({
	providerType: z.literal("namecheap"),
	apiUser: z.string().trim().min(1),
	apiKey: z.string().trim().min(1),
	userName: z.string().trim().min(1),
	clientIp: z.string().trim().min(1),
});

export const cloudnsDnsConfigSchema = z.object({
	providerType: z.literal("cloudns"),
	authId: z.string().trim().min(1),
	authPassword: z.string().trim().min(1),
	subAuthId: z.string().trim().optional(),
});

// ---------------------------------------------------------------------------
// Self-hosted / user-operated providers
// ---------------------------------------------------------------------------

export const powerdnsDnsConfigSchema = z.object({
	providerType: z.literal("powerdns"),
	apiUrl: httpUrlSchema("The endpoint"),
	apiKey: z.string().trim().min(1),
	serverId: z.string().trim().min(1).default("localhost"),
	allowInsecureTls: z.boolean().default(false),
});

export const bindTsigAlgorithms = [
	"hmac-md5",
	"hmac-sha1",
	"hmac-sha224",
	"hmac-sha256",
	"hmac-sha384",
	"hmac-sha512",
] as const;

export const bindDnsConfigSchema = z.object({
	providerType: z.literal("bind"),
	// Notploy server used to reach the nameserver over SSH and run nsupdate.
	serverId: z.string().trim().min(1),
	serverAddress: z.string().trim().min(1),
	port: z.number().int().positive().max(65535).default(53),
	tsigKeyName: z.string().trim().min(1),
	tsigAlgorithm: z.enum(bindTsigAlgorithms).default("hmac-sha256"),
	tsigSecret: z.string().trim().min(1),
	// BIND exposes no zone discovery interface, so zones are declared here.
	zones: z.array(z.string().trim().min(1)).default([]),
});

export const technitiumDnsConfigSchema = z.object({
	providerType: z.literal("technitium"),
	apiUrl: httpUrlSchema("The endpoint"),
	apiToken: z.string().trim().min(1),
	allowInsecureTls: z.boolean().default(false),
});

/**
 * CoreDNS has no management API of its own; the usual way to drive it is the
 * etcd plugin, so the adapter talks to the etcd v3 HTTP gateway.
 */
export const corednsDnsConfigSchema = z.object({
	providerType: z.literal("coredns"),
	etcdEndpoints: z.string().trim().min(1),
	username: z.string().trim().optional(),
	password: z.string().trim().optional(),
	zones: z.array(z.string().trim().min(1)).default([]),
	tlsSkipVerify: z.boolean().default(false),
});

/**
 * Unbound serves local zones rather than acting as an authoritative server, so
 * the adapter drives it through `unbound-control` on the registered server.
 */
export const unboundDnsConfigSchema = z.object({
	providerType: z.literal("unbound"),
	serverId: z.string().trim().min(1),
	configPath: z.string().trim().default("/etc/unbound/unbound.conf"),
	zones: z.array(z.string().trim().min(1)).default([]),
});

// ---------------------------------------------------------------------------
// Generic / custom provider
// ---------------------------------------------------------------------------

/**
 * Adapter for organizations with their own DNS platform. Notploy speaks a small
 * documented HTTP contract instead of natively knowing the product.
 */
export const customDnsConfigSchema = z.object({
	providerType: z.literal("custom"),
	baseUrl: httpUrlSchema("The endpoint"),
	apiToken: z.string().trim().min(1),
	zones: z.array(z.string().trim().min(1)).default([]),
	allowInsecureTls: z.boolean().default(false),
});

// ---------------------------------------------------------------------------
// First-party provider
// ---------------------------------------------------------------------------

export const notployInternalDnsConfigSchema = z.object({
	providerType: z.literal("notploy-internal"),
	defaultTtl: z.number().int().positive().default(300),
});

export const dnsProviderConfigSchema = z.discriminatedUnion("providerType", [
	cloudflareDnsConfigSchema,
	route53DnsConfigSchema,
	porkbunDnsConfigSchema,
	infomaniakDnsConfigSchema,
	ovhDnsConfigSchema,
	hetznerDnsConfigSchema,
	digitaloceanDnsConfigSchema,
	gandiDnsConfigSchema,
	vultrDnsConfigSchema,
	linodeDnsConfigSchema,
	desecDnsConfigSchema,
	bunnyDnsConfigSchema,
	ns1DnsConfigSchema,
	godaddyDnsConfigSchema,
	namecheapDnsConfigSchema,
	cloudnsDnsConfigSchema,
	powerdnsDnsConfigSchema,
	bindDnsConfigSchema,
	technitiumDnsConfigSchema,
	corednsDnsConfigSchema,
	unboundDnsConfigSchema,
	customDnsConfigSchema,
	notployInternalDnsConfigSchema,
]);

export type DnsProviderConfig = z.infer<typeof dnsProviderConfigSchema>;

export const dnsProvider = pgTable(
	"dns_provider",
	{
		dnsProviderId: text("dnsProviderId")
			.notNull()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		name: text("name").notNull(),
		providerType: dnsProviderType("providerType").notNull(),
		config: jsonb("config").$type<DnsProviderConfig>().notNull(),
		organizationId: text("organizationId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		createdAt: text("createdAt")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
	},
	(table) => [
		uniqueIndex("dns_provider_org_name_idx").on(
			table.organizationId,
			table.name,
		),
	],
);

export const dnsRecordTypeEnum = pgEnum("dnsRecordType", [
	"A",
	"AAAA",
	"CNAME",
	"MX",
	"TXT",
	"NS",
	"SRV",
	"CAA",
	"PTR",
]);

/**
 * Zones and records owned by the first-party Notploy Internal DNS provider.
 * They are the source of truth for the internal adapter, which is why they are
 * persisted instead of being resolved inside the web application.
 */
export const dnsZone = pgTable(
	"dns_zone",
	{
		dnsZoneId: text("dnsZoneId")
			.notNull()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		dnsProviderId: text("dnsProviderId")
			.notNull()
			.references(() => dnsProvider.dnsProviderId, { onDelete: "cascade" }),
		organizationId: text("organizationId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		// Distinguishes private/internal zones (e.g. sge.lan) from publicly
		// resolvable ones, which matters for TLS/ACME decisions.
		scope: text("scope").notNull().default("internal"),
		createdAt: text("createdAt")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
	},
	(table) => [
		uniqueIndex("dns_zone_provider_name_idx").on(
			table.dnsProviderId,
			table.name,
		),
		index("dns_zone_org_idx").on(table.organizationId),
	],
);

export const dnsRecord = pgTable(
	"dns_record",
	{
		dnsRecordId: text("dnsRecordId")
			.notNull()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		dnsZoneId: text("dnsZoneId")
			.notNull()
			.references(() => dnsZone.dnsZoneId, { onDelete: "cascade" }),
		type: dnsRecordTypeEnum("type").notNull(),
		name: text("name").notNull(),
		content: text("content").notNull(),
		ttl: integer("ttl").notNull().default(300),
		// Free-form note and labels, mirroring Cloudflare's record metadata. Only
		// providers whose API exposes them (and the internal provider) persist
		// values here; they stay empty for the rest.
		comment: text("comment"),
		tags: jsonb("tags").$type<string[]>().notNull().default([]),
		// managed = created by Notploy, imported = adopted from the provider,
		// external = observed but not owned by Notploy.
		ownership: text("ownership").notNull().default("managed"),
		createdAt: text("createdAt")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
		updatedAt: text("updatedAt")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
	},
	(table) => [
		uniqueIndex("dns_record_zone_name_type_content_idx").on(
			table.dnsZoneId,
			table.type,
			table.name,
			table.content,
		),
		index("dns_record_zone_idx").on(table.dnsZoneId),
	],
);

export const dnsProviderRelations = relations(dnsProvider, ({ many }) => ({
	zones: many(dnsZone),
}));

export const dnsZoneRelations = relations(dnsZone, ({ one, many }) => ({
	provider: one(dnsProvider, {
		fields: [dnsZone.dnsProviderId],
		references: [dnsProvider.dnsProviderId],
	}),
	records: many(dnsRecord),
}));

export const dnsRecordRelations = relations(dnsRecord, ({ one }) => ({
	zone: one(dnsZone, {
		fields: [dnsRecord.dnsZoneId],
		references: [dnsZone.dnsZoneId],
	}),
}));

const dnsProviderNameSchema = z
	.string()
	.min(1)
	.max(64)
	.regex(
		/^[a-zA-Z0-9_-]+$/,
		"Name can only contain letters, numbers, dashes and underscores",
	);

const createSchema = createInsertSchema(dnsProvider);

export const apiCreateDnsProvider = createSchema.pick({}).extend({
	name: dnsProviderNameSchema,
	config: dnsProviderConfigSchema,
});

export const apiUpdateDnsProvider = createSchema.pick({}).extend({
	dnsProviderId: z.string().min(1),
	name: dnsProviderNameSchema,
	config: dnsProviderConfigSchema,
});

export const apiFindOneDnsProvider = z.object({
	dnsProviderId: z.string().min(1),
});

export const apiRemoveDnsProvider = z.object({
	dnsProviderId: z.string().min(1),
});

export const apiTestDnsProvider = z.object({
	dnsProviderId: z.string().min(1).optional(),
	config: dnsProviderConfigSchema.optional(),
});

export const apiListDnsZones = z.object({
	dnsProviderId: z.string().min(1),
});

export const apiListDnsRecords = z.object({
	dnsProviderId: z.string().min(1),
	zoneId: z.string().min(1),
});

export const dnsRecordTypes = [
	"A",
	"AAAA",
	"CNAME",
	"MX",
	"TXT",
	"NS",
	"SRV",
	"CAA",
	"PTR",
] as const;

export type DnsRecordType = (typeof dnsRecordTypes)[number];

export const proxiableDnsRecordTypes = ["A", "AAAA", "CNAME"] as const;

const dnsRecordFieldsSchema = z.object({
	type: z.enum(dnsRecordTypes),
	name: z.string().min(1),
	content: z.string().min(1),
	ttl: z.number().int().positive().optional(),
	proxied: z.boolean().optional(),
	comment: z.string().max(500).optional(),
	tags: z.array(z.string().min(1).max(64)).max(20).optional(),
});

export const apiCreateDnsRecord = dnsRecordFieldsSchema.extend({
	dnsProviderId: z.string().min(1),
	zoneId: z.string().min(1),
});

export const apiUpdateDnsRecord = dnsRecordFieldsSchema.extend({
	dnsProviderId: z.string().min(1),
	zoneId: z.string().min(1),
	recordId: z.string().min(1),
});

export const apiDeleteDnsRecord = z.object({
	dnsProviderId: z.string().min(1),
	zoneId: z.string().min(1),
	recordId: z.string().min(1),
});

export const apiExportDnsZone = z.object({
	dnsProviderId: z.string().min(1),
	zoneId: z.string().min(1),
});

export const apiImportDnsZone = z.object({
	dnsProviderId: z.string().min(1),
	zoneId: z.string().min(1),
	content: z.string().min(1),
});