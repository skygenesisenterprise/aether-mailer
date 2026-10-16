import type { SVGProps } from "react";
import { otpBrandIcons } from "@/lib/otp-provider-brand-icons";

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

export const GoogleAuthenticatorIcon = ({ className }: Props) => (
	<BrandIcon data={otpBrandIcons.googleauthenticator} className={className} />
);

export const OnePasswordIcon = ({ className }: Props) => (
	<BrandIcon data={otpBrandIcons.onepassword} className={className} />
);

export const BitwardenIcon = ({ className }: Props) => (
	<BrandIcon data={otpBrandIcons.bitwarden} className={className} />
);

/** Authy ships no brand mark in simple-icons; use a shield with a check. */
export const AuthyIcon = ({ className }: Props) => (
	<MonochromeIcon className={className}>
		<path d="M12 2 4 5v6.2c0 4.8 3.4 9.2 8 10.3 4.6-1.1 8-5.5 8-10.3V5l-8-3Zm-1 12.4-3-3 1.4-1.4L11 11.6l4.6-4.6L17 8.4l-6 6Z" />
	</MonochromeIcon>
);

/** Microsoft Authenticator ships no brand mark; use a neutral grid glyph. */
export const MicrosoftAuthenticatorIcon = ({ className }: Props) => (
	<MonochromeIcon className={className}>
		<path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" />
	</MonochromeIcon>
);

/** FreeOTP ships no brand mark; use a key glyph. */
export const FreeOtpIcon = ({ className }: Props) => (
	<MonochromeIcon className={className}>
		<path d="M14.5 3a6.5 6.5 0 0 0-6.14 8.62L2 18l0 3h3v-2h2v-2h2v-2h1.36A6.5 6.5 0 1 0 14.5 3Zm0 2a4.5 4.5 0 0 1 0 9 4.4 4.4 0 0 1-1.4-.22l-.66.66-.94.06-.5.5-.44.06-.5.5-.6-.06-.06.56h-1v-1l6.16-6.16-.36-.94A4.5 4.5 0 0 1 14.5 5Z" />
		<circle cx="16.4" cy="7.6" r="1.3" fill="#fff" />
	</MonochromeIcon>
);

export const otpProviderIcons = {
	googleauthenticator: GoogleAuthenticatorIcon,
	authy: AuthyIcon,
	microsoftauthenticator: MicrosoftAuthenticatorIcon,
	onepassword: OnePasswordIcon,
	bitwarden: BitwardenIcon,
	freeotp: FreeOtpIcon,
} as const;

export type OtpProviderIconKey = keyof typeof otpProviderIcons;
