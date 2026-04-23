import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { NextResponse } from "next/server"
import {
  sampleStats, sampleRepPerformance, sampleDealsAtRisk,
  sampleFunnel, sampleForecast,
} from "@/lib/sample-data"

export async function GET() {
  console.log("[GET] /api/dashboard/sales-manager — start")

  try {
    const { supabase, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const tenantId = profile.tenant_id
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString()

    const [usersResult, allDealsResult, activitiesResult] = await Promise.all([
      supabase.from("users").select("id, full_name, role, quota").eq("tenant_id", tenantId).order("full_name"),
      supabase.from("deals").select("id, title, value, owner_id, company_id, updated_at, stage:kanban_stages(name, color, position, is_won, is_lost), company:companies(name)").eq("tenant_id", tenantId),
      supabase.from("activities").select("user_id, type, created_at").eq("tenant_id", tenantId).gte("created_at", thirtyDaysAgo),
    ])

    const users = usersResult.data || []
    const allDeals = allDealsResult.data || []
    const allActivities = activitiesResult.data || []

    const openDeals = allDeals.filter((d) => {
      const s = d.stage as unknown as { is_won: boolean; is_lost: boolean } | null
      return !s?.is_won && !s?.is_lost
    })
    const wonDeals = allDeals.filter((d) => {
      const s = d.stage as unknown as { is_won: boolean } | null
      return s?.is_won
    })

    // ── Activity count per user ──
    const actByUser: Record<string, number> = {}
    for (const a of allActivities) actByUser[a.user_id] = (actByUser[a.user_id] || 0) + 1
    const avgAct = users.length > 0 ? Object.values(actByUser).reduce((s, v) => s + v, 0) / users.length : 0

    // ── Team totals ──
    const teamQuota = users.reduce((s, u) => s + ((u.quota as number) || 0), 0)
    const closedWon = wonDeals.reduce((s, d) => s + (d.value || 0), 0)
    const totalPipeline = openDeals.reduce((s, d) => s + (d.value || 0), 0)
    const remaining = Math.max(0, teamQuota - closedWon)
    const coverage = remaining > 0 ? Math.round((totalPipeline / remaining) * 10) / 10 : 0

    // ── Deals at risk ──
    const dealsAtRisk = openDeals
      .filter((d) => d.updated_at && d.updated_at < sevenDaysAgo)
      .map((d) => {
        const stage = d.stage as unknown as { name: string; color: string } | null
        const comp = d.company as unknown as { name: string } | null
        const owner = users.find((u) => u.id === d.owner_id)
        const stalled = Math.floor((now.getTime() - new Date(d.updated_at!).getTime()) / 86400000)
        return { id: d.id, title: d.title, company_name: comp?.name || null, rep_name: owner?.full_name || "Unassigned", stage_name: stage?.name || "", stage_color: stage?.color || "#6366f1", value: d.value || 0, stalled_days: stalled }
      })
      .sort((a, b) => b.stalled_days - a.stalled_days)

    const riskValue = dealsAtRisk.reduce((s, d) => s + d.value, 0)

    // ── KPIs ──
    const stats = {
      attainment_pct: teamQuota > 0 ? Math.round((closedWon / teamQuota) * 100) : 0,
      total_closed_won: closedWon,
      coverage_ratio: coverage,
      deals_at_risk_count: dealsAtRisk.length,
      deals_at_risk_value: riskValue,
      team_quota: teamQuota,
      total_pipeline: totalPipeline,
    }

    // ── Rep performance (Figure 1 — table with attainment bars) ──
    const repPerformance = users.map((u) => {
      const rWon = wonDeals.filter((d) => d.owner_id === u.id)
      const rOpen = openDeals.filter((d) => d.owner_id === u.id)
      const closed = rWon.reduce((s, d) => s + (d.value || 0), 0)
      const pipe = rOpen.reduce((s, d) => s + (d.value || 0), 0)
      const quota = (u.quota as number) || 0
      const att = quota > 0 ? Math.round((closed / quota) * 100) : 0
      const allRepDeals = [...rWon, ...rOpen]
      const avg = allRepDeals.length > 0 ? Math.round(allRepDeals.reduce((s, d) => s + (d.value || 0), 0) / allRepDeals.length) : 0
      const actCount = actByUser[u.id] || 0
      const actScore = avgAct > 0 ? Math.min(5, Math.round((actCount / avgAct) * 3)) : 0
      // Win rate = won / (won + lost)
      const lostDeals = allDeals.filter((d) => {
        const s = d.stage as unknown as { is_lost: boolean } | null
        return s?.is_lost && d.owner_id === u.id
      })
      const winRate = (rWon.length + lostDeals.length) > 0 ? Math.round((rWon.length / (rWon.length + lostDeals.length)) * 100) : 0

      return {
        id: u.id, name: u.full_name, role: u.role, quota, attainment: att,
        closed_revenue: closed, pipeline_value: pipe,
        activity_count: actCount, activity_score: actScore,
        avg_deal_size: avg, deal_count: allRepDeals.length, win_rate: winRate,
      }
    }).sort((a, b) => b.attainment - a.attainment)

    // ── Pipeline funnel with drop-off (Figure 1 bottom-left) ──
    const stageMap: Record<string, { name: string; color: string; position: number; count: number; value: number }> = {}
    for (const d of openDeals) {
      const s = d.stage as unknown as { name: string; color: string; position: number } | null
      if (!s) continue
      if (!stageMap[s.name]) stageMap[s.name] = { name: s.name, color: s.color, position: s.position, count: 0, value: 0 }
      stageMap[s.name].count++
      stageMap[s.name].value += d.value || 0
    }
    const funnel = Object.values(stageMap).sort((a, b) => a.position - b.position).map((s, i, arr) => ({
      ...s,
      dropoff: i > 0 && arr[i - 1].count > 0
        ? Math.round(((arr[i - 1].count - s.count) / arr[i - 1].count) * -100)
        : null,
    }))

    // ── Forecast (Figure 1 bottom-right) ──
    const commitDeals = openDeals.filter((d) => {
      const s = d.stage as unknown as { position: number } | null
      return s && s.position >= 3
    })
    const commit = commitDeals.reduce((s, d) => s + (d.value || 0), 0) + closedWon
    const forecast = {
      quota: teamQuota,
      closed_won: closedWon,
      commit,
      best_case: totalPipeline + closedWon,
      gap: Math.max(0, teamQuota - commit),
      pipeline_created: totalPipeline,
    }

    // If there's not enough real data, return sample data from the document
    const useSample = repPerformance.length < 2 || closedWon === 0

    console.log("[GET] /api/dashboard/sales-manager — done", useSample ? "(sample data)" : "")
    if (useSample) {
      return NextResponse.json({
        stats: sampleStats,
        rep_performance: sampleRepPerformance,
        deals_at_risk: sampleDealsAtRisk,
        funnel: sampleFunnel,
        forecast: sampleForecast,
        is_sample: true,
      })
    }

    return NextResponse.json({ stats, rep_performance: repPerformance, deals_at_risk: dealsAtRisk.slice(0, 10), funnel, forecast })
  } catch (err) {
    console.error("[GET] /api/dashboard/sales-manager — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
