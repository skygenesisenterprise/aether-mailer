"use client";

import * as React from "react";
import { useAuth } from "@/context/AuthContext";
import { LOGIN_ROUTE } from "@/lib/routes";
import { usePathname, useRouter } from "next/navigation";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const redirectUrl = `${LOGIN_ROUTE}?redirect=${encodeURIComponent(pathname)}`;
      router.push(redirectUrl);
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1f2022]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1f2022] px-6 text-center text-sm text-zinc-400">
        Redirection vers la connexion…
      </div>
    );
  }

  return <>{children}</>;
}
