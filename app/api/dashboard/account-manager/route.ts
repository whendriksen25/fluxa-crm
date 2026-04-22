import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { NextResponse } from "next/server"
import {
  sampleAmStats, sampleAmAccountHealth, sampleAmTasks,
  sampleAmPipeline, sampleAmRenewals,
} from "@/lib/sample-data"

export async function GET() {
  console.log("[GET] /api/dashboard/account-manager — start")

  try {
    const { supabase, user, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const tenantId = profile.tenant_id
    const userId = user!.id
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000).toISOString()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 86400000).toISOString()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 86400000).toISOString()

    const [myDealsResult, myContactsResult, tasksResult, activitiesResult] = await Promise.all([
      supabase
        .from("deals")
        .select("id, title, value, expected_close_date, updated_at, company_id, owner_id, stage:kanban_stages(name, color, position, is_won, is_lost), company:companies(id, name, category)")
        .eq("tenant_id", tenantId)
        .eq("owner_id", userId),

      supabase
        .from("contacts")
        .select("company_id, company:companies(id, name, category)")
        .eq("tenant_id", tenantId)
        .eq("owner_id", userId)
        .not("company_id", "is", null),

      supabase
        .from("activities")
        .select("id, title, due_date, contact_id, deal_id, company_id, contact:contacts(first_name, last_name), deal:deals(title, value, company_id)")
        .eq("tenant_id", tenantId)
        .eq("user_id", userId)
        .eq("is_task", true)
        .eq("completed", false)
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(30),

      supabase
        .from("activities")
        .select("company_id, created_at")
        .eq("tenant_id", tenantId)
        .eq("user_id", userId)
        .not("company_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(500),
    ])

    const myDeals = myDealsResult.data || []
    const openDeals = myDeals.filter((d) => {
      const s = d.stage as unknown as { is_won: boolean; is_lost: boolean } | null
      return !s?.is_won && !s?.is_lost
    })

    // ── Last contact per company ──
    const lastContactByCompany: Record<string, string> = {}
    for (const act of activitiesResult.data || []) {
      if (act.company_id && !lastContactByCompany[act.company_id]) {
        lastContactByCompany[act.company_id] = act.created_at
      }
    }

    // ── ARR per company ──
    const companyArr: Record<string, number> = {}
    for (const d of openDeals) {
      if (d.company_id) companyArr[d.company_id] = (companyArr[d.company_id] || 0) + (d.value || 0)
    }

    // ── Account health ──
    const companyMap = new Map<string, { id: string; name: string; category: string | null }>()
    for (const c of myContactsResult.data || []) {
      const comp = c.company as unknown as { id: string; name: string; category: string | null } | null
      if (comp && !companyMap.has(comp.id)) companyMap.set(comp.id, comp)
    }
    for (const d of myDeals) {
      const comp = d.company as unknown as { id: string; name: string; category: string | null } | null
      if (comp && !companyMap.has(comp.id)) companyMap.set(comp.id, comp)
    }

    let atRiskArr = 0
    let atRiskCount = 0

    const accountHealth = Array.from(companyMap.values()).map((comp) => {
      const arr = companyArr[comp.id] || 0
      const lc = lastContactByCompany[comp.id] || null
      const lcDays = lc ? Math.floor((now.getTime() - new Date(lc).getTime()) / 86400000) : null

      let health: "green" | "amber" | "red" = "red"
      if (lc) {
        if (lc >= fourteenDaysAgo) health = "green"
        else if (lc >= thirtyDaysAgo) health = "amber"
      }

      if (health === "red" && arr > 0) { atRiskArr += arr; atRiskCount++ }

      const compDeals = openDeals.filter((d) => d.company_id === comp.id)
      const recentlyUpdated = compDeals.some((d) => d.updated_at && d.updated_at >= fourteenDaysAgo)
      const trend = health === "green" && recentlyUpdated ? "up" : health === "red" ? "down" : "stable"

      return { id: comp.id, name: comp.name, category: comp.category, arr, last_contact: lc, last_contact_days: lcDays, health, trend }
    }).sort((a, b) => {
      const ho = { red: 0, amber: 1, green: 2 }
      return ho[a.health] - ho[b.health] || b.arr - a.arr
    }).slice(0, 20)

    // ── Tasks (with urgency + ARR at stake) ──
    const tasksList = (tasksResult.data || []).map((t) => {
      let urgency: "overdue" | "today" | "upcoming" = "upcoming"
      if (t.due_date) {
        if (t.due_date < todayStart) urgency = "overdue"
        else if (t.due_date < todayEnd) urgency = "today"
      }
      const contact = t.contact as unknown as { first_name: string; last_name: string } | null
      const deal = t.deal as unknown as { title: string; value: number; company_id: string } | null
      const arrAtStake = deal ? (companyArr[deal.company_id] || deal.value || 0) : 0

      return {
        id: t.id,
        title: t.title,
        due_date: t.due_date,
        urgency,
        contact_name: contact ? `${contact.first_name} ${contact.last_name}`.trim() : null,
        deal_title: deal?.title || null,
        arr_at_stake: arrAtStake,
      }
    }).sort((a, b) => {
      const uo = { overdue: 0, today: 1, upcoming: 2 }
      return uo[a.urgency] - uo[b.urgency]
    }).slice(0, 15)

    // ── Pipeline by stage ──
    const stageMap: Record<string, { name: string; color: string; position: number; count: number; value: number }> = {}
    for (const d of openDeals) {
      const s = d.stage as unknown as { name: string; color: string; position: number } | null
      if (!s) continue
      if (!stageMap[s.name]) stageMap[s.name] = { name: s.name, color: s.color, position: s.position, count: 0, value: 0 }
      stageMap[s.name].count++
      stageMap[s.name].value += d.value || 0
    }
    const pipeline = Object.values(stageMap).sort((a, b) => a.position - b.position)

    // ── Renewals ──
    const renewals = openDeals
      .filter((d) => d.expected_close_date && d.expected_close_date <= ninetyDaysFromNow)
      .map((d) => {
        const daysLeft = Math.ceil((new Date(d.expected_close_date!).getTime() - now.getTime()) / 86400000)
        const comp = d.company as unknown as { name: string } | null
        return {
          id: d.id, title: d.title, company_name: comp?.name || null, value: d.value || 0,
          expected_close_date: d.expected_close_date, days_left: daysLeft,
          urgency: daysLeft < 0 ? "overdue" : daysLeft <= 30 ? "red" : daysLeft <= 60 ? "amber" : "green",
        }
      })
      .sort((a, b) => a.days_left - b.days_left)
      .slice(0, 10)

    // ── Stats ──
    const renewalsThisMonth = openDeals.filter((d) => d.expected_close_date && d.expected_close_date >= monthStart && d.expected_close_date <= monthEnd)

    const stats = {
      total_arr: openDeals.reduce((s, d) => s + (d.value || 0), 0),
      at_risk_arr: atRiskArr,
      at_risk_count: atRiskCount,
      renewals_this_month: renewalsThisMonth.length,
      renewals_value: renewalsThisMonth.reduce((s, d) => s + (d.value || 0), 0),
      open_tasks: tasksList.length,
      overdue_count: tasksList.filter((t) => t.urgency === "overdue").length,
      today_count: tasksList.filter((t) => t.urgency === "today").length,
    }

    // If there's not enough real data, return sample data from the document
    // Show sample when there are no tasks, no renewals, and no at-risk accounts with real ARR
    const useSample = tasksList.length === 0 && renewals.length === 0 && stats.at_risk_arr === 0 && stats.renewals_this_month === 0

    console.log("[GET] /api/dashboard/account-manager — done", useSample ? "(sample data)" : "")

    if (useSample) {
      return NextResponse.json({
        stats: sampleAmStats,
        account_health: sampleAmAccountHealth,
        tasks_list: sampleAmTasks,
        pipeline: sampleAmPipeline,
        renewals: sampleAmRenewals,
        is_sample: true,
      })
    }

    return NextResponse.json({ stats, account_health: accountHealth, tasks_list: tasksList, pipeline, renewals })
  } catch (err) {
    console.error("[GET] /api/dashboard/account-manager — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
