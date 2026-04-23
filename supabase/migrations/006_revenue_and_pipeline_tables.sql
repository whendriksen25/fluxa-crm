-- ============================================================
-- Bridge CRM — Migration 006
-- Revenue Forecasts, Pipeline Opportunities, and Risk Tracking
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- ACCOUNT REVENUE FORECASTS
-- Monthly forecast data points for Revenue Forecast tab
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS account_revenue_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_plan_id UUID NOT NULL REFERENCES account_plans(id) ON DELETE CASCADE,
  month_label TEXT NOT NULL,
  month_index INTEGER NOT NULL,
  pipeline_value NUMERIC DEFAULT 0,
  closed_value NUMERIC DEFAULT 0,
  activity_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_forecasts_plan ON account_revenue_forecasts(account_plan_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_revenue_forecasts_unique ON account_revenue_forecasts(account_plan_id, month_index);


-- ────────────────────────────────────────────────────────────
-- ACCOUNT REVENUE EVENTS
-- Milestone markers on the forecast chart
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS account_revenue_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_plan_id UUID NOT NULL REFERENCES account_plans(id) ON DELETE CASCADE,
  month_index INTEGER NOT NULL,
  label TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_events_plan ON account_revenue_events(account_plan_id);


-- ────────────────────────────────────────────────────────────
-- ACCOUNT OPPORTUNITIES
-- Pipeline opportunities with win probability and risk
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS account_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_plan_id UUID NOT NULL REFERENCES account_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  business_unit TEXT,
  value NUMERIC NOT NULL,
  decision_date TEXT,
  actions TEXT,
  win_probability NUMERIC NOT NULL DEFAULT 50,
  status TEXT DEFAULT 'Open',
  competitor_risk TEXT,
  risk_percentage NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_plan ON account_opportunities(account_plan_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON account_opportunities(status);


-- ────────────────────────────────────────────────────────────
-- ACCOUNT PIPELINE RISK
-- Monthly pipeline risk data for competitive chart
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS account_pipeline_risk (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_plan_id UUID NOT NULL REFERENCES account_plans(id) ON DELETE CASCADE,
  month_label TEXT NOT NULL,
  month_index INTEGER NOT NULL,
  pipeline_value NUMERIC DEFAULT 0,
  at_risk_value NUMERIC DEFAULT 0,
  counter_actions INTEGER DEFAULT 0,
  net_win_value NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_risk_plan ON account_pipeline_risk(account_plan_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pipeline_risk_unique ON account_pipeline_risk(account_plan_id, month_index);


-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY for all new tables
-- ────────────────────────────────────────────────────────────

ALTER TABLE account_revenue_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_revenue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_pipeline_risk ENABLE ROW LEVEL SECURITY;

-- RLS policies — all scoped to tenant via account_plans
CREATE POLICY "Revenue forecasts via plan tenant" ON account_revenue_forecasts
  FOR ALL USING (
    account_plan_id IN (SELECT id FROM account_plans WHERE tenant_id = get_user_tenant_id())
  );

CREATE POLICY "Revenue events via plan tenant" ON account_revenue_events
  FOR ALL USING (
    account_plan_id IN (SELECT id FROM account_plans WHERE tenant_id = get_user_tenant_id())
  );

CREATE POLICY "Opportunities via plan tenant" ON account_opportunities
  FOR ALL USING (
    account_plan_id IN (SELECT id FROM account_plans WHERE tenant_id = get_user_tenant_id())
  );

CREATE POLICY "Pipeline risk via plan tenant" ON account_pipeline_risk
  FOR ALL USING (
    account_plan_id IN (SELECT id FROM account_plans WHERE tenant_id = get_user_tenant_id())
  );
