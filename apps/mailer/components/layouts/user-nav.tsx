import { LogOut, Moon, Sun, User } from "lucide-react";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { cn, getFallbackAvatarInitials } from "@/lib/utils";
import { api } from "@/utils/api";
import { SidebarMenuButton } from "../ui/sidebar";
import type { NavigationEnvironment } from "./navigation";

const _AUTO_CHECK_UPDATES_INTERVAL_MINUTES = 7;

/**
 * Personal space of the signed in user.
 *
 * This menu only carries what belongs to *the user* (identity, profile,
 * appearance, sign out). Platform areas (workloads, infrastructure,
 * organization) are owned by the sidebar sections, so they are not duplicated
 * here: two places to look for the same page is how a navigation stops being
 * trustworthy.
 */
export const UserNav = ({
	environment,
}: {
	environment?: NavigationEnvironment;
}) => {
	const router = useRouter();
	const { data } = api.user.get.useQuery();
	const { theme, setTheme } = useTheme();

	const user = data?.user;
	const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
	const displayName = fullName || user?.email || "Account";

	const toggleTheme = () => {
		setTheme(theme === "dark" ? "light" : "dark");
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<SidebarMenuButton
					size="lg"
					className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
				>
					<Avatar className="h-8 w-8 rounded-lg">
						<AvatarImage
							className="object-cover"
							src={user?.image || ""}
							alt={user?.image || ""}
						/>
						<AvatarFallback className="rounded-lg">
							{getFallbackAvatarInitials(fullName)}
						</AvatarFallback>
					</Avatar>
					<div className="grid flex-1 text-left text-sm leading-tight">
						<span className="truncate font-semibold">{displayName}</span>
						<span className="truncate text-xs text-muted-foreground">
							{user?.email}
						</span>
					</div>
				</SidebarMenuButton>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-lg"
				side="bottom"
				align="end"
				sideOffset={4}
			>
				<div className="flex items-center gap-3 px-2 py-2">
					<Avatar className="size-9 shrink-0 rounded-lg">
						<AvatarImage
							className="object-cover"
							src={user?.image || ""}
							alt={user?.image || ""}
						/>
						<AvatarFallback className="rounded-lg">
							{getFallbackAvatarInitials(fullName)}
						</AvatarFallback>
					</Avatar>
					<div className="flex min-w-0 flex-col">
						<span className="truncate text-sm font-medium">{displayName}</span>
						<span className="truncate text-xs text-muted-foreground">
							{user?.email}
						</span>
					</div>
					{data?.role && (
						<span className="ml-auto shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
							{data.role}
						</span>
					)}
				</div>
				<DropdownMenuSeparator />
				<DropdownMenuLabel className="px-2 py-1 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
					Account
				</DropdownMenuLabel>
				{/* Self-hosted keeps Profile here: its Organization pole exposes the
				    member pages, and the signed-in user has nowhere else to edit their
				    own account. Cloud surfaces Profile in its Settings section. */}
				{environment === "self" && (
					<DropdownMenuItem
						className="cursor-pointer gap-2"
						onSelect={() => router.push("/dashboard/settings/profile")}
					>
						<User className="size-4 text-muted-foreground" />
						Profile
					</DropdownMenuItem>
				)}
				<DropdownMenuItem
					className="cursor-pointer gap-2"
					onSelect={(event) => {
						// Keep the menu open: this toggles a preference, it navigates
						// nowhere, and closing it would look like the click failed.
						event.preventDefault();
						toggleTheme();
					}}
				>
					{theme === "dark" ? (
						<Sun className="size-4 text-muted-foreground" />
					) : (
						<Moon className="size-4 text-muted-foreground" />
					)}
					Appearance
					<span className="ml-auto text-xs text-muted-foreground capitalize">
						{theme === "dark" ? "Dark" : "Light"}
					</span>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className={cn(
						"cursor-pointer gap-2",
						"text-destructive focus:bg-destructive/10 focus:text-destructive [&_svg]:text-destructive",
					)}
					onSelect={async () => {
						await authClient.signOut();
						router.push("/");
					}}
				>
					<LogOut className="size-4" />
					Log out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
