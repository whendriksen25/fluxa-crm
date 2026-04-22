/**
 * FLUXA CRM — Sample data with 1 demo customer: Colruyt Group.
 * Demonstrates every feature with a single realistic account.
 * Context: Colruyt is rolling out EV charging across 200+ stores.
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
  { id: "s1", name: "Pieter Claes", role: "Senior AE", quota: 600_000, attainment: 82, closed_revenue: 492_000, pipeline_value: 540_000, activity_count: 58, activity_score: 5, avg_deal_size: 82_000, deal_count: 8, win_rate: 75 },
  { id: "s2", name: "Lies Vermeersch", role: "AE", quota: 600_000, attainment: 62, closed_revenue: 372_000, pipeline_value: 400_000, activity_count: 41, activity_score: 3, avg_deal_size: 62_000, deal_count: 7, win_rate: 57 },
]

export const sampleDealsAtRisk = [
  { id: "d1", title: "Colruyt DC Charging", company_name: "Colruyt Group", rep_name: "Lies Vermeersch", stage_name: "Proposal sent", stage_color: "#f59e0b", value: 180_000, stalled_days: 14 },
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
    id: "s1", name: "Pieter Claes", role: "Senior AE", quota: 600_000, attainment: 82,
    diagnosis: "blue" as const,
    total_activities: 58, total_closed: 492_000, total_pipeline: 540_000, win_rate: 75,
    monthly: makeRepMonthly(
      [6, 8, 9, 10, 11, 12, 13, 14],
      [60_000, 90_000, 130_000, 170_000, 220_000, 280_000, 350_000, 420_000],
      [0, 24_000, 48_000, 96_000, 192_000, 288_000, 384_000, 492_000],
    ),
  },
  {
    id: "s2", name: "Lies Vermeersch", role: "AE", quota: 600_000, attainment: 62,
    diagnosis: "amber" as const,
    total_activities: 41, total_closed: 372_000, total_pipeline: 400_000, win_rate: 57,
    monthly: makeRepMonthly(
      [4, 5, 6, 6, 7, 7, 8, 8],
      [40_000, 60_000, 90_000, 120_000, 160_000, 200_000, 250_000, 310_000],
      [0, 24_000, 48_000, 96_000, 144_000, 216_000, 288_000, 372_000],
    ),
  },
]

// ── Figure 5: Per account — only Colruyt Group ──

export const sampleTimelineAccounts = [
  {
    id: "a1", name: "Colruyt Group", owner_name: "Pieter Claes",
    diagnosis: "blue" as const,
    total_activities: 42, total_revenue: 384_000, total_pipeline: 420_000,
    monthly: makeRepMonthly(
      [3, 5, 6, 7, 7, 8, 8, 9],
      [40_000, 65_000, 95_000, 130_000, 170_000, 220_000, 280_000, 340_000],
      [0, 0, 48_000, 96_000, 144_000, 192_000, 288_000, 384_000],
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
    id: "h1", name: "Colruyt Group", category: "Enterprise",
    arr: 804_000,
    last_contact: new Date(Date.now() - 3 * 86400000).toISOString(),
    last_contact_days: 3,
    health: "green" as const, trend: "up",
  },
]

export const sampleAmTasks = [
  { id: "t1", title: "Follow up on DC fast-charger proposal — Colruyt Halle", urgency: "overdue" as const, due_date: null, contact_name: "Stefan Willems", deal_title: "Colruyt DC Charging", arr_at_stake: 180_000 },
  { id: "t2", title: "Send updated lease pricing for Bio-Planet locations", urgency: "today" as const, due_date: null, contact_name: "An Peeters", deal_title: null, arr_at_stake: 120_000 },
  { id: "t3", title: "Schedule Q3 review meeting with Jef Colruyt", urgency: "today" as const, due_date: null, contact_name: "Jef Colruyt", deal_title: null, arr_at_stake: 804_000 },
  { id: "t4", title: "Prepare installation report for 12 completed stores", urgency: "upcoming" as const, due_date: null, contact_name: null, deal_title: null, arr_at_stake: 0 },
  { id: "t5", title: "Review service contract renewal terms", urgency: "upcoming" as const, due_date: null, contact_name: "Stefan Willems", deal_title: "Colruyt Service 2026", arr_at_stake: 240_000 },
]

export const sampleAmPipeline = [
  { name: "Prospecting", color: "#6366f1", count: 1, value: 120_000 },
  { name: "Proposal sent", color: "#f59e0b", count: 1, value: 180_000 },
  { name: "Negotiation", color: "#f97316", count: 1, value: 240_000 },
]

export const sampleAmRenewals = [
  { id: "r1", title: "Colruyt Service & Maintenance 2026", company_name: "Colruyt Group", value: 240_000, days_left: 28, urgency: "red" },
  { id: "r2", title: "Colruyt Phase 3 — 50 new locations", company_name: "Colruyt Group", value: 420_000, days_left: 65, urgency: "green" },
]
