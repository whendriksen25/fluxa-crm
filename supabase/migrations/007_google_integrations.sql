-- ============================================================
-- Bridge CRM — Migration 007
-- Google Integrations: OAuth tokens + sync tracking
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- USER INTEGRATIONS
-- Stores OAuth tokens per user per provider (Google, etc.)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'google',
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[] DEFAULT '{}',
  email_address TEXT,
  sync_enabled BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_integrations_user ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_tenant ON user_integrations(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_integrations_unique ON user_integrations(user_id, provider);


-- ────────────────────────────────────────────────────────────
-- INTEGRATION SYNC LOG
-- Tracks which external items have been synced (deduplication)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS integration_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_integration_id UUID NOT NULL REFERENCES user_integrations(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL,
  external_id TEXT NOT NULL,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_log_integration ON integration_sync_log(user_integration_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sync_log_external ON integration_sync_log(user_integration_id, sync_type, external_id);


-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User integrations scoped to tenant" ON user_integrations
  FOR ALL USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Sync log via user integration tenant" ON integration_sync_log
  FOR ALL USING (
    user_integration_id IN (
      SELECT id FROM user_integrations WHERE tenant_id = get_user_tenant_id()
    )
  );
