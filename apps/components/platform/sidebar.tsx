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
  Shield,
  Settings,
  Activity,
  ChevronRight,
  Users,
  UserCog,
  ShieldCheck,
  Globe,
  Building2,
  Mail,
  KeyRound,
  ShieldAlert,
  Bug,
  UserX,
  Network,
  Inbox,
  Send,
  FileText,
  Server,
  HardDrive,
  Database,
  Search,
  Lock,
  FileKey,
  Filter,
  Clock,
  ScrollText,
  BarChart3,
  HeartPulse,
  Cpu,
  Link2,
  MailWarning,
  Fingerprint,
  ServerCog,
  FileBarChart,
  ShieldAlert as DmarcIcon,
  Layers,
  type LucideIcon,
} from "lucide-react";

type SectionId = "management" | "config" | "monitoring";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavContainer {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

type NavEntry = NavItem | NavContainer;

function isContainer(entry: NavEntry): entry is NavContainer {
  return "items" in entry;
}

const sections: {
  id: SectionId;
  label: string;
  icon: LucideIcon;
  groups: { label: string; items: NavEntry[] }[];
}[] = [
  {
    id: "management",
    label: "Gestion",
    icon: Users,
    groups: [
      {
        label: "Comptes",
        items: [
          { label: "Utilisateurs", href: "/dash/management/accounts/users", icon: Users },
          { label: "Créer un compte", href: "/dash/management/accounts/create", icon: UserCog },
          { label: "Alias", href: "/dash/management/accounts/aliases", icon: Mail },
          { label: "Mots de passe", href: "/dash/management/accounts/password", icon: KeyRound },
          { label: "Quotas", href: "/dash/management/accounts/quotas", icon: HardDrive },
        ],
      },
      {
        label: "Rôles & Permissions",
        items: [
          { label: "Rôles", href: "/dash/management/roles/list", icon: ShieldCheck },
          { label: "Permissions", href: "/dash/management/roles/perms", icon: Lock },
          { label: "Politiques d'accès", href: "/dash/management/roles/access-policies", icon: Shield },
        ],
      },
      {
        label: "Groupes",
        items: [
          { label: "Liste des groupes", href: "/dash/management/groups/list", icon: Users },
          { label: "Membres", href: "/dash/management/groups/members", icon: UserCog },
          { label: "Permissions", href: "/dash/management/groups/perms", icon: Lock },
        ],
      },
      {
        label: "Domaines",
        items: [
          { label: "Liste des domaines", href: "/dash/management/domains/list", icon: Globe },
          { label: "Créer un domaine", href: "/dash/management/domains/create", icon: Globe },
          { label: "Configuration DNS", href: "/dash/management/domains/dns-config", icon: Network },
          { label: "DKIM", href: "/dash/management/domains/dkim", icon: FileKey },
          { label: "DMARC", href: "/dash/management/domains/dmarc", icon: ShieldAlert },
          { label: "SPF", href: "/dash/management/domains/spf", icon: Shield },
        ],
      },
      {
        label: "Locataires",
        items: [
          { label: "Liste des locataires", href: "/dash/management/tenants/list", icon: Building2 },
          { label: "Limites", href: "/dash/management/tenants/limits", icon: HardDrive },
          { label: "Règles", href: "/dash/management/tenants/rules", icon: ScrollText },
          { label: "Organisations", href: "/dash/management/tenants/organizations", icon: Building2 },
        ],
      },
      {
        label: "Listes de diffusion",
        items: [
          { label: "Listes", href: "/dash/management/mailing-lists/list", icon: Mail },
          { label: "Abonnés", href: "/dash/management/mailing-lists/subscribers", icon: Users },
          { label: "Modération", href: "/dash/management/mailing-lists/moderations", icon: ShieldCheck },
        ],
      },
    ],
  },
  {
    id: "config",
    label: "Configuration",
    icon: Settings,
    groups: [
      {
        label: "Authentification",
        items: [
          { label: "LDAP", href: "/dash/config/auth/ldap", icon: ServerCog },
          { label: "OpenID Connect", href: "/dash/config/auth/oidc", icon: KeyRound },
          { label: "Fournisseurs", href: "/dash/config/auth/providers", icon: Globe },
          { label: "MFA", href: "/dash/config/auth/mfa", icon: ShieldCheck },
          { label: "Mots de passe applicatifs", href: "/dash/config/auth/app-passwords", icon: FileKey },
          { label: "SQL", href: "/dash/config/auth/sql", icon: Database },
        ],
      },
      {
        label: "Sécurité",
        items: [
          { label: "Anti-spam", href: "/dash/config/security/spam", icon: MailWarning },
          { label: "Limitation de débit", href: "/dash/config/security/rate-limits", icon: Activity },
          { label: "Antivirus", href: "/dash/config/security/virus", icon: Bug },
          { label: "Abus", href: "/dash/config/security/abuse", icon: UserX },
          { label: "Contrôle d'accès", href: "/dash/config/security/access-control", icon: Shield },
        ],
      },
      {
        label: "Réseau",
        items: [
          { label: "IMAP", href: "/dash/config/network/imap", icon: Inbox },
          { label: "SMTP", href: "/dash/config/network/smtp", icon: Send },
          { label: "JMAP", href: "/dash/config/network/jmap", icon: FileText },
          { label: "HTTP", href: "/dash/config/network/http", icon: Globe },
          { label: "Écouteurs", href: "/dash/config/network/listeners", icon: Network },
          { label: "WebDAV", href: "/dash/config/network/webdav", icon: Database },
        ],
      },
      {
        label: "SMTP",
        items: [
          { label: "File d'attente", href: "/dash/config/smtp/queue", icon: Clock },
          {
            label: "Entrant",
            href: "/dash/config/smtp/incoming/receiving",
            icon: Inbox,
          },
          {
            label: "Sortant",
            href: "/dash/config/smtp/outgoing/relay",
            icon: Send,
          },
        ],
      },
      {
        label: "Stockage",
        items: [
          { label: "Cache", href: "/dash/config/storage/cache", icon: HardDrive },
          { label: "Recherche", href: "/dash/config/storage/search", icon: Search },
          { label: "Blob", href: "/dash/config/storage/blob", icon: Database },
          { label: "Magasin", href: "/dash/config/storage/store", icon: Server },
        ],
      },
      {
        label: "Serveur",
        items: [
          { label: "Vue d'ensemble", href: "/dash/config/server/overview", icon: Server },
          { label: "Nom d'hôte", href: "/dash/config/server/hostname", icon: Globe },
          { label: "Identité", href: "/dash/config/server/identity", icon: Fingerprint },
          { label: "Paramètres", href: "/dash/config/server/system-settings", icon: Settings },
        ],
      },
      {
        label: "TLS",
        items: [
          { label: "Chiffrement", href: "/dash/config/tls/encryption", icon: Lock },
          { label: "Certificats", href: "/dash/config/tls/certs", icon: FileKey },
          { label: "ACME", href: "/dash/config/tls/acme", icon: ShieldCheck },
        ],
      },
      {
        label: "Politiques",
        items: [
          { label: "Filtrage", href: "/dash/config/policies/filtering", icon: Filter },
          { label: "Règles", href: "/dash/config/policies/rules", icon: ScrollText },
          { label: "Rétention", href: "/dash/config/policies/retention", icon: Clock },
          { label: "Conformité", href: "/dash/config/policies/compliance", icon: ShieldCheck },
        ],
      },
    ],
  },
  {
    id: "monitoring",
    label: "Monitoring",
    icon: Activity,
    groups: [
      {
        label: "Événements",
        items: [
          { label: "Messagerie", href: "/dash/monitoring/events/mail", icon: Mail },
          { label: "Authentification", href: "/dash/monitoring/events/auth", icon: KeyRound },
          { label: "Sécurité", href: "/dash/monitoring/events/security", icon: ShieldAlert },
          { label: "Système", href: "/dash/monitoring/events/system", icon: ServerCog },
        ],
      },
      {
        label: "Diagnostics",
        items: [
          { label: "Santé", href: "/dash/monitoring/diagnostics/health", icon: HeartPulse },
          { label: "Système", href: "/dash/monitoring/diagnostics/system", icon: Cpu },
          { label: "File d'attente", href: "/dash/monitoring/diagnostics/queue", icon: Clock },
          { label: "Connexions", href: "/dash/monitoring/diagnostics/connections", icon: Link2 },
        ],
      },
      {
        label: "Métriques",
        items: [
          { label: "IMAP", href: "/dash/monitoring/metrics/imap", icon: Inbox },
          { label: "JMAP", href: "/dash/monitoring/metrics/jmap", icon: FileText },
          { label: "SMTP", href: "/dash/monitoring/metrics/smtp", icon: Send },
          { label: "Stockage", href: "/dash/monitoring/metrics/storage", icon: HardDrive },
          { label: "Système", href: "/dash/monitoring/metrics/system", icon: BarChart3 },
        ],
      },
      {
        label: "Journaux",
        items: [
          { label: "Serveur", href: "/dash/monitoring/logs/server", icon: Server },
          { label: "Sécurité", href: "/dash/monitoring/logs/security", icon: ShieldAlert },
          { label: "SMTP", href: "/dash/monitoring/logs/smtp", icon: Send },
          { label: "Authentification", href: "/dash/monitoring/logs/auth", icon: KeyRound },
          { label: "Audit", href: "/dash/monitoring/logs/audit", icon: ScrollText },
        ],
      },
      {
        label: "Rapports",
        items: [
          { label: "DMARC", href: "/dash/monitoring/reports/dmarc", icon: DmarcIcon },
          { label: "TLS", href: "/dash/monitoring/reports/tls", icon: Lock },
          { label: "ARF", href: "/dash/monitoring/reports/arf", icon: FileBarChart },
        ],
      },
    ],
  },
];

function getActiveSection(pathname: string): SectionId {
  if (pathname.includes("/dash/config")) return "config";
  if (pathname.includes("/dash/monitoring")) return "monitoring";
  return "management";
}

function isItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

function NavContainerItem({
  container,
  pathname,
}: {
  container: NavContainer;
  pathname: string;
}) {
  const hasActiveChild = container.items.some((item) =>
    isItemActive(pathname, item.href),
  );
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (hasActiveChild) setOpen(true);
  }, [hasActiveChild]);

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={container.label}
          className="cursor-pointer"
          isActive={hasActiveChild}
        >
          <button
            type="button"
            className="flex w-full items-center justify-between"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(!open);
            }}
          >
            <div className="flex items-center gap-2">
              <container.icon
                className={cn(
                  "size-4 shrink-0",
                  hasActiveChild && "text-primary",
                )}
              />
              <span
                className={cn(hasActiveChild && "font-medium text-primary")}
              >
                {container.label}
              </span>
            </div>
            <motion.div
              animate={{ rotate: open ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="size-4"
            >
              <ChevronRight className="size-4" />
            </motion.div>
          </button>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <SidebarMenuSub>
              {container.items.map((item) => (
                <SidebarMenuSubItem key={item.href}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={isItemActive(pathname, item.href)}
                  >
                    <Link
                      href={item.href}
                      className="flex items-center justify-between w-full"
                    >
                      <div className="flex items-center gap-2">
                        <item.icon
                          className={cn(
                            "size-3.5 shrink-0",
                            isItemActive(pathname, item.href) &&
                              "text-primary",
                          )}
                        />
                        <span
                          className={cn(
                            isItemActive(pathname, item.href) &&
                              "text-primary font-medium",
                          )}
                        >
                          {item.label}
                        </span>
                      </div>
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

function SidebarNavigation({ pathname }: { pathname: string }) {
  const activeSectionId = getActiveSection(pathname);
  const activeSection = sections.find((s) => s.id === activeSectionId)!;

  return (
    <SidebarContent>
      <SidebarMenu>
        {activeSection.groups.map((group) => {
          const firstItem = group.items[0];
          return (
            <NavContainerItem
              key={group.label}
              container={{
                label: group.label,
                icon: firstItem ? firstItem.icon : Layers,
                items: group.items.map((item) => ({
                  label: item.label,
                  href: item.href,
                  icon: item.icon,
                })),
              }}
              pathname={pathname}
            />
          );
        })}
      </SidebarMenu>
    </SidebarContent>
  );
}

function SectionFooter({ pathname }: { pathname: string }) {
  const activeSectionId = getActiveSection(pathname);
  const { isMobile, state, setOpenMobile } = useSidebar();

  const handleNav = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <SidebarFooter>
      <SidebarSeparator />
      <TooltipProvider delayDuration={0}>
        <div className="flex items-center justify-around px-2 py-2">
          {sections.map((section) => {
            const isActive = section.id === activeSectionId;
            return (
              <Tooltip key={section.id}>
                <TooltipTrigger asChild>
                  <Link
                    href={`/dash/${section.id === "management" ? "management/overview" : section.id === "config" ? "config/overview" : "monitoring/overview"}`}
                    onClick={handleNav}
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive &&
                        "bg-sidebar-accent text-sidebar-accent-foreground",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <section.icon className="size-4" />
                    <span className="sr-only">{section.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top">{section.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </SidebarFooter>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="offcanvas" side="left" variant="sidebar">
      <SidebarHeader className="border-b px-4 py-3">
        <Link
          href="/dash/management/overview"
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

      <SidebarNavigation pathname={pathname} />

      <SectionFooter pathname={pathname} />
    </Sidebar>
  );
}
