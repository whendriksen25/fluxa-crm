// Deal service — all business logic for deal operations

import type { Deal } from '@/lib/types'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function getDeals(
  supabase: SupabaseClient,
  tenantId: string,
  options?: { boardId?: string; page?: number; pageSize?: number }
) {
  const page = options?.page ?? 1
  const pageSize = options?.pageSize ?? 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('deals')
    .select('*, contact:contacts(first_name, last_name), company:companies(name)', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('stage_position', { ascending: true })
    .range(from, to)

  if (options?.boardId) {
    query = query.eq('board_id', options.boardId)
  }

  return query
}

export async function getDealById(supabase: SupabaseClient, dealId: string) {
  return supabase
    .from('deals')
    .select('*, contact:contacts(*), company:companies(*)')
    .eq('id', dealId)
    .single()
}

export async function createDeal(supabase: SupabaseClient, deal: Partial<Deal>) {
  return supabase.from('deals').insert(deal).select().single()
}

export async function updateDeal(
  supabase: SupabaseClient,
  dealId: string,
  updates: Partial<Deal>
) {
  return supabase
    .from('deals')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', dealId)
    .select()
    .single()
}

export async function moveDealToStage(
  supabase: SupabaseClient,
  dealId: string,
  stageId: string,
  position: number
) {
  return supabase
    .from('deals')
    .update({
      stage_id: stageId,
      stage_position: position,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dealId)
    .select()
    .single()
}

export async function deleteDeal(supabase: SupabaseClient, dealId: string) {
  return supabase.from('deals').delete().eq('id', dealId)
}
