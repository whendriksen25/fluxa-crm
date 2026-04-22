"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Contact } from "@/lib/types"

const stages = [
  { value: "lead", label: "Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "customer", label: "Customer" },
  { value: "churned", label: "Churned" },
]

interface ContactDialogProps {
  contact?: Contact | null
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function ContactDialog({
  contact,
  open,
  onClose,
  onSaved,
}: ContactDialogProps) {
  const isEdit = !!contact

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [stage, setStage] = useState("lead")
  const [leadSource, setLeadSource] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (contact) {
      setFirstName(contact.first_name)
      setLastName(contact.last_name)
      setEmail(contact.email || "")
      setPhone(contact.phone || "")
      setJobTitle(contact.job_title || "")
      setStage(contact.stage)
      setLeadSource(contact.lead_source || "")
      setNotes(contact.notes || "")
    } else {
      setFirstName("")
      setLastName("")
      setEmail("")
      setPhone("")
      setJobTitle("")
      setStage("lead")
      setLeadSource("")
      setNotes("")
    }
    setError("")
  }, [contact, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const body = {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        job_title: jobTitle,
        stage,
        lead_source: leadSource || null,
        notes,
      }

      const url = isEdit ? `/api/contacts/${contact.id}` : "/api/contacts"
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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-xl border border-border/50 bg-card p-6 shadow-2xl">
        <h2 className="text-lg font-semibold">
          {isEdit ? "Edit contact" : "Add contact"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEdit
            ? "Update this contact's information."
            : "Add a new contact to your CRM."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="firstName">First name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Sophie"
                required
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lastName">Last name *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Hendriks"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sophie@company.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+31 6 1234 5678"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="jobTitle">Job title</Label>
            <Input
              id="jobTitle"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="CEO"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stage">Stage</Label>
            <select
              id="stage"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="flex h-8 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
            >
              {stages.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="leadSource">Lead source</Label>
            <Input
              id="leadSource"
              value={leadSource}
              onChange={(e) => setLeadSource(e.target.value)}
              placeholder="Webscrape jan 2026, LinkedIn, Referral..."
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this contact..."
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
                : "Add contact"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
