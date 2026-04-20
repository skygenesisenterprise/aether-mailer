"use client";

import * as React from "react";
import { ChevronRight, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActivityEvent } from "@/types/activity";
import { ActivityBadge, StatusBadge } from "@/components/activity/activity-badge";
import { useActivity } from "@/context/activity-context";

interface ActivityRowProps {
  event: ActivityEvent;
}

export function ActivityRow({ event }: ActivityRowProps) {
  const { selectEvent } = useActivity();

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusIcon = () => {
    if (event.status === "failed") {
      return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />;
    }
    if (event.status === "warning") {
      return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
    }
    return null;
  };

  return (
    <div
      onClick={() => selectEvent(event)}
      className={cn(
        "group flex items-center gap-4 px-4 py-3",
        "border-b border-border/50",
        "hover:bg-muted/50 cursor-pointer",
        "transition-colors duration-150",
        "animate-in fade-in-50"
      )}
    >
      <div className="shrink-0 w-8 flex justify-center">
        {getStatusIcon() || <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <ActivityBadge type={event.type} />
          <StatusBadge status={event.status} />
        </div>
        <p className="text-sm text-foreground truncate pr-4">{event.description}</p>
      </div>

      <div className="shrink-0 text-right">
        {event.user && (
          <p className="text-sm text-foreground truncate max-w-37.5">{event.user.name}</p>
        )}
        {event.application && (
          <p className="text-xs text-muted-foreground truncate max-w-37.5">
            {event.application.name}
          </p>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-1 text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span className="text-xs whitespace-nowrap">{formatTime(event.timestamp)}</span>
        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}
