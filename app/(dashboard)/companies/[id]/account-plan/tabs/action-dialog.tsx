"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { AccountAction, ActionPriority, ActionStatus } from "@/lib/types"

const priorities: { value: ActionPriority; label: string }[] = [
  { value: "P1", label: "P1 - Critical" },
  { value: "P2", label: "P2 - High" },
  { value: "P3", label: "P3 - Normal" },
]

const statuses: { value: ActionStatus; label: string }[] = [
  { value: "Open", label: "Open" },
  { value: "In Progress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
  { value: "Blocked", label: "Blocked" },
]

interface ActionDialogProps {
  planId: string
  action?: AccountAction | null
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function ActionDialog({
  planId,
  action,
  open,
  onClose,
  onSaved,
}: ActionDialogProps) {
  const isEdit = !!action

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<ActionPriority>("P2")
  const [status, setStatus] = useState<ActionStatus>("Open")
  const [ownerName, setOwnerName] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [linkedStakeholderName, setLinkedStakeholderName] = useState("")
  const [notes, setNotes] = useState("")
  const [isMilestone, setIsMilestone] = useState(false)
  const [isExternalEvent, setIsExternalEvent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (action) {
      setTitle(action.title)
      setDescription(action.description || "")
      setPriority(action.priority)
      setStatus(action.status)
      setOwnerName(action.owner_name || "")
      setDueDate(action.due_date || "")
      setLinkedStakeholderName(action.linked_stakeholder_name || "")
      setNotes(action.notes || "")
      setIsMilestone(action.is_milestone)
      setIsExternalEvent(action.is_external_event)
    } else {
      setTitle("")
      setDescription("")
      setPriority("P2")
      setStatus("Open")
      setOwnerName("")
      setDueDate("")
      setLinkedStakeholderName("")
      setNotes("")
      setIsMilestone(false)
      setIsExternalEvent(false)
    }
    setError("")
  }, [action, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const body = {
        title,
        description: description || null,
        priority,
        status,
        owner_name: ownerName || null,
        due_date: dueDate || null,
        linked_stakeholder_name: linkedStakeholderName || null,
        notes: notes || null,
        is_milestone: isMilestone,
        is_external_event: isExternalEvent,
      }

      let url = ""
      let method = ""

      if (isEdit) {
        url = `/api/account-plans/entity/${action.id}?table=account_actions`
        method = "PUT"
      } else {
        url = `/api/account-plans/${planId}/actions`
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
          {isEdit ? "Edit action" : "Create action"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEdit
            ? "Update this action's details."
            : "Add a new action to this account plan."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Action title"
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the action"
              className="min-h-20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as ActionPriority)}
                className="flex h-8 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
              >
                {priorities.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ActionStatus)}
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
            <Label htmlFor="ownerName">Owner</Label>
            <Input
              id="ownerName"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Owner name"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="linkedStakeholder">Linked Stakeholder</Label>
            <Input
              id="linkedStakeholder"
              value={linkedStakeholderName}
              onChange={(e) => setLinkedStakeholderName(e.target.value)}
              placeholder="Stakeholder name"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes"
              className="min-h-16 resize-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                id="isMilestone"
                type="checkbox"
                checked={isMilestone}
                onChange={(e) => setIsMilestone(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border border-border bg-background"
              />
              <Label htmlFor="isMilestone" className="cursor-pointer">
                Milestone
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isExternalEvent"
                type="checkbox"
                checked={isExternalEvent}
                onChange={(e) => setIsExternalEvent(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border border-border bg-background"
              />
              <Label htmlFor="isExternalEvent" className="cursor-pointer">
                External event
              </Label>
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
                : "Create action"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
