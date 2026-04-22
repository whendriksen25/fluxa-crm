import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { revokeGoogleToken } from "@/lib/integrations/google/auth"
import { NextResponse } from "next/server"

/**
 * DELETE /api/integrations/google/disconnect
 * Revokes the Google token and removes the integration record.
 */
export async function DELETE() {
  console.log("[DELETE] /api/integrations/google/disconnect — start")

  try {
    const { supabase, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    // Get current integration
    const { data: integration } = await supabase
      .from("user_integrations")
      .select("*")
      .eq("user_id", profile.id)
      .eq("provider", "google")
      .maybeSingle()

    if (!integration) {
      return NextResponse.json({ error: "No Google integration found." }, { status: 404 })
    }

    // Try to revoke the token with Google (best effort)
    if (integration.access_token) {
      try {
        await revokeGoogleToken(integration.access_token)
      } catch {
        console.log("[DELETE] Token revocation failed (may already be expired)")
      }
    }

    // Delete sync logs first (FK constraint)
    await supabase
      .from("integration_sync_log")
      .delete()
      .eq("user_integration_id", integration.id)

    // Delete the integration record
    const { error: delError } = await supabase
      .from("user_integrations")
      .delete()
      .eq("id", integration.id)

    if (delError) {
      console.error("[DELETE] /api/integrations/google/disconnect — error:", delError.message)
      return NextResponse.json({ error: delError.message }, { status: 500 })
    }

    console.log("[DELETE] /api/integrations/google/disconnect — done")
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[DELETE] /api/integrations/google/disconnect — error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
