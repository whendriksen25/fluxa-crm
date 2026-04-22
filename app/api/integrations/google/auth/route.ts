import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { getGoogleAuthUrl } from "@/lib/integrations/google/auth"
import { NextResponse } from "next/server"

/**
 * GET /api/integrations/google/auth
 * Redirects the user to Google's OAuth consent screen.
 */
export async function GET() {
  console.log("[GET] /api/integrations/google/auth — start")

  try {
    const { profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const authUrl = getGoogleAuthUrl(profile.id)
    console.log("[GET] /api/integrations/google/auth — redirecting to Google")
    return NextResponse.redirect(authUrl)
  } catch (err) {
    console.error("[GET] /api/integrations/google/auth — error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
