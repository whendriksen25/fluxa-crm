"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ContactDialog } from "@/components/contacts/contact-dialog"
import { DeleteDialog } from "@/components/contacts/delete-dialog"
import { Plus, Search, Users, Pencil, Trash2 } from "lucide-react"
import type { Contact } from "@/lib/types"

const stageColors: Record<string, string> = {
  lead: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  contacted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  qualified: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  proposal: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  customer: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  churned: "bg-red-500/10 text-red-400 border-red-500/20",
}

const stageLabels: Record<string, string> = {
  lead: "Lead",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  customer: "Customer",
  churned: "Churned",
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [stageFilter, setStageFilter] = useState("")
  const [tagFilter, setTagFilter] = useState("")
  const [leadSourceFilter, setLeadSourceFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 25

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const [deleteContact, setDeleteContact] = useState<Contact | null>(null)

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (stageFilter) params.set("stage", stageFilter)
      if (tagFilter) params.set("tag", tagFilter)
      if (leadSourceFilter) params.set("leadSource", leadSourceFilter)
      params.set("page", page.toString())
      params.set("pageSize", pageSize.toString())

      const res = await fetch(`/api/contacts?${params}`)
      const data = await res.json()

      if (res.ok) {
        setContacts(data.contacts || [])
        setTotal(data.total || 0)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [search, stageFilter, tagFilter, leadSourceFilter, page])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContacts()
    }, search ? 300 : 0)

    return () => clearTimeout(timer)
  }, [fetchContacts, search])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total > 0
              ? `${total} contact${total === 1 ? "" : "s"} total`
              : "All your customers and leads in one place."}
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add contact
        </Button>
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>
        <select
          value={stageFilter}
          onChange={(e) => {
            setStageFilter(e.target.value)
            setPage(1)
          }}
          className="flex h-8 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
        >
          <option value="">All stages</option>
          {Object.entries(stageLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={tagFilter}
          onChange={(e) => {
            setTagFilter(e.target.value)
            setPage(1)
          }}
          className="flex h-8 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
        >
          <option value="">All groups</option>
          <option value="ETG">ETG</option>
          <option value="MV Installer">MV Installer</option>
          <option value="LV Installer">LV Installer</option>
          <option value="Belgium">Belgium</option>
          <option value="Netherlands">Netherlands</option>
        </select>
        <select
          value={leadSourceFilter}
          onChange={(e) => {
            setLeadSourceFilter(e.target.value)
            setPage(1)
          }}
          className="flex h-8 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
        >
          <option value="">All sources</option>
          <option value="Webscrape jan 2026">Webscrape jan 2026</option>
        </select>
      </div>

      {/* Table or empty state */}
      {loading && contacts.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card px-6 py-20 text-center">
          <p className="text-sm text-muted-foreground">Loading contacts...</p>
        </div>
      ) : contacts.length === 0 && !search && !stageFilter && !tagFilter && !leadSourceFilter ? (
        <div className="rounded-xl border border-border/50 bg-card">
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium">No contacts yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Add your first contact or import your Excel file to get started.
            </p>
            <div className="mt-6 flex gap-3">
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add contact
              </Button>
              <Link
                href="/import"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Import from Excel
              </Link>
            </div>
          </div>
        </div>
      ) : contacts.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No contacts match your search.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="hidden px-4 py-3 text-xs font-medium text-muted-foreground sm:table-cell">
                    Email
                  </th>
                  <th className="hidden px-4 py-3 text-xs font-medium text-muted-foreground md:table-cell">
                    Phone
                  </th>
                  <th className="hidden px-4 py-3 text-xs font-medium text-muted-foreground lg:table-cell">
                    Company
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">
                    Stage
                  </th>
                  <th className="hidden px-4 py-3 text-xs font-medium text-muted-foreground xl:table-cell">
                    Source
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="border-b border-border/50 last:border-0 transition-colors hover:bg-accent/50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="font-medium hover:underline"
                      >
                        {contact.first_name} {contact.last_name}
                      </Link>
                      {contact.job_title && (
                        <p className="text-xs text-muted-foreground">
                          {contact.job_title}
                        </p>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell">
                      {contact.email || "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">
                      {contact.phone || "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-muted-foreground lg:table-cell">
                      {(contact as unknown as { company: { name: string } | null })
                        .company?.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={stageColors[contact.stage] || ""}
                      >
                        {stageLabels[contact.stage] || contact.stage}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-muted-foreground xl:table-cell">
                      {contact.lead_source || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditContact(contact)}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteContact(contact)}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Dialogs */}
      <ContactDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={fetchContacts}
      />

      <ContactDialog
        contact={editContact}
        open={!!editContact}
        onClose={() => setEditContact(null)}
        onSaved={fetchContacts}
      />

      {deleteContact && (
        <DeleteDialog
          contactId={deleteContact.id}
          contactName={`${deleteContact.first_name} ${deleteContact.last_name}`}
          open={!!deleteContact}
          onClose={() => setDeleteContact(null)}
          onDeleted={fetchContacts}
        />
      )}
    </div>
  )
}
