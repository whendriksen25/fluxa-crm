"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ContactDialog } from "@/components/contacts/contact-dialog"
import { DeleteDialog } from "@/components/contacts/delete-dialog"
import type { Contact, Activity, Deal } from "@/lib/types"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Phone,
  Mail,
  Briefcase,
  Clock,
  Tag,
  MessageSquare,
  PhoneCall,
  Calendar,
  CheckCircle2,
  ArrowRight,
} from "lucide-react"

const stageColors: Record<string, string> = {
  lead: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  contacted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  qualified: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  proposal: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  customer: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  churned: "bg-red-500/10 text-red-400 border-red-500/20",
}

const activityIcons: Record<string, typeof Clock> = {
  call: PhoneCall,
  email: Mail,
  meeting: Calendar,
  task: CheckCircle2,
  note: MessageSquare,
  deal_moved: ArrowRight,
  system: Clock,
}

export default function ContactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [contact, setContact] = useState<Contact | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const fetchContact = useCallback(async () => {
    try {
      const res = await fetch(`/api/contacts/${id}`)
      const data = await res.json()

      if (res.ok) {
        setContact(data.contact)
        setActivities(data.activities || [])
        setDeals(data.deals || [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchContact()
  }, [fetchContact])

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-accent" />
        <div className="h-48 animate-pulse rounded-xl bg-accent" />
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-lg font-medium">Contact not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This contact may have been deleted.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => router.push("/contacts")}
        >
          Back to contacts
        </Button>
      </div>
    )
  }

  const fullName = `${contact.first_name} ${contact.last_name}`

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <Link
        href="/contacts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All contacts
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{fullName}</h1>
            <Badge
              variant="outline"
              className={stageColors[contact.stage] || ""}
            >
              {contact.stage}
            </Badge>
          </div>
          {contact.job_title && (
            <p className="mt-1 text-sm text-muted-foreground">
              {contact.job_title}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Contact info */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Details card */}
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground">
              Details
            </h3>
            <div className="mt-4 flex flex-col gap-3">
              {contact.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${contact.email}`}
                    className="hover:underline"
                  >
                    {contact.email}
                  </a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${contact.phone}`} className="hover:underline">
                    {contact.phone}
                  </a>
                </div>
              )}
              {contact.job_title && (
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{contact.job_title}</span>
                </div>
              )}
              {contact.lead_source && (
                <div className="flex items-center gap-3 text-sm">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span>{contact.lead_source}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Added{" "}
                  {new Date(contact.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
            <p className="mt-3 text-sm whitespace-pre-wrap">
              {contact.notes || "No notes yet. Click Edit to add notes."}
            </p>
          </div>

          {/* Deals */}
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground">
              Deals ({deals.length})
            </h3>
            {deals.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No deals linked to this contact.
              </p>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                {deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2"
                  >
                    <span className="text-sm font-medium">{deal.title}</span>
                    <span className="text-sm text-muted-foreground">
                      EUR {deal.value?.toLocaleString() || "0"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Timeline */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground">
              Activity timeline
            </h3>

            {activities.length === 0 ? (
              <div className="mt-8 flex flex-col items-center py-8 text-center">
                <Clock className="mb-3 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No activity yet. Log a call, note, or task to start the
                  timeline.
                </p>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-4">
                {activities.map((activity) => {
                  const Icon =
                    activityIcons[activity.type] || Clock
                  return (
                    <div
                      key={activity.id}
                      className="flex gap-3 border-b border-border/50 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {activity.title || activity.type}
                        </p>
                        {activity.description && (
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {activity.description}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ContactDialog
        contact={contact}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={fetchContact}
      />

      {deleteOpen && (
        <DeleteDialog
          contactId={contact.id}
          contactName={fullName}
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onDeleted={() => router.push("/contacts")}
        />
      )}
    </div>
  )
}
