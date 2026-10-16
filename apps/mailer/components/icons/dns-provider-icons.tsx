import Image from "next/image";
import type { SVGProps } from "react";
import { brandIcons } from "@/lib/dns-provider-brand-icons";
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

export const CloudflareIcon = ({ className }: Props) => (
	<BrandIcon data={brandIcons.cloudflare} className={className} />
);

export const PorkbunIcon = ({ className }: Props) => (
	<BrandIcon data={brandIcons.porkbun} className={className} />
);

export const InfomaniakIcon = ({ className }: Props) => (
	<BrandIcon data={brandIcons.infomaniak} className={className} />
);

export const OvhIcon = ({ className }: Props) => (
	<BrandIcon data={brandIcons.ovh} className={className} />
);

export const HetznerIcon = ({ className }: Props) => (
	<BrandIcon data={brandIcons.hetzner} className={className} />
);

export const DigitalOceanIcon = ({ className }: Props) => (
	<BrandIcon data={brandIcons.digitalocean} className={className} />
);

export const GandiIcon = ({ className }: Props) => (
	<BrandIcon data={brandIcons.gandi} className={className} />
);

export const VultrIcon = ({ className }: Props) => (
	<BrandIcon data={brandIcons.vultr} className={className} />
);

export const GodaddyIcon = ({ className }: Props) => (
	<BrandIcon data={brandIcons.godaddy} className={className} />
);

export const NamecheapIcon = ({ className }: Props) => (
	<BrandIcon data={brandIcons.namecheap} className={className} />
);

export const BunnyIcon = ({ className }: Props) => (
	<BrandIcon data={brandIcons.bunny} className={className} />
);

/** AWS Route53 — simple-icons only ships the AWS glyph, so the Route53 mark is
 * kept inline to preserve the existing look. */
export const Route53Icon = ({ className }: Props) => (
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

/** NS1 ships no brand mark in simple-icons, so a neutral globe is used. */
export const Ns1Icon = ({ className }: Props) => (
	<MonochromeIcon className={className}>
		<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2c1.2 0 2.3 1.9 2.8 4.6A22 22 0 0 0 12 8.5c-1 0-1.9.03-2.8.1C9.7 5.9 10.8 4 12 4Zm-4.6 2.3c-.4 1-.7 2.1-.9 3.2-1-.3-1.9-.7-2.5-1.2a8 8 0 0 1 3.4-2Zm9.2 0a8 8 0 0 1 3.4 2c-.6.5-1.5.9-2.5 1.2-.2-1.1-.5-2.2-.9-3.2ZM12 10.5c1.1 0 2.1.04 3.1.11.04.45.06.92.06 1.39 0 .47-.02.94-.06 1.39-1 .07-2 .11-3.1.11s-2.1-.04-3.1-.11A21 21 0 0 1 8.84 12c0-.47.02-.94.06-1.39 1-.07 2-.11 3.1-.11Zm-4.8-.4c-.1.6-.15 1.2-.15 1.9s.05 1.3.15 1.9c-1.2-.2-2.2-.5-3-.9a8 8 0 0 1 0-2c.8-.4 1.8-.7 3-.9Zm9.6 0c1.2.2 2.2.5 3 .9a8 8 0 0 1 0 2c-.8.4-1.8.7-3 .9.1-.6.15-1.2.15-1.9s-.05-1.3-.15-1.9Zm-8.5 4.9c.9.07 1.8.1 2.8.1s1.9-.03 2.8-.1c-.5 2.7-1.6 4.6-2.8 4.6s-2.3-1.9-2.8-4.6Zm-1.9-.3c-.4 1-.7 2.1-.9 3.2-1-.3-1.9-.7-2.5-1.2a8 8 0 0 0 3.4 2Zm9.2 0a8 8 0 0 0 3.4 2c-.6.5-1.5.9-2.5 1.2-.2-1.1-.5-2.2-.9-3.2Z" />
	</MonochromeIcon>
);

/** GoDaddy's brand path is wide; keep a simple "G" mark for compact rows. */
export const AkamaiIcon = ({ className }: Props) => (
	<BrandIcon data={brandIcons.akamai} className={className} />
);

/** Linode is now Akamai; the Linode mark is kept as a distinct glyph. */
export const LinodeIcon = ({ className }: Props) => (
	<MonochromeIcon className={className}>
		<path d="M12 2c-2 0-3.6.4-4.9 1.2-.7.4-1 1-.9 1.7.1.6.5 1 1.1 1.1.5.1 1 0 1.5-.3.9-.5 1.9-.7 3.2-.7 2.6 0 4 1.1 4 3.3 0 .9-.2 1.7-.7 2.3-.3.4-.4.9-.2 1.4.2.5.6.8 1.1.9.7.1 1.3-.2 1.7-.8.7-1 1.1-2.2 1.1-3.7C19.9 4.6 16.9 2 12 2Z" />
		<path d="M10.6 11.1c-.4-.3-.9-.4-1.4-.2-.5.2-.8.6-.9 1.1-.5 2.2-2.1 4-4.2 4.7-.5.2-.9.6-1 1.2-.1.5.1 1 .5 1.4.4.3 1 .4 1.5.2a8.9 8.9 0 0 0 5.6-6.3c.2-.6 0-1.2-.4-1.6l.3-.5Z" />
	</MonochromeIcon>
);

/** deSEC has no brand mark; use a shield to convey a secured resolver. */
export const DesecIcon = ({ className }: Props) => (
	<MonochromeIcon className={className}>
		<path d="M12 2 4 5v6.5c0 4.7 3.2 9.1 8 10.5 4.8-1.4 8-5.8 8-10.5V5l-8-3Zm0 2.2 6 2.2v5.1c0 3.7-2.4 7.2-6 8.4-3.6-1.2-6-4.7-6-8.4V6.4l6-2.2Z" />
		<path d="M11 9h2v6h-2zM11 16h2v2h-2z" />
	</MonochromeIcon>
);

/** ClouDNS has no brand mark. */
export const CloudnsIcon = ({ className }: Props) => (
	<MonochromeIcon className={className}>
		<path d="M6.5 18a4.5 4.5 0 0 1-.4-8.98A6 6 0 0 1 17.8 8.2 4 4 0 0 1 17 16h-1.2a2.8 2.8 0 0 0-5.6 0H6.5Z" />
		<path d="M12 14.4a2.8 2.8 0 0 0-2.8 2.8V21h5.6v-3.8A2.8 2.8 0 0 0 12 14.4Z" />
	</MonochromeIcon>
);

/** PowerDNS has no brand mark; the authoritative-server glyph is used. */
export const PowerdnsIcon = ({ className }: Props) => (
	<MonochromeIcon className={className}>
		<path d="M4 4h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm0 10h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1Z" />
		<circle cx="6.5" cy="7" r="1.3" fill="#fff" />
		<circle cx="6.5" cy="17" r="1.3" fill="#fff" />
	</MonochromeIcon>
);

/** BIND has no brand mark; use the classic nameserver zone glyph. */
export const BindIcon = ({ className }: Props) => (
	<MonochromeIcon className={className}>
		<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2c.9 0 1.9 1.4 2.5 3.6-.8-.05-1.6-.1-2.5-.1s-1.7.05-2.5.1C10.1 5.4 11.1 4 12 4Zm-4.3 1.6c-.5.8-.9 1.8-1.2 2.9-.9-.3-1.6-.6-2.1-1a8 8 0 0 1 3.3-1.9Zm8.6 0a8 8 0 0 1 3.3 1.9c-.5.4-1.2.7-2.1 1-.3-1.1-.7-2.1-1.2-2.9ZM12 10.6c1 0 1.9.05 2.8.13.1.6.15 1.2.15 1.9s-.05 1.3-.15 1.9c-.9.08-1.8.13-2.8.13s-1.9-.05-2.8-.13c-.1-.6-.15-1.2-.15-1.9s.05-1.3.15-1.9c.9-.08 1.8-.13 2.8-.13Zm-4.9.4c-.1.5-.15 1-.15 1.6s.05 1.1.15 1.6c-1.1-.2-2-.5-2.7-.8a8 8 0 0 1 0-1.6c.7-.3 1.6-.6 2.7-.8Zm9.8 0c1.1.2 2 .5 2.7.8a8 8 0 0 1 0 1.6c-.7.3-1.6.6-2.7.8.1-.5.15-1 .15-1.6s-.05-1.1-.15-1.6Zm-7.6 5.1c.8.05 1.6.1 2.7.1s1.9-.05 2.7-.1c-.6 2.2-1.6 3.6-2.7 3.6s-2.1-1.4-2.7-3.6Zm-1.7-.2c-.5.8-.9 1.1-1.2 2.2-.9-.3-1.6-.6-2.1-1a8 8 0 0 0 3.3-1.2Zm8.6 0a8 8 0 0 0 3.3 1.2c-.5.4-1.2.7-2.1 1-.3-1.1-.7-1.4-1.2-2.2Z" />
	</MonochromeIcon>
);

/** Technitium has no brand mark; use a server/network glyph. */
export const TechnitiumIcon = ({ className }: Props) => (
	<MonochromeIcon className={className}>
		<path d="M4 3h16a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm0 11h16a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1Z" />
		<circle cx="6.5" cy="6.5" r="1.2" fill="#fff" />
		<circle cx="6.5" cy="17.5" r="1.2" fill="#fff" />
		<path d="M13 5.5h5v2h-5zM13 16.5h5v2h-5z" fill="#fff" />
	</MonochromeIcon>
);

/** CoreDNS has no brand mark. */
export const CorednsIcon = ({ className }: Props) => (
	<MonochromeIcon className={className}>
		<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 3.5a6.5 6.5 0 0 1 6.3 4.9h-3.1a3.6 3.6 0 0 0-6.4 0H5.7A6.5 6.5 0 0 1 12 5.5Zm-6.5 6.5h3.2a3.6 3.6 0 0 0 6.6 0h3.2a6.5 6.5 0 0 1-13 0Z" />
	</MonochromeIcon>
);

/** Unbound has no brand mark. */
export const UnboundIcon = ({ className }: Props) => (
	<MonochromeIcon className={className}>
		<path d="M12 2 3 6v6c0 5 3.8 9.4 9 10 5.2-.6 9-5 9-10V6l-9-4Zm0 2.2 7 3.1V12c0 4-3 7.6-7 8.1-4-.5-7-4.1-7-8.1V7.3l7-3.1Z" />
		<path d="M10.8 8.5h2v4.4l3.4-3.4 1.4 1.4-3.4 3.4h4.4v2h-4.4l3.4 3.4-1.4 1.4-3.4-3.4v4.4h-2v-4.4l-3.4 3.4-1.4-1.4 3.4-3.4H6.5v-2h4.4l-3.4-3.4 1.4-1.4 3.4 3.4V8.5Z" />
	</MonochromeIcon>
);

/** Generic adapter for custom/self-built DNS platforms. */
export const CustomDnsIcon = ({ className }: Props) => (
	<MonochromeIcon className={className}>
		<path d="M9.4 6.6a3.4 3.4 0 0 1 3.4 3.4v6.8a1 1 0 1 1-2 0V10a1.4 1.4 0 0 0-2.8 0v6.8a1 1 0 1 1-2 0V10a3.4 3.4 0 0 1 3.4-3.4Zm5.2 0a3.4 3.4 0 0 1 3.4 3.4v6.8a1 1 0 1 1-2 0V10a1.4 1.4 0 0 0-2.8 0v6.8a1 1 0 1 1-2 0V10a3.4 3.4 0 0 1 3.4-3.4Z" />
		<path d="M12 21.5c-.7 0-1.3-.6-1.3-1.3s.6-1.3 1.3-1.3 1.3.6 1.3 1.3-.6 1.3-1.3 1.3Z" />
	</MonochromeIcon>
);

/**
 * First-party Notploy Internal DNS. Uses the Notploy brand mark published in
 * `public/notploy.png`.
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

export const dnsProviderIcons = {
	cloudflare: CloudflareIcon,
	route53: Route53Icon,
	porkbun: PorkbunIcon,
	infomaniak: InfomaniakIcon,
	ovh: OvhIcon,
	hetzner: HetznerIcon,
	digitalocean: DigitalOceanIcon,
	gandi: GandiIcon,
	vultr: VultrIcon,
	linode: LinodeIcon,
	desec: DesecIcon,
	bunny: BunnyIcon,
	ns1: Ns1Icon,
	godaddy: GodaddyIcon,
	namecheap: NamecheapIcon,
	cloudns: CloudnsIcon,
	powerdns: PowerdnsIcon,
	bind: BindIcon,
	technitium: TechnitiumIcon,
	coredns: CorednsIcon,
	unbound: UnboundIcon,
	custom: CustomDnsIcon,
	"notploy-internal": NotployInternalIcon,
} as const;

export type DnsProviderIconKey = keyof typeof dnsProviderIcons;
