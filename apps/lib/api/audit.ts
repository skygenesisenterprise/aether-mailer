import { apiListRequest } from "@/lib/api/client";
import type { AuditLog, PaginatedResponse } from "@/lib/api/types";

export interface AuditLogFilters {
  limit?: number;
}

export function listAuditLogs(workspaceId: string, filters?: AuditLogFilters): Promise<PaginatedResponse<AuditLog>> {
  const params = new URLSearchParams();
  if (typeof filters?.limit === "number") {
    params.set("limit", String(filters.limit));
  }
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return apiListRequest<AuditLog>(`/workspaces/${workspaceId}/audit-logs${suffix}`);
}
