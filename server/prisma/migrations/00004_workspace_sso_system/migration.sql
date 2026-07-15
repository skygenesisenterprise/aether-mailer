CREATE TABLE IF NOT EXISTS workspace_sso_configs (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL DEFAULT 'oidc',
    enabled BOOLEAN NOT NULL DEFAULT false,
    enforce_sso BOOLEAN NOT NULL DEFAULT false,
    allow_password_auth BOOLEAN NOT NULL DEFAULT true,
    auto_provision BOOLEAN NOT NULL DEFAULT true,
    allow_idp_initiated BOOLEAN NOT NULL DEFAULT false,
    domain_hint TEXT NULL,
    issuer_url TEXT NULL,
    sso_url TEXT NULL,
    entity_id TEXT NULL,
    client_id TEXT NULL,
    client_secret TEXT NULL,
    certificate TEXT NULL,
    allowed_domains JSONB NOT NULL DEFAULT '[]'::jsonb,
    default_role TEXT NOT NULL DEFAULT 'member',
    attribute_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workspace_sso_configs_provider
ON workspace_sso_configs (provider);
