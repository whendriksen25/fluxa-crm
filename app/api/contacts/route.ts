import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  console.log("[GET] /api/contacts — start")

  try {
    const { supabase, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const stage = searchParams.get("stage") || ""
    const tag = searchParams.get("tag") || ""
    const leadSource = searchParams.get("leadSource") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "25")
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from("contacts")
      .select("*, company:companies(id, name)", { count: "exact" })
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
      )
    }

    if (stage) {
      query = query.eq("stage", stage)
    }

    if (tag) {
      query = query.contains("tags", [tag])
    }

    if (leadSource) {
      query = query.eq("lead_source", leadSource)
    }

    const { data: contacts, error, count } = await query

    if (error) {
      console.log("[GET] /api/contacts — error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[GET] /api/contacts — done, count:", count)
    return NextResponse.json({ contacts, total: count })
  } catch (err) {
    console.error("[GET] /api/contacts — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  console.log("[POST] /api/contacts — start")

  try {
    const { supabase, user, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const body = await request.json()

    if (!body.first_name || !body.last_name) {
      return NextResponse.json(
        { error: "First name and last name are required." },
        { status: 400 }
      )
    }

    const { data: contact, error } = await supabase
      .from("contacts")
      .insert({
        tenant_id: profile.tenant_id,
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email || null,
        phone: body.phone || null,
        job_title: body.job_title || null,
        company_id: body.company_id || null,
        stage: body.stage || "lead",
        source: body.source || "manual",
        lead_source: body.lead_source || null,
        owner_id: user!.id,
        tags: body.tags || [],
        notes: body.notes || null,
      })
      .select("*, company:companies(id, name)")
      .single()

    if (error) {
      console.log("[POST] /api/contacts — error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[POST] /api/contacts — created:", contact.id)
    return NextResponse.json({ contact }, { status: 201 })
  } catch (err) {
    console.error("[POST] /api/contacts — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
