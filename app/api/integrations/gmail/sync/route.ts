import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { refreshAccessToken } from "@/lib/integrations/google/auth"
import { syncGmailEmails } from "@/lib/integrations/google/gmail"
import { NextResponse } from "next/server"

/**
 * POST /api/integrations/gmail/sync
 * Triggers a Gmail sync for the current user.
 */
export async function POST() {
  console.log("[POST] /api/integrations/gmail/sync — start")

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
      console.log("[POST] /api/integrations/gmail/sync — refreshing token")
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

    // Run the sync
    const result = await syncGmailEmails(supabase, {
      id: integration.id,
      user_id: profile.id,
      tenant_id: profile.tenant_id,
      access_token: accessToken,
      refresh_token: integration.refresh_token,
      last_sync_at: integration.last_sync_at,
    })

    console.log("[POST] /api/integrations/gmail/sync — done:", result)
    return NextResponse.json({ result })
  } catch (err) {
    console.error("[POST] /api/integrations/gmail/sync — error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
