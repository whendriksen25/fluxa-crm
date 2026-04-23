"use client"

import { useMemo } from "react"
import type { AccountPlanFull } from "@/lib/types"

interface RevenueForecastTabProps {
  plan: AccountPlanFull
  onUpdate: () => void
}

// Fallback demo data — used when database tables haven't been seeded yet
const FALLBACK_DATA = {
  months: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"],
  pipeline: [3800, 4200, 3400, 3800, 4600, 4800, 5200, 4200, 3800, 3200, 2800],
  closed: [0, 0, 1400, 200, 960, 400, 800, 300, 1800, 600, 200],
  activity: [8, 6, 4, 3, 4, 5, 5, 4, 3, 4, 3],
  events: [
    { mi: 2, label: "CTO Architecture Review", col: "#ef5757" },
    { mi: 3, label: "Budget Cycle H2", col: "#f5c048" },
    { mi: 6, label: "Q4 Budget", col: "#f5c048" },
    { mi: 8, label: "Contract Renewal", col: "#28d688" },
    { mi: 9, label: "NIS2 Deadline", col: "#ef5757" },
  ],
}

const FALLBACK_OPPORTUNITIES = [
  { id: "1", name: "Asset Management Platform", business_unit: "Asset Management", value: 1400000, decision_date: "Q3 2025", actions: "CTO review, pilot program", win_probability: 70, status: "In Progress" },
  { id: "2", name: "Grid Analytics Expansion", business_unit: "Grid Ops + Digital", value: 1200000, decision_date: "Q4 2025", actions: "Regional rollout, ROI validation", win_probability: 60, status: "Open" },
  { id: "3", name: "Workforce Management", business_unit: "Operations", value: 960000, decision_date: "Q1 2026", actions: "COO/HR awareness, labor case", win_probability: 45, status: "Open" },
  { id: "4", name: "Cybersecurity (NIS2)", business_unit: "All BUs", value: 800000, decision_date: "Q4 2025", actions: "NIS2 briefing, CISO engagement", win_probability: 35, status: "Hypothesis" },
  { id: "5", name: "Contract Renewal", business_unit: "Grid Operations", value: 1800000, decision_date: "Dec 2025", actions: "Strategic partnership, exec alignment", win_probability: 80, status: "In Progress" },
]

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `€${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `€${(value / 1000).toFixed(0)}K`
  }
  return `€${value}`
}

function getWinProbabilityColor(probability: number): string {
  if (probability >= 65) return "#1fa870" // green
  if (probability >= 40) return "#c07a18" // amber
  return "#2568b8" // blue
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { dot: string; bg: string; text: string }> = {
    "In Progress": {
      dot: "bg-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      text: "text-amber-700 dark:text-amber-300",
    },
    Open: {
      dot: "bg-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      text: "text-blue-700 dark:text-blue-300",
    },
    Hypothesis: {
      dot: "bg-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      text: "text-blue-600 dark:text-blue-400",
    },
  }

  const style = styles[status] || styles.Open

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full ${style.bg} px-2.5 py-1 text-xs font-medium ${style.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </div>
  )
}

interface ChartDataPoint {
  x: number
  barHeight: number
  barY: number
  closedHeight: number
  closedY: number
  closedValue: number
}

interface RevenueChartProps {
  data: typeof FALLBACK_DATA
}

function RevenueChart({ data }: RevenueChartProps) {
  const chartDimensions = useMemo(() => {
    const chartWidth = 1200
    const chartHeight = 380
    const padding = { top: 60, right: 100, bottom: 60, left: 80 }
    const innerWidth = chartWidth - padding.left - padding.right
    const innerHeight = chartHeight - padding.top - padding.bottom

    const maxPipeline = 7000 // €K
    const maxClosed = 2000 // €K
    const maxActivity = 12

    // Scales
    const getRevenuePx = (val: number) => (val / maxPipeline) * innerHeight
    const getClosedPx = (val: number) => (val / maxClosed) * innerHeight
    const getActivityScale = (val: number) => (val / maxActivity) * 10

    const spacing = innerWidth / data.months.length
    const barWidth = spacing * 0.4

    // Pre-compute all data points
    const dataPoints: ChartDataPoint[] = data.months.map((_, idx) => {
      const x = padding.left + spacing * (idx + 0.5)
      const barHeight = getRevenuePx(data.pipeline[idx])
      const barY = chartHeight - padding.bottom - barHeight

      const closedHeight = getClosedPx(data.closed[idx])
      const closedY = chartHeight - padding.bottom - closedHeight

      return {
        x,
        barHeight,
        barY,
        closedHeight,
        closedY,
        closedValue: data.closed[idx],
      }
    })

    return {
      chartWidth,
      chartHeight,
      padding,
      innerWidth,
      innerHeight,
      spacing,
      barWidth,
      maxPipeline,
      maxClosed,
      maxActivity,
      dataPoints,
      getActivityScale,
    }
  }, [data.months, data.pipeline, data.closed])

  const axisLines = useMemo(() => {
    const lines = [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000]
    return lines.map((val) => {
      const y =
        chartDimensions.chartHeight -
        chartDimensions.padding.bottom -
        (val / chartDimensions.maxPipeline) * chartDimensions.innerHeight
      return { val, y }
    })
  }, [chartDimensions])

  return (
    <div
      className="rounded-lg border border-border p-6"
      style={{
        background: "#0f1724",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-8 text-xs">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded"
            style={{
              background: "rgba(74,143,224,0.25)",
              border: "1px solid rgba(74,143,224,0.55)",
            }}
          />
          <span style={{ color: "#8a9bb7" }}>Opportunity pipeline (€K)</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-0.5 w-5"
            style={{
              background: "#28d688",
            }}
          />
          <span style={{ color: "#8a9bb7" }}>Predicted closed revenue (€K)</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-4 w-4 rounded-full flex items-center justify-center"
            style={{
              background: "#4a8fe0",
              color: "white",
              fontSize: "8px",
              fontWeight: "bold",
            }}
          >
            A
          </div>
          <span style={{ color: "#8a9bb7" }}>Actions / activities (right axis)</span>
        </div>
      </div>

      {/* Chart */}
      <svg
        viewBox={`0 0 ${chartDimensions.chartWidth} ${chartDimensions.chartHeight}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full"
        style={{ minHeight: "420px" }}
      >
        <defs>
          {/* Glow effect for activity dots */}
          <filter id="glowActivity" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {axisLines.map(({ val, y }) => (
          <line
            key={`grid-${val}`}
            x1={chartDimensions.padding.left}
            y1={y}
            x2={chartDimensions.chartWidth - chartDimensions.padding.right}
            y2={y}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="2,2"
          />
        ))}

        {/* Y-axis (left) - Revenue */}
        <line
          x1={chartDimensions.padding.left}
          y1={chartDimensions.padding.top}
          x2={chartDimensions.padding.left}
          y2={chartDimensions.chartHeight - chartDimensions.padding.bottom}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
        />

        {/* X-axis */}
        <line
          x1={chartDimensions.padding.left}
          y1={chartDimensions.chartHeight - chartDimensions.padding.bottom}
          x2={chartDimensions.chartWidth - chartDimensions.padding.right}
          y2={chartDimensions.chartHeight - chartDimensions.padding.bottom}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
        />

        {/* Y-axis labels (left - Revenue) */}
        {axisLines.map(({ val, y }) => (
          <text
            key={`y-label-${val}`}
            x={chartDimensions.padding.left - 12}
            y={y}
            textAnchor="end"
            dominantBaseline="middle"
            style={{ fill: "#8a9bb7", fontSize: "12px" }}
          >
            {val === 0 ? "0" : `€${val / 1000}K`}
          </text>
        ))}

        {/* Y-axis label (right - Activity) */}
        {[0, 3, 6, 9, 12].map((val) => {
          const y =
            chartDimensions.chartHeight -
            chartDimensions.padding.bottom -
            (val / 12) * chartDimensions.innerHeight
          return (
            <text
              key={`y-right-${val}`}
              x={chartDimensions.chartWidth - chartDimensions.padding.right + 12}
              y={y}
              textAnchor="start"
              dominantBaseline="middle"
              style={{ fill: "#8a9bb7", fontSize: "12px" }}
            >
              {val}
            </text>
          )
        })}

        {/* Event markers (dashed vertical lines with rotated labels) */}
        {data.events.map((event, idx) => {
          const dataPoint = chartDimensions.dataPoints[event.mi]
          return (
            <g key={`event-${idx}`}>
              {/* Dashed line */}
              <line
                x1={dataPoint.x}
                y1={chartDimensions.padding.top}
                x2={dataPoint.x}
                y2={chartDimensions.chartHeight - chartDimensions.padding.bottom}
                stroke={event.col}
                strokeDasharray="3,3"
                strokeWidth="1"
                opacity="0.5"
              />
              {/* Rotated label above */}
              <text
                x={dataPoint.x}
                y={chartDimensions.padding.top - 8}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fill: event.col,
                  fontSize: "10px",
                  fontWeight: "500",
                }}
                transform={`rotate(-45 ${dataPoint.x} ${chartDimensions.padding.top - 8})`}
              >
                {event.label}
              </text>
            </g>
          )
        })}

        {/* Opportunity bars */}
        {chartDimensions.dataPoints.map((point, idx) => (
          <rect
            key={`bar-${idx}`}
            x={point.x - chartDimensions.barWidth / 2}
            y={point.barY}
            width={chartDimensions.barWidth}
            height={point.barHeight}
            fill="rgba(74,143,224,0.25)"
            stroke="rgba(74,143,224,0.55)"
            strokeWidth="1"
            rx="4"
            ry="4"
          />
        ))}

        {/* Closed revenue line */}
        <polyline
          points={chartDimensions.dataPoints
            .map((point) => `${point.x},${point.closedY}`)
            .join(" ")}
          fill="none"
          stroke="#28d688"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Closed revenue dots on line with labels */}
        {chartDimensions.dataPoints.map((point, idx) => (
          <g key={`closed-dot-${idx}`}>
            {/* Dot */}
            <circle cx={point.x} cy={point.closedY} r="4.5" fill="#28d688" />

            {/* Label above for non-zero values */}
            {point.closedValue > 0 && (
              <text
                x={point.x}
                y={point.closedY - 12}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fill: "#28d688",
                  fontSize: "11px",
                  fontWeight: "600",
                }}
              >
                €{point.closedValue}K
              </text>
            )}
          </g>
        ))}

        {/* Activity dots (right axis) */}
        {chartDimensions.dataPoints.map((point, idx) => {
          const activity = data.activity[idx]
          const activityY =
            chartDimensions.chartHeight -
            chartDimensions.padding.bottom -
            (activity / 12) * chartDimensions.innerHeight
          const dotRadius = 7

          return (
            <g key={`activity-dot-${idx}`}>
              {/* Glow halo */}
              <circle
                cx={point.x}
                cy={activityY}
                r={dotRadius + 3}
                fill="#4a8fe0"
                opacity="0.15"
              />
              {/* Dot */}
              <circle
                cx={point.x}
                cy={activityY}
                r={dotRadius}
                fill="#4a8fe0"
                filter="url(#glowActivity)"
              />
              {/* Count text inside */}
              <text
                x={point.x}
                y={activityY}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fill: "white",
                  fontSize: "10px",
                  fontWeight: "bold",
                }}
              >
                {activity}
              </text>
            </g>
          )
        })}

        {/* X-axis labels (months) */}
        {chartDimensions.dataPoints.map((point, idx) => (
          <text
            key={`x-label-${idx}`}
            x={point.x}
            y={chartDimensions.chartHeight - chartDimensions.padding.bottom + 24}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fill: "#8a9bb7", fontSize: "12px" }}
          >
            {data.months[idx]}
          </text>
        ))}

        {/* Y-axis label text (left) */}
        <text
          x={-chartDimensions.chartHeight / 2}
          y={16}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fill: "#8a9bb7",
            fontSize: "12px",
            fontWeight: "500",
          }}
          transform={`rotate(-90 16 ${chartDimensions.chartHeight / 2})`}
        >
          Revenue (€K)
        </text>

        {/* Y-axis label text (right) */}
        <text
          x={chartDimensions.chartHeight / 2}
          y={chartDimensions.chartWidth - 16}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fill: "#8a9bb7",
            fontSize: "12px",
            fontWeight: "500",
          }}
          transform={`rotate(90 ${chartDimensions.chartWidth - 16} ${chartDimensions.chartHeight / 2})`}
        >
          Activities
        </text>
      </svg>
    </div>
  )
}

interface KPICardsProps {
  data: typeof FALLBACK_DATA
  potentialArr: number
}

function KPICards({ data, potentialArr }: KPICardsProps) {
  const totalClosed = data.closed.reduce((a, b) => a + b, 0)
  const largestClose = Math.max(...data.closed)

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Total Predicted Closed */}
      <div
        className="rounded-lg border p-4"
        style={{
          background: "#0f1724",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <p style={{ color: "#8a9bb7", fontSize: "12px", fontWeight: "500" }}>
          Total Predicted Closed 2025
        </p>
        <p
          style={{
            color: "#28d688",
            fontSize: "28px",
            fontWeight: "700",
            marginTop: "8px",
          }}
        >
          €{(totalClosed / 1000).toFixed(1)}M
        </p>
        <p style={{ color: "#8a9bb7", fontSize: "12px", marginTop: "4px" }}>
          vs €{(potentialArr / 1000000).toFixed(1)}M potential ARR
        </p>
      </div>

      {/* Largest Single Close */}
      <div
        className="rounded-lg border p-4"
        style={{
          background: "#0f1724",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <p style={{ color: "#8a9bb7", fontSize: "12px", fontWeight: "500" }}>
          Largest Single Close
        </p>
        <p
          style={{
            color: "#e8eef6",
            fontSize: "28px",
            fontWeight: "700",
            marginTop: "8px",
          }}
        >
          €{(largestClose / 1000).toFixed(1)}M
        </p>
        <p style={{ color: "#8a9bb7", fontSize: "12px", marginTop: "4px" }}>
          Contract renewal — Dec 2025
        </p>
      </div>

      {/* Activity to Revenue Lag */}
      <div
        className="rounded-lg border p-4"
        style={{
          background: "#0f1724",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <p style={{ color: "#8a9bb7", fontSize: "12px", fontWeight: "500" }}>
          Activity → Revenue Lag
        </p>
        <p
          style={{
            color: "#f5c048",
            fontSize: "28px",
            fontWeight: "700",
            marginTop: "8px",
          }}
        >
          ~6 wks
        </p>
        <p style={{ color: "#8a9bb7", fontSize: "12px", marginTop: "4px" }}>
          May/Jun peak → Jul/Aug closes
        </p>
      </div>
    </div>
  )
}

interface OpportunitiesTableProps {
  opportunities: Array<{ id: string; name: string; business_unit: string | null; value: number; decision_date: string | null; actions: string | null; win_probability: number; status: string }>
}

function OpportunitiesTable({ opportunities }: OpportunitiesTableProps) {
  return (
    <div
      className="overflow-x-auto rounded-lg border"
      style={{
        background: "#0f1724",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <th
              className="px-4 py-3 text-left font-semibold"
              style={{ color: "#e8eef6" }}
            >
              Opportunity
            </th>
            <th
              className="px-4 py-3 text-left font-semibold"
              style={{ color: "#e8eef6" }}
            >
              Business Unit
            </th>
            <th
              className="px-4 py-3 text-right font-semibold"
              style={{ color: "#e8eef6" }}
            >
              Value
            </th>
            <th
              className="px-4 py-3 text-left font-semibold"
              style={{ color: "#e8eef6" }}
            >
              Decision Date
            </th>
            <th
              className="px-4 py-3 text-left font-semibold"
              style={{ color: "#e8eef6" }}
            >
              Key Actions Driving It
            </th>
            <th
              className="px-4 py-3 text-left font-semibold"
              style={{ color: "#e8eef6" }}
            >
              Win Probability
            </th>
            <th
              className="px-4 py-3 text-left font-semibold"
              style={{ color: "#e8eef6" }}
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {opportunities.map((opp) => {
            const probColor = getWinProbabilityColor(opp.win_probability)
            return (
              <tr
                key={opp.id}
                style={{
                  background: "transparent",
                  transition: "background 0.2s",
                }}
                className="hover:bg-white/[0.02]"
              >
                <td className="px-4 py-3 font-medium" style={{ color: "#e8eef6" }}>
                  {opp.name}
                </td>
                <td className="px-4 py-3" style={{ color: "#8a9bb7" }}>
                  {opp.business_unit || "—"}
                </td>
                <td className="px-4 py-3 text-right font-semibold" style={{ color: "#e8eef6" }}>
                  {formatCurrency(opp.value)}
                </td>
                <td className="px-4 py-3" style={{ color: "#8a9bb7" }}>
                  {opp.decision_date || "—"}
                </td>
                <td className="px-4 py-3 text-xs max-w-xs" style={{ color: "#8a9bb7" }}>
                  {opp.actions || "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      style={{
                        width: "64px",
                        height: "6px",
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: "3px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${opp.win_probability}%`,
                          height: "100%",
                          background: probColor,
                          transition: "width 0.3s",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "12px", color: "#8a9bb7" }}>
                      {opp.win_probability}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={opp.status} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function InsightNote() {
  return (
    <div
      className="rounded-lg border p-4"
      style={{
        background: "rgba(245,192,72,0.05)",
        borderColor: "rgba(245,192,72,0.2)",
      }}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#f5c048",
              marginTop: "6px",
            }}
          />
        </div>
        <div className="flex-1">
          <p
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#f5c048",
              marginBottom: "8px",
            }}
          >
            Activity-to-Revenue Lag Pattern
          </p>
          <p style={{ fontSize: "12px", lineHeight: "1.6", color: "#c07a18" }}>
            The ~6-week lag between peak activity (May–Jun) and first major closes (Jul–Aug) mirrors the pattern in
            the CRM reference model. The activity intensity in May is the leading indicator — if key actions complete
            on schedule, the Jul grid decision and Q4 expansion follow. A drop in activity now will show up as a
            revenue shortfall in Q4. Monitor the dots to protect the line.
          </p>
        </div>
      </div>
    </div>
  )
}

export function RevenueForecastTab({ plan, onUpdate }: RevenueForecastTabProps) {
  // Derive chart data from plan or fallback
  const chartData = useMemo(() => {
    const forecasts = plan.revenue_forecasts && plan.revenue_forecasts.length > 0
      ? plan.revenue_forecasts
      : null

    if (forecasts) {
      const sorted = [...forecasts].sort((a, b) => a.month_index - b.month_index)
      return {
        months: sorted.map(f => f.month_label),
        pipeline: sorted.map(f => f.pipeline_value / 1000), // Convert to €K for chart
        closed: sorted.map(f => f.closed_value / 1000),
        activity: sorted.map(f => f.activity_count),
        events: (plan.revenue_events || []).map(e => ({ mi: e.month_index, label: e.label, col: e.color })),
      }
    }
    return FALLBACK_DATA
  }, [plan.revenue_forecasts, plan.revenue_events])

  const opportunities = useMemo(() => {
    if (plan.opportunities && plan.opportunities.length > 0) {
      return plan.opportunities
    }
    return FALLBACK_OPPORTUNITIES
  }, [plan.opportunities])

  return (
    <div
      className="space-y-6"
      style={{
        color: "#e8eef6",
      }}
    >
      {/* KPI Cards */}
      <KPICards data={chartData} potentialArr={plan.potential_arr} />

      {/* Chart */}
      <RevenueChart data={chartData} />

      {/* Opportunities Table */}
      <div>
        <h3 className="mb-3 text-sm font-semibold" style={{ color: "#e8eef6" }}>
          Predicted Opportunity Pipeline
        </h3>
        <OpportunitiesTable opportunities={opportunities} />
      </div>

      {/* Insight Note */}
      <InsightNote />
    </div>
  )
}
