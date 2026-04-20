"use client";

import * as React from "react";
import {
  X,
  Copy,
  CheckCheck,
  ExternalLink,
  Clock,
  User,
  Monitor,
  Globe,
  Hash,
  Zap,
  FileJson,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useActivity } from "@/context/activity-context";
import { ActivityBadge, StatusBadge } from "./activity-badge";
import { EVENT_TYPE_LABELS } from "@/types/activity";

export function ActivityDrawer() {
  const { state, selectEvent } = useActivity();
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const event = state.selectedEvent;

  const handleClose = () => {
    selectEvent(null);
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatJson = (obj: unknown) => {
    return JSON.stringify(obj, null, 2);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    }).format(date);
  };

  if (!event) return null;

  return (
    <Sheet open={state.drawerOpen} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-4 pb-4">
          <div className="flex items-start justify-between">
            <SheetTitle className="text-lg font-semibold">Event Details</SheetTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <ActivityBadge type={event.type} />
            <StatusBadge status={event.status} />
          </div>
        </SheetHeader>

        <div className="space-y-6 pt-4">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Event Information</h3>
            <div className="rounded-lg border bg-card p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-1">
                  <p className="text-xs text-muted-foreground">Event Type</p>
                  <p className="text-sm font-medium">{EVENT_TYPE_LABELS[event.type]}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(event.type, "type")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {copiedField === "type" ? (
                    <CheckCheck className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-1">
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm">{event.description}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-xs text-muted-foreground">Timestamp</p>
                  <p className="text-sm font-mono">{formatDate(event.timestamp)}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(event.timestamp.toISOString(), "timestamp")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {copiedField === "timestamp" ? (
                    <CheckCheck className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {event.user && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">User</h3>
              <div className="rounded-lg border bg-card p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-sm font-medium">{event.user.name}</p>
                    <p className="text-xs text-muted-foreground">{event.user.email}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(event.user!.id, "userId")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {copiedField === "userId" ? (
                      <CheckCheck className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground font-mono">{event.user.id}</p>
                </div>
              </div>
            </div>
          )}

          {event.application && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Application</h3>
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{event.application.name}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(event.application!.id, "appId")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {copiedField === "appId" ? (
                      <CheckCheck className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Request Context</h3>
            <div className="rounded-lg border bg-card p-4 space-y-4">
              {event.ipAddress && (
                <div className="flex items-start gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-muted-foreground">IP Address</p>
                    <p className="text-sm font-mono">{event.ipAddress}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(event.ipAddress!, "ip")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {copiedField === "ip" ? (
                      <CheckCheck className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              )}

              {event.device && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Monitor className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-xs text-muted-foreground">Device</p>
                      <p className="text-sm">{event.device}</p>
                    </div>
                  </div>
                </>
              )}

              {event.duration !== undefined && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 space-y-1">
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="text-sm font-mono">{event.duration}ms</p>
                    </div>
                  </div>
                </>
              )}

              {event.statusCode && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 space-y-1">
                      <p className="text-xs text-muted-foreground">Status Code</p>
                      <p className="text-sm font-mono">{event.statusCode}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Tracing</h3>
            <div className="rounded-lg border bg-card p-4 space-y-4">
              {event.traceId && (
                <div className="flex items-start gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-muted-foreground">Trace ID</p>
                    <p className="text-sm font-mono break-all">{event.traceId}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(event.traceId!, "trace")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {copiedField === "trace" ? (
                      <CheckCheck className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              )}

              {event.requestId && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-xs text-muted-foreground">Request ID</p>
                      <p className="text-sm font-mono break-all">{event.requestId}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(event.requestId!, "request")}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {copiedField === "request" ? (
                        <CheckCheck className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </>
              )}

              {!event.traceId && !event.requestId && (
                <p className="text-sm text-muted-foreground">No tracing information available</p>
              )}
            </div>
          </div>

          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">Metadata</h3>
                <button
                  onClick={() => copyToClipboard(formatJson(event.metadata), "metadata")}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
                >
                  {copiedField === "metadata" ? (
                    <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copiedField === "metadata" ? "Copied" : "Copy JSON"}
                </button>
              </div>
              <div className="rounded-lg border bg-muted/50 p-4 overflow-x-auto">
                <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-all">
                  {formatJson(event.metadata)}
                </pre>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Raw Event</h3>
            <div className="rounded-lg border bg-muted/50 p-4 overflow-x-auto">
              <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-all">
                {formatJson({
                  id: event.id,
                  type: event.type,
                  description: event.description,
                  status: event.status,
                  timestamp: event.timestamp.toISOString(),
                  user: event.user,
                  application: event.application,
                  metadata: event.metadata,
                  ipAddress: event.ipAddress,
                  device: event.device,
                  traceId: event.traceId,
                  requestId: event.requestId,
                })}
              </pre>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
