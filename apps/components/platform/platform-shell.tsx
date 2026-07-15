"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { usePlatform } from "@/context/PlatformContext";
import { AdminHeader } from "@/components/platform/header";
import { AdminSidebar } from "@/components/platform/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

interface PlatformShellProps {
  children: React.ReactNode;
}

export function PlatformShell({ children }: PlatformShellProps) {
  const pathname = usePathname();
  const { activeWorkspace, error, isLoading } = usePlatform();
  const isImmersiveRoute = pathname.startsWith("/calls/room");

  if (isImmersiveRoute) {
    return (
      <div className="dark h-svh overflow-hidden bg-[#1f2022] text-foreground">
        <main className="h-full overflow-hidden bg-[#1f2022]">{children}</main>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="dark flex min-h-svh flex-col flex-1 bg-[#1f2022] text-foreground">
        <AdminHeader />
        <div className="flex min-h-0 flex-1">
          <AdminSidebar />
          <main className="min-w-0 flex-1 overflow-auto bg-[#1f2022] pb-16 md:pb-0">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                Chargement de votre espace de travail…
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-400">
                Impossible de charger la plateforme. Vérifiez votre session ou la disponibilité de l&apos;API.
              </div>
            ) : !activeWorkspace ? (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-400">
                Aucun workspace accessible pour cet utilisateur.
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
