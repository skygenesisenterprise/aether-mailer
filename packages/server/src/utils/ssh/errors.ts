/**
 * Structured SSH failure categories.
 *
 * The SSH connection/provisioning layer never surfaces raw ssh2 errors (which
 * can contain host, credential or command output) to callers. Instead every
 * failure is wrapped in an {@link SshError} carrying one of these categories,
 * so the API/UI can present an actionable message and diagnostics without ever
 * leaking a password, private key or host detail.
 */
export type SshFailureCategory =
	| "configuration"
	| "network"
	| "timeout"
	| "authentication"
	| "host-key"
	| "authorization"
	| "command"
	| "unknown";

const CATEGORY_MESSAGES: Record<SshFailureCategory, string> = {
	configuration:
		"The SSH connection could not be started because its configuration is invalid. Check the host, port, and username.",
	network:
		"Could not reach the server over SSH. Check the host/IP address, the SSH port, and that a firewall or the provider is not blocking the connection.",
	timeout:
		"The SSH connection timed out. The server may be slow, offline, or unreachable from this instance. Try again or increase the timeout.",
	authentication:
		"SSH authentication failed. The username or password was rejected. Verify the credentials and that password authentication is enabled for this account.",
	"host-key":
		"The server presented a different SSH host key than the one previously trusted. Verify the server's identity before connecting again.",
	authorization:
		"The SSH account is not allowed to install Notploy's key. Use root or a non-root account with passwordless sudo access.",
	command:
		"The remote command failed on the server. See the server logs for more details.",
	unknown:
		"Could not complete the SSH operation because of an unexpected error. Try again or check the server logs.",
};

/** Human readable, safe-to-display message for a failure category. */
export const getSshFailureMessage = (category: SshFailureCategory): string =>
	CATEGORY_MESSAGES[category];

/** Maps an ssh2 error `level` to one of our failure categories. */
export const categorizeSshErrorLevel = (
	level: string | undefined,
): SshFailureCategory => {
	switch (level) {
		case "client-dns":
		case "client-socket":
		case "client-connect":
			return "network";
		case "client-timeout":
			return "timeout";
		case "client-authentication":
		case "client-keyboard-interactive":
			return "authentication";
		default:
			return "unknown";
	}
};

export interface SshErrorDetails {
	category: SshFailureCategory;
	/** Stable machine readable code, e.g. "ETIMEDOUT". Never contains secrets. */
	code?: string;
	host?: string;
	port?: number;
	username?: string;
	/** The remote command that failed, when the failure happened during exec. */
	command?: string;
	/** Extra, already-sanitized detail. Never pass credentials or key material. */
	detail?: string;
	/** Overrides the default category message. Must not contain secrets. */
	message?: string;
	/** The underlying error/cause. Never serialized by {@link SshError.toSafeJSON}. */
	cause?: unknown;
}

/**
 * Error thrown by the SSH layer. Extends `Error` so it can bubble through tRPC,
 * but exposes a category plus a secrets-free serialization for diagnostics.
 */
export class SshError extends Error {
	readonly category: SshFailureCategory;
	readonly code?: string;
	readonly host?: string;
	readonly port?: number;
	readonly username?: string;
	readonly command?: string;
	readonly detail?: string;

	constructor(details: SshErrorDetails) {
		super(details.message ?? getSshFailureMessage(details.category));
		this.name = "SshError";
		this.category = details.category;
		this.code = details.code;
		this.host = details.host;
		this.port = details.port;
		this.username = details.username;
		this.command = details.command;
		this.detail = details.detail;
		if (details.cause !== undefined) {
			this.cause = details.cause;
		}
	}

	/** Diagnostics payload that is guaranteed not to leak credentials/keys. */
	toSafeJSON(): {
		name: string;
		category: SshFailureCategory;
		message: string;
		code?: string;
		host?: string;
		port?: number;
		username?: string;
		command?: string;
		detail?: string;
	} {
		return {
			name: this.name,
			category: this.category,
			message: this.message,
			code: this.code,
			host: this.host,
			port: this.port,
			username: this.username,
			command: this.command,
			detail: this.detail,
		};
	}
}

/** Wraps any thrown value into an {@link SshError} without losing its category. */
export const toSshError = (
	error: unknown,
	fallback: Omit<SshErrorDetails, "category"> & {
		category?: SshFailureCategory;
	} = {},
): SshError => {
	if (error instanceof SshError) return error;
	const level =
		typeof error === "object" && error !== null && "level" in error
			? String((error as { level?: unknown }).level)
			: undefined;
	const code =
		typeof error === "object" && error !== null && "code" in error
			? String((error as { code?: unknown }).code)
			: undefined;
	return new SshError({
		host: fallback.host,
		port: fallback.port,
		username: fallback.username,
		command: fallback.command,
		code: code ?? level,
		category:
			fallback.category ?? categorizeSshErrorLevel(level ?? undefined),
		cause: error,
	});
};

/** True when the thrown value is an SSH layer error (any category). */
export const isSshError = (error: unknown): error is SshError =>
	error instanceof SshError;
