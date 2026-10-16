import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { paths } from "@notploy/server/constants";
import type { webServerSettings } from "@notploy/server/db/schema/web-server-settings";
import { parse, stringify } from "yaml";
import {
	loadOrCreateConfig,
	removeTraefikConfig,
	writeTraefikConfig,
} from "./application";
import type { FileConfig, HttpRouter } from "./file-types";
import type { MainTraefikConfig } from "./types";

export const updateServerTraefik = (
	settings: typeof webServerSettings.$inferSelect | null,
	newHost: string | null,
) => {
	const { https, certificateType, customCertResolver } = settings || {};
	const appName = "notploy";
	const config: FileConfig = loadOrCreateConfig(appName);

	config.http = config.http || { routers: {}, services: {} };
	config.http.routers = config.http.routers || {};
	config.http.services = config.http.services || {};

	// Get or create router config, but always update the rule with newHost
	const currentRouterConfig = config.http.routers[`${appName}-router-app`] || {
		service: `${appName}-service-app`,
		entryPoints: ["web"],
		rule: `Host(\`${newHost}\`)`,
	};

	// Always update the rule with the new host
	if (newHost) {
		currentRouterConfig.rule = `Host(\`${newHost}\`)`;
	}

	config.http.routers[`${appName}-router-app`] = currentRouterConfig;

	config.http.services = {
		...config.http.services,
		[`${appName}-service-app`]: {
			loadBalancer: {
				servers: [
					{
						url: `http://notploy:${process.env.PORT || 3000}`,
					},
				],
				passHostHeader: true,
			},
		},
	};

	if (https) {
		currentRouterConfig.middlewares = ["redirect-to-https"];

		const secureRouter: HttpRouter = {
			rule: `Host(\`${newHost}\`)`,
			service: `${appName}-service-app`,
			entryPoints: ["websecure"],
		};

		// `custom` needs a resolver name; without one Traefik silently falls back
		// to its default certificate, so surface it instead of pretending HTTPS.
		if (certificateType === "custom") {
			if (customCertResolver) {
				secureRouter.tls = { certResolver: customCertResolver };
			} else {
				secureRouter.tls = {};
			}
		} else if (certificateType === "letsencrypt") {
			secureRouter.tls = { certResolver: "letsencrypt" };
		} else {
			secureRouter.tls = {};
		}

		config.http.routers[`${appName}-router-app-secure`] = secureRouter;
	} else {
		delete config.http.routers[`${appName}-router-app-secure`];
		currentRouterConfig.middlewares = [];
	}

	if (newHost) {
		writeTraefikConfig(config, appName);
	} else {
		removeTraefikConfig(appName);
	}
};

export const updateLetsEncryptEmail = (newEmail: string | null) => {
	try {
		if (!newEmail) return;
		const { MAIN_TRAEFIK_PATH } = paths();
		const configPath = join(MAIN_TRAEFIK_PATH, "traefik.yml");
		const configContent = readFileSync(configPath, "utf8");
		const config = parse(configContent) as MainTraefikConfig;
		if (config?.certificatesResolvers?.letsencrypt?.acme) {
			config.certificatesResolvers.letsencrypt.acme.email = newEmail;
		} else {
			throw new Error("Invalid Let's Encrypt configuration structure.");
		}
		const newYamlContent = stringify(config);
		writeFileSync(configPath, newYamlContent, "utf8");
	} catch (error) {
		throw error;
	}
};

export const readMainConfig = () => {
	const { MAIN_TRAEFIK_PATH } = paths();
	const configPath = join(MAIN_TRAEFIK_PATH, "traefik.yml");
	if (existsSync(configPath)) {
		const yamlStr = readFileSync(configPath, "utf8");
		return yamlStr;
	}
	return null;
};

export const writeMainConfig = (traefikConfig: string) => {
	try {
		const { MAIN_TRAEFIK_PATH } = paths();
		const configPath = join(MAIN_TRAEFIK_PATH, "traefik.yml");
		writeFileSync(configPath, traefikConfig, "utf8");
	} catch (e) {
		console.error("Error saving the YAML config file:", e);
	}
};
