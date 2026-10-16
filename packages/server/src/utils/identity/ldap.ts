/**
 * Directory (LDAP / Active Directory) adapter.
 *
 * Talks to the directory with `ldapts`. Two operations are exposed:
 * - `testLdapConnection` binds with the configured service account and reads a
 *   single entry, used by the Console's "Test connection" action and by the
 *   health probe.
 * - `authenticateLdapUser` locates a user entry with the configured search
 *   filter and verifies the submitted password by re-binding as that DN.
 *
 * The bind password is never logged or returned.
 */
import {
	type IdentityLdapConfig,
	identityLdapConfigSchema,
} from "@notploy/server/db/schema/sso";
import { Client } from "ldapts";

const LDAP_CONNECT_TIMEOUT_MS = 10_000;
const LDAP_OPERATION_TIMEOUT_MS = 10_000;

export type { IdentityLdapConfig };

/**
 * Reads a stored LDAP configuration. Tolerates the `default()`s in the schema
 * so a partially stored config still parses.
 */
export const parseLdapConfig = (
	config: string | null,
): IdentityLdapConfig | null => {
	if (!config) return null;
	try {
		const parsed = identityLdapConfigSchema.safeParse(JSON.parse(config));
		return parsed.success ? parsed.data : null;
	} catch {
		return null;
	}
};

const createClient = (config: IdentityLdapConfig) =>
	new Client({
		url: config.url,
		timeout: LDAP_OPERATION_TIMEOUT_MS,
		connectTimeout: LDAP_CONNECT_TIMEOUT_MS,
		tlsOptions: { rejectUnauthorized: !config.tlsSkipVerify },
	});

const withClient = async <T>(
	config: IdentityLdapConfig,
	handler: (client: Client) => Promise<T>,
): Promise<T> => {
	const client = createClient(config);
	try {
		if (config.startTls) {
			await client.startTLS({ rejectUnauthorized: !config.tlsSkipVerify });
		}
		return await handler(client);
	} finally {
		await client.unbind().catch(() => {});
	}
};

/**
 * Escapes the special characters of an LDAP filter value (RFC 4515) so a
 * submitted username cannot break out of the search filter.
 */
export const escapeLdapFilter = (value: string): string =>
	value
		.replace(/\\/g, "\\5c")
		.replace(/\*/g, "\\2a")
		.replace(/\(/g, "\\28")
		.replace(/\)/g, "\\29")
		.replace(/\0/g, "\\00");

const firstString = (value: unknown): string | null => {
	if (typeof value === "string" && value.trim()) return value.trim();
	if (Array.isArray(value)) {
		const found = value.find(
			(entry) => typeof entry === "string" && entry.trim(),
		);
		if (typeof found === "string") return found.trim();
	}
	return null;
};

interface LdapSearchEntry {
	dn: string;
	[key: string]: unknown;
}

const searchUserEntry = async (
	client: Client,
	config: IdentityLdapConfig,
	username: string,
): Promise<LdapSearchEntry | null> => {
	const filter = config.userSearchFilter.replace(
		/\{\{\s*username\s*\}\}/g,
		escapeLdapFilter(username),
	);
	const attributes = [
		config.emailAttribute,
		config.nameAttribute,
		config.idAttribute,
	].filter((value): value is string => !!value);
	const { searchEntries } = await client.search(config.baseDn, {
		scope: "sub",
		filter,
		attributes: Array.from(new Set(attributes)),
	});
	const entry = searchEntries[0] as LdapSearchEntry | undefined;
	return entry ?? null;
};

export interface LdapConnectionResult {
	connected: boolean;
	message: string;
	/** Number of user entries matched by the base search (best effort). */
	userCount: number | null;
}

/**
 * Binds with the configured service account (or anonymously) and reads the
 * base DN to prove the directory is reachable and the credentials are valid.
 */
export const testLdapConnection = async (
	config: IdentityLdapConfig,
): Promise<LdapConnectionResult> => {
	try {
		return await withClient(config, async (client) => {
			if (config.bindDn) {
				await client.bind(config.bindDn, config.bindPassword ?? "");
			} else {
				await client.bind("", "");
			}
			const { searchEntries } = await client.search(config.baseDn, {
				scope: "sub",
				filter: "(objectClass=*)",
				sizeLimit: 1,
				attributes: ["dn"],
			});
			return {
				connected: true,
				message: "Connected to the directory.",
				userCount: searchEntries.length,
			};
		});
	} catch (error) {
		return {
			connected: false,
			message:
				error instanceof Error
					? error.message
					: "Could not reach the directory.",
			userCount: null,
		};
	}
};

export interface LdapAuthenticatedUser {
	/** Distinguished name of the authenticated entry. */
	dn: string;
	/** Email resolved from the configured attribute. */
	email: string;
	/** Display name resolved from the configured attribute. */
	name: string;
	/** Stable identifier resolved from the configured attribute. */
	id: string;
}

/**
 * Verifies a username/password against the directory.
 *
 * Returns the resolved user on success, `null` when the credentials are
 * rejected (bad password, no matching entry, or filter problems that resolve to
 * a single ambiguous result).
 */
export const authenticateLdapUser = async (
	config: IdentityLdapConfig,
	credentials: { username: string; password: string },
): Promise<LdapAuthenticatedUser | null> => {
	const username = credentials.username.trim();
	if (!username || !credentials.password) return null;

	// Step 1: locate the user entry (service/anon bind).
	const entry = await withClient(config, async (client) => {
		if (config.bindDn) {
			await client.bind(config.bindDn, config.bindPassword ?? "");
		} else {
			await client.bind("", "");
		}
		return await searchUserEntry(client, config, username);
	});
	if (!entry) return null;

	const email =
		firstString(entry[config.emailAttribute]) ??
		(config.emailAttribute !== "mail" ? firstString(entry.mail) : null);
	if (!email) return null;
	const name = config.nameAttribute
		? (firstString(entry[config.nameAttribute]) ?? email)
		: email;
	const id = config.idAttribute
		? (firstString(entry[config.idAttribute]) ?? email)
		: email;

	// Step 2: verify the password by binding as the user DN. A fresh client is
	// used so a failed user bind cannot leave the shared connection in a
	// half-authenticated state.
	try {
		await withClient(config, async (client) => {
			await client.bind(entry.dn, credentials.password);
		});
	} catch {
		return null;
	}

	return { dn: entry.dn, email, name, id };
};
