import * as React from "react";
import { cn } from "@/lib/utils";
import { ActivityEventType, EventStatus, EVENT_TYPE_LABELS } from "@/types/activity";

interface ActivityBadgeProps {
  type: ActivityEventType;
  className?: string;
}

export function ActivityBadge({ type, className }: ActivityBadgeProps) {
  const colorMap: Record<string, string> = {
    "user.": "bg-violet-500/10 text-violet-600 border-violet-500/20",
    "token.": "bg-blue-500/10 text-blue-600 border-blue-500/20",
    "api.": "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    "security.": "bg-amber-500/10 text-amber-600 border-amber-500/20",
    "agent.": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    "vault.": "bg-orange-500/10 text-orange-600 border-orange-500/20",
    "application.": "bg-pink-500/10 text-pink-600 border-pink-500/20",
    "connection.": "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  };

  const getColorClass = () => {
    for (const [prefix, color] of Object.entries(colorMap)) {
      if (type.startsWith(prefix)) return color;
    }
    return "bg-gray-500/10 text-gray-600 border-gray-500/20";
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        getColorClass(),
        className
      )}
    >
      {EVENT_TYPE_LABELS[type]}
    </span>
  );
}

interface StatusBadgeProps {
  status: EventStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config: Record<EventStatus, { label: string; class: string }> = {
    success: {
      label: "Success",
      class: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    },
    failed: {
      label: "Failed",
      class: "bg-red-500/10 text-red-600 border-red-500/20",
    },
    warning: {
      label: "Warning",
      class: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
    info: {
      label: "Info",
      class: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    },
  };

  const { label, class: colorClass } = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
        colorClass,
        className
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", {
          "bg-emerald-500": status === "success",
          "bg-red-500": status === "failed",
          "bg-amber-500": status === "warning",
          "bg-blue-500": status === "info",
        })}
      />
      {label}
    </span>
  );
}
