import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";
import { organization } from "./account";
import { user } from "./user";

export const ssoProvider = pgTable("sso_provider", {
	id: text("id").primaryKey(),
	issuer: text("issuer").notNull(),
	oidcConfig: text("oidc_config"),
	samlConfig: text("saml_config"),
	ldapConfig: text("ldap_config"),
	oauthConfig: text("oauth_config"),
	providerId: text("provider_id").notNull().unique(),
	userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
	organizationId: text("organization_id").references(() => organization.id, {
		onDelete: "cascade",
	}),
	domain: text("domain").notNull(),
	domainVerified: boolean("domain_verified").notNull().default(true),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ssoProviderRelations = relations(ssoProvider, ({ one }) => ({
	organization: one(organization, {
		fields: [ssoProvider.organizationId],
		references: [organization.id],
	}),
	user: one(user, {
		fields: [ssoProvider.userId],
		references: [user.id],
	}),
}));
const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

/**
 * Directory (LDAP / Active Directory) configuration.
 *
 * Secrets (`bindPassword`) are stored server-side only and are never returned
 * to the Console: reads go through the router's sanitizer.
 */
export const identityLdapConfigSchema = z.object({
	/** Which directory protocol this configuration targets. */
	directoryType: z.enum(["ldap", "active-directory"]).default("ldap"),
	/** `ldap://host:389` or `ldaps://host:636`. */
	url: z.string().min(1),
	/** Service account used to search the directory. Optional for anonymous bind. */
	bindDn: z.string().optional(),
	bindPassword: z.string().optional(),
	/** Base DN searched for user entries. */
	baseDn: z.string().min(1),
	/**
	 * Search filter used to locate a user. `{{username}}` is replaced with the
	 * submitted identifier (email local part or full email).
	 */
	userSearchFilter: z.string().min(1).default("(mail={{username}})"),
	/** Attribute holding the user's email. */
	emailAttribute: z.string().min(1).default("mail"),
	/** Attribute holding the user's display name. */
	nameAttribute: z.string().optional().default("cn"),
	/** Attribute holding the user's unique id. */
	idAttribute: z.string().min(1).default("entryUUID"),
	groupBaseDn: z.string().optional(),
	groupSearchFilter: z.string().optional(),
	groupAttribute: z.string().optional(),
	/** Skip TLS certificate verification (self-signed internal directories). */
	tlsSkipVerify: z.boolean().optional().default(false),
	startTls: z.boolean().optional().default(false),
});

export type IdentityLdapConfig = z.infer<typeof identityLdapConfigSchema>;

/**
 * Social (OAuth 2.0) configuration.
 *
 * Some sources — GitHub is the first — expose neither OIDC nor SAML, so they
 * cannot go through the SSO plugin. They are stored like every other provider
 * and drive a dedicated sign-in endpoint. `provider` is the discriminator, so
 * supporting another social source is a registry entry, not a schema change.
 *
 * Secrets (`clientSecret`) are stored server-side only and never returned to
 * the Console: reads go through the router's sanitizer.
 */
export const identityOauthConfigSchema = z.object({
	/** Which social source this configuration targets. */
	provider: z.enum(["github"]).default("github"),
	clientId: z.string().min(1),
	clientSecret: z.string().min(1),
	/** Scopes requested from the source, when the defaults are not enough. */
	scopes: z.array(z.string()).optional(),
});

export type IdentityOauthConfig = z.infer<typeof identityOauthConfigSchema>;

export const ssoProviderBodySchema = z.object({
	providerId: z.string({}),
	issuer: z.string({}),
	domains: z
		.string()
		.array()
		.transform((val) =>
			Array.from(
				new Set(val.map((d) => d.trim().toLowerCase()).filter(Boolean)),
			),
		)
		.refine((val) => val.every((d) => domainRegex.test(d)), {
			message: "Invalid domain",
			path: ["domains"],
		}),
	oidcConfig: z
		.object({
			clientId: z.string({}),
			clientSecret: z.string({}),
			authorizationEndpoint: z.string({}).optional(),
			tokenEndpoint: z.string({}).optional(),
			userInfoEndpoint: z.string({}).optional(),
			tokenEndpointAuthentication: z
				.enum(["client_secret_post", "client_secret_basic"])
				.optional(),
			jwksEndpoint: z.string({}).optional(),
			discoveryEndpoint: z.string().optional(),
			skipDiscovery: z.boolean().optional(),
			scopes: z.array(z.string()).optional(),
			pkce: z.boolean().default(true).optional(),
			mapping: z
				.object({
					id: z.string({}),
					email: z.string({}),
					emailVerified: z.string({}).optional(),
					name: z.string({}),
					image: z.string({}).optional(),
					extraFields: z.record(z.string(), z.any()).optional(),
				})
				.optional(),
		})
		.optional(),
	samlConfig: z
		.object({
			entryPoint: z.string({}),
			cert: z.string({}),
			callbackUrl: z.string({}),
			audience: z.string().optional(),
			idpMetadata: z
				.object({
					metadata: z.string().optional(),
					entityID: z.string().optional(),
					cert: z.string().optional(),
					privateKey: z.string().optional(),
					privateKeyPass: z.string().optional(),
					isAssertionEncrypted: z.boolean().optional(),
					encPrivateKey: z.string().optional(),
					encPrivateKeyPass: z.string().optional(),
					singleSignOnService: z
						.array(
							z.object({
								Binding: z.string(),
								Location: z.string(),
							}),
						)
						.optional(),
				})
				.optional(),
			spMetadata: z.object({
				metadata: z.string().optional(),
				entityID: z.string().optional(),
				binding: z.string().optional(),
				privateKey: z.string().optional(),
				privateKeyPass: z.string().optional(),
				isAssertionEncrypted: z.boolean().optional(),
				encPrivateKey: z.string().optional(),
				encPrivateKeyPass: z.string().optional(),
			}),
			wantAssertionsSigned: z.boolean().optional(),
			authnRequestsSigned: z.boolean().optional(),
			signatureAlgorithm: z.string().optional(),
			digestAlgorithm: z.string().optional(),
			identifierFormat: z.string().optional(),
			privateKey: z.string().optional(),
			decryptionPvk: z.string().optional(),
			additionalParams: z.record(z.string(), z.any()).optional(),
			mapping: z
				.object({
					id: z.string({}),
					email: z.string({}),
					emailVerified: z.string({}).optional(),
					name: z.string({}),
					firstName: z.string({}).optional(),
					lastName: z.string({}).optional(),
					extraFields: z.record(z.string(), z.any()).optional(),
				})
				.optional(),
		})
		.optional(),
	ldapConfig: identityLdapConfigSchema.optional(),
	oauthConfig: identityOauthConfigSchema.optional(),
	organizationId: z.string({}).optional(),
	overrideUserInfo: z.boolean({}).default(false).optional(),
});
