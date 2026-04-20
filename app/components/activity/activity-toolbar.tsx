"use client";

import { ActivitySearch, ActivityFilters } from "@/components/activity";

export function ActivityToolbar() {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border/50">
      <div className="flex items-center gap-4 flex-1">
        <ActivitySearch />
        <ActivityFilters />
      </div>
    </div>
  );
}
