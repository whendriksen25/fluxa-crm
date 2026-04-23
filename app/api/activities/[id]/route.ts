import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { NextResponse } from "next/server"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  console.log("[PUT] /api/activities/" + id + " — start")

  try {
    const { supabase, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const body = await request.json()

    // If completing a task, set completed_at
    const updates: Record<string, unknown> = { ...body }
    if (body.completed === true && !body.completed_at) {
      updates.completed_at = new Date().toISOString()
    }

    const { data: activity, error } = await supabase
      .from("activities")
      .update(updates)
      .eq("id", id)
      .select(
        "*, user:users(full_name), contact:contacts(first_name, last_name), deal:deals(title), company:companies(name)"
      )
      .single()

    if (error) {
      console.log("[PUT] /api/activities/" + id + " — error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[PUT] /api/activities/" + id + " — updated")
    return NextResponse.json({ activity })
  } catch (err) {
    console.error("[PUT] /api/activities/" + id + " — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  console.log("[DELETE] /api/activities/" + id + " — start")

  try {
    const { supabase, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const { error } = await supabase.from("activities").delete().eq("id", id)

    if (error) {
      console.log("[DELETE] /api/activities/" + id + " — error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[DELETE] /api/activities/" + id + " — deleted")
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[DELETE] /api/activities/" + id + " — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
