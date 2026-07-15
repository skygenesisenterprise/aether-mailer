"use client";

import * as React from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActivity } from "@/context/activity-context";
import { ActivityEventType, EventStatus, EVENT_TYPE_LABELS } from "@/types/activity";

const EVENT_TYPES: ActivityEventType[] = [
  "user.login",
  "user.logout",
  "user.created",
  "user.updated",
  "token.issued",
  "token.revoked",
  "token.refreshed",
  "api.request",
  "security.alert",
  "security.blocked",
  "agent.executed",
  "agent.failed",
  "vault.secret.accessed",
  "vault.secret.denied",
  "vault.secret.created",
  "application.created",
  "connection.created",
];

const STATUS_OPTIONS: { value: EventStatus; label: string }[] = [
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
];

const DATE_PRESETS = [
  { label: "Last 15 minutes", value: 15 * 60 * 1000 },
  { label: "Last hour", value: 60 * 60 * 1000 },
  { label: "Last 24 hours", value: 24 * 60 * 60 * 1000 },
  { label: "Last 7 days", value: 7 * 24 * 60 * 60 * 1000 },
  { label: "Last 30 days", value: 30 * 24 * 60 * 60 * 1000 },
];

export function ActivityFilters() {
  const { state, setFilters, resetFilters } = useActivity();
  const [open, setOpen] = React.useState(false);
  const [dateOpen, setDateOpen] = React.useState(false);
  const [selectedDateRange, setSelectedDateRange] = React.useState<
    { from: Date; to: Date } | undefined
  >(undefined);

  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (state.filters.type) count++;
    if (state.filters.status) count++;
    if (state.filters.dateRange) count++;
    if (state.filters.user) count++;
    if (state.filters.application) count++;
    return count;
  }, [state.filters]);

  const handleTypeChange = (type: ActivityEventType | undefined) => {
    setFilters({ ...state.filters, type });
  };

  const handleStatusChange = (status: EventStatus | undefined) => {
    setFilters({ ...state.filters, status });
  };

  const handleDatePreset = (ms: number) => {
    const to = new Date();
    const from = new Date(to.getTime() - ms);
    setSelectedDateRange({ from, to });
    setFilters({
      ...state.filters,
      dateRange: { from, to },
    });
    setDateOpen(false);
  };

  const handleClearDateRange = () => {
    setSelectedDateRange(undefined);
    const { dateRange, ...rest } = state.filters;
    setFilters(rest);
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={state.filters.type || "all"}
        onValueChange={(v) => handleTypeChange(v === "all" ? undefined : (v as ActivityEventType))}
      >
        <SelectTrigger className="h-9 w-45">
          <SelectValue placeholder="Event type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="user">User events</SelectItem>
          <SelectItem value="token">Token events</SelectItem>
          <SelectItem value="security">Security events</SelectItem>
          <SelectItem value="agent">Agent events</SelectItem>
          <SelectItem value="vault">Vault events</SelectItem>
          <SelectItem value="api">API requests</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={state.filters.status || "all"}
        onValueChange={(v) => handleStatusChange(v === "all" ? undefined : (v as EventStatus))}
      >
        <SelectTrigger className="h-9 w-35">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={dateOpen} onOpenChange={setDateOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-9 w-50 justify-start text-left font-normal",
              !selectedDateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDateRange ? (
              <>
                {selectedDateRange.from.toLocaleDateString()} -{" "}
                {selectedDateRange.to.toLocaleDateString()}
              </>
            ) : (
              <span>Date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b">
            <p className="text-xs font-medium text-muted-foreground mb-2">Quick select</p>
            <div className="flex flex-wrap gap-1">
              {DATE_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  variant="secondary"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleDatePreset(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          <Calendar
            mode="range"
            selected={{
              from: selectedDateRange?.from,
              to: selectedDateRange?.to,
            }}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                setSelectedDateRange({ from: range.from, to: range.to });
                setFilters({
                  ...state.filters,
                  dateRange: { from: range.from, to: range.to },
                });
              }
            }}
            numberOfMonths={2}
          />
          {selectedDateRange && (
            <div className="p-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 text-xs"
                onClick={handleClearDateRange}
              >
                Clear date range
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {activeFiltersCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-2 text-muted-foreground"
          onClick={resetFilters}
        >
          <X className="h-4 w-4 mr-1" />
          Clear ({activeFiltersCount})
        </Button>
      )}
    </div>
  );
}
