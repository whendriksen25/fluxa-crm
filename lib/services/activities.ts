// Activity service — logging and retrieving activities + work queue

import type { Activity } from '@/lib/types'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function getActivities(
  supabase: SupabaseClient,
  tenantId: string,
  options?: {
    contactId?: string
    dealId?: string
    companyId?: string
    page?: number
    pageSize?: number
  }
) {
  const page = options?.page ?? 1
  const pageSize = options?.pageSize ?? 25
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('activities')
    .select('*, user:users(full_name)', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (options?.contactId) query = query.eq('contact_id', options.contactId)
  if (options?.dealId) query = query.eq('deal_id', options.dealId)
  if (options?.companyId) query = query.eq('company_id', options.companyId)

  return query
}

export async function getWorkQueue(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string
) {
  return supabase
    .from('activities')
    .select('*, contact:contacts(first_name, last_name), deal:deals(title)', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .eq('is_task', true)
    .eq('completed', false)
    .order('due_date', { ascending: true, nullsFirst: false })
}

export async function createActivity(
  supabase: SupabaseClient,
  activity: Partial<Activity>
) {
  return supabase.from('activities').insert(activity).select().single()
}

export async function completeActivity(
  supabase: SupabaseClient,
  activityId: string
) {
  return supabase
    .from('activities')
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq('id', activityId)
    .select()
    .single()
}

export async function updateActivity(
  supabase: SupabaseClient,
  activityId: string,
  updates: Partial<Activity>
) {
  return supabase
    .from('activities')
    .update(updates)
    .eq('id', activityId)
    .select()
    .single()
}

export async function deleteActivity(supabase: SupabaseClient, activityId: string) {
  return supabase.from('activities').delete().eq('id', activityId)
}
