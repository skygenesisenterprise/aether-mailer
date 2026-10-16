import Image from "next/image";
import type { SVGProps } from "react";
import { objectStorageBrandIcons } from "@/lib/object-storage-brand-icons";
import { cn } from "@/lib/utils";

interface Props {
	className?: string;
}

const BrandIcon = ({
	data,
	className,
}: {
	data: { hex: string; path: string };
	className?: string;
}) => (
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

const MonochromeIcon = ({
	children,
	className,
	...props
}: Props & SVGProps<SVGSVGElement>) => (
	<svg
		viewBox="0 0 24 24"
		fill="currentColor"
		xmlns="http://www.w3.org/2000/svg"
		className={className}
		aria-hidden="true"
		{...props}
	>
		{children}
	</svg>
);

/**
 * AWS retired its marks from simple-icons, so the official wordmark already
 * used for Route53 is kept inline to preserve the brand look.
 */
export const AwsIcon = ({ className }: Props) => (
	<svg
		viewBox="0 0 304 182"
		xmlns="http://www.w3.org/2000/svg"
		className={className}
		aria-hidden="true"
	>
		<path
			fill="currentColor"
			d="m86 66 2 9c0 3 1 5 3 8v2l-1 3-7 4-2 1-3-1-4-5-3-6c-8 9-18 14-29 14-9 0-16-3-20-8-5-4-8-11-8-19s3-15 9-20c6-6 14-8 25-8a79 79 0 0 1 22 3v-7c0-8-2-13-5-16-3-4-8-5-16-5l-11 1a80 80 0 0 0-14 5h-2c-1 0-2-1-2-3v-5l1-3c0-1 1-2 3-2l12-5 16-2c12 0 20 3 26 8 5 6 8 14 8 25v32zM46 82l10-2c4-1 7-4 10-7l3-6 1-9v-4a84 84 0 0 0-19-2c-6 0-11 1-15 4-3 2-4 6-4 11s1 8 3 11c3 2 6 4 11 4zm80 10-4-1-2-3-23-78-1-4 2-2h10l4 1 2 4 17 66 15-66 2-4 4-1h8l4 1 2 4 16 67 17-67 2-4 4-1h9c2 0 3 1 3 2v2l-1 2-24 78-2 4-4 1h-9l-4-1-1-4-16-65-15 64-2 4-4 1h-9zm129 3a66 66 0 0 1-27-6l-3-3-1-2v-5c0-2 1-3 2-3h2l3 1a54 54 0 0 0 23 5c6 0 11-2 14-4 4-2 5-5 5-9l-2-7-10-5-15-5c-7-2-13-6-16-10a24 24 0 0 1 5-34l10-5a44 44 0 0 1 20-2 110 110 0 0 1 12 3l4 2 3 2 1 4v4c0 3-1 4-2 4l-4-2c-6-2-12-3-19-3-6 0-11 0-14 2s-4 5-4 9c0 3 1 5 3 7s5 4 11 6l14 4c7 3 12 6 15 10s5 9 5 14l-3 12-7 8c-3 3-7 5-11 6l-14 2z"
		/>
		<path
			d="M274 144A220 220 0 0 1 4 124c-4-3-1-6 2-4a300 300 0 0 0 263 16c5-2 10 4 5 8z"
			fill="#f90"
		/>
		<path
			d="M287 128c-4-5-28-3-38-1-4 0-4-3-1-5 19-13 50-9 53-5 4 5-1 36-18 51-3 2-6 1-5-2 5-10 13-33 9-38z"
			fill="#f90"
		/>
	</svg>
);

export const CloudflareR2Icon = ({ className }: Props) => (
	<BrandIcon data={objectStorageBrandIcons.cloudflare} className={className} />
);

export const ScalewayIcon = ({ className }: Props) => (
	<BrandIcon data={objectStorageBrandIcons.scaleway} className={className} />
);

export const WasabiIcon = ({ className }: Props) => (
	<BrandIcon data={objectStorageBrandIcons.wasabi} className={className} />
);

export const DigitalOceanIcon = ({ className }: Props) => (
	<BrandIcon
		data={objectStorageBrandIcons.digitalocean}
		className={className}
	/>
);

export const BackblazeIcon = ({ className }: Props) => (
	<BrandIcon data={objectStorageBrandIcons.backblaze} className={className} />
);

export const OvhIcon = ({ className }: Props) => (
	<BrandIcon data={objectStorageBrandIcons.ovh} className={className} />
);

/** Linode is now Akamai; the Akamai brand mark is used for the provider. */
export const LinodeIcon = ({ className }: Props) => (
	<BrandIcon data={objectStorageBrandIcons.akamai} className={className} />
);

export const MinioIcon = ({ className }: Props) => (
	<BrandIcon data={objectStorageBrandIcons.minio} className={className} />
);

export const RustfsIcon = ({ className }: Props) => (
	<BrandIcon data={objectStorageBrandIcons.rustfs} className={className} />
);

export const CephIcon = ({ className }: Props) => (
	<BrandIcon data={objectStorageBrandIcons.ceph} className={className} />
);

/** Storj ships no brand mark in simple-icons; a distributed-store glyph is used. */
export const StorjIcon = ({ className }: Props) => (
	<MonochromeIcon className={className}>
		<path d="M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 2.3 6.8 3.8v7.8L12 19.7 5.2 15.9V8.1L12 4.3Z" />
		<path d="M12 8 8.5 10v4L12 16l3.5-2v-4L12 8Z" />
	</MonochromeIcon>
);

/** IDrive e2 has no brand mark; a cloud-drive glyph is used. */
export const IdriveIcon = ({ className }: Props) => (
	<MonochromeIcon className={className}>
		<path d="M7 18a4.2 4.2 0 0 1-.5-8.37A5.5 5.5 0 0 1 17.4 9.3 3.6 3.6 0 0 1 17 16.5H7Zm5-7v5.2l1.9-1.9 1.4 1.4L12 19l-3.3-3.3 1.4-1.4 1.9 1.9V11h2Z" />
	</MonochromeIcon>
);

/** SeaweedFS has no brand mark; a wave glyph is used. */
export const SeaweedfsIcon = ({ className }: Props) => (
	<MonochromeIcon className={className}>
		<path
			d="M2 8.5c1.8 0 2.2 1.5 4 1.5s2.2-1.5 4-1.5 2.2 1.5 4 1.5 2.2-1.5 4-1.5 2.2 1.5 4 1.5"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
		/>
		<path
			d="M2 14c1.8 0 2.2 1.5 4 1.5S8.2 14 10 14s2.2 1.5 4 1.5 2.2-1.5 4-1.5 2.2 1.5 4 1.5"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
		/>
	</MonochromeIcon>
);

/** Garage has no brand mark in simple-icons; a storage-bay glyph is used. */
export const GarageIcon = ({ className }: Props) => (
	<MonochromeIcon className={className}>
		<path d="M2 11 12 3l10 8v9a1 1 0 0 1-1 1h-6v-6h-6v6H3a1 1 0 0 1-1-1v-9Zm4 .4V19h3v-6h6v6h3v-7.6l-6-4.8-6 4.8Z" />
	</MonochromeIcon>
);

/** Generic adapter for any S3-compatible endpoint. */
export const S3CompatibleIcon = ({ className }: Props) => (
	<MonochromeIcon className={className}>
		<path d="M4 6c0-1.66 3.58-3 8-3s8 1.34 8 3v12c0 1.66-3.58 3-8 3s-8-1.34-8-3V6Zm2 .42c.86.6 3 1.08 6 1.08s5.14-.48 6-1.08C17.14 5.82 15 5.34 12 5.34s-5.14.48-6 1.08ZM6 8.72V11c.86.6 3 1.08 6 1.08s5.14-.48 6-1.08V8.72c-1.5.56-3.68.78-6 .78s-4.5-.22-6-.78Zm0 4.5V16c.86.6 3 1.08 6 1.08s5.14-.48 6-1.08v-2.78c-1.5.56-3.68.78-6 .78s-4.5-.22-6-.78Z" />
	</MonochromeIcon>
);

/**
 * First-party Notploy Internal Storage. Uses the Notploy brand mark published
 * in `public/notploy.png`.
 */
export const NotployInternalIcon = ({ className }: Props) => (
	<Image
		src="/notploy.png"
		alt=""
		aria-hidden="true"
		width={1254}
		height={1254}
		className={cn("object-contain", className)}
	/>
);

export const objectStorageProviderIcons = {
	aws: AwsIcon,
	"cloudflare-r2": CloudflareR2Icon,
	scaleway: ScalewayIcon,
	wasabi: WasabiIcon,
	digitalocean: DigitalOceanIcon,
	backblaze: BackblazeIcon,
	ovh: OvhIcon,
	linode: LinodeIcon,
	storj: StorjIcon,
	idrive: IdriveIcon,
	minio: MinioIcon,
	rustfs: RustfsIcon,
	ceph: CephIcon,
	seaweedfs: SeaweedfsIcon,
	garage: GarageIcon,
	"s3-compatible": S3CompatibleIcon,
	"notploy-internal": NotployInternalIcon,
} as const;

export type ObjectStorageProviderIconKey =
	keyof typeof objectStorageProviderIcons;
