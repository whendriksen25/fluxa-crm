import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { NextResponse } from "next/server"

export async function PUT(request: Request) {
  console.log("[PUT] /api/deals/move — start")

  try {
    const { supabase, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const { dealId, stageId, position } = await request.json()

    if (!dealId || !stageId || position === undefined) {
      return NextResponse.json(
        { error: "dealId, stageId, and position are required." },
        { status: 400 }
      )
    }

    const { data: deal, error } = await supabase
      .from("deals")
      .update({
        stage_id: stageId,
        stage_position: position,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dealId)
      .select()
      .single()

    if (error) {
      console.log("[PUT] /api/deals/move — error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[PUT] /api/deals/move — moved deal", dealId, "to stage", stageId)
    return NextResponse.json({ deal })
  } catch (err) {
    console.error("[PUT] /api/deals/move — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
