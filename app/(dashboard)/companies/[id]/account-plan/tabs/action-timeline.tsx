"use client"

import { useMemo } from "react"
import type { AccountPlanFull, AccountAction, AccountStakeholder } from "@/lib/types"

interface ActionTimelineTabProps {
  plan: AccountPlanFull
  onUpdate: () => void
}

// Priority colors
const PRIORITY_COLORS: Record<string, { bg: string; hex: string }> = {
  P1: { bg: "bg-red-500/80", hex: "#ef5757" },
  P2: { bg: "bg-amber-500/80", hex: "#f5c048" },
  P3: { bg: "bg-blue-500/80", hex: "#4a8fe0" },
}

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
}

function formatDateDisplay(dateStr: string | null): string {
  if (!dateStr) return "--"
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  })
}

function getDateRange(actions: AccountAction[]) {
  const validDates = actions
    .filter((a) => a.due_date)
    .map((a) => new Date(a.due_date!).getTime())

  if (validDates.length === 0) {
    return { start: new Date(), end: new Date() }
  }

  const minTime = Math.min(...validDates)
  const maxTime = Math.max(...validDates)

  const start = new Date(minTime)
  const end = new Date(maxTime)

  // Add padding: 1 month before and after
  start.setMonth(start.getMonth() - 1)
  end.setMonth(end.getMonth() + 1)

  return { start, end }
}

function getMonthsBetween(start: Date, end: Date): Date[] {
  const months: Date[] = []
  const current = new Date(start.getFullYear(), start.getMonth(), 1)

  while (current <= end) {
    months.push(new Date(current))
    current.setMonth(current.getMonth() + 1)
  }

  return months
}

export function ActionTimelineTab({ plan }: ActionTimelineTabProps) {
  const { actions, stakeholders } = plan

  const timelineData = useMemo(() => {
    if (!actions || actions.length === 0) {
      return null
    }

    // Get date range
    const { start: rangeStart, end: rangeEnd } = getDateRange(actions)
    const months = getMonthsBetween(rangeStart, rangeEnd)

    // Group actions by stakeholder
    const stakeholderActions = new Map<string, AccountAction[]>()
    const stakeholderMap = new Map<string, AccountStakeholder>()

    // Build lookup map
    stakeholders.forEach((s) => {
      stakeholderMap.set(s.id, s)
    })

    // Group actions by linked stakeholder
    actions.forEach((action) => {
      const stakeholderName = action.linked_stakeholder_name || "Unassigned"
      if (!stakeholderActions.has(stakeholderName)) {
        stakeholderActions.set(stakeholderName, [])
      }
      stakeholderActions.get(stakeholderName)!.push(action)
    })

    // Sort stakeholders by first action date
    const sortedStakeholders = Array.from(stakeholderActions.entries()).sort(
      ([, actionsA], [, actionsB]) => {
        const dateA = Math.min(
          ...actionsA
            .filter((a) => a.due_date)
            .map((a) => new Date(a.due_date!).getTime())
        )
        const dateB = Math.min(
          ...actionsB
            .filter((a) => a.due_date)
            .map((a) => new Date(a.due_date!).getTime())
        )
        return dateA - dateB
      }
    )

    return {
      months,
      rangeStart,
      rangeEnd,
      stakeholderActions: sortedStakeholders,
    }
  }, [actions, stakeholders])

  // Calculate KPIs
  const kpis = useMemo(() => {
    if (!actions) return { p1Count: 0, blockedCount: 0, stakeholderCount: 0 }

    const p1Count = actions.filter((a) => a.priority === "P1").length
    const blockedCount = actions.filter(
      (a) => a.status === "Blocked" || (a.description && a.description.toLowerCase().includes("deadline"))
    ).length
    const uniqueStakeholders = new Set(
      actions
        .filter((a) => a.linked_stakeholder_name)
        .map((a) => a.linked_stakeholder_name)
    ).size

    return {
      p1Count,
      blockedCount,
      stakeholderCount: uniqueStakeholders,
    }
  }, [actions])

  if (!timelineData || actions.length === 0) {
    return (
      <div className="flex min-h-96 items-center justify-center rounded-lg border border-border/50 bg-card/30 p-8">
        <p className="text-center text-sm text-muted-foreground">
          No actions yet. Create actions to visualize the timeline.
        </p>
      </div>
    )
  }

  const { months, rangeStart, rangeEnd, stakeholderActions } = timelineData
  const svgWidth = Math.max(900, 100 + months.length * 80)
  const svgHeight = 60 + stakeholderActions.length * 50 + 40

  // Find next critical P1 event
  const nextCriticalP1 = actions
    .filter((a) => a.priority === "P1" && a.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())[0]

  const nextCriticalLabel = nextCriticalP1
    ? formatDateDisplay(nextCriticalP1.due_date)
    : "No critical actions"

  return (
    <div className="flex flex-col gap-6">
      {/* Legend */}
      <div className="rounded-lg border border-border/50 bg-card/50 p-4">
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: PRIORITY_COLORS.P1.hex }} />
            <span className="text-xs text-muted-foreground">P1 Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: PRIORITY_COLORS.P2.hex }} />
            <span className="text-xs text-muted-foreground">P2 Important</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: PRIORITY_COLORS.P3.hex }} />
            <span className="text-xs text-muted-foreground">P3 Development</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full border border-red-500/60" />
            <span className="text-xs text-muted-foreground">External Risk Event</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full border border-emerald-500/60" />
            <span className="text-xs text-muted-foreground">Milestone/Deadline</span>
          </div>
        </div>
      </div>

      {/* SVG Timeline */}
      <div className="overflow-x-auto rounded-lg border border-border/50 bg-card/30 p-4">
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="min-w-full"
        >
          {/* Define gradients */}
          <defs>
            <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(100,100,100,0.1)" />
              <stop offset="100%" stopColor="rgba(100,100,100,0.05)" />
            </linearGradient>
          </defs>

          {/* Month headers */}
          {months.map((month, idx) => {
            const x = 150 + idx * 80
            return (
              <g key={`month-${idx}`}>
                <text
                  x={x}
                  y={25}
                  textAnchor="middle"
                  className="text-xs font-medium"
                  fill="currentColor"
                  opacity="0.7"
                >
                  {getMonthLabel(month)}
                </text>
                <line
                  x1={x}
                  y1={35}
                  x2={x}
                  y2={svgHeight - 20}
                  stroke="currentColor"
                  strokeWidth="1"
                  opacity="0.15"
                  strokeDasharray="4"
                />
              </g>
            )
          })}

          {/* Today marker */}
          {(() => {
            const today = new Date()
            if (today >= rangeStart && today <= rangeEnd) {
              const daysFromStart = Math.floor(
                (today.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
              )
              const dayIndex = daysFromStart / 30 // approximate
              const x = 150 + dayIndex * 80

              return (
                <>
                  <line
                    x1={x}
                    y1={35}
                    x2={x}
                    y2={svgHeight - 20}
                    stroke="#d4af37"
                    strokeWidth="2"
                    strokeDasharray="3,3"
                    opacity="0.6"
                  />
                  <text
                    x={x}
                    y={svgHeight - 5}
                    textAnchor="middle"
                    className="text-xs"
                    fill="#d4af37"
                    opacity="0.7"
                  >
                    Today
                  </text>
                </>
              )
            }
            return null
          })()}

          {/* Stakeholder rows with actions */}
          {stakeholderActions.map(([stakeholderName, stakeholderActionsData], idx) => {
            const y = 50 + idx * 50

            return (
              <g key={`stakeholder-${idx}`}>
                {/* Stakeholder label */}
                <text
                  x={10}
                  y={y + 15}
                  className="text-xs font-medium"
                  fill="currentColor"
                  opacity="0.8"
                  textAnchor="start"
                >
                  {stakeholderName || "Unassigned"}
                </text>

                {/* Row background */}
                <rect
                  x={140}
                  y={y - 8}
                  width={svgWidth - 150}
                  height={35}
                  fill="url(#gridGradient)"
                  opacity="0.5"
                />

                {/* Actions as markers */}
                {stakeholderActionsData.map((action, actionIdx) => {
                  if (!action.due_date) return null

                  const actionDate = new Date(action.due_date)
                  const daysFromStart = Math.floor(
                    (actionDate.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
                  )
                  const dayIndex = daysFromStart / 30
                  const x = 150 + dayIndex * 80

                  const priority = action.priority as keyof typeof PRIORITY_COLORS
                  const color = PRIORITY_COLORS[priority]?.hex || "#4a8fe0"
                  const isExternal = action.is_external_event
                  const isMilestone = action.is_milestone

                  // Determine marker type
                  if (isExternal) {
                    return (
                      <g key={`action-${actionIdx}`}>
                        <circle
                          cx={x}
                          cy={y + 8}
                          r="5"
                          fill="none"
                          stroke={color}
                          strokeWidth="2"
                          opacity="0.8"
                        />
                        <title>{action.title}</title>
                      </g>
                    )
                  }

                  if (isMilestone) {
                    return (
                      <g key={`action-${actionIdx}`}>
                        <circle
                          cx={x}
                          cy={y + 8}
                          r="5"
                          fill="none"
                          stroke="#22c55e"
                          strokeWidth="2"
                          opacity="0.8"
                        />
                        <title>{action.title}</title>
                      </g>
                    )
                  }

                  // Regular action marker (rounded rect)
                  return (
                    <g key={`action-${actionIdx}`}>
                      <rect
                        x={x - 8}
                        y={y + 2}
                        width="16"
                        height="12"
                        rx="2"
                        fill={color}
                        opacity="0.85"
                      />
                      <title>{action.title}</title>
                    </g>
                  )
                })}
              </g>
            )
          })}
        </svg>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* P1 Actions */}
        <div className="rounded-lg border border-border/50 bg-card/50 p-4">
          <div className="text-2xl font-semibold text-red-400">{kpis.p1Count}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            P1 Critical Actions
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Before {nextCriticalLabel}
          </p>
        </div>

        {/* External Deadlines / Blocked */}
        <div className="rounded-lg border border-border/50 bg-card/50 p-4">
          <div className="text-2xl font-semibold text-amber-400">{kpis.blockedCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            External Deadlines
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Blocked or deadline-related
          </p>
        </div>

        {/* Stakeholders Targeted */}
        <div className="rounded-lg border border-border/50 bg-card/50 p-4">
          <div className="text-2xl font-semibold text-blue-400">{kpis.stakeholderCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Stakeholders Targeted
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Linked to actions
          </p>
        </div>
      </div>
    </div>
  )
}
