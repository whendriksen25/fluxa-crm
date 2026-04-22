"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { CompanyDialog } from "@/components/contacts/company-dialog"
import { AccountPlanView } from "./account-plan/account-plan-view"
import type { Company, Contact, Deal, AccountPlanFull } from "@/lib/types"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Globe,
  Phone,
  Building2,
  Users,
  MapPin,
  Network,
  Tag,
  BarChart3,
  Map,
} from "lucide-react"

const stageColors: Record<string, string> = {
  lead: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  contacted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  qualified: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  proposal: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  customer: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  churned: "bg-red-500/10 text-red-400 border-red-500/20",
}

const relevanceColors: Record<string, string> = {
  "Zeer hoog": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Hoog": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Middel-hoog": "bg-sky-500/10 text-sky-400 border-sky-500/20",
  "Middel": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Laag": "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
}

const categoryColors: Record<string, string> = {
  "ETG": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "MV Installer": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "LV Installer": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
}

export default function CompanyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [company, setCompany] = useState<Company | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [accountPlan, setAccountPlan] = useState<AccountPlanFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [creatingPlan, setCreatingPlan] = useState(false)

  const fetchCompany = useCallback(async () => {
    try {
      const res = await fetch(`/api/companies/${id}`)
      const data = await res.json()

      if (res.ok) {
        setCompany(data.company)
        setContacts(data.contacts || [])
        setDeals(data.deals || [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchAccountPlan = useCallback(async () => {
    try {
      const res = await fetch(`/api/companies/${id}/account-plan`)
      const data = await res.json()
      if (res.ok) {
        setAccountPlan(data.plan)
      }
    } catch {
      // silently fail
    }
  }, [id])

  useEffect(() => {
    fetchCompany()
    fetchAccountPlan()
  }, [fetchCompany, fetchAccountPlan])

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/companies/${id}`, { method: "DELETE" })
      if (res.ok) router.push("/companies")
    } catch {
      // silently fail
    } finally {
      setDeleting(false)
    }
  }

  async function handleCreatePlan() {
    setCreatingPlan(true)
    try {
      const res = await fetch(`/api/companies/${id}/account-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_type: "Growth" }),
      })
      if (res.ok) {
        await fetchAccountPlan()
      }
    } catch {
      // silently fail
    } finally {
      setCreatingPlan(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-accent" />
        <div className="h-48 animate-pulse rounded-xl bg-accent" />
      </div>
    )
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-lg font-medium">Company not found</h2>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => router.push("/companies")}
        >
          Back to companies
        </Button>
      </div>
    )
  }

  const hasCharacteristics = company.category || company.country || company.relevance || company.segment || company.region || company.network_group

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/companies"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All companies
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
            {company.category && (
              <Badge variant="outline" className={categoryColors[company.category] || ""}>
                {company.category}
              </Badge>
            )}
            {company.relevance && (
              <Badge variant="outline" className={relevanceColors[company.relevance] || ""}>
                {company.relevance}
              </Badge>
            )}
          </div>
          {company.segment && (
            <p className="mt-1 text-sm text-muted-foreground">
              {company.segment}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs: Company Info | Account Plan */}
      <Tabs defaultValue="info">
        <TabsList variant="line">
          <TabsTrigger value="info">Company Info</TabsTrigger>
          <TabsTrigger value="account-plan">Account Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="mt-4 grid gap-6 lg:grid-cols-3">
            {/* Left: Company info */}
            <div className="flex flex-col gap-6 lg:col-span-1">
              {/* Details */}
              <div className="rounded-xl border border-border/50 bg-card p-5">
                <h3 className="text-sm font-medium text-muted-foreground">Details</h3>
                <div className="mt-4 flex flex-col gap-3">
                  {company.website && (
                    <div className="flex items-center gap-3 text-sm">
                      <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>{company.website}</span>
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>{company.phone}</span>
                    </div>
                  )}
                  {company.size && (
                    <div className="flex items-center gap-3 text-sm">
                      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>{company.size}</span>
                    </div>
                  )}
                  {company.location && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>{company.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>

              {/* Characteristics */}
              {hasCharacteristics && (
                <div className="rounded-xl border border-border/50 bg-card p-5">
                  <h3 className="text-sm font-medium text-muted-foreground">Characteristics</h3>
                  <div className="mt-4 flex flex-col gap-3">
                    {company.category && (
                      <div className="flex items-center gap-3 text-sm">
                        <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span>
                          <span className="text-muted-foreground">Category: </span>
                          {company.category}
                        </span>
                      </div>
                    )}
                    {company.country && (
                      <div className="flex items-center gap-3 text-sm">
                        <Map className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span>
                          <span className="text-muted-foreground">Country: </span>
                          {company.country}
                        </span>
                      </div>
                    )}
                    {company.region && (
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span>
                          <span className="text-muted-foreground">Region: </span>
                          {company.region}
                        </span>
                      </div>
                    )}
                    {company.relevance && (
                      <div className="flex items-center gap-3 text-sm">
                        <BarChart3 className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span>
                          <span className="text-muted-foreground">Relevance: </span>
                          {company.relevance}
                        </span>
                      </div>
                    )}
                    {company.network_group && (
                      <div className="flex items-center gap-3 text-sm">
                        <Network className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span>
                          <span className="text-muted-foreground">Network: </span>
                          {company.network_group}
                        </span>
                      </div>
                    )}
                    {company.segment && (
                      <div className="flex items-center gap-3 text-sm">
                        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span>
                          <span className="text-muted-foreground">Segment: </span>
                          {company.segment}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {company.notes && (
                <div className="rounded-xl border border-border/50 bg-card p-5">
                  <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                  <p className="mt-3 text-sm whitespace-pre-wrap">{company.notes}</p>
                </div>
              )}
            </div>

            {/* Right: Contacts + Deals */}
            <div className="flex flex-col gap-6 lg:col-span-2">
              {/* Contacts */}
              <div className="rounded-xl border border-border/50 bg-card p-5">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Contacts ({contacts.length})
                </h3>
                {contacts.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    No contacts linked to this company yet.
                  </p>
                ) : (
                  <div className="mt-3 flex flex-col gap-2">
                    {contacts.map((contact) => (
                      <Link
                        key={contact.id}
                        href={`/contacts/${contact.id}`}
                        className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3 transition-colors hover:bg-accent/50"
                      >
                        <div>
                          <span className="text-sm font-medium">
                            {contact.first_name} {contact.last_name}
                          </span>
                          {contact.job_title && (
                            <p className="text-xs text-muted-foreground">
                              {contact.job_title}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={stageColors[contact.stage] || ""}
                        >
                          {contact.stage}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Deals */}
              <div className="rounded-xl border border-border/50 bg-card p-5">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Deals ({deals.length})
                </h3>
                {deals.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    No deals linked to this company yet.
                  </p>
                ) : (
                  <div className="mt-3 flex flex-col gap-2">
                    {deals.map((deal) => (
                      <div
                        key={deal.id}
                        className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3"
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
          </div>
        </TabsContent>

        <TabsContent value="account-plan">
          <div className="mt-4">
            {accountPlan ? (
              <AccountPlanView
                plan={accountPlan}
                company={company}
                onUpdate={fetchAccountPlan}
              />
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card py-20 text-center">
                <div className="mb-4 rounded-full bg-accent p-4">
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No Account Plan yet</h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Create a strategic account plan to track health, stakeholders, value architecture, and competitive landscape for {company.name}.
                </p>
                <Button
                  className="mt-6"
                  onClick={handleCreatePlan}
                  disabled={creatingPlan}
                >
                  {creatingPlan ? "Creating..." : "Create Account Plan"}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CompanyDialog
        company={company}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={fetchCompany}
      />

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-xl border border-border/50 bg-card p-6 shadow-2xl">
            <h2 className="text-lg font-semibold">Delete company</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete <strong>{company.name}</strong>?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
