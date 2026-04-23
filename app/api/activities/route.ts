import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { refreshAccessToken } from "@/lib/integrations/google/auth"
import { pushActivityToCalendar } from "@/lib/integrations/google/calendar"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  console.log("[GET] /api/activities — start")

  try {
    const { supabase, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get("contactId") || ""
    const dealId = searchParams.get("dealId") || ""
    const companyId = searchParams.get("companyId") || ""
    const type = searchParams.get("type") || ""
    const tasksOnly = searchParams.get("tasksOnly") === "true"
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "25")
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from("activities")
      .select(
        "*, user:users(full_name), contact:contacts(first_name, last_name), deal:deals(title), company:companies(name)",
        { count: "exact" }
      )
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (contactId) query = query.eq("contact_id", contactId)
    if (dealId) query = query.eq("deal_id", dealId)
    if (companyId) query = query.eq("company_id", companyId)
    if (type) query = query.eq("type", type)
    if (tasksOnly) query = query.eq("is_task", true)

    const { data: activities, error, count } = await query

    if (error) {
      console.log("[GET] /api/activities — error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[GET] /api/activities — done, count:", count)
    return NextResponse.json({ activities, total: count })
  } catch (err) {
    console.error("[GET] /api/activities — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  console.log("[POST] /api/activities — start")

  try {
    const { supabase, user, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const body = await request.json()

    if (!body.type || !body.title) {
      return NextResponse.json(
        { error: "Type and title are required." },
        { status: 400 }
      )
    }

    const { data: activity, error } = await supabase
      .from("activities")
      .insert({
        tenant_id: profile.tenant_id,
        type: body.type,
        title: body.title,
        description: body.description || null,
        contact_id: body.contact_id || null,
        deal_id: body.deal_id || null,
        company_id: body.company_id || null,
        user_id: user!.id,
        is_task: body.is_task || false,
        due_date: body.due_date || null,
      })
      .select(
        "*, user:users(full_name), contact:contacts(first_name, last_name), deal:deals(title), company:companies(name)"
      )
      .single()

    if (error) {
      console.log("[POST] /api/activities — error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[POST] /api/activities — created:", activity.id)

    // Auto-push follow-up tasks to Google Calendar (if connected)
    if (activity.is_task && activity.due_date) {
      try {
        const { data: integration } = await supabase
          .from("user_integrations")
          .select("*")
          .eq("user_id", user!.id)
          .eq("provider", "google")
          .eq("sync_enabled", true)
          .maybeSingle()

        if (integration) {
          // Refresh token if needed
          let accessToken = integration.access_token
          if (integration.token_expires_at && new Date(integration.token_expires_at) < new Date()) {
            const newTokens = await refreshAccessToken(integration.refresh_token)
            accessToken = newTokens.access_token || accessToken
            await supabase
              .from("user_integrations")
              .update({
                access_token: newTokens.access_token,
                token_expires_at: newTokens.expiry_date
                  ? new Date(newTokens.expiry_date).toISOString()
                  : integration.token_expires_at,
                updated_at: new Date().toISOString(),
              })
              .eq("id", integration.id)
          }

          // Get contact name if linked
          let contactName: string | undefined
          if (activity.contact) {
            contactName = `${activity.contact.first_name} ${activity.contact.last_name}`.trim()
          }

          await pushActivityToCalendar(
            supabase,
            { id: integration.id, user_id: user!.id, access_token: accessToken, refresh_token: integration.refresh_token },
            { id: activity.id, title: activity.title, description: activity.description, due_date: activity.due_date, contact_name: contactName }
          )
          console.log("[POST] /api/activities — pushed to Google Calendar")
        }
      } catch (calErr) {
        // Non-blocking — log but don't fail the activity creation
        console.error("[POST] /api/activities — calendar push failed (non-blocking):", calErr)
      }
    }

    return NextResponse.json({ activity }, { status: 201 })
  } catch (err) {
    console.error("[POST] /api/activities — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
