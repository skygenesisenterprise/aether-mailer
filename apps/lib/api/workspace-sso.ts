import { apiRequest } from "@/lib/api/client";
import type { UpdateWorkspaceSsoInput, WorkspaceSsoConfig } from "@/lib/api/types";

export function getWorkspaceSsoConfig(workspaceId: string): Promise<WorkspaceSsoConfig> {
  return apiRequest<WorkspaceSsoConfig>(`/workspaces/${workspaceId}/sso`);
}

export function updateWorkspaceSsoConfig(workspaceId: string, input: UpdateWorkspaceSsoInput): Promise<WorkspaceSsoConfig> {
  return apiRequest<WorkspaceSsoConfig, UpdateWorkspaceSsoInput>(`/workspaces/${workspaceId}/sso`, {
    method: "PATCH",
    body: input,
  });
}
