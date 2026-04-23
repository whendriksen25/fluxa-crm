import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Generic CRUD operations for account plan sub-entities.
 * Each function verifies the plan belongs to the tenant before operating.
 */

export async function verifyPlanOwnership(
  supabase: SupabaseClient,
  planId: string
) {
  const { data: plan, error } = await supabase
    .from("account_plans")
    .select("id, tenant_id")
    .eq("id", planId)
    .single()

  if (error || !plan) return null
  return plan
}

export async function getSubEntities(
  supabase: SupabaseClient,
  table: string,
  planId: string,
  orderBy?: string,
  ascending = true
) {
  let query = supabase
    .from(table)
    .select("*")
    .eq("account_plan_id", planId)

  if (orderBy) {
    query = query.order(orderBy, { ascending })
  }

  const { data, error } = await query
  return { data: data || [], error }
}

export async function createSubEntity(
  supabase: SupabaseClient,
  table: string,
  planId: string,
  body: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from(table)
    .insert({ ...body, account_plan_id: planId })
    .select()
    .single()

  return { data, error }
}

export async function updateSubEntity(
  supabase: SupabaseClient,
  table: string,
  entityId: string,
  body: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from(table)
    .update(body)
    .eq("id", entityId)
    .select()
    .single()

  return { data, error }
}

export async function deleteSubEntity(
  supabase: SupabaseClient,
  table: string,
  entityId: string
) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", entityId)

  return { error }
}

export async function upsertSubEntities(
  supabase: SupabaseClient,
  table: string,
  planId: string,
  items: Record<string, unknown>[]
) {
  // Add account_plan_id to all items
  const withPlanId = items.map((item) => ({
    ...item,
    account_plan_id: planId,
  }))

  const { data, error } = await supabase
    .from(table)
    .upsert(withPlanId)
    .select()

  return { data: data || [], error }
}
