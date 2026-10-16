import {
	Building2,
	Github,
	KeyRound,
	Landmark,
	type LucideIcon,
	Network,
	ShieldCheck,
} from "lucide-react";
import type { ProviderProtocol } from "@/components/proprietary/sso/sso-provider-meta";

/**
 * Icon shown for each identity provider protocol. Protocols share a generic
 * icon because Notploy addresses them by protocol, not by vendor.
 */
export const identityProviderIcons: Record<ProviderProtocol, LucideIcon> = {
	oidc: KeyRound,
	saml: Landmark,
	ldap: Network,
	"active-directory": Building2,
	oauth2: Github,
	custom: ShieldCheck,
};

export const identityProviderIcon = (protocol: string): LucideIcon =>
	identityProviderIcons[protocol as ProviderProtocol] ?? ShieldCheck;
