"use client";

import React from "react";
import { Sidebar } from "@/components/Sidebar";
import { usePathname } from "next/navigation";
import { redirect } from "next/navigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const publicRoutes = ["/login", "/register", "/forgot"];

const shouldShowSidebar = (pathname: string): boolean => {
  // Ne pas afficher la sidebar sur les pages d'authentification publiques
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return false;
  }

  // Ne pas afficher la sidebar sur la page racine (redirection)
  if (pathname === "/") {
    return false;
  }

  // Afficher la sidebar partout ailleurs (home, dashboard, account, etc.)
  return true;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const showSidebar = shouldShowSidebar(pathname);

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
