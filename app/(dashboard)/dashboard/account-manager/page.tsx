"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Check,
  Clock,
} from "lucide-react"

/* ── colour maps ── */
const healthDot: Record<string, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
}
const healthLabel: Record<string, string> = {
  green: "Green",
  amber: "Amber",
  red: "Red",
}
const trendLabel: Record<string, { text: string; color: string; Icon: typeof TrendingUp }> = {
  up:     { text: "Growing",   color: "text-emerald-400", Icon: TrendingUp },
  stable: { text: "Stable",    color: "text-muted-foreground", Icon: ArrowRight },
  down:   { text: "At risk",   color: "text-red-400",     Icon: TrendingDown },
}
const renewalUrgency: Record<string, string> = {
  overdue: "bg-red-500/15 text-red-400",
  red:     "bg-red-500/15 text-red-400",
  amber:   "bg-amber-500/15 text-amber-400",
  green:   "bg-emerald-500/15 text-emerald-400",
}

/* ── types ── */
interface Stats {
  total_arr: number
  at_risk_arr: number
  at_risk_count: number
  renewals_this_month: number
  renewals_value: number
  open_tasks: number
  overdue_count: number
  today_count: number
}
interface Account {
  id: string; name: string; category: string | null; arr: number
  last_contact: string | null; last_contact_days: number | null
  health: "green" | "amber" | "red"; trend: string
}
interface Task {
  id: string; title: string; due_date: string | null
  urgency: "overdue" | "today" | "upcoming"
  contact_name: string | null; deal_title: string | null; arr_at_stake: number
}
interface PipelineStage { name: string; color: string; count: number; value: number }
interface Renewal {
  id: string; title: string; company_name: string | null
  value: number; days_left: number; urgency: string
}

export default function AccountManagerDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [pipeline, setPipeline] = useState<PipelineStage[]>([])
  const [renewals, setRenewals] = useState<Renewal[]>([])
  const [loading, setLoading] = useState(true)
  const [isSample, setIsSample] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/account-manager")
      const data = await res.json()
      if (res.ok) {
        setStats(data.stats)
        setAccounts(data.account_health || [])
        setTasks(data.tasks_list || [])
        setPipeline(data.pipeline || [])
        setRenewals(data.renewals || [])
        if (data.is_sample) setIsSample(true)
      }
    } catch { /* silently fail */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function completeTask(id: string) {
    await fetch(`/api/activities/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    })
    fetchData()
  }

  function eur(v: number) {
    if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `€${Math.round(v / 1_000)}K`
    return `€${v.toLocaleString()}`
  }

  if (loading) return (
    <div className="flex flex-col gap-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-accent" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 animate-pulse rounded-xl bg-accent" />)}
      </div>
    </div>
  )

  const pipelineMax = Math.max(...pipeline.map(s => s.count), 1)

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My accounts</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Q2 2026</p>
        </div>
        <Link href="/dashboard/sales-manager">
          <Button variant="outline" size="sm">Team view</Button>
        </Link>
      </div>

      {/* Sample data banner */}
      {isSample && (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-2.5">
          <p className="text-xs text-blue-400">
            Showing example data — this is what your dashboard will look like with real accounts. Add contacts, deals, and log activities to see your real numbers.
          </p>
        </div>
      )}

      {/* ── KPI cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total ARR */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total ARR Managed</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{eur(stats?.total_arr || 0)}</p>
        </div>
        {/* At-Risk ARR */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">At-Risk ARR</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-red-400">{eur(stats?.at_risk_arr || 0)}</p>
          {(stats?.at_risk_count || 0) > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">{stats!.at_risk_count} accounts flagged</p>
          )}
        </div>
        {/* Renewals this month */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Renewals This Month</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{stats?.renewals_this_month || 0}</p>
          {(stats?.renewals_value || 0) > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">{eur(stats!.renewals_value)} at stake</p>
          )}
        </div>
        {/* Open Tasks */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Open Tasks</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{stats?.open_tasks || 0}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats?.overdue_count || 0} overdue · {stats?.today_count || 0} due today
          </p>
        </div>
      </div>

      {/* ── Account Health + Today's Tasks ── */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Account Health — 3 cols */}
        <div className="lg:col-span-3 rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="border-b border-border/50 px-5 py-3.5">
            <h2 className="text-sm font-semibold">Account health</h2>
          </div>
          {accounts.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              No accounts yet. Import data or create contacts to see your portfolio.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-2.5">Account</th>
                  <th className="hidden sm:table-cell px-4 py-2.5">Segment</th>
                  <th className="px-4 py-2.5 text-right">ARR</th>
                  <th className="hidden md:table-cell px-4 py-2.5">Last Contact</th>
                  <th className="px-4 py-2.5 text-center">Health</th>
                  <th className="hidden lg:table-cell px-4 py-2.5">Trend</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => {
                  const t = trendLabel[a.trend as keyof typeof trendLabel] || trendLabel.stable
                  return (
                    <tr key={a.id} className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/companies/${a.id}`} className="text-sm font-semibold hover:underline">{a.name}</Link>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3">
                        {a.category ? (
                          <span className="inline-flex items-center rounded-md bg-accent px-2 py-0.5 text-xs font-medium">{a.category}</span>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold">{a.arr > 0 ? eur(a.arr) : "—"}</td>
                      <td className="hidden md:table-cell px-4 py-3 text-sm text-muted-foreground">
                        {a.last_contact_days !== null
                          ? a.last_contact_days === 0 ? "Today"
                            : a.last_contact_days === 1 ? "Yesterday"
                            : `${a.last_contact_days} days ago`
                          : "Never"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`inline-block h-2.5 w-2.5 rounded-full ${healthDot[a.health]}`} />
                          <span className="text-xs text-muted-foreground hidden xl:inline">{healthLabel[a.health]}</span>
                        </div>
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <t.Icon className={`h-3.5 w-3.5 ${t.color}`} />
                          <span className={`text-xs ${t.color}`}>{t.text}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Today's Tasks — 2 cols */}
        <div className="lg:col-span-2 rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="border-b border-border/50 px-5 py-3.5">
            <h2 className="text-sm font-semibold">Today&apos;s tasks</h2>
          </div>
          {tasks.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              All caught up — no tasks pending.
            </div>
          ) : (
            <div className="flex flex-col">
              {tasks.map((task) => {
                const bg = task.urgency === "overdue" ? "bg-red-500/5" : task.urgency === "today" ? "bg-amber-500/5" : ""
                const dot = task.urgency === "overdue" ? "bg-red-500" : task.urgency === "today" ? "bg-amber-500" : "bg-zinc-500"
                return (
                  <div key={task.id} className={`flex items-start gap-3 border-b border-border/50 last:border-0 px-4 py-3 ${bg}`}>
                    <button onClick={() => completeTask(task.id)} className="mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground hover:text-emerald-400 transition-colors">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug">{task.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        {task.contact_name && <span>{task.contact_name}</span>}
                        {task.arr_at_stake > 0 && <span>ARR: {eur(task.arr_at_stake)}</span>}
                      </div>
                    </div>
                    <span className={`mt-0.5 inline-block h-2 w-2 rounded-full shrink-0 ${dot}`} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── My pipeline + Upcoming renewals ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline */}
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="border-b border-border/50 px-5 py-3.5">
            <h2 className="text-sm font-semibold">My pipeline</h2>
          </div>
          {pipeline.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">No open deals.</div>
          ) : (
            <div className="flex flex-col gap-3 p-5">
              {pipeline.map((s) => {
                const barPct = Math.max(8, (s.count / pipelineMax) * 100)
                return (
                  <div key={s.name} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-sm text-right">{s.name}</span>
                    <div className="flex-1">
                      <div
                        className="flex h-7 items-center rounded-md px-3"
                        style={{ width: `${barPct}%`, backgroundColor: s.color + "25", borderLeft: `3px solid ${s.color}` }}
                      >
                        <span className="text-xs font-semibold whitespace-nowrap">{s.count}</span>
                      </div>
                    </div>
                    <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">{eur(s.value)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Upcoming Renewals */}
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="border-b border-border/50 px-5 py-3.5">
            <h2 className="text-sm font-semibold">Upcoming renewals</h2>
          </div>
          {renewals.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              No upcoming renewals. Set close dates on deals to track them here.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border/50">
              {renewals.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.company_name || r.title}</p>
                    <p className="text-xs text-muted-foreground">{eur(r.value)}</p>
                  </div>
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${renewalUrgency[r.urgency] || ""}`}>
                    {r.days_left < 0 ? `${Math.abs(r.days_left)}d overdue` : `${r.days_left}d`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
