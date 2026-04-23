import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  console.log("[GET] /api/companies/" + id + "/account-plan — start")

  try {
    const { supabase, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    // Fetch the account plan for this company
    const { data: plan, error } = await supabase
      .from("account_plans")
      .select("*")
      .eq("company_id", id)
      .maybeSingle()

    if (error) {
      console.log("[GET] account-plan error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // No plan exists yet — return null so the frontend can show a "Create Plan" button
    if (!plan) {
      console.log("[GET] /api/companies/" + id + "/account-plan — no plan found")
      return NextResponse.json({ plan: null })
    }

    // Fetch all related data in parallel
    const [
      objectives,
      swot,
      stakeholders,
      connections,
      actions,
      businessUnits,
      buyingRoles,
      coverageCells,
      valueMap,
      solutions,
      whitespace,
      competitors,
      advisors,
      revenueForecasts,
      revenueEvents,
      opportunities,
      pipelineRisk,
    ] = await Promise.all([
      supabase.from("account_plan_objectives").select("*").eq("account_plan_id", plan.id).order("position"),
      supabase.from("account_plan_swot").select("*").eq("account_plan_id", plan.id).order("position"),
      supabase.from("account_stakeholders").select("*").eq("account_plan_id", plan.id).order("influence_weight", { ascending: false }),
      supabase.from("account_stakeholder_connections").select("*").eq("account_plan_id", plan.id),
      supabase.from("account_actions").select("*").eq("account_plan_id", plan.id).order("due_date"),
      supabase.from("account_business_units").select("*").eq("account_plan_id", plan.id).order("position"),
      supabase.from("account_buying_roles").select("*").eq("account_plan_id", plan.id).order("position"),
      supabase.from("account_coverage_cells").select("*").eq("account_plan_id", plan.id),
      supabase.from("account_value_map").select("*").eq("account_plan_id", plan.id),
      supabase.from("account_solutions").select("*").eq("account_plan_id", plan.id).order("position"),
      supabase.from("account_whitespace_cells").select("*").eq("account_plan_id", plan.id),
      supabase.from("account_competitors").select("*").eq("account_plan_id", plan.id),
      supabase.from("account_advisors").select("*").eq("account_plan_id", plan.id),
      supabase.from("account_revenue_forecasts").select("*").eq("account_plan_id", plan.id).order("month_index"),
      supabase.from("account_revenue_events").select("*").eq("account_plan_id", plan.id).order("month_index"),
      supabase.from("account_opportunities").select("*").eq("account_plan_id", plan.id).order("value", { ascending: false }),
      supabase.from("account_pipeline_risk").select("*").eq("account_plan_id", plan.id).order("month_index"),
    ])

    const fullPlan = {
      ...plan,
      objectives: objectives.data || [],
      swot: swot.data || [],
      stakeholders: stakeholders.data || [],
      connections: connections.data || [],
      actions: actions.data || [],
      business_units: businessUnits.data || [],
      buying_roles: buyingRoles.data || [],
      coverage_cells: coverageCells.data || [],
      value_map: valueMap.data || [],
      solutions: solutions.data || [],
      whitespace_cells: whitespace.data || [],
      competitors: competitors.data || [],
      advisors: advisors.data || [],
      revenue_forecasts: revenueForecasts.data || [],
      revenue_events: revenueEvents.data || [],
      opportunities: opportunities.data || [],
      pipeline_risk: pipelineRisk.data || [],
    }

    console.log("[GET] /api/companies/" + id + "/account-plan — done")
    return NextResponse.json({ plan: fullPlan })
  } catch (err) {
    console.error("[GET] /api/companies/" + id + "/account-plan — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  console.log("[POST] /api/companies/" + id + "/account-plan — start")

  try {
    const { supabase, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    // Check if plan already exists
    const { data: existing } = await supabase
      .from("account_plans")
      .select("id")
      .eq("company_id", id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "Account plan already exists for this company." }, { status: 409 })
    }

    const body = await request.json()

    const { data: plan, error } = await supabase
      .from("account_plans")
      .insert({
        tenant_id: profile.tenant_id,
        company_id: id,
        account_type: body.account_type || "Growth",
        account_health: body.account_health || 0,
        current_arr: body.current_arr || 0,
        potential_arr: body.potential_arr || 0,
        risk_level: body.risk_level || "Low",
        owner_id: profile.id,
      })
      .select()
      .single()

    if (error) {
      console.log("[POST] account-plan error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[POST] /api/companies/" + id + "/account-plan — created")
    return NextResponse.json({ plan })
  } catch (err) {
    console.error("[POST] /api/companies/" + id + "/account-plan — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  console.log("[PUT] /api/companies/" + id + "/account-plan — start")

  try {
    const { supabase, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const body = await request.json()

    const { data: plan, error } = await supabase
      .from("account_plans")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("company_id", id)
      .select()
      .single()

    if (error) {
      console.log("[PUT] account-plan error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[PUT] /api/companies/" + id + "/account-plan — updated")
    return NextResponse.json({ plan })
  } catch (err) {
    console.error("[PUT] /api/companies/" + id + "/account-plan — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
