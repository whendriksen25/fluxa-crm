'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'
import { AccountPlanFull, PenetrationStatus } from '@/lib/types'

interface WhitespaceTabProps {
  plan: AccountPlanFull
  onUpdate: () => void
}

const penetrationStyles: Record<PenetrationStatus, string> = {
  Active: 'bg-emerald-500/20 text-emerald-400',
  Exploring: 'bg-amber-500/20 text-amber-400',
  Whitespace: 'bg-zinc-500/10 text-zinc-500',
  'Competitor-held': 'bg-red-500/20 text-red-400',
  Blocked: 'bg-zinc-700/30 text-zinc-500',
}

const penetrationStatuses: PenetrationStatus[] = ['Active', 'Exploring', 'Whitespace', 'Competitor-held', 'Blocked']

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

function getPenetrationLabel(
  status: PenetrationStatus,
  competitorName: string | null | undefined
): string {
  if (status === 'Competitor-held' && competitorName) {
    return competitorName
  }
  return status
}

function InlineAddName({
  planId,
  apiPath,
  placeholder,
  onSaved,
}: {
  planId: string
  apiPath: string
  placeholder: string
  onSaved: () => void
}) {
  const [adding, setAdding] = useState(false)
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAdd() {
    if (!value.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/account-plans/${planId}/${apiPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: value.trim(), position: 0 }),
      })
      if (res.ok) {
        setValue('')
        setAdding(false)
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
      <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
        <Plus className="mr-2 h-3.5 w-3.5" />
        Add
      </Button>
    )
  }

  return (
    <div className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-7 text-xs w-40"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleAdd()
          if (e.key === 'Escape') { setAdding(false); setValue('') }
        }}
      />
      <Button size="sm" className="h-7 px-2 text-xs" onClick={handleAdd} disabled={loading}>
        {loading ? '...' : 'Add'}
      </Button>
      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => { setAdding(false); setValue('') }}>
        Cancel
      </Button>
    </div>
  )
}

export function WhitespaceTab({ plan, onUpdate }: WhitespaceTabProps) {
  const totalWhitespaceRevenue = plan.whitespace_cells
    .filter((cell) => cell.penetration_status === 'Whitespace')
    .reduce((sum, cell) => sum + cell.revenue_potential, 0)

  // Calculate whitespace revenue by BU
  const whitespaceCells = plan.whitespace_cells.filter((cell) => cell.penetration_status === 'Whitespace')
  const revenueByBU = new Map<string, number>()
  plan.business_units.forEach((bu) => {
    const total = whitespaceCells
      .filter((cell) => cell.business_unit_id === bu.id)
      .reduce((sum, cell) => sum + cell.revenue_potential, 0)
    if (total > 0) {
      revenueByBU.set(bu.name, total)
    }
  })

  // Find BU with highest whitespace potential
  let topBU = ''
  let topRevenue = 0
  revenueByBU.forEach((revenue, buName) => {
    if (revenue > topRevenue) {
      topRevenue = revenue
      topBU = buName
    }
  })

  // Get top 3 whitespace opportunities
  const topWhitespaceOpportunities = whitespaceCells
    .map((cell) => ({
      cell,
      solution: plan.solutions.find((s) => s.id === cell.solution_id),
      bu: plan.business_units.find((b) => b.id === cell.business_unit_id),
    }))
    .filter((item) => item.solution && item.bu)
    .sort((a, b) => b.cell.revenue_potential - a.cell.revenue_potential)
    .slice(0, 3)

  // Get competitor-held cells
  const competitorCells = plan.whitespace_cells.filter((cell) => cell.penetration_status === 'Competitor-held')

  async function handleDeleteSolution(id: string) {
    if (!confirm('Delete this solution?')) return
    try {
      await fetch(`/api/account-plans/entity/${id}?table=account_solutions`, { method: 'DELETE' })
      onUpdate()
    } catch {
      // silently fail
    }
  }

  async function handleDeleteUnit(id: string) {
    if (!confirm('Delete this business unit?')) return
    try {
      await fetch(`/api/account-plans/entity/${id}?table=account_business_units`, { method: 'DELETE' })
      onUpdate()
    } catch {
      // silently fail
    }
  }

  async function handleCellClick(unitId: string, solutionId: string) {
    const existingCell = plan.whitespace_cells.find(
      (c) => c.business_unit_id === unitId && c.solution_id === solutionId
    )

    if (existingCell) {
      const currentIdx = penetrationStatuses.indexOf(existingCell.penetration_status)
      const nextStatus = penetrationStatuses[(currentIdx + 1) % penetrationStatuses.length]
      try {
        await fetch(`/api/account-plans/entity/${existingCell.id}?table=account_whitespace_cells`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ penetration_status: nextStatus }),
        })
        onUpdate()
      } catch {
        // silently fail
      }
    } else {
      try {
        await fetch(`/api/account-plans/${plan.id}/whitespace-cells`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            business_unit_id: unitId,
            solution_id: solutionId,
            penetration_status: 'Whitespace',
            revenue_potential: 0,
          }),
        })
        onUpdate()
      } catch {
        // silently fail
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Note Box - Whitespace Summary */}
      {totalWhitespaceRevenue > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-300">
          <p className="font-medium">
            Whitespace opportunity: {formatCurrency(totalWhitespaceRevenue)} ARR identified
            {topBU && ` in ${topBU}`}
          </p>
        </div>
      )}

      {/* Setup area */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Business Units</h4>
            <InlineAddName planId={plan.id} apiPath="business-units" placeholder="Unit name" onSaved={onUpdate} />
          </div>
          {plan.business_units.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {plan.business_units.map((unit) => (
                <div key={unit.id} className="group flex items-center gap-1 rounded-lg border border-border/30 bg-accent/20 px-2 py-1">
                  <span className="text-xs font-medium">{unit.name}</span>
                  <button
                    onClick={() => handleDeleteUnit(unit.id)}
                    className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-muted-foreground hover:text-red-400 transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No business units yet</p>
          )}
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Solutions</h4>
            <InlineAddName planId={plan.id} apiPath="solutions" placeholder="Solution name" onSaved={onUpdate} />
          </div>
          {plan.solutions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {plan.solutions.map((solution) => (
                <div key={solution.id} className="group flex items-center gap-1 rounded-lg border border-border/30 bg-accent/20 px-2 py-1">
                  <span className="text-xs font-medium">{solution.name}</span>
                  <button
                    onClick={() => handleDeleteSolution(solution.id)}
                    className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-muted-foreground hover:text-red-400 transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No solutions yet</p>
          )}
        </div>
      </div>

      {/* Whitespace Analysis Table */}
      {plan.business_units.length > 0 && plan.solutions.length > 0 ? (
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h3 className="text-lg font-semibold mb-2">Whitespace Analysis</h3>
          <p className="text-xs text-muted-foreground mb-6">Click a cell to cycle through penetration statuses</p>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">
                    Business Unit
                  </th>
                  {plan.solutions.map((solution) => (
                    <th
                      key={solution.id}
                      className="text-center text-xs font-medium text-muted-foreground pb-3 px-2"
                    >
                      {solution.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plan.business_units.map((unit) => (
                  <tr key={unit.id} className="border-t border-border/30">
                    <td className="text-sm font-medium py-4 pr-4">{unit.name}</td>
                    {plan.solutions.map((solution) => {
                      const cell = plan.whitespace_cells.find(
                        (c) => c.business_unit_id === unit.id && c.solution_id === solution.id
                      )

                      return (
                        <td key={`${unit.id}-${solution.id}`} className="text-center py-4 px-2">
                          <button
                            onClick={() => handleCellClick(unit.id, solution.id)}
                            className="transition-all hover:scale-105"
                          >
                            {cell ? (
                              <div className="flex flex-col items-center gap-1">
                                <div
                                  className={`inline-flex flex-col items-center justify-center rounded px-3 py-2 text-xs font-medium cursor-pointer ${penetrationStyles[cell.penetration_status]}`}
                                >
                                  {getPenetrationLabel(cell.penetration_status, cell.competitor_name)}
                                </div>
                                {cell.revenue_potential > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatCurrency(cell.revenue_potential)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">—</div>
                            )}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3">
            {penetrationStatuses.map((status) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={`h-3 w-3 rounded ${penetrationStyles[status]}`} />
                <span className="text-xs text-muted-foreground">{status}</span>
              </div>
            ))}
          </div>

          {/* Three Analysis Panels */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            {/* Panel 1: Top Whitespace Priorities */}
            <div className="rounded-lg border border-border/30 bg-accent/5 p-4">
              <h4 className="text-sm font-semibold mb-4">Top Whitespace Priorities</h4>
              {topWhitespaceOpportunities.length > 0 ? (
                <div className="space-y-3">
                  {topWhitespaceOpportunities.map((item, idx) => (
                    <div key={`${item.cell.id}-${idx}`}>
                      <div className="flex items-start gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold">
                            {item.solution?.name} in {item.bu?.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatCurrency(item.cell.revenue_potential)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No whitespace opportunities identified</p>
              )}
            </div>

            {/* Panel 2: Competitor-Held Territories */}
            <div className="rounded-lg border border-border/30 bg-accent/5 p-4">
              <h4 className="text-sm font-semibold mb-4">Competitor-Held Territories</h4>
              {competitorCells.length > 0 ? (
                <div className="space-y-3">
                  {competitorCells.map((cell) => {
                    const solution = plan.solutions.find((s) => s.id === cell.solution_id)
                    const bu = plan.business_units.find((b) => b.id === cell.business_unit_id)
                    return (
                      <div key={cell.id} className="flex items-start gap-2">
                        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium flex-shrink-0 mt-0.5">
                          {cell.competitor_name || 'Competitor'}
                        </span>
                        <p className="text-xs flex-1">
                          {solution?.name} in {bu?.name}
                        </p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No competitor-held territories identified</p>
              )}
            </div>

            {/* Panel 3: Whitespace Revenue Potential by BU */}
            <div className="rounded-lg border border-border/30 bg-accent/5 p-4">
              <h4 className="text-sm font-semibold mb-4">Whitespace Revenue Potential</h4>
              {revenueByBU.size > 0 ? (
                <div className="space-y-2">
                  {Array.from(revenueByBU.entries()).map(([buName, revenue]) => (
                    <div key={buName} className="flex items-center justify-between">
                      <p className="text-xs">{buName}</p>
                      <p className="text-xs font-mono text-amber-300">{formatCurrency(revenue)}</p>
                    </div>
                  ))}
                  <div className="border-t border-border/20 my-2 pt-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold">Total Whitespace ARR</p>
                      <p className="text-xs font-mono text-emerald-400 font-semibold">{formatCurrency(totalWhitespaceRevenue)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No whitespace revenue identified</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <p className="text-center text-sm text-muted-foreground py-8">
            Add business units and solutions above to create a whitespace analysis.
          </p>
        </div>
      )}

      {/* Total Whitespace Revenue */}
      <div className="rounded-xl border border-border/50 bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Total Whitespace Revenue Opportunity
            </p>
            <p className="text-3xl font-bold text-emerald-400">
              {formatCurrency(totalWhitespaceRevenue)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
