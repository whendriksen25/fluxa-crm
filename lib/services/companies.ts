// Company service — all business logic for company operations

import type { Company } from '@/lib/types'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function getCompanies(
  supabase: SupabaseClient,
  tenantId: string,
  options?: { search?: string; page?: number; pageSize?: number }
) {
  const page = options?.page ?? 1
  const pageSize = options?.pageSize ?? 25
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('companies')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (options?.search) {
    query = query.or(
      `name.ilike.%${options.search}%,domain.ilike.%${options.search}%`
    )
  }

  return query
}

export async function getCompanyById(supabase: SupabaseClient, companyId: string) {
  return supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single()
}

export async function createCompany(supabase: SupabaseClient, company: Partial<Company>) {
  return supabase.from('companies').insert(company).select().single()
}

export async function updateCompany(
  supabase: SupabaseClient,
  companyId: string,
  updates: Partial<Company>
) {
  return supabase
    .from('companies')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', companyId)
    .select()
    .single()
}

export async function deleteCompany(supabase: SupabaseClient, companyId: string) {
  return supabase.from('companies').delete().eq('id', companyId)
}
