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
  Send,
  Inbox,
  Star,
  Trash2,
  FolderOpen,
  Calendar,
  TrendingUp,
  CheckCircle,
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
    title: "Navigation",
    items: [
      {
        title: "Accueil",
        href: "/home",
        icon: <Home className="size-4" />,
      },
    ],
  },
  {
    title: "Tableau de bord",
    items: [
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
  {
    title: "Annuaire",
    items: [
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
  {
    title: "Sécurité",
    items: [
      {
        title: "Spam",
        href: "/spam",
        icon: <AlertTriangle className="size-4" />,
        badge: "Beta",
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
    ],
  },
  {
    title: "Compte",
    items: [
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
      <div
        key={item.href}
        className={cn("w-full relative", isCollapsed && "group")}
      >
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start gap-3 h-12 px-3 rounded-lg hover:bg-slate-700 text-white transition-all duration-200",
            level > 0 && !isCollapsed && "ml-8",
            isActive &&
              "bg-blue-600 text-white font-medium shadow-sm border border-blue-500",
            childActive && "bg-slate-700 border border-slate-600",
            isCollapsed && "w-16 justify-center px-2",
          )}
          asChild={hasChildren ? false : true}
          onClick={hasChildren ? () => toggleExpanded(item.href) : undefined}
        >
          {hasChildren ? (
            <>
              {item.icon}
              <span
                className={cn(
                  "transition-transform duration-200 shrink-0 text-slate-400",
                  isExpanded && "rotate-90 text-white",
                )}
              >
                <ChevronRight className="size-4" />
              </span>
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.title}</span>
                  {item.badge && (
                    <span className="text-xs bg-gradient-to-r from-blue-600 to-blue-500 text-white px-2 py-1 rounded-full font-medium border border-blue-400 shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </>
          ) : (
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-2 w-full",
                isCollapsed && "justify-start px-2",
              )}
            >
              {item.icon}
              {!isCollapsed && (
                <>
                  <span className="flex-1">{item.title}</span>
                  {item.badge && (
                    <span className="text-xs bg-gradient-to-r from-blue-600 to-blue-500 text-white px-2 py-1 rounded-full font-medium border border-blue-400 shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          )}
        </Button>

        {hasChildren && isExpanded && !isCollapsed && (
          <div className="mt-2 space-y-1 pl-4 border-l border-slate-600 ml-4">
            {item.children!.map((child) => renderNavItem(child, level + 1))}
          </div>
        )}

        {/* Tooltip pour les icônes en mode réduit */}
        {isCollapsed && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-slate-800 border border-slate-600 rounded-lg shadow-lg p-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            <div className="text-sm text-white font-medium">{item.title}</div>
            {hasChildren && (
              <div className="mt-1 pt-1 border-t border-slate-600 space-y-1">
                {item.children!.map((child) => (
                  <div key={child.href} className="text-xs text-slate-300">
                    {child.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "relative flex flex-col h-screen bg-slate-900 border-r border-slate-700 transition-all duration-300 ease-in-out shadow-sm",
        isCollapsed ? "w-20" : "w-72",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 backdrop-blur-sm">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Mail className="size-6 text-white" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-slate-900"></div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-white">
                Aether Mailer
              </span>
              <span className="text-xs text-slate-400">Enterprise</span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 hover:bg-slate-700 text-white transition-colors"
        >
          {isCollapsed ? <Menu className="size-4" /> : <X className="size-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-8 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-600 hover:scrollbar-thumb-slate-500">
        {navigationItems.map((section) => (
          <div key={section.title} className="space-y-3">
            {!isCollapsed && (
              <h3 className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => renderNavItem(item))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
