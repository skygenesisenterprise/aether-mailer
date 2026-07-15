ALTER TABLE meetings
ADD COLUMN IF NOT EXISTS provider_room_id TEXT NULL;

ALTER TABLE meeting_participants
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'attendee',
ADD COLUMN IF NOT EXISTS metadata JSONB NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_meeting_participants_meeting_user
ON meeting_participants (meeting_id, user_id);

CREATE TABLE IF NOT EXISTS meeting_sessions (
    id TEXT PRIMARY KEY,
    meeting_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_room_name TEXT NOT NULL,
    provider_room_id TEXT NULL,
    node_id TEXT NOT NULL,
    status TEXT NOT NULL,
    public_url TEXT NOT NULL,
    signaling_url TEXT NOT NULL,
    connection_details JSONB NULL,
    started_at TIMESTAMPTZ NULL,
    ended_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_meeting_sessions_provider_room_name
ON meeting_sessions (provider_room_name);

CREATE INDEX IF NOT EXISTS idx_meeting_sessions_meeting_id
ON meeting_sessions (meeting_id);

CREATE INDEX IF NOT EXISTS idx_meeting_sessions_workspace_id
ON meeting_sessions (workspace_id);

CREATE INDEX IF NOT EXISTS idx_meeting_sessions_status
ON meeting_sessions (status);

CREATE INDEX IF NOT EXISTS idx_meeting_sessions_provider_room_id
ON meeting_sessions (provider_room_id);

CREATE TABLE IF NOT EXISTS meeting_session_participants (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    provider_identity TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL,
    metadata JSONB NULL,
    joined_at TIMESTAMPTZ NULL,
    left_at TIMESTAMPTZ NULL,
    last_seen_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_meeting_session_participants_identity
ON meeting_session_participants (session_id, provider_identity);

CREATE INDEX IF NOT EXISTS idx_meeting_session_participants_session_id
ON meeting_session_participants (session_id);

CREATE INDEX IF NOT EXISTS idx_meeting_session_participants_workspace_id
ON meeting_session_participants (workspace_id);

CREATE INDEX IF NOT EXISTS idx_meeting_session_participants_user_id
ON meeting_session_participants (user_id);

CREATE TABLE IF NOT EXISTS webrtc_nodes (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    region TEXT NOT NULL,
    internal_url TEXT NOT NULL,
    public_url TEXT NOT NULL,
    status TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 0,
    active_rooms INTEGER NOT NULL DEFAULT 0,
    active_participants INTEGER NOT NULL DEFAULT 0,
    last_heartbeat_at TIMESTAMPTZ NULL,
    draining BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webrtc_nodes_provider_status
ON webrtc_nodes (provider, status);

CREATE INDEX IF NOT EXISTS idx_webrtc_nodes_region
ON webrtc_nodes (region);

CREATE TABLE IF NOT EXISTS webrtc_webhook_events (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    workspace_id TEXT NULL,
    meeting_id TEXT NULL,
    session_id TEXT NULL,
    provider_room TEXT NULL,
    received_at TIMESTAMPTZ NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_webrtc_webhook_events_provider_event
ON webrtc_webhook_events (provider, event_id);

CREATE INDEX IF NOT EXISTS idx_webrtc_webhook_events_meeting_id
ON webrtc_webhook_events (meeting_id);

CREATE INDEX IF NOT EXISTS idx_webrtc_webhook_events_session_id
ON webrtc_webhook_events (session_id);
