"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { AccountValueMap, ValueTheme, ValueStatus } from "@/lib/types"

const themes: { value: ValueTheme; label: string }[] = [
  { value: "Digital", label: "Digital" },
  { value: "Cost", label: "Cost" },
  { value: "Risk", label: "Risk" },
  { value: "CX", label: "CX" },
  { value: "Growth", label: "Growth" },
  { value: "Other", label: "Other" },
]

const statuses: { value: ValueStatus; label: string }[] = [
  { value: "Hypothesis", label: "Hypothesis" },
  { value: "In Progress", label: "In Progress" },
  { value: "Validated", label: "Validated" },
]

interface ValueMapDialogProps {
  planId: string
  entry?: AccountValueMap | null
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function ValueMapDialog({
  planId,
  entry,
  open,
  onClose,
  onSaved,
}: ValueMapDialogProps) {
  const isEdit = !!entry

  const [stakeholderName, setStakeholderName] = useState("")
  const [businessPain, setBusinessPain] = useState("")
  const [theme, setTheme] = useState<ValueTheme | null>(null)
  const [ourCapability, setOurCapability] = useState("")
  const [valueHypothesis, setValueHypothesis] = useState("")
  const [quantifiedImpact, setQuantifiedImpact] = useState(0)
  const [quantifiedImpactLabel, setQuantifiedImpactLabel] = useState("")
  const [status, setStatus] = useState<ValueStatus>("Hypothesis")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (entry) {
      setStakeholderName(entry.stakeholder_name || "")
      setBusinessPain(entry.business_pain || "")
      setTheme(entry.theme)
      setOurCapability(entry.our_capability || "")
      setValueHypothesis(entry.value_hypothesis || "")
      setQuantifiedImpact(entry.quantified_impact || 0)
      setQuantifiedImpactLabel(entry.quantified_impact_label || "")
      setStatus(entry.status)
    } else {
      setStakeholderName("")
      setBusinessPain("")
      setTheme(null)
      setOurCapability("")
      setValueHypothesis("")
      setQuantifiedImpact(0)
      setQuantifiedImpactLabel("")
      setStatus("Hypothesis")
    }
    setError("")
  }, [entry, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const body = {
        stakeholder_name: stakeholderName || null,
        business_pain: businessPain || null,
        theme,
        our_capability: ourCapability || null,
        value_hypothesis: valueHypothesis || null,
        quantified_impact: quantifiedImpact,
        quantified_impact_label: quantifiedImpactLabel || null,
        status,
      }

      let url = ""
      let method = ""

      if (isEdit) {
        url = `/api/account-plans/entity/${entry.id}?table=account_value_map`
        method = "PUT"
      } else {
        url = `/api/account-plans/${planId}/value-map`
        method = "POST"
      }

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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-border/50 bg-card p-6 shadow-2xl">
        <h2 className="text-lg font-semibold">
          {isEdit ? "Edit value map entry" : "Create value map entry"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEdit
            ? "Update this value hypothesis."
            : "Add a new value hypothesis to this account plan."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stakeholderName">Stakeholder Name</Label>
            <Input
              id="stakeholderName"
              value={stakeholderName}
              onChange={(e) => setStakeholderName(e.target.value)}
              placeholder="Who is this value for?"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="businessPain">Business Pain</Label>
            <Textarea
              id="businessPain"
              value={businessPain}
              onChange={(e) => setBusinessPain(e.target.value)}
              placeholder="What problem does the stakeholder face?"
              className="min-h-20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="theme">Theme</Label>
              <select
                id="theme"
                value={theme || ""}
                onChange={(e) => setTheme((e.target.value as ValueTheme) || null)}
                className="flex h-8 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
              >
                <option value="">Select theme</option>
                {themes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ValueStatus)}
                className="flex h-8 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
              >
                {statuses.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ourCapability">Our Capability</Label>
            <Input
              id="ourCapability"
              value={ourCapability}
              onChange={(e) => setOurCapability(e.target.value)}
              placeholder="What can we offer?"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="valueHypothesis">Value Hypothesis</Label>
            <Textarea
              id="valueHypothesis"
              value={valueHypothesis}
              onChange={(e) => setValueHypothesis(e.target.value)}
              placeholder="How do we solve their problem?"
              className="min-h-20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quantifiedImpact">Quantified Impact</Label>
              <Input
                id="quantifiedImpact"
                type="number"
                value={quantifiedImpact}
                onChange={(e) => setQuantifiedImpact(Number(e.target.value))}
                placeholder="0"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quantifiedImpactLabel">Impact Label</Label>
              <Input
                id="quantifiedImpactLabel"
                value={quantifiedImpactLabel}
                onChange={(e) => setQuantifiedImpactLabel(e.target.value)}
                placeholder="e.g., $K, %"
              />
            </div>
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
                : "Create entry"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
