import { apiRequest } from "@/lib/api/client";
import type { User } from "@/lib/api/types";

export interface UpdateMeInput {
  displayName?: string;
  avatarUrl?: string;
  status?: string;
}

export function getMe(): Promise<User> {
  return apiRequest<User>("/me");
}

export function updateMe(input: UpdateMeInput): Promise<User> {
  return apiRequest<User, UpdateMeInput>("/me", {
    method: "PATCH",
    body: input,
  });
}
