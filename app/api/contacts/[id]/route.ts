import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  console.log("[GET] /api/contacts/" + id + " — start")

  try {
    const { supabase, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const { data: contact, error } = await supabase
      .from("contacts")
      .select("*, company:companies(id, name)")
      .eq("id", id)
      .single()

    if (error || !contact) {
      return NextResponse.json({ error: "Contact not found." }, { status: 404 })
    }

    // Fetch activities for this contact
    const { data: activities } = await supabase
      .from("activities")
      .select("*")
      .eq("contact_id", id)
      .order("created_at", { ascending: false })
      .limit(50)

    // Fetch deals for this contact
    const { data: deals } = await supabase
      .from("deals")
      .select("*, stage:kanban_stages(name, color)")
      .eq("contact_id", id)
      .order("created_at", { ascending: false })

    console.log("[GET] /api/contacts/" + id + " — done")
    return NextResponse.json({ contact, activities: activities || [], deals: deals || [] })
  } catch (err) {
    console.error("[GET] /api/contacts/" + id + " — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  console.log("[PUT] /api/contacts/" + id + " — start")

  try {
    const { supabase, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const body = await request.json()

    const { data: contact, error } = await supabase
      .from("contacts")
      .update({
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email || null,
        phone: body.phone || null,
        job_title: body.job_title || null,
        company_id: body.company_id || null,
        stage: body.stage,
        lead_source: body.lead_source || null,
        tags: body.tags,
        notes: body.notes || null,
        next_follow_up: body.next_follow_up || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*, company:companies(id, name)")
      .single()

    if (error) {
      console.log("[PUT] /api/contacts/" + id + " — error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[PUT] /api/contacts/" + id + " — updated")
    return NextResponse.json({ contact })
  } catch (err) {
    console.error("[PUT] /api/contacts/" + id + " — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  console.log("[DELETE] /api/contacts/" + id + " — start")

  try {
    const { supabase, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const { error } = await supabase.from("contacts").delete().eq("id", id)

    if (error) {
      console.log("[DELETE] /api/contacts/" + id + " — error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[DELETE] /api/contacts/" + id + " — deleted")
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[DELETE] /api/contacts/" + id + " — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
