import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  console.log("[GET] /api/search — start")

  try {
    const { supabase, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")?.trim() || ""

    if (!q || q.length < 2) {
      return NextResponse.json({ contacts: [], companies: [], deals: [] })
    }

    const tenantId = profile.tenant_id
    const pattern = `%${q}%`

    // Search all three tables in parallel
    const [contactsResult, companiesResult, dealsResult] = await Promise.all([
      supabase
        .from("contacts")
        .select("id, first_name, last_name, email, stage, company:companies(name)")
        .eq("tenant_id", tenantId)
        .or(`first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern}`)
        .order("created_at", { ascending: false })
        .limit(10),

      supabase
        .from("companies")
        .select("id, name, category, country, website")
        .eq("tenant_id", tenantId)
        .or(`name.ilike.${pattern},domain.ilike.${pattern},segment.ilike.${pattern}`)
        .order("created_at", { ascending: false })
        .limit(10),

      supabase
        .from("deals")
        .select("id, title, value, stage:kanban_stages(name, color)")
        .eq("tenant_id", tenantId)
        .ilike("title", pattern)
        .order("created_at", { ascending: false })
        .limit(10),
    ])

    console.log("[GET] /api/search — done, q:", q)
    return NextResponse.json({
      contacts: contactsResult.data || [],
      companies: companiesResult.data || [],
      deals: dealsResult.data || [],
    })
  } catch (err) {
    console.error("[GET] /api/search — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
