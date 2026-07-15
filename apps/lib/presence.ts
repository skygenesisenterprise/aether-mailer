import type { User, WorkspaceMember } from "@/lib/api/types";

export type PresenceStatus = "online" | "busy" | "away" | "offline";

const PRESENCE_ALIASES: Record<string, PresenceStatus> = {
  online: "online",
  connected: "online",
  connecté: "online",
  connecte: "online",
  available: "online",
  busy: "busy",
  occupied: "busy",
  occupé: "busy",
  occupe: "busy",
  away: "away",
  absent: "away",
  idle: "away",
  offline: "offline",
  disconnected: "offline",
  horsligne: "offline",
  "hors ligne": "offline",
};

export const presenceStatusClasses: Record<PresenceStatus, string> = {
  online: "bg-emerald-400",
  busy: "bg-rose-500",
  away: "bg-amber-400",
  offline: "bg-muted-foreground",
};

function normalizePresenceKey(value: string): string {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizePresenceStatus(value?: string | null): PresenceStatus | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = normalizePresenceKey(value);
  return PRESENCE_ALIASES[normalized];
}

export function inferPresenceFromLastSeen(lastSeenAt?: string | null): PresenceStatus | undefined {
  if (!lastSeenAt) {
    return undefined;
  }

  const timestamp = new Date(lastSeenAt).getTime();
  if (Number.isNaN(timestamp)) {
    return undefined;
  }

  const secondsSinceLastSeen = (Date.now() - timestamp) / 1000;
  return secondsSinceLastSeen <= 75 ? "online" : "offline";
}

interface ResolvePresenceInput {
  presenceStatus?: string | null;
  status?: string | null;
  lastSeenAt?: string | null;
  isAuthenticated?: boolean;
  isRealtimeConnected?: boolean;
  isCurrentSession?: boolean;
}

export function resolvePresenceStatus(input: ResolvePresenceInput): PresenceStatus | undefined {
  if (input.isCurrentSession) {
    const explicitStatus =
      normalizePresenceStatus(input.presenceStatus) ?? normalizePresenceStatus(input.status);

    if (!input.isAuthenticated || !input.isRealtimeConnected) {
      return undefined;
    }

    if (explicitStatus === "busy" || explicitStatus === "away" || explicitStatus === "offline") {
      return explicitStatus;
    }

    return "online";
  }

  const explicitStatus = normalizePresenceStatus(input.presenceStatus);

  if (input.isRealtimeConnected === false) {
    return inferPresenceFromLastSeen(input.lastSeenAt);
  }

  if (explicitStatus) {
    if (input.lastSeenAt) {
      const secondsSinceLastSeen = (Date.now() - new Date(input.lastSeenAt).getTime()) / 1000;
      if (secondsSinceLastSeen > 75) {
        return "offline";
      }
    } else if (explicitStatus === "online") {
      return "offline";
    }

    return explicitStatus;
  }

  return inferPresenceFromLastSeen(input.lastSeenAt);
}

export function resolveUserPresenceStatus(
  user: Pick<User, "presenceStatus" | "status" | "lastSeenAt">,
  options?: Pick<ResolvePresenceInput, "isAuthenticated" | "isRealtimeConnected" | "isCurrentSession">
): PresenceStatus | undefined {
  return resolvePresenceStatus({
    presenceStatus: user.presenceStatus,
    status: user.status,
    lastSeenAt: user.lastSeenAt,
    ...options,
  });
}

export function resolveWorkspaceMemberPresenceStatus(
  member: Pick<WorkspaceMember, "presenceStatus" | "status" | "lastSeenAt">
): PresenceStatus | undefined {
  return resolvePresenceStatus({
    presenceStatus: member.presenceStatus,
    status: member.status,
    lastSeenAt: member.lastSeenAt,
  });
}
