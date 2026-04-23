import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  console.log("[POST] /api/auth/forgot-password — start")

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
    })

    if (error) {
      console.log("[POST] /api/auth/forgot-password — error:", error.message)
      // Don't reveal if email exists or not
    }

    console.log("[POST] /api/auth/forgot-password — done")
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[POST] /api/auth/forgot-password — unexpected error:", err)
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    )
  }
}
