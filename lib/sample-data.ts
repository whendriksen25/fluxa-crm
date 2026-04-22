/**
 * FLUXA CRM — Sample data with 2 demo customers: Equans and Colruyt Group.
 * Demonstrates every feature with realistic accounts.
 * Contact: Yves van Sante (sole account executive).
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"]

// ── Figure 1: Main dashboard ──

export const sampleStats = {
  attainment_pct: 72,
  total_closed_won: 864_000,
  coverage_ratio: 2.8,
  deals_at_risk_count: 1,
  deals_at_risk_value: 180_000,
  team_quota: 1_200_000,
  total_pipeline: 940_000,
}

export const sampleRepPerformance = [
  { id: "s1", name: "Yves van Sante", role: "Senior AE", quota: 1_200_000, attainment: 72, closed_revenue: 864_000, pipeline_value: 940_000, activity_count: 99, activity_score: 5, avg_deal_size: 72_000, deal_count: 15, win_rate: 68 },
]

export const sampleDealsAtRisk = [
  { id: "d1", title: "Equans Electrical Maintenance", company_name: "Equans", rep_name: "Yves van Sante", stage_name: "Proposal sent", stage_color: "#f59e0b", value: 180_000, stalled_days: 14 },
]

export const sampleFunnel = [
  { name: "Prospecting", color: "#6366f1", count: 6, value: 420_000, dropoff: null },
  { name: "Qualified", color: "#3b82f6", count: 4, value: 310_000, dropoff: -33 },
  { name: "Proposal sent", color: "#f59e0b", count: 3, value: 240_000, dropoff: -25 },
  { name: "Negotiation", color: "#f97316", count: 2, value: 180_000, dropoff: -33 },
  { name: "Won", color: "#22c55e", count: 5, value: 864_000, dropoff: null },
]

export const sampleForecast = {
  quota: 1_200_000,
  closed_won: 864_000,
  commit: 1_044_000,
  best_case: 1_204_000,
  gap: 156_000,
  pipeline_created: 940_000,
}

// ── Figure 2: Team timeline (Jan–Aug) ──

export const sampleTeamMonthly = [
  { month: "Jan", activities: 24, opportunity_revenue: 120_000, actual_revenue: 0 },
  { month: "Feb", activities: 32, opportunity_revenue: 180_000, actual_revenue: 48_000 },
  { month: "Mar", activities: 38, opportunity_revenue: 260_000, actual_revenue: 96_000 },
  { month: "Apr", activities: 45, opportunity_revenue: 340_000, actual_revenue: 192_000 },
  { month: "May", activities: 52, opportunity_revenue: 420_000, actual_revenue: 384_000 },
  { month: "Jun", activities: 61, opportunity_revenue: 520_000, actual_revenue: 528_000 },
  { month: "Jul", activities: 68, opportunity_revenue: 640_000, actual_revenue: 672_000 },
  { month: "Aug", activities: 74, opportunity_revenue: 760_000, actual_revenue: 864_000 },
]

// ── Figure 3: Per account manager timelines ──

function makeRepMonthly(base: number[], oppBase: number[], revBase: number[]) {
  return MONTHS.map((m, i) => ({
    month: m,
    activities: base[i],
    opportunity_revenue: oppBase[i],
    actual_revenue: revBase[i],
  }))
}

export const sampleTimelineReps = [
  {
    id: "s1", name: "Yves van Sante", role: "Senior AE", quota: 1_200_000, attainment: 72,
    diagnosis: "blue" as const,
    total_activities: 99, total_closed: 864_000, total_pipeline: 940_000, win_rate: 68,
    monthly: makeRepMonthly(
      [10, 13, 15, 17, 18, 19, 21, 23],
      [100_000, 150_000, 220_000, 290_000, 380_000, 480_000, 600_000, 730_000],
      [0, 48_000, 96_000, 192_000, 336_000, 504_000, 672_000, 864_000],
    ),
  },
]

// ── Figure 5: Per account — Equans and Colruyt Group ──

export const sampleTimelineAccounts = [
  {
    id: "a1", name: "Equans", owner_name: "Yves van Sante",
    diagnosis: "blue" as const,
    total_activities: 52, total_revenue: 480_000, total_pipeline: 520_000,
    monthly: makeRepMonthly(
      [5, 7, 8, 9, 9, 10, 11, 12],
      [50_000, 80_000, 120_000, 165_000, 215_000, 275_000, 345_000, 420_000],
      [0, 24_000, 48_000, 120_000, 192_000, 288_000, 384_000, 480_000],
    ),
  },
  {
    id: "a2", name: "Colruyt Group", owner_name: "Yves van Sante",
    diagnosis: "green" as const,
    total_activities: 47, total_revenue: 384_000, total_pipeline: 420_000,
    monthly: makeRepMonthly(
      [5, 6, 7, 8, 9, 9, 10, 11],
      [50_000, 70_000, 100_000, 125_000, 165_000, 205_000, 255_000, 310_000],
      [0, 24_000, 48_000, 72_000, 144_000, 216_000, 288_000, 384_000],
    ),
  },
]

// ── Account Manager sample data ──

export const sampleAmStats = {
  total_arr: 804_000,
  at_risk_arr: 180_000,
  at_risk_count: 1,
  renewals_this_month: 1,
  renewals_value: 240_000,
  open_tasks: 5,
  overdue_count: 1,
  today_count: 2,
}

export const sampleAmAccountHealth = [
  {
    id: "h1", name: "Equans", category: "Enterprise",
    arr: 520_000,
    last_contact: new Date(Date.now() - 2 * 86400000).toISOString(),
    last_contact_days: 2,
    health: "green" as const, trend: "up",
  },
  {
    id: "h2", name: "Colruyt Group", category: "Enterprise",
    arr: 284_000,
    last_contact: new Date(Date.now() - 5 * 86400000).toISOString(),
    last_contact_days: 5,
    health: "green" as const, trend: "stable",
  },
]

export const sampleAmTasks = [
  { id: "t1", title: "Send proposal to Equans", urgency: "today" as const, due_date: null, contact_name: "Yves van Sante", deal_title: "Equans Electrical Maintenance", arr_at_stake: 180_000 },
  { id: "t2", title: "Follow up on DC fast-charger proposal — Colruyt Halle", urgency: "overdue" as const, due_date: null, contact_name: "Yves van Sante", deal_title: "Colruyt DC Charging", arr_at_stake: 120_000 },
  { id: "t3", title: "Schedule Q3 review meeting — Colruyt Group", urgency: "today" as const, due_date: null, contact_name: "Yves van Sante", deal_title: null, arr_at_stake: 284_000 },
  { id: "t4", title: "Prepare installation report for 12 completed stores", urgency: "upcoming" as const, due_date: null, contact_name: null, deal_title: null, arr_at_stake: 0 },
  { id: "t5", title: "Review service contract renewal terms — Equans", urgency: "upcoming" as const, due_date: null, contact_name: "Yves van Sante", deal_title: "Equans Service 2026", arr_at_stake: 240_000 },
]

export const sampleAmPipeline = [
  { name: "Prospecting", color: "#6366f1", count: 1, value: 120_000 },
  { name: "Proposal sent", color: "#f59e0b", count: 1, value: 180_000 },
  { name: "Negotiation", color: "#f97316", count: 1, value: 240_000 },
]

export const sampleAmRenewals = [
  { id: "r1", title: "Equans Service & Maintenance 2026", company_name: "Equans", value: 280_000, days_left: 28, urgency: "red" },
  { id: "r2", title: "Colruyt Phase 3 — 50 new locations", company_name: "Colruyt Group", value: 420_000, days_left: 65, urgency: "green" },
]
