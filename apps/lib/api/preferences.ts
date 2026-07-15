import { apiRequest } from "@/lib/api/client";
import type { UserPreferences } from "@/lib/api/types";

export function getPreferences(): Promise<UserPreferences> {
  return apiRequest<UserPreferences>("/me/preferences");
}

export function updatePreferences(input: UserPreferences): Promise<UserPreferences> {
  return apiRequest<UserPreferences, UserPreferences>("/me/preferences", {
    method: "PATCH",
    body: input,
  });
}
