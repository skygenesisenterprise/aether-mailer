"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Home,
  Users,
  Settings,
  Mail,
  History,
  Shield,
  Database,
  BarChart3,
  FileText,
  AlertTriangle,
  Search,
  Archive,
  Key,
  UserCheck,
  UserCog,
  Building,
  Globe,
  List,
  Tag,
  Truck,
  FileCheck,
  MailCheck,
  Lock,
  Bug,
  Activity,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  children?: NavItem[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigationItems: NavSection[] = [
  {
    title: "Principal",
    items: [
      {
        title: "Accueil",
        href: "/home",
        icon: <Home className="size-4" />,
      },
      {
        title: "Tableau de bord",
        href: "/dashboard",
        icon: <LayoutDashboard className="size-4" />,
        children: [
          {
            title: "Vue d'ensemble",
            href: "/dashboard/overview",
            icon: <BarChart3 className="size-4" />,
          },
          {
            title: "Livraison",
            href: "/dashboard/delivery",
            icon: <Truck className="size-4" />,
          },
          {
            title: "Réseau",
            href: "/dashboard/network",
            icon: <Globe className="size-4" />,
          },
          {
            title: "Performance",
            href: "/dashboard/performance",
            icon: <Activity className="size-4" />,
          },
          {
            title: "Sécurité",
            href: "/dashboard/security",
            icon: <Shield className="size-4" />,
          },
        ],
      },
    ],
  },
  {
    title: "Gestion",
    items: [
      {
        title: "Annuaire",
        href: "/directory",
        icon: <Users className="size-4" />,
        children: [
          {
            title: "Comptes",
            href: "/directory/accounts",
            icon: <UserCheck className="size-4" />,
          },
          {
            title: "Groupes",
            href: "/directory/groups",
            icon: <UserCog className="size-4" />,
          },
          {
            title: "Listes",
            href: "/directory/lists",
            icon: <List className="size-4" />,
          },
          {
            title: "Domaines",
            href: "/directory/domains",
            icon: <Building className="size-4" />,
          },
          {
            title: "Rôles",
            href: "/directory/roles",
            icon: <Tag className="size-4" />,
          },
          {
            title: "Clients OAuth",
            href: "/directory/oauth-clients",
            icon: <Key className="size-4" />,
          },
          {
            title: "Tenants",
            href: "/directory/tenants",
            icon: <Database className="size-4" />,
          },
          {
            title: "Clés API",
            href: "/directory/api_keys",
            icon: <Key className="size-4" />,
          },
        ],
      },
    ],
  },
  {
    title: "Messagerie",
    items: [
      {
        title: "Files d'attente",
        href: "/queues",
        icon: <Archive className="size-4" />,
        children: [
          {
            title: "Rapports",
            href: "/queues/reports",
            icon: <FileCheck className="size-4" />,
          },
        ],
      },
      {
        title: "Historique",
        href: "/history",
        icon: <History className="size-4" />,
        children: [
          {
            title: "Reçus",
            href: "/history/received",
            icon: <MailCheck className="size-4" />,
          },
          {
            title: "Livraison",
            href: "/history/delivery",
            icon: <Truck className="size-4" />,
          },
        ],
      },
    ],
  },
  {
    title: "Sécurité",
    items: [
      {
        title: "Spam",
        href: "/spam",
        icon: <AlertTriangle className="size-4" />,
        badge: "Beta",
        children: [
          {
            title: "Test",
            href: "/spam/test",
            icon: <Search className="size-4" />,
          },
          {
            title: "Entraînement",
            href: "/spam/train",
            icon: <FileText className="size-4" />,
          },
        ],
      },
      {
        title: "Rapports",
        href: "/reports",
        icon: <FileText className="size-4" />,
        children: [
          {
            title: "DMARC",
            href: "/reports/dmarc",
            icon: <Shield className="size-4" />,
          },
          {
            title: "TLS",
            href: "/reports/tls",
            icon: <Lock className="size-4" />,
          },
          {
            title: "ARF",
            href: "/reports/arf",
            icon: <MailCheck className="size-4" />,
          },
        ],
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        title: "Gestion",
        href: "/manage",
        icon: <Settings className="size-4" />,
        children: [
          {
            title: "Logs",
            href: "/manage/logs",
            icon: <FileText className="size-4" />,
          },
          {
            title: "Tracing",
            href: "/manage/tracing",
            icon: <Search className="size-4" />,
          },
        ],
      },
      {
        title: "Dépannage",
        href: "/troubleshoot",
        icon: <Bug className="size-4" />,
        children: [
          {
            title: "Livraison",
            href: "/troubleshoot/delivery",
            icon: <Truck className="size-4" />,
          },
          {
            title: "DMARC",
            href: "/troubleshoot/dmarc",
            icon: <Shield className="size-4" />,
          },
        ],
      },
      {
        title: "Paramètres",
        href: "/settings",
        icon: <Settings className="size-4" />,
      },
    ],
  },
  {
    title: "Compte",
    items: [
      {
        title: "Mon Compte",
        href: "/account",
        icon: <UserCog className="size-4" />,
        children: [
          {
            title: "Mot de passe",
            href: "/account/password",
            icon: <Lock className="size-4" />,
          },
          {
            title: "MFA",
            href: "/account/mfa",
            icon: <Shield className="size-4" />,
          },
          {
            title: "Crypto",
            href: "/account/crypto",
            icon: <Key className="size-4" />,
          },
          {
            title: "Mots de passe applicatifs",
            href: "/account/app-passwords",
            icon: <Key className="size-4" />,
          },
        ],
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(href)) {
        newSet.delete(href);
      } else {
        newSet.add(href);
      }
      return newSet;
    });
  };

  const isItemActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  const isChildActive = (children?: NavItem[]) => {
    if (!children) return false;
    return children.some((child) => isItemActive(child.href));
  };

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const isActive = isItemActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.href);
    const childActive = hasChildren && isChildActive(item.children);

    return (
      <div key={item.href} className="w-full">
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start gap-2 h-8 px-2 hover:bg-accent hover:text-accent-foreground transition-colors",
            level > 0 && "ml-4",
            isActive && "bg-secondary font-medium",
            childActive && "bg-accent/50",
          )}
          asChild={hasChildren ? false : true}
          onClick={hasChildren ? () => toggleExpanded(item.href) : undefined}
        >
          {hasChildren ? (
            <>
              <span
                className={cn(
                  "transition-transform duration-200 shrink-0",
                  isExpanded && "rotate-90",
                )}
              >
                <ChevronRight className="size-3" />
              </span>
              {item.icon}
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.title}</span>
                  {item.badge && (
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </>
          ) : (
            <Link href={item.href} className="flex items-center gap-2 w-full">
              {item.icon}
              {!isCollapsed && (
                <>
                  <span className="flex-1">{item.title}</span>
                  {item.badge && (
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          )}
        </Button>

        {hasChildren && isExpanded && !isCollapsed && (
          <div className="mt-1 space-y-1 pl-2">
            {item.children!.map((child) => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "relative flex flex-col h-screen bg-background border-r transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Mail className="size-6 text-primary" />
            <span className="font-semibold text-lg">Aether</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8"
        >
          {isCollapsed ? <Menu className="size-4" /> : <X className="size-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-6 scrollbar-thin scrollbar-thumb-border">
        {navigationItems.map((section) => (
          <div key={section.title} className="space-y-2">
            {!isCollapsed && (
              <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => renderNavItem(item))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        {!isCollapsed && (
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Connecté</span>
            </div>
            <div className="mt-1 text-muted-foreground/70">
              Aether Mailer v1.0
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
}
