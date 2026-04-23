"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { AccountAdvisor, AllegianceLabel } from "@/lib/types"

const allegianceLabels: { value: AllegianceLabel; label: string }[] = [
  { value: "Partner-aligned", label: "Partner-aligned" },
  { value: "Neutral+", label: "Neutral+" },
  { value: "Independent", label: "Independent" },
  { value: "Competitor-aligned", label: "Competitor-aligned" },
  { value: "Risk", label: "Risk" },
]

interface AdvisorDialogProps {
  planId: string
  advisor?: AccountAdvisor | null
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function AdvisorDialog({
  planId,
  advisor,
  open,
  onClose,
  onSaved,
}: AdvisorDialogProps) {
  const isEdit = !!advisor

  const [name, setName] = useState("")
  const [firm, setFirm] = useState("")
  const [engagedBy, setEngagedBy] = useState("")
  const [engagementContext, setEngagementContext] = useState("")
  const [allegianceScore, setAllegianceScore] = useState(50)
  const [allegianceLabel, setAllegianceLabel] = useState<AllegianceLabel>("Neutral+")
  const [notes, setNotes] = useState("")
  const [actionNote, setActionNote] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (advisor) {
      setName(advisor.name)
      setFirm(advisor.firm || "")
      setEngagedBy(advisor.engaged_by || "")
      setEngagementContext(advisor.engagement_context || "")
      setAllegianceScore(advisor.allegiance_score)
      setAllegianceLabel(advisor.allegiance_label)
      setNotes(advisor.notes || "")
      setActionNote(advisor.action_note || "")
    } else {
      setName("")
      setFirm("")
      setEngagedBy("")
      setEngagementContext("")
      setAllegianceScore(50)
      setAllegianceLabel("Neutral+")
      setNotes("")
      setActionNote("")
    }
    setError("")
  }, [advisor, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const body = {
        name,
        firm: firm || null,
        engaged_by: engagedBy || null,
        engagement_context: engagementContext || null,
        allegiance_score: allegianceScore,
        allegiance_label: allegianceLabel,
        notes: notes || null,
        action_note: actionNote || null,
      }

      let url = ""
      let method = ""

      if (isEdit) {
        url = `/api/account-plans/entity/${advisor.id}?table=account_advisors`
        method = "PUT"
      } else {
        url = `/api/account-plans/${planId}/advisors`
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
      <div className="relative z-10 w-full max-w-md rounded-xl border border-border/50 bg-card p-6 shadow-2xl">
        <h2 className="text-lg font-semibold">
          {isEdit ? "Edit advisor" : "Create advisor"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEdit
            ? "Update this advisor's details."
            : "Add a new advisor to this account plan."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Advisor name"
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="firm">Firm</Label>
            <Input
              id="firm"
              value={firm}
              onChange={(e) => setFirm(e.target.value)}
              placeholder="Advisory firm or organization"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="engagedBy">Engaged By</Label>
            <Input
              id="engagedBy"
              value={engagedBy}
              onChange={(e) => setEngagedBy(e.target.value)}
              placeholder="Who engaged this advisor"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="engagementContext">Engagement Context</Label>
            <Input
              id="engagementContext"
              value={engagementContext}
              onChange={(e) => setEngagementContext(e.target.value)}
              placeholder="Context or reason for engagement"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="allegianceLabel">Allegiance</Label>
            <select
              id="allegianceLabel"
              value={allegianceLabel}
              onChange={(e) => setAllegianceLabel(e.target.value as AllegianceLabel)}
              className="flex h-8 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
            >
              {allegianceLabels.map((label) => (
                <option key={label.value} value={label.value}>
                  {label.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="allegianceScore">Allegiance Score</Label>
              <span className="text-xs text-muted-foreground">{allegianceScore}/100</span>
            </div>
            <input
              id="allegianceScore"
              type="range"
              min="0"
              max="100"
              value={allegianceScore}
              onChange={(e) => setAllegianceScore(Number(e.target.value))}
              className="h-2 w-full cursor-pointer rounded-lg border border-border bg-background accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Theirs</span>
              <span>Neutral</span>
              <span>Ours</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this advisor"
              className="min-h-16 resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="actionNote">Action Note</Label>
            <Textarea
              id="actionNote"
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              placeholder="Actions or follow-ups related to this advisor"
              className="min-h-16 resize-none"
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
                : "Create advisor"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
