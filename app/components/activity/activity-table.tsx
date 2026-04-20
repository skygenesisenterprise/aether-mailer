"use client";

import * as React from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActivity } from "@/context/activity-context";
import { ActivityRow } from "@/components/activity/activity-row";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ActivityTable() {
  const { state, filteredEvents, loadMore, refresh, setAutoRefresh } = useActivity();
  const tableRef = React.useRef<HTMLDivElement>(null);
  const observerRef = React.useRef<IntersectionObserver | null>(null);

  React.useEffect(() => {
    if (!tableRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          state.hasMore &&
          !state.loading &&
          filteredEvents.length > 0
        ) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(tableRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [state.hasMore, state.loading, loadMore, filteredEvents.length]);

  if (state.loading && filteredEvents.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-64" />
            </div>
            <div className="space-y-1 text-right">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground mb-4">{state.error}</p>
        <Button variant="outline" onClick={refresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try again
        </Button>
      </div>
    );
  }

  if (filteredEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground mb-1">No events found</p>
        <p className="text-xs text-muted-foreground">Try adjusting your filters or search query</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
        <p className="text-xs text-muted-foreground">
          {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
          {state.search && <span className="ml-1">matching &quot;{state.search}&quot;</span>}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 text-xs", state.autoRefresh && "bg-primary/10 text-primary")}
            onClick={() => setAutoRefresh(!state.autoRefresh)}
          >
            <RefreshCw className={cn("h-3 w-3 mr-1.5", state.autoRefresh && "animate-spin")} />
            Auto-refresh
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={refresh}>
            <RefreshCw className="h-3 w-3 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="divide-y divide-border/50">
        {filteredEvents.map((event) => (
          <ActivityRow key={event.id} event={event} />
        ))}
      </div>

      <div ref={tableRef} className="flex items-center justify-center py-4 min-h-16">
        {state.loading && filteredEvents.length > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading more...</span>
          </div>
        )}
        {!state.hasMore && filteredEvents.length > 0 && (
          <p className="text-xs text-muted-foreground">End of results</p>
        )}
      </div>
    </div>
  );
}
