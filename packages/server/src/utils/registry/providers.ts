/**
 * Provider descriptors for Container Registries.
 *
 * A descriptor is presentation and defaults only: which endpoint a provider
 * exposes, which authentication it accepts, and which capabilities it adds on
 * top of the OCI Distribution API baseline. Every provider is served by the same
 * generic OCI adapter, so supporting a new registry never means writing a new
 * adapter — which is what keeps the catalogue from becoming a hardcoded vendor
 * list.
 */
import {
	ociRegistryCapabilities,
	type RegistryAuthMethod,
	type RegistryCapability,
	type RegistryCapabilityMatrix,
	type RegistryProviderCategory,
	type RegistryProviderType,
	registryProviderCategory,
	registryProviderDescriptions,
	registryProviderLabels,
} from "./types";

export interface RegistryProviderDescriptor {
	providerType: RegistryProviderType;
	label: string;
	category: RegistryProviderCategory;
	description: string;
	/** Fixed endpoint, when the provider has exactly one. */
	endpoint?: string;
	/** Hint for endpoints that depend on the account, region or instance. */
	endpointPlaceholder?: string;
	/** Authentication transports the provider accepts. */
	authMethods: RegistryAuthMethod[];
	defaultAuthMethod: RegistryAuthMethod;
	/** What the "namespace" field means for this provider, if anything. */
	namespaceLabel?: string;
	namespacePlaceholder?: string;
	/** Default image prefix written into applications, e.g. `ghcr.io/acme`. */
	imagePrefixTemplate?: string;
	/** Capabilities this provider adds on top of the OCI baseline. */
	capabilities: RegistryCapabilityMatrix;
	docsUrl?: string;
}

const withCapabilities = (
	...extra: RegistryCapability[]
): RegistryCapabilityMatrix => {
	const capabilities = { ...ociRegistryCapabilities };
	for (const capability of extra) capabilities[capability] = true;
	return capabilities;
};

const genericOciDescriptor: RegistryProviderDescriptor = {
	providerType: "generic-oci",
	label: registryProviderLabels["generic-oci"],
	category: registryProviderCategory["generic-oci"],
	description: registryProviderDescriptions["generic-oci"],
	endpointPlaceholder: "https://registry.example.com",
	authMethods: ["none", "basic", "token"],
	defaultAuthMethod: "basic",
	imagePrefixTemplate: "{endpoint}/{namespace}",
	capabilities: withCapabilities(),
};

export const registryProviderDescriptors: RegistryProviderDescriptor[] = [
	{
		providerType: "docker-hub",
		label: registryProviderLabels["docker-hub"],
		category: registryProviderCategory["docker-hub"],
		description: registryProviderDescriptions["docker-hub"],
		endpoint: "https://registry-1.docker.io",
		authMethods: ["basic", "token"],
		defaultAuthMethod: "token",
		namespaceLabel: "Namespace (user or organization)",
		namespacePlaceholder: "acme",
		imagePrefixTemplate: "docker.io/{namespace}",
		capabilities: withCapabilities(
			"vulnerabilityScanning",
			"retentionPolicies",
		),
		docsUrl: "https://docs.docker.com/docker-hub/",
	},
	{
		providerType: "ghcr",
		label: registryProviderLabels.ghcr,
		category: registryProviderCategory.ghcr,
		description: registryProviderDescriptions.ghcr,
		endpoint: "https://ghcr.io",
		authMethods: ["basic", "token"],
		defaultAuthMethod: "token",
		namespaceLabel: "Owner (user or organization)",
		namespacePlaceholder: "acme",
		imagePrefixTemplate: "ghcr.io/{namespace}",
		capabilities: withCapabilities(
			"vulnerabilityScanning",
			"signatures",
			"sbom",
			"provenance",
		),
		docsUrl:
			"https://docs.github.com/packages/working-with-a-github-packages-registry/working-with-the-container-registry",
	},
	{
		providerType: "gitlab",
		label: registryProviderLabels.gitlab,
		category: registryProviderCategory.gitlab,
		description: registryProviderDescriptions.gitlab,
		endpointPlaceholder:
			"https://registry.gitlab.com or https://gitlab.internal",
		authMethods: ["basic", "token"],
		defaultAuthMethod: "token",
		namespaceLabel: "Project path",
		namespacePlaceholder: "group/api",
		imagePrefixTemplate: "{endpoint}/{namespace}",
		capabilities: withCapabilities(
			"vulnerabilityScanning",
			"sbom",
			"retentionPolicies",
		),
		docsUrl: "https://docs.gitlab.com/ee/user/packages/container_registry/",
	},
	{
		providerType: "ecr",
		label: registryProviderLabels.ecr,
		category: registryProviderCategory.ecr,
		description: registryProviderDescriptions.ecr,
		endpointPlaceholder: "{account-id}.dkr.ecr.{region}.amazonaws.com",
		authMethods: ["basic", "token"],
		defaultAuthMethod: "token",
		namespaceLabel: "Repository prefix",
		namespacePlaceholder: "team/api",
		imagePrefixTemplate: "{endpoint}/{namespace}",
		capabilities: withCapabilities(
			"vulnerabilityScanning",
			"signatures",
			"retentionPolicies",
			"replication",
		),
		docsUrl:
			"https://docs.aws.amazon.com/AmazonECR/latest/userguide/what-is-ecr.html",
	},
	{
		providerType: "gar",
		label: registryProviderLabels.gar,
		category: registryProviderCategory.gar,
		description: registryProviderDescriptions.gar,
		endpointPlaceholder: "{region}-docker.pkg.dev",
		authMethods: ["basic", "token"],
		defaultAuthMethod: "token",
		namespaceLabel: "Project / repository",
		namespacePlaceholder: "acme-prod/images",
		imagePrefixTemplate: "{endpoint}/{namespace}",
		capabilities: withCapabilities(
			"vulnerabilityScanning",
			"signatures",
			"sbom",
			"provenance",
			"replication",
		),
		docsUrl: "https://cloud.google.com/artifact-registry/docs/docker",
	},
	{
		providerType: "acr",
		label: registryProviderLabels.acr,
		category: registryProviderCategory.acr,
		description: registryProviderDescriptions.acr,
		endpointPlaceholder: "{registry}.azurecr.io",
		authMethods: ["basic", "token"],
		defaultAuthMethod: "token",
		namespaceLabel: "Repository prefix",
		namespacePlaceholder: "team/api",
		imagePrefixTemplate: "{endpoint}/{namespace}",
		capabilities: withCapabilities(
			"vulnerabilityScanning",
			"signatures",
			"retentionPolicies",
			"replication",
		),
		docsUrl: "https://learn.microsoft.com/azure/container-registry/",
	},
	{
		providerType: "quay",
		label: registryProviderLabels.quay,
		category: registryProviderCategory.quay,
		description: registryProviderDescriptions.quay,
		endpoint: "https://quay.io",
		authMethods: ["basic", "token"],
		defaultAuthMethod: "token",
		namespaceLabel: "Organization",
		namespacePlaceholder: "acme",
		imagePrefixTemplate: "quay.io/{namespace}",
		capabilities: withCapabilities(
			"vulnerabilityScanning",
			"signatures",
			"retentionPolicies",
			"replication",
		),
		docsUrl: "https://docs.quay.io/",
	},
	{
		providerType: "artifactory",
		label: registryProviderLabels.artifactory,
		category: registryProviderCategory.artifactory,
		description: registryProviderDescriptions.artifactory,
		endpointPlaceholder: "https://{host}/artifactory",
		authMethods: ["basic", "token"],
		defaultAuthMethod: "token",
		namespaceLabel: "Docker repository key",
		namespacePlaceholder: "docker-local",
		imagePrefixTemplate: "{endpoint}/{namespace}",
		capabilities: withCapabilities(
			"vulnerabilityScanning",
			"retentionPolicies",
			"replication",
			"registryMirroring",
		),
		docsUrl:
			"https://jfrog.com/help/r/jfrog-artifactory-documentation/docker-registry",
	},
	{
		providerType: "harbor",
		label: registryProviderLabels.harbor,
		category: registryProviderCategory.harbor,
		description: registryProviderDescriptions.harbor,
		endpointPlaceholder: "https://harbor.internal",
		authMethods: ["basic", "token"],
		defaultAuthMethod: "basic",
		namespaceLabel: "Project",
		namespacePlaceholder: "library",
		imagePrefixTemplate: "{endpoint}/{namespace}",
		capabilities: withCapabilities(
			"vulnerabilityScanning",
			"signatures",
			"sbom",
			"retentionPolicies",
			"replication",
			"registryMirroring",
		),
		docsUrl: "https://goharbor.io/docs/",
	},
	{
		providerType: "zot",
		label: registryProviderLabels.zot,
		category: registryProviderCategory.zot,
		description: registryProviderDescriptions.zot,
		endpointPlaceholder: "https://registry.local:5000",
		authMethods: ["basic", "none"],
		defaultAuthMethod: "basic",
		imagePrefixTemplate: "{endpoint}/{namespace}",
		capabilities: withCapabilities(
			"signatures",
			"sbom",
			"retentionPolicies",
			"registryMirroring",
		),
		docsUrl: "https://zotregistry.dev/",
	},
	{
		providerType: "distribution",
		label: registryProviderLabels.distribution,
		category: registryProviderCategory.distribution,
		description: registryProviderDescriptions.distribution,
		endpointPlaceholder: "https://registry.local:5000",
		authMethods: ["basic", "none"],
		defaultAuthMethod: "none",
		imagePrefixTemplate: "{endpoint}/{namespace}",
		capabilities: withCapabilities(),
		docsUrl: "https://distribution.github.io/distribution/",
	},
	{
		providerType: "nexus",
		label: registryProviderLabels.nexus,
		category: registryProviderCategory.nexus,
		description: registryProviderDescriptions.nexus,
		endpointPlaceholder: "https://nexus.internal:8082",
		authMethods: ["basic", "token"],
		defaultAuthMethod: "basic",
		namespaceLabel: "Hosted repository",
		namespacePlaceholder: "docker-hosted",
		imagePrefixTemplate: "{endpoint}/{namespace}",
		capabilities: withCapabilities(
			"vulnerabilityScanning",
			"retentionPolicies",
			"replication",
		),
		docsUrl: "https://help.sonatype.com/repomanager3/formats/docker-registry",
	},
	genericOciDescriptor,
];

/**
 * The universal fallback. Any OCI-compatible endpoint works through it, so an
 * unknown provider type still resolves to something usable.
 */
export const registryProviderDescriptor = (
	providerType: RegistryProviderType,
): RegistryProviderDescriptor =>
	registryProviderDescriptors.find(
		(descriptor) => descriptor.providerType === providerType,
	) ?? genericOciDescriptor;

/**
 * Fills the `{placeholder}` tokens of an image prefix template. Kept here so
 * the Console and the server derive the same prefix for a given registry.
 */
export const buildImagePrefix = (input: {
	providerType: RegistryProviderType;
	endpoint: string;
	namespace?: string | null;
}): string => {
	const descriptor = registryProviderDescriptor(input.providerType);
	const endpoint = input.endpoint.trim().replace(/\/+$/, "");
	const namespace =
		input.namespace?.trim().replace(/^\/+/, "").replace(/\/+$/, "") ?? "";
	const template = descriptor.imagePrefixTemplate;
	if (!template) return endpoint;
	return template
		.replace("{endpoint}", endpoint)
		.replace("{namespace}", namespace)
		.replace(/\/+$/, "");
};
