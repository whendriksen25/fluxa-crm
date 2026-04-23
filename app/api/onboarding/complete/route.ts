import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function POST() {
  console.log("[POST] /api/onboarding/complete — start")

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    // Use admin client to read user profile and update tenant
    const admin = createAdminClient()

    const { data: profile } = await admin
      .from("users")
      .select("tenant_id")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "User not found." }, { status: 404 })
    }

    await admin
      .from("tenants")
      .update({ onboarding_completed: true })
      .eq("id", profile.tenant_id)

    console.log("[POST] /api/onboarding/complete — done for tenant:", profile.tenant_id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[POST] /api/onboarding/complete — error:", err)
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    )
  }
}
