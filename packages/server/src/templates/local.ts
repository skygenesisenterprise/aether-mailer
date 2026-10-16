import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { parse } from "toml";
import type { CompleteTemplate, TemplateMetadata } from "./github";

const META_FILE = "meta.json";
const CONFIG_FILE = "template.toml";
const COMPOSE_FILE = "docker-compose.yml";

const MAX_LOGO_SIZE = 2 * 1024 * 1024;

const LOGO_MIME_TYPES: Record<string, string> = {
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	svg: "image/svg+xml",
	webp: "image/webp",
	gif: "image/gif",
};

/**
 * Walks up from the working directory until a `templates/blueprints` directory
 * is found, so the monorepo layout works whether we run from packages/server,
 * from apps/notploy, or through the standalone esbuild bundle.
 *
 * In a production image only apps/notploy artifacts are shipped (/app), so no
 * blueprints directory exists and callers keep using the remote gallery.
 */
function discoverBlueprintsDir(): string | null {
	let current = process.cwd();
	for (;;) {
		const candidate = path.join(current, "templates", "blueprints");
		if (existsSync(candidate)) {
			return candidate;
		}
		const parent = path.dirname(current);
		if (parent === current) return null;
		current = parent;
	}
}

let cachedDir: string | null | undefined;

/**
 * Returns the local blueprints directory when this process runs against a
 * checkout of the repo (local development), otherwise null so callers fall
 * back to the remote gallery.
 */
export function getLocalBlueprintsDir(): string | null {
	if (cachedDir !== undefined) return cachedDir;
	cachedDir = process.env.NOTPLOY_TEMPLATES_DIR
		? path.resolve(process.env.NOTPLOY_TEMPLATES_DIR)
		: discoverBlueprintsDir();
	if (cachedDir && !existsSync(cachedDir)) {
		cachedDir = null;
	}
	return cachedDir;
}

export function isLocalTemplatesEnabled(): boolean {
	return getLocalBlueprintsDir() !== null;
}

function readTemplateMetadata(blueprintsDir: string, id: string): TemplateMetadata {
	const raw = readFileSync(path.join(blueprintsDir, id, META_FILE), "utf-8");
	const entry = JSON.parse(raw) as TemplateMetadata;
	return {
		id: entry.id,
		name: entry.name,
		description: entry.description,
		version: entry.version,
		logo: entry.logo,
		links: entry.links,
		tags: Array.isArray(entry.tags) ? entry.tags : [],
	};
}

export function listLocalTemplates(): TemplateMetadata[] {
	const blueprintsDir = getLocalBlueprintsDir();
	if (!blueprintsDir) return [];

	const templates: TemplateMetadata[] = [];
	for (const id of readdirSync(blueprintsDir, { withFileTypes: true })) {
		if (!id.isDirectory()) continue;
		const templateDir = path.join(blueprintsDir, id.name);
		if (
			!existsSync(path.join(templateDir, META_FILE)) ||
			!existsSync(path.join(templateDir, CONFIG_FILE)) ||
			!existsSync(path.join(templateDir, COMPOSE_FILE))
		) {
			continue;
		}
		try {
			templates.push(readTemplateMetadata(blueprintsDir, id.name));
		} catch (error) {
			console.warn(`Skipping invalid local template "${id.name}":`, error);
		}
	}
	return templates.sort((a, b) => a.id.localeCompare(b.id));
}

export function readLocalTemplateFiles(
	templateId: string,
): { config: CompleteTemplate; dockerCompose: string } {
	const blueprintsDir = getLocalBlueprintsDir();
	if (!blueprintsDir) {
		throw new Error("Local templates are not available");
	}
	const templateDir = resolveTemplateDir(templateId);
	const templateToml = readFileSync(path.join(templateDir, CONFIG_FILE), "utf-8");
	const dockerCompose = readFileSync(path.join(templateDir, COMPOSE_FILE), "utf-8");
	const config = parse(templateToml) as CompleteTemplate;
	return { config, dockerCompose };
}

export function readLocalTemplateLogo(templateId: string): string | null {
	const blueprintsDir = getLocalBlueprintsDir();
	if (!blueprintsDir) return null;
	try {
		const metadata = readTemplateMetadata(blueprintsDir, templateId);
		if (!metadata.logo) return null;
		const logoPath = path.join(resolveTemplateDir(templateId), metadata.logo);
		const buffer = readFileSync(logoPath);
		if (buffer.length === 0 || buffer.length > MAX_LOGO_SIZE) return null;
		const extension = metadata.logo.split(".").pop()?.toLowerCase() ?? "";
		const mimeType = LOGO_MIME_TYPES[extension];
		if (!mimeType) return null;
		return `data:${mimeType};base64,${buffer.toString("base64")}`;
	} catch {
		return null;
	}
}

export function getLocalTemplateLogoPath(
	templateId: string,
): { path: string; mimeType: string } | null {
	const blueprintsDir = getLocalBlueprintsDir();
	if (!blueprintsDir) return null;
	try {
		const metadata = readTemplateMetadata(blueprintsDir, templateId);
		if (!metadata.logo) return null;
		const extension = metadata.logo.split(".").pop()?.toLowerCase() ?? "";
		const mimeType = LOGO_MIME_TYPES[extension];
		if (!mimeType) return null;
		return {
			path: path.join(resolveTemplateDir(templateId), metadata.logo),
			mimeType,
		};
	} catch {
		return null;
	}
}

/**
 * Guards against path traversal: the template id and logo always come from
 * meta.json inside the blueprints directory, so re-validate that the resolved
 * path stays inside it.
 */
function resolveTemplateDir(templateId: string): string {
	const blueprintsDir = getLocalBlueprintsDir();
	if (!blueprintsDir) {
		throw new Error("Local templates are not available");
	}
	if (!/^[a-zA-Z0-9._-]+$/.test(templateId) || templateId.includes("..")) {
		throw new Error(`Invalid template id: ${templateId}`);
	}
	const templateDir = path.join(blueprintsDir, templateId);
	if (path.dirname(templateDir) !== path.resolve(blueprintsDir)) {
		throw new Error(`Invalid template id: ${templateId}`);
	}
	return templateDir;
}