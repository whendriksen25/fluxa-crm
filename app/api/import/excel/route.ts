import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { NextResponse } from "next/server"
import path from "path"
import * as XLSX from "xlsx"
import fs from "fs"

// Sheet-to-category mapping
const SHEET_CONFIG: Record<string, { category: string; country: string; type: "etg" | "mv" | "lv" }> = {
  "ETG Belgie Compleet":          { category: "ETG",          country: "Belgium",     type: "etg" },
  "Medium voltage installatiebedr.": { category: "MV Installer", country: "Belgium",     type: "mv" },
  "Low voltage installatiebedr.":  { category: "LV Installer", country: "Belgium",     type: "lv" },
  "ETG Nederland Compleet":        { category: "ETG",          country: "Netherlands", type: "etg" },
  "MV-installatiebedrijven NL":    { category: "MV Installer", country: "Netherlands", type: "mv" },
  "LV-installatiebedrijven NL":    { category: "LV Installer", country: "Netherlands", type: "lv" },
}

export async function POST() {
  console.log("[POST] /api/import/excel — start")

  try {
    const { supabase, user, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const tenantId = profile.tenant_id
    const userId = user!.id

    // Read both Excel files from public/
    const publicDir = path.join(process.cwd(), "public")
    const files = [
      "ETG_Belgie_Compleet_Cellpack (2).xlsx",
      "Cellpack_Nederland_ETG_MV_Prospectlijst.xlsx",
    ]

    let totalCompanies = 0
    let totalContacts = 0
    const errors: string[] = []

    for (const fileName of files) {
      const filePath = path.join(publicDir, fileName)

      if (!fs.existsSync(filePath)) {
        errors.push(`File not found: ${fileName}`)
        continue
      }

      const workbook = XLSX.readFile(filePath)

      for (const sheetName of workbook.SheetNames) {
        const config = SHEET_CONFIG[sheetName]
        if (!config) {
          errors.push(`Unknown sheet: ${sheetName}`)
          continue
        }

        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json<Record<string, string | number | null>>(sheet)

        console.log(`[POST] /api/import/excel — processing ${sheetName}: ${rows.length} rows`)

        for (const row of rows) {
          const companyName = String(row["Bedrijf"] || "").trim()
          if (!companyName) continue

          // Extract fields based on sheet type
          const website = String(row["Website"] || "").trim() || null
          const locationRaw = String(row["Locatie(s)"] || row["Locatie"] || "").trim() || null
          const relevance = String(
            row["Cellpack-relevantie"] || row["Cellpack MV-relevantie"] || row["Cellpack LV-relevantie"] || ""
          ).trim() || null
          const notes = String(row["Toelichting"] || "").trim() || null
          const segment = String(row["Segment"] || row["Type"] || "").trim() || null
          const size = String(row["Omvang"] || "").trim() || null
          const network = String(row["Netwerk/Groep"] || "").trim() || null
          const region = String(row["Regio"] || "").trim() || null

          // Build the domain from website
          let domain: string | null = null
          const cleanWebsite = (website && website !== "geen website" && website !== "null") ? website : null
          if (cleanWebsite) {
            domain = cleanWebsite.replace(/^https?:\/\//, "").replace(/\/.*$/, "")
          }

          // Create the company with proper columns
          const { data: company, error: companyError } = await supabase
            .from("companies")
            .insert({
              tenant_id: tenantId,
              name: companyName,
              domain,
              industry: config.category,
              size,
              website: cleanWebsite,
              notes,
              category: config.category,
              country: config.country,
              region: region || null,
              segment,
              relevance,
              network_group: network || null,
              location: locationRaw,
            })
            .select("id")
            .single()

          if (companyError) {
            errors.push(`Failed to create company "${companyName}": ${companyError.message}`)
            continue
          }

          totalCompanies++

          // Create a contact linked to this company (lead stage)
          const { error: contactError } = await supabase
            .from("contacts")
            .insert({
              tenant_id: tenantId,
              first_name: companyName,
              last_name: "",
              company_id: company.id,
              stage: "lead",
              source: "import",
              lead_source: "Webscrape jan 2026",
              owner_id: userId,
              tags: [config.category, config.country],
              notes: notes
                ? `${relevance ? `Relevantie: ${relevance}\n` : ""}${notes}`
                : relevance
                ? `Relevantie: ${relevance}`
                : null,
            })

          if (contactError) {
            errors.push(`Failed to create contact for "${companyName}": ${contactError.message}`)
            continue
          }

          totalContacts++
        }
      }
    }

    // Log the import as an import_job
    await supabase.from("import_jobs").insert({
      tenant_id: tenantId,
      source: "excel",
      status: "completed",
      total_rows: totalCompanies + totalContacts,
      processed_rows: totalCompanies + totalContacts,
      duplicates_found: 0,
      duplicates_merged: 0,
      error_log: errors.map((e) => ({ message: e })),
      completed_at: new Date().toISOString(),
    })

    console.log(`[POST] /api/import/excel — done. Companies: ${totalCompanies}, Contacts: ${totalContacts}, Errors: ${errors.length}`)

    return NextResponse.json({
      success: true,
      companies_created: totalCompanies,
      contacts_created: totalContacts,
      errors,
    })
  } catch (err) {
    console.error("[POST] /api/import/excel — unexpected error:", err)
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : undefined
    return NextResponse.json({ error: "Something went wrong.", details: message, stack }, { status: 500 })
  }
}
