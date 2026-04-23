import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  console.log("[POST] /api/auth/login — start")

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.log("[POST] /api/auth/login — error:", error.message)
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      )
    }

    console.log("[POST] /api/auth/login — success")
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[POST] /api/auth/login — unexpected error:", err)
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    )
  }
}
