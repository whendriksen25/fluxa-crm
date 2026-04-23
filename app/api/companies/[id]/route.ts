import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  console.log("[GET] /api/companies/" + id + " — start")

  try {
    const { supabase, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const { data: company, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !company) {
      return NextResponse.json({ error: "Company not found." }, { status: 404 })
    }

    // Fetch contacts for this company
    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, first_name, last_name, email, stage, job_title")
      .eq("company_id", id)
      .order("created_at", { ascending: false })

    // Fetch deals for this company
    const { data: deals } = await supabase
      .from("deals")
      .select("*, stage:kanban_stages(name, color)")
      .eq("company_id", id)
      .order("created_at", { ascending: false })

    console.log("[GET] /api/companies/" + id + " — done")
    return NextResponse.json({
      company,
      contacts: contacts || [],
      deals: deals || [],
    })
  } catch (err) {
    console.error("[GET] /api/companies/" + id + " — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  console.log("[PUT] /api/companies/" + id + " — start")

  try {
    const { supabase, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const body = await request.json()

    const { data: company, error } = await supabase
      .from("companies")
      .update({
        name: body.name,
        domain: body.domain || null,
        industry: body.industry || null,
        size: body.size || null,
        website: body.website || null,
        phone: body.phone || null,
        notes: body.notes || null,
        category: body.category || null,
        country: body.country || null,
        region: body.region || null,
        segment: body.segment || null,
        relevance: body.relevance || null,
        network_group: body.network_group || null,
        location: body.location || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.log("[PUT] /api/companies/" + id + " — error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[PUT] /api/companies/" + id + " — updated")
    return NextResponse.json({ company })
  } catch (err) {
    console.error("[PUT] /api/companies/" + id + " — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  console.log("[DELETE] /api/companies/" + id + " — start")

  try {
    const { supabase, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const { error } = await supabase.from("companies").delete().eq("id", id)

    if (error) {
      console.log("[DELETE] /api/companies/" + id + " — error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[DELETE] /api/companies/" + id + " — deleted")
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[DELETE] /api/companies/" + id + " — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
