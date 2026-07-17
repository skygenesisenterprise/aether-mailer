"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Activity,
  BarChart3,
  Bug,
  ChevronRight,
  Clock,
  Cpu,
  FileBarChart,
  FileKey,
  FileText,
  Globe,
  HardDrive,
  HeartPulse,
  History,
  Inbox,
  KeyRound,
  Link2,
  ListChecks,
  Lock,
  Mail,
  MailWarning,
  Network,
  ScrollText,
  Send,
  Server,
  ServerCog,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

// ---------- Types ----------

type SectionId = "manage" | "monitoring" | "settings";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface SectionConfig {
  id: SectionId;
  label: string;
  icon: LucideIcon;
  /** Landing route for the section switcher, or null when disabled. */
  rootHref: string | null;
  enabled: boolean;
  groups: NavGroup[];
}

// ---------- Helpers ----------

/**
 * Detect the active section by the first path segment only, so that
 * `/manage/dash/overview` always lights "manage" and never "monitoring"
 * or "settings" via accidental substring overlap.
 */
function getActiveSection(pathname: string): SectionId {
  const segment = pathname.split("/")[1];
  if (segment === "monitoring") return "monitoring";
  if (segment === "settings") return "settings";
  return "manage";
}

function isItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

// ---------- Navigation data ----------

const sections: SectionConfig[] = [
  {
    id: "manage",
    label: "Gestion",
    icon: Users,
    rootHref: "/manage/dash/overview",
    enabled: true,
    groups: [
      {
        label: "Dashboard",
        items: [
          { label: "Overview",    href: "/manage/dash/overview",     icon: Sparkles },
          { label: "Delivery",    href: "/manage/dash/delivery",     icon: Send },
          { label: "Performance", href: "/manage/dash/performance",  icon: TrendingUp },
          { label: "Network",     href: "/manage/dash/network",      icon: Network },
          { label: "Security",    href: "/manage/dash/security",     icon: ShieldAlert },
        ],
      },
      {
        label: "Directory",
        items: [
          { label: "Domains",       href: "/manage/directory/domains",  icon: Globe },
          { label: "Accounts",      href: "/manage/directory/accounts", icon: Users },
          { label: "Groups",        href: "/manage/directory/groups",   icon: UserCog },
          { label: "Roles",         href: "/manage/directory/roles",    icon: ShieldCheck },
          { label: "API & Tokens",  href: "/manage/directory/apis",     icon: FileKey },
          { label: "OAuth",         href: "/manage/directory/oauth",    icon: KeyRound },
          { label: "All Directory", href: "/manage/directory/list",     icon: ListChecks },
        ],
      },
      {
        label: "History",
        items: [
          { label: "Received Messages", href: "/manage/history/received", icon: Inbox },
          { label: "Delivery History", href: "/manage/history/delivery",  icon: History },
        ],
      },
      {
        label: "Reports",
        items: [
          { label: "DMARC",            href: "/manage/reports/dmarc", icon: BarChart3 },
          { label: "TLS",              href: "/manage/reports/tls",   icon: Lock },
          { label: "ARF",              href: "/manage/reports/arf",   icon: FileBarChart },
        ],
      },
    ],
  },
  {
    id: "monitoring",
    label: "Monitoring",
    icon: Activity,
    rootHref: "/monitoring/overview",
    enabled: true,
    groups: [
      {
        label: "Vue d'ensemble",
        items: [
          { label: "Tableau de bord", href: "/monitoring/overview", icon: BarChart3 },
        ],
      },
      {
        label: "Diagnostics",
        items: [
          { label: "Santé",      href: "/monitoring/diagnostics/health",      icon: HeartPulse },
          { label: "Système",    href: "/monitoring/diagnostics/system",      icon: Cpu },
          { label: "File SMTP",  href: "/monitoring/diagnostics/queue",       icon: Clock },
          { label: "Connexions", href: "/monitoring/diagnostics/connections", icon: Link2 },
        ],
      },
      {
        label: "Événements",
        items: [
          { label: "Messagerie",       href: "/monitoring/events/mail",     icon: Mail },
          { label: "Authentification", href: "/monitoring/events/auth",     icon: KeyRound },
          { label: "Sécurité",          href: "/monitoring/events/security", icon: ShieldAlert },
          { label: "Système",           href: "/monitoring/events/system",   icon: ServerCog },
        ],
      },
      {
        label: "Métriques",
        items: [
          { label: "SMTP",     href: "/monitoring/metrics/smtp",    icon: Send },
          { label: "IMAP",     href: "/monitoring/metrics/imap",    icon: Inbox },
          { label: "JMAP",     href: "/monitoring/metrics/jmap",    icon: FileText },
          { label: "Stockage", href: "/monitoring/metrics/storage", icon: HardDrive },
          { label: "Système",  href: "/monitoring/metrics/system",  icon: BarChart3 },
        ],
      },
      {
        label: "Journaux",
        items: [
          { label: "Serveur",          href: "/monitoring/logs/server",   icon: Server },
          { label: "SMTP",             href: "/monitoring/logs/smtp",     icon: Send },
          { label: "Authentification", href: "/monitoring/logs/auth",     icon: KeyRound },
          { label: "Sécurité",         href: "/monitoring/logs/security", icon: ShieldAlert },
          { label: "Audit",            href: "/monitoring/logs/audit",    icon: ScrollText },
        ],
      },
      {
        label: "Rapports",
        items: [
          { label: "DMARC", href: "/monitoring/reports/dmarc", icon: ShieldAlert },
          { label: "TLS",   href: "/monitoring/reports/tls",   icon: Lock },
          { label: "ARF",   href: "/monitoring/reports/arf",   icon: FileBarChart },
        ],
      },
    ],
  },
  {
    id: "settings",
    label: "Configuration",
    icon: Settings,
    rootHref: null,
    enabled: false,
    groups: [],
  },
];

// ---------- Components ----------

function GroupHeaderLabel({
  label,
  open,
  onToggle,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <SidebarMenuButton
      asChild
      tooltip={label}
      className="cursor-pointer"
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
        className="flex w-full items-center justify-between"
      >
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        <motion.div
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="size-3.5"
        >
          <ChevronRight className="size-3.5" />
        </motion.div>
      </button>
    </SidebarMenuButton>
  );
}

function NavGroupBlock({
  group,
  pathname,
  delay = 0,
}: {
  group: NavGroup;
  pathname: string;
  delay?: number;
}) {
  const [open, setOpen] = React.useState(false);
  const hasActiveChild = group.items.some((item) =>
    isItemActive(pathname, item.href),
  );

  React.useEffect(() => {
    if (hasActiveChild) setOpen(true);
  }, [hasActiveChild]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay, ease: [0.22, 1, 0.36, 1] as const }}
    >
      <SidebarMenuItem>
        <GroupHeaderLabel
          label={group.label}
          open={open}
          onToggle={() => setOpen(!open)}
        />
      </SidebarMenuItem>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <SidebarMenuSub>
              {group.items.map((item) => {
                const active = isItemActive(pathname, item.href);
                return (
                  <SidebarMenuSubItem key={item.href}>
                    <SidebarMenuSubButton asChild isActive={active}>
                      <Link
                        href={item.href}
                        className="flex items-center justify-between w-full"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <item.icon
                            className={cn(
                              "size-3.5 shrink-0",
                              active && "text-primary",
                            )}
                          />
                          <span
                            className={cn(
                              "truncate",
                              active && "font-medium text-primary",
                            )}
                          >
                            {item.label}
                          </span>
                        </div>
                        {item.badge && (
                          <span
                            className={cn(
                              "ml-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[10px] tabular-nums",
                              active
                                ? "bg-primary/20 text-primary"
                                : "bg-white/4 text-muted-foreground",
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SidebarLogo() {
  return (
    <SidebarHeader className="border-b px-4 py-3">
      <Link
        href="/manage/dash/overview"
        className="flex items-center gap-2.5"
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Shield className="size-4 text-primary" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">
            Aether Mailer
          </span>
          <span className="text-[10px] text-muted-foreground">
            Administration
          </span>
        </div>
      </Link>
    </SidebarHeader>
  );
}

function SectionEyebrow({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] as const }}
    >
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={label}
          className="cursor-default"
        >
          <div className="flex w-full items-center gap-2">
            <Icon className="size-3.5 text-muted-foreground" />
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
              {label}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </motion.div>
  );
}

function SectionEmptyState() {
  return (
    <SidebarContent>
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="rounded-xl border border-white/5 bg-white/2 p-6 backdrop-blur-md">
          <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-white/4">
            <Settings className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-zinc-100">
            Configuration serveur
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
            Cette section arrive bientôt. Les paramètres SMTP, HTTP,
            authentification et stockage seront accessibles depuis cet
            espace.
          </p>
        </div>
      </div>
    </SidebarContent>
  );
}

function SidebarNavigation({ pathname }: { pathname: string }) {
  const activeSection = sections.find((s) => s.id === getActiveSection(pathname));

  if (!activeSection || !activeSection.enabled) {
    return <SectionEmptyState />;
  }

  return (
    <SidebarContent>
      <SidebarMenu>
        <SectionEyebrow icon={activeSection.icon} label={activeSection.label} />
        {activeSection.groups.map((group, i) => (
          <NavGroupBlock
            key={group.label}
            group={group}
            pathname={pathname}
            delay={0.05 * (i + 1)}
          />
        ))}
      </SidebarMenu>
    </SidebarContent>
  );
}

function SectionFooterButton({ section, active }: {
  section: SectionConfig;
  active: boolean;
}) {
  if (!section.rootHref) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            aria-disabled
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-md opacity-50",
              "border border-transparent cursor-not-allowed",
            )}
          >
            <section.icon className="size-4 text-muted-foreground" />
            <span className="sr-only">
              {section.label} (bientôt disponible)
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          {section.label} — bientôt disponible
        </TooltipContent>
      </Tooltip>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={section.rootHref}
          aria-current={active ? "page" : undefined}
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            active && "bg-sidebar-accent text-sidebar-accent-foreground",
          )}
        >
          <section.icon className="size-4" />
          <span className="sr-only">{section.label}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="top">{section.label}</TooltipContent>
    </Tooltip>
  );
}

function SectionFooter({ pathname }: { pathname: string }) {
  const activeSectionId = getActiveSection(pathname);
  const { isMobile, setOpenMobile } = useSidebar();

  const handleNav = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <SidebarFooter>
      <SidebarSeparator />
      <TooltipProvider delayDuration={0}>
        <div className="flex items-center justify-around px-2 py-2">
          {sections.map((section) => (
            <div
              key={section.id}
              onClickCapture={section.rootHref ? handleNav : undefined}
            >
              <SectionFooterButton
                section={section}
                active={section.id === activeSectionId}
              />
            </div>
          ))}
        </div>
      </TooltipProvider>
    </SidebarFooter>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="offcanvas" side="left" variant="sidebar">
      <SidebarLogo />
      <SidebarNavigation pathname={pathname} />
      <SectionFooter pathname={pathname} />
    </Sidebar>
  );
}
