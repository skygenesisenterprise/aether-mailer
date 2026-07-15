import { apiListRequest, apiRequest } from "@/lib/api/client";
import type {
  CreateWorkspaceMemberInput,
  ProvisionWorkspaceUserInput,
  UpdateWorkspaceMemberInput,
  WorkspaceMember,
} from "@/lib/api/types";

export async function listWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const response = await apiListRequest<WorkspaceMember>(`/workspaces/${workspaceId}/members`);
  return response.data;
}

export function createWorkspaceMember(workspaceId: string, input: CreateWorkspaceMemberInput): Promise<WorkspaceMember> {
  return apiRequest<WorkspaceMember, CreateWorkspaceMemberInput>(`/workspaces/${workspaceId}/members`, {
    method: "POST",
    body: input,
  });
}

export function provisionWorkspaceUser(
  workspaceId: string,
  input: ProvisionWorkspaceUserInput
): Promise<WorkspaceMember> {
  return apiRequest<WorkspaceMember, ProvisionWorkspaceUserInput>(`/workspaces/${workspaceId}/members/provision`, {
    method: "POST",
    body: input,
  });
}

export function updateWorkspaceMember(
  workspaceId: string,
  userId: string,
  input: UpdateWorkspaceMemberInput
): Promise<WorkspaceMember> {
  return apiRequest<WorkspaceMember, UpdateWorkspaceMemberInput>(
    `/workspaces/${workspaceId}/members/${userId}`,
    {
      method: "PATCH",
      body: input,
    }
  );
}

export function deleteWorkspaceMember(workspaceId: string, userId: string): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/workspaces/${workspaceId}/members/${userId}`, {
    method: "DELETE",
  });
}
