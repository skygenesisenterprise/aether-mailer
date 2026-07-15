import test from "node:test";
import assert from "node:assert/strict";

import { normalizeRealtimeEvent } from "../../lib/api/realtime/events.ts";
import { getReconnectDelay } from "../../lib/api/realtime/reconnect.ts";

test("normalizeRealtimeEvent maps wire payload to client payload", () => {
  const event = normalizeRealtimeEvent({
    id: "evt-1",
    type: "message.created",
    workspaceId: "ws-1",
    timestamp: "2026-06-27T12:00:00Z",
    payload: {
      messageId: "msg-1",
      conversationId: "conv-1",
    },
  });

  assert.equal(event.id, "evt-1");
  assert.equal(event.workspaceId, "ws-1");
  assert.equal(event.resourceId, "msg-1");
  assert.equal(event.occurredAt, "2026-06-27T12:00:00Z");
});

test("getReconnectDelay backs off and stays bounded", () => {
  const first = getReconnectDelay(0);
  const later = getReconnectDelay(5);

  assert.ok(first >= 1_000);
  assert.ok(later >= first);
  assert.ok(later <= 30_300);
});
