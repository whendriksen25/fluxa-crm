"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ComboChart } from "@/components/charts/combo-chart"
import { CoachingCard } from "@/components/charts/coaching-card"
import { Target, TrendingUp, Layers, AlertTriangle } from "lucide-react"

/* ── types ── */
interface Stats {
  attainment_pct: number; total_closed_won: number; coverage_ratio: number
  deals_at_risk_count: number; deals_at_risk_value: number
  team_quota: number; total_pipeline: number
}
interface Rep {
  id: string; name: string; role: string; quota: number; attainment: number
  closed_revenue: number; pipeline_value: number
  activity_count: number; activity_score: number
  avg_deal_size: number; deal_count: number; win_rate: number
}
interface DealRisk {
  id: string; title: string; company_name: string | null
  rep_name: string; stage_name: string; stage_color: string
  value: number; stalled_days: number
}
interface FunnelStage {
  name: string; color: string; count: number; value: number; dropoff: number | null
}
interface Forecast {
  quota: number; closed_won: number; commit: number; best_case: number; gap: number; pipeline_created: number
}
interface MonthData { month: string; activities: number; opportunity_revenue: number; actual_revenue: number }
interface TimelineRep {
  id: string; name: string; role: string; quota: number; attainment: number
  diagnosis: "blue" | "amber" | "red" | "green"
  total_activities: number; total_closed: number; total_pipeline: number; win_rate: number
  monthly: MonthData[]
}
interface TimelineAccount {
  id: string; name: string; owner_name: string
  diagnosis: "blue" | "amber" | "red" | "green"
  total_activities: number; total_revenue: number; total_pipeline: number
  monthly: MonthData[]
}

export default function SalesManagerDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [reps, setReps] = useState<Rep[]>([])
  const [risks, setRisks] = useState<DealRisk[]>([])
  const [funnel, setFunnel] = useState<FunnelStage[]>([])
  const [forecast, setForecast] = useState<Forecast | null>(null)
  const [teamMonthly, setTeamMonthly] = useState<MonthData[]>([])
  const [timelineReps, setTimelineReps] = useState<TimelineRep[]>([])
  const [timelineAccounts, setTimelineAccounts] = useState<TimelineAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [isSample, setIsSample] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [mainRes, tlRes] = await Promise.all([
        fetch("/api/dashboard/sales-manager"),
        fetch("/api/dashboard/sales-manager/timeline"),
      ])
      const mainData = await mainRes.json()
      const tlData = await tlRes.json()

      if (mainRes.ok) {
        setStats(mainData.stats)
        setReps(mainData.rep_performance || [])
        setRisks(mainData.deals_at_risk || [])
        setFunnel(mainData.funnel || [])
        setForecast(mainData.forecast)
        if (mainData.is_sample || tlData.is_sample) setIsSample(true)
      }
      if (tlRes.ok) {
        setTeamMonthly(tlData.team || [])
        setTimelineReps(tlData.per_rep || [])
        setTimelineAccounts(tlData.per_account || [])
      }
    } catch { /* silently fail */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function eur(v: number) {
    if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(2)}M`
    if (v >= 1_000) return `€${Math.round(v / 1_000)}K`
    return `€${v.toLocaleString()}`
  }
  function attColor(pct: number) { return pct >= 80 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-red-400" }
  function attBg(pct: number) { return pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500" }
  function dots(score: number) {
    return (<div className="flex items-center gap-0.5">{Array.from({ length: 5 }, (_, i) => (<span key={i} className={`inline-block h-2 w-2 rounded-full ${i < score ? "bg-emerald-400" : "bg-accent"}`} />))}</div>)
  }

  const diagnosisBorder: Record<string, string> = { blue: "border-blue-500/30", amber: "border-amber-500/30", red: "border-red-500/30", green: "border-emerald-500/30" }
  const diagnosisText: Record<string, string> = { blue: "text-blue-400", amber: "text-amber-400", red: "text-red-400", green: "text-emerald-400" }

  if (loading) return (
    <div className="flex flex-col gap-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-accent" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map(i => <div key={i} className="h-28 animate-pulse rounded-xl bg-accent" />)}</div>
    </div>
  )

  const maxRepAct = Math.max(...timelineReps.map(r => r.total_activities), 1)
  const maxRepRev = Math.max(...timelineReps.map(r => Math.max(r.total_closed, r.total_pipeline)), 1)

  return (
    <div className="flex flex-col gap-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales team overview</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Q2 2026</p>
        </div>
        <Link href="/dashboard/account-manager"><Button variant="outline" size="sm">My accounts</Button></Link>
      </div>

      {/* Sample data banner */}
      {isSample && (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-2.5">
          <p className="text-xs text-blue-400">
            Showing example data — this is what your dashboard will look like with a full sales team. Add team members and deals to see your real numbers.
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          FIGURE 1 — Main dashboard
          ══════════════════════════════════════════════ */}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Team Quota Attainment</p>
          <p className={`mt-2 text-3xl font-bold tracking-tight ${attColor(stats?.attainment_pct || 0)}`}>{stats?.attainment_pct || 0}%</p>
          {(stats?.team_quota || 0) > 0 && <p className="mt-1 text-xs text-muted-foreground">of {eur(stats!.team_quota)} quota</p>}
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Closed Won</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{eur(stats?.total_closed_won || 0)}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pipeline Coverage</p>
          <p className={`mt-2 text-3xl font-bold tracking-tight ${(stats?.coverage_ratio || 0) >= 3 ? "text-emerald-400" : "text-amber-400"}`}>{stats?.coverage_ratio || 0}×</p>
          <p className="mt-1 text-xs text-muted-foreground">Target 3×</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Deals at Risk</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-red-400">{stats?.deals_at_risk_count || 0}</p>
          {(stats?.deals_at_risk_value || 0) > 0 && <p className="mt-1 text-xs text-muted-foreground">{eur(stats!.deals_at_risk_value)} exposed</p>}
        </div>
      </div>

      {/* Rep Performance + Deals at Risk */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="border-b border-border/50 px-5 py-3.5"><h2 className="text-sm font-semibold">Rep performance</h2></div>
          {reps.length === 0 ? (<div className="px-5 py-12 text-center text-sm text-muted-foreground">No team members yet.</div>) : (
            <div className="flex flex-col divide-y divide-border/50">
              {reps.map((r) => (
                <div key={r.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-32 shrink-0"><p className="text-sm font-semibold">{r.name}</p><p className="text-xs text-muted-foreground capitalize">{r.role}</p></div>
                  <div className="w-14 shrink-0 text-right"><span className={`text-sm font-bold ${attColor(r.attainment)}`}>{r.attainment}%</span></div>
                  <div className="flex-1 hidden sm:block"><div className="h-2 w-full rounded-full bg-accent"><div className={`h-full rounded-full transition-all ${attBg(r.attainment)}`} style={{ width: `${Math.min(100, r.attainment)}%` }} /></div></div>
                  <div className="w-16 shrink-0 text-right hidden md:block"><p className="text-sm font-bold">{eur(r.closed_revenue)}</p></div>
                  <div className="shrink-0 hidden lg:block">{dots(r.activity_score)}</div>
                  <div className="w-14 shrink-0 text-right hidden xl:block"><p className="text-xs text-muted-foreground">{r.avg_deal_size > 0 ? eur(r.avg_deal_size) : "—"}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="lg:col-span-2 rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="border-b border-border/50 px-5 py-3.5"><h2 className="text-sm font-semibold">Deals at risk</h2></div>
          {risks.length === 0 ? (<div className="px-5 py-12 text-center text-sm text-muted-foreground">No stalled deals.</div>) : (
            <div className="flex flex-col divide-y divide-border/50">
              {risks.map((d) => (
                <div key={d.id} className="px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0"><p className="text-sm font-semibold truncate">{d.company_name || d.title}</p><p className="text-xs text-muted-foreground">{d.rep_name} · {d.stage_name}</p></div>
                    <div className="shrink-0 text-right ml-3"><p className="text-sm font-bold">{eur(d.value)}</p><Badge variant="outline" className={d.stalled_days >= 14 ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}>{d.stalled_days}d stalled</Badge></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pipeline Funnel + Win Rate + Forecast */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="border-b border-border/50 px-5 py-3.5"><h2 className="text-sm font-semibold">Pipeline funnel</h2></div>
          {funnel.length === 0 ? (<div className="px-5 py-12 text-center text-sm text-muted-foreground">No open deals.</div>) : (
            <table className="w-full"><thead><tr className="border-b border-border/50 text-left text-xs font-medium text-muted-foreground"><th className="px-4 py-2">Stage</th><th className="px-4 py-2 text-right">Deals</th><th className="px-4 py-2 text-right">Value</th><th className="px-4 py-2 text-right">Drop-off</th></tr></thead>
              <tbody>{funnel.map((s) => (<tr key={s.name} className="border-b border-border/50 last:border-0"><td className="px-4 py-2.5"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} /><span className="text-sm">{s.name}</span></div></td><td className="px-4 py-2.5 text-sm text-right font-medium">{s.count}</td><td className="px-4 py-2.5 text-sm text-right font-bold">{eur(s.value)}</td><td className="px-4 py-2.5 text-right">{s.dropoff !== null ? <span className="text-xs text-red-400">{s.dropoff}%</span> : <span className="text-xs text-muted-foreground">—</span>}</td></tr>))}</tbody>
            </table>
          )}
        </div>
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="border-b border-border/50 px-5 py-3.5"><h2 className="text-sm font-semibold">Win rate by rep</h2></div>
          {reps.length === 0 ? (<div className="px-5 py-12 text-center text-sm text-muted-foreground">No data yet.</div>) : (
            <div className="flex flex-col gap-3 p-5">{reps.map((r) => (<div key={r.id} className="flex items-center gap-3"><span className="w-24 shrink-0 text-sm truncate">{r.name}</span><div className="flex-1 h-2 rounded-full bg-accent"><div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${r.win_rate}%` }} /></div><span className="w-10 shrink-0 text-right text-xs font-semibold">{r.win_rate}%</span></div>))}</div>
          )}
        </div>
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="border-b border-border/50 px-5 py-3.5"><h2 className="text-sm font-semibold">Forecast</h2></div>
          {forecast ? (
            <div className="flex flex-col divide-y divide-border/50">
              {[
                { label: "Quota (target)", value: forecast.quota },
                { label: "Closed won", value: forecast.closed_won, bold: true },
                { label: "Commit forecast", value: forecast.commit, bold: true },
                { label: "Best case", value: forecast.best_case },
                { label: "Gap to quota", value: forecast.gap, isGap: true, bold: true },
                { label: "New pipeline", value: forecast.pipeline_created },
              ].map((row) => (<div key={row.label} className="flex items-center justify-between px-4 py-2.5"><span className="text-sm text-muted-foreground">{row.label}</span><span className={`text-sm ${row.bold ? "font-bold" : "font-medium"} ${row.isGap && row.value > 0 ? "text-red-400" : ""}`}>{row.isGap && row.value > 0 ? `−${eur(row.value)}` : eur(row.value)}</span></div>))}
            </div>
          ) : (<div className="px-5 py-12 text-center text-sm text-muted-foreground">Set quotas to see the forecast.</div>)}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          FIGURE 2 — Team activity, opportunities & revenue timeline
          ══════════════════════════════════════════════ */}
      {teamMonthly.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="border-b border-border/50 px-5 py-3.5">
            <h2 className="text-sm font-semibold">Activities, opportunities & revenue — team</h2>
            <p className="text-xs text-muted-foreground mt-0.5">The ~6 week lag between activity dots and the revenue line is the key insight — a drop in dots today predicts a revenue shortfall in 6 weeks.</p>
          </div>
          <div className="p-5">
            <ComboChart data={teamMonthly} dotColor="blue" height={240} showLabels showLegend />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          FIGURE 3 — Per account manager mini charts
          ══════════════════════════════════════════════ */}
      {timelineReps.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="border-b border-border/50 px-5 py-3.5">
            <h2 className="text-sm font-semibold">Activities, opportunities & revenue — per account manager</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Dot colour indicates diagnosis: blue = healthy, amber = conversion issue, red = low activity, green = strong ramp.</p>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {timelineReps.map((rep) => (
              <div key={rep.id} className={`rounded-lg border ${diagnosisBorder[rep.diagnosis]} bg-card p-3`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold">{rep.name}</p>
                    <p className={`text-xs ${diagnosisText[rep.diagnosis]} capitalize`}>{rep.role} · {rep.attainment}% quota</p>
                  </div>
                </div>
                <ComboChart data={rep.monthly} dotColor={rep.diagnosis} height={120} compact />
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="border-t border-border/50 px-5 py-3 flex flex-wrap gap-5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Blue dots = healthy activity</div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Amber dots = activity present but revenue lags</div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Red dots = low activity (root cause)</div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Green dots = strong ramp trajectory</div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          FIGURE 3b — Coaching overview per account manager
          ══════════════════════════════════════════════ */}
      {timelineReps.length > 0 && (
        <div>
          <div className="mb-4">
            <h2 className="text-sm font-semibold">Coaching overview — per account manager</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Activity vs opportunity vs revenue as proportional bars — showing where each rep stands right now.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {timelineReps.map((rep) => (
              <CoachingCard
                key={rep.id}
                name={rep.name}
                role={rep.role}
                attainment={rep.attainment}
                diagnosis={rep.diagnosis}
                totalActivities={rep.total_activities}
                totalPipeline={rep.total_pipeline}
                totalClosed={rep.total_closed}
                maxActivities={maxRepAct}
                maxRevenue={maxRepRev}
              />
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          FIGURE 5 — Per account mini charts
          ══════════════════════════════════════════════ */}
      {timelineAccounts.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="border-b border-border/50 px-5 py-3.5">
            <h2 className="text-sm font-semibold">Activities, opportunities & revenue — per account</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Shows which accounts are being actively nurtured and which are drifting.</p>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {timelineAccounts.map((acc) => (
              <Link key={acc.id} href={`/companies/${acc.id}`} className="block">
                <div className={`rounded-lg border ${diagnosisBorder[acc.diagnosis]} bg-card p-3 transition-colors hover:bg-accent/30`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{acc.name}</p>
                      <p className="text-xs text-muted-foreground">{acc.owner_name}</p>
                    </div>
                  </div>
                  <ComboChart data={acc.monthly} dotColor={acc.diagnosis} height={100} compact />
                </div>
              </Link>
            ))}
          </div>
          {/* Legend */}
          <div className="border-t border-border/50 px-5 py-3 flex flex-wrap gap-5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Healthy — activity and revenue aligned</div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Pipeline growing but not converting</div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Low activity — needs immediate attention</div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Strong growth — all signals aligned</div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          FIGURE 6 — Coaching quadrant (activity vs attainment)
          ══════════════════════════════════════════════ */}
      {timelineReps.length > 1 && (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="border-b border-border/50 px-5 py-3.5">
            <h2 className="text-sm font-semibold">Coaching conclusions — activity level vs quota attainment</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Position determines the coaching prescription — not opinion, but data.</p>
          </div>
          <div className="p-5">
            <div className="relative w-full aspect-[2/1] min-h-[280px]">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">Activity volume (interactions / month)</div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground whitespace-nowrap">Quota attainment (%)</div>
              <div className="absolute inset-6 border border-border/50">
                <div className="absolute top-2 left-3 text-xs text-amber-400/80 font-medium">Grow activity</div>
                <div className="absolute top-2 right-3 text-xs text-emerald-400/80 font-medium">Scale & replicate</div>
                <div className="absolute bottom-2 left-3 text-xs text-red-400/80 font-medium">Urgent intervention</div>
                <div className="absolute bottom-2 right-3 text-xs text-blue-400/80 font-medium">Fix conversion</div>
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border/50" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-border/50" />
                <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-emerald-500/5 rounded-bl-xl border-b border-l border-emerald-500/10" />
                <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-red-500/5 rounded-tr-xl border-t border-r border-red-500/10" />
                {timelineReps.map((r) => {
                  const maxAct = Math.max(...timelineReps.map(rp => rp.total_activities), 1)
                  const x = maxAct > 0 ? (r.total_activities / maxAct) * 90 + 5 : 50
                  const y = Math.min(95, Math.max(5, 95 - (r.attainment / 100) * 90))
                  const color = r.diagnosis === "green" ? "bg-emerald-500" : r.diagnosis === "amber" ? "bg-amber-500" : r.diagnosis === "red" ? "bg-red-500" : "bg-blue-500"
                  return (
                    <div key={r.id} className="absolute flex flex-col items-center" style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}>
                      <div className={`h-4 w-4 rounded-full ${color} border-2 border-card shadow-md`} />
                      <span className="mt-1 text-[10px] font-medium whitespace-nowrap leading-none">{r.name.split(" ")[0]}</span>
                      <span className="text-[9px] text-muted-foreground">{r.total_activities} acts · {r.attainment}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Top performer — scale & replicate</div>
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Solid performer — increase volume</div>
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Active but not converting — closing coaching</div>
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Urgent — rebuild activity & quality</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
