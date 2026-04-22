import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { NextResponse } from "next/server"

/**
 * GET /api/integrations/google/status
 * Returns the current user's Google integration status (or null if not connected).
 */
export async function GET() {
  console.log("[GET] /api/integrations/google/status — start")

  try {
    const { supabase, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const { data: integration } = await supabase
      .from("user_integrations")
      .select("id, provider, email_address, sync_enabled, last_sync_at, scopes")
      .eq("user_id", profile.id)
      .eq("provider", "google")
      .maybeSingle()

    console.log("[GET] /api/integrations/google/status — done:", integration ? "connected" : "not connected")
    return NextResponse.json({ integration })
  } catch (err) {
    console.error("[GET] /api/integrations/google/status — error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
