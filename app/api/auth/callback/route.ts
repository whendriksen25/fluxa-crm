import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  console.log("[GET] /api/auth/callback — start")

  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      console.log("[GET] /api/auth/callback — success, redirecting to:", next)
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.log("[GET] /api/auth/callback — error:", error.message)
  }

  console.log("[GET] /api/auth/callback — failed, redirecting to login")
  return NextResponse.redirect(`${origin}/login`)
}
