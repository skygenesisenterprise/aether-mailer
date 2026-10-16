"use client";
import {
	ArrowUpRight,
	Bell,
	Check,
	ChevronsUpDown,
	CircleAlert,
	CircleCheck,
	Clock3,
	ExternalLink,
	Info,
	Loader2,
	Star,
	Trash2,
	TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TruncateTooltip } from "@/components/shared/truncate-tooltip";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
	SIDEBAR_COOKIE_NAME,
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
	useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { api, type RouterOutputs } from "@/utils/api";
import { TrialBanner } from "../dashboard/billing/trial-banner";
import { AddOrganization } from "../dashboard/organization/handle-organization";
import { GithubIcon } from "../icons/data-tools-icons";
import { DialogAction } from "../shared/dialog-action";
import { Logo } from "../shared/logo";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { TimeBadge } from "../ui/time-badge";
import {
	createNavigation,
	findActiveNavigation,
	isActiveRoute,
	type LicenseTier,
	type Navigation,
	type NavigationEnvironment,
	type NavigationItem,
} from "./navigation";
import { UpdateServerButton } from "./update-server";
import { UserNav } from "./user-nav";

/**
 * Renders each product domain as one heading with a flat list of destinations.
 */
function SidebarNavigation({
	navigation,
	pathname,
	currentTab,
}: {
	navigation: Navigation;
	pathname: string;
	currentTab?: string;
}) {
	const renderItems = (items: NavigationItem[]) => (
		<SidebarMenu className="gap-0.5">
			{items.map((item) => {
				const isActive = isActiveRoute({
					itemUrl: item.href,
					pathname,
					activeTab: item.activeTab,
					currentTab,
				});

				return (
					<SidebarMenuItem key={item.href}>
						<SidebarMenuButton
							asChild
							tooltip={item.label}
							isActive={isActive}
							className={cn(isActive && "bg-border")}
						>
							<Link href={item.href} className="flex w-full items-center gap-2">
								<item.icon
									aria-hidden
									className={cn(
										"size-4 shrink-0",
										isActive ? "text-primary" : "text-muted-foreground",
									)}
								/>
								<span className="truncate">{item.label}</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				);
			})}
		</SidebarMenu>
	);

	return (
		<>
			{navigation.sections.map((section) => {
				const items = [
					...section.items,
					...(section.groups?.flatMap((group) => group.items) ?? []),
				];

				return (
					<SidebarGroup key={section.id} className="pb-1 pt-1 first:pt-0">
						<SidebarGroupLabel className="h-6 cursor-default px-2 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
							{section.label}
						</SidebarGroupLabel>
						{renderItems(items)}
					</SidebarGroup>
				);
			})}
		</>
	);
}

interface Props {
	children: React.ReactNode;
}

const LICENSE_META: Record<
	LicenseTier,
	{ label: string; variant: "blank" | "blue" | "green"; hint: string }
> = {
	free: {
		label: "Free",
		variant: "blank",
		hint: "Free licence — no active paid subscription",
	},
	pro: {
		label: "Pro",
		variant: "blue",
		hint: "Pro licence — active paid subscription",
	},
	enterprise: {
		label: "Enterprise",
		variant: "green",
		hint: "Enterprise licence — managed agreement",
	},
};

function LicenseBadge({
	license,
	className,
}: {
	license: LicenseTier;
	className?: string;
}) {
	const meta = LICENSE_META[license];
	return (
		<Badge
			variant={meta.variant}
			title={meta.hint}
			aria-label={meta.hint}
			className={cn("shrink-0 tracking-wide uppercase", className)}
		>
			{meta.label}
		</Badge>
	);
}

/**
 * Resolves the cloud licence tier of the active workspace.
 *
 * Licence tiers are a Cloud concept: self-hosted instances are unlicensed and the
 * Console is an internal operator surface, so both always return `null`. Only the
 * `cloud` product reports a tier (and only there is the subscription queried).
 *
 * Local development has no real subscription, so it defaults to the Enterprise
 * licence: that keeps licence gating from blocking developers. The dev stack is
 * the only place NODE_ENV is not "production" (mirrors
 * `allowUnlicensedDevInstance`); production always resolves the real tier.
 */
function useWorkspaceLicense(): LicenseTier | null {
	const { data: product } = api.settings.getProduct.useQuery();
	const { data: user } = api.user.get.useQuery();
	const { data: currentPlan } = api.stripe.getCurrentPlan.useQuery(undefined, {
		enabled: product === "cloud",
		refetchOnWindowFocus: false,
	});

	if (product !== "cloud") return null;
	if (process.env.NODE_ENV !== "production" || user?.user.isEnterpriseCloud) {
		return "enterprise";
	}
	return currentPlan ? "pro" : "free";
}

function LogoWrapper() {
	return <SidebarLogo />;
}

/**
 * Default workspace name shown by the operator Console when no organization is
 * active: the Console is a single-tenant surface run by Sky Genesis Enterprise.
 */
const CONSOLE_ORGANIZATION_NAME = "Sky Genesis Enterprise";

function SidebarLogo() {
	const { state } = useSidebar();
	const { data: isCloud } = api.settings.isCloud.useQuery();
	const { data: product } = api.settings.getProduct.useQuery();
	const { data: user } = api.user.get.useQuery();
	const { data: session } = api.user.session.useQuery();
	const {
		data: organizations,
		refetch,
		isLoading,
	} = api.organization.all.useQuery();
	const { mutateAsync: deleteOrganization, isPending: isRemoving } =
		api.organization.delete.useMutation();
	const { mutateAsync: setDefaultOrganization, isPending: isSettingDefault } =
		api.organization.setDefault.useMutation();
	const { isMobile } = useSidebar();
	const isCollapsed = state === "collapsed" && !isMobile;
	const { data: activeOrganization } = api.organization.active.useQuery();

	// The Console is the internal operator surface: one workspace, branded after
	// the company, and no self-service organization creation.
	const isConsole = product === "console";
	const organizationDisplayName =
		activeOrganization?.name ??
		(isConsole ? CONSOLE_ORGANIZATION_NAME : "Select Organization");

	// Workspace licence, resolved once and shared with the navigation engine.
	const license = useWorkspaceLicense();

	const [_activeTeam, setActiveTeam] = useState<
		typeof activeOrganization | null
	>(null);
	const [organizationSelectorOpen, setOrganizationSelectorOpen] =
		useState(false);

	useEffect(() => {
		if (activeOrganization) {
			setActiveTeam(activeOrganization);
		}
	}, [activeOrganization]);

	return (
		<>
			{isLoading ? (
				<div className="flex flex-row gap-2 items-center justify-center text-sm text-muted-foreground min-h-[5vh] pt-4">
					<Loader2 className="animate-spin size-4" />
				</div>
			) : (
				<SidebarMenu
					className={cn(
						"flex gap-2",
						isCollapsed ? "flex-col" : "flex-row justify-between items-center",
					)}
				>
					{/* Organization Logo and Selector */}
					<SidebarMenuItem className={"w-full min-w-0"}>
						<Popover
							open={organizationSelectorOpen}
							onOpenChange={setOrganizationSelectorOpen}
						>
							<PopoverTrigger asChild>
								<SidebarMenuButton
									size={isCollapsed ? "sm" : "lg"}
									className={cn(
										"data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
										isCollapsed
											? "flex justify-center items-center p-2 h-10 w-10 mx-auto"
											: "h-auto min-h-12",
									)}
								>
									<div
										className={cn(
											"flex min-w-0 flex-1 items-center gap-2",
											isCollapsed && "justify-center",
										)}
									>
										<div
											className={cn(
												"flex size-6 shrink-0 items-center justify-center rounded-sm border",
											)}
										>
											<Logo
												className={cn(
													"transition-all",
													isCollapsed ? "size-4" : "size-5",
												)}
												logoUrl={activeOrganization?.logo || undefined}
											/>
										</div>
										<div
											className={cn(
												"flex flex-col items-start min-w-0 flex-1",
												isCollapsed && "hidden",
											)}
										>
											<TruncateTooltip
												text={organizationDisplayName}
												className="w-full text-sm font-medium"
											/>
											{license && (
												<LicenseBadge license={license} className="mt-0.5" />
											)}
										</div>
									</div>
									<ChevronsUpDown
										className={cn("ml-auto shrink-0", isCollapsed && "hidden")}
									/>
								</SidebarMenuButton>
							</PopoverTrigger>
							<PopoverContent
								className="w-96 p-0"
								align="start"
								side={isMobile ? "bottom" : "right"}
								sideOffset={4}
							>
								<Command>
									<CommandInput
										placeholder="Search organizations..."
										className="h-9"
									/>
									<CommandList className="max-h-[min(60vh,24rem)]">
										<CommandEmpty>No organizations found.</CommandEmpty>
										<CommandGroup heading="Organizations">
											{organizations?.map((org) => {
												const isDefault = org.members?.[0]?.isDefault ?? false;
												return (
													<CommandItem
														key={org.id}
														value={org.name}
														onSelect={async () => {
															setOrganizationSelectorOpen(false);
															await authClient.organization.setActive({
																organizationId: org.id,
															});
															window.location.reload();
														}}
														className="flex items-center justify-between gap-1"
													>
														<div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
															<div className="flex size-6 shrink-0 items-center justify-center rounded-sm border">
																<Logo
																	className={cn(
																		"transition-all",
																		state === "collapsed" ? "size-4" : "size-5",
																	)}
																	logoUrl={org.logo ?? undefined}
																/>
															</div>
															<div className="flex min-w-0 flex-1 flex-col items-start">
																<span className="w-full truncate">
																	{org.name}
																</span>
																{license &&
																	org.id === activeOrganization?.id && (
																		<LicenseBadge
																			license={license}
																			className="mt-0.5 max-w-full"
																		/>
																	)}
															</div>
														</div>

														<div
															className="flex shrink-0 items-center gap-2"
															onClick={(e) => e.stopPropagation()}
															onKeyDown={(e) => e.stopPropagation()}
														>
															<Button
																variant="ghost"
																size="icon"
																className={cn(
																	"group",
																	isDefault
																		? "hover:bg-yellow-500/10"
																		: "hover:bg-blue-500/10",
																)}
																isLoading={isSettingDefault && !isDefault}
																disabled={isDefault}
																onClick={async (e) => {
																	if (isDefault) return;
																	e.stopPropagation();
																	await setDefaultOrganization({
																		organizationId: org.id,
																	})
																		.then(() => {
																			refetch();
																			toast.success(
																				"Default organization updated",
																			);
																		})
																		.catch((error) => {
																			toast.error(
																				error?.message ||
																					"Error setting default organization",
																			);
																		});
																}}
																title={
																	isDefault
																		? "Default organization"
																		: "Set as default"
																}
															>
																{isDefault ? (
																	<Star
																		fill="#eab308"
																		stroke="#eab308"
																		className="size-4 text-yellow-500"
																	/>
																) : (
																	<Star
																		fill="none"
																		stroke="currentColor"
																		className="size-4 text-gray-400 group-hover:text-blue-500 transition-colors"
																	/>
																)}
															</Button>
															{org.ownerId === session?.user?.id && (
																<>
																	<AddOrganization organizationId={org.id} />
																	<DialogAction
																		title="Delete Organization"
																		description="Are you sure you want to delete this organization?"
																		type="destructive"
																		onClick={async () => {
																			await deleteOrganization({
																				organizationId: org.id,
																			})
																				.then(() => {
																					refetch();
																					toast.success(
																						"Organization deleted successfully",
																					);
																				})
																				.catch((error) => {
																					toast.error(
																						error?.message ||
																							"Error deleting organization",
																					);
																				});
																		}}
																	>
																		<Button
																			variant="ghost"
																			size="icon"
																			className="group hover:bg-red-500/10"
																			isLoading={isRemoving}
																		>
																			<Trash2 className="size-4 text-primary group-hover:text-red-500" />
																		</Button>
																	</DialogAction>
																</>
															)}
														</div>
													</CommandItem>
												);
											})}
										</CommandGroup>
									</CommandList>
									{/* Multi-organization creation belongs to Self-hosted and Cloud; the
									    Console stays on its single workspace. */}
									{!isConsole &&
										(user?.role === "owner" ||
											user?.role === "admin" ||
											isCloud) && (
											<div className="border-t p-1">
												<AddOrganization />
											</div>
										)}
								</Command>
							</PopoverContent>
						</Popover>
					</SidebarMenuItem>
				</SidebarMenu>
			)}
		</>
	);
}

function NotificationsButton() {
	const { data: eventData } = api.operationalEvent.list.useQuery(undefined, {
		refetchInterval: 30_000,
	});
	const { data: invitations, refetch: refetchInvitations } =
		api.user.getInvitations.useQuery();
	const { refetch } = api.organization.all.useQuery();
	const utils = api.useUtils();
	const acknowledgeEvent = api.operationalEvent.acknowledge.useMutation();
	const attentionCount =
		(eventData?.actionCount ?? 0) + (invitations?.length ?? 0);
	type OperationalEvent =
		RouterOutputs["operationalEvent"]["list"]["recent"][number];

	const eventIcon = (severity: OperationalEvent["severity"]) => {
		switch (severity) {
			case "critical":
				return <CircleAlert className="size-4 text-destructive" />;
			case "warning":
				return <TriangleAlert className="size-4 text-yellow-500" />;
			case "success":
				return <CircleCheck className="size-4 text-emerald-500" />;
			default:
				return <Info className="size-4 text-muted-foreground" />;
		}
	};

	const renderEvent = (event: OperationalEvent, actionable: boolean) => (
		<div
			key={event.eventId}
			className="flex items-start gap-3 rounded-lg border bg-background p-3"
		>
			<div className="mt-0.5 shrink-0">{eventIcon(event.severity)}</div>
			<div className="min-w-0 flex-1 space-y-1">
				<div className="flex flex-wrap items-center gap-1.5">
					<span className="font-medium">{event.title}</span>
					<Badge
						variant={
							event.severity === "critical"
								? "destructive"
								: event.severity === "warning"
									? "yellow"
									: event.severity === "success"
										? "green"
										: "secondary"
						}
					>
						{event.severity}
					</Badge>
				</div>
				<p className="text-xs text-muted-foreground">{event.message}</p>
				<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
					<span className="capitalize">{event.category.replace("-", " ")}</span>
					<span aria-hidden="true">·</span>
					<time dateTime={event.lastSeenAt}>
						{new Date(event.lastSeenAt).toLocaleString()}
					</time>
					{event.occurrenceCount > 1 && (
						<span>· {event.occurrenceCount} occurrences</span>
					)}
				</div>
				<div className="flex items-center gap-2 pt-1">
					{event.resourceHref && (
						<Button variant="link" size="xs" className="h-auto px-0" asChild>
							<Link href={event.resourceHref}>
								{event.resourceName ?? "Open resource"}
								<ExternalLink />
							</Link>
						</Button>
					)}
					{actionable && (
						<Button
							variant="ghost"
							size="xs"
							className="h-auto px-1.5 text-muted-foreground"
							disabled={acknowledgeEvent.isPending}
							onClick={async () => {
								try {
									await acknowledgeEvent.mutateAsync({
										eventId: event.eventId,
									});
									await utils.operationalEvent.list.invalidate();
								} catch {
									toast.error("Unable to acknowledge this event");
								}
							}}
						>
							<Check />
							Acknowledge
						</Button>
					)}
				</div>
			</div>
		</div>
	);

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="relative"
					aria-label={
						attentionCount > 0
							? `Notifications, ${attentionCount} require attention`
							: "Notifications"
					}
				>
					<Bell className="size-4" />
					{attentionCount > 0 && (
						<span className="absolute -top-0.5 -right-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
							{attentionCount > 99 ? "99+" : attentionCount}
						</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				side="bottom"
				className="w-[min(26rem,calc(100vw-2rem))] p-0"
			>
				<div className="flex items-center justify-between border-b px-4 py-3">
					<div>
						<div className="font-semibold">Event center</div>
						<div className="text-xs text-muted-foreground">
							Operational events and actions
						</div>
					</div>
					<Clock3 className="size-4 text-muted-foreground" />
				</div>
				<Tabs defaultValue="action-required" className="gap-0">
					<TabsList className="mx-3 mt-3 grid w-auto grid-cols-2">
						<TabsTrigger value="action-required">
							Action required
							{attentionCount > 0 && (
								<span className="rounded-full bg-destructive/10 px-1.5 text-[10px] text-destructive">
									{attentionCount}
								</span>
							)}
						</TabsTrigger>
						<TabsTrigger value="recent">Recent</TabsTrigger>
					</TabsList>
					<TabsContent value="action-required" className="mt-0">
						<ScrollArea className="h-[min(26rem,60vh)]">
							<div className="space-y-2 p-3">
								{invitations?.map((invitation) => (
									<div
										key={invitation.id}
										className="flex items-start gap-3 rounded-lg border bg-background p-3"
									>
										<CircleAlert className="mt-0.5 size-4 shrink-0 text-blue-500" />
										<div className="min-w-0 flex-1 space-y-1">
											<div className="font-medium">
												Invitation to {invitation.organization?.name}
											</div>
											<p className="text-xs text-muted-foreground">
												Role: {invitation.role} · Expires{" "}
												{new Date(invitation.expiresAt).toLocaleString()}
											</p>
											<DialogAction
												title="Accept Invitation"
												description="Are you sure you want to accept this invitation?"
												type="default"
												onClick={async () => {
													const { error } =
														await authClient.organization.acceptInvitation({
															invitationId: invitation.id,
														});

													if (error) {
														toast.error(
															error.message || "Error accepting invitation",
														);
													} else {
														toast.success("Invitation accepted successfully");
														await refetchInvitations();
														await refetch();
													}
												}}
											>
												<Button size="xs" variant="secondary" className="mt-1">
													Accept invitation
												</Button>
											</DialogAction>
										</div>
									</div>
								))}
								{eventData?.actionRequired.map((event) =>
									renderEvent(event, true),
								)}
								{attentionCount === 0 && (
									<div className="flex flex-col items-center gap-2 py-10 text-center">
										<CircleCheck className="size-6 text-emerald-500" />
										<p className="font-medium">All clear</p>
										<p className="text-xs text-muted-foreground">
											No actions need your attention.
										</p>
									</div>
								)}
							</div>
						</ScrollArea>
					</TabsContent>
					<TabsContent value="recent" className="mt-0">
						<ScrollArea className="h-[min(26rem,60vh)]">
							<div className="space-y-2 p-3">
								{eventData?.recent.map((event) => renderEvent(event, false))}
								{eventData?.recent.length === 0 && (
									<div className="py-10 text-center text-sm text-muted-foreground">
										No recent events in the last 14 days.
									</div>
								)}
							</div>
						</ScrollArea>
					</TabsContent>
				</Tabs>
				{eventData?.actionCount !== undefined && (
					<div className="border-t px-4 py-2 text-xs text-muted-foreground">
						{eventData.actionCount} operational{" "}
						{eventData.actionCount === 1 ? "issue" : "issues"} requiring
						attention
						{eventData.actionRequired.some(
							(event) => event.severity === "critical",
						) && (
							<span className="ml-1 font-medium text-destructive">
								· Critical issue
							</span>
						)}
					</div>
				)}
			</PopoverContent>
		</Popover>
	);
}

function MobileCloser() {
	const pathname = usePathname();
	const { setOpenMobile, isMobile } = useSidebar();

	useEffect(() => {
		if (isMobile) {
			setOpenMobile(false);
		}
	}, [pathname, isMobile, setOpenMobile]);

	return null;
}

export default function Page({ children }: Props) {
	const [defaultOpen, setDefaultOpen] = useState<boolean | undefined>(
		undefined,
	);
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		const cookieValue = document.cookie
			.split("; ")
			.find((row) => row.startsWith(`${SIDEBAR_COOKIE_NAME}=`))
			?.split("=")[1];

		setDefaultOpen(cookieValue === undefined ? true : cookieValue === "true");
		setIsLoaded(true);
	}, []);

	const pathname = usePathname();
	const router = useRouter();
	const { data: auth } = api.user.get.useQuery();
	const { data: permissions } = api.user.getPermissions.useQuery();
	const { data: notployVersion } = api.settings.getNotployVersion.useQuery();
	const { data: whitelabeling } = api.whitelabeling.get.useQuery(undefined, {
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
	});

	const { data: isCloud } = api.settings.isCloud.useQuery();
	const { data: product } = api.settings.getProduct.useQuery();
	const license = useWorkspaceLicense();

	// Cloud and Console both report `isCloud`, so only the product tells the two
	// operator surfaces apart. While the product is still loading, keep the
	// `isCloud` fallback so a cloud/console instance does not flash the
	// self-hosted layout before settling.
	const environment: NavigationEnvironment =
		product === "console"
			? "console"
			: product === "cloud" || (product === undefined && isCloud)
				? "cloud"
				: "self";

	const navigation = createNavigation({
		// Self-hosted exposes the infrastructure control plane, Cloud keeps its
		// deployment-centric menu, and Console — the internal operator surface —
		// gets its own four-pole tree.
		environment,
		auth,
		permissions,
		license,
		whitelabeling,
	});

	// Several entries share a page and only differ by `?tab=` (the Docker
	// resources, the overview tabs), so the tab is part of the location.
	const currentTab =
		typeof router.query.tab === "string" ? router.query.tab : undefined;

	const activeNavigation = findActiveNavigation(navigation, {
		pathname,
		tab: currentTab,
	});
	const activeSectionHref = activeNavigation
		? (activeNavigation.section.items[0]?.href ??
			activeNavigation.section.groups?.flatMap((group) => group.items)[0]
				?.href ??
			activeNavigation.item.href)
		: undefined;

	if (!isLoaded) {
		return <div className="w-full h-screen bg-background" />; // Placeholder mientras se carga
	}

	return (
		<SidebarProvider
			defaultOpen={defaultOpen}
			open={defaultOpen}
			onOpenChange={(open) => {
				setDefaultOpen(open);

				// biome-ignore lint/suspicious/noDocumentCookie: this sets the cookie to keep the sidebar state.
				document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}`;
			}}
			style={
				{
					"--sidebar-width": "19.5rem",
					"--sidebar-width-mobile": "19.5rem",
				} as React.CSSProperties
			}
		>
			<MobileCloser />
			<Sidebar collapsible="icon" variant="floating">
				<SidebarHeader>
					{/* <SidebarMenuButton
						className="group-data-[collapsible=icon]:p-0!"
						size="lg"
					> */}
					<LogoWrapper />
					{/* </SidebarMenuButton> */}
				</SidebarHeader>
				<SidebarContent>
					<SidebarNavigation
						navigation={navigation}
						pathname={pathname}
						currentTab={currentTab}
					/>
					{/* Links leaving the platform (docs, community). They carry an
					    outbound indicator so it is obvious they open in a new tab. */}
					<SidebarGroup className="group-data-[collapsible=icon]:hidden">
						<SidebarGroupLabel className="h-6 cursor-default px-2 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
							Resources
						</SidebarGroupLabel>
						<SidebarMenu className="gap-0.5">
							{navigation.external.map((item) => (
								<SidebarMenuItem key={item.label}>
									<SidebarMenuButton asChild tooltip={item.label}>
										<a
											href={item.href}
											target="_blank"
											rel="noopener noreferrer"
											className="group/external flex w-full items-center gap-2"
										>
											<item.icon
												aria-hidden
												className="size-4 shrink-0 text-muted-foreground"
											/>
											<span className="truncate">{item.label}</span>
											<ArrowUpRight
												aria-hidden
												className="ml-auto size-3.5 shrink-0 text-muted-foreground/60 transition-colors group-hover/external:text-primary"
											/>
										</a>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroup>
				</SidebarContent>{" "}
				<SidebarFooter>
					<SidebarMenu className="flex flex-col gap-2">
						{!isCloud && permissions?.organization.update && (
							<SidebarMenuItem>
								<UpdateServerButton />
							</SidebarMenuItem>
						)}
						<SidebarMenuItem>
							<UserNav environment={environment} />
						</SidebarMenuItem>
						{whitelabeling?.footerText && (
							<div className="px-3 text-xs text-muted-foreground text-center group-data-[collapsible=icon]:hidden">
								{whitelabeling.footerText}
							</div>
						)}
						{/* Cloud surfaces its own product version elsewhere, so the
						    self-hosted build tag is hidden under the account block. */}
						{!isCloud && notployVersion && (
							<div className="px-3 text-xs text-muted-foreground text-center group-data-[collapsible=icon]:hidden">
								Version {notployVersion}
							</div>
						)}
					</SidebarMenu>
				</SidebarFooter>
				<SidebarRail />
			</Sidebar>
			<SidebarInset>
				<div className="z-30 shrink-0 bg-background">
					{isCloud === true && <TrialBanner />}
					{/* The header is the constant part of the shell: the sidebar toggle
					    and the {section} > {page} breadcrumb. The project, environment
					    and service context lives inside the pages themselves. */}
					<header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
						<div className="flex w-full min-w-0 items-center gap-3 px-4">
							<div className="flex min-w-0 flex-1 items-center gap-2">
								<SidebarTrigger className="-ml-1 shrink-0" />
								<Separator
									orientation="vertical"
									className="mx-1 h-4 self-center"
								/>
								<Breadcrumb className="min-w-0">
									<BreadcrumbList className="flex-nowrap">
										{activeNavigation && (
											<>
												<BreadcrumbItem>
													<BreadcrumbLink asChild>
														<Link
															href={
																activeSectionHref ?? activeNavigation.item.href
															}
															className="flex items-center gap-1.5 whitespace-nowrap"
														>
															{activeNavigation.section.label}
														</Link>
													</BreadcrumbLink>
												</BreadcrumbItem>
												<BreadcrumbSeparator />
												<BreadcrumbItem className="min-w-0">
													<span aria-current="page" className="truncate">
														{activeNavigation.item.label}
													</span>
												</BreadcrumbItem>
											</>
										)}
									</BreadcrumbList>
								</Breadcrumb>{" "}
							</div>
							<div className="flex shrink-0 items-center gap-1">
								<TimeBadge />
								<NotificationsButton />
								<Button variant="ghost" size="icon" asChild>
									<Link
										href="https://github.com/skygenesisenterprise/notploy"
										target="_blank"
										rel="noopener noreferrer"
										aria-label="Notploy on GitHub"
									>
										<GithubIcon className="size-4" />
									</Link>
								</Button>
							</div>
						</div>
					</header>
				</div>

				<div className="min-h-0 flex-1 overflow-y-auto">
					<div className="flex w-full flex-col p-4 pt-0">{children}</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
