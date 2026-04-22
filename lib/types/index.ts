// Bridge CRM — Core type definitions (MVP — Phase 1)
// These types mirror the Supabase database schema defined in project_specs.md

export type Role = 'owner' | 'manager' | 'user'
export type BillingPlan = 'free' | 'pro' | 'enterprise'
export type ContactStage = 'lead' | 'contacted' | 'qualified' | 'proposal' | 'customer' | 'churned'
export type ContactSource = 'manual' | 'csv' | 'import' | 'scan' | 'form' | 'website'
export type ActivityType = 'call' | 'email' | 'meeting' | 'task' | 'note' | 'deal_moved' | 'system'
export type ImportSource = 'csv' | 'excel'
export type ImportStatus = 'pending' | 'mapping' | 'processing' | 'completed' | 'failed'

export interface Tenant {
  id: string
  name: string
  slug: string
  billing_plan: BillingPlan
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  settings: Record<string, unknown>
  onboarding_completed: boolean
  created_at: string
}

export interface User {
  id: string
  tenant_id: string
  email: string
  full_name: string
  role: Role
  avatar_url: string | null
  settings: Record<string, unknown>
  created_at: string
}

export interface Company {
  id: string
  tenant_id: string
  name: string
  domain: string | null
  industry: string | null
  size: string | null
  website: string | null
  phone: string | null
  address: Record<string, unknown> | null
  notes: string | null
  custom_fields: Record<string, unknown>
  category: string | null
  country: string | null
  region: string | null
  segment: string | null
  relevance: string | null
  network_group: string | null
  location: string | null
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  tenant_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  job_title: string | null
  company_id: string | null
  stage: ContactStage
  source: ContactSource
  lead_source: string | null
  owner_id: string | null
  tags: string[]
  custom_fields: Record<string, unknown>
  notes: string | null
  last_contacted_at: string | null
  next_follow_up: string | null
  created_at: string
  updated_at: string
}

export interface Deal {
  id: string
  tenant_id: string
  title: string
  value: number
  company_id: string | null
  contact_id: string | null
  owner_id: string | null
  board_id: string
  stage_id: string
  stage_position: number
  expected_close_date: string | null
  notes: string | null
  custom_fields: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  tenant_id: string
  type: ActivityType
  title: string | null
  description: string | null
  contact_id: string | null
  deal_id: string | null
  company_id: string | null
  user_id: string
  is_task: boolean
  completed: boolean
  due_date: string | null
  completed_at: string | null
  created_at: string
}

export interface KanbanBoard {
  id: string
  tenant_id: string
  name: string
  description: string | null
  is_default: boolean
  created_at: string
}

export interface KanbanStage {
  id: string
  board_id: string
  name: string
  color: string
  position: number
  is_won: boolean
  is_lost: boolean
  created_at: string
}

// ── Account Plan types ──

export type AccountType = 'Strategic' | 'Growth' | 'Maintain' | 'Monitor' | 'New'
export type RiskLevel = 'Low' | 'Medium' | 'High'
export type StakeholderStance = 'Champion' | 'Supporter' | 'Neutral' | 'Neutral+' | 'Risk' | 'Unknown'
export type StakeholderRoleType = 'Economic Buyer' | 'Technical Evaluator' | 'End User' | 'Influencer' | 'External Advisor' | 'Executive Sponsor'
export type ActionPriority = 'P1' | 'P2' | 'P3'
export type ActionStatus = 'Open' | 'In Progress' | 'Completed' | 'Blocked'
export type CoverageStatus = 'Strong' | 'Active' | 'Developing' | 'None' | 'Blocked'
export type ValueTheme = 'Digital' | 'Cost' | 'Risk' | 'CX' | 'Growth' | 'Other'
export type ValueStatus = 'Validated' | 'In Progress' | 'Hypothesis'
export type PenetrationStatus = 'Active' | 'Exploring' | 'Whitespace' | 'Competitor-held' | 'Blocked'
export type ThreatLevel = 'High Threat' | 'Medium Threat' | 'Low Threat' | 'Monitor'
export type AllegianceLabel = 'Partner-aligned' | 'Neutral+' | 'Independent' | 'Competitor-aligned' | 'Risk'
export type ConnectionType = 'org' | 'champion' | 'risk' | 'positive' | 'influence'
export type SwotQuadrant = 'strength' | 'weakness' | 'opportunity' | 'threat'
export type ObjectiveType = 'client_priority' | 'account_objective'

export interface AccountPlan {
  id: string
  tenant_id: string
  company_id: string
  account_type: AccountType
  has_active_opportunity: boolean
  renewal_date: string | null
  account_health: number
  current_arr: number
  potential_arr: number
  coverage_pct: number
  risk_level: RiskLevel
  next_event_name: string | null
  next_event_days: number | null
  owner_id: string | null
  engagement_score: number
  open_pipeline: number
  stakeholders_mapped: number
  stakeholders_total: number
  next_critical_event: string | null
  next_critical_event_date: string | null
  revenue_and_growth: string | null
  buying_dynamics: string | null
  live_signals: string[]
  created_at: string
  updated_at: string
}

export interface AccountPlanObjective {
  id: string
  account_plan_id: string
  type: ObjectiveType
  description: string
  position: number
  created_at: string
}

export interface AccountPlanSwot {
  id: string
  account_plan_id: string
  quadrant: SwotQuadrant
  description: string
  position: number
  created_at: string
}

export interface AccountStakeholder {
  id: string
  account_plan_id: string
  contact_id: string | null
  name: string
  title: string | null
  influence_weight: number
  stance: StakeholderStance
  role_type: StakeholderRoleType | null
  is_external: boolean
  ring: number
  angle: number
  created_at: string
  updated_at: string
}

export interface AccountStakeholderConnection {
  id: string
  account_plan_id: string
  from_stakeholder_id: string
  to_stakeholder_id: string
  connection_type: ConnectionType
  label: string | null
  created_at: string
}

export interface AccountAction {
  id: string
  account_plan_id: string
  action_code: string | null
  priority: ActionPriority
  title: string
  description: string | null
  owner_name: string | null
  owner_id: string | null
  due_date: string | null
  linked_stakeholder_id: string | null
  linked_stakeholder_name: string | null
  status: ActionStatus
  notes: string | null
  is_milestone: boolean
  is_external_event: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface AccountBusinessUnit {
  id: string
  account_plan_id: string
  name: string
  position: number
  created_at: string
}

export interface AccountBuyingRole {
  id: string
  account_plan_id: string
  name: string
  position: number
  created_at: string
}

export interface AccountCoverageCell {
  id: string
  account_plan_id: string
  business_unit_id: string
  buying_role_id: string
  coverage_status: CoverageStatus
  contact_name: string | null
  created_at: string
}

export interface AccountValueMap {
  id: string
  account_plan_id: string
  stakeholder_id: string | null
  stakeholder_name: string | null
  business_pain: string | null
  theme: ValueTheme | null
  our_capability: string | null
  value_hypothesis: string | null
  quantified_impact: number
  quantified_impact_label: string | null
  status: ValueStatus
  created_at: string
  updated_at: string
}

export interface AccountSolution {
  id: string
  account_plan_id: string
  name: string
  position: number
  created_at: string
}

export interface AccountWhitespaceCell {
  id: string
  account_plan_id: string
  business_unit_id: string
  solution_id: string
  penetration_status: PenetrationStatus
  competitor_name: string | null
  revenue_potential: number
  notes: string | null
  created_at: string
}

export interface AccountCompetitor {
  id: string
  account_plan_id: string
  name: string
  competitor_type: string | null
  threat_level: ThreatLevel
  threat_score: number
  strengths: string[]
  counter_play: string | null
  created_at: string
  updated_at: string
}

export interface AccountAdvisor {
  id: string
  account_plan_id: string
  name: string
  firm: string | null
  engaged_by: string | null
  engagement_context: string | null
  allegiance_score: number
  allegiance_label: AllegianceLabel
  notes: string | null
  action_note: string | null
  created_at: string
  updated_at: string
}

export interface AccountRevenueForecast {
  id: string
  account_plan_id: string
  month_label: string
  month_index: number
  pipeline_value: number
  closed_value: number
  activity_count: number
  created_at: string
}

export interface AccountRevenueEvent {
  id: string
  account_plan_id: string
  month_index: number
  label: string
  color: string
  created_at: string
}

export interface AccountOpportunity {
  id: string
  account_plan_id: string
  name: string
  business_unit: string | null
  value: number
  decision_date: string | null
  actions: string | null
  win_probability: number
  status: string
  competitor_risk: string | null
  risk_percentage: number
  created_at: string
}

export interface AccountPipelineRisk {
  id: string
  account_plan_id: string
  month_label: string
  month_index: number
  pipeline_value: number
  at_risk_value: number
  counter_actions: number
  net_win_value: number
  created_at: string
}

/** Full Account Plan with all related data */
export interface AccountPlanFull extends AccountPlan {
  objectives: AccountPlanObjective[]
  swot: AccountPlanSwot[]
  stakeholders: AccountStakeholder[]
  connections: AccountStakeholderConnection[]
  actions: AccountAction[]
  business_units: AccountBusinessUnit[]
  buying_roles: AccountBuyingRole[]
  coverage_cells: AccountCoverageCell[]
  value_map: AccountValueMap[]
  solutions: AccountSolution[]
  whitespace_cells: AccountWhitespaceCell[]
  competitors: AccountCompetitor[]
  advisors: AccountAdvisor[]
  revenue_forecasts: AccountRevenueForecast[]
  revenue_events: AccountRevenueEvent[]
  opportunities: AccountOpportunity[]
  pipeline_risk: AccountPipelineRisk[]
}

export interface ImportJob {
  id: string
  tenant_id: string
  source: ImportSource
  status: ImportStatus
  file_url: string | null
  field_mapping: Record<string, unknown>
  total_rows: number
  processed_rows: number
  duplicates_found: number
  duplicates_merged: number
  error_log: Record<string, unknown>[]
  created_at: string
  completed_at: string | null
}
