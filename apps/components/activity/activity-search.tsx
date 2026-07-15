"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActivity } from "@/context/activity-context";

export function ActivitySearch() {
  const { state, setSearch } = useActivity();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClear = () => {
    setSearch("");
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search events, users, types..."
        value={state.search}
        onChange={(e) => setSearch(e.target.value)}
        className={cn(
          "h-9 w-full max-w-sm rounded-md border border-input bg-transparent pl-9 pr-8 text-sm",
          "placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary/20",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      />
      {state.search && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
