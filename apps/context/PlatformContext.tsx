"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api/errors";
import { getMe } from "@/lib/api/me";
import type { User, Workspace } from "@/lib/api/types";
import { resolveUserPresenceStatus } from "@/lib/presence";
import { listWorkspaces } from "@/lib/api/workspaces";

const ACTIVE_WORKSPACE_STORAGE_KEY = "aether.activeWorkspaceId";

interface PlatformContextValue {
  currentUser: User | null;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  activeWorkspaceId: string | null;
  setActiveWorkspaceId(id: string): void;
  setCurrentUser(user: User | null): void;
  isLoading: boolean;
  error: ApiError | null;
}

const PlatformContext = React.createContext<PlatformContextValue | undefined>(undefined);

// Fallback component for when PlatformProviderContent is loading
function PlatformProviderFallback({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = React.useState<User | null>(null);
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<ApiError | null>(null);

  const setActiveWorkspaceId = React.useCallback((workspaceId: string) => {
    setActiveWorkspaceIdState(workspaceId);
  }, []);

  const setCurrentUser = React.useCallback((user: User | null) => {
    setCurrentUserState(user);
  }, []);

  const value = React.useMemo<PlatformContextValue>(
    () => ({
      currentUser,
      workspaces,
      activeWorkspace: workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null,
      activeWorkspaceId,
      setActiveWorkspaceId,
      setCurrentUser,
      isLoading,
      error,
    }),
    [activeWorkspaceId, currentUser, error, isLoading, setActiveWorkspaceId, setCurrentUser, workspaces]
  );

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

function readStoredWorkspaceId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY);
}

function writeStoredWorkspaceId(workspaceId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, workspaceId);
}

function clearStoredWorkspaceId(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ACTIVE_WORKSPACE_STORAGE_KEY);
}

function resolveWorkspaceId(workspaceIdFromQuery: string | null): string | null {
  return workspaceIdFromQuery ?? readStoredWorkspaceId();
}

function replaceWorkspaceParam(
  router: ReturnType<typeof useRouter>,
  pathname: string,
  searchParams: URLSearchParams | null,
  workspaceId: string
): void {
  const nextParams = new URLSearchParams(searchParams?.toString() ?? "");
  nextParams.set("workspaceId", workspaceId);
  router.replace(`${pathname}?${nextParams.toString()}`);
}

// Component that uses useSearchParams - needs to be wrapped in Suspense
function PlatformProviderContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const workspaceIdFromQuery = searchParams.get("workspaceId");
  const [currentUser, setCurrentUserState] = React.useState<User | null>(null);
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<ApiError | null>(null);
  const { hasActiveSession, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const hasLoadedRef = React.useRef(false);
  const pathnameRef = React.useRef(pathname);
  const searchParamsRef = React.useRef(searchParams);

  React.useEffect(() => {
    pathnameRef.current = pathname;
    searchParamsRef.current = searchParams;
  }, [pathname, searchParams]);

  const setActiveWorkspaceId = React.useCallback(
    (workspaceId: string) => {
      writeStoredWorkspaceId(workspaceId);
      setActiveWorkspaceIdState(workspaceId);
      replaceWorkspaceParam(router, pathname, searchParams, workspaceId);
    },
    [pathname, router, searchParams]
  );

  const setCurrentUser = React.useCallback((user: User | null) => {
    setCurrentUserState(user);
  }, []);

  React.useEffect(() => {
    if (isAuthLoading || !isAuthenticated) {
      if (!isAuthLoading) {
        hasLoadedRef.current = false;
        setCurrentUserState(null);
        setWorkspaces([]);
        setActiveWorkspaceIdState(null);
        setError(null);
        setIsLoading(false);
      }
      return;
    }

    let cancelled = false;

    async function loadPlatformContext() {
      if (!hasLoadedRef.current) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const [user, availableWorkspaces] = await Promise.all([getMe(), listWorkspaces()]);
        if (cancelled) {
          return;
        }

        setCurrentUserState(user);
        setWorkspaces(availableWorkspaces);

        const requestedWorkspaceId = resolveWorkspaceId(workspaceIdFromQuery);
        const resolvedWorkspace =
          availableWorkspaces.find((workspace) => workspace.id === requestedWorkspaceId) ?? availableWorkspaces[0] ?? null;

        setActiveWorkspaceIdState(resolvedWorkspace?.id ?? null);
        if (resolvedWorkspace?.id) {
          writeStoredWorkspaceId(resolvedWorkspace.id);
          if (requestedWorkspaceId !== resolvedWorkspace.id) {
            replaceWorkspaceParam(router, pathnameRef.current, searchParamsRef.current, resolvedWorkspace.id);
          }
        } else {
          clearStoredWorkspaceId();
        }
        hasLoadedRef.current = true;
      } catch (cause) {
        if (cancelled) {
          return;
        }

        const normalized =
          cause instanceof ApiError
            ? cause
            : new ApiError({ status: 500, message: "Failed to load platform context." });

        setError(normalized);
        setCurrentUserState(null);
        setWorkspaces([]);
        setActiveWorkspaceIdState(null);
        clearStoredWorkspaceId();
        hasLoadedRef.current = false;
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadPlatformContext();

    return () => {
      cancelled = true;
    };
  }, [workspaceIdFromQuery, isAuthLoading, isAuthenticated]);

  const resolvedCurrentUser = React.useMemo(() => {
    if (!currentUser) {
      return null;
    }

    return {
      ...currentUser,
      presenceStatus: resolveUserPresenceStatus(currentUser, {
        isAuthenticated: hasActiveSession && isAuthenticated,
        isRealtimeConnected: true,
        isCurrentSession: true,
      }),
    };
  }, [currentUser, hasActiveSession, isAuthenticated]);

  const value = React.useMemo<PlatformContextValue>(
    () => ({
      currentUser: resolvedCurrentUser,
      workspaces,
      activeWorkspace: isLoading ? null : workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null,
      activeWorkspaceId,
      setActiveWorkspaceId,
      setCurrentUser,
      isLoading,
      error,
    }),
    [activeWorkspaceId, error, isLoading, resolvedCurrentUser, setActiveWorkspaceId, setCurrentUser, workspaces]
  );

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

// Main PlatformProvider that wraps the content in Suspense
export function PlatformProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PlatformProviderFallback>{children}</PlatformProviderFallback>}>
      <PlatformProviderContent>{children}</PlatformProviderContent>
    </Suspense>
  );
}

export function usePlatform(): PlatformContextValue {
  const context = React.useContext(PlatformContext);
  if (!context) {
    throw new Error("usePlatform must be used within a PlatformProvider");
  }

  return context;
}
