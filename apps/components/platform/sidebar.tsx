"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Mail,
  Shield,
  Activity,
  BarChart3,
  History,
  Settings,
  Users,
  User,
  Key,
  Lock,
  Fingerprint,
  AlertTriangle,
  Gauge,
  Send,
  Clock,
  Search,
  XCircle,
  FileText,
  ChevronRight,
  Building2,
  Contact,
  ListFilter,
  ShieldCheck,
  Train,
  TrendingUp,
  Terminal,
  ScrollText,
  Globe,
  Wrench,
  Info,
  BookKey,
} from "lucide-react";
import { GitHubIcon } from "@/components/ui/icons/GitHubIcon";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  items?: NavItem[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Overview",
    href: "/dashboard/overview",
    icon: Gauge,
  },
  {
    title: "Directory",
    href: "/dashboard/directory/accounts",
    icon: Users,
    items: [
      { title: "Accounts", href: "/dashboard/directory/accounts", icon: User },
      { title: "Domains", href: "/dashboard/directory/domains", icon: Globe },
      { title: "Groups", href: "/dashboard/directory/groups", icon: ListFilter },
      { title: "Roles", href: "/dashboard/directory/roles", icon: Shield },
      { title: "Lists", href: "/dashboard/directory/lists", icon: Contact },
      { title: "Tenants", href: "/dashboard/directory/tenants", icon: Building2 },
      { title: "OAuth Clients", href: "/dashboard/directory/oauth-clients", icon: Key },
      { title: "API Keys", href: "/dashboard/directory/api-keys", icon: BookKey },
    ],
  },
  {
    title: "History",
    href: "/dashboard/history/delivery",
    icon: History,
    items: [
      { title: "Sent Emails", href: "/dashboard/history/delivery", icon: Send },
      { title: "Received Emails", href: "/dashboard/history/received", icon: Mail },
    ],
  },
  {
    title: "Queues",
    href: "/dashboard/queues/messages",
    icon: Clock,
    items: [
      { title: "Messages", href: "/dashboard/queues/messages", icon: Mail },
      { title: "Reports", href: "/dashboard/queues/reports", icon: FileText },
    ],
  },
  {
    title: "Reports",
    href: "/dashboard/reports/dmarc",
    icon: BarChart3,
    items: [
      { title: "DMARC", href: "/dashboard/reports/dmarc", icon: ShieldCheck },
      { title: "TLS", href: "/dashboard/reports/tls", icon: Lock },
      { title: "ARF", href: "/dashboard/reports/arf", icon: FileText },
    ],
  },
  {
    title: "Performance",
    href: "/dashboard/performance",
    icon: TrendingUp,
  },
  {
    title: "Security",
    href: "/dashboard/security",
    icon: Shield,
  },
  {
    title: "Spam",
    href: "/dashboard/spam/test",
    icon: AlertTriangle,
    items: [
      { title: "Test Email", href: "/dashboard/spam/test", icon: Send },
      { title: "Train Model", href: "/dashboard/spam/train", icon: Train },
    ],
  },
  {
    title: "Network",
    href: "/dashboard/network",
    icon: Globe,
  },
  {
    title: "Manage",
    href: "/dashboard/manage/logs",
    icon: Wrench,
    items: [
      { title: "Logs", href: "/dashboard/manage/logs", icon: ScrollText },
      { title: "Live Tracing", href: "/dashboard/manage/tracing/live", icon: Activity },
    ],
  },
  {
    title: "Troubleshoot",
    href: "/dashboard/troubleshoot/delivery",
    icon: Search,
    items: [
      { title: "Delivery Issues", href: "/dashboard/troubleshoot/delivery", icon: XCircle },
      { title: "DMARC", href: "/dashboard/troubleshoot/dmarc", icon: ShieldCheck },
    ],
  },
  {
    title: "Account",
    href: "/dashboard/account/password",
    icon: User,
    items: [
      { title: "Password", href: "/dashboard/account/password", icon: Lock },
      { title: "MFA", href: "/dashboard/account/mfa", icon: Fingerprint },
      { title: "App Passwords", href: "/dashboard/account/app-passwords", icon: Key },
      { title: "Crypto Keys", href: "/dashboard/account/crypto", icon: Terminal },
    ],
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="py-4">
        <Link href="/dashboard" className="flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Mail className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Aether Mailer</span>
            <span className="text-xs text-muted-foreground">Sky Genesis Enterprise</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                {item.items && item.items.length > 0 ? (
                  <CollapsibleMenuItem item={item} pathname={pathname} />
                ) : (
                  <SidebarMenuButton asChild isActive={isActiveGroup(pathname, item.href)}>
                    <Link href={item.href} className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <item.icon
                          className={cn("h-4 w-4", isActive(pathname, item.href) && "text-primary")}
                        />
                        <span
                          className={cn(
                            isActive(pathname, item.href) && "font-medium text-primary"
                          )}
                        >
                          {item.title}
                        </span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5" />
            <span>Aether Mailer v0.1.0</span>
          </div>
          <a
            href="https://github.com/skygenesisenterprise/aether-mailer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <GitHubIcon className="h-4 w-4" />
            <span className="sr-only">GitHub</span>
          </a>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function CollapsibleMenuItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const isGroupActive = isActiveGroup(pathname, item.href);
  const [isOpen, setIsOpen] = React.useState(false);

  const hasActiveChild = React.useMemo(() => {
    if (!item.items) return false;
    return item.items.some((subItem) => isActive(pathname, subItem.href));
  }, [item.items, pathname]);

  React.useEffect(() => {
    if (isGroupActive || hasActiveChild) {
      setIsOpen(true);
    }
  }, [isGroupActive, hasActiveChild]);

  const hasSubItems = item.items && item.items.length > 0;

  return (
    <>
      {hasSubItems ? (
        <SidebarMenuButton asChild isActive={isGroupActive}>
          <button
            type="button"
            className="flex w-full items-center justify-between"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
          >
            <div className="flex items-center gap-2">
              <item.icon className={cn("h-4 w-4", isGroupActive && "text-primary")} />
              <span className={cn(isGroupActive && "font-medium text-primary")}>{item.title}</span>
            </div>
            <motion.div
              animate={{ rotate: isOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="h-4 w-4"
            >
              <ChevronRight className="h-4 w-4" />
            </motion.div>
          </button>
        </SidebarMenuButton>
      ) : (
        <SidebarMenuButton asChild isActive={isGroupActive}>
          <Link href={item.href} className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <item.icon
                className={cn("h-4 w-4", isActive(pathname, item.href) && "text-primary")}
              />
              <span className={cn(isActive(pathname, item.href) && "font-medium text-primary")}>
                {item.title}
              </span>
            </div>
            {item.badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                {item.badge}
              </span>
            )}
          </Link>
        </SidebarMenuButton>
      )}
      <AnimatePresence>
        {isOpen && item.items && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <SidebarMenuSub>
              {item.items.map((subItem) => (
                <SidebarMenuSubItem key={subItem.href}>
                  <SidebarMenuSubButton asChild isActive={isActive(pathname, subItem.href)}>
                    <Link href={subItem.href} className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <subItem.icon
                          className={cn(
                            "h-4 w-4",
                            isActive(pathname, subItem.href) && "text-primary"
                          )}
                        />
                        <span
                          className={cn(
                            isActive(pathname, subItem.href) && "text-primary font-medium"
                          )}
                        >
                          {subItem.title}
                        </span>
                      </div>
                      {subItem.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                          {subItem.badge}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href;
}

function isActiveGroup(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  if (href === "/dashboard/history") {
    return pathname === "/dashboard/history/delivery" || pathname === "/dashboard/history/received";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}