import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { NextResponse } from "next/server"

export async function GET() {
  console.log("[GET] /api/dashboard — start")

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

    // Run all queries in parallel
    const [
      contactsResult,
      openDealsResult,
      tasksTodayResult,
      overdueResult,
      recentActivityResult,
      pipelineValueResult,
    ] = await Promise.all([
      // Total contacts
      supabase
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId),

      // Open deals (not won, not lost)
      supabase
        .from("deals")
        .select("id, stage:kanban_stages(is_won, is_lost)", { count: "exact" })
        .eq("tenant_id", tenantId),

      // Tasks due today
      supabase
        .from("activities")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("user_id", userId)
        .eq("is_task", true)
        .eq("completed", false)
        .gte("due_date", todayStart)
        .lt("due_date", todayEnd),

      // Overdue tasks
      supabase
        .from("activities")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("user_id", userId)
        .eq("is_task", true)
        .eq("completed", false)
        .lt("due_date", todayStart),

      // Recent activity (last 10)
      supabase
        .from("activities")
        .select(
          "id, type, title, created_at, contact:contacts(first_name, last_name), deal:deals(title), user:users(full_name)"
        )
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(10),

      // Pipeline value (sum of open deals)
      supabase
        .from("deals")
        .select("value, stage:kanban_stages(is_won, is_lost)")
        .eq("tenant_id", tenantId),
    ])

    // Count open deals (exclude won/lost)
    const openDeals = (openDealsResult.data || []).filter((d) => {
      const stage = d.stage as unknown as { is_won: boolean; is_lost: boolean } | null
      return !stage?.is_won && !stage?.is_lost
    })

    // Sum pipeline value for open deals
    const pipelineValue = (pipelineValueResult.data || [])
      .filter((d) => {
        const stage = d.stage as unknown as { is_won: boolean; is_lost: boolean } | null
        return !stage?.is_won && !stage?.is_lost
      })
      .reduce((sum, d) => sum + (d.value || 0), 0)

    const stats = {
      contacts: contactsResult.count || 0,
      open_deals: openDeals.length,
      tasks_today: tasksTodayResult.count || 0,
      overdue: overdueResult.count || 0,
      pipeline_value: pipelineValue,
    }

    console.log("[GET] /api/dashboard — done")
    return NextResponse.json({
      stats,
      recent_activity: recentActivityResult.data || [],
    })
  } catch (err) {
    console.error("[GET] /api/dashboard — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
