import type { IncomingMessage } from "node:http";
import { apiKey } from "@better-auth/api-key";
import { passkey } from "@better-auth/passkey";
import { scim } from "@better-auth/scim";
import { sso } from "@better-auth/sso";
import * as bcrypt from "bcrypt";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { admin, organization, twoFactor } from "better-auth/plugins";
import { and, desc, eq } from "drizzle-orm";
import { IS_CLOUD } from "../constants";
import { db } from "../db";
import * as schema from "../db/schema";
import {
	getTrustedOrigins,
	getTrustedProviders,
	getUserByToken,
} from "../services/admin";
import { createAuditLog } from "../services/proprietary/audit-log";
import { resolveOrganizationDefaultRole } from "../services/role";
import {
	getWebServerSettings,
	updateWebServerSettings,
} from "../services/web-server-settings";
import { getHubSpotUTK, submitToHubSpot } from "../utils/tracking/hubspot";
import {
	sendEmail,
	sendVerificationEmail,
} from "../verification/send-verification-email";
import { getPublicIpWithFallback } from "../wss/utils";
import { ac, adminRole, memberRole, ownerRole } from "./access-control";
import { betterAuthSecret } from "./auth-secret";
import { ldapSso } from "./plugins/ldap-sso";
import { socialSso } from "./plugins/social-sso";

const resolveTrustedOrigins = async () => {
	try {
		if (IS_CLOUD) {
			return await getTrustedOrigins();
		}
		const [trustedOrigins, settings] = await Promise.all([
			getTrustedOrigins(),
			getWebServerSettings(),
		]);

		if (!settings) return [];

		const devOrigins =
			process.env.NODE_ENV === "development"
				? [
						"http://localhost:3000",
						"https://absolutely-handy-falcon.ngrok-free.app",
					]
				: [];
		return [
			...(settings?.serverIp ? [`http://${settings?.serverIp}:3000`] : []),
			...(settings?.host ? [`https://${settings?.host}`] : []),
			...devOrigins,
			...trustedOrigins,
		];
	} catch (error) {
		console.error("Failed to resolve trusted origins:", error);
		return [];
	}
};

const createBetterAuth = () =>
	betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",
			schema: schema,
		}),
		disabledPaths: [
			"/sso/register",
			"/organization/create",
			"/organization/update",
			"/organization/delete",
			...(!IS_CLOUD ? ["/verify-email"] : []),
		],
		secret: betterAuthSecret,
		onAPIError: {
			errorURL: "/",
		},
		...(!IS_CLOUD
			? {
					advanced: {
						useSecureCookies: false,
						defaultCookieAttributes: {
							sameSite: "lax",
							secure: false,
							httpOnly: true,
							path: "/",
						},
					},
				}
			: {}),

		account: {
			accountLinking: {
				enabled: true,
				async trustedProviders() {
					const fromDb = await getTrustedProviders();
					return ["github", "google", ...fromDb];
				},
				allowDifferentEmails: true,
			},
		},
		appName: "Notploy",
		// Only register a social provider when its credentials are configured:
		// an entry with missing env vars makes better-auth warn on every boot
		// and offers a sign-in path that can never succeed.
		socialProviders: {
			...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
				? {
						github: {
							clientId: process.env.GITHUB_CLIENT_ID,
							clientSecret: process.env.GITHUB_CLIENT_SECRET,
						},
					}
				: {}),
			...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
				? {
						google: {
							clientId: process.env.GOOGLE_CLIENT_ID,
							clientSecret: process.env.GOOGLE_CLIENT_SECRET,
						},
					}
				: {}),
		},
		logger: {
			disabled: process.env.NODE_ENV === "production",
		},
		trustedOrigins: resolveTrustedOrigins,
		hooks: {
			before: createAuthMiddleware(async (ctx) => {
				ctx.context.trustedOrigins = [
					...(ctx.context.baseURL ? [new URL(ctx.context.baseURL).origin] : []),
					...(await resolveTrustedOrigins()),
				].filter(Boolean);

				const isBlockedAuthPath =
					ctx.path.startsWith("/sign-in/email") ||
					ctx.path.startsWith("/sign-in/social") ||
					ctx.path.startsWith("/sign-in/passkey") ||
					ctx.path.startsWith("/sign-up/email") ||
					ctx.path.startsWith("/passkey/verify-authentication") ||
					ctx.path.startsWith("/passkey/generate-authenticate-options");

				if (!IS_CLOUD && isBlockedAuthPath) {
					const settings = await getWebServerSettings();
					if (settings?.enforceSSO) {
						throw new APIError("FORBIDDEN", {
							message:
								"SSO is enforced. Direct password, social, and passkey sign-in are disabled.",
						});
					}
				}
			}),
		},
		emailVerification: {
			sendOnSignUp: true,
			autoSignInAfterVerification: true,
			sendOnSignIn: true,
			sendVerificationEmail: async ({ user, url }) => {
				if (IS_CLOUD) {
					await sendVerificationEmail({
						userName: user.name || "User",
						email: user.email,
						verificationUrl: url,
					});
				}
			},
		},
		emailAndPassword: {
			enabled: true,
			autoSignIn: !IS_CLOUD,
			requireEmailVerification:
				IS_CLOUD && process.env.NODE_ENV === "production",
			password: {
				async hash(password) {
					return bcrypt.hashSync(password, 10);
				},
				async verify({ hash, password }) {
					return bcrypt.compareSync(password, hash);
				},
			},
			sendResetPassword: async ({ user, url }) => {
				await sendEmail({
					email: user.email,
					subject: "Reset your password",
					text: `
				<p>Click the link to reset your password: <a href="${url}">Reset Password</a></p>
				`,
				});
			},
		},
		databaseHooks: {
			user: {
				create: {
					before: async (_user, context) => {
						if (context?.path.includes("/scim")) {
							return { data: { emailVerified: true } };
						}
						if (!IS_CLOUD) {
							const xNotployToken =
								context?.request?.headers?.get("x-notploy-token");
							if (xNotployToken) {
								let invitation: Awaited<ReturnType<typeof getUserByToken>>;
								try {
									invitation = await getUserByToken(xNotployToken);
								} catch {
									throw new APIError("BAD_REQUEST", {
										message: "Invalid invitation token",
									});
								}
								if (invitation.isExpired) {
									throw new APIError("BAD_REQUEST", {
										message: "Invitation has expired",
									});
								}
								if (invitation.status !== "pending") {
									throw new APIError("BAD_REQUEST", {
										message: "Invitation has already been used",
									});
								}
								if (
									_user.email.toLowerCase().trim() !==
									invitation.email.toLowerCase().trim()
								) {
									throw new APIError("BAD_REQUEST", {
										message: "Email does not match invitation",
									});
								}
							} else {
								const isSSORequest = context?.path.includes("/sso");
								const isLdapRequest = context?.path.includes("/ldap");
								if (isSSORequest || isLdapRequest) {
									return;
								}
								const isAdminPresent = await db.query.member.findFirst({
									where: eq(schema.member.role, "owner"),
								});
								if (isAdminPresent) {
									throw new APIError("BAD_REQUEST", {
										message: "Admin is already created",
									});
								}
							}
						}
					},
					after: async (user, context) => {
						const isSSORequest = context?.path.includes("/sso");
						const isSCIMRequest = context?.path.includes("/scim");
						const isLdapRequest = context?.path.includes("/ldap");
						const isAdminPresent = await db.query.member.findFirst({
							where: eq(schema.member.role, "owner"),
						});

						if (!IS_CLOUD && !isAdminPresent) {
							await updateWebServerSettings({
								serverIp: await getPublicIpWithFallback(),
							});
						}

						if (IS_CLOUD) {
							try {
								const hutk = getHubSpotUTK(
									context?.request?.headers?.get("cookie") || undefined,
								);
								// Cast to include additional fields
								const userWithFields = user as typeof user & {
									lastName?: string;
								};
								const hubspotSuccess = await submitToHubSpot(
									{
										email: user.email,
										firstName: user.name || "", // name is mapped to firstName column
										lastName: userWithFields.lastName || "",
									},
									hutk,
								);
								if (!hubspotSuccess) {
									console.error("Failed to submit to HubSpot");
								}
							} catch (error) {
								console.error("Error submitting to HubSpot", error);
							}
						}

						// Directory sign-in provisions its own org membership in the
						// `/sign-in/ldap` endpoint, so skip the SSO org bootstrap here.
						if (isLdapRequest) {
							return;
						}

						if (isSCIMRequest) {
							const membership = await db.query.member.findFirst({
								where: eq(schema.member.userId, user.id),
							});
							if (membership) {
								const defaultRole = await resolveOrganizationDefaultRole(
									membership.organizationId,
								);
								if (defaultRole !== membership.role) {
									await db
										.update(schema.member)
										.set({ role: defaultRole })
										.where(eq(schema.member.id, membership.id));
								}
							}
							return;
						}

						if (IS_CLOUD || !isAdminPresent) {
							await db.transaction(async (tx) => {
								const organization = await tx
									.insert(schema.organization)
									.values({
										name: "My Organization",
										ownerId: user.id,
										createdAt: new Date(),
									})
									.returning()
									.then((res) => res[0]);

								await tx.insert(schema.member).values({
									userId: user.id,
									organizationId: organization?.id || "",
									role: "owner",
									createdAt: new Date(),
									isDefault: true, // Mark first organization as default
								});
							});
						} else if (isSSORequest) {
							const providerId = context?.params?.providerId;
							if (!providerId) {
								throw new APIError("BAD_REQUEST", {
									message: "Provider ID is required",
								});
							}
							const provider = await db.query.ssoProvider.findFirst({
								where: eq(schema.ssoProvider.providerId, providerId),
							});

							if (!provider) {
								throw new APIError("BAD_REQUEST", {
									message: "Provider not found",
								});
							}
							const defaultRole = provider.organizationId
								? await resolveOrganizationDefaultRole(provider.organizationId)
								: "member";
							await db.insert(schema.member).values({
								userId: user.id,
								organizationId: provider?.organizationId || "",
								role: defaultRole,
								createdAt: new Date(),
								isDefault: true,
							});
						}
					},
				},
			},
			session: {
				create: {
					before: async (session) => {
						// Find the default organization for this user
						// Priority: 1) isDefault=true, 2) most recently created
						const member = await db.query.member.findFirst({
							where: eq(schema.member.userId, session.userId),
							orderBy: [
								desc(schema.member.isDefault),
								desc(schema.member.createdAt),
							],
							with: {
								organization: true,
							},
						});

						return {
							data: {
								...session,
								activeOrganizationId: member?.organization.id,
							},
						};
					},
					after: async (session) => {
						const orgId = (
							session as typeof session & { activeOrganizationId?: string }
						).activeOrganizationId;
						if (!orgId) return;
						const memberRecord = await db.query.member.findFirst({
							where: and(
								eq(schema.member.userId, session.userId),
								eq(schema.member.organizationId, orgId),
							),
							with: { user: true },
						});
						if (!memberRecord) return;
						await createAuditLog({
							organizationId: orgId,
							userId: session.userId,
							userEmail: memberRecord.user.email,
							userRole: memberRecord.role,
							action: "login",
							resourceType: "session",
						});
					},
				},
				delete: {
					after: async (session) => {
						const orgId = (
							session as typeof session & { activeOrganizationId?: string }
						).activeOrganizationId;
						if (!orgId) return;
						const memberRecord = await db.query.member.findFirst({
							where: and(
								eq(schema.member.userId, session.userId),
								eq(schema.member.organizationId, orgId),
							),
							with: { user: true },
						});
						if (!memberRecord) return;
						await createAuditLog({
							organizationId: orgId,
							userId: session.userId,
							userEmail: memberRecord.user.email,
							userRole: memberRecord.role,
							action: "logout",
							resourceType: "session",
						});
					},
				},
			},
		},
		session: {
			expiresIn: 60 * 60 * 24 * 3,
			updateAge: 60 * 60 * 24,
		},
		user: {
			modelName: "user",
			fields: {
				name: "firstName", // Map better-auth's default 'name' field to 'firstName' column
			},
			additionalFields: {
				role: {
					type: "string",
					// required: true,
					input: false,
				},
				ownerId: {
					type: "string",
					// required: true,
					input: false,
				},
				allowImpersonation: {
					fieldName: "allowImpersonation",
					type: "boolean",
					defaultValue: false,
				},
				lastName: {
					type: "string",
					required: false,
					input: true,
					defaultValue: "",
				},
			},
		},
		plugins: [
			apiKey({
				enableMetadata: true,
				references: "user",
			}),
			sso({ trustEmailVerified: true }),
			ldapSso(),
			socialSso(),
			scim(),
			twoFactor(),
			passkey(),
			organization({
				ac,
				roles: {
					owner: ownerRole,
					admin: adminRole,
					member: memberRole,
				},
				dynamicAccessControl: {
					enabled: true,
					maximumRolesPerOrganization: 10,
				},
			}),
			// Self-hosted needs the admin plugin too: SCIM deactivation (active: false)
			// maps to the admin plugin's `banned` field and is rejected without it.
			// adminRoles: [] keeps every /admin/* endpoint locked on self-hosted.
			admin(
				IS_CLOUD
					? { adminUserIds: [process.env.USER_ADMIN_ID as string] }
					: { adminRoles: [] },
			),
		],
	});

// Una sola instancia de better-auth por proceso aunque el módulo esté
// duplicado en varios bundles.
const globalForAuth = globalThis as unknown as {
	betterAuthInstance?: ReturnType<typeof createBetterAuth>;
};

if (!globalForAuth.betterAuthInstance) {
	globalForAuth.betterAuthInstance = createBetterAuth();
}

const { handler, api } = globalForAuth.betterAuthInstance;

const _auth = {
	handler,
	createApiKey: api.createApiKey,
	registerSSOProvider: api.registerSSOProvider,
	updateSSOProvider: api.updateSSOProvider,
	generateSCIMToken: api.generateSCIMToken,
	listSCIMProviderConnections: api.listSCIMProviderConnections,
	deleteSCIMProviderConnection: api.deleteSCIMProviderConnection,
};

export type AuthType = typeof _auth;
export const auth: AuthType = _auth;

/**
 * The API key a request authenticated with, when it authenticated with one.
 *
 * Only metadata is exposed (never `key`), and only because procedures such as
 * the CI/CD API need to know *which* credential was used and what it is scoped
 * to. A request authenticated with a session cookie has no `apiKey`.
 */
export interface RequestApiKey {
	id: string;
	name: string | null;
	prefix: string | null;
	metadata: string | null;
}

/**
 * Reads the API key from a request.
 *
 * `x-api-key` is Notploy's own header and stays the documented one, but CI
 * clients (GitHub Actions included) speak `Authorization: Bearer <token>`, so
 * both are accepted rather than forcing every action to build a custom header.
 */
const extractApiKeyHeader = (request: IncomingMessage): string | undefined => {
	const apiKeyHeader = request.headers["x-api-key"];
	if (typeof apiKeyHeader === "string" && apiKeyHeader.trim()) {
		return apiKeyHeader.trim();
	}

	const authorization = request.headers.authorization;
	if (typeof authorization === "string") {
		const bearer = authorization.match(/^Bearer\s+(\S+)$/i);
		if (bearer?.[1]) {
			return bearer[1];
		}
	}

	return undefined;
};

export const validateRequest = async (request: IncomingMessage) => {
	const apiKey = extractApiKeyHeader(request);
	if (apiKey) {
		try {
			const { valid, key, error } = await api.verifyApiKey({
				body: {
					key: apiKey,
				},
			});

			if (error) {
				throw new Error(error.message?.toString() || "Error verifying API key");
			}
			if (!valid || !key) {
				return {
					session: null,
					user: null,
					apiKey: undefined as RequestApiKey | undefined,
				};
			}

			const apiKeyRecord = await db.query.apikey.findFirst({
				where: eq(schema.apikey.id, key.id),
				with: {
					user: true,
				},
			});

			if (!apiKeyRecord) {
				return {
					session: null,
					user: null,
					apiKey: undefined as RequestApiKey | undefined,
				};
			}

			const organizationId = (
				JSON.parse(apiKeyRecord.metadata || "{}") as {
					organizationId?: string;
				}
			).organizationId;

			if (!organizationId) {
				return {
					session: null,
					user: null,
					apiKey: undefined as RequestApiKey | undefined,
				};
			}

			const member = await db.query.member.findFirst({
				where: and(
					eq(schema.member.userId, apiKeyRecord.user.id),
					eq(schema.member.organizationId, organizationId),
				),
				with: {
					organization: true,
				},
			});

			// When accessing from DB, use actual column names
			const userFromDb = apiKeyRecord.user as typeof apiKeyRecord.user & {
				firstName: string;
				lastName: string;
			};

			const mockSession = {
				session: {
					userId: apiKeyRecord.user.id,
					activeOrganizationId: organizationId || "",
				},
				user: {
					id: userFromDb.id,
					name: userFromDb.firstName, // Map firstName back to name for better-auth
					email: userFromDb.email,
					emailVerified: userFromDb.emailVerified,
					image: userFromDb.image,
					createdAt: userFromDb.createdAt,
					updatedAt: userFromDb.updatedAt,
					twoFactorEnabled: userFromDb.twoFactorEnabled,
					role: member?.role || "member",
					ownerId: member?.organization.ownerId || apiKeyRecord.user.id,
				},
			};

			return {
				...mockSession,
				apiKey: {
					id: apiKeyRecord.id,
					name: apiKeyRecord.name,
					prefix: apiKeyRecord.prefix,
					metadata: apiKeyRecord.metadata,
				} satisfies RequestApiKey,
			};
		} catch (error) {
			console.error("Error verifying API key", error);
			return {
				session: null,
				user: null,
				apiKey: undefined as RequestApiKey | undefined,
			};
		}
	}

	// If no API key, proceed with normal session validation
	const session = await api.getSession({
		headers: new Headers({
			cookie: request.headers.cookie || "",
		}),
	});

	if (!session?.session || !session.user) {
		return {
			session: null,
			user: null,
			apiKey: undefined as RequestApiKey | undefined,
		};
	}

	if (session?.user) {
		const member = await db.query.member.findFirst({
			where: and(
				eq(schema.member.userId, session.user.id),
				...(session.session.activeOrganizationId
					? [
							eq(
								schema.member.organizationId,
								session.session.activeOrganizationId || "",
							),
						]
					: []),
			),
			orderBy: [desc(schema.member.isDefault), desc(schema.member.createdAt)],
			with: {
				organization: true,
				user: true,
			},
		});

		session.user.role = member?.role || "member";
		session.session.activeOrganizationId = member?.organization.id || "";
		if (member) {
			session.user.ownerId = member.organization.ownerId;
		} else {
			session.user.ownerId = session.user.id;
		}
	}

	return { ...session, apiKey: undefined as RequestApiKey | undefined };
};
