import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { verifyPlanOwnership, getSubEntities, createSubEntity } from "@/lib/services/account-plans"
import { NextResponse } from "next/server"

const TABLE = "account_value_map"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  const { planId } = await params
  console.log(`[GET] /api/account-plans/${planId}/value-map — start`)
  try {
    const { supabase, profile } = await getAuthenticatedUser()
    if (!profile) return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    const plan = await verifyPlanOwnership(supabase, planId)
    if (!plan) return NextResponse.json({ error: "Plan not found." }, { status: 404 })
    const { data, error } = await getSubEntities(supabase, TABLE, planId, "quantified_impact", false)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    console.log(`[GET] /api/account-plans/${planId}/value-map — done (${data.length})`)
    return NextResponse.json({ data })
  } catch (err) {
    console.error(`[GET] value-map error:`, err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  const { planId } = await params
  console.log(`[POST] /api/account-plans/${planId}/value-map — start`)
  try {
    const { supabase, profile } = await getAuthenticatedUser()
    if (!profile) return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    const plan = await verifyPlanOwnership(supabase, planId)
    if (!plan) return NextResponse.json({ error: "Plan not found." }, { status: 404 })
    const body = await request.json()
    const { data, error } = await createSubEntity(supabase, TABLE, planId, body)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    console.log(`[POST] /api/account-plans/${planId}/value-map — created`)
    return NextResponse.json({ data })
  } catch (err) {
    console.error(`[POST] value-map error:`, err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
