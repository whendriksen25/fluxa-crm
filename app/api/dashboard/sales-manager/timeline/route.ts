import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { NextResponse } from "next/server"
import {
  sampleTeamMonthly, sampleTimelineReps, sampleTimelineAccounts,
} from "@/lib/sample-data"

/**
 * Returns monthly aggregated data for the activity/opportunity/revenue charts:
 * - Team-level (Figure 2)
 * - Per rep (Figure 3)
 * - Per account (Figure 5)
 *
 * Each month has: { month, activities, opportunity_revenue, actual_revenue }
 */

export async function GET() {
  console.log("[GET] /api/dashboard/sales-manager/timeline — start")

  try {
    const { supabase, profile } = await getAuthenticatedUser()
    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const tenantId = profile.tenant_id
    const now = new Date()
    // Go back 8 months for the timeline
    const startDate = new Date(now.getFullYear(), now.getMonth() - 7, 1).toISOString()

    const [usersResult, activitiesResult, dealsResult] = await Promise.all([
      supabase.from("users").select("id, full_name, role, quota").eq("tenant_id", tenantId),

      // All activities in the last 8 months
      supabase
        .from("activities")
        .select("id, user_id, company_id, created_at")
        .eq("tenant_id", tenantId)
        .gte("created_at", startDate),

      // All deals (for opportunity value and closed revenue)
      supabase
        .from("deals")
        .select("id, value, owner_id, company_id, created_at, updated_at, stage:kanban_stages(is_won, is_lost)")
        .eq("tenant_id", tenantId),
    ])

    const users = usersResult.data || []
    const activities = activitiesResult.data || []
    const deals = dealsResult.data || []

    // Build month buckets (last 8 months)
    const months: string[] = []
    const monthLabels: string[] = []
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(d.toISOString().slice(0, 7)) // "2026-01"
      monthLabels.push(d.toLocaleDateString("en-US", { month: "short" }))
    }

    function getMonth(dateStr: string) {
      return dateStr.slice(0, 7)
    }

    // ── Team-level (Figure 2) ──
    const teamMonthly = months.map((m, idx) => {
      const actCount = activities.filter((a) => getMonth(a.created_at) === m).length
      // Opportunity revenue = value of deals created up to and including this month that are still open
      const oppRevenue = deals
        .filter((d) => {
          const s = d.stage as unknown as { is_won: boolean; is_lost: boolean } | null
          return getMonth(d.created_at) <= m && (!s?.is_won && !s?.is_lost || getMonth(d.updated_at || d.created_at) >= m)
        })
        .reduce((sum, d) => sum + (d.value || 0), 0)
      // Actual revenue = deals marked won where updated_at falls in or before this month
      const actualRevenue = deals
        .filter((d) => {
          const s = d.stage as unknown as { is_won: boolean } | null
          return s?.is_won && getMonth(d.updated_at || d.created_at) <= m
        })
        .reduce((sum, d) => sum + (d.value || 0), 0)

      return {
        month: monthLabels[idx],
        month_key: m,
        activities: actCount,
        opportunity_revenue: oppRevenue,
        actual_revenue: actualRevenue,
      }
    })

    // ── Per rep (Figure 3) ──
    const perRep = users.map((u) => {
      const repActivities = activities.filter((a) => a.user_id === u.id)
      const repDeals = deals.filter((d) => d.owner_id === u.id)
      const wonDeals = repDeals.filter((d) => {
        const s = d.stage as unknown as { is_won: boolean } | null
        return s?.is_won
      })
      const lostDeals = repDeals.filter((d) => {
        const s = d.stage as unknown as { is_lost: boolean } | null
        return s?.is_lost
      })

      const totalActivities = repActivities.length
      const totalClosed = wonDeals.reduce((s, d) => s + (d.value || 0), 0)
      const totalPipeline = repDeals
        .filter((d) => {
          const s = d.stage as unknown as { is_won: boolean; is_lost: boolean } | null
          return !s?.is_won && !s?.is_lost
        })
        .reduce((s, d) => s + (d.value || 0), 0)
      const quota = (u.quota as number) || 0
      const attainment = quota > 0 ? Math.round((totalClosed / quota) * 100) : 0
      const winRate = (wonDeals.length + lostDeals.length) > 0
        ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)
        : 0

      // Determine diagnosis color
      const avgTeamAct = activities.length / Math.max(users.length, 1)
      const actRatio = avgTeamAct > 0 ? totalActivities / avgTeamAct : 0
      let diagnosis: "blue" | "amber" | "red" | "green" = "blue"
      if (totalActivities < avgTeamAct * 0.5) {
        diagnosis = "red" // low activity = root cause
      } else if (attainment < 60 && totalActivities >= avgTeamAct * 0.8) {
        diagnosis = "amber" // active but not converting
      } else if (attainment >= 70 && actRatio > 1.2) {
        diagnosis = "green" // strong ramp
      }

      const monthly = months.map((m, idx) => {
        const actCount = repActivities.filter((a) => getMonth(a.created_at) === m).length
        const oppRevenue = repDeals
          .filter((d) => {
            const s = d.stage as unknown as { is_won: boolean; is_lost: boolean } | null
            return getMonth(d.created_at) <= m && (!s?.is_won && !s?.is_lost || getMonth(d.updated_at || d.created_at) >= m)
          })
          .reduce((s, d) => s + (d.value || 0), 0)
        const actualRevenue = wonDeals
          .filter((d) => getMonth(d.updated_at || d.created_at) <= m)
          .reduce((s, d) => s + (d.value || 0), 0)
        return { month: monthLabels[idx], activities: actCount, opportunity_revenue: oppRevenue, actual_revenue: actualRevenue }
      })

      return {
        id: u.id,
        name: u.full_name,
        role: u.role,
        quota,
        attainment,
        diagnosis,
        total_activities: totalActivities,
        total_closed: totalClosed,
        total_pipeline: totalPipeline,
        win_rate: winRate,
        monthly,
      }
    })

    // ── Per account (Figure 5) ──
    // Get unique companies from deals
    const companyIds = [...new Set(deals.map((d) => d.company_id).filter(Boolean))] as string[]

    // Fetch company names
    const { data: companies } = await supabase
      .from("companies")
      .select("id, name")
      .in("id", companyIds.length > 0 ? companyIds : ["00000000-0000-0000-0000-000000000000"])

    const companyNameMap: Record<string, string> = {}
    for (const c of companies || []) companyNameMap[c.id] = c.name

    const perAccount = companyIds.map((companyId) => {
      const compDeals = deals.filter((d) => d.company_id === companyId)
      const compActivities = activities.filter((a) => a.company_id === companyId)
      const owner = users.find((u) => compDeals.some((d) => d.owner_id === u.id))
      const wonCompDeals = compDeals.filter((d) => {
        const s = d.stage as unknown as { is_won: boolean } | null
        return s?.is_won
      })

      const totalAct = compActivities.length
      const totalRevenue = wonCompDeals.reduce((s, d) => s + (d.value || 0), 0)
      const totalPipeline = compDeals
        .filter((d) => {
          const s = d.stage as unknown as { is_won: boolean; is_lost: boolean } | null
          return !s?.is_won && !s?.is_lost
        })
        .reduce((s, d) => s + (d.value || 0), 0)

      // Diagnosis: based on activity + revenue correlation
      let diagnosis: "blue" | "amber" | "red" | "green" = "blue"
      if (totalAct === 0) diagnosis = "red"
      else if (totalPipeline > 0 && totalRevenue === 0) diagnosis = "amber"
      else if (totalAct > 5 && totalRevenue > 0) diagnosis = "green"

      const monthly = months.map((m, idx) => {
        const actCount = compActivities.filter((a) => getMonth(a.created_at) === m).length
        const oppRevenue = compDeals
          .filter((d) => {
            const s = d.stage as unknown as { is_won: boolean; is_lost: boolean } | null
            return getMonth(d.created_at) <= m && (!s?.is_won && !s?.is_lost || getMonth(d.updated_at || d.created_at) >= m)
          })
          .reduce((s, d) => s + (d.value || 0), 0)
        const actualRevenue = wonCompDeals
          .filter((d) => getMonth(d.updated_at || d.created_at) <= m)
          .reduce((s, d) => s + (d.value || 0), 0)
        return { month: monthLabels[idx], activities: actCount, opportunity_revenue: oppRevenue, actual_revenue: actualRevenue }
      })

      return {
        id: companyId,
        name: companyNameMap[companyId] || "Unknown",
        owner_name: owner?.full_name || "Unassigned",
        diagnosis,
        total_activities: totalAct,
        total_revenue: totalRevenue,
        total_pipeline: totalPipeline,
        monthly,
      }
    })
      .filter((a) => a.total_pipeline > 0 || a.total_revenue > 0 || a.total_activities > 0)
      .sort((a, b) => (b.total_pipeline + b.total_revenue) - (a.total_pipeline + a.total_revenue))
      .slice(0, 12)

    // If there's not enough real data, return sample data from the document
    const hasData = perRep.length >= 2 || teamMonthly.some((m) => m.activities > 5)
    const useSample = !hasData

    console.log("[GET] /api/dashboard/sales-manager/timeline — done", useSample ? "(sample data)" : "")

    if (useSample) {
      return NextResponse.json({
        months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
        team: sampleTeamMonthly,
        per_rep: sampleTimelineReps,
        per_account: sampleTimelineAccounts,
        is_sample: true,
      })
    }

    return NextResponse.json({
      months: monthLabels,
      team: teamMonthly,
      per_rep: perRep,
      per_account: perAccount,
    })
  } catch (err) {
    console.error("[GET] /api/dashboard/sales-manager/timeline — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
