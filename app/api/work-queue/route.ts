import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { NextResponse } from "next/server"

interface WorkQueueItem {
  id: string
  type: "task" | "follow_up" | "stale_deal" | "new_lead"
  title: string
  description: string | null
  urgency: "overdue" | "today" | "upcoming"
  due_date: string | null
  contact_id: string | null
  deal_id: string | null
  company_id: string | null
  contact_name: string | null
  deal_title: string | null
  activity_id: string | null
}

export async function GET() {
  console.log("[GET] /api/work-queue — start")

  try {
    const { supabase, user, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const userId = user!.id
    const tenantId = profile.tenant_id
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const items: WorkQueueItem[] = []

    // 1. Manual tasks (is_task = true, not completed)
    const { data: tasks } = await supabase
      .from("activities")
      .select("*, contact:contacts(first_name, last_name), deal:deals(title)")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .eq("is_task", true)
      .eq("completed", false)
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(20)

    if (tasks) {
      for (const task of tasks) {
        const contact = task.contact as { first_name: string; last_name: string } | null
        const deal = task.deal as { title: string } | null
        let urgency: WorkQueueItem["urgency"] = "upcoming"
        if (task.due_date) {
          if (task.due_date < todayStart) urgency = "overdue"
          else if (task.due_date < todayEnd) urgency = "today"
        }

        items.push({
          id: `task-${task.id}`,
          type: "task",
          title: task.title || "Unnamed task",
          description: task.description,
          urgency,
          due_date: task.due_date,
          contact_id: task.contact_id,
          deal_id: task.deal_id,
          company_id: task.company_id,
          contact_name: contact ? `${contact.first_name} ${contact.last_name}`.trim() : null,
          deal_title: deal?.title || null,
          activity_id: task.id,
        })
      }
    }

    // 2. Overdue follow-ups (contacts with next_follow_up in the past)
    const { data: followUps } = await supabase
      .from("contacts")
      .select("id, first_name, last_name, next_follow_up, company_id")
      .eq("tenant_id", tenantId)
      .eq("owner_id", userId)
      .lt("next_follow_up", now.toISOString())
      .not("next_follow_up", "is", null)
      .order("next_follow_up", { ascending: true })
      .limit(15)

    if (followUps) {
      for (const contact of followUps) {
        items.push({
          id: `follow-up-${contact.id}`,
          type: "follow_up",
          title: `Follow up with ${contact.first_name} ${contact.last_name}`.trim(),
          description: null,
          urgency: "overdue",
          due_date: contact.next_follow_up,
          contact_id: contact.id,
          deal_id: null,
          company_id: contact.company_id,
          contact_name: `${contact.first_name} ${contact.last_name}`.trim(),
          deal_title: null,
          activity_id: null,
        })
      }
    }

    // 3. Stale deals (not updated in 7+ days, not won/lost)
    const { data: staleDeals } = await supabase
      .from("deals")
      .select("id, title, contact_id, company_id, updated_at, stage:kanban_stages(is_won, is_lost)")
      .eq("tenant_id", tenantId)
      .eq("owner_id", userId)
      .lt("updated_at", sevenDaysAgo)
      .limit(15)

    if (staleDeals) {
      for (const deal of staleDeals) {
        const stage = deal.stage as unknown as { is_won: boolean; is_lost: boolean } | null
        if (stage?.is_won || stage?.is_lost) continue

        items.push({
          id: `stale-deal-${deal.id}`,
          type: "stale_deal",
          title: `Check in on "${deal.title}"`,
          description: "This deal hasn't been updated in over a week.",
          urgency: "overdue",
          due_date: deal.updated_at,
          contact_id: deal.contact_id,
          deal_id: deal.id,
          company_id: deal.company_id,
          contact_name: null,
          deal_title: deal.title,
          activity_id: null,
        })
      }
    }

    // 4. New leads from imports that haven't been contacted
    const { data: newLeads } = await supabase
      .from("contacts")
      .select("id, first_name, last_name, company_id, source")
      .eq("tenant_id", tenantId)
      .eq("owner_id", userId)
      .eq("stage", "lead")
      .is("last_contacted_at", null)
      .in("source", ["import", "csv"])
      .order("created_at", { ascending: false })
      .limit(10)

    if (newLeads) {
      for (const lead of newLeads) {
        items.push({
          id: `new-lead-${lead.id}`,
          type: "new_lead",
          title: `Review new lead: ${lead.first_name} ${lead.last_name}`.trim(),
          description: null,
          urgency: "upcoming",
          due_date: null,
          contact_id: lead.id,
          deal_id: null,
          company_id: lead.company_id,
          contact_name: `${lead.first_name} ${lead.last_name}`.trim(),
          deal_title: null,
          activity_id: null,
        })
      }
    }

    // Sort: overdue first, then today, then upcoming
    const urgencyOrder = { overdue: 0, today: 1, upcoming: 2 }
    items.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])

    console.log("[GET] /api/work-queue — done, items:", items.length)
    return NextResponse.json({ items, total: items.length })
  } catch (err) {
    console.error("[GET] /api/work-queue — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
