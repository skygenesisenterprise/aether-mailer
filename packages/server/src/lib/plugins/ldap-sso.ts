import type { BetterAuthPlugin } from "better-auth";
import { APIError, createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { and, eq, isNotNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "../../db";
import { member, ssoProvider } from "../../db/schema";
import { resolveOrganizationDefaultRole } from "../../services/role";
import {
	authenticateLdapUser,
	parseLdapConfig,
} from "../../utils/identity/ldap";

const emailDomain = (email: string) => email.split("@")[1]?.toLowerCase() ?? "";

/**
 * Resolves the directory provider that owns an email address, or the provider
 * named by `providerId`. Only providers carrying a directory configuration are
 * considered, so an OIDC/SAML provider with the same domain never matches.
 */
const resolveDirectoryProvider = async (input: {
	email: string;
	providerId?: string;
}) => {
	const domain = emailDomain(input.email);
	if (!domain) return null;

	const providers = await db.query.ssoProvider.findMany({
		where: input.providerId
			? and(
					eq(ssoProvider.providerId, input.providerId),
					isNotNull(ssoProvider.ldapConfig),
				)
			: isNotNull(ssoProvider.ldapConfig),
		columns: {
			id: true,
			providerId: true,
			domain: true,
			organizationId: true,
			ldapConfig: true,
		},
	});

	return (
		providers.find((provider) =>
			provider.domain
				.split(",")
				.map((value) => value.trim().toLowerCase())
				.filter(Boolean)
				.some(
					(providerDomain) =>
						domain === providerDomain || domain.endsWith(`.${providerDomain}`),
				),
		) ?? null
	);
};

/**
 * LDAP / Active Directory sign-in.
 *
 * Adds a `/sign-in/ldap` endpoint that verifies the submitted credentials
 * against the configured directory, provisions the better-auth user (JIT) and
 * opens a session — the directory is the authority, mirroring how the SSO
 * plugin turns an external identity into a local session.
 */
export const ldapSso = (): BetterAuthPlugin => ({
	id: "ldap-sso",
	endpoints: {
		signInLdap: createAuthEndpoint(
			"/sign-in/ldap",
			{
				method: "POST",
				body: z.object({
					email: z.string().min(1),
					password: z.string().min(1),
					providerId: z.string().optional(),
				}),
			},
			async (ctx) => {
				const provider = await resolveDirectoryProvider({
					email: ctx.body.email,
					providerId: ctx.body.providerId,
				});
				if (!provider) {
					throw new APIError("UNAUTHORIZED", {
						message: "No directory provider is configured for this address.",
					});
				}

				const config = parseLdapConfig(provider.ldapConfig);
				if (!config) {
					throw new APIError("INTERNAL_SERVER_ERROR", {
						message: "The directory configuration is invalid.",
					});
				}

				const directoryUser = await authenticateLdapUser(config, {
					username: ctx.body.email,
					password: ctx.body.password,
				});
				if (!directoryUser) {
					throw new APIError("UNAUTHORIZED", {
						message: "Invalid directory credentials.",
					});
				}

				const email = directoryUser.email.toLowerCase();
				const existing =
					await ctx.context.internalAdapter.findUserByEmail(email);
				const user = existing
					? await ctx.context.internalAdapter.updateUser(existing.user.id, {
							name: directoryUser.name,
						})
					: await ctx.context.internalAdapter.createUser({
							email,
							emailVerified: true,
							name: directoryUser.name,
						});

				// JIT provisioning: directory users are not created through the
				// `/sso` path, so grant them membership of the provider's
				// organization (owner is created on first boot).
				if (provider.organizationId) {
					const membership = await db.query.member.findFirst({
						where: and(
							eq(member.userId, user.id),
							eq(member.organizationId, provider.organizationId),
						),
						columns: { id: true },
					});
					if (!membership) {
						const role = await resolveOrganizationDefaultRole(
							provider.organizationId,
						);
						await db.insert(member).values({
							id: nanoid(),
							organizationId: provider.organizationId,
							userId: user.id,
							role,
							createdAt: new Date(),
							isDefault: true,
						});
					}
				}

				const session = await ctx.context.internalAdapter.createSession(
					user.id,
				);
				await setSessionCookie(ctx, { session, user });

				return ctx.json({
					status: true,
					token: session.token,
					user: {
						id: user.id,
						email: user.email,
						name: user.name,
					},
				});
			},
		),
	},
});
