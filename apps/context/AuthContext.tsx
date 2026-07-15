"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { authApi } from "@/lib/api/auth";
import type { RegisterPayload } from "@/lib/api/auth";
import { DEFAULT_PLATFORM_ROUTE, LOGIN_ROUTE } from "@/lib/routes";
import type { User } from "@/lib/api/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  hasActiveSession: boolean;
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<string | null>;
  loadCurrentUser: () => Promise<User | null>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<AuthStatus>("loading");

  const loadCurrentUser = React.useCallback(async () => {
    try {
      const nextUser = await authApi.getCurrentUser();
      setUser(nextUser);
      return nextUser;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const refresh = React.useCallback(async () => {
    try {
      await authApi.bootstrap();
    } catch {
      // Refresh failed
    }
    const nextToken = authApi.getStoredToken();
    setAccessToken(nextToken);
    setUser(authApi.getStoredUser());
    setStatus(nextToken ? "authenticated" : "unauthenticated");
    return nextToken;
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        await authApi.bootstrap();
      } catch {
        // Bootstrap failed (network error, invalid session, etc.)
      }
      if (cancelled) {
        return;
      }
      const nextToken = authApi.getStoredToken();
      setAccessToken(nextToken);
      setUser(authApi.getStoredUser());
      setStatus(nextToken ? "authenticated" : "unauthenticated");
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  function getRedirectTarget(): string {
    if (typeof window === "undefined") return DEFAULT_PLATFORM_ROUTE;
    const params = new URLSearchParams(window.location.search);
    return params.get("redirect") || DEFAULT_PLATFORM_ROUTE;
  }

  const login = React.useCallback(
    async (email: string, password: string) => {
      const response = await authApi.login({ email, password });
      setAccessToken(response.accessToken);
      setUser(response.user);
      setStatus("authenticated");
      const target = getRedirectTarget();
      if (typeof window !== "undefined") {
        window.location.assign(target);
        return;
      }
      router.replace(target);
    },
    [router]
  );

  const register = React.useCallback(
    async (payload: RegisterPayload) => {
      const response = await authApi.register(payload);
      setAccessToken(response.accessToken);
      setUser(response.user);
      setStatus("authenticated");
      const target = getRedirectTarget();
      if (typeof window !== "undefined") {
        window.location.assign(target);
        return;
      }
      router.replace(target);
    },
    [router]
  );

  const logout = React.useCallback(async () => {
    await authApi.logout();
    setAccessToken(null);
    setUser(null);
    setStatus("unauthenticated");
    router.push(LOGIN_ROUTE);
    router.refresh();
  }, [router]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      hasActiveSession: Boolean(accessToken),
      status,
      isAuthenticated: status === "authenticated",
      isLoading: status === "loading",
      login,
      register,
      logout,
      refresh,
      loadCurrentUser,
    }),
    [accessToken, loadCurrentUser, login, logout, refresh, register, status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
