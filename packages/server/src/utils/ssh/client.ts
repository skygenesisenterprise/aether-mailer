import { createHash } from "node:crypto";
import { Client } from "ssh2";
import type { ClientChannel, ClientErrorExtensions } from "ssh2";
import { SshError, categorizeSshErrorLevel } from "./errors";

/** Default connection (TCP + handshake) timeout, in milliseconds. */
export const DEFAULT_CONNECT_TIMEOUT_MS = 30_000;
/** Default remote command timeout, in milliseconds. */
export const DEFAULT_COMMAND_TIMEOUT_MS = 120_000;

export interface SshPasswordAuth {
	method: "password";
	/**
	 * The password is also used to answer keyboard-interactive/PAM prompts, so
	 * servers that disable `PasswordAuthentication` in favour of
	 * `KbdInteractiveAuthentication` keep working.
	 */
	password: string;
}

export interface SshPrivateKeyAuth {
	method: "privateKey";
	privateKey: string;
	passphrase?: string;
}

export type SshAuth = SshPasswordAuth | SshPrivateKeyAuth;

export interface SshHostKeyFingerprint {
	/** OpenSSH-style SHA256 fingerprint, e.g. `SHA256:abc...`. */
	sha256: string;
	/** Legacy MD5 fingerprint, e.g. `MD5:aa:bb:...`. */
	md5: string;
}

export type SshHostKeyPolicy = "trust-on-first-use" | "strict";

export interface SshHostKeyOptions {
	/**
	 * `trust-on-first-use` accepts an unknown host key and reports its
	 * fingerprint (default). `strict` rejects any key that does not match
	 * `knownFingerprintSha256`, and also rejects when the latter is missing.
	 */
	policy?: SshHostKeyPolicy;
	/** Previously trusted `SHA256:...` fingerprint, required for `strict`. */
	knownFingerprintSha256?: string;
}

export interface SshConnectOptions {
	host: string;
	port?: number;
	username: string;
	auth: SshAuth;
	connectTimeoutMs?: number;
	commandTimeoutMs?: number;
	hostKey?: SshHostKeyOptions;
	/** Called once the negotiated host key fingerprint is known. */
	onHostKey?: (fingerprint: SshHostKeyFingerprint) => void;
	/** Test seam: overrides the ssh2 client factory. */
	clientFactory?: () => Client;
}

export interface SshCommandOptions {
	timeoutMs?: number;
	onData?: (chunk: string) => void;
}

export interface SshCommandResult {
	stdout: string;
	stderr: string;
	code: number | null;
}

export interface SshSession {
	/** Negotiated host key fingerprint, if the handshake reached that point. */
	readonly hostKey: SshHostKeyFingerprint | undefined;
	exec(command: string, options?: SshCommandOptions): Promise<SshCommandResult>;
	end(): void;
}

/** Computes the SSH host key fingerprints from the raw public key blob. */
export const computeHostKeyFingerprint = (
	key: Buffer,
): SshHostKeyFingerprint => {
	const sha256 = createHash("sha256")
		.update(key)
		.digest("base64")
		.replace(/=+$/, "");
	const md5 = createHash("md5")
		.update(key)
		.digest("hex")
		.replace(/(..)(?=.)/g, "$1:");
	return { sha256: `SHA256:${sha256}`, md5: `MD5:${md5}` };
};

const rawErrorMessage = (error: unknown): string | undefined =>
	error instanceof Error ? error.message : undefined;

/**
 * Opens an SSH connection. Resolves with a session once authentication
 * succeeds; every failure (network, timeout, authentication, host key) is
 * rejected as a categorized {@link SshError} and leaves no dangling socket or
 * timer behind.
 */
export const connectSsh = (options: SshConnectOptions): Promise<SshSession> => {
	const connectTimeoutMs =
		options.connectTimeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS;
	const commandTimeoutMs =
		options.commandTimeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS;
	const policy = options.hostKey?.policy ?? "trust-on-first-use";
	const interactivePassword =
		options.auth.method === "password" ? options.auth.password : undefined;
	const baseDetails = {
		host: options.host,
		port: options.port ?? 22,
		username: options.username,
	};

	const client = (options.clientFactory ?? (() => new Client()))();
	let hostKey: SshHostKeyFingerprint | undefined;
	let hostKeyRejected = false;
	let settled = false;
	let sessionEnded = false;
	const commandTimers = new Set<NodeJS.Timeout>();

	const clearCommandTimers = () => {
		for (const timer of commandTimers) clearTimeout(timer);
		commandTimers.clear();
	};

	const endSession = () => {
		if (sessionEnded) return;
		sessionEnded = true;
		clearCommandTimers();
		try {
			client.end();
		} catch {
			// Never let a cleanup failure mask the original result.
		}
	};

	const classifyError = (error: unknown): SshError => {
		if (hostKeyRejected) {
			return new SshError({
				...baseDetails,
				category: "host-key",
				cause: error,
				detail: hostKey
					? `received ${hostKey.sha256}`
					: "host key did not match the trusted fingerprint",
			});
		}
		const level =
			typeof error === "object" && error !== null && "level" in error
				? String((error as { level?: unknown }).level)
				: undefined;
		const code =
			typeof error === "object" && error !== null && "code" in error
				? String((error as { code?: unknown }).code)
				: level;
		return new SshError({
			...baseDetails,
			category: categorizeSshErrorLevel(level),
			code,
			cause: error,
			// Deliberately do not include the raw message: some ssh2 messages
			// embed the host or the attempted authentication method.
			detail: level ? `ssh2 level: ${level}` : undefined,
		});
	};

	return new Promise<SshSession>((resolve, reject) => {
		let connectTimer: NodeJS.Timeout | undefined;

		const settleWith = (error: Error) => {
			if (settled) return;
			settled = true;
			if (connectTimer) clearTimeout(connectTimer);
			endSession();
			reject(error);
		};

		connectTimer = setTimeout(() => {
			if (settled) return;
			hostKeyRejected = false;
			settleWith(
				new SshError({
					...baseDetails,
					category: "timeout",
					code: "ETIMEDOUT",
					detail: `connection timed out after ${connectTimeoutMs}ms`,
				}),
			);
		}, connectTimeoutMs);

		client
			.once("ready", () => {
				if (settled) return;
				settled = true;
				if (connectTimer) clearTimeout(connectTimer);
				resolve({
					get hostKey() {
						return hostKey;
					},
					exec: (command, commandOptions) =>
						new Promise<SshCommandResult>((resolveExec, rejectExec) => {
							let stdout = "";
							let stderr = "";
							let execSettled = false;
							let stream: ClientChannel | undefined;

							const finish = (error?: SshError) => {
								if (execSettled) return;
								execSettled = true;
								clearTimeout(commandTimer);
								commandTimers.delete(commandTimer);
								if (error) rejectExec(error);
								else resolveExec({ stdout, stderr, code: 0 });
							};

							const commandTimer = setTimeout(() => {
								try {
									stream?.close();
								} catch {
									// ignore
								}
								finish(
									new SshError({
										...baseDetails,
										category: "timeout",
										code: "ETIMEDOUT",
										command,
										detail: `command timed out after ${
											commandOptions?.timeoutMs ?? commandTimeoutMs
										}ms`,
									}),
								);
							}, commandOptions?.timeoutMs ?? commandTimeoutMs);
							commandTimers.add(commandTimer);

							client.exec(command, (error, channel) => {
								if (error) {
									finish(
										new SshError({
											...baseDetails,
											category: "command",
											command,
											code:
												typeof (error as { code?: unknown }).code === "string"
													? String((error as { code?: unknown }).code)
													: undefined,
											cause: error,
											detail: rawErrorMessage(error),
										}),
									);
									return;
								}
								stream = channel;
								channel
									.once("close", (code: number | null) => {
										if (execSettled) return;
										if (code === 0 || code === null) {
											finish();
										} else {
											finish(
												new SshError({
													...baseDetails,
													category: "command",
													command,
													code: String(code),
													detail:
														stderr.trim() ||
														`command exited with code ${code}`,
												}),
											);
										}
									})
									.on("data", (data: Buffer | string) => {
										const chunk = data.toString();
										stdout += chunk;
										commandOptions?.onData?.(chunk);
									});
								channel.stderr.on("data", (data: Buffer | string) => {
									const chunk = data.toString();
									stderr += chunk;
									commandOptions?.onData?.(chunk);
								});
							});
						}),
					end: endSession,
				});
			})
			.once("error", (error: Error & ClientErrorExtensions) =>
				settleWith(classifyError(error)),
			)
			.on(
				"keyboard-interactive",
				(_name, _instructions, _lang, prompts, finish) => {
					finish(prompts.map(() => interactivePassword ?? ""));
				},
			)
			.connect({
				host: options.host,
				port: options.port ?? 22,
				username: options.username,
				...(options.auth.method === "password"
					? {
							password: options.auth.password,
							tryKeyboard: true,
						}
					: {
							privateKey: options.auth.privateKey,
							passphrase: options.auth.passphrase,
						}),
				readyTimeout: connectTimeoutMs,
				hostVerifier: (key: Buffer) => {
					const fingerprint = computeHostKeyFingerprint(key);
					hostKey = fingerprint;
					options.onHostKey?.(fingerprint);
					if (policy === "strict") {
						const known = options.hostKey?.knownFingerprintSha256;
						if (!known || known !== fingerprint.sha256) {
							hostKeyRejected = true;
							return false;
						}
					}
					return true;
				},
			});
	});
};

/**
 * Connects, runs `fn`, and always tears the connection down. This is the
 * preferred entry point for one-shot provisioning/validation operations.
 */
export const withSshSession = async <T>(
	options: SshConnectOptions,
	fn: (session: SshSession) => Promise<T>,
): Promise<{ result: T; hostKey: SshHostKeyFingerprint | undefined }> => {
	const session = await connectSsh(options);
	try {
		const result = await fn(session);
		return { result, hostKey: session.hostKey };
	} finally {
		session.end();
	}
};
