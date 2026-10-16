"use client";

import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/utils/api";
import { useUrl } from "@/utils/hooks/use-url";
import { SsoCapabilityMatrix } from "./sso-capability-matrix";
import {
	identityHealthLabels,
	protocolLabel,
	resolveProviderProtocol,
} from "./sso-provider-meta";
import { vendorLabelForProvider } from "./sso-provider-presets";

export interface SsoProviderSummary {
	id: string | null;
	providerId: string;
	issuer: string;
	domain: string;
	oidcConfig: string | null;
	samlConfig: string | null;
	ldapConfig?: string | null;
	oauthConfig?: string | null;
}

interface Props {
	provider: SsoProviderSummary | null;
	onOpenChange: (open: boolean) => void;
}

const Field = ({
	label,
	value,
	mono = false,
}: {
	label: string;
	value: React.ReactNode;
	mono?: boolean;
}) => (
	<div className="grid gap-1">
		<span className="text-xs font-medium text-muted-foreground">{label}</span>
		<p
			className={`break-all rounded-md bg-muted px-2 py-1.5 text-sm ${
				mono ? "font-mono text-xs" : ""
			}`}
		>
			{value}
		</p>
	</div>
);

export const SsoProviderDetailsDialog = ({ provider, onOpenChange }: Props) => {
	const baseURL = useUrl();
	const { data: health, isPending } = api.sso.health.useQuery(
		{ providerId: provider?.providerId ?? "" },
		{ enabled: !!provider, retry: false, refetchOnWindowFocus: false },
	);

	if (!provider) return null;

	const protocol = resolveProviderProtocol(provider);
	const identity = health?.identity;
	const vendorLabel = vendorLabelForProvider({
		protocol,
		issuer: provider.issuer,
	});
	const isDirectory = protocol === "ldap" || protocol === "active-directory";
	// Directories authenticate against the directory itself, so there is no
	// inbound callback URL to configure on the provider. A social source takes
	// the provider id in the query instead of the path.
	const callbackPath = isDirectory
		? null
		: protocol === "oauth2"
			? "/api/auth/sign-in/social-sso/callback"
			: protocol === "saml"
				? `/api/auth/sso/saml2/callback/${provider.providerId}`
				: `/api/auth/sso/callback/${provider.providerId}`;

	return (
		<Dialog open={!!provider} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
				<DialogHeader>
					<DialogTitle>{provider.providerId}</DialogTitle>
					<DialogDescription>
						Identity provider configuration, capabilities and live diagnostics.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-3 py-2">
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="outline">
							{vendorLabel ?? protocolLabel(protocol)}
						</Badge>
						{health && (
							<Badge
								variant={
									health.status === "connected" ? "secondary" : "outline"
								}
							>
								{identityHealthLabels[health.status] ?? health.status}
								{health.latencyMs != null ? ` · ${health.latencyMs} ms` : ""}
							</Badge>
						)}
					</div>

					<Field label="Provider ID" value={provider.providerId} mono />
					<Field label="Issuer URL" value={provider.issuer} />
					<Field
						label="Domains"
						value={provider.domain
							.split(",")
							.map((domain) => domain.trim())
							.filter(Boolean)
							.join(", ")}
					/>
					{callbackPath && (
						<Field
							label={
								protocol === "oauth2"
									? "Callback URL (configure in GitHub)"
									: "Callback URL (configure in your IdP)"
							}
							value={`${baseURL || "{baseURL}"}${callbackPath}`}
							mono
						/>
					)}
					{callbackPath && !baseURL && (
						<p className="text-xs text-muted-foreground">
							Replace {"{baseURL}"} with your Notploy URL (e.g.
							https://your-domain.com).
						</p>
					)}

					{isPending ? (
						<div className="flex items-center gap-2 rounded-md border p-3 text-sm text-muted-foreground">
							<Loader2 className="size-4 animate-spin" />
							Running diagnostics...
						</div>
					) : (
						<>
							{health?.message && (
								<Field
									label="Diagnostics"
									value={
										<>
											{health.message}
											{health.remediation && (
												<span className="mt-1 block text-xs text-muted-foreground">
													{health.remediation}
												</span>
											)}
										</>
									}
								/>
							)}

							{identity &&
								(identity.authorizationEndpoint ||
									identity.tokenEndpoint ||
									identity.userInfoEndpoint ||
									identity.jwksUri ||
									identity.ssoUrl) && (
									<div className="grid gap-1">
										<span className="text-xs font-medium text-muted-foreground">
											Identity information
										</span>
										<div className="grid gap-1 rounded-md bg-muted px-2 py-1.5 text-xs">
											{identity.issuer && (
												<span className="break-all">
													Issuer:{" "}
													<span className="font-mono">{identity.issuer}</span>
												</span>
											)}
											{identity.authorizationEndpoint && (
												<span className="break-all">
													Authorization:{" "}
													<span className="font-mono">
														{identity.authorizationEndpoint}
													</span>
												</span>
											)}
											{identity.tokenEndpoint && (
												<span className="break-all">
													Token:{" "}
													<span className="font-mono">
														{identity.tokenEndpoint}
													</span>
												</span>
											)}
											{identity.userInfoEndpoint && (
												<span className="break-all">
													UserInfo:{" "}
													<span className="font-mono">
														{identity.userInfoEndpoint}
													</span>
												</span>
											)}
											{identity.jwksUri && (
												<span className="break-all">
													JWKS:{" "}
													<span className="font-mono">{identity.jwksUri}</span>
												</span>
											)}
											{identity.ssoUrl && (
												<span className="break-all">
													SSO URL:{" "}
													<span className="font-mono">{identity.ssoUrl}</span>
												</span>
											)}
										</div>
									</div>
								)}

							{health && (
								<div className="grid gap-1">
									<span className="text-xs font-medium text-muted-foreground">
										Capabilities
									</span>
									<SsoCapabilityMatrix capabilities={health.capabilities} />
								</div>
							)}
						</>
					)}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
