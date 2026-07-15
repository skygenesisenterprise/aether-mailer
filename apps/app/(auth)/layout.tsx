"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { DEFAULT_PLATFORM_ROUTE } from "@/lib/routes";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(DEFAULT_PLATFORM_ROUTE);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Vérification de la session…
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
