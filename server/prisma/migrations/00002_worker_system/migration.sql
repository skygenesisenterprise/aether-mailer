ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_users_last_seen_at
ON users (last_seen_at);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    resource_type TEXT NULL,
    resource_id TEXT NULL,
    metadata JSONB NULL,
    read_at TIMESTAMPTZ NULL,
    idempotency_key TEXT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
ON notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_workspace_id
ON notifications (workspace_id);

CREATE INDEX IF NOT EXISTS idx_notifications_read_at
ON notifications (read_at);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
ON notifications (created_at);

CREATE TABLE IF NOT EXISTS outbox_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    aggregate_type TEXT NOT NULL,
    aggregate_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    payload JSONB NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    published_at TIMESTAMPTZ NULL,
    last_error TEXT NULL,
    locked_at TIMESTAMPTZ NULL,
    locked_by TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_outbox_events_published_at
ON outbox_events (published_at);

CREATE INDEX IF NOT EXISTS idx_outbox_events_created_at
ON outbox_events (created_at);

CREATE INDEX IF NOT EXISTS idx_outbox_events_event_type
ON outbox_events (event_type);

CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    content_type TEXT NULL,
    storage_key TEXT NULL,
    status TEXT NOT NULL,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    metadata JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_attachments_status
ON attachments (status);

CREATE INDEX IF NOT EXISTS idx_attachments_created_at
ON attachments (created_at);
