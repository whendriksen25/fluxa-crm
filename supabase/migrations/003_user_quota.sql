-- ============================================================
-- Bridge CRM — User Quota + Team Quota
-- Adds quota field for role-based dashboards
-- ============================================================

-- Per-user quarterly revenue target (e.g. 500000 = €500K)
ALTER TABLE users ADD COLUMN IF NOT EXISTS quota NUMERIC DEFAULT 0;
