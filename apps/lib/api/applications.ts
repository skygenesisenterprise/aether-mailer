import { apiListRequest, apiRequest } from "@/lib/api/client";
import type { Application } from "@/lib/api/types";

export interface ApplicationInput {
  provider?: string;
  name?: string;
  status?: string;
  configuration?: Record<string, unknown>;
}

export async function listApplications(workspaceId: string): Promise<Application[]> {
  const response = await apiListRequest<Application>(`/workspaces/${workspaceId}/applications`);
  return response.data;
}

export function createApplication(workspaceId: string, input: ApplicationInput): Promise<Application> {
  return apiRequest<Application, ApplicationInput>(`/workspaces/${workspaceId}/applications`, {
    method: "POST",
    body: input,
  });
}

export function getApplication(applicationId: string): Promise<Application> {
  return apiRequest<Application>(`/applications/${applicationId}`);
}

export function updateApplication(applicationId: string, input: ApplicationInput): Promise<Application> {
  return apiRequest<Application, ApplicationInput>(`/applications/${applicationId}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteApplication(applicationId: string): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/applications/${applicationId}`, {
    method: "DELETE",
  });
}
