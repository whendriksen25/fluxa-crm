import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function POST(request: Request) {
  console.log("[POST] /api/import/upload — start")

  try {
    const { profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 })
    }

    // Read file into buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name.toLowerCase()

    let headers: string[] = []
    let rows: Record<string, string>[] = []

    if (fileName.endsWith(".csv")) {
      // Parse CSV
      const text = buffer.toString("utf-8")
      const lines = text.split(/\r?\n/).filter((l) => l.trim())
      if (lines.length === 0) {
        return NextResponse.json({ error: "File is empty." }, { status: 400 })
      }

      // Simple CSV parser (handles quoted fields)
      function parseCsvLine(line: string): string[] {
        const result: string[] = []
        let current = ""
        let inQuotes = false
        for (let i = 0; i < line.length; i++) {
          const ch = line[i]
          if (ch === '"') {
            inQuotes = !inQuotes
          } else if ((ch === "," || ch === ";") && !inQuotes) {
            result.push(current.trim())
            current = ""
          } else {
            current += ch
          }
        }
        result.push(current.trim())
        return result
      }

      headers = parseCsvLine(lines[0])
      for (let i = 1; i < lines.length && i <= 200; i++) {
        const values = parseCsvLine(lines[i])
        const row: Record<string, string> = {}
        headers.forEach((h, idx) => {
          row[h] = values[idx] || ""
        })
        rows.push(row)
      }
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      // Parse Excel
      const workbook = XLSX.read(buffer, { type: "buffer" })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
        defval: "",
      })
      if (data.length === 0) {
        return NextResponse.json({ error: "File is empty." }, { status: 400 })
      }
      headers = Object.keys(data[0])
      rows = data.slice(0, 200)
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Use .csv, .xlsx, or .xls." },
        { status: 400 }
      )
    }

    console.log(
      "[POST] /api/import/upload — done, headers:",
      headers.length,
      "rows:",
      rows.length
    )

    return NextResponse.json({
      headers,
      preview: rows.slice(0, 5),
      total_rows: rows.length,
    })
  } catch (err) {
    console.error("[POST] /api/import/upload — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
