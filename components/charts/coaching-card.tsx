"use client"

/**
 * Figure 3b — Coaching overview card per rep.
 * Shows three proportional bars (Activity, Opportunity, Revenue)
 * plus a coaching recommendation text.
 */

interface CoachingCardProps {
  name: string
  role: string
  attainment: number
  diagnosis: "blue" | "amber" | "red" | "green"
  totalActivities: number
  totalPipeline: number
  totalClosed: number
  maxActivities: number   // for scaling across reps
  maxRevenue: number      // for scaling across reps
}

const diagnosisConfig: Record<string, { label: string; color: string; border: string; recommendation: string }> = {
  blue:  { label: "Healthy", color: "bg-blue-500", border: "border-blue-500/30", recommendation: "Replicate outreach cadence across team" },
  amber: { label: "Conversion issue", color: "bg-amber-500", border: "border-amber-500/30", recommendation: "Qualification & late-stage closing coaching" },
  red:   { label: "Low activity", color: "bg-red-500", border: "border-red-500/30", recommendation: "Weekly prospecting block + daily check-ins" },
  green: { label: "Strong ramp", color: "bg-emerald-500", border: "border-emerald-500/30", recommendation: "Pair with senior rep on enterprise deals" },
}

function eur(v: number) {
  if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `€${Math.round(v / 1_000)}K`
  return `€${v}`
}

export function CoachingCard({
  name, role, attainment, diagnosis,
  totalActivities, totalPipeline, totalClosed,
  maxActivities, maxRevenue,
}: CoachingCardProps) {
  const cfg = diagnosisConfig[diagnosis] || diagnosisConfig.blue
  const actPct = maxActivities > 0 ? (totalActivities / maxActivities) * 100 : 0
  const oppPct = maxRevenue > 0 ? (totalPipeline / maxRevenue) * 100 : 0
  const revPct = maxRevenue > 0 ? (totalClosed / maxRevenue) * 100 : 0

  return (
    <div className={`rounded-xl border ${cfg.border} bg-card p-4`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold">{name}</p>
          <p className="text-xs text-muted-foreground capitalize">{role} · {attainment}% quota</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${cfg.color}/10 text-${diagnosis === "blue" ? "blue" : diagnosis === "amber" ? "amber" : diagnosis === "red" ? "red" : "emerald"}-400`}>
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.color}`} />
          {cfg.label}
        </span>
      </div>

      {/* Proportional bars */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-xs text-muted-foreground">Activity</span>
          <div className="flex-1 h-3 rounded-full bg-accent overflow-hidden">
            <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${Math.max(2, actPct)}%` }} />
          </div>
          <span className="w-12 shrink-0 text-right text-xs font-medium">{totalActivities}/mo</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-xs text-muted-foreground">Pipeline</span>
          <div className="flex-1 h-3 rounded-full bg-accent overflow-hidden">
            <div className="h-full rounded-full bg-sky-400 transition-all" style={{ width: `${Math.max(2, oppPct)}%` }} />
          </div>
          <span className="w-12 shrink-0 text-right text-xs font-medium">{eur(totalPipeline)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-xs text-muted-foreground">Revenue</span>
          <div className="flex-1 h-3 rounded-full bg-accent overflow-hidden">
            <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${Math.max(2, revPct)}%` }} />
          </div>
          <span className="w-12 shrink-0 text-right text-xs font-medium">{eur(totalClosed)}</span>
        </div>
      </div>

      {/* Recommendation */}
      <div className="mt-3 rounded-lg bg-accent/50 px-3 py-2">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Action: </span>
          {cfg.recommendation}
        </p>
      </div>
    </div>
  )
}
