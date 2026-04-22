"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { AccountCompetitor, ThreatLevel } from "@/lib/types"

const threatLevels: { value: ThreatLevel; label: string }[] = [
  { value: "Monitor", label: "Monitor" },
  { value: "Low Threat", label: "Low Threat" },
  { value: "Medium Threat", label: "Medium Threat" },
  { value: "High Threat", label: "High Threat" },
]

interface CompetitorDialogProps {
  planId: string
  competitor?: AccountCompetitor | null
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function CompetitorDialog({
  planId,
  competitor,
  open,
  onClose,
  onSaved,
}: CompetitorDialogProps) {
  const isEdit = !!competitor

  const [name, setName] = useState("")
  const [competitorType, setCompetitorType] = useState("")
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>("Monitor")
  const [threatScore, setThreatScore] = useState(50)
  const [strengthsText, setStrengthsText] = useState("")
  const [counterPlay, setCounterPlay] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (competitor) {
      setName(competitor.name)
      setCompetitorType(competitor.competitor_type || "")
      setThreatLevel(competitor.threat_level)
      setThreatScore(competitor.threat_score)
      setStrengthsText(competitor.strengths.join("\n"))
      setCounterPlay(competitor.counter_play || "")
    } else {
      setName("")
      setCompetitorType("")
      setThreatLevel("Monitor")
      setThreatScore(50)
      setStrengthsText("")
      setCounterPlay("")
    }
    setError("")
  }, [competitor, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (!name.trim()) {
        setError("Competitor name is required.")
        setLoading(false)
        return
      }

      const strengths = strengthsText
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)

      const body = {
        name: name.trim(),
        competitor_type: competitorType.trim() || null,
        threat_level: threatLevel,
        threat_score: threatScore,
        strengths,
        counter_play: counterPlay.trim() || null,
      }

      let url = ""
      let method = ""

      if (isEdit) {
        url = `/api/account-plans/entity/${competitor.id}?table=account_competitors`
        method = "PUT"
      } else {
        url = `/api/account-plans/${planId}/competitors`
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
          {isEdit ? "Edit competitor" : "Add competitor"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEdit
            ? "Update this competitor's information."
            : "Add a new competitor to this account plan."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Competitor name"
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="competitorType">Competitor Type</Label>
            <Input
              id="competitorType"
              value={competitorType}
              onChange={(e) => setCompetitorType(e.target.value)}
              placeholder="e.g., Direct, Adjacent, Emerging"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="threatLevel">Threat Level</Label>
            <select
              id="threatLevel"
              value={threatLevel}
              onChange={(e) => setThreatLevel(e.target.value as ThreatLevel)}
              className="flex h-8 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
            >
              {threatLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="threatScore">
              Threat Score: {threatScore}
            </Label>
            <input
              id="threatScore"
              type="range"
              min="0"
              max="100"
              value={threatScore}
              onChange={(e) => setThreatScore(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              0 = No threat, 100 = Extreme threat
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="strengths">Strengths</Label>
            <Textarea
              id="strengths"
              value={strengthsText}
              onChange={(e) => setStrengthsText(e.target.value)}
              placeholder="Enter each strength on a new line"
              className="min-h-24 resize-none"
            />
            <p className="text-xs text-muted-foreground">
              One strength per line
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="counterPlay">Counter Play</Label>
            <Textarea
              id="counterPlay"
              value={counterPlay}
              onChange={(e) => setCounterPlay(e.target.value)}
              placeholder="How we counter this competitor"
              className="min-h-20 resize-none"
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
                : "Add competitor"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
