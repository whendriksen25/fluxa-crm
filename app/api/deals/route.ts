import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  console.log("[GET] /api/deals — start")

  try {
    const { supabase, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const boardId = searchParams.get("boardId")

    // If no boardId, get the default board
    let targetBoardId = boardId
    if (!targetBoardId) {
      const { data: board } = await supabase
        .from("kanban_boards")
        .select("id")
        .eq("tenant_id", profile.tenant_id)
        .eq("is_default", true)
        .single()

      targetBoardId = board?.id || null
    }

    if (!targetBoardId) {
      return NextResponse.json({ deals: [], stages: [], board: null })
    }

    // Fetch board, stages, and deals in parallel
    const [boardResult, stagesResult, dealsResult] = await Promise.all([
      supabase
        .from("kanban_boards")
        .select("*")
        .eq("id", targetBoardId)
        .single(),
      supabase
        .from("kanban_stages")
        .select("*")
        .eq("board_id", targetBoardId)
        .order("position", { ascending: true }),
      supabase
        .from("deals")
        .select("*, contact:contacts(id, first_name, last_name), company:companies(id, name)")
        .eq("board_id", targetBoardId)
        .order("stage_position", { ascending: true }),
    ])

    console.log("[GET] /api/deals — done")
    return NextResponse.json({
      board: boardResult.data,
      stages: stagesResult.data || [],
      deals: dealsResult.data || [],
    })
  } catch (err) {
    console.error("[GET] /api/deals — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  console.log("[POST] /api/deals — start")

  try {
    const { supabase, user, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const body = await request.json()

    if (!body.title) {
      return NextResponse.json(
        { error: "Deal title is required." },
        { status: 400 }
      )
    }

    // If no board/stage specified, use the default board's first stage
    let boardId = body.board_id
    let stageId = body.stage_id

    if (!boardId || !stageId) {
      const { data: board } = await supabase
        .from("kanban_boards")
        .select("id")
        .eq("tenant_id", profile.tenant_id)
        .eq("is_default", true)
        .single()

      if (board) {
        boardId = board.id
        const { data: firstStage } = await supabase
          .from("kanban_stages")
          .select("id")
          .eq("board_id", board.id)
          .order("position", { ascending: true })
          .limit(1)
          .single()

        stageId = firstStage?.id
      }
    }

    if (!boardId || !stageId) {
      return NextResponse.json(
        { error: "No pipeline found. Please set up your pipeline first." },
        { status: 400 }
      )
    }

    // Get the next position in this stage
    const { count } = await supabase
      .from("deals")
      .select("*", { count: "exact", head: true })
      .eq("stage_id", stageId)

    const { data: deal, error } = await supabase
      .from("deals")
      .insert({
        tenant_id: profile.tenant_id,
        title: body.title,
        value: body.value || 0,
        company_id: body.company_id || null,
        contact_id: body.contact_id || null,
        owner_id: user!.id,
        board_id: boardId,
        stage_id: stageId,
        stage_position: count || 0,
        expected_close_date: body.expected_close_date || null,
        notes: body.notes || null,
      })
      .select("*, contact:contacts(id, first_name, last_name), company:companies(id, name)")
      .single()

    if (error) {
      console.log("[POST] /api/deals — error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[POST] /api/deals — created:", deal.id)
    return NextResponse.json({ deal }, { status: 201 })
  } catch (err) {
    console.error("[POST] /api/deals — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
