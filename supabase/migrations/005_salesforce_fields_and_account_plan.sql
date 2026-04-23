-- ============================================================
-- Bridge CRM — Migration 005
-- Part A: Missing Salesforce Account fields on companies table
-- Part B: Full Account Plan data model
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- PART A — SALESFORCE ACCOUNT FIELDS
-- Fields from Salesforce that are not yet in Bridge CRM
-- ────────────────────────────────────────────────────────────

-- Parent company (self-referencing FK for company hierarchies)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS parent_company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

-- Account owner (the user responsible for this company)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Number of employees
ALTER TABLE companies ADD COLUMN IF NOT EXISTS employees INTEGER;

-- Account rating (e.g. Hot, Warm, Cold)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS rating TEXT;

-- Currency the account operates in (e.g. EUR, USD)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS account_currency TEXT DEFAULT 'EUR';

-- Whether this company is a competitor
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_competitor BOOLEAN DEFAULT FALSE;

-- Internal customer number (from ERP or legacy system)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS customer_number TEXT;

-- VAT number
ALTER TABLE companies ADD COLUMN IF NOT EXISTS vat_number TEXT;

-- Channel type (e.g. Direct, Distributor, Partner)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS channel_type TEXT;

-- Classification (e.g. A, B, C tier)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS classification TEXT;

-- High potential flag
ALTER TABLE companies ADD COLUMN IF NOT EXISTS high_potential BOOLEAN DEFAULT FALSE;

-- Revenue: current financial year
ALTER TABLE companies ADD COLUMN IF NOT EXISTS revenue_current_fy NUMERIC DEFAULT 0;

-- Revenue: previous financial year
ALTER TABLE companies ADD COLUMN IF NOT EXISTS revenue_previous_fy NUMERIC DEFAULT 0;

-- Revenue: year-to-date of previous year
ALTER TABLE companies ADD COLUMN IF NOT EXISTS revenue_ytd_previous_year NUMERIC DEFAULT 0;

-- Date when financial data was last updated
ALTER TABLE companies ADD COLUMN IF NOT EXISTS financial_data_updated DATE;

-- Description (free text about the company)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS description TEXT;

-- Indexes for new Salesforce fields
CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_parent ON companies(parent_company_id);
CREATE INDEX IF NOT EXISTS idx_companies_classification ON companies(classification);
CREATE INDEX IF NOT EXISTS idx_companies_customer_number ON companies(customer_number);


-- ────────────────────────────────────────────────────────────
-- PART B — ACCOUNT PLANS
-- Strategic account planning: overview, stakeholders,
-- coverage heatmap, value architecture, whitespace,
-- competitive landscape, and action plan
-- ────────────────────────────────────────────────────────────

-- ── ACCOUNT PLANS (one per company) ──
CREATE TABLE IF NOT EXISTS account_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Header-level fields
  account_type TEXT DEFAULT 'Growth' CHECK (account_type IN ('Strategic', 'Growth', 'Maintain', 'Monitor', 'New')),
  has_active_opportunity BOOLEAN DEFAULT FALSE,
  renewal_date DATE,
  account_health INTEGER DEFAULT 0 CHECK (account_health BETWEEN 0 AND 100),
  current_arr NUMERIC DEFAULT 0,
  potential_arr NUMERIC DEFAULT 0,
  coverage_pct INTEGER DEFAULT 0 CHECK (coverage_pct BETWEEN 0 AND 100),
  risk_level TEXT DEFAULT 'Low' CHECK (risk_level IN ('Low', 'Medium', 'High')),
  next_event_name TEXT,
  next_event_days INTEGER,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Overview tab
  engagement_score INTEGER DEFAULT 0 CHECK (engagement_score BETWEEN 0 AND 100),
  open_pipeline NUMERIC DEFAULT 0,
  stakeholders_mapped INTEGER DEFAULT 0,
  stakeholders_total INTEGER DEFAULT 0,
  next_critical_event TEXT,
  next_critical_event_date DATE,

  -- Account Intelligence
  revenue_and_growth TEXT,
  buying_dynamics TEXT,
  live_signals TEXT[],

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- One plan per company (unique constraint)
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_plans_company ON account_plans(company_id);
CREATE INDEX IF NOT EXISTS idx_account_plans_tenant ON account_plans(tenant_id);


-- ── ACCOUNT PLAN OBJECTIVES ──
-- Client strategic priorities + account objectives (Overview tab)
CREATE TABLE IF NOT EXISTS account_plan_objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_plan_id UUID NOT NULL REFERENCES account_plans(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('client_priority', 'account_objective')),
  description TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_objectives_plan ON account_plan_objectives(account_plan_id);


-- ── ACCOUNT PLAN SWOT ──
-- SWOT analysis entries (Overview tab)
CREATE TABLE IF NOT EXISTS account_plan_swot (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_plan_id UUID NOT NULL REFERENCES account_plans(id) ON DELETE CASCADE,
  quadrant TEXT NOT NULL CHECK (quadrant IN ('strength', 'weakness', 'opportunity', 'threat')),
  description TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_swot_plan ON account_plan_swot(account_plan_id);


-- ── ACCOUNT STAKEHOLDERS ──
-- Influence Network tab
CREATE TABLE IF NOT EXISTS account_stakeholders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_plan_id UUID NOT NULL REFERENCES account_plans(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

  -- Display info (used when no linked contact)
  name TEXT NOT NULL,
  title TEXT,

  -- Influence mapping
  influence_weight INTEGER DEFAULT 5 CHECK (influence_weight BETWEEN 1 AND 10),
  stance TEXT DEFAULT 'Unknown' CHECK (stance IN ('Champion', 'Supporter', 'Neutral', 'Neutral+', 'Risk', 'Unknown')),
  role_type TEXT CHECK (role_type IN ('Economic Buyer', 'Technical Evaluator', 'End User', 'Influencer', 'External Advisor', 'Executive Sponsor')),
  is_external BOOLEAN DEFAULT FALSE,

  -- Visual positioning (for network diagram)
  ring INTEGER DEFAULT 2 CHECK (ring BETWEEN 1 AND 3),
  angle INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stakeholders_plan ON account_stakeholders(account_plan_id);
CREATE INDEX IF NOT EXISTS idx_stakeholders_contact ON account_stakeholders(contact_id);


-- ── STAKEHOLDER CONNECTIONS ──
-- Influence flow between stakeholders
CREATE TABLE IF NOT EXISTS account_stakeholder_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_plan_id UUID NOT NULL REFERENCES account_plans(id) ON DELETE CASCADE,
  from_stakeholder_id UUID NOT NULL REFERENCES account_stakeholders(id) ON DELETE CASCADE,
  to_stakeholder_id UUID NOT NULL REFERENCES account_stakeholders(id) ON DELETE CASCADE,
  connection_type TEXT DEFAULT 'org' CHECK (connection_type IN ('org', 'champion', 'risk', 'positive', 'influence')),
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stk_connections_plan ON account_stakeholder_connections(account_plan_id);


-- ── ACCOUNT ACTIONS ──
-- Action Timeline tab + Action Plan tab
CREATE TABLE IF NOT EXISTS account_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_plan_id UUID NOT NULL REFERENCES account_plans(id) ON DELETE CASCADE,
  action_code TEXT,
  priority TEXT DEFAULT 'P2' CHECK (priority IN ('P1', 'P2', 'P3')),
  title TEXT NOT NULL,
  description TEXT,
  owner_name TEXT,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date DATE,
  linked_stakeholder_id UUID REFERENCES account_stakeholders(id) ON DELETE SET NULL,
  linked_stakeholder_name TEXT,
  status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Completed', 'Blocked')),
  notes TEXT,
  is_milestone BOOLEAN DEFAULT FALSE,
  is_external_event BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_actions_plan ON account_actions(account_plan_id);
CREATE INDEX IF NOT EXISTS idx_actions_status ON account_actions(status);
CREATE INDEX IF NOT EXISTS idx_actions_due ON account_actions(due_date);


-- ── COVERAGE HEATMAP ──
-- Business units the account has
CREATE TABLE IF NOT EXISTS account_business_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_plan_id UUID NOT NULL REFERENCES account_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bus_units_plan ON account_business_units(account_plan_id);

-- Buying roles for the account
CREATE TABLE IF NOT EXISTS account_buying_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_plan_id UUID NOT NULL REFERENCES account_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buying_roles_plan ON account_buying_roles(account_plan_id);

-- Coverage cells (the heatmap itself: role × business unit)
CREATE TABLE IF NOT EXISTS account_coverage_cells (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_plan_id UUID NOT NULL REFERENCES account_plans(id) ON DELETE CASCADE,
  business_unit_id UUID NOT NULL REFERENCES account_business_units(id) ON DELETE CASCADE,
  buying_role_id UUID NOT NULL REFERENCES account_buying_roles(id) ON DELETE CASCADE,
  coverage_status TEXT DEFAULT 'None' CHECK (coverage_status IN ('Strong', 'Active', 'Developing', 'None', 'Blocked')),
  contact_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coverage_cells_plan ON account_coverage_cells(account_plan_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_coverage_cells_unique ON account_coverage_cells(business_unit_id, buying_role_id);


-- ── VALUE ARCHITECTURE ──
-- Value map entries (Value Architecture tab)
CREATE TABLE IF NOT EXISTS account_value_map (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_plan_id UUID NOT NULL REFERENCES account_plans(id) ON DELETE CASCADE,
  stakeholder_id UUID REFERENCES account_stakeholders(id) ON DELETE SET NULL,
  stakeholder_name TEXT,
  business_pain TEXT,
  theme TEXT CHECK (theme IN ('Digital', 'Cost', 'Risk', 'CX', 'Growth', 'Other')),
  our_capability TEXT,
  value_hypothesis TEXT,
  quantified_impact NUMERIC DEFAULT 0,
  quantified_impact_label TEXT,
  status TEXT DEFAULT 'Hypothesis' CHECK (status IN ('Validated', 'In Progress', 'Hypothesis')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_value_map_plan ON account_value_map(account_plan_id);


-- ── WHITESPACE ANALYSIS ──
-- Solutions offered
CREATE TABLE IF NOT EXISTS account_solutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_plan_id UUID NOT NULL REFERENCES account_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_solutions_plan ON account_solutions(account_plan_id);

-- Whitespace cells (business unit × solution)
CREATE TABLE IF NOT EXISTS account_whitespace_cells (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_plan_id UUID NOT NULL REFERENCES account_plans(id) ON DELETE CASCADE,
  business_unit_id UUID NOT NULL REFERENCES account_business_units(id) ON DELETE CASCADE,
  solution_id UUID NOT NULL REFERENCES account_solutions(id) ON DELETE CASCADE,
  penetration_status TEXT DEFAULT 'Whitespace' CHECK (penetration_status IN ('Active', 'Exploring', 'Whitespace', 'Competitor-held', 'Blocked')),
  competitor_name TEXT,
  revenue_potential NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whitespace_plan ON account_whitespace_cells(account_plan_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_whitespace_unique ON account_whitespace_cells(business_unit_id, solution_id);


-- ── COMPETITORS ──
-- Competitive landscape (Competitive tab)
CREATE TABLE IF NOT EXISTS account_competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_plan_id UUID NOT NULL REFERENCES account_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  competitor_type TEXT,
  threat_level TEXT DEFAULT 'Monitor' CHECK (threat_level IN ('High Threat', 'Medium Threat', 'Low Threat', 'Monitor')),
  threat_score INTEGER DEFAULT 0 CHECK (threat_score BETWEEN 0 AND 100),
  strengths TEXT[],
  counter_play TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competitors_plan ON account_competitors(account_plan_id);


-- ── ADVISOR ALLEGIANCE ──
-- Consultants and advisors (Competitive tab)
CREATE TABLE IF NOT EXISTS account_advisors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_plan_id UUID NOT NULL REFERENCES account_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  firm TEXT,
  engaged_by TEXT,
  engagement_context TEXT,
  allegiance_score INTEGER DEFAULT 50 CHECK (allegiance_score BETWEEN 0 AND 100),
  allegiance_label TEXT DEFAULT 'Independent' CHECK (allegiance_label IN ('Partner-aligned', 'Neutral+', 'Independent', 'Competitor-aligned', 'Risk')),
  notes TEXT,
  action_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advisors_plan ON account_advisors(account_plan_id);


-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY for all new tables
-- ────────────────────────────────────────────────────────────

ALTER TABLE account_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_plan_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_plan_swot ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_stakeholder_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_buying_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_coverage_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_value_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_whitespace_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_advisors ENABLE ROW LEVEL SECURITY;

-- RLS policies — all scoped to tenant via account_plans
CREATE POLICY "Account plans scoped to tenant" ON account_plans
  FOR ALL USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Plan objectives via plan tenant" ON account_plan_objectives
  FOR ALL USING (
    account_plan_id IN (SELECT id FROM account_plans WHERE tenant_id = get_user_tenant_id())
  );

CREATE POLICY "Plan SWOT via plan tenant" ON account_plan_swot
  FOR ALL USING (
    account_plan_id IN (SELECT id FROM account_plans WHERE tenant_id = get_user_tenant_id())
  );

CREATE POLICY "Stakeholders via plan tenant" ON account_stakeholders
  FOR ALL USING (
    account_plan_id IN (SELECT id FROM account_plans WHERE tenant_id = get_user_tenant_id())
  );

CREATE POLICY "Stakeholder connections via plan tenant" ON account_stakeholder_connections
  FOR ALL USING (
    account_plan_id IN (SELECT id FROM account_plans WHERE tenant_id = get_user_tenant_id())
  );

CREATE POLICY "Actions via plan tenant" ON account_actions
  FOR ALL USING (
    account_plan_id IN (SELECT id FROM account_plans WHERE tenant_id = get_user_tenant_id())
  );

CREATE POLICY "Business units via plan tenant" ON account_business_units
  FOR ALL USING (
    account_plan_id IN (SELECT id FROM account_plans WHERE tenant_id = get_user_tenant_id())
  );

CREATE POLICY "Buying roles via plan tenant" ON account_buying_roles
  FOR ALL USING (
    account_plan_id IN (SELECT id FROM account_plans WHERE tenant_id = get_user_tenant_id())
  );

CREATE POLICY "Coverage cells via plan tenant" ON account_coverage_cells
  FOR ALL USING (
    account_plan_id IN (SELECT id FROM account_plans WHERE tenant_id = get_user_tenant_id())
  );

CREATE POLICY "Value map via plan tenant" ON account_value_map
  FOR ALL USING (
    account_plan_id IN (SELECT id FROM account_plans WHERE tenant_id = get_user_tenant_id())
  );

CREATE POLICY "Solutions via plan tenant" ON account_solutions
  FOR ALL USING (
    account_plan_id IN (SELECT id FROM account_plans WHERE tenant_id = get_user_tenant_id())
  );

CREATE POLICY "Whitespace cells via plan tenant" ON account_whitespace_cells
  FOR ALL USING (
    account_plan_id IN (SELECT id FROM account_plans WHERE tenant_id = get_user_tenant_id())
  );

CREATE POLICY "Competitors via plan tenant" ON account_competitors
  FOR ALL USING (
    account_plan_id IN (SELECT id FROM account_plans WHERE tenant_id = get_user_tenant_id())
  );

CREATE POLICY "Advisors via plan tenant" ON account_advisors
  FOR ALL USING (
    account_plan_id IN (SELECT id FROM account_plans WHERE tenant_id = get_user_tenant_id())
  );
