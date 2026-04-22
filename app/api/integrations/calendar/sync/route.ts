import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { refreshAccessToken } from "@/lib/integrations/google/auth"
import { pullCalendarEvents, pushActivityToCalendar } from "@/lib/integrations/google/calendar"
import { NextResponse } from "next/server"

/**
 * POST /api/integrations/calendar/sync
 * Triggers a two-way Calendar sync for the current user.
 *
 * Body (optional):
 *   { activity_id: string }  — push a specific activity to Google Calendar
 *
 * If no body, does a full pull of calendar events.
 */
export async function POST(request: Request) {
  console.log("[POST] /api/integrations/calendar/sync — start")

  try {
    const { supabase, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    // Get the user's Google integration
    const { data: integration } = await supabase
      .from("user_integrations")
      .select("*")
      .eq("user_id", profile.id)
      .eq("provider", "google")
      .eq("sync_enabled", true)
      .maybeSingle()

    if (!integration) {
      return NextResponse.json(
        { error: "Google integration not found. Please connect your Google account first." },
        { status: 404 }
      )
    }

    // Check if token needs refresh
    let accessToken = integration.access_token
    if (integration.token_expires_at && new Date(integration.token_expires_at) < new Date()) {
      console.log("[POST] /api/integrations/calendar/sync — refreshing token")
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

    const integrationData = {
      id: integration.id,
      user_id: profile.id,
      tenant_id: profile.tenant_id,
      access_token: accessToken,
      refresh_token: integration.refresh_token,
      last_sync_at: integration.last_sync_at,
    }

    // Check if this is a push (specific activity) or pull (full sync)
    let body: { activity_id?: string } = {}
    try {
      body = await request.json()
    } catch {
      // No body = full pull sync
    }

    if (body.activity_id) {
      // Push a specific activity to Google Calendar
      const { data: activity } = await supabase
        .from("activities")
        .select("id, title, description, due_date")
        .eq("id", body.activity_id)
        .single()

      if (!activity || !activity.due_date) {
        return NextResponse.json({ error: "Activity not found or has no due date." }, { status: 404 })
      }

      // Get linked contact name if available
      const { data: activityFull } = await supabase
        .from("activities")
        .select("contact_id")
        .eq("id", body.activity_id)
        .single()

      let contactName: string | undefined
      if (activityFull?.contact_id) {
        const { data: contact } = await supabase
          .from("contacts")
          .select("first_name, last_name")
          .eq("id", activityFull.contact_id)
          .single()
        if (contact) {
          contactName = `${contact.first_name} ${contact.last_name}`.trim()
        }
      }

      const result = await pushActivityToCalendar(supabase, integrationData, {
        ...activity,
        contact_name: contactName,
      })

      console.log("[POST] /api/integrations/calendar/sync — push done:", result)
      return NextResponse.json({ result })
    }

    // Full pull sync
    const result = await pullCalendarEvents(supabase, integrationData)

    // Update last_sync_at
    await supabase
      .from("user_integrations")
      .update({ last_sync_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", integration.id)

    console.log("[POST] /api/integrations/calendar/sync — pull done:", result)
    return NextResponse.json({ result })
  } catch (err) {
    console.error("[POST] /api/integrations/calendar/sync — error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
