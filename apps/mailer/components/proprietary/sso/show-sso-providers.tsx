"use client";

import { Activity, Eye, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { identityProviderIcon } from "@/components/icons/identity-provider-icons";
import { DialogAction } from "@/components/shared/dialog-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/utils/api";
import { HandleIdentityProvider } from "./handle-identity-provider";
import { SsoHealthBadge } from "./sso-health-badge";
import {
	SsoProviderDetailsDialog,
	type SsoProviderSummary,
} from "./sso-provider-details-dialog";
import { protocolLabel, resolveProviderProtocol } from "./sso-provider-meta";
import { vendorLabelForProvider } from "./sso-provider-presets";

export const ShowSsoProviders = () => {
	const utils = api.useUtils();
	const [removingId, setRemovingId] = useState<string | null>(null);
	const [detailsProvider, setDetailsProvider] =
		useState<SsoProviderSummary | null>(null);

	const { data, isPending, isError, error, refetch } =
		api.sso.listProviders.useQuery();
	const { mutateAsync } = api.sso.deleteProvider.useMutation();

	const providerCount = data?.length ?? 0;

	return (
		<div className="w-full">
			<Card className="h-full bg-sidebar p-2.5 rounded-xl">
				<div className="rounded-xl bg-background shadow-md">
					<div className="flex flex-wrap items-center justify-between gap-4 p-6">
						<CardHeader className="flex-1 p-0">
							<CardTitle className="text-xl flex flex-row gap-2">
								<ShieldCheck className="size-6 text-muted-foreground self-center" />
								Identity Providers
							</CardTitle>
							<CardDescription>
								Connect the identity infrastructure you already run. Pick a
								preset for vendors we know, or configure any compatible system
								by protocol (OIDC, SAML 2.0, LDAP, Active Directory).
							</CardDescription>
						</CardHeader>
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="secondary" className="tabular-nums">
								{providerCount} {providerCount === 1 ? "provider" : "providers"}
							</Badge>
							<HandleIdentityProvider />
						</div>
					</div>

					<CardContent className="flex min-h-[60vh] flex-col gap-4 border-t py-8">
						{isPending ? (
							<div className="flex flex-1 flex-row items-center justify-center gap-2 text-sm text-muted-foreground">
								<span>Loading...</span>
								<Loader2 className="animate-spin size-4" />
							</div>
						) : isError ? (
							<div
								role="alert"
								className="flex flex-1 flex-col items-center justify-center gap-3 text-center"
							>
								<span className="text-sm text-destructive">
									Unable to load identity providers: {error?.message}
								</span>
								<Button
									variant="outline"
									size="sm"
									onClick={() => void refetch()}
								>
									Try again
								</Button>
							</div>
						) : providerCount === 0 ? (
							<div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
								<Activity className="size-8 text-muted-foreground" />
								<span className="font-medium text-muted-foreground">
									No identity providers configured
								</span>
								<span className="max-w-sm text-center text-sm text-muted-foreground">
									Use <span className="font-medium">Add provider</span> to
									connect an OIDC, SAML 2.0 or directory source. Users can sign
									in with it once it is registered.
								</span>
							</div>
						) : (
							<ul className="flex flex-col gap-2">
								{data?.map((provider) => {
									const protocol = resolveProviderProtocol(provider);
									const ProviderIcon = identityProviderIcon(protocol);
									const domains = provider.domain
										.split(",")
										.map((domain) => domain.trim())
										.filter(Boolean);
									return (
										<li
											key={provider.providerId}
											className="group relative flex items-center gap-3 rounded-lg border bg-background px-4 py-3 transition-colors duration-150 ease-out hover:border-foreground/20 hover:bg-muted/50 focus-within:border-ring"
										>
											<ProviderIcon className="size-7 shrink-0 text-muted-foreground" />
											<div className="flex min-w-0 flex-col gap-0.5">
												<div className="flex flex-wrap items-center gap-2">
													<span className="truncate text-sm font-medium">
														{provider.providerId}
													</span>
													<Badge variant="outline" className="text-xs">
														{vendorLabelForProvider({
															protocol,
															issuer: provider.issuer,
														}) ?? protocolLabel(protocol)}
													</Badge>
												</div>
												<span className="truncate text-xs text-muted-foreground">
													{provider.issuer}
												</span>
												{domains.length > 0 && (
													<div className="flex flex-wrap gap-1">
														{domains.map((domain) => (
															<Badge
																key={domain}
																variant="secondary"
																className="text-xs"
															>
																{domain}
															</Badge>
														))}
													</div>
												)}
											</div>

											<div className="relative z-10 ml-auto flex shrink-0 flex-row items-center gap-1">
												<SsoHealthBadge providerId={provider.providerId} />

												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="text-muted-foreground"
															onClick={() =>
																setDetailsProvider({
																	id: provider.id,
																	providerId: provider.providerId,
																	issuer: provider.issuer,
																	domain: provider.domain,
																	oidcConfig: provider.oidcConfig,
																	samlConfig: provider.samlConfig,
																	ldapConfig: provider.ldapConfig,
																	oauthConfig: provider.oauthConfig,
																})
															}
														>
															<Eye className="size-4" />
															<span className="sr-only">View details</span>
														</Button>
													</TooltipTrigger>
													<TooltipContent>View details</TooltipContent>
												</Tooltip>

												<HandleIdentityProvider
													providerId={provider.providerId}
												/>

												<Tooltip>
													<DialogAction
														title="Remove identity provider"
														description={`Remove "${provider.providerId}"? Users will no longer be able to use this provider to sign in.`}
														type="destructive"
														onClick={async () => {
															setRemovingId(provider.providerId);
															try {
																await mutateAsync({
																	providerId: provider.providerId,
																});
																toast.success("Identity provider removed");
																await utils.sso.listProviders.invalidate();
															} catch (err) {
																toast.error(
																	err instanceof Error
																		? err.message
																		: "Unable to remove identity provider",
																);
															} finally {
																setRemovingId(null);
															}
														}}
													>
														<TooltipTrigger asChild>
															<Button
																variant="ghost"
																size="icon"
																className="text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
																isLoading={removingId === provider.providerId}
															>
																<Trash2 className="size-4" />
																<span className="sr-only">Remove provider</span>
															</Button>
														</TooltipTrigger>
													</DialogAction>
													<TooltipContent>Remove provider</TooltipContent>
												</Tooltip>
											</div>
										</li>
									);
								})}
							</ul>
						)}
					</CardContent>
				</div>
			</Card>

			<SsoProviderDetailsDialog
				provider={detailsProvider}
				onOpenChange={(open) => {
					if (!open) setDetailsProvider(null);
				}}
			/>
		</div>
	);
};
