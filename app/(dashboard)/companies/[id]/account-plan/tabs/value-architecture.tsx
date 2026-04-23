'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { Plus, Pencil, Trash2, Gem } from 'lucide-react'
import { AccountPlanFull, AccountValueMap, ValueTheme, ValueStatus } from '@/lib/types'
import { ValueMapDialog } from './value-map-dialog'
import { EmptyState } from './empty-state'

interface ValueTabProps {
  plan: AccountPlanFull
  onUpdate: () => void
}

const themeStyles: Record<ValueTheme, string> = {
  Digital: 'bg-purple-500/20 text-purple-400',
  Cost: 'bg-teal-500/20 text-teal-400',
  Risk: 'bg-red-500/20 text-red-400',
  CX: 'bg-blue-500/20 text-blue-400',
  Growth: 'bg-emerald-500/20 text-emerald-400',
  Other: 'bg-zinc-500/10 text-zinc-500',
}

const statusStyles: Record<ValueStatus, string> = {
  Validated: 'bg-emerald-500/20 text-emerald-400',
  'In Progress': 'bg-amber-500/20 text-amber-400',
  Hypothesis: 'bg-blue-500/20 text-blue-400',
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)
}

export function ValueTab({ plan, onUpdate }: ValueTabProps) {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<AccountValueMap | null>(null)

  const validatedValue = plan.value_map
    .filter((v) => v.status === 'Validated')
    .reduce((sum, v) => sum + v.quantified_impact, 0)

  const uniqueThemes = new Set(plan.value_map.filter((v) => v.theme).map((v) => v.theme)).size
  const validatedThemesSet = new Set(
    plan.value_map.filter((v) => v.status === 'Validated' && v.theme).map((v) => v.theme)
  )
  const validatedThemes = validatedThemesSet.size

  const hypothesisCount = plan.value_map.filter((v) => v.status === 'Hypothesis').length
  const inProgressCount = plan.value_map.filter((v) => v.status === 'In Progress').length
  const validatedCount = plan.value_map.filter((v) => v.status === 'Validated').length

  const totalEntries = plan.value_map.length
  const hypothesisPercent = totalEntries > 0 ? (hypothesisCount / totalEntries) * 100 : 0
  const inProgressPercent = totalEntries > 0 ? (inProgressCount / totalEntries) * 100 : 0
  const validatedPercent = totalEntries > 0 ? (validatedCount / totalEntries) * 100 : 0

  // Calculate ROI Multiple
  const roiMultiple = plan.current_arr && plan.current_arr > 0 ? validatedValue / plan.current_arr : 0

  // Get first hypothesis entry's theme for display
  const firstHypothesis = plan.value_map.find((v) => v.status === 'Hypothesis')
  const hypothesisTheme = firstHypothesis?.theme || 'Next theme'

  function handleAdd() {
    setEditingEntry(null)
    setDialogOpen(true)
  }

  function handleEdit(entry: AccountValueMap) {
    setEditingEntry(entry)
    setDialogOpen(true)
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/account-plans/entity/${id}?table=account_value_map`, { method: 'DELETE' })
      toast("Entry removed")
      onUpdate()
    } catch (error) {
      toast("Failed to delete entry", "error")
    }
  }

  return (
    <div className="space-y-6">
      {/* Value Map Table */}
      <div className="rounded-xl border border-border/50 bg-card p-5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Value Map</h3>
          <Button variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="mr-2 h-3.5 w-3.5" />
            Add Entry
          </Button>
        </div>

        {plan.value_map.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left text-xs font-medium text-muted-foreground pb-3 px-4">
                    Stakeholder
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-3 px-4">
                    Business Pain
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-3 px-4">
                    Theme
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-3 px-4">
                    Our Capability
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-3 px-4">
                    Value Hypothesis
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground pb-3 px-4">
                    Impact
                  </th>
                  <th className="text-center text-xs font-medium text-muted-foreground pb-3 px-4">
                    Status
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground pb-3 px-4 w-20">
                  </th>
                </tr>
              </thead>
              <tbody>
                {plan.value_map.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/20 hover:bg-accent/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                          {getInitials(entry.stakeholder_name || 'N/A')}
                        </div>
                        <span className="text-sm font-medium">{entry.stakeholder_name || '—'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {entry.business_pain || '—'}
                    </td>
                    <td className="py-3 px-4">
                      {entry.theme ? (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${themeStyles[entry.theme]}`}
                        >
                          {entry.theme}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{entry.our_capability || '—'}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {entry.value_hypothesis || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      {formatCurrency(entry.quantified_impact)}
                      {entry.quantified_impact_label && (
                        <div className="text-xs text-muted-foreground">{entry.quantified_impact_label}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusStyles[entry.status]}`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
        ) : (
          <EmptyState
            icon={<Gem className="h-6 w-6" />}
            title="No value map entries yet"
            description="Map stakeholder pain points to your capabilities and quantify the business impact."
            actionLabel="Add Entry"
            onAction={handleAdd}
          />
        )}
      </div>

      {/* Validation Progress Bar */}
      {totalEntries > 0 && (
        <div className="rounded-lg border border-border/30 bg-card/50 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Validation Progress</p>
          <div className="flex gap-1 h-1 rounded-full overflow-hidden bg-border/20">
            {hypothesisPercent > 0 && (
              <div
                className="bg-blue-500/60 transition-all duration-300"
                style={{ width: `${hypothesisPercent}%` }}
                title={`Hypothesis: ${hypothesisCount}`}
              />
            )}
            {inProgressPercent > 0 && (
              <div
                className="bg-amber-500/60 transition-all duration-300"
                style={{ width: `${inProgressPercent}%` }}
                title={`In Progress: ${inProgressCount}`}
              />
            )}
            {validatedPercent > 0 && (
              <div
                className="bg-emerald-500/60 transition-all duration-300"
                style={{ width: `${validatedPercent}%` }}
                title={`Validated: ${validatedCount}`}
              />
            )}
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground mt-2">
            <span>
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500/60 mr-1" />
              Hypothesis
            </span>
            <span>
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500/60 mr-1" />
              In Progress
            </span>
            <span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500/60 mr-1" />
              Validated
            </span>
          </div>
        </div>
      )}

      {/* Summary KPI Cards - 4 Column Grid */}
      <div className="grid grid-cols-4 gap-4">
        {/* 1. Total Validated Value */}
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Total Validated Value</p>
          <p className="text-2xl font-bold text-emerald-400 font-tabular-nums transition-all duration-300 mb-1">
            {formatCurrency(validatedValue)}
          </p>
          <p className="text-xs text-muted-foreground">per year combined</p>
        </div>

        {/* 2. Validated Themes */}
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Validated Themes</p>
          <p className="text-2xl font-bold text-emerald-400 font-tabular-nums transition-all duration-300 mb-1">
            {validatedThemes} / {uniqueThemes}
          </p>
          <p className="text-xs text-muted-foreground">themes confirmed by client</p>
        </div>

        {/* 3. Hypothesis Stage */}
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Hypothesis Stage</p>
          <p className="text-2xl font-bold text-amber-400 font-tabular-nums transition-all duration-300 mb-1">
            {hypothesisCount}
          </p>
          <p className="text-xs text-muted-foreground">{hypothesisTheme} needs validation</p>
        </div>

        {/* 4. ROI Multiple */}
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">ROI Multiple</p>
          <p className="text-2xl font-bold text-amber-300 font-tabular-nums transition-all duration-300 mb-1">
            {roiMultiple.toFixed(1)}×
          </p>
          <p className="text-xs text-muted-foreground">value delivered vs. ARR</p>
        </div>
      </div>

      {/* Dialog */}
      <ValueMapDialog
        planId={plan.id}
        entry={editingEntry}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={onUpdate}
      />
    </div>
  )
}
