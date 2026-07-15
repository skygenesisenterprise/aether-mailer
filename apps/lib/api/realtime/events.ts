export interface RealtimeWireEvent<T = Record<string, unknown>> {
  id: string;
  type: string;
  workspaceId?: string;
  conversationId?: string;
  actorId?: string;
  timestamp: string;
  payload?: T;
}

export interface RealtimeEvent<T = Record<string, unknown>> {
  id: string;
  type: string;
  workspaceId?: string;
  resourceId?: string;
  actorId?: string;
  conversationId?: string;
  occurredAt: string;
  data: T;
}

export function normalizeRealtimeEvent<T = Record<string, unknown>>(
  event: RealtimeWireEvent<T>
): RealtimeEvent<T> {
  const payload = (event.payload ?? {}) as T & { resourceId?: string; meetingId?: string; messageId?: string };

  return {
    id: event.id,
    type: event.type,
    workspaceId: event.workspaceId,
    actorId: event.actorId,
    conversationId: event.conversationId,
    resourceId: payload.resourceId ?? payload.meetingId ?? payload.messageId,
    occurredAt: event.timestamp,
    data: payload,
  };
}
