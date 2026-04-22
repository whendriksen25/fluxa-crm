import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  console.log("[GET] /api/companies — start")

  try {
    const { supabase, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || ""
    const country = searchParams.get("country") || ""
    const relevance = searchParams.get("relevance") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "25")
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from("companies")
      .select("*", { count: "exact" })
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,domain.ilike.%${search}%,segment.ilike.%${search}%`
      )
    }

    if (category) {
      query = query.eq("category", category)
    }

    if (country) {
      query = query.eq("country", country)
    }

    if (relevance) {
      query = query.eq("relevance", relevance)
    }

    const { data: companies, error, count } = await query

    if (error) {
      console.log("[GET] /api/companies — error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[GET] /api/companies — done, count:", count)
    return NextResponse.json({ companies, total: count })
  } catch (err) {
    console.error("[GET] /api/companies — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  console.log("[POST] /api/companies — start")

  try {
    const { supabase, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const body = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { error: "Company name is required." },
        { status: 400 }
      )
    }

    const { data: company, error } = await supabase
      .from("companies")
      .insert({
        tenant_id: profile.tenant_id,
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
      })
      .select()
      .single()

    if (error) {
      console.log("[POST] /api/companies — error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[POST] /api/companies — created:", company.id)
    return NextResponse.json({ company }, { status: 201 })
  } catch (err) {
    console.error("[POST] /api/companies — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
