/**
 * Gmail sync logic
 * Fetches sent/received emails and matches them to CRM contacts.
 */

import { google } from "googleapis"
import { SupabaseClient } from "@supabase/supabase-js"
import { getAuthenticatedClient } from "./auth"

interface SyncResult {
  synced: number
  skipped: number
  errors: string[]
}

/**
 * Sync emails for a user — fetches messages since last sync,
 * matches to CRM contacts by email, and creates activities.
 */
export async function syncGmailEmails(
  supabase: SupabaseClient,
  integration: {
    id: string
    user_id: string
    tenant_id: string
    access_token: string
    refresh_token: string
    last_sync_at: string | null
  }
): Promise<SyncResult> {
  console.log("[gmail-sync] Starting sync for user:", integration.user_id)

  const result: SyncResult = { synced: 0, skipped: 0, errors: [] }

  const auth = getAuthenticatedClient(integration.access_token, integration.refresh_token)
  const gmail = google.gmail({ version: "v1", auth })

  // Build query — sent + received emails since last sync (or last 30 days)
  const sinceDate = integration.last_sync_at
    ? new Date(integration.last_sync_at)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const afterEpoch = Math.floor(sinceDate.getTime() / 1000)
  const query = `after:${afterEpoch}`

  try {
    // Fetch message list
    const listResponse = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: 100,
    })

    const messages = listResponse.data.messages || []
    console.log("[gmail-sync] Found", messages.length, "messages to process")

    // Get all CRM contacts with email addresses for matching
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

    // Process each message
    for (const msg of messages) {
      if (!msg.id) continue

      // Check if already synced
      const { data: existing } = await supabase
        .from("integration_sync_log")
        .select("id")
        .eq("user_integration_id", integration.id)
        .eq("external_id", msg.id)
        .maybeSingle()

      if (existing) {
        result.skipped++
        continue
      }

      try {
        // Fetch full message
        const msgData = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
          format: "metadata",
          metadataHeaders: ["From", "To", "Subject", "Date"],
        })

        const headers = msgData.data.payload?.headers || []
        const getHeader = (name: string) =>
          headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || ""

        const from = getHeader("From")
        const to = getHeader("To")
        const subject = getHeader("Subject")
        const snippet = msgData.data.snippet || ""

        // Extract email addresses from From and To
        const extractEmail = (str: string): string | null => {
          const match = str.match(/<([^>]+)>/) || str.match(/([^\s,]+@[^\s,]+)/)
          return match ? match[1].toLowerCase() : null
        }

        const fromEmail = extractEmail(from)
        const toEmails = to.split(",").map(extractEmail).filter(Boolean) as string[]

        // Try to match to a CRM contact
        let matchedContact: { id: string; company_id: string | null } | null = null

        // Check recipients first (outgoing email), then sender (incoming)
        for (const email of [...toEmails, fromEmail].filter(Boolean) as string[]) {
          const contact = contactMap.get(email)
          if (contact) {
            matchedContact = contact
            break
          }
        }

        if (!matchedContact) {
          result.skipped++
          continue
        }

        // Determine if sent or received
        const isSent = fromEmail && !contactMap.has(fromEmail)
        const title = isSent
          ? `Sent email: ${subject}`
          : `Received email: ${subject}`

        // Create activity
        const { data: activity, error: actError } = await supabase
          .from("activities")
          .insert({
            tenant_id: integration.tenant_id,
            type: "email",
            title,
            description: snippet.substring(0, 500),
            contact_id: matchedContact.id,
            company_id: matchedContact.company_id,
            user_id: integration.user_id,
            is_task: false,
            completed: true,
            created_at: msgData.data.internalDate
              ? new Date(parseInt(msgData.data.internalDate)).toISOString()
              : new Date().toISOString(),
          })
          .select("id")
          .single()

        if (actError) {
          result.errors.push(`Activity insert error for msg ${msg.id}: ${actError.message}`)
          continue
        }

        // Log sync
        await supabase.from("integration_sync_log").insert({
          user_integration_id: integration.id,
          sync_type: isSent ? "gmail_sent" : "gmail_incoming",
          external_id: msg.id,
          activity_id: activity?.id,
        })

        result.synced++
      } catch (msgError) {
        result.errors.push(`Error processing message ${msg.id}: ${String(msgError)}`)
      }
    }

    // Update last_sync_at
    await supabase
      .from("user_integrations")
      .update({ last_sync_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", integration.id)

    console.log("[gmail-sync] Done:", result)
    return result
  } catch (err) {
    console.error("[gmail-sync] Fatal error:", err)
    result.errors.push(`Gmail API error: ${String(err)}`)
    return result
  }
}
