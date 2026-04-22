"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Company } from "@/lib/types"

const CATEGORY_OPTIONS = ["ETG", "MV Installer", "LV Installer"]
const COUNTRY_OPTIONS = ["Belgium", "Netherlands"]
const RELEVANCE_OPTIONS = ["Zeer hoog", "Hoog", "Middel-hoog", "Middel", "Laag"]

interface CompanyDialogProps {
  company?: Company | null
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function CompanyDialog({
  company,
  open,
  onClose,
  onSaved,
}: CompanyDialogProps) {
  const isEdit = !!company

  const [name, setName] = useState("")
  const [industry, setIndustry] = useState("")
  const [website, setWebsite] = useState("")
  const [phone, setPhone] = useState("")
  const [size, setSize] = useState("")
  const [notes, setNotes] = useState("")
  const [category, setCategory] = useState("")
  const [country, setCountry] = useState("")
  const [region, setRegion] = useState("")
  const [segment, setSegment] = useState("")
  const [relevance, setRelevance] = useState("")
  const [networkGroup, setNetworkGroup] = useState("")
  const [location, setLocation] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (company) {
      setName(company.name)
      setIndustry(company.industry || "")
      setWebsite(company.website || "")
      setPhone(company.phone || "")
      setSize(company.size || "")
      setNotes(company.notes || "")
      setCategory(company.category || "")
      setCountry(company.country || "")
      setRegion(company.region || "")
      setSegment(company.segment || "")
      setRelevance(company.relevance || "")
      setNetworkGroup(company.network_group || "")
      setLocation(company.location || "")
    } else {
      setName("")
      setIndustry("")
      setWebsite("")
      setPhone("")
      setSize("")
      setNotes("")
      setCategory("")
      setCountry("")
      setRegion("")
      setSegment("")
      setRelevance("")
      setNetworkGroup("")
      setLocation("")
    }
    setError("")
  }, [company, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const body = {
        name,
        industry,
        website,
        phone,
        size,
        notes,
        category: category || null,
        country: country || null,
        region: region || null,
        segment: segment || null,
        relevance: relevance || null,
        network_group: networkGroup || null,
        location: location || null,
      }

      const url = isEdit ? `/api/companies/${company.id}` : "/api/companies"
      const method = isEdit ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Something went wrong.")
        return
      }

      onSaved()
      onClose()
    } catch {
      setError("Could not save. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border/50 bg-card p-6 shadow-2xl">
        <h2 className="text-lg font-semibold">
          {isEdit ? "Edit company" : "Add company"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEdit
            ? "Update this company's information."
            : "Add a new company to your CRM."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Company name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Techvision BV"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
              >
                <option value="">Select category...</option>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="country">Country</Label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
              >
                <option value="">Select country...</option>
                {COUNTRY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="relevance">Relevance</Label>
              <select
                id="relevance"
                value={relevance}
                onChange={(e) => setRelevance(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
              >
                <option value="">Select relevance...</option>
                {RELEVANCE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="segment">Segment</Label>
              <Input
                id="segment"
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                placeholder="MV netaannemer + industrieel"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Vlaanderen, Limburg..."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="networkGroup">Network / Group</Label>
              <Input
                id="networkGroup"
                value={networkGroup}
                onChange={(e) => setNetworkGroup(e.target.value)}
                placeholder="Fedibel, GIBED..."
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Brussels (HQ) + 10 branches"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="techvision.nl"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+31 20 123 4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Electrical, SaaS..."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="size">Company size</Label>
              <Input
                id="size"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="Groot (500+)"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this company..."
              rows={3}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : isEdit
                ? "Save changes"
                : "Add company"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
