"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"

// CRM fields users can map to
const CRM_FIELDS = [
  { value: "skip", label: "— Skip this column —" },
  { value: "first_name", label: "First name" },
  { value: "last_name", label: "Last name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "job_title", label: "Job title" },
  { value: "stage", label: "Stage" },
  { value: "notes", label: "Notes" },
  { value: "company_name", label: "Company name" },
  { value: "company_website", label: "Company website" },
  { value: "company_phone", label: "Company phone" },
  { value: "company_industry", label: "Company industry" },
  { value: "company_size", label: "Company size" },
  { value: "company_category", label: "Company category" },
  { value: "company_country", label: "Company country" },
  { value: "company_region", label: "Company region" },
  { value: "company_segment", label: "Company segment" },
  { value: "company_relevance", label: "Company relevance" },
  { value: "company_network_group", label: "Company network/group" },
  { value: "company_location", label: "Company location" },
]

// Smart auto-mapping: guess CRM field from CSV header
function guessField(header: string): string {
  const h = header.toLowerCase().trim()
  if (h.includes("first") && h.includes("name")) return "first_name"
  if (h.includes("last") && h.includes("name")) return "last_name"
  if (h === "name" || h === "naam") return "first_name"
  if (h.includes("email") || h.includes("e-mail")) return "email"
  if (h.includes("phone") || h.includes("tel") || h.includes("telefoon")) return "phone"
  if (h.includes("job") || h.includes("title") || h.includes("functie")) return "job_title"
  if (h.includes("company") || h.includes("bedrijf") || h.includes("organisation") || h.includes("organisatie")) return "company_name"
  if (h.includes("website") || h.includes("url") || h.includes("site")) return "company_website"
  if (h.includes("industry") || h.includes("branche") || h.includes("sector")) return "company_industry"
  if (h.includes("size") || h.includes("omvang") || h.includes("grootte")) return "company_size"
  if (h.includes("note") || h.includes("opmerking") || h.includes("toelichting")) return "notes"
  if (h.includes("stage") || h.includes("status") || h.includes("fase")) return "stage"
  if (h.includes("country") || h.includes("land")) return "company_country"
  if (h.includes("region") || h.includes("regio")) return "company_region"
  if (h.includes("categor")) return "company_category"
  if (h.includes("segment")) return "company_segment"
  if (h.includes("relevan")) return "company_relevance"
  if (h.includes("network") || h.includes("netwerk") || h.includes("groep")) return "company_network_group"
  if (h.includes("locatie") || h.includes("location") || h.includes("adres")) return "company_location"
  return "skip"
}

interface UploadResult {
  headers: string[]
  preview: Record<string, string>[]
  total_rows: number
}

interface ProcessResult {
  success: boolean
  contacts_created: number
  companies_created: number
  duplicates_found: number
  total_rows: number
  errors: string[]
}

type Step = "upload" | "map" | "done"

export default function ImportPage() {
  // Wizard state
  const [step, setStep] = useState<Step>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Mapping state
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})

  // Processing state
  const [processing, setProcessing] = useState(false)
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null)
  const [processError, setProcessError] = useState<string | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
        setFile(e.target.files[0])
      }
    },
    []
  )

  // Step 1 -> Step 2: Upload file, get headers
  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/import/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        setUploadError(data.error || "Upload failed.")
        return
      }

      setUploadResult(data)

      // Auto-map columns
      const autoMapping: Record<string, string> = {}
      for (const header of data.headers) {
        autoMapping[header] = guessField(header)
      }
      setMapping(autoMapping)

      setStep("map")
    } catch {
      setUploadError("Upload failed. Check your file and try again.")
    } finally {
      setUploading(false)
    }
  }

  // Step 2 -> Step 3: Process with mapping
  async function handleProcess() {
    if (!file || !uploadResult) return
    setProcessing(true)
    setProcessError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("mapping", JSON.stringify(mapping))

      const res = await fetch("/api/import/process", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        setProcessError(data.error || "Import failed.")
        return
      }

      setProcessResult(data)
      setStep("done")
    } catch {
      setProcessError("Import failed. Check your file and try again.")
    } finally {
      setProcessing(false)
    }
  }

  function handleReset() {
    setStep("upload")
    setFile(null)
    setUploadResult(null)
    setMapping({})
    setProcessResult(null)
    setProcessError(null)
    setUploadError(null)
  }

  const mappedFieldCount = Object.values(mapping).filter(
    (v) => v && v !== "skip"
  ).length

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import data</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your Excel or CSV file to import contacts and companies.
        </p>
      </div>

      {/* Import from external CRM */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h3 className="text-base font-medium">Import from another CRM</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Pull contacts and companies from Salesforce, HubSpot, or upload an Excel file.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="outline" size="sm" disabled>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Import from Salesforce
          </Button>
          <Button variant="outline" size="sm" disabled>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Import from HubSpot
          </Button>
          <Button variant="outline" size="sm" onClick={() => document.getElementById("excel-upload")?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import Excel / CSV
          </Button>
          <input
            id="excel-upload"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-400">Salesforce</span>
          <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">HubSpot</span>
          <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">Excel / CSV</span>
        </div>
      </div>

      {/* CSV Import Wizard */}
      <div className="rounded-xl border border-border/50 bg-card">
        {/* Step indicator */}
        <div className="flex items-center gap-4 border-b border-border/50 px-6 py-4">
          <div className={`flex items-center gap-2 text-sm ${step === "upload" ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${step === "upload" ? "bg-primary text-primary-foreground" : step === "map" || step === "done" ? "bg-emerald-500/20 text-emerald-400" : "bg-accent"}`}>
              {step === "map" || step === "done" ? "✓" : "1"}
            </span>
            Upload
          </div>
          <div className="h-px flex-1 bg-border/50" />
          <div className={`flex items-center gap-2 text-sm ${step === "map" ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${step === "map" ? "bg-primary text-primary-foreground" : step === "done" ? "bg-emerald-500/20 text-emerald-400" : "bg-accent"}`}>
              {step === "done" ? "✓" : "2"}
            </span>
            Map columns
          </div>
          <div className="h-px flex-1 bg-border/50" />
          <div className={`flex items-center gap-2 text-sm ${step === "done" ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${step === "done" ? "bg-emerald-500/20 text-emerald-400" : "bg-accent"}`}>
              {step === "done" ? "✓" : "3"}
            </span>
            Import
          </div>
        </div>

        <div className="p-6">
          {/* STEP 1: Upload */}
          {step === "upload" && (
            <div>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`rounded-xl border-2 border-dashed transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : file
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-border/50"
                }`}
              >
                <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${file ? "bg-emerald-500/10" : "bg-accent"}`}>
                    {file ? (
                      <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  {file ? (
                    <>
                      <h3 className="text-base font-medium">{file.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                      <div className="mt-4 flex gap-3">
                        <Button size="sm" onClick={handleUpload} disabled={uploading}>
                          {uploading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Reading file...</>
                          ) : (
                            <>Continue to mapping<ArrowRight className="ml-2 h-4 w-4" /></>
                          )}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setFile(null)}>
                          Choose different file
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-base font-medium">
                        Drag your file here, or click to browse
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Supports .csv, .xlsx, and .xls files
                      </p>
                      <label className="mt-4 cursor-pointer">
                        <Button variant="outline" size="sm">
                          <span>Choose file</span>
                        </Button>
                        <input
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    </>
                  )}
                </div>
              </div>

              {uploadError && (
                <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-sm font-medium text-red-400">{uploadError}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Map columns */}
          {step === "map" && uploadResult && (
            <div>
              <div className="mb-4">
                <h3 className="text-base font-medium">Map your columns</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  We found {uploadResult.headers.length} columns and{" "}
                  {uploadResult.total_rows} rows. Tell us which column goes where.
                  {mappedFieldCount > 0 && (
                    <span className="ml-1 text-foreground">
                      {mappedFieldCount} field{mappedFieldCount !== 1 ? "s" : ""} mapped.
                    </span>
                  )}
                </p>
              </div>

              {/* Column mapping table */}
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 text-left">
                      <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Your column</th>
                      <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Sample data</th>
                      <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Maps to</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadResult.headers.map((header) => (
                      <tr key={header} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-2.5 text-sm font-medium">{header}</td>
                        <td className="px-4 py-2.5 text-sm text-muted-foreground max-w-48 truncate">
                          {uploadResult.preview[0]?.[header] || "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          <select
                            value={mapping[header] || "skip"}
                            onChange={(e) =>
                              setMapping((prev) => ({
                                ...prev,
                                [header]: e.target.value,
                              }))
                            }
                            className="flex h-8 w-full max-w-56 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                          >
                            {CRM_FIELDS.map((f) => (
                              <option key={f.value} value={f.value}>
                                {f.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Preview */}
              {uploadResult.preview.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Preview (first {uploadResult.preview.length} rows)
                  </h4>
                  <div className="overflow-x-auto rounded-lg border border-border/50">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          {uploadResult.headers
                            .filter((h) => mapping[h] && mapping[h] !== "skip")
                            .map((h) => (
                              <th key={h} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                {CRM_FIELDS.find((f) => f.value === mapping[h])?.label || h}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody>
                        {uploadResult.preview.map((row, i) => (
                          <tr key={i} className="border-b border-border/50 last:border-0">
                            {uploadResult.headers
                              .filter((h) => mapping[h] && mapping[h] !== "skip")
                              .map((h) => (
                                <td key={h} className="px-3 py-2 text-muted-foreground whitespace-nowrap max-w-40 truncate">
                                  {row[h] || "—"}
                                </td>
                              ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {processError && (
                <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-sm font-medium text-red-400">{processError}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => setStep("upload")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  size="sm"
                  onClick={handleProcess}
                  disabled={processing || mappedFieldCount === 0}
                >
                  {processing ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing...</>
                  ) : (
                    <>Import {uploadResult.total_rows} rows<ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Done */}
          {step === "done" && processResult && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold">Import complete</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Created {processResult.contacts_created} contacts
                {processResult.companies_created > 0 &&
                  ` and ${processResult.companies_created} companies`}
                {" "}from {processResult.total_rows} rows.
              </p>

              {processResult.duplicates_found > 0 && (
                <p className="mt-1 text-sm text-amber-400">
                  {processResult.duplicates_found} duplicate{processResult.duplicates_found !== 1 ? "s" : ""} skipped (same email).
                </p>
              )}

              {processResult.errors.length > 0 && (
                <div className="mt-4 w-full max-w-md rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-left">
                  <p className="text-xs font-medium text-amber-400">
                    {processResult.errors.length} issue{processResult.errors.length !== 1 ? "s" : ""}:
                  </p>
                  <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-muted-foreground">
                    {processResult.errors.slice(0, 10).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                    {processResult.errors.length > 10 && (
                      <li>...and {processResult.errors.length - 10} more</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <Button size="sm" onClick={() => (window.location.href = "/contacts")}>
                  View contacts
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Import another file
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tips (only show on upload step) */}
      {step === "upload" && (
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h3 className="text-sm font-medium">Tips for a smooth import</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              Make sure your file has column headers in the first row (like
              &quot;Name&quot;, &quot;Email&quot;, &quot;Phone&quot;)
            </li>
            <li>
              FLUXA will try to auto-detect your columns — you can adjust
              the mapping before importing
            </li>
            <li>
              Duplicate contacts (same email) will be detected and skipped
            </li>
            <li>Free plan supports up to 250 rows per import</li>
          </ul>
        </div>
      )}
    </div>
  )
}
