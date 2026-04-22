"use client"

import { useState, useRef, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Check, X, ChevronDown } from "lucide-react"
import type { Company, AccountPlanFull, AccountType, RiskLevel } from "@/lib/types"

const accountTypes: AccountType[] = ['Strategic', 'Growth', 'Maintain', 'Monitor', 'New']
const riskLevels: RiskLevel[] = ['Low', 'Medium', 'High']

const accountTypeBadge: Record<string, string> = {
  Strategic: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  Growth: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  Maintain: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  Monitor: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
  New: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
}

const riskColors: Record<string, string> = {
  Low: "text-emerald-400",
  Medium: "text-amber-400",
  High: "text-red-400",
}

function HealthRing({ score, onClick }: { score: number; onClick: () => void }) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444"

  return (
    <div
      className="relative flex items-center justify-center cursor-pointer group"
      onClick={onClick}
      title="Click to edit health score"
    >
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle
          cx="36" cy="36" r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-border/30"
        />
        <circle
          cx="36" cy="36" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          transform="rotate(-90 36 36)"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-bold" style={{ color }}>{score}</span>
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Health</span>
      </div>
      <div className="absolute inset-0 rounded-full ring-1 ring-transparent group-hover:ring-primary/30 transition-all" />
    </div>
  )
}

/** Inline dropdown that appears on click */
function InlineDropdown<T extends string>({
  value,
  options,
  onSelect,
  onCancel,
}: {
  value: T
  options: T[]
  onSelect: (v: T) => void
  onCancel: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onCancel()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onCancel])

  return (
    <div ref={ref} className="absolute top-full left-0 z-50 mt-1 min-w-[140px] rounded-lg border border-border/50 bg-popover shadow-xl">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-accent/50 first:rounded-t-lg last:rounded-b-lg ${
            opt === value ? "font-semibold text-foreground" : "text-muted-foreground"
          }`}
        >
          {opt === value && <Check className="h-3 w-3" />}
          {opt !== value && <span className="w-3" />}
          {opt}
        </button>
      ))}
    </div>
  )
}

/** Inline number editor */
function InlineNumberInput({
  value,
  onSave,
  onCancel,
  min = 0,
  max,
  step = 1,
  prefix,
  suffix,
  formatDisplay,
}: {
  value: number
  onSave: (v: number) => void
  onCancel: () => void
  min?: number
  max?: number
  step?: number
  prefix?: string
  suffix?: string
  formatDisplay?: (v: number) => string
}) {
  const [draft, setDraft] = useState(value.toString())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  function handleSubmit() {
    const num = parseFloat(draft)
    if (isNaN(num)) { onCancel(); return }
    const clamped = Math.max(min, max !== undefined ? Math.min(max, num) : num)
    onSave(clamped)
  }

  return (
    <div className="flex items-center gap-1">
      {prefix && <span className="text-xs text-muted-foreground">{prefix}</span>}
      <input
        ref={inputRef}
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit()
          if (e.key === "Escape") onCancel()
        }}
        onBlur={handleSubmit}
        min={min}
        max={max}
        step={step}
        className="w-20 rounded border border-border bg-background px-2 py-0.5 text-sm font-semibold tabular-nums outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
      />
      {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
    </div>
  )
}

interface HeaderProps {
  plan: AccountPlanFull
  company: Company
  onUpdate: () => void
}

export function AccountPlanHeader({ plan, company, onUpdate }: HeaderProps) {
  const [editingField, setEditingField] = useState<string | null>(null)

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `€${(val / 1000000).toFixed(1)}M`
    if (val >= 1000) return `€${(val / 1000).toFixed(0)}K`
    return `€${val.toLocaleString()}`
  }

  async function updatePlanField(field: string, value: unknown) {
    try {
      console.log(`[header] updating field ${field} to`, value)
      await fetch(`/api/companies/${company.id}/account-plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })
      onUpdate()
      console.log(`[header] field ${field} updated successfully`)
    } catch (err) {
      console.error(`[header] failed to update field ${field}`, err)
    } finally {
      setEditingField(null)
    }
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {/* Left: Account info */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Editable Account Type Badge */}
            <div className="relative">
              <button
                onClick={() => setEditingField(editingField === "account_type" ? null : "account_type")}
                className="group flex items-center gap-1"
                title="Click to change account type"
              >
                <Badge variant="outline" className={`${accountTypeBadge[plan.account_type] || ""} cursor-pointer transition-all group-hover:ring-1 group-hover:ring-primary/30`}>
                  {plan.account_type} Account
                  <ChevronDown className="ml-1 h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Badge>
              </button>
              {editingField === "account_type" && (
                <InlineDropdown
                  value={plan.account_type}
                  options={accountTypes}
                  onSelect={(v) => updatePlanField("account_type", v)}
                  onCancel={() => setEditingField(null)}
                />
              )}
            </div>

            {/* Active Opportunity Toggle */}
            <button
              onClick={() => updatePlanField("has_active_opportunity", !plan.has_active_opportunity)}
              title={plan.has_active_opportunity ? "Click to mark no active opportunity" : "Click to mark active opportunity"}
              className="transition-all"
            >
              <Badge
                variant="outline"
                className={`cursor-pointer transition-all hover:ring-1 hover:ring-primary/30 ${
                  plan.has_active_opportunity
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-zinc-500/30 bg-zinc-500/10 text-zinc-500"
                }`}
              >
                {plan.has_active_opportunity ? "Active Opportunity" : "No Active Opp."}
              </Badge>
            </button>

            {/* Renewal Date */}
            {plan.renewal_date && (
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400">
                Renewal: {new Date(plan.renewal_date).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
              </Badge>
            )}
          </div>

          <div className="mt-1">
            <h2 className="text-xl font-bold tracking-tight">{company.name}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {[company.industry, company.location].filter(Boolean).join(" · ")}
              {plan.owner_id && " · Owner assigned"}
              {plan.updated_at && ` · Updated ${new Date(plan.updated_at).toLocaleDateString()}`}
            </p>
          </div>
        </div>

        {/* Right: Health + KPIs */}
        <div className="flex items-center gap-4">
          {/* Editable Health Ring */}
          {editingField === "account_health" ? (
            <div className="flex flex-col items-center gap-1">
              <InlineNumberInput
                value={plan.account_health}
                min={0}
                max={100}
                step={1}
                suffix="/100"
                onSave={(v) => updatePlanField("account_health", Math.round(v))}
                onCancel={() => setEditingField(null)}
              />
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Health</span>
            </div>
          ) : (
            <HealthRing score={plan.account_health} onClick={() => setEditingField("account_health")} />
          )}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {/* Editable Current ARR */}
            <EditableKpiPill
              label="Current ARR"
              value={plan.current_arr}
              displayValue={formatCurrency(plan.current_arr)}
              isEditing={editingField === "current_arr"}
              onStartEdit={() => setEditingField("current_arr")}
              onSave={(v) => updatePlanField("current_arr", v)}
              onCancel={() => setEditingField(null)}
              prefix="€"
              step={1000}
            />

            {/* Editable Potential ARR */}
            <EditableKpiPill
              label="Potential"
              value={plan.potential_arr}
              displayValue={formatCurrency(plan.potential_arr)}
              isEditing={editingField === "potential_arr"}
              onStartEdit={() => setEditingField("potential_arr")}
              onSave={(v) => updatePlanField("potential_arr", v)}
              onCancel={() => setEditingField(null)}
              prefix="€"
              step={1000}
            />

            {/* Editable Coverage % */}
            <EditableKpiPill
              label="Coverage"
              value={plan.coverage_pct}
              displayValue={`${plan.coverage_pct}%`}
              isEditing={editingField === "coverage_pct"}
              onStartEdit={() => setEditingField("coverage_pct")}
              onSave={(v) => updatePlanField("coverage_pct", Math.round(v))}
              onCancel={() => setEditingField(null)}
              suffix="%"
              min={0}
              max={100}
              step={1}
            />

            {/* Editable Risk Level */}
            <div className="relative">
              <button
                onClick={() => setEditingField(editingField === "risk_level" ? null : "risk_level")}
                className="w-full"
                title="Click to change risk level"
              >
                <KpiPill
                  label="Risk"
                  value={plan.risk_level}
                  valueClassName={`${riskColors[plan.risk_level]} cursor-pointer`}
                  hoverable
                />
              </button>
              {editingField === "risk_level" && (
                <InlineDropdown
                  value={plan.risk_level}
                  options={riskLevels}
                  onSelect={(v) => updatePlanField("risk_level", v)}
                  onCancel={() => setEditingField(null)}
                />
              )}
            </div>

            {/* Next Event (read-only) */}
            <KpiPill
              label="Next Event"
              value={plan.next_event_days !== null ? `${plan.next_event_days}d` : "--"}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiPill({ label, value, valueClassName, hoverable }: { label: string; value: string; valueClassName?: string; hoverable?: boolean }) {
  return (
    <div className={`flex flex-col items-center rounded-lg border border-border/30 bg-accent/30 px-3 py-1.5 ${hoverable ? "hover:ring-1 hover:ring-primary/30 transition-all cursor-pointer" : ""}`}>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${valueClassName || ""}`}>{value}</span>
    </div>
  )
}

function EditableKpiPill({
  label,
  value,
  displayValue,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  prefix,
  suffix,
  min = 0,
  max,
  step = 1,
}: {
  label: string
  value: number
  displayValue: string
  isEditing: boolean
  onStartEdit: () => void
  onSave: (v: number) => void
  onCancel: () => void
  prefix?: string
  suffix?: string
  min?: number
  max?: number
  step?: number
}) {
  if (isEditing) {
    return (
      <div className="flex flex-col items-center rounded-lg border border-primary/50 bg-accent/30 px-2 py-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{label}</span>
        <InlineNumberInput
          value={value}
          onSave={onSave}
          onCancel={onCancel}
          prefix={prefix}
          suffix={suffix}
          min={min}
          max={max}
          step={step}
        />
      </div>
    )
  }

  return (
    <button onClick={onStartEdit} className="w-full" title={`Click to edit ${label.toLowerCase()}`}>
      <KpiPill label={label} value={displayValue} hoverable />
    </button>
  )
}
