import { createOciRegistryAdapter } from "./src/utils/registry/adapter";

const main = async () => {
	const anonymous = createOciRegistryAdapter({
		providerType: "ghcr",
		endpoint: "https://ghcr.io",
		credentials: null,
	});
	for (const repository of [
		"home-assistant/home-assistant",
		"linuxserver/plex",
	]) {
		try {
			const tags = await anonymous.listTags(repository);
			console.log(`${repository}: ${tags.length} tags -> ${tags.slice(0, 3).map((t) => t.tag).join(", ")}`);
		} catch (error) {
			console.log(`${repository}: FAILED ${(error as Error).message}`);
		}
		const digest = await anonymous
			.getDigest(repository, "latest")
			.then((value) => value)
			.catch((error) => `FAILED ${(error as Error).message}`);
		console.log(`${repository}@latest digest: ${digest}`);
	}
};
await main();
