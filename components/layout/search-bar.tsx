"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Users, Building2, TrendingUp } from "lucide-react"

interface SearchResult {
  contacts: Array<{
    id: string
    first_name: string
    last_name: string
    email: string | null
    stage: string
    company: { name: string } | null
  }>
  companies: Array<{
    id: string
    name: string
    category: string | null
    country: string | null
  }>
  deals: Array<{
    id: string
    title: string
    value: number
    stage: { name: string; color: string } | null
  }>
}

export function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (res.ok) setResults(data)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query, search])

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Keyboard shortcut: Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === "Escape") {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  function navigate(href: string) {
    setOpen(false)
    setQuery("")
    setResults(null)
    router.push(href)
  }

  const hasResults =
    results &&
    (results.contacts.length > 0 ||
      results.companies.length > 0 ||
      results.deals.length > 0)

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search... (Cmd+K)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          className="w-full rounded-lg border border-border/50 bg-accent/50 py-1.5 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/50"
        />
      </div>

      {/* Results dropdown */}
      {open && query.length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-xl border border-border/50 bg-card shadow-2xl">
          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : !hasResults ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No results for &quot;{query}&quot;
            </div>
          ) : (
            <>
              {results!.contacts.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground">
                    <Users className="h-3 w-3" />
                    Contacts
                  </div>
                  {results!.contacts.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => navigate(`/contacts/${c.id}`)}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-accent/50"
                    >
                      <span className="font-medium">
                        {c.first_name} {c.last_name}
                      </span>
                      {c.company?.name && (
                        <span className="text-muted-foreground">
                          {c.company.name}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {results!.companies.length > 0 && (
                <div className="border-t border-border/50">
                  <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    Companies
                  </div>
                  {results!.companies.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => navigate(`/companies/${c.id}`)}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-accent/50"
                    >
                      <span className="font-medium">{c.name}</span>
                      {c.category && (
                        <span className="text-xs text-muted-foreground">
                          {c.category}
                        </span>
                      )}
                      {c.country && (
                        <span className="text-xs text-muted-foreground">
                          {c.country}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {results!.deals.length > 0 && (
                <div className="border-t border-border/50">
                  <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    Deals
                  </div>
                  {results!.deals.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => navigate(`/pipeline`)}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-accent/50"
                    >
                      <span className="font-medium">{d.title}</span>
                      <span className="text-muted-foreground">
                        EUR {d.value?.toLocaleString() || "0"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
