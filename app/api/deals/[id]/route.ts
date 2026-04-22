import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { NextResponse } from "next/server"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  console.log("[DELETE] /api/deals/" + id + " — start")

  try {
    const { supabase, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const { error } = await supabase.from("deals").delete().eq("id", id)

    if (error) {
      console.log("[DELETE] /api/deals/" + id + " — error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[DELETE] /api/deals/" + id + " — deleted")
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[DELETE] /api/deals/" + id + " — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
