import {
	Boxes,
	Cloud,
	Container,
	Cuboid,
	Database,
	FolderTree,
	Layers,
	Package,
	Server,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import {
	type BrandIconData,
	registryBrandIcons,
} from "@/lib/registry-provider-brand-icons";

/**
 * Provider marks for Container Registries.
 *
 * Providers are described by the server catalogue; this module only decides how
 * each one is drawn. Brands published by simple-icons are used where they exist
 * (`lib/registry-provider-brand-icons.ts`); the rest fall back to a neutral
 * glyph, and any provider Notploy has no mark for renders as the generic OCI
 * icon — the same adapter that serves it.
 */
type IconProps = { className?: string };

const BrandIcon = ({
	data,
	className,
}: IconProps & { data: BrandIconData }) => (
	<svg
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
		className={className}
		fill={`#${data.hex}`}
		aria-hidden="true"
	>
		<path d={data.path} />
	</svg>
);

/** Neutral glyph for providers whose mark simple-icons does not publish. */
const GlyphIcon =
	(Icon: ComponentType<SVGProps<SVGSVGElement>>) =>
	({ className }: IconProps) => (
		<Icon className={className} aria-hidden="true" />
	);

export const DockerHubIcon = ({ className }: IconProps) => (
	<BrandIcon data={registryBrandIcons.docker} className={className} />
);

export const GhcrIcon = ({ className }: IconProps) => (
	<BrandIcon data={registryBrandIcons.github} className={className} />
);

export const GitlabIcon = ({ className }: IconProps) => (
	<BrandIcon data={registryBrandIcons.gitlab} className={className} />
);

export const GarIcon = ({ className }: IconProps) => (
	<BrandIcon data={registryBrandIcons.googlecloud} className={className} />
);

export const ArtifactoryIcon = ({ className }: IconProps) => (
	<BrandIcon data={registryBrandIcons.jfrog} className={className} />
);

export const HarborIcon = ({ className }: IconProps) => (
	<BrandIcon data={registryBrandIcons.harbor} className={className} />
);

export const NexusIcon = ({ className }: IconProps) => (
	<BrandIcon data={registryBrandIcons.sonatype} className={className} />
);

export const GenericOciIcon = ({ className }: IconProps) => (
	<BrandIcon
		data={registryBrandIcons.opencontainersinitiative}
		className={className}
	/>
);

/** Amazon ECR: simple-icons no longer ships the AWS mark. */
export const EcrIcon = GlyphIcon(Cloud);

/** Azure Container Registry: same, the Azure mark is not published. */
export const AcrIcon = GlyphIcon(Cloud);

/** Quay has no published mark; boxes convey a multi-repository registry. */
export const QuayIcon = GlyphIcon(Boxes);

/** Zot is OCI-native but unpublished in simple-icons. */
export const ZotIcon = GlyphIcon(Cuboid);

/** The reference Distribution registry carries no vendor mark of its own. */
export const DistributionIcon = GlyphIcon(Container);

export const registryProviderIcons = {
	"docker-hub": DockerHubIcon,
	ghcr: GhcrIcon,
	gitlab: GitlabIcon,
	ecr: EcrIcon,
	gar: GarIcon,
	acr: AcrIcon,
	quay: QuayIcon,
	artifactory: ArtifactoryIcon,
	harbor: HarborIcon,
	zot: ZotIcon,
	distribution: DistributionIcon,
	nexus: NexusIcon,
	"generic-oci": GenericOciIcon,
} as const;

export type RegistryProviderIconKey = keyof typeof registryProviderIcons;

/** Icons used outside the provider list (headers, empty states, dialogs). */
export const RegistryIcons = {
	registry: Package,
	storage: Database,
	selfHosted: Server,
	layers: Layers,
	tree: FolderTree,
	artifacts: Boxes,
	generic: GenericOciIcon,
} as const;
