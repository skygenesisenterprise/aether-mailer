import { apiRequest } from "@/lib/api/client";
import type { User } from "@/lib/api/types";

export function getUser(userId: string): Promise<User> {
  return apiRequest<User>(`/users/${userId}`);
}

export function listUsers(workspaceId: string): Promise<User[]> {
  return apiRequest<User[]>(`/workspaces/${workspaceId}/users`);
}
