import { db } from "@notploy/server/db";
import { type apiCreateRegistry, registry } from "@notploy/server/db/schema";
import { execAsync } from "@notploy/server/utils/process/execAsync";
import {
	createOciRegistryAdapter,
	normalizeRegistryEndpoint,
	type RegistryCredentials,
} from "@notploy/server/utils/registry";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import type { z } from "zod";
import { IS_CLOUD } from "../constants";
import { findVaultSecretById } from "./vault-provider";

export type Registry = typeof registry.$inferSelect;

function shEscape(s: string | null | undefined): string {
	if (!s) return "''";
	return `'${s.replace(/'/g, `'\\''`)}'`;
}

export function safeDockerLoginCommand(
	registry: string | null | undefined,
	user: string | null | undefined,
	pass: string | null | undefined,
) {
	const escapedRegistry = shEscape(registry);
	const escapedUser = shEscape(user);
	const escapedPassword = shEscape(pass);
	return `printf %s ${escapedPassword} | docker login ${escapedRegistry} -u ${escapedUser} --password-stdin`;
}

/**
 * Creates a registry record.
 *
 * Nothing is executed against the endpoint here: a connection is verified with
 * `testConnection` through the OCI adapter, and credentials are resolved when a
 * deployment actually pulls or pushes. Saving a registry therefore never
 * depends on a host being reachable, or on credentials being copied onto one.
 */
export const createRegistry = async (
	input: z.infer<typeof apiCreateRegistry>,
	organizationId: string,
) => {
	const { serverId: _serverId, ...values } = input;
	return await db.transaction(async (tx) => {
		const newRegistry = await tx
			.insert(registry)
			.values({
				...values,
				organizationId: organizationId,
			})
			.returning()
			.then((value) => value[0]);

		if (!newRegistry) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Error input:  Inserting registry",
			});
		}

		return newRegistry;
	});
};

export const removeRegistry = async (registryId: string) => {
	try {
		const response = await db
			.delete(registry)
			.where(eq(registry.registryId, registryId))
			.returning()
			.then((res) => res[0]);

		if (!response) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Registry not found",
			});
		}

		// Only the local host keeps a `docker login` session from an earlier
		// deployment; the record itself holds no credential to clean up.
		if (!IS_CLOUD) {
			await execAsync(`docker logout ${shEscape(response.registryUrl)}`).catch(
				() => {
					// A registry that was never logged in has nothing to revoke.
				},
			);
		}

		return response;
	} catch (error) {
		if (error instanceof TRPCError) throw error;
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Error removing this registry",
			cause: error,
		});
	}
};

/**
 * Updates a registry record.
 *
 * An empty password keeps the stored one, so a form that never received the
 * secret can still submit. Moving to a secret reference drops the inline
 * fallback; moving back to inline drops the reference, so a record never keeps
 * two sources of truth.
 */
export const updateRegistry = async (
	registryId: string,
	registryData: Partial<Registry> & { serverId?: string | null },
) => {
	const { serverId: _serverId, password, ...rest } = registryData;
	const values: Partial<Registry> = {
		...rest,
		...(password ? { password } : {}),
	};
	if (rest.credentialSource === "secret") {
		values.password = null;
	}
	if (rest.credentialSource === "inline") {
		values.vaultSecretId = null;
	}

	try {
		const response = await db
			.update(registry)
			.set(values)
			.where(eq(registry.registryId, registryId))
			.returning()
			.then((res) => res[0]);

		if (!response) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Registry not found",
			});
		}

		return response;
	} catch (error) {
		if (error instanceof TRPCError) throw error;
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				error instanceof Error ? error.message : "Error updating this registry",
		});
	}
};

export const findRegistryById = async (registryId: string) => {
	const registryResponse = await db.query.registry.findFirst({
		where: eq(registry.registryId, registryId),
		columns: {
			password: false,
		},
	});
	if (!registryResponse) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Registry not found",
		});
	}
	return registryResponse;
};

export const findRegistryByIdWithCredentials = async (registryId: string) => {
	const registryResponse = await db.query.registry.findFirst({
		where: eq(registry.registryId, registryId),
	});
	if (!registryResponse) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Registry not found",
		});
	}
	return registryResponse;
};

export const findAllRegistryByOrganizationId = async (
	organizationId: string,
) => {
	const registryResponse = await db.query.registry.findMany({
		where: eq(registry.organizationId, organizationId),
	});
	return registryResponse;
};

/**
 * Reads the credentials a registry authenticates with.
 *
 * With `credentialSource = "secret"` the value comes from the Secrets Manager
 * through `vaultSecretId`; otherwise the inline columns are used. Credentials
 * are returned to the caller only — never persisted, echoed or logged.
 */
export const resolveRegistryCredentials = async (
	registry: Pick<
		Registry,
		| "authMethod"
		| "allowAnonymous"
		| "credentialSource"
		| "vaultSecretId"
		| "username"
		| "password"
	>,
): Promise<RegistryCredentials | null> => {
	// `authMethod: "none"` is an explicit anonymous registry; `allowAnonymous`
	// only permits unauthenticated pulls, so configured credentials still win.
	if (registry.authMethod === "none") return null;

	if (registry.credentialSource === "secret" && registry.vaultSecretId) {
		const secret = await findVaultSecretById(registry.vaultSecretId);
		return parseRegistrySecretValue(secret.value, registry.username);
	}

	if (!registry.username && !registry.password) return null;
	return { username: registry.username, password: registry.password };
};

/**
 * A referenced secret either carries both fields as JSON (`{"username":…,
 * "password":…}`, or `token`) or holds the password alone — in which case the
 * username comes from the registry record, or from the provider when it is
 * fixed (e.g. `AWS` for ECR).
 */
export const parseRegistrySecretValue = (
	value: string | null | undefined,
	fallbackUsername?: string | null,
): RegistryCredentials => {
	const trimmed = value?.trim() ?? "";
	if (trimmed.startsWith("{")) {
		try {
			const parsed = JSON.parse(trimmed) as {
				username?: unknown;
				password?: unknown;
				token?: unknown;
			};
			const username =
				typeof parsed.username === "string" && parsed.username
					? parsed.username
					: (fallbackUsername ?? null);
			const password =
				typeof parsed.password === "string"
					? parsed.password
					: typeof parsed.token === "string"
						? parsed.token
						: null;
			return { username, password };
		} catch {
			// Not JSON after all: fall through and treat it as the password.
		}
	}

	return { username: fallbackUsername ?? null, password: trimmed || null };
};

/**
 * Builds the adapter for a stored registry, resolving its credentials so the
 * caller never handles them. Provider-specific details stay in the descriptor.
 */
export const createAdapterForRegistry = async (
	registry: Registry,
): Promise<ReturnType<typeof createOciRegistryAdapter>> =>
	createOciRegistryAdapter({
		providerType: registry.providerType,
		endpoint: normalizeRegistryEndpoint(registry.registryUrl),
		credentials: await resolveRegistryCredentials(registry),
	});

/**
 * Loads a registry and enforces that it belongs to the organization asking for
 * it, so every operation is scoped the same way.
 */
export const findRegistryInOrganization = async (
	registryId: string,
	organizationId: string,
): Promise<Registry> => {
	const found = await db.query.registry.findFirst({
		where: eq(registry.registryId, registryId),
	});
	if (!found) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Registry not found",
		});
	}
	if (found.organizationId !== organizationId) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "You are not allowed to access this registry",
		});
	}
	return found;
};

/**
 * Merges the connection fields a form is holding with the stored record, so an
 * edit can be tested without re-typing credentials the Console never received.
 */
export const mergeRegistryConnection = async (
	stored: Registry,
	override: Partial<
		Pick<
			Registry,
			| "providerType"
			| "registryUrl"
			| "authMethod"
			| "credentialSource"
			| "allowAnonymous"
			| "username"
			| "password"
			| "vaultSecretId"
		>
	>,
) => {
	const merged = {
		providerType: override.providerType ?? stored.providerType,
		registryUrl: override.registryUrl ?? stored.registryUrl,
		authMethod: override.authMethod ?? stored.authMethod,
		credentialSource: override.credentialSource ?? stored.credentialSource,
		allowAnonymous: override.allowAnonymous ?? stored.allowAnonymous,
		username: override.username ?? stored.username,
		// An empty password means "unchanged", so the stored one is used.
		password: override.password || stored.password,
		vaultSecretId: override.vaultSecretId ?? stored.vaultSecretId,
	};

	return createOciRegistryAdapter({
		providerType: merged.providerType,
		endpoint: normalizeRegistryEndpoint(merged.registryUrl),
		credentials: await resolveRegistryCredentials(merged),
	});
};

/**
 * Adapter for a connection that has not been saved yet, used when the Console
 * tests a registry before creating it.
 */
export const createAdapterForConnection = async (input: {
	providerType: Registry["providerType"];
	registryUrl: string;
	authMethod?: Registry["authMethod"] | null;
	credentialSource?: Registry["credentialSource"] | null;
	allowAnonymous?: boolean | null;
	username?: string | null;
	password?: string | null;
	vaultSecretId?: string | null;
}): Promise<ReturnType<typeof createOciRegistryAdapter>> =>
	createOciRegistryAdapter({
		providerType: input.providerType,
		endpoint: normalizeRegistryEndpoint(input.registryUrl),
		credentials: await resolveRegistryCredentials({
			authMethod: input.authMethod ?? "basic",
			allowAnonymous: input.allowAnonymous ?? false,
			credentialSource: input.credentialSource ?? "inline",
			vaultSecretId: input.vaultSecretId ?? null,
			username: input.username ?? null,
			password: input.password ?? null,
		}),
	});
