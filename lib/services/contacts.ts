// Contact service — all business logic for contact operations
// Called by API routes — never put business logic in the route handler

import type { Contact } from '@/lib/types'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function getContacts(
  supabase: SupabaseClient,
  tenantId: string,
  options?: { search?: string; stage?: string; page?: number; pageSize?: number }
) {
  const page = options?.page ?? 1
  const pageSize = options?.pageSize ?? 25
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('contacts')
    .select('*, company:companies(name)', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (options?.search) {
    query = query.or(
      `first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%,email.ilike.%${options.search}%`
    )
  }

  if (options?.stage) {
    query = query.eq('stage', options.stage)
  }

  return query
}

export async function getContactById(
  supabase: SupabaseClient,
  contactId: string
) {
  return supabase
    .from('contacts')
    .select('*, company:companies(*)')
    .eq('id', contactId)
    .single()
}

export async function createContact(
  supabase: SupabaseClient,
  contact: Partial<Contact>
) {
  return supabase.from('contacts').insert(contact).select().single()
}

export async function updateContact(
  supabase: SupabaseClient,
  contactId: string,
  updates: Partial<Contact>
) {
  return supabase
    .from('contacts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', contactId)
    .select()
    .single()
}

export async function deleteContact(
  supabase: SupabaseClient,
  contactId: string
) {
  return supabase.from('contacts').delete().eq('id', contactId)
}
