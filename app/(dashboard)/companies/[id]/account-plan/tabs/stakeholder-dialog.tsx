"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AccountStakeholder } from "@/lib/types"

const stances = [
  { value: "Champion", label: "Champion" },
  { value: "Supporter", label: "Supporter" },
  { value: "Neutral", label: "Neutral" },
  { value: "Neutral+", label: "Neutral+" },
  { value: "Risk", label: "Risk" },
  { value: "Unknown", label: "Unknown" },
]

const roleTypes = [
  { value: "Economic Buyer", label: "Economic Buyer" },
  { value: "Technical Evaluator", label: "Technical Evaluator" },
  { value: "End User", label: "End User" },
  { value: "Influencer", label: "Influencer" },
  { value: "External Advisor", label: "External Advisor" },
  { value: "Executive Sponsor", label: "Executive Sponsor" },
]

interface StakeholderDialogProps {
  planId: string
  stakeholder?: AccountStakeholder | null
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function StakeholderDialog({
  planId,
  stakeholder,
  open,
  onClose,
  onSaved,
}: StakeholderDialogProps) {
  const isEdit = !!stakeholder

  const [name, setName] = useState("")
  const [title, setTitle] = useState("")
  const [influenceWeight, setInfluenceWeight] = useState(5)
  const [stance, setStance] = useState("Unknown")
  const [roleType, setRoleType] = useState("")
  const [isExternal, setIsExternal] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (stakeholder) {
      setName(stakeholder.name)
      setTitle(stakeholder.title || "")
      setInfluenceWeight(stakeholder.influence_weight)
      setStance(stakeholder.stance)
      setRoleType(stakeholder.role_type || "")
      setIsExternal(stakeholder.is_external)
    } else {
      setName("")
      setTitle("")
      setInfluenceWeight(5)
      setStance("Unknown")
      setRoleType("")
      setIsExternal(false)
    }
    setError("")
  }, [stakeholder, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const body = {
        name,
        title: title || null,
        influence_weight: influenceWeight,
        stance,
        role_type: roleType || null,
        is_external: isExternal,
      }

      let url = ""
      let method = ""

      if (isEdit) {
        url = `/api/account-plans/entity/${stakeholder.id}?table=account_stakeholders`
        method = "PUT"
      } else {
        url = `/api/account-plans/${planId}/stakeholders`
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
          {isEdit ? "Edit stakeholder" : "Add stakeholder"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEdit
            ? "Update this stakeholder's information."
            : "Add a new stakeholder to this account plan."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VP of Engineering"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stance">Stance</Label>
            <select
              id="stance"
              value={stance}
              onChange={(e) => setStance(e.target.value)}
              className="flex h-8 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
            >
              {stances.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="roleType">Role Type</Label>
            <select
              id="roleType"
              value={roleType}
              onChange={(e) => setRoleType(e.target.value)}
              className="flex h-8 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
            >
              <option value="">Select a role (optional)</option>
              {roleTypes.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="influenceWeight">
              Influence Weight: {influenceWeight}
            </Label>
            <input
              id="influenceWeight"
              type="range"
              min="1"
              max="10"
              value={influenceWeight}
              onChange={(e) => setInfluenceWeight(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              1 = Low influence, 10 = High influence
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isExternal"
              type="checkbox"
              checked={isExternal}
              onChange={(e) => setIsExternal(e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border border-border bg-background"
            />
            <Label htmlFor="isExternal" className="cursor-pointer">
              External stakeholder
            </Label>
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
                : "Add stakeholder"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
