import { apiListRequest, apiRequest } from "@/lib/api/client";
import { toCursorSearchParams, type CursorPaginationParams } from "@/lib/api/pagination";
import type { Notification, NotificationPreferences, PaginatedResponse } from "@/lib/api/types";

export async function listNotifications(pagination?: CursorPaginationParams): Promise<PaginatedResponse<Notification>> {
  const params = toCursorSearchParams(pagination);
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return apiListRequest<Notification>(`/notifications${suffix}`);
}

export function getUnreadNotificationCount(): Promise<{ count: number }> {
  return apiRequest<{ count: number }>("/notifications/unread-count");
}

export function markNotificationRead(notificationId: string): Promise<{ updated: boolean }> {
  return apiRequest<{ updated: boolean }>(`/notifications/${notificationId}/read`, {
    method: "POST",
  });
}

export function markAllNotificationsRead(): Promise<{ updated: boolean }> {
  return apiRequest<{ updated: boolean }>("/notifications/read-all", {
    method: "POST",
  });
}

export function getNotificationPreferences(): Promise<NotificationPreferences> {
  return apiRequest<NotificationPreferences>("/me/notification-preferences");
}

export function updateNotificationPreferences(
  input: NotificationPreferences
): Promise<NotificationPreferences> {
  return apiRequest<NotificationPreferences, NotificationPreferences>("/me/notification-preferences", {
    method: "PATCH",
    body: input,
  });
}
