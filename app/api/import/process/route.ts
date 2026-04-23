import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

// The CRM fields a user can map CSV columns to
const CONTACT_FIELDS = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "job_title",
  "stage",
  "notes",
] as const

const COMPANY_FIELDS = [
  "company_name",
  "company_website",
  "company_phone",
  "company_industry",
  "company_size",
  "company_category",
  "company_country",
  "company_region",
  "company_segment",
  "company_relevance",
  "company_network_group",
  "company_location",
] as const

export async function POST(request: Request) {
  console.log("[POST] /api/import/process — start")

  try {
    const { supabase, user, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const mappingStr = formData.get("mapping") as string | null

    if (!file || !mappingStr) {
      return NextResponse.json(
        { error: "File and mapping are required." },
        { status: 400 }
      )
    }

    // mapping is { csvColumn: crmField } e.g. { "Name": "first_name", "Email": "email" }
    const mapping: Record<string, string> = JSON.parse(mappingStr)

    // Parse the file
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name.toLowerCase()

    let rows: Record<string, string>[] = []

    if (fileName.endsWith(".csv")) {
      const text = buffer.toString("utf-8")
      const lines = text.split(/\r?\n/).filter((l) => l.trim())
      if (lines.length < 2) {
        return NextResponse.json({ error: "File has no data rows." }, { status: 400 })
      }

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

      const headers = parseCsvLine(lines[0])
      for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i])
        const row: Record<string, string> = {}
        headers.forEach((h, idx) => {
          row[h] = values[idx] || ""
        })
        rows.push(row)
      }
    } else {
      const workbook = XLSX.read(buffer, { type: "buffer" })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" })
    }

    const tenantId = profile.tenant_id
    const userId = user!.id

    let contactsCreated = 0
    let companiesCreated = 0
    let duplicatesFound = 0
    const errors: string[] = []

    // Build a reverse mapping: crmField -> csvColumn
    const reverseMap: Record<string, string> = {}
    for (const [csvCol, crmField] of Object.entries(mapping)) {
      if (crmField && crmField !== "skip") {
        reverseMap[crmField] = csvCol
      }
    }

    // Helper: get value from row using CRM field name
    function getVal(row: Record<string, string>, crmField: string): string {
      const csvCol = reverseMap[crmField]
      if (!csvCol) return ""
      return (row[csvCol] || "").trim()
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      try {
        // Create or find company if company_name is mapped
        let companyId: string | null = null
        const companyName = getVal(row, "company_name")

        if (companyName) {
          // Check if company already exists (by name)
          const { data: existing } = await supabase
            .from("companies")
            .select("id")
            .eq("tenant_id", tenantId)
            .ilike("name", companyName)
            .limit(1)
            .single()

          if (existing) {
            companyId = existing.id
          } else {
            const { data: newCompany, error: companyError } = await supabase
              .from("companies")
              .insert({
                tenant_id: tenantId,
                name: companyName,
                website: getVal(row, "company_website") || null,
                phone: getVal(row, "company_phone") || null,
                industry: getVal(row, "company_industry") || null,
                size: getVal(row, "company_size") || null,
                category: getVal(row, "company_category") || null,
                country: getVal(row, "company_country") || null,
                region: getVal(row, "company_region") || null,
                segment: getVal(row, "company_segment") || null,
                relevance: getVal(row, "company_relevance") || null,
                network_group: getVal(row, "company_network_group") || null,
                location: getVal(row, "company_location") || null,
              })
              .select("id")
              .single()

            if (companyError) {
              errors.push(`Row ${i + 1}: failed to create company "${companyName}"`)
              continue
            }
            companyId = newCompany.id
            companiesCreated++
          }
        }

        // Create contact
        const firstName = getVal(row, "first_name")
        const lastName = getVal(row, "last_name")
        const email = getVal(row, "email")

        if (!firstName && !lastName && !email) {
          errors.push(`Row ${i + 1}: no name or email — skipped`)
          continue
        }

        // Duplicate check by email
        if (email) {
          const { data: dup } = await supabase
            .from("contacts")
            .select("id")
            .eq("tenant_id", tenantId)
            .ilike("email", email)
            .limit(1)
            .single()

          if (dup) {
            duplicatesFound++
            errors.push(`Row ${i + 1}: "${email}" already exists — skipped`)
            continue
          }
        }

        const stage = getVal(row, "stage") || "lead"
        const validStages = ["lead", "contacted", "qualified", "proposal", "customer", "churned"]

        const { error: contactError } = await supabase.from("contacts").insert({
          tenant_id: tenantId,
          first_name: firstName || "(no name)",
          last_name: lastName || "",
          email: email || null,
          phone: getVal(row, "phone") || null,
          job_title: getVal(row, "job_title") || null,
          company_id: companyId,
          stage: validStages.includes(stage.toLowerCase()) ? stage.toLowerCase() : "lead",
          source: "csv",
          owner_id: userId,
          notes: getVal(row, "notes") || null,
        })

        if (contactError) {
          errors.push(`Row ${i + 1}: failed to create contact — ${contactError.message}`)
          continue
        }

        contactsCreated++
      } catch {
        errors.push(`Row ${i + 1}: unexpected error`)
      }
    }

    // Log import job
    await supabase.from("import_jobs").insert({
      tenant_id: tenantId,
      source: "csv",
      status: "completed",
      field_mapping: mapping,
      total_rows: rows.length,
      processed_rows: contactsCreated + companiesCreated,
      duplicates_found: duplicatesFound,
      error_log: errors.map((e) => ({ message: e })),
      completed_at: new Date().toISOString(),
    })

    console.log(
      `[POST] /api/import/process — done. Contacts: ${contactsCreated}, Companies: ${companiesCreated}, Duplicates: ${duplicatesFound}`
    )

    return NextResponse.json({
      success: true,
      contacts_created: contactsCreated,
      companies_created: companiesCreated,
      duplicates_found: duplicatesFound,
      total_rows: rows.length,
      errors,
    })
  } catch (err) {
    console.error("[POST] /api/import/process — unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
