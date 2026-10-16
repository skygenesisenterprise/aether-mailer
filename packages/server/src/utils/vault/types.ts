import type { VaultProviderConfig } from "@notploy/server/db/schema";

/**
 * A browsable secret exposed by a provider. Values are never included: the
 * adapter only reports the metadata the Console can render.
 */
export interface VaultSecretRecord {
	/** Name used in a `${{vault.<provider>.<name>}}` reference. */
	name: string;
	/** Present for Notploy-managed records, so the Console can edit them. */
	id?: string;
	/** True for secrets stored by Notploy rather than the external provider. */
	managed?: boolean;
	/** Where the record lives, for providers with several sources. */
	source?: string;
	/** `false` when the name is discoverable but its value cannot be read yet. */
	resolvable?: boolean;
	/** Short note explaining the source or how to make it resolvable. */
	detail?: string;
}

export interface VaultClient<
	C extends VaultProviderConfig = VaultProviderConfig,
> {
	getSecrets(config: C, refs: string[]): Promise<Record<string, string>>;
	testConnection(config: C): Promise<void>;
	listSecretNames?(config: C): Promise<string[]>;
	/**
	 * Optional richer listing: the same names as `listSecretNames`, plus source
	 * and resolvability metadata. Falls back to `listSecretNames` when absent.
	 */
	listSecretRecords?(config: C): Promise<VaultSecretRecord[]>;
}

export const VAULT_REQUEST_TIMEOUT_MS = 15_000;

export const vaultFetch = async (url: string, init: RequestInit = {}) => {
	return await fetch(url, {
		...init,
		signal: AbortSignal.timeout(VAULT_REQUEST_TIMEOUT_MS),
	});
};
