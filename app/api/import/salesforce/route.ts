import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { NextResponse } from "next/server"

// Salesforce data collected from browser
const SALESFORCE_CONTACTS = [
  {
    // Contact 1: Rene Adegeest from Hollander Techniek B.V.
    company: {
      name: "Hollander Techniek B.V.",
      country: "Netherlands",
      domain: "hollandertechniek.nl",
      website: "https://hollandertechniek.nl",
      segment: "Infrastructure",
      category: "MV Installer",
      region: "Apeldoorn",
      location: "Boogschutterstraat 30, 7324 AG Apeldoorn",
      relevance: "D (10%)",
      network_group: null,
      size: null,
      notes: "Salesforce Customer #614265. Channel: Direct. Group: Installer. High Potential (>20%). VAT: NL005054485B01. Revenue Current FY: EUR 1,922.60. Revenue Previous FY: EUR 28,256.33.",
    },
    contact: {
      first_name: "Rene",
      last_name: "Adegeest",
      email: "rene.adegeest@hollandertechniek.nl",
      phone: "+31553681111",
      title: null,
      notes: "Imported from Salesforce. Account Owner: Marco van Helmond.",
    },
  },
  {
    // Contact 2: Lotte De koning from Enexis
    company: {
      name: "Enexis",
      country: "Netherlands",
      domain: "enexis.nl",
      website: "https://www.enexis.nl",
      segment: "Infrastructure;Utilities",
      category: "ETG",
      region: "'s-Hertogenbosch",
      location: "Magistratenlaan, 's-Hertogenbosch",
      relevance: "New customer",
      network_group: null,
      size: null,
      notes: "Salesforce Account. Channel: Indirect. Group: Direct End-User. High Potential (>20%). Phone: +31888577000. Open Opportunity: Enexis Netbeheer B.V. (Qualification, close 31.03.2026).",
    },
    contact: {
      first_name: "Lotte",
      last_name: "De koning",
      email: "lotte.dekoning@enexis.nl",
      phone: "+31888577000",
      title: "Technical",
      notes: "Imported from Salesforce. Contact Classification: Influencer. Account Owner: Marco van Helmond.",
    },
  },
]

export async function POST() {
  console.log("[POST] /api/import/salesforce — start v2")

  try {
    const { supabase, user, profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const tenantId = profile.tenant_id
    const userId = user!.id

    const results: { company: string; contact: string; success: boolean; error?: string }[] = []

    for (const entry of SALESFORCE_CONTACTS) {
      // Check if company already exists (from a previous failed attempt)
      const { data: existingCompany } = await supabase
        .from("companies")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("name", entry.company.name)
        .limit(1)
        .single()

      let companyId: string

      if (existingCompany) {
        companyId = existingCompany.id
      } else {
        // Create company
        const { data: newCompany, error: companyError } = await supabase
          .from("companies")
          .insert({
          tenant_id: tenantId,
          name: entry.company.name,
          domain: entry.company.domain,
          industry: entry.company.category,
          size: entry.company.size,
          website: entry.company.website,
          notes: entry.company.notes,
          category: entry.company.category,
          country: entry.company.country,
          region: entry.company.region,
          segment: entry.company.segment,
          relevance: entry.company.relevance,
          network_group: entry.company.network_group,
          location: entry.company.location,
        })
          .select("id")
          .single()

        if (companyError) {
          results.push({
            company: entry.company.name,
            contact: `${entry.contact.first_name} ${entry.contact.last_name}`,
            success: false,
            error: `Company insert failed: ${companyError.message}`,
          })
          continue
        }
        companyId = newCompany.id
      }

      // Create contact linked to the company
      const { error: contactError } = await supabase
        .from("contacts")
        .insert({
          tenant_id: tenantId,
          first_name: entry.contact.first_name,
          last_name: entry.contact.last_name,
          email: entry.contact.email,
          phone: entry.contact.phone,
          company_id: companyId,
          stage: "lead",
          source: "salesforce",
          owner_id: userId,
          tags: ["Salesforce", entry.company.country],
          notes: (entry.contact.title ? `Role: ${entry.contact.title}. ` : "") + (entry.contact.notes || ""),
        })

      if (contactError) {
        results.push({
          company: entry.company.name,
          contact: `${entry.contact.first_name} ${entry.contact.last_name}`,
          success: false,
          error: `Contact insert failed: ${contactError.message}`,
        })
        continue
      }

      results.push({
        company: entry.company.name,
        contact: `${entry.contact.first_name} ${entry.contact.last_name}`,
        success: true,
      })
    }

    console.log("[POST] /api/import/salesforce — done.", JSON.stringify(results))

    return NextResponse.json({
      success: true,
      imported: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    })
  } catch (err) {
    console.error("[POST] /api/import/salesforce — unexpected error:", err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: "Something went wrong.", details: message }, { status: 500 })
  }
}
