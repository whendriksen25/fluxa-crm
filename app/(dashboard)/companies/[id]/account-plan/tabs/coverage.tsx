'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Grid3X3, Info } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { AccountPlanFull, CoverageStatus } from '@/lib/types'
import { EmptyState } from './empty-state'

interface CoverageTabProps {
  plan: AccountPlanFull
  onUpdate: () => void
}

const statusStyles: Record<CoverageStatus, string> = {
  Strong: 'bg-emerald-500/20 text-emerald-400',
  Active: 'bg-blue-500/20 text-blue-400',
  Developing: 'bg-amber-500/20 text-amber-400',
  None: 'bg-zinc-500/10 text-zinc-500',
  Blocked: 'bg-red-500/20 text-red-400',
}

const coverageStatuses: CoverageStatus[] = ['Strong', 'Active', 'Developing', 'None', 'Blocked']

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
  const { toast } = useToast()
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
        toast("Added successfully")
        setValue('')
        setAdding(false)
        onSaved()
      } else {
        toast("Error", "error")
      }
    } catch {
      toast("Error", "error")
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

function CoverageGapsSummary({ plan }: { plan: AccountPlanFull }) {
  // Count BUs with 0% coverage
  const busWithNoCoverage = plan.business_units.filter((bu) => {
    const buCells = plan.coverage_cells.filter((c) => c.business_unit_id === bu.id)
    const covered = buCells.filter((c) => c.coverage_status === 'Strong' || c.coverage_status === 'Active')
    return covered.length === 0
  })

  // Count unmapped roles (roles that have no cells with Strong/Active status across all BUs)
  const unmappedRoles = plan.buying_roles.filter((role) => {
    const roleCells = plan.coverage_cells.filter((c) => c.buying_role_id === role.id)
    const mapped = roleCells.filter((c) => c.coverage_status === 'Strong' || c.coverage_status === 'Active')
    return mapped.length === 0
  })

  // Calculate overall coverage score
  const allCells = plan.coverage_cells.length
  const coveredCells = plan.coverage_cells.filter((c) => c.coverage_status === 'Strong' || c.coverage_status === 'Active').length
  const coverageScore = allCells > 0 ? Math.round((coveredCells / allCells) * 100) : 0

  if (busWithNoCoverage.length === 0 && unmappedRoles.length === 0) {
    return null
  }

  const gaps: string[] = []
  if (busWithNoCoverage.length > 0) {
    gaps.push(`zero contacts in ${busWithNoCoverage.map((bu) => bu.name).join(', ')}`)
  }
  if (unmappedRoles.length > 0) {
    gaps.push(`unmapped ${unmappedRoles.map((r) => r.name).join(', ')} roles`)
  }

  const summary = gaps.length > 0 ? `Priority: map contacts in ${gaps.join('; ')}.` : 'On track.'

  return (
    <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
      <p className="text-sm text-amber-300">
        <span className="font-medium">Coverage score {coverageScore}%</span> — {summary}
      </p>
    </div>
  )
}

function ImmediateGaps({ plan }: { plan: AccountPlanFull }) {
  const gaps = plan.coverage_cells.filter((c) => c.coverage_status === 'None' || c.coverage_status === 'Blocked')

  if (gaps.length === 0) {
    return null
  }

  const buMap = new Map(plan.business_units.map((bu) => [bu.id, bu.name]))
  const roleMap = new Map(plan.buying_roles.map((r) => [r.id, r.name]))

  return (
    <div className="rounded-lg border border-border/30 bg-card p-4">
      <h4 className="text-sm font-semibold mb-3">Immediate Gaps</h4>
      <div className="space-y-1">
        {gaps.slice(0, 5).map((gap, idx) => (
          <div
            key={gap.id}
            className={`text-xs text-muted-foreground py-2 ${idx < gaps.length - 1 ? 'border-b border-border/20' : ''}`}
          >
            → {buMap.get(gap.business_unit_id)} + {roleMap.get(gap.buying_role_id)}
          </div>
        ))}
        {gaps.length > 5 && (
          <div className="text-xs text-muted-foreground py-2">
            + {gaps.length - 5} more gap{gaps.length - 5 !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}

function BuyingCentreCompleteness({ plan }: { plan: AccountPlanFull }) {
  const totalBUs = plan.business_units.length

  // Decision-makers: Economic Buyer or Champion with Strong/Active
  const decisionMakerRoles = plan.buying_roles
    .filter((r) => r.name.toLowerCase().includes('economic buyer') || r.name.toLowerCase().includes('champion'))
    .map((r) => r.id)

  const decisionMakerCells = plan.coverage_cells.filter(
    (c) => decisionMakerRoles.includes(c.buying_role_id) && (c.coverage_status === 'Strong' || c.coverage_status === 'Active')
  )
  const uniqueBUsWithDecisionMaker = new Set(decisionMakerCells.map((c) => c.business_unit_id)).size
  const decisionMakerScore = totalBUs > 0 ? Math.round((uniqueBUsWithDecisionMaker / totalBUs) * 100) : 0

  // Influencers: Tech Evaluator or End User
  const influencerRoles = plan.buying_roles
    .filter((r) => r.name.toLowerCase().includes('evaluator') || r.name.toLowerCase().includes('end user'))
    .map((r) => r.id)

  const influencerCells = plan.coverage_cells.filter(
    (c) => influencerRoles.includes(c.buying_role_id) && (c.coverage_status === 'Strong' || c.coverage_status === 'Active')
  )
  const influencerScore = totalBUs > 0 ? Math.round((influencerCells.length / totalBUs) * 100) : 0

  // BUs covered: any BU with at least one Strong/Active cell
  const busCovered = new Set(
    plan.coverage_cells
      .filter((c) => c.coverage_status === 'Strong' || c.coverage_status === 'Active')
      .map((c) => c.business_unit_id)
  ).size
  const busCoveredScore = totalBUs > 0 ? Math.round((busCovered / totalBUs) * 100) : 0

  const getBarColor = (score: number) => {
    if (score > 70) return 'bg-emerald-500/40'
    if (score > 40) return 'bg-amber-500/40'
    return 'bg-red-500/40'
  }

  return (
    <div className="rounded-lg border border-border/30 bg-card p-4">
      <h4 className="text-sm font-semibold mb-4">Buying Centre Completeness</h4>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-medium text-muted-foreground">Decision-makers</span>
            <span className="text-xs text-muted-foreground">{uniqueBUsWithDecisionMaker}/{totalBUs}</span>
          </div>
          <div className="w-full h-2 rounded bg-zinc-700/50 overflow-hidden">
            <div
              className={`h-full ${getBarColor(decisionMakerScore)} transition-all`}
              style={{ width: `${decisionMakerScore}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-medium text-muted-foreground">Influencers</span>
            <span className="text-xs text-muted-foreground">{influencerCells.length}/{totalBUs}</span>
          </div>
          <div className="w-full h-2 rounded bg-zinc-700/50 overflow-hidden">
            <div
              className={`h-full ${getBarColor(influencerScore)} transition-all`}
              style={{ width: `${influencerScore}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-medium text-muted-foreground">BUs Covered</span>
            <span className="text-xs text-muted-foreground">{busCovered}/{totalBUs}</span>
          </div>
          <div className="w-full h-2 rounded bg-zinc-700/50 overflow-hidden">
            <div
              className={`h-full ${getBarColor(busCoveredScore)} transition-all`}
              style={{ width: `${busCoveredScore}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function SingleThreadingRisk({ plan }: { plan: AccountPlanFull }) {
  const singleThreadedBUs = plan.business_units.filter((bu) => {
    const strongActiveCells = plan.coverage_cells.filter(
      (c) => c.business_unit_id === bu.id && (c.coverage_status === 'Strong' || c.coverage_status === 'Active')
    )
    return strongActiveCells.length === 1
  })

  if (singleThreadedBUs.length === 0) {
    return null
  }

  const riskMessage =
    singleThreadedBUs.length === 1
      ? `${singleThreadedBUs[0].name} has only one key contact. If they leave, you lose your relationship.`
      : `${singleThreadedBUs.length} business units are single-threaded. Build redundancy in your contacts.`

  return (
    <div className="rounded-lg border border-border/30 bg-card p-4">
      <h4 className="text-sm font-semibold mb-3">Single-Threading Risk</h4>
      <p className="text-sm text-muted-foreground">{riskMessage}</p>
    </div>
  )
}

export function CoverageTab({ plan, onUpdate }: CoverageTabProps) {
  const { toast } = useToast()

  async function handleDeleteUnit(id: string) {
    try {
      const res = await fetch(`/api/account-plans/entity/${id}?table=account_business_units`, { method: 'DELETE' })
      if (res.ok) {
        toast("Business unit deleted")
        onUpdate()
      } else {
        toast("Error", "error")
      }
    } catch {
      toast("Error", "error")
    }
  }

  async function handleDeleteRole(id: string) {
    try {
      const res = await fetch(`/api/account-plans/entity/${id}?table=account_buying_roles`, { method: 'DELETE' })
      if (res.ok) {
        toast("Buying role deleted")
        onUpdate()
      } else {
        toast("Error", "error")
      }
    } catch {
      toast("Error", "error")
    }
  }

  async function handleCellClick(unitId: string, roleId: string) {
    const existingCell = plan.coverage_cells.find(
      (c) => c.business_unit_id === unitId && c.buying_role_id === roleId
    )

    if (existingCell) {
      // Cycle through statuses
      const currentIdx = coverageStatuses.indexOf(existingCell.coverage_status)
      const nextStatus = coverageStatuses[(currentIdx + 1) % coverageStatuses.length]
      try {
        const res = await fetch(`/api/account-plans/entity/${existingCell.id}?table=account_coverage_cells`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coverage_status: nextStatus }),
        })
        if (res.ok) {
          toast("Status updated")
          onUpdate()
        } else {
          toast("Error", "error")
        }
      } catch {
        toast("Error", "error")
      }
    } else {
      // Create new cell
      try {
        const res = await fetch(`/api/account-plans/${plan.id}/coverage-cells`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            business_unit_id: unitId,
            buying_role_id: roleId,
            coverage_status: 'None',
          }),
        })
        if (res.ok) {
          toast("Coverage created")
          onUpdate()
        } else {
          toast("Error", "error")
        }
      } catch {
        toast("Error", "error")
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Coverage Gaps Summary */}
      <CoverageGapsSummary plan={plan} />

      {/* Setup area: add business units and buying roles */}
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
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Buying Roles</h4>
            <InlineAddName planId={plan.id} apiPath="buying-roles" placeholder="Role name" onSaved={onUpdate} />
          </div>
          {plan.buying_roles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {plan.buying_roles.map((role) => (
                <div key={role.id} className="group flex items-center gap-1 rounded-lg border border-border/30 bg-accent/20 px-2 py-1">
                  <span className="text-xs font-medium">{role.name}</span>
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-muted-foreground hover:text-red-400 transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No buying roles yet</p>
          )}
        </div>
      </div>

      {/* Coverage Heatmap */}
      {plan.business_units.length > 0 && plan.buying_roles.length > 0 ? (
        <>
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Coverage Heatmap</h3>
          </div>

          {/* Styled tip badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-2">
            <Info className="h-4 w-4 text-blue-400" />
            <p className="text-xs text-blue-300">Click any cell to cycle through statuses</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">
                    Buying Role
                  </th>
                  {plan.business_units.map((unit) => (
                    <th
                      key={unit.id}
                      className="text-center text-xs font-medium text-muted-foreground pb-3 px-2"
                    >
                      {unit.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plan.buying_roles.map((role) => (
                  <tr key={role.id} className="border-t border-border/30">
                    <td className="text-sm font-medium py-4 pr-4">{role.name}</td>
                    {plan.business_units.map((unit) => {
                      const cell = plan.coverage_cells.find(
                        (c) => c.business_unit_id === unit.id && c.buying_role_id === role.id
                      )

                      return (
                        <td key={`${unit.id}-${role.id}`} className="text-center py-4 px-2">
                          <button
                            onClick={() => handleCellClick(unit.id, role.id)}
                            className="transition-all duration-200 hover:scale-105 active:scale-95"
                          >
                            {cell ? (
                              <div
                                className={`inline-flex flex-col items-center justify-center min-w-[90px] min-h-[48px] rounded-lg px-3 py-2 text-xs font-medium cursor-pointer transition-all duration-200 ${statusStyles[cell.coverage_status]}`}
                              >
                                <span>{cell.coverage_status}</span>
                                {cell.contact_name && (
                                  <span className="text-xs opacity-75 mt-1">{cell.contact_name}</span>
                                )}
                              </div>
                            ) : (
                              <div className="min-w-[90px] min-h-[48px] flex items-center justify-center rounded-lg text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors duration-200">—</div>
                            )}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}

                {/* Coverage Summary Row */}
                <tr className="border-t border-border/50 bg-accent/30">
                  <td className="text-xs font-semibold text-muted-foreground py-3 pr-4">Covered</td>
                  {plan.business_units.map((unit) => {
                    const unitCells = plan.coverage_cells.filter((c) => c.business_unit_id === unit.id)
                    const covered = unitCells.filter((c) => c.coverage_status === 'Strong' || c.coverage_status === 'Active').length
                    const total = unitCells.length || plan.buying_roles.length
                    return (
                      <td key={unit.id} className="text-center py-3 px-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {covered}/{total}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-3">
            {coverageStatuses.map((status) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={`h-3 w-3 rounded ${statusStyles[status]}`} />
                <span className="text-xs text-muted-foreground">{status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Analysis Panels */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ImmediateGaps plan={plan} />
          <BuyingCentreCompleteness plan={plan} />
          <SingleThreadingRisk plan={plan} />
        </div>
        </>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <EmptyState
            icon={<Grid3X3 className="h-6 w-6" />}
            title="No coverage data yet"
            description="Add business units and buying roles above to build your coverage heatmap."
          />
        </div>
      )}
    </div>
  )
}
