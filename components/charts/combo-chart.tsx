"use client"

/**
 * Combo chart matching the Sales Manager document figures:
 * - Light blue bars = opportunity revenue
 * - Green line with labels = actual revenue closed
 * - Colored dots = activity count (right axis)
 *
 * Used for team (Figure 2), per-rep (Figure 3), and per-account (Figure 5).
 */

interface MonthData {
  month: string
  activities: number
  opportunity_revenue: number
  actual_revenue: number
}

interface ComboChartProps {
  data: MonthData[]
  dotColor?: string        // "blue" | "amber" | "red" | "green"
  height?: number
  showLabels?: boolean     // show € labels on the revenue line
  showLegend?: boolean
  compact?: boolean        // smaller version for mini cards
}

const DOT_COLORS: Record<string, string> = {
  blue: "#3b82f6",
  amber: "#f59e0b",
  red: "#ef4444",
  green: "#22c55e",
}

function eur(v: number) {
  if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `€${Math.round(v / 1_000)}K`
  return `€${v}`
}

export function ComboChart({
  data,
  dotColor = "blue",
  height = 200,
  showLabels = false,
  showLegend = false,
  compact = false,
}: ComboChartProps) {
  if (data.length === 0) return null

  const maxOpp = Math.max(...data.map((d) => d.opportunity_revenue), 1)
  const maxAct = Math.max(...data.map((d) => d.activities), 1)
  const maxRev = Math.max(...data.map((d) => d.actual_revenue), 1)
  const yMax = Math.max(maxOpp, maxRev) * 1.15 // add headroom

  const padLeft = compact ? 0 : 48
  const padRight = compact ? 0 : 32
  const padTop = 16
  const padBottom = compact ? 20 : 28
  const chartW = 100 // percentage-based
  const dc = DOT_COLORS[dotColor] || DOT_COLORS.blue

  const barWidth = compact ? 60 : 50 // percent of slot
  const slotWidth = (chartW - padLeft - padRight) / data.length

  // Build revenue line path
  const linePoints = data.map((d, i) => {
    const x = padLeft + slotWidth * i + slotWidth / 2
    const y = padTop + ((yMax - d.actual_revenue) / yMax) * (height - padTop - padBottom)
    return { x, y, val: d.actual_revenue }
  })

  const svgWidth = 500
  const svgHeight = height
  const scale = svgWidth / chartW

  return (
    <div>
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full" style={{ height }}>
        {/* Y-axis labels (left) */}
        {!compact && (
          <>
            <text x={padLeft * scale - 6} y={padTop + 4} textAnchor="end" className="fill-muted-foreground" fontSize="9">{eur(yMax)}</text>
            <text x={padLeft * scale - 6} y={svgHeight - padBottom + 4} textAnchor="end" className="fill-muted-foreground" fontSize="9">€0</text>
          </>
        )}

        {/* Horizontal grid lines */}
        <line x1={padLeft * scale} y1={padTop} x2={(chartW - padRight) * scale} y2={padTop} stroke="currentColor" strokeOpacity={0.07} />
        <line x1={padLeft * scale} y1={(svgHeight - padBottom + padTop) / 2} x2={(chartW - padRight) * scale} y2={(svgHeight - padBottom + padTop) / 2} stroke="currentColor" strokeOpacity={0.07} />

        {/* Bars + Dots + Labels */}
        {data.map((d, i) => {
          const slotX = padLeft + slotWidth * i
          const barH = yMax > 0 ? (d.opportunity_revenue / yMax) * (svgHeight - padTop - padBottom) : 0
          const barX = (slotX + slotWidth * (1 - barWidth / 100) / 2) * scale
          const barW = (slotWidth * barWidth / 100) * scale
          const barY = svgHeight - padBottom - barH

          // Activity dot position (scaled to right axis)
          const dotY = padTop + ((maxAct - d.activities) / maxAct) * (svgHeight - padTop - padBottom) * 0.6 + 4

          return (
            <g key={i}>
              {/* Opportunity bar */}
              <rect
                x={barX}
                y={barY}
                width={barW}
                height={Math.max(0, barH)}
                rx={compact ? 1.5 : 2.5}
                fill="#93c5fd"
                fillOpacity={0.35}
              />

              {/* Activity dot */}
              {d.activities > 0 && (
                <circle
                  cx={(slotX + slotWidth / 2) * scale}
                  cy={dotY}
                  r={compact ? 3.5 : 5}
                  fill={dc}
                />
              )}

              {/* Month label */}
              <text
                x={(slotX + slotWidth / 2) * scale}
                y={svgHeight - (compact ? 4 : 8)}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize={compact ? "7" : "9"}
              >
                {compact ? d.month.charAt(0) : d.month}
              </text>
            </g>
          )
        })}

        {/* Revenue line */}
        {linePoints.length > 1 && (
          <polyline
            points={linePoints.map((p) => `${p.x * scale},${p.y}`).join(" ")}
            fill="none"
            stroke="#22c55e"
            strokeWidth={compact ? 1.5 : 2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Revenue dots + labels */}
        {linePoints.map((p, i) => (
          <g key={`rev-${i}`}>
            <circle cx={p.x * scale} cy={p.y} r={compact ? 2 : 3.5} fill="#22c55e" />
            {showLabels && p.val > 0 && (
              <text
                x={p.x * scale}
                y={p.y - 8}
                textAnchor="middle"
                fill="#22c55e"
                fontSize="8"
                fontWeight="600"
              >
                {eur(p.val)}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Legend */}
      {showLegend && (
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dc }} />
            Activities
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-4 rounded-sm bg-blue-300/40" />
            Opportunity revenue
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 bg-emerald-500 rounded-full" />
            Actual revenue
          </div>
        </div>
      )}
    </div>
  )
}
