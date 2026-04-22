"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CompanyDialog } from "@/components/contacts/company-dialog"
import { Plus, Search, Building2, Pencil, Trash2 } from "lucide-react"
import type { Company } from "@/lib/types"

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

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [countryFilter, setCountryFilter] = useState("")
  const [relevanceFilter, setRelevanceFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 25

  const [createOpen, setCreateOpen] = useState(false)
  const [editCompany, setEditCompany] = useState<Company | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState("")
  const [deleting, setDeleting] = useState(false)

  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (categoryFilter) params.set("category", categoryFilter)
      if (countryFilter) params.set("country", countryFilter)
      if (relevanceFilter) params.set("relevance", relevanceFilter)
      params.set("page", page.toString())
      params.set("pageSize", pageSize.toString())

      const res = await fetch(`/api/companies?${params}`)
      const data = await res.json()

      if (res.ok) {
        setCompanies(data.companies || [])
        setTotal(data.total || 0)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter, countryFilter, relevanceFilter, page])

  useEffect(() => {
    const timer = setTimeout(() => fetchCompanies(), search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [fetchCompanies, search])

  const totalPages = Math.ceil(total / pageSize)

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/companies/${deleteId}`, { method: "DELETE" })
      if (res.ok) {
        setDeleteId(null)
        fetchCompanies()
      }
    } catch {
      // silently fail
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total > 0
              ? `${total} ${total === 1 ? "company" : "companies"} total`
              : "Organizations you work with."}
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add company
        </Button>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value)
            setPage(1)
          }}
          className="flex h-8 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
        >
          <option value="">All categories</option>
          <option value="ETG">ETG</option>
          <option value="MV Installer">MV Installer</option>
          <option value="LV Installer">LV Installer</option>
        </select>
        <select
          value={countryFilter}
          onChange={(e) => {
            setCountryFilter(e.target.value)
            setPage(1)
          }}
          className="flex h-8 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
        >
          <option value="">All countries</option>
          <option value="Belgium">Belgium</option>
          <option value="Netherlands">Netherlands</option>
        </select>
        <select
          value={relevanceFilter}
          onChange={(e) => {
            setRelevanceFilter(e.target.value)
            setPage(1)
          }}
          className="flex h-8 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
        >
          <option value="">All relevance</option>
          <option value="Zeer hoog">Zeer hoog</option>
          <option value="Hoog">Hoog</option>
          <option value="Middel-hoog">Middel-hoog</option>
          <option value="Middel">Middel</option>
          <option value="Laag">Laag</option>
        </select>
      </div>

      {loading && companies.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card px-6 py-20 text-center">
          <p className="text-sm text-muted-foreground">Loading companies...</p>
        </div>
      ) : companies.length === 0 && !search && !categoryFilter && !countryFilter && !relevanceFilter ? (
        <div className="rounded-xl border border-border/50 bg-card">
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium">No companies yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Add your first company or they&apos;ll be created automatically
              when you link contacts.
            </p>
            <Button size="sm" className="mt-6" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add company
            </Button>
          </div>
        </div>
      ) : companies.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No companies match your filters.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Company</th>
                  <th className="hidden px-4 py-3 text-xs font-medium text-muted-foreground sm:table-cell">Category</th>
                  <th className="hidden px-4 py-3 text-xs font-medium text-muted-foreground md:table-cell">Country</th>
                  <th className="hidden px-4 py-3 text-xs font-medium text-muted-foreground lg:table-cell">Relevance</th>
                  <th className="hidden px-4 py-3 text-xs font-medium text-muted-foreground xl:table-cell">Size</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr
                    key={company.id}
                    className="border-b border-border/50 last:border-0 transition-colors hover:bg-accent/50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/companies/${company.id}`}
                        className="font-medium hover:underline"
                      >
                        {company.name}
                      </Link>
                      {company.segment && (
                        <p className="text-xs text-muted-foreground">
                          {company.segment}
                        </p>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      {company.category ? (
                        <Badge
                          variant="outline"
                          className={categoryColors[company.category] || ""}
                        >
                          {company.category}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">
                      {company.country || "—"}
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      {company.relevance ? (
                        <Badge
                          variant="outline"
                          className={relevanceColors[company.relevance] || ""}
                        >
                          {company.relevance}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-muted-foreground xl:table-cell">
                      {company.size || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditCompany(company)}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteId(company.id)
                            setDeleteName(company.name)
                          }}
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
      <CompanyDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={fetchCompanies}
      />

      <CompanyDialog
        company={editCompany}
        open={!!editCompany}
        onClose={() => setEditCompany(null)}
        onSaved={fetchCompanies}
      />

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteId(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-xl border border-border/50 bg-card p-6 shadow-2xl">
            <h2 className="text-lg font-semibold">Delete company</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete <strong>{deleteName}</strong>?
              Contacts linked to this company will not be deleted.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteId(null)}>
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
