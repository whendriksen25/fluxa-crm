"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface DeleteDialogProps {
  contactId: string
  contactName: string
  open: boolean
  onClose: () => void
  onDeleted: () => void
}

export function DeleteDialog({
  contactId,
  contactName,
  open,
  onClose,
  onDeleted,
}: DeleteDialogProps) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)

    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        onDeleted()
        onClose()
      }
    } catch {
      // silently fail — user can retry
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

      <div className="relative z-10 w-full max-w-sm rounded-xl border border-border/50 bg-card p-6 shadow-2xl">
        <h2 className="text-lg font-semibold">Delete contact</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Are you sure you want to delete <strong>{contactName}</strong>? This
          action cannot be undone.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  )
}
