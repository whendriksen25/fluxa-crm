import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { updateSubEntity, deleteSubEntity } from "@/lib/services/account-plans"
import { NextResponse } from "next/server"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  const { entityId } = await params
  console.log(`[PUT] /api/account-plans/entity/${entityId} — start`)
  try {
    const { supabase, profile } = await getAuthenticatedUser()
    if (!profile) return NextResponse.json({ error: "Not authenticated." }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const table = searchParams.get("table")
    if (!table) return NextResponse.json({ error: "Missing table parameter." }, { status: 400 })

    const body = await request.json()
    const { data, error } = await updateSubEntity(supabase, table, entityId, body)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    console.log(`[PUT] /api/account-plans/entity/${entityId} — updated`)
    return NextResponse.json({ data })
  } catch (err) {
    console.error(`[PUT] entity update error:`, err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  const { entityId } = await params
  console.log(`[DELETE] /api/account-plans/entity/${entityId} — start`)
  try {
    const { supabase, profile } = await getAuthenticatedUser()
    if (!profile) return NextResponse.json({ error: "Not authenticated." }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const table = searchParams.get("table")
    if (!table) return NextResponse.json({ error: "Missing table parameter." }, { status: 400 })

    const { error } = await deleteSubEntity(supabase, table, entityId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    console.log(`[DELETE] /api/account-plans/entity/${entityId} — deleted`)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(`[DELETE] entity delete error:`, err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
