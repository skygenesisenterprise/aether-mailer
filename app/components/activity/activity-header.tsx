"use client";

import { Activity, Shield, Zap } from "lucide-react";

export function ActivityHeader() {
  return (
    <div className="px-6 py-6 border-b border-border/50">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
          <p className="text-sm text-muted-foreground">Monitor events, logs and system activity</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5" />
          <span>Security events tracked</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Zap className="h-3.5 w-3.5" />
          <span>Real-time monitoring</span>
        </div>
      </div>
    </div>
  );
}
