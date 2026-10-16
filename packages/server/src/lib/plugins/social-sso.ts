import type { BetterAuthPlugin } from "better-auth";
import { generateState, parseState } from "better-auth";
import { APIError, createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { and, eq, isNotNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "../../db";
import { member, ssoProvider } from "../../db/schema";
import { resolveOrganizationDefaultRole } from "../../services/role";
import {
	buildSocialAuthorizeUrl,
	exchangeSocialCode,
	fetchSocialUser,
	parseOauthConfig,
} from "../../utils/identity/oauth";

/** Path the social source redirects back to, relative to the auth base URL. */
export const SOCIAL_SSO_CALLBACK_PATH = "/sign-in/social-sso/callback";

const SIGN_IN_ERROR_PATH = "/sign-in?error=social_sign_in_failed";

/**
 * Resolves the social provider a sign-in should use: the one named by
 * `providerId`, or the only configured one. Only providers carrying a social
 * configuration are considered, so an OIDC/SAML/LDAP provider never matches.
 */
const resolveSocialProvider = async (providerId?: string) =>
	await db.query.ssoProvider.findFirst({
		where: providerId
			? and(
					eq(ssoProvider.providerId, providerId),
					isNotNull(ssoProvider.oauthConfig),
				)
			: isNotNull(ssoProvider.oauthConfig),
		columns: {
			id: true,
			providerId: true,
			domain: true,
			organizationId: true,
			oauthConfig: true,
		},
	});

/**
 * Social (OAuth 2.0) sign-in.
 *
 * GitHub exposes neither OIDC nor SAML, so it cannot go through the SSO plugin.
 * This adds `/sign-in/social-sso` (redirect to the source) and
 * `/sign-in/social-sso/callback` (exchange the code, provision the user, open a
 * session). The source is the authority, exactly like the directory flow.
 */
export const socialSso = (): BetterAuthPlugin => ({
	id: "social-sso",
	endpoints: {
		signInSocialSso: createAuthEndpoint(
			"/sign-in/social-sso",
			{
				method: "GET",
				query: z.object({ providerId: z.string().optional() }),
			},
			async (ctx) => {
				const provider = await resolveSocialProvider(ctx.query.providerId);
				if (!provider) {
					throw new APIError("UNAUTHORIZED", {
						message: "No social sign-in source is configured.",
					});
				}

				const config = parseOauthConfig(provider.oauthConfig);
				if (!config) {
					throw new APIError("INTERNAL_SERVER_ERROR", {
						message: "The social sign-in configuration is invalid.",
					});
				}

				// Signed, single-use state: it carries the provider so the callback
				// cannot be pointed at another source, and expires on its own.
				const { state } = await generateState(ctx, undefined, {
					providerId: provider.providerId,
				});

				throw ctx.redirect(
					buildSocialAuthorizeUrl({
						config,
						redirectUri: `${ctx.context.baseURL}${SOCIAL_SSO_CALLBACK_PATH}`,
						state,
					}),
				);
			},
		),
		socialSsoCallback: createAuthEndpoint(
			"/sign-in/social-sso/callback",
			{
				method: "GET",
				query: z.object({
					code: z.string().optional(),
					state: z.string().optional(),
					error: z.string().optional(),
				}),
			},
			async (ctx) => {
				if (ctx.query.error || !ctx.query.code) {
					throw ctx.redirect(SIGN_IN_ERROR_PATH);
				}

				let providerId: string | undefined;
				try {
					const stateData = await parseState(ctx);
					providerId =
						typeof stateData?.providerId === "string"
							? stateData.providerId
							: undefined;
				} catch {
					throw ctx.redirect(SIGN_IN_ERROR_PATH);
				}

				const provider = await resolveSocialProvider(providerId);
				const config = parseOauthConfig(provider?.oauthConfig ?? null);
				if (!provider || !config) {
					throw ctx.redirect(SIGN_IN_ERROR_PATH);
				}

				const accessToken = await exchangeSocialCode({
					config,
					code: ctx.query.code,
					redirectUri: `${ctx.context.baseURL}${SOCIAL_SSO_CALLBACK_PATH}`,
				}).catch(() => null);
				if (!accessToken) {
					throw ctx.redirect(SIGN_IN_ERROR_PATH);
				}

				const socialUser = await fetchSocialUser({
					config,
					accessToken,
				}).catch(() => null);
				if (!socialUser) {
					throw ctx.redirect(SIGN_IN_ERROR_PATH);
				}

				const email = socialUser.email.toLowerCase();
				const existing =
					await ctx.context.internalAdapter.findUserByEmail(email);
				const user = existing
					? await ctx.context.internalAdapter.updateUser(existing.user.id, {
							name: socialUser.name,
						})
					: await ctx.context.internalAdapter.createUser({
							email,
							emailVerified: true,
							name: socialUser.name,
						});

				// JIT provisioning: social users do not go through `/sso`, so grant
				// them membership of the provider's organization (the owner is
				// created on first boot).
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

				throw ctx.redirect("/");
			},
		),
	},
});
