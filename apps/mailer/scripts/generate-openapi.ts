#!/usr/bin/env tsx

/**
 * Script to generate OpenAPI specification locally
 * This runs in CI/CD to generate the openapi.json file
 * which can then be consumed by the documentation website
 */

import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateOpenApiDocument } from "@notploy/trpc-openapi";
import { appRouter } from "../server/api/root";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateOpenAPI() {
	try {
		console.log("🔄 Generating OpenAPI specification...");

		const openApiDocument = generateOpenApiDocument(appRouter, {
			title: "Notploy API",
			version: "1.0.0",
			baseUrl: "https://your-notploy-instance.com/api",
			docsUrl: "https://docs.notploy.com/api",
			tags: [
				"admin",
				"docker",
				"compose",
				"registry",
				"cluster",
				"user",
				"domain",
				"destination",
				"backup",
				"deployment",
				"mounts",
				"certificates",
				"settings",
				"security",
				"redirects",
				"port",
				"project",
				"application",
				"mysql",
				"postgres",
				"redis",
				"mongo",
				"mariadb",
				"sshRouter",
				"gitProvider",
				"bitbucket",
				"github",
				"gitlab",
				"gitea",
				"server",
				"swarm",
				"ai",
				"organization",
				"schedule",
				"rollback",
				"volumeBackups",
				"environment",
			],
		});

		// Enhance metadata
		openApiDocument.info = {
			title: "Notploy API",
			description:
				"Complete API documentation for Notploy - Deploy applications, manage databases, and orchestrate your infrastructure. This API allows you to programmatically manage all aspects of your Notploy instance.",
			version: "1.0.0",
			contact: {
				name: "Notploy Team",
				url: "https://notploy.com",
			},
			license: {
				name: "Apache 2.0",
				url: "https://github.com/skygenesisenterprise/notploy/blob/master/LICENSE",
			},
		};

		// Add security schemes
		openApiDocument.components = {
			...openApiDocument.components,
			securitySchemes: {
				apiKey: {
					type: "apiKey",
					in: "header",
					name: "x-api-key",
					description:
						"API key authentication. Generate an API key from your Notploy dashboard under Settings > API Keys.",
				},
			},
		};

		// Apply global security
		openApiDocument.security = [
			{
				apiKey: [],
			},
		];

		// Add external docs
		openApiDocument.externalDocs = {
			description: "Full documentation",
			url: "https://docs.notploy.com",
		};

		// Write to root of repo
		const outputPath = resolve(__dirname, "../../../openapi.json");
		writeFileSync(
			outputPath,
			JSON.stringify(openApiDocument, null, 2),
			"utf-8",
		);

		console.log("✅ OpenAPI specification generated successfully!");
		console.log(`📄 Output: ${outputPath}`);
		console.log(
			`📊 Endpoints: ${Object.keys(openApiDocument.paths || {}).length}`,
		);
	} catch (error) {
		console.error("❌ Error generating OpenAPI specification:", error);
		process.exit(1);
	} finally {
		process.exit(0);
	}
}

generateOpenAPI();
