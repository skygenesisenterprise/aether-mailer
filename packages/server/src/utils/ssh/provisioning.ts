import {
	type SshConnectOptions,
	type SshHostKeyOptions,
	type SshSession,
	type SshHostKeyFingerprint,
	withSshSession,
} from "./client";
import { SshError } from "./errors";

/** Comment appended to the generated key so it can be recognized later. */
export const MANAGED_KEY_COMMENT = "notploy";

export type SshPrivilegeMode = "root" | "sudo" | "none";

export interface SshPrivilege {
	mode: SshPrivilegeMode;
	/** Remote home directory of the authenticated account. */
	home: string;
}

export interface SshPasswordTarget {
	host: string;
	port?: number;
	username: string;
	password: string;
	connectTimeoutMs?: number;
	commandTimeoutMs?: number;
	hostKey?: SshHostKeyOptions;
}

const shellQuote = (value: string): string =>
	`'${value.replace(/'/g, `'\\''`)}'`;

const base64 = (value: string): string =>
	Buffer.from(value).toString("base64");

/**
 * Prints `<mode>:<home>` for the authenticated account. Uses `sudo -n true`
 * (non-interactive) so we never hang on a password prompt, and `getent` to
 * resolve the real home directory even when `sudo` rewrites `$HOME`.
 */
export const buildPrivilegeProbeCommand = (): string =>
	[
		"uid=$(id -u)",
		'home=$(getent passwd "$(id -un)" 2>/dev/null | cut -d: -f6)',
		'[ -z "$home" ] && home="$HOME"',
		'if [ "$uid" -eq 0 ]; then',
		"  printf 'root:%s\\n' \"$home\"",
		"elif sudo -n true >/dev/null 2>&1; then",
		"  printf 'sudo:%s\\n' \"$home\"",
		"else",
		"  printf 'none:%s\\n' \"$home\"",
		"fi",
	].join("\n");

/** Parses the output of {@link buildPrivilegeProbeCommand}. */
export const parsePrivilegeProbe = (output: string): SshPrivilege => {
	const lines = output
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);
	const line = lines.at(-1) ?? "";
	const separator = line.indexOf(":");
	const mode = (separator === -1 ? line : line.slice(0, separator)).trim();
	const home = separator === -1 ? "" : line.slice(separator + 1).trim();

	if (mode !== "root" && mode !== "sudo" && mode !== "none") {
		throw new SshError({
			category: "authorization",
			detail: "could not determine the SSH account privileges",
		});
	}

	return { mode, home };
};

/** Resolves how (and where) Notploy's key should be installed. */
export const detectSshPrivilege = async (
	session: SshSession,
): Promise<SshPrivilege> => {
	const { stdout } = await session.exec(buildPrivilegeProbeCommand(), {
		timeoutMs: 30_000,
	});
	return parsePrivilegeProbe(stdout);
};

const homeDir = (home: string): string => {
	const trimmed = home.trim();
	const normalized = trimmed.startsWith("/") ? trimmed : "~";
	return normalized.replace(/\/+$/, "");
};

/**
 * Builds an idempotent command that appends `publicKey` to the account's
 * `authorized_keys`, creating `~/.ssh` with the ownership/permissions OpenSSH
 * requires. Credentials never appear in the command; only the base64-encoded
 * public key does.
 */
export const buildInstallPublicKeyCommand = ({
	publicKey,
	home,
	sudo,
}: {
	publicKey: string;
	home: string;
	sudo: boolean;
}): string => {
	const sudoCmd = sudo ? "sudo " : "";
	const sshDir = `${homeDir(home)}/.ssh`;
	return [
		"set -eu",
		"umask 077",
		`SSH_DIR=${shellQuote(sshDir)}`,
		'AUTH_KEYS="$SSH_DIR/authorized_keys"',
		`${sudoCmd}mkdir -p "$SSH_DIR"`,
		`${sudoCmd}chmod 700 "$SSH_DIR"`,
		`${sudoCmd}touch "$AUTH_KEYS"`,
		`${sudoCmd}chmod 600 "$AUTH_KEYS"`,
		`key=$(printf '%s' '${base64(publicKey)}' | base64 -d)`,
		`if ! ${sudoCmd}grep -qxF "$key" "$AUTH_KEYS"; then`,
		`  printf '%s\\n' "$key" | ${sudoCmd}tee -a "$AUTH_KEYS" > /dev/null`,
		"fi",
		`${sudoCmd}chown "$(id -u):$(id -g)" "$SSH_DIR" "$AUTH_KEYS"`,
	].join("\n");
};

/**
 * Builds a command that removes `publicKey` from the account's
 * `authorized_keys`, leaving every other key untouched.
 */
export const buildRemovePublicKeyCommand = ({
	publicKey,
	home,
	sudo,
}: {
	publicKey: string;
	home: string;
	sudo: boolean;
}): string => {
	const sudoCmd = sudo ? "sudo " : "";
	const authKeys = `${homeDir(home)}/.ssh/authorized_keys`;
	return [
		"set -eu",
		`AUTH_KEYS=${shellQuote(authKeys)}`,
		`key=$(printf '%s' '${base64(publicKey)}' | base64 -d)`,
		'if [ -f "$AUTH_KEYS" ]; then',
		"  tmp=$(mktemp)",
		`  ${sudoCmd}grep -vxF "$key" "$AUTH_KEYS" > "$tmp" || true`,
		`  ${sudoCmd}tee "$AUTH_KEYS" < "$tmp" > /dev/null`,
		'  rm -f "$tmp"',
		`  ${sudoCmd}chmod 600 "$AUTH_KEYS"`,
		"fi",
	].join("\n");
};

const PERMISSION_DENIED_PATTERN =
	/permission denied|operation not permitted|access denied|must be owned/i;

const asAuthorizationError = (error: unknown): never => {
	const detail = error instanceof SshError ? error.detail : undefined;
	if (detail && PERMISSION_DENIED_PATTERN.test(detail)) {
		throw new SshError({
			category: "authorization",
			command: error instanceof SshError ? error.command : undefined,
			cause: error,
			detail: "the SSH account could not write to ~/.ssh/authorized_keys",
			message:
				"Notploy could not write its key to the server. Use root or a non-root account with passwordless sudo access.",
		});
	}
	throw error;
};

const assertManageablePrivilege = (privilege: SshPrivilege): void => {
	if (privilege.mode === "none") {
		throw new SshError({
			category: "authorization",
			detail: "account is neither root nor passwordless sudo",
			message:
				"This account is not root and has no passwordless sudo access. Use root or a non-root account with passwordless sudo configured.",
		});
	}
};

/**
 * Tests SSH connectivity with a password: reaches the host, authenticates,
 * and resolves the account privileges without modifying anything. The
 * negotiated host key fingerprint is returned for display/verification.
 */
export const testSshConnection = async (
	target: SshPasswordTarget,
): Promise<{ hostKey: SshHostKeyFingerprint | undefined; privilege: SshPrivilege }> =>
	withSshSession(
		{
			host: target.host,
			port: target.port,
			username: target.username,
			auth: { method: "password", password: target.password },
			connectTimeoutMs: target.connectTimeoutMs,
			commandTimeoutMs: target.commandTimeoutMs,
			hostKey: target.hostKey,
		},
		async (session) => detectSshPrivilege(session),
	).then(({ result, hostKey }) => ({ hostKey, privilege: result }));

/**
 * Connects with a password, validates the account can manage its own SSH
 * configuration (root or passwordless sudo), then installs `publicKey`
 * idempotently. Returns the host key fingerprint so the caller can persist or
 * display it.
 */
export const provisionSshKey = async (
	target: SshPasswordTarget & { publicKey: string },
): Promise<{ hostKey: SshHostKeyFingerprint | undefined; privilege: SshPrivilege }> =>
	withSshSession(
		{
			host: target.host,
			port: target.port,
			username: target.username,
			auth: { method: "password", password: target.password },
			connectTimeoutMs: target.connectTimeoutMs,
			commandTimeoutMs: target.commandTimeoutMs,
			hostKey: target.hostKey,
		},
		async (session) => {
			const privilege = await detectSshPrivilege(session);
			assertManageablePrivilege(privilege);
			try {
				await session.exec(
					buildInstallPublicKeyCommand({
						publicKey: target.publicKey,
						home: privilege.home,
						sudo: privilege.mode === "sudo",
					}),
					{ timeoutMs: target.commandTimeoutMs },
				);
			} catch (error) {
				asAuthorizationError(error);
			}
			return privilege;
		},
	).then(({ result, hostKey }) => ({ hostKey, privilege: result }));

/** Best-effort removal of a previously installed public key. */
export const removeSshKey = async (
	target: SshPasswordTarget & { publicKey: string },
): Promise<void> => {
	await withSshSession(
		{
			host: target.host,
			port: target.port,
			username: target.username,
			auth: { method: "password", password: target.password },
			connectTimeoutMs: target.connectTimeoutMs,
			commandTimeoutMs: target.commandTimeoutMs,
			hostKey: target.hostKey,
		},
		async (session) => {
			const privilege = await detectSshPrivilege(session);
			if (privilege.mode === "none") return;
			await session.exec(
				buildRemovePublicKeyCommand({
					publicKey: target.publicKey,
					home: privilege.home,
					sudo: privilege.mode === "sudo",
				}),
				{ timeoutMs: target.commandTimeoutMs },
			);
		},
	);
};

export interface SshKeyVerificationTarget {
	host: string;
	port?: number;
	username: string;
	privateKey: string;
	connectTimeoutMs?: number;
	hostKey?: SshHostKeyOptions;
	clientFactory?: SshConnectOptions["clientFactory"];
}

/**
 * Opens a *second* SSH connection using the generated private key and runs a
 * harmless command. Onboarding must only succeed after this resolves, proving
 * the installed key actually grants access.
 */
export const verifyKeyBasedConnection = async (
	target: SshKeyVerificationTarget,
): Promise<SshHostKeyFingerprint | undefined> => {
	const { hostKey } = await withSshSession(
		{
			host: target.host,
			port: target.port,
			username: target.username,
			auth: { method: "privateKey", privateKey: target.privateKey },
			connectTimeoutMs: target.connectTimeoutMs,
			commandTimeoutMs: target.connectTimeoutMs ?? 30_000,
			hostKey: target.hostKey,
			clientFactory: target.clientFactory,
		},
		async (session) => {
			const { stdout } = await session.exec("echo notploy-ssh-ok");
			if (!stdout.includes("notploy-ssh-ok")) {
				throw new SshError({
					category: "command",
					detail: "key-based verification did not return the expected marker",
				});
			}
		},
	);
	return hostKey;
};
