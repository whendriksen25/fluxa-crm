// Kanban service — board and stage management + card operations

import type { KanbanBoard, KanbanStage } from '@/lib/types'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function getBoards(supabase: SupabaseClient, tenantId: string) {
  return supabase
    .from('kanban_boards')
    .select('*, stages:kanban_stages(*)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true })
}

export async function getBoardWithDeals(supabase: SupabaseClient, boardId: string) {
  const [boardResult, dealsResult] = await Promise.all([
    supabase
      .from('kanban_boards')
      .select('*, stages:kanban_stages(*)')
      .eq('id', boardId)
      .single(),
    supabase
      .from('deals')
      .select('*, contact:contacts(first_name, last_name), company:companies(name)')
      .eq('board_id', boardId)
      .order('stage_position', { ascending: true }),
  ])

  return { board: boardResult, deals: dealsResult }
}

export async function createBoard(
  supabase: SupabaseClient,
  board: Partial<KanbanBoard>
) {
  return supabase.from('kanban_boards').insert(board).select().single()
}

export async function createStage(
  supabase: SupabaseClient,
  stage: Partial<KanbanStage>
) {
  return supabase.from('kanban_stages').insert(stage).select().single()
}

export async function updateStage(
  supabase: SupabaseClient,
  stageId: string,
  updates: Partial<KanbanStage>
) {
  return supabase
    .from('kanban_stages')
    .update(updates)
    .eq('id', stageId)
    .select()
    .single()
}

export async function reorderStages(
  supabase: SupabaseClient,
  stages: { id: string; position: number }[]
) {
  const updates = stages.map((s) =>
    supabase
      .from('kanban_stages')
      .update({ position: s.position })
      .eq('id', s.id)
  )
  return Promise.all(updates)
}

export async function deleteBoard(supabase: SupabaseClient, boardId: string) {
  return supabase.from('kanban_boards').delete().eq('id', boardId)
}

export async function deleteStage(supabase: SupabaseClient, stageId: string) {
  return supabase.from('kanban_stages').delete().eq('id', stageId)
}
