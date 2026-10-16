// Generates lib/registry-provider-brand-icons.ts from simple-icons.
// Run with: node scripts/generate-registry-brand-icons.mjs
//
// Only brands published by simple-icons are listed. Providers it does not ship
// a mark for (AWS, Azure, Quay, Zot) fall back to a neutral glyph in
// components/icons/registry-provider-icons.tsx.
import { writeFileSync } from "node:fs";
import * as si from "simple-icons";

const slugs = [
	"docker",
	"github",
	"gitlab",
	"googlecloud",
	"jfrog",
	"harbor",
	"sonatype",
	"opencontainersinitiative",
];

const bySlug = new Map(
	Object.values(si)
		.filter(Boolean)
		.map((icon) => [icon.slug, icon]),
);

const entries = slugs.map((slug) => {
	const icon = bySlug.get(slug);
	if (!icon) throw new Error(`simple-icons has no icon for ${slug}`);
	const key = slug.replace(/-/g, "");
	return `\t${key}: {\n\t\thex: "${icon.hex}",\n\t\tpath: "${icon.path}",\n\t},`;
});

const file = `// Brand paths extracted from simple-icons (https://simpleicons.org).
// Generated data only — do not add logic here.
// Regenerate with: node scripts/generate-registry-brand-icons.mjs

export interface BrandIconData {
\thex: string;
\tpath: string;
}

export const registryBrandIcons = {
${entries.join("\n")}
} as const;

export type RegistryBrandIconKey = keyof typeof registryBrandIcons;
`;

writeFileSync("lib/registry-provider-brand-icons.ts", file);
console.log(`Wrote ${entries.length} registry brand icons`);
