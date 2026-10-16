import { findAllDeploymentsByApplicationId } from "@notploy/server/services/deployment";
import {
	findRegistryByIdWithCredentials,
	type Registry,
	resolveRegistryCredentials,
	safeDockerLoginCommand,
} from "@notploy/server/services/registry";
import { createRollback } from "@notploy/server/services/rollbacks";
import { registryProviderLabels } from "@notploy/server/utils/registry";
import { quote } from "shell-quote";
import type { ApplicationNested } from "../builders";

export const uploadImageRemoteCommand = async (
	application: ApplicationNested,
) => {
	const registry = application.registry;
	const buildRegistry = application.buildRegistry;
	const rollbackRegistry = application.rollbackRegistry;

	if (!registry && !buildRegistry && !rollbackRegistry) {
		throw new Error("No registry found");
	}

	const { appName } = application;
	const imageName =
		application.sourceType === "docker"
			? application.dockerImage || ""
			: `${appName}:latest`;

	const commands: string[] = [];
	if (registry) {
		const r = await findRegistryByIdWithCredentials(registry.registryId);
		const registryTag = getRegistryTag(r, imageName);
		if (registryTag) {
			commands.push(`echo "📦 [Enabled Registry Swarm]"`);
			commands.push(await getRegistryCommands(r, imageName, registryTag));
		}
	}
	if (buildRegistry) {
		const r = await findRegistryByIdWithCredentials(buildRegistry.registryId);
		const buildRegistryTag = getRegistryTag(r, imageName);
		if (buildRegistryTag) {
			commands.push(`echo "🔑 [Enabled Build Registry]"`);
			commands.push(await getRegistryCommands(r, imageName, buildRegistryTag));
			commands.push(
				`echo "⚠️ INFO: After the build is finished, you need to wait a few seconds for the server to download the image and run the container."`,
			);
			commands.push(
				`echo "📊 Check the Logs tab to see when the container starts running."`,
			);
		}
	}

	if (rollbackRegistry && application.rollbackActive) {
		const deployment = await findAllDeploymentsByApplicationId(
			application.applicationId,
		);
		if (!deployment || !deployment[0]) {
			throw new Error("Deployment not found");
		}
		const deploymentId = deployment[0].deploymentId;
		const rollback = await createRollback({
			appName: appName,
			deploymentId: deploymentId,
		});

		const r = await findRegistryByIdWithCredentials(
			rollbackRegistry.registryId,
		);
		const rollbackRegistryTag = getRegistryTag(r, rollback?.image || "");
		if (rollbackRegistryTag) {
			commands.push(`echo "🔄 [Enabled Rollback Registry]"`);
			commands.push(
				await getRegistryCommands(r, imageName, rollbackRegistryTag),
			);
		}
	}
	try {
		return commands.join("\n");
	} catch (error) {
		throw error;
	}
};

/**
 * Extract the repository name from imageName by taking the last part after '/'
 * Examples:
 * - "nginx" -> "nginx"
 * - "nginx:latest" -> "nginx:latest"
 * - "myuser/myrepo" -> "myrepo"
 * - "myuser/myrepo:tag" -> "myrepo:tag"
 * - "docker.io/myuser/myrepo" -> "myrepo"
 */
const extractRepositoryName = (imageName: string): string => {
	const lastSlashIndex = imageName.lastIndexOf("/");

	// If no '/', return the imageName as is
	if (lastSlashIndex === -1) {
		return imageName;
	}

	// Extract everything after the last '/'
	return imageName.substring(lastSlashIndex + 1);
};

export const getRegistryTag = (registry: Registry, imageName: string) => {
	const { registryUrl, imagePrefix, username } = registry;

	// Extract the repository name (last part after '/')
	const repositoryName = extractRepositoryName(imageName);

	// Build the final tag using registry's username/prefix (must be lowercase for valid image refs)
	const targetPrefix = (imagePrefix || username || "").toLowerCase();
	const finalRegistry = registryUrl || "";

	return finalRegistry
		? `${finalRegistry}/${targetPrefix}/${repositoryName}`
		: `${targetPrefix}/${repositoryName}`;
};

const getRegistryCommands = async (
	registry: Registry,
	imageName: string,
	registryTag: string,
): Promise<string> => {
	// Credentials may live in the Secrets Manager, so resolve them here instead
	// of reading the record's inline columns.
	const credentials = await resolveRegistryCredentials(registry);
	// An anonymous registry has nothing to authenticate with: skipping the login
	// keeps public pulls working instead of failing on empty credentials.
	const loginStep =
		credentials?.username || credentials?.password
			? `
${safeDockerLoginCommand(
	registry.registryUrl,
	credentials?.username,
	credentials?.password,
)} || {
	echo "❌ Registry Login Failed" ;
	exit 1;
}
echo "✅ Registry Login Success" ;
`
			: `
echo "🔓 [Anonymous Registry] No credentials configured, pulling without authentication" ;
`;
	return `
echo ${quote([`📦 [Enabled Registry] Uploading image to '${registryProviderLabels[registry.providerType]}' | '${registryTag}'`])} ;
${loginStep}
docker tag ${quote([imageName])} ${quote([registryTag])} || {
	echo "❌ Error tagging image" ;
	exit 1;
}
echo "✅ Image Tagged" ;
docker push ${quote([registryTag])} || {
	echo "❌ Error pushing image" ;
	exit 1;
}
	echo "✅ Image Pushed" ;
`;
};
