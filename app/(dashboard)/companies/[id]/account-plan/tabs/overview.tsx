"use client"

import { useState } from "react"
import { ArrowUp, Plus, Trash2, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import type { AccountPlanFull, AccountPlanObjective, AccountPlanSwot } from "@/lib/types"

interface OverviewTabProps {
  plan: AccountPlanFull
  onUpdate: () => void
}

function InlineAddItem({
  planId,
  apiPath,
  bodyExtra,
  placeholder,
  onSaved,
}: {
  planId: string
  apiPath: string
  bodyExtra: Record<string, string | number>
  placeholder: string
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [adding, setAdding] = useState(false)
  const [value, setValue] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleAdd() {
    if (!value.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/account-plans/${planId}/${apiPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: value.trim(), ...bodyExtra }),
      })
      if (res.ok) {
        setValue("")
        setAdding(false)
        toast("Item added")
        onSaved()
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Plus className="h-3 w-3" /> Add item
      </button>
    )
  }

  return (
    <div className="mt-2 flex gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-7 text-xs"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleAdd()
          if (e.key === "Escape") { setAdding(false); setValue("") }
        }}
      />
      <Button size="sm" className="h-7 px-2 text-xs" onClick={handleAdd} disabled={loading}>
        {loading ? "..." : "Add"}
      </Button>
      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => { setAdding(false); setValue("") }}>
        Cancel
      </Button>
    </div>
  )
}

function DeletableItem({
  id,
  table,
  children,
  bulletColor,
  onDeleted,
}: {
  id: string
  table: string
  children: React.ReactNode
  bulletColor: string
  onDeleted: () => void
}) {
  const { toast } = useToast()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await fetch(`/api/account-plans/entity/${id}?table=${table}`, { method: "DELETE" })
      toast("Item removed")
      onDeleted()
    } catch {
      // silently fail
    } finally {
      setDeleting(false)
    }
  }

  return (
    <li className="group flex gap-2 text-sm text-foreground/80">
      <span className={`flex-shrink-0 ${bulletColor}`}>•</span>
      <span className="flex-1">{children}</span>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="flex-shrink-0 rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </li>
  )
}

function EditableIntelligenceField({
  label,
  value,
  fieldKey,
  companyId,
  onUpdate,
}: {
  label: string
  value: string | null
  fieldKey: string
  companyId: string
  onUpdate: () => void
}) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value || "")
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/companies/${companyId}/account-plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [fieldKey]: editValue.trim() || null }),
      })
      if (res.ok) {
        setIsEditing(false)
        onUpdate()
      }
    } catch {
      // silently fail
    } finally {
      setIsSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      setIsEditing(false)
      setEditValue(value || "")
    }
  }

  if (isEditing) {
    return (
      <div className="space-y-2">
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          rows={3}
        />
      </div>
    )
  }

  return (
    <div className="group">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </h4>
        <button
          onClick={() => setIsEditing(true)}
          className="flex-shrink-0 rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition-all"
          title={`Edit ${label}`}
        >
          <Edit2 className="h-3 w-3" />
        </button>
      </div>
      {value ? (
        <p className="text-sm text-foreground/80">{value}</p>
      ) : (
        <p className="text-sm text-muted-foreground">No {label.toLowerCase()} data</p>
      )}
    </div>
  )
}

export function OverviewTab({ plan, onUpdate }: OverviewTabProps) {
  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `€${(val / 1000000).toFixed(1)}M`
    if (val >= 1000) return `€${(val / 1000).toFixed(0)}K`
    return `€${val.toLocaleString()}`
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "No date"
    return new Date(dateStr).toLocaleDateString("en-GB", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const clientPriorities = plan.objectives.filter((o) => o.type === "client_priority")
  const accountObjectives = plan.objectives.filter((o) => o.type === "account_objective")

  const strengths = plan.swot.filter((s) => s.quadrant === "strength")
  const weaknesses = plan.swot.filter((s) => s.quadrant === "weakness")
  const opportunities = plan.swot.filter((s) => s.quadrant === "opportunity")
  const threats = plan.swot.filter((s) => s.quadrant === "threat")

  const stakeholderProgress =
    plan.stakeholders_total > 0
      ? `${plan.stakeholders_mapped} of ${plan.stakeholders_total}`
      : "0 of 0"

  return (
    <div className="space-y-5">
      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Engagement Score */}
        <div className="rounded-xl border border-border/50 bg-card p-5 hover:border-border/80 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Engagement Score
              </span>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-2xl font-bold">{plan.engagement_score}%</span>
                <ArrowUp className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Open Pipeline */}
        <div className="rounded-xl border border-border/50 bg-card p-5 hover:border-border/80 transition-all duration-200">
          <div className="flex flex-col">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Open Pipeline
            </span>
            <span className="mt-2 text-2xl font-bold">
              {formatCurrency(plan.open_pipeline)}
            </span>
          </div>
        </div>

        {/* Stakeholders Mapped */}
        <div className="rounded-xl border border-border/50 bg-card p-5 hover:border-border/80 transition-all duration-200">
          <div className="flex flex-col">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Stakeholders Mapped
            </span>
            <span className="mt-2 text-2xl font-bold">{stakeholderProgress}</span>
          </div>
        </div>

        {/* Next Critical Event */}
        <div className="rounded-xl border border-border/50 bg-card p-5 hover:border-border/80 transition-all duration-200">
          <div className="flex flex-col">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Next Critical Event
            </span>
            <span className="mt-2 text-sm font-semibold">
              {plan.next_critical_event || "No event"}
            </span>
            {plan.next_critical_event_date && (
              <span className="mt-0.5 text-xs text-muted-foreground">
                {formatDate(plan.next_critical_event_date)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Two Columns: Priorities + Objectives */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Client Strategic Priorities */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Client Strategic Priorities
          </h3>
          {clientPriorities.length > 0 ? (
            <div className="space-y-3">
              {clientPriorities.map((obj, idx) => (
                <div key={obj.id} className="group flex gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-border/50 bg-accent/30 text-center">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {idx + 1}
                    </span>
                  </div>
                  <p className="flex-1 text-sm text-foreground/80">{obj.description}</p>
                  <button
                    onClick={async () => {
                      await fetch(`/api/account-plans/entity/${obj.id}?table=account_plan_objectives`, { method: "DELETE" })
                      onUpdate()
                    }}
                    className="flex-shrink-0 rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No client priorities defined</p>
          )}
          <InlineAddItem
            planId={plan.id}
            apiPath="objectives"
            bodyExtra={{ type: "client_priority", position: clientPriorities.length }}
            placeholder="Add a client priority..."
            onSaved={onUpdate}
          />
        </div>

        {/* Account Objectives */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Account Objectives
          </h3>
          {accountObjectives.length > 0 ? (
            <div className="space-y-3">
              {accountObjectives.map((obj) => (
                <div key={obj.id} className="group flex gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-border/50 bg-accent/30">
                    <span className="text-xs text-muted-foreground">★</span>
                  </div>
                  <p className="flex-1 text-sm text-foreground/80">{obj.description}</p>
                  <button
                    onClick={async () => {
                      await fetch(`/api/account-plans/entity/${obj.id}?table=account_plan_objectives`, { method: "DELETE" })
                      onUpdate()
                    }}
                    className="flex-shrink-0 rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No account objectives defined</p>
          )}
          <InlineAddItem
            planId={plan.id}
            apiPath="objectives"
            bodyExtra={{ type: "account_objective", position: accountObjectives.length }}
            placeholder="Add an objective..."
            onSaved={onUpdate}
          />
        </div>
      </div>

      {/* Two Columns: SWOT Grid + Account Intelligence */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* SWOT Grid - 2x2 compact inside single card */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            SWOT — Our Position at Client
          </h3>

          {/* 2x2 SWOT Grid */}
          <div className="grid gap-px grid-cols-2">
            {/* Strengths - Top Left */}
            <div className="bg-blue-950/20 p-4">
              <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                Strengths
              </h4>
              {strengths.length > 0 ? (
                <ul className="space-y-1.5">
                  {strengths.map((item) => (
                    <DeletableItem key={item.id} id={item.id} table="account_plan_swot" bulletColor="text-emerald-400" onDeleted={onUpdate}>
                      {item.description}
                    </DeletableItem>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">None documented</p>
              )}
              <InlineAddItem
                planId={plan.id}
                apiPath="swot"
                bodyExtra={{ quadrant: "strength", position: strengths.length }}
                placeholder="Add strength..."
                onSaved={onUpdate}
              />
            </div>

            {/* Weaknesses - Top Right */}
            <div className="bg-blue-900/20 p-4">
              <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold text-red-400">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                Weaknesses
              </h4>
              {weaknesses.length > 0 ? (
                <ul className="space-y-1.5">
                  {weaknesses.map((item) => (
                    <DeletableItem key={item.id} id={item.id} table="account_plan_swot" bulletColor="text-red-400" onDeleted={onUpdate}>
                      {item.description}
                    </DeletableItem>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">None documented</p>
              )}
              <InlineAddItem
                planId={plan.id}
                apiPath="swot"
                bodyExtra={{ quadrant: "weakness", position: weaknesses.length }}
                placeholder="Add weakness..."
                onSaved={onUpdate}
              />
            </div>

            {/* Opportunities - Bottom Left */}
            <div className="bg-blue-900/20 p-4">
              <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold text-blue-400">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                Opportunities
              </h4>
              {opportunities.length > 0 ? (
                <ul className="space-y-1.5">
                  {opportunities.map((item) => (
                    <DeletableItem key={item.id} id={item.id} table="account_plan_swot" bulletColor="text-blue-400" onDeleted={onUpdate}>
                      {item.description}
                    </DeletableItem>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">None identified</p>
              )}
              <InlineAddItem
                planId={plan.id}
                apiPath="swot"
                bodyExtra={{ quadrant: "opportunity", position: opportunities.length }}
                placeholder="Add opportunity..."
                onSaved={onUpdate}
              />
            </div>

            {/* Threats - Bottom Right */}
            <div className="bg-blue-950/20 p-4">
              <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold text-amber-400">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                Threats
              </h4>
              {threats.length > 0 ? (
                <ul className="space-y-1.5">
                  {threats.map((item) => (
                    <DeletableItem key={item.id} id={item.id} table="account_plan_swot" bulletColor="text-amber-400" onDeleted={onUpdate}>
                      {item.description}
                    </DeletableItem>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">None identified</p>
              )}
              <InlineAddItem
                planId={plan.id}
                apiPath="swot"
                bodyExtra={{ quadrant: "threat", position: threats.length }}
                placeholder="Add threat..."
                onSaved={onUpdate}
              />
            </div>
          </div>
        </div>

        {/* Account Intelligence */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Account Intelligence
          </h3>

          <div className="space-y-4">
            {/* Revenue & Growth */}
            <EditableIntelligenceField
              label="Revenue & Growth"
              value={plan.revenue_and_growth}
              fieldKey="revenue_and_growth"
              companyId={plan.company_id}
              onUpdate={onUpdate}
            />

            {/* Divider */}
            <div className="border-t border-border/30" />

            {/* Buying Dynamics */}
            <EditableIntelligenceField
              label="Buying Dynamics"
              value={plan.buying_dynamics}
              fieldKey="buying_dynamics"
              companyId={plan.company_id}
              onUpdate={onUpdate}
            />

            {/* Divider */}
            <div className="border-t border-border/30" />

            {/* Live Signals */}
            {plan.live_signals && plan.live_signals.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Live Signals
                </h4>
                <div className="flex flex-wrap gap-2">
                  {plan.live_signals.map((signal, idx) => {
                    let tagClasses = "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium"

                    if (signal.startsWith("✓")) {
                      tagClasses += " border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    } else if (signal.startsWith("⚠")) {
                      tagClasses += " border-amber-500/30 bg-amber-500/10 text-amber-300"
                    } else if (signal.startsWith("✗")) {
                      tagClasses += " border-red-500/30 bg-red-500/10 text-red-300"
                    } else {
                      tagClasses += " border-border/50 bg-accent/30 text-foreground/80"
                    }

                    return (
                      <span key={idx} className={tagClasses}>
                        {signal}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
