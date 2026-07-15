"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  MessageSquare,
  FolderOpen,
  Image,
  Bell,
  Newspaper,
  Terminal,
  CreditCard,
  Megaphone,
  Mail,
  Key,
  Search,
  Shield,
  Share2,
  Globe,
  Server,
  BookOpen,
  Link2,
  Calendar,
  CalendarDays,
  ChevronRight,
  PenSquare,
  List,
  FileClock,
  FilePenLine,
  Layers,
  Radio,
  Webhook,
  LockKeyhole,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
interface NavItem {
  id?: string;
  title: string;
  href: string;
  icon: React.ElementType | string;
  badge?: string;
  status?: "new" | "beta" | "soon";
  items?: NavItem[];
}

const overviewNavItems: NavItem[] = [
  {
    title: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Activité récente",
    href: "/dashboard/activity",
    icon: Activity,
  },
  {
    title: "Calendrier éditorial",
    href: "/dashboard/editorial-calendar",
    icon: CalendarDays,
  },
];

const contentNavItems: NavItem[] = [
  {
    id: "content-articles",
    title: "Articles",
    href: "/dashboard/articles",
    icon: FileText,
    items: [
      { title: "Tous les articles", href: "/dashboard/articles", icon: List },
      { title: "Nouvel article", href: "/dashboard/articles/new", icon: PenSquare },
      { title: "Brouillons", href: "/dashboard/articles/drafts", icon: FilePenLine },
      { title: "Planifiés", href: "/dashboard/articles/scheduled", icon: FileClock },
    ],
  },
  {
    title: "Catégories",
    href: "/dashboard/categories",
    icon: FolderOpen,
  },
  {
    title: "Médias",
    href: "/dashboard/medias",
    icon: Image,
  },
  {
    title: "Dossiers",
    href: "/dashboard/dossiers",
    icon: BookOpen,
  },
  {
    title: "Pages",
    href: "/dashboard/pages",
    icon: Layers,
  },
];

const platformNavItems: NavItem[] = [
  {
    title: "Services",
    href: "/dashboard/services",
    icon: Server,
  },
  {
    title: "Statut",
    href: "/dashboard/status",
    icon: Radio,
  },
  {
    title: "API Keys",
    href: "/dashboard/api-keys",
    icon: Key,
  },
  {
    title: "Webhooks",
    href: "/dashboard/webhooks",
    icon: Webhook,
  },
  {
    title: "Liens courts",
    href: "/dashboard/linker",
    icon: Link2,
  },
];

const audienceNavItems: NavItem[] = [
  {
    title: "Utilisateurs",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    title: "Commentaires",
    href: "/dashboard/comments",
    icon: MessageSquare,
  },
  {
    title: "Abonnements",
    href: "/dashboard/subscriptions",
    icon: CreditCard,
  },
  {
    title: "Newsletter",
    href: "/dashboard/newsletter",
    icon: Mail,
  },
];

const operationsNavItems: NavItem[] = [
  {
    title: "Statistiques",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
  },
  {
    title: "Planification",
    href: "/dashboard/scheduling",
    icon: Calendar,
  },
  {
    title: "Audit Logs",
    href: "/dashboard/audit-logs",
    icon: Shield,
  },
];

const socialAccountItems: NavItem[] = [
  {
    title: "X",
    href: "/dashboard/social/twitter",
    icon: "twitter",
  },
  {
    title: "Facebook",
    href: "/dashboard/social/facebook",
    icon: "facebook",
  },
  {
    title: "Instagram",
    href: "/dashboard/social/instagram",
    icon: "instagram",
  },
  {
    title: "LinkedIn",
    href: "/dashboard/social/linkedin",
    icon: "linkedin",
  },
  {
    title: "YouTube",
    href: "/dashboard/social/youtube",
    icon: "youtube",
  },
  {
    title: "Discord",
    href: "/dashboard/social/discord",
    icon: "discord",
  },
  {
    title: "Twitch",
    href: "/dashboard/social/twitch",
    icon: "twitch",
  },
];

const growthNavItems: NavItem[] = [
  {
    title: "SEO",
    href: "/dashboard/seo",
    icon: Search,
  },
  {
    title: "Campagnes",
    href: "/dashboard/campaigns",
    icon: Megaphone,
  },
  {
    title: "Publicités",
    href: "/dashboard/advertising",
    icon: Megaphone,
  },
  {
    id: "growth-social",
    title: "Réseaux sociaux",
    href: "/dashboard/social",
    icon: Share2,
    items: [
      {
        title: "Publications",
        href: "/dashboard/publications",
        icon: Share2,
      },
      {
        title: "Comptes sociaux",
        href: "/dashboard/social-accounts",
        icon: Globe,
        items: socialAccountItems,
      },
      {
        title: "Statistiques sociales",
        href: "/dashboard/social-analytics",
        icon: BarChart3,
      },
    ],
  },
];

const securitySettingsNavItems: NavItem[] = [
  {
    title: "Sécurité",
    href: "/dashboard/security",
    icon: LockKeyhole,
  },
  {
    title: "Logs",
    href: "/dashboard/logs",
    icon: Terminal,
  },
  {
    title: "Paramètres",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

const socialMediaNavItems = [
  {
    title: "X (Twitter)",
    href: "/dashboard/social/twitter",
    icon: "twitter",
  },
  {
    title: "Facebook",
    href: "/dashboard/social/facebook",
    icon: "facebook",
  },
  {
    title: "Instagram",
    href: "/dashboard/social/instagram",
    icon: "instagram",
  },
  {
    title: "LinkedIn",
    href: "/dashboard/social/linkedin",
    icon: "linkedin",
  },
  {
    title: "YouTube",
    href: "/dashboard/social/youtube",
    icon: "youtube",
  },
  {
    title: "Discord",
    href: "/dashboard/social/discord",
    icon: "discord",
  },
  {
    title: "Twitch",
    href: "/dashboard/social/twitch",
    icon: "twitch",
  },
];

function SocialIcon({ name }: { name: string }) {
  switch (name) {
    case "twitter":
      return (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "facebook":
      return (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path
            fillRule="evenodd"
            d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "instagram":
      return (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path
            fillRule="evenodd"
            d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "linkedin":
      return (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case "youtube":
      return (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case "discord":
      return (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      );
    case "twitch":
      return (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.571 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
        </svg>
      );
    default:
      return null;
  }
}

function NavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const hasActiveChild = React.useMemo(() => {
    if (!item.items) return false;
    return item.items.some((subItem) => isRouteMatch(pathname, subItem.href));
  }, [item.items, pathname]);

  const isGroupActive = pathname === item.href;
  const isItemActive = item.items
    ? isGroupActive || hasActiveChild
    : isActive(pathname, item.href);
  const shouldBeOpen = isOpen || hasActiveChild || isGroupActive;

  if (item.items && item.items.length > 0) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isItemActive}
          tooltip={item.title}
          className="flex w-full items-center justify-between"
        >
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIsOpen(!isOpen);
            }}
          >
            <div className="flex items-center gap-2">
              {typeof item.icon === "string" ? (
                <SocialIcon name={item.icon} />
              ) : (
                <item.icon className="h-4 w-4" />
              )}
              <span>{item.title}</span>
            </div>
            <motion.div
              animate={{ rotate: shouldBeOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </motion.div>
          </button>
        </SidebarMenuButton>
        <AnimatePresence>
          {shouldBeOpen && (
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
                    <SidebarMenuSubButton
                      asChild
                      isActive={isActive(
                        pathname,
                        subItem.href,
                        item.items?.map((siblingItem) => siblingItem.href)
                      )}
                    >
                      <Link href={subItem.href}>
                        {typeof subItem.icon === "string" ? (
                          <SocialIcon name={subItem.icon} />
                        ) : (
                          <subItem.icon className="h-4 w-4" />
                        )}
                        <span>{subItem.title}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </motion.div>
          )}
        </AnimatePresence>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isItemActive} tooltip={item.title}>
        <Link href={item.href}>
          {typeof item.icon === "string" ? (
            <SocialIcon name={item.icon} />
          ) : (
            <item.icon className="h-4 w-4" />
          )}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function isActive(pathname: string, href: string, siblingHrefs: string[] = []): boolean {
  if (!isRouteMatch(pathname, href)) return false;

  return !siblingHrefs.some((siblingHref) => {
    return (
      siblingHref !== href &&
      siblingHref.length > href.length &&
      isRouteMatch(pathname, siblingHref)
    );
  });
}

function isRouteMatch(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarSection({ label, items }: { label: string; items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AdminSidebar() {
  const { state, toggleSidebar } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between gap-2">
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Newspaper className="h-4 w-4" />
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="font-serif text-sm font-bold">Sky Genesis Enterprise</span>
              <span className="text-[10px] text-muted-foreground">Console Admin</span>
            </div>
          </Link>
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            title={state === "expanded" ? "Réduire la sidebar" : "Agrandir la sidebar"}
          >
            {state === "expanded" ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarSection label="Vue d'ensemble" items={overviewNavItems} />
        <SidebarSection label="Contenu" items={contentNavItems} />
        <SidebarSection label="Plateforme" items={platformNavItems} />
        <SidebarSection label="Audience" items={audienceNavItems} />
        <SidebarSection label="Opérations" items={operationsNavItems} />
        <SidebarSection label="Croissance" items={growthNavItems} />
        <SidebarSection label="Plateformes" items={socialMediaNavItems} />
        <SidebarSection label="Configuration" items={securitySettingsNavItems} />
      </SidebarContent>
    </Sidebar>
  );
}
