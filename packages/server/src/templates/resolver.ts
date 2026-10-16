import {
	type CompleteTemplate,
	TEMPLATES_BASE_URL,
	fetchTemplateFiles,
	fetchTemplateLogo,
	fetchTemplatesList,
	type TemplateMetadata,
} from "./github";
import {
	getLocalBlueprintsDir,
	listLocalTemplates,
	readLocalTemplateFiles,
	readLocalTemplateLogo,
} from "./local";

export type { CompleteTemplate, TemplateMetadata };

export const LOCAL_LOGO_ROUTE = "/api/templates";

/**
 * Template source resolution.
 *
 * Local checkouts (local development) read blueprints straight from the
 * `templates/` directory of the repo, so an unreachable gallery domain never
 * blocks template browsing or deployment. Everything else goes over HTTP.
 *
 * An explicit `baseUrl` (the "Base URL" field of the UI) always wins, and the
 * local directory is used as a fallback when a remote fetch fails.
 */

function resolveBaseUrl(baseUrl?: string): string {
	return (baseUrl ?? TEMPLATES_BASE_URL).replace(/\/+$/, "");
}

export function getTemplatesSource(baseUrl?: string): "local" | "remote" {
	return !baseUrl && getLocalBlueprintsDir() ? "local" : "remote";
}

export function getTemplatesLogoBaseUrl(baseUrl?: string): string {
	return getTemplatesSource(baseUrl) === "local"
		? LOCAL_LOGO_ROUTE
		: resolveBaseUrl(baseUrl);
}

export async function resolveTemplatesList(
	baseUrl?: string,
): Promise<TemplateMetadata[]> {
	if (!baseUrl && getLocalBlueprintsDir()) {
		const templates = listLocalTemplates();
		if (templates.length > 0) {
			return templates;
		}
	}
	return fetchTemplatesList(baseUrl);
}

export async function resolveTemplateFiles(
	templateId: string,
	baseUrl?: string,
): Promise<{ config: CompleteTemplate; dockerCompose: string }> {
	if (!baseUrl && getLocalBlueprintsDir()) {
		return readLocalTemplateFiles(templateId);
	}
	try {
		return await fetchTemplateFiles(templateId, baseUrl);
	} catch (error) {
		if (!getLocalBlueprintsDir()) throw error;
		console.warn(
			`Failed to fetch template "${templateId}" over HTTP, falling back to local blueprints:`,
			error,
		);
		return readLocalTemplateFiles(templateId);
	}
}

export async function resolveTemplateLogo(
	templateId: string,
	baseUrl?: string,
): Promise<string | null> {
	if (!baseUrl && getLocalBlueprintsDir()) {
		return readLocalTemplateLogo(templateId);
	}
	const remoteLogo = await fetchTemplateLogo(templateId, baseUrl);
	if (remoteLogo) return remoteLogo;
	if (!getLocalBlueprintsDir()) return null;
	return readLocalTemplateLogo(templateId);
}