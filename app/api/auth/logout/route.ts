import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  console.log("[POST] /api/auth/logout — start")

  const supabase = await createClient()
  await supabase.auth.signOut()

  console.log("[POST] /api/auth/logout — done")
  return NextResponse.json({ success: true })
}
