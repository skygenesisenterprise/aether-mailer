import { apiListRequest, apiRequest } from "@/lib/api/client";
import type { PaginatedResponse, Workspace } from "@/lib/api/types";

export interface CreateWorkspaceInput {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string;
}

export async function listWorkspaces(): Promise<Workspace[]> {
  const response = await apiListRequest<Workspace>("/workspaces");
  return response.data;
}

export function createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
  return apiRequest<Workspace, CreateWorkspaceInput>("/workspaces", {
    method: "POST",
    body: input,
  });
}

export function getWorkspace(workspaceId: string): Promise<Workspace> {
  return apiRequest<Workspace>(`/workspaces/${workspaceId}`);
}

export function updateWorkspace(workspaceId: string, input: UpdateWorkspaceInput): Promise<Workspace> {
  return apiRequest<Workspace, UpdateWorkspaceInput>(`/workspaces/${workspaceId}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteWorkspace(workspaceId: string): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/workspaces/${workspaceId}`, {
    method: "DELETE",
  });
}

export type { PaginatedResponse };
