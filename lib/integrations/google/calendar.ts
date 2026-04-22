/**
 * Google Calendar sync logic
 * Two-way sync: CRM activities ↔ Google Calendar events.
 */

import { google, calendar_v3 } from "googleapis"
import { SupabaseClient } from "@supabase/supabase-js"
import { getAuthenticatedClient } from "./auth"

interface CalendarSyncResult {
  pushed: number
  pulled: number
  errors: string[]
}

/**
 * Push a CRM activity (task/follow-up) to Google Calendar as an event.
 */
export async function pushActivityToCalendar(
  supabase: SupabaseClient,
  integration: {
    id: string
    user_id: string
    access_token: string
    refresh_token: string
  },
  activity: {
    id: string
    title: string
    description: string | null
    due_date: string
    contact_name?: string
  }
): Promise<{ eventId: string | null; error: string | null }> {
  console.log("[calendar-push] Pushing activity to calendar:", activity.id)

  try {
    const auth = getAuthenticatedClient(integration.access_token, integration.refresh_token)
    const calendar = google.calendar({ version: "v3", auth })

    const dueDate = new Date(activity.due_date)
    const endDate = new Date(dueDate.getTime() + 30 * 60 * 1000) // 30 min default duration

    const event: calendar_v3.Schema$Event = {
      summary: activity.title,
      description: [
        activity.description || "",
        activity.contact_name ? `Contact: ${activity.contact_name}` : "",
        "Created by Bridge CRM",
      ]
        .filter(Boolean)
        .join("\n"),
      start: {
        dateTime: dueDate.toISOString(),
        timeZone: "Europe/Amsterdam",
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: "Europe/Amsterdam",
      },
      reminders: {
        useDefault: false,
        overrides: [{ method: "popup", minutes: 15 }],
      },
    }

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    })

    const eventId = response.data.id || null

    // Log in sync table
    if (eventId) {
      await supabase.from("integration_sync_log").insert({
        user_integration_id: integration.id,
        sync_type: "calendar_push",
        external_id: eventId,
        activity_id: activity.id,
      })
    }

    console.log("[calendar-push] Created event:", eventId)
    return { eventId, error: null }
  } catch (err) {
    console.error("[calendar-push] Error:", err)
    return { eventId: null, error: String(err) }
  }
}

/**
 * Pull events from Google Calendar and create CRM activities.
 */
export async function pullCalendarEvents(
  supabase: SupabaseClient,
  integration: {
    id: string
    user_id: string
    tenant_id: string
    access_token: string
    refresh_token: string
    last_sync_at: string | null
  }
): Promise<CalendarSyncResult> {
  console.log("[calendar-pull] Starting pull for user:", integration.user_id)

  const result: CalendarSyncResult = { pushed: 0, pulled: 0, errors: [] }

  try {
    const auth = getAuthenticatedClient(integration.access_token, integration.refresh_token)
    const calendar = google.calendar({ version: "v3", auth })

    const timeMin = integration.last_sync_at
      ? new Date(integration.last_sync_at).toISOString()
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: "startTime",
    })

    const events = response.data.items || []
    console.log("[calendar-pull] Found", events.length, "events")

    // Get contacts for attendee matching
    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, email, company_id")
      .eq("tenant_id", integration.tenant_id)
      .not("email", "is", null)

    const contactMap = new Map<string, { id: string; company_id: string | null }>()
    for (const c of contacts || []) {
      if (c.email) {
        contactMap.set(c.email.toLowerCase(), { id: c.id, company_id: c.company_id })
      }
    }

    for (const event of events) {
      if (!event.id) continue

      // Skip events already synced
      const { data: existing } = await supabase
        .from("integration_sync_log")
        .select("id")
        .eq("user_integration_id", integration.id)
        .eq("external_id", event.id)
        .maybeSingle()

      if (existing) continue

      // Skip events created by Bridge CRM (avoid push-pull loop)
      if (event.description?.includes("Created by Bridge CRM")) continue

      // Try to match attendees to CRM contacts
      let matchedContact: { id: string; company_id: string | null } | null = null
      const attendees = event.attendees || []
      for (const attendee of attendees) {
        if (attendee.email) {
          const contact = contactMap.get(attendee.email.toLowerCase())
          if (contact) {
            matchedContact = contact
            break
          }
        }
      }

      // Get event time
      const startTime =
        event.start?.dateTime || event.start?.date || new Date().toISOString()

      // Create activity
      const { data: activity, error: actError } = await supabase
        .from("activities")
        .insert({
          tenant_id: integration.tenant_id,
          type: "meeting",
          title: event.summary || "Calendar event",
          description: event.description?.substring(0, 500) || null,
          contact_id: matchedContact?.id || null,
          company_id: matchedContact?.company_id || null,
          user_id: integration.user_id,
          is_task: false,
          completed: false,
          due_date: startTime,
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (actError) {
        result.errors.push(`Error creating activity for event ${event.id}: ${actError.message}`)
        continue
      }

      // Log sync
      await supabase.from("integration_sync_log").insert({
        user_integration_id: integration.id,
        sync_type: "calendar_pull",
        external_id: event.id,
        activity_id: activity?.id,
      })

      result.pulled++
    }

    console.log("[calendar-pull] Done:", result)
    return result
  } catch (err) {
    console.error("[calendar-pull] Fatal error:", err)
    result.errors.push(`Calendar API error: ${String(err)}`)
    return result
  }
}

/**
 * Delete/cancel a Google Calendar event (e.g. when a task is completed).
 */
export async function cancelCalendarEvent(
  integration: {
    access_token: string
    refresh_token: string
  },
  eventId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const auth = getAuthenticatedClient(integration.access_token, integration.refresh_token)
    const calendar = google.calendar({ version: "v3", auth })

    await calendar.events.delete({
      calendarId: "primary",
      eventId,
    })

    return { success: true, error: null }
  } catch (err) {
    console.error("[calendar-cancel] Error:", err)
    return { success: false, error: String(err) }
  }
}
