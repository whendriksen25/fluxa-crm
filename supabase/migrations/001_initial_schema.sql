-- ============================================================
-- Bridge CRM — Initial Database Schema (MVP — Phase 1)
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── TENANTS ──
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  billing_plan TEXT NOT NULL DEFAULT 'free' CHECK (billing_plan IN ('free', 'pro', 'enterprise')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  settings JSONB DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── USERS ──
-- Links to Supabase auth.users via id
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('owner', 'manager', 'user')),
  avatar_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── COMPANIES ──
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  size TEXT,
  website TEXT,
  phone TEXT,
  address JSONB,
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CONTACTS ──
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  job_title TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  stage TEXT DEFAULT 'lead' CHECK (stage IN ('lead', 'contacted', 'qualified', 'proposal', 'customer', 'churned')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'csv', 'import', 'scan', 'form', 'website')),
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  notes TEXT,
  last_contacted_at TIMESTAMPTZ,
  next_follow_up TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── KANBAN BOARDS ──
CREATE TABLE kanban_boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── KANBAN STAGES ──
CREATE TABLE kanban_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  position INTEGER NOT NULL DEFAULT 0,
  is_won BOOLEAN DEFAULT FALSE,
  is_lost BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── DEALS ──
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  value NUMERIC DEFAULT 0,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  board_id UUID NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES kanban_stages(id) ON DELETE CASCADE,
  stage_position INTEGER DEFAULT 0,
  expected_close_date DATE,
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ACTIVITIES ──
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'task', 'note', 'deal_moved', 'system')),
  title TEXT,
  description TEXT,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_task BOOLEAN DEFAULT FALSE,
  completed BOOLEAN DEFAULT FALSE,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── IMPORT JOBS ──
CREATE TABLE import_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('csv', 'excel')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'mapping', 'processing', 'completed', 'failed')),
  file_url TEXT,
  field_mapping JSONB DEFAULT '{}',
  total_rows INTEGER DEFAULT 0,
  processed_rows INTEGER DEFAULT 0,
  duplicates_found INTEGER DEFAULT 0,
  duplicates_merged INTEGER DEFAULT 0,
  error_log JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_companies_tenant ON companies(tenant_id);
CREATE INDEX idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_contacts_owner ON contacts(owner_id);
CREATE INDEX idx_contacts_stage ON contacts(stage);
CREATE INDEX idx_contacts_next_follow_up ON contacts(next_follow_up);
CREATE INDEX idx_deals_tenant ON deals(tenant_id);
CREATE INDEX idx_deals_board ON deals(board_id);
CREATE INDEX idx_deals_stage ON deals(stage_id);
CREATE INDEX idx_deals_contact ON deals(contact_id);
CREATE INDEX idx_deals_owner ON deals(owner_id);
CREATE INDEX idx_activities_tenant ON activities(tenant_id);
CREATE INDEX idx_activities_contact ON activities(contact_id);
CREATE INDEX idx_activities_deal ON activities(deal_id);
CREATE INDEX idx_activities_is_task ON activities(is_task) WHERE is_task = TRUE;
CREATE INDEX idx_activities_due_date ON activities(due_date) WHERE is_task = TRUE AND completed = FALSE;
CREATE INDEX idx_kanban_boards_tenant ON kanban_boards(tenant_id);
CREATE INDEX idx_kanban_stages_board ON kanban_stages(board_id);
CREATE INDEX idx_import_jobs_tenant ON import_jobs(tenant_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- Every table is scoped to tenant_id via RLS
-- ============================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;

-- Helper function: get the current user's tenant_id
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS policies — users can only see data from their own tenant

CREATE POLICY "Tenants read own" ON tenants
  FOR SELECT USING (id = get_user_tenant_id());

CREATE POLICY "Users see own tenant" ON users
  FOR ALL USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Companies scoped to tenant" ON companies
  FOR ALL USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Contacts scoped to tenant" ON contacts
  FOR ALL USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Deals scoped to tenant" ON deals
  FOR ALL USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Activities scoped to tenant" ON activities
  FOR ALL USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Boards scoped to tenant" ON kanban_boards
  FOR ALL USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Stages via board tenant" ON kanban_stages
  FOR ALL USING (
    board_id IN (SELECT id FROM kanban_boards WHERE tenant_id = get_user_tenant_id())
  );

CREATE POLICY "Import jobs scoped to tenant" ON import_jobs
  FOR ALL USING (tenant_id = get_user_tenant_id());

-- ============================================================
-- DEFAULT PIPELINE STAGES
-- Call this function after creating a new tenant to set up
-- their default kanban board and stages.
-- ============================================================

CREATE OR REPLACE FUNCTION create_default_pipeline(p_tenant_id UUID)
RETURNS UUID AS $$
DECLARE
  v_board_id UUID;
BEGIN
  -- Create the default board
  INSERT INTO kanban_boards (tenant_id, name, description, is_default)
  VALUES (p_tenant_id, 'Sales Pipeline', 'Default sales pipeline', TRUE)
  RETURNING id INTO v_board_id;

  -- Insert default stages
  INSERT INTO kanban_stages (board_id, name, color, position, is_won, is_lost) VALUES
    (v_board_id, 'New Lead',       '#6366f1', 0, FALSE, FALSE),
    (v_board_id, 'Contacted',      '#3b82f6', 1, FALSE, FALSE),
    (v_board_id, 'Proposal Sent',  '#f59e0b', 2, FALSE, FALSE),
    (v_board_id, 'Negotiation',    '#f97316', 3, FALSE, FALSE),
    (v_board_id, 'Won',            '#22c55e', 4, TRUE,  FALSE),
    (v_board_id, 'Lost',           '#ef4444', 5, FALSE, TRUE);

  RETURN v_board_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
