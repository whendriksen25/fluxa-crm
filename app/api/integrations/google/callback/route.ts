import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { exchangeCodeForTokens, getGoogleUserEmail } from "@/lib/integrations/google/auth"
import { NextResponse } from "next/server"

/**
 * GET /api/integrations/google/callback
 * Handles the OAuth callback from Google. Exchanges the code for tokens
 * and stores them in the user_integrations table.
 */
export async function GET(request: Request) {
  console.log("[GET] /api/integrations/google/callback — start")

  try {
    const url = new URL(request.url)
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state") // contains user_id
    const error = url.searchParams.get("error")

    if (error) {
      console.log("[GET] /api/integrations/google/callback — user denied:", error)
      return NextResponse.redirect(new URL("/settings/integrations?error=denied", request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL("/settings/integrations?error=no_code", request.url))
    }

    const { supabase, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Verify state matches current user (CSRF protection)
    if (state && state !== profile.id) {
      console.log("[GET] /api/integrations/google/callback — state mismatch")
      return NextResponse.redirect(new URL("/settings/integrations?error=state_mismatch", request.url))
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)

    if (!tokens.access_token) {
      return NextResponse.redirect(new URL("/settings/integrations?error=no_token", request.url))
    }

    // Get the user's Google email
    const googleEmail = await getGoogleUserEmail(tokens.access_token)

    // Upsert the integration record
    const { error: dbError } = await supabase
      .from("user_integrations")
      .upsert(
        {
          user_id: profile.id,
          tenant_id: profile.tenant_id,
          provider: "google",
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_expires_at: tokens.expiry_date
            ? new Date(tokens.expiry_date).toISOString()
            : null,
          scopes: tokens.scope ? tokens.scope.split(" ") : [],
          email_address: googleEmail,
          sync_enabled: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,provider" }
      )

    if (dbError) {
      console.error("[GET] /api/integrations/google/callback — db error:", dbError.message)
      return NextResponse.redirect(new URL("/settings/integrations?error=db_error", request.url))
    }

    console.log("[GET] /api/integrations/google/callback — connected:", googleEmail)
    return NextResponse.redirect(new URL("/settings/integrations?success=connected", request.url))
  } catch (err) {
    console.error("[GET] /api/integrations/google/callback — error:", err)
    return NextResponse.redirect(new URL("/settings/integrations?error=unknown", request.url))
  }
}
