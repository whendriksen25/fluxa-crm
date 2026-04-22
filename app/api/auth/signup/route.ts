import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  console.log("[POST] /api/auth/signup — start")

  try {
    const { fullName, email, password, companyName, plan } =
      await request.json()

    if (!fullName || !email || !password || !companyName) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      )
    }

    // Use the regular server client for auth (sets cookies)
    const supabase = await createClient()

    // 1. Create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company_name: companyName,
        },
      },
    })

    if (authError) {
      console.log("[POST] /api/auth/signup — auth error:", authError.message)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Could not create account." },
        { status: 500 }
      )
    }

    // Use admin client (bypasses RLS) for tenant/user/board creation
    // because the new user doesn't have a tenant_id yet
    const admin = createAdminClient()

    // 2. Create tenant
    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    const { data: tenant, error: tenantError } = await admin
      .from("tenants")
      .insert({
        name: companyName,
        slug: `${slug}-${Date.now()}`,
        billing_plan: plan === "pro" ? "pro" : "free",
      })
      .select()
      .single()

    if (tenantError) {
      console.log("[POST] /api/auth/signup — tenant error:", tenantError.message)
      return NextResponse.json(
        { error: "Could not set up your company. Please try again." },
        { status: 500 }
      )
    }

    // 3. Create user profile
    const { error: userError } = await admin.from("users").insert({
      id: authData.user.id,
      tenant_id: tenant.id,
      email,
      full_name: fullName,
      role: "owner",
    })

    if (userError) {
      console.log("[POST] /api/auth/signup — user error:", userError.message)
      return NextResponse.json(
        { error: "Could not create your profile. Please try again." },
        { status: 500 }
      )
    }

    // 4. Create default Kanban board with stages
    const { data: board } = await admin
      .from("kanban_boards")
      .insert({
        tenant_id: tenant.id,
        name: "Sales Pipeline",
        description: "Your default sales pipeline",
        is_default: true,
      })
      .select()
      .single()

    if (board) {
      const defaultStages = [
        { name: "New Lead", color: "#6366f1", position: 0, is_won: false, is_lost: false },
        { name: "Contacted", color: "#3b82f6", position: 1, is_won: false, is_lost: false },
        { name: "Proposal Sent", color: "#f59e0b", position: 2, is_won: false, is_lost: false },
        { name: "Negotiation", color: "#f97316", position: 3, is_won: false, is_lost: false },
        { name: "Won", color: "#22c55e", position: 4, is_won: true, is_lost: false },
        { name: "Lost", color: "#ef4444", position: 5, is_won: false, is_lost: true },
      ]

      await admin.from("kanban_stages").insert(
        defaultStages.map((stage) => ({
          ...stage,
          board_id: board.id,
        }))
      )
    }

    console.log("[POST] /api/auth/signup — success, tenant:", tenant.id)
    return NextResponse.json({ success: true, tenantId: tenant.id })
  } catch (err) {
    console.error("[POST] /api/auth/signup — unexpected error:", err)
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    )
  }
}
