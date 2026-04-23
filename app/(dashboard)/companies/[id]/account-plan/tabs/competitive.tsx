'use client'

import { useMemo } from 'react'
import type { AccountPlanFull } from '@/lib/types'

interface CompetitiveTabProps {
  plan: AccountPlanFull
  onUpdate: () => void
}

// Color palette
const colors = {
  bg: '#0b1120',
  card: '#0f1724',
  card2: '#141e30',
  green: '#1fa870',
  green2: '#28d688',
  blue: '#2568b8',
  blue2: '#4a8fe0',
  amber: '#c07a18',
  amber2: '#e8991f',
  amber3: '#f5c048',
  red: '#c43838',
  red2: '#ef5757',
  coral: '#a03428',
  coral2: '#c86050',
  gold2: '#f5c048',
  text: '#e8eef6',
  text2: '#8a9bb7',
  text3: '#4a5f80',
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) return `€${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `€${(amount / 1000).toFixed(0)}K`
  return `€${amount.toFixed(0)}`
}

// Account Health Ring (64x64 SVG)
function AccountHealthRing({ value = 71 }: { value?: number }) {
  const max = 100
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - value / max)

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="80" height="80" viewBox="0 0 80 80">
        {/* Background ring */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={colors.text3}
          strokeWidth="3"
        />
        {/* Progress ring */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={colors.amber2}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '40px 40px' }}
        />
      </svg>
      <div className="text-center">
        <p className="text-2xl font-bold" style={{ color: colors.text }}>
          {value}
        </p>
        <p className="text-xs" style={{ color: colors.text2 }}>
          Account Health
        </p>
      </div>
    </div>
  )
}

// KPI Card Components
function CurrentArrCard({ current = 1800000, potential = 5400000 }: { current?: number; potential?: number }) {
  const progress = (current / potential) * 100

  return (
    <div className="rounded-lg border p-4" style={{ borderColor: colors.text3, backgroundColor: colors.card }}>
      <p className="text-xs" style={{ color: colors.text2 }}>
        Current ARR
      </p>
      <p className="text-2xl font-bold mt-2" style={{ color: colors.text }}>
        {formatCurrency(current)}
      </p>
      <p className="text-xs mt-1" style={{ color: colors.text2 }}>
        Grid Operations baseline
      </p>
      <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.text3 }}>
        <div
          className="h-full transition-all"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(to right, ${colors.blue}, ${colors.blue2})`,
          }}
        />
      </div>
      <p className="text-xs mt-2" style={{ color: colors.text2 }}>
        {progress.toFixed(0)}% of {formatCurrency(potential)} potential
      </p>
    </div>
  )
}

function PredictedClosedCard({ closed = 6200000, potential = 5400000 }: { closed?: number; potential?: number }) {

  return (
    <div className="rounded-lg border p-4" style={{ borderColor: colors.text3, backgroundColor: colors.card }}>
      <p className="text-xs" style={{ color: colors.text2 }}>
        Predicted Closed 2025
      </p>
      <p className="text-2xl font-bold mt-2" style={{ color: colors.green2 }}>
        {formatCurrency(closed)}
      </p>
      <p className="text-xs mt-1" style={{ color: colors.text2 }}>
        incl. renewal + expansion
      </p>
      <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.green }}>
        <div className="h-full w-full" style={{ backgroundColor: colors.green2 }} />
      </div>
      <p className="text-xs mt-2" style={{ color: colors.text2 }}>
        vs {formatCurrency(potential)} potential ARR
      </p>
    </div>
  )
}

function OpportunityPipelineCard({ opportunities }: { opportunities: Array<{ value: number }> }) {
  const total = opportunities.reduce((sum, o) => sum + o.value, 0)
  const maxValue = opportunities.length > 0 ? Math.max(...opportunities.map((o) => o.value)) : 0

  return (
    <div className="rounded-lg border p-4" style={{ borderColor: colors.text3, backgroundColor: colors.card }}>
      <p className="text-xs" style={{ color: colors.text2 }}>
        Opportunity Pipeline
      </p>
      <p className="text-2xl font-bold mt-2" style={{ color: colors.text }}>
        {formatCurrency(total)}
      </p>
      <p className="text-xs mt-1" style={{ color: colors.text2 }}>
        5 active opportunities
      </p>
      <div className="flex items-end gap-1 h-10 mt-3">
        {opportunities.map((opp, idx) => (
          <div
            key={idx}
            className="flex-1 rounded-sm transition-all"
            style={{
              height: `${(opp.value / maxValue) * 100}%`,
              background: `linear-gradient(to top, ${colors.amber2}, ${colors.blue2})`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function RevenueAtRiskCard({ atRisk = 1200000, breakdown }: { atRisk?: number; breakdown?: Array<{ name: string; value: number; color: string }> }) {
  const defaultBreakdown = [
    { name: 'IBM Maximo (Asset Mgmt)', value: 860000, color: colors.red2 },
    { name: 'Siemens (Grid Analytics)', value: 340000, color: colors.amber2 },
  ]
  const displayBreakdown = breakdown || defaultBreakdown

  return (
    <div
      className="rounded-lg border p-4"
      style={{
        borderColor: colors.red,
        backgroundColor: colors.card,
      }}
    >
      <p className="text-xs" style={{ color: colors.text2 }}>
        Revenue at Risk
      </p>
      <p className="text-2xl font-bold mt-2" style={{ color: colors.red2 }}>
        {formatCurrency(atRisk)}
      </p>
      <p className="text-xs mt-1" style={{ color: colors.text2 }}>
        IBM Maximo + Siemens exposure
      </p>
      <div className="mt-3 space-y-2">
        {displayBreakdown.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs">
            <span style={{ color: colors.text2 }}>{item.name}</span>
            <span style={{ color: item.color, fontWeight: 600 }}>
              {formatCurrency(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BlendedWinProbabilityCard({ probability = 58 }: { probability?: number }) {
  const gaugeWidth = probability

  return (
    <div
      className="rounded-lg border p-4"
      style={{
        borderColor: colors.green,
        backgroundColor: colors.card,
      }}
    >
      <p className="text-xs" style={{ color: colors.text2 }}>
        Blended Win Probability
      </p>
      <p className="text-2xl font-bold mt-2" style={{ color: colors.green2 }}>
        {probability}%
      </p>
      <p className="text-xs mt-1" style={{ color: colors.text2 }}>
        weighted avg.
      </p>
      <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.text3 }}>
        <div
          className="h-full transition-all"
          style={{
            width: `${gaugeWidth}%`,
            background: `linear-gradient(to right, ${colors.red2}, ${colors.amber2}, ${colors.green2})`,
          }}
        />
      </div>
      <div className="flex justify-between text-xs mt-2" style={{ color: colors.text2 }}>
        <span>0%</span>
        <span>{probability}%</span>
        <span>100%</span>
      </div>
    </div>
  )
}

// Opportunity Breakdown Table
function OpportunityBreakdown({
  opportunities,
}: {
  opportunities: Array<{
    name: string
    value: number
    win_probability: number
    competitor_risk: string | null
    risk_percentage: number
  }>
}) {
  // Transform API data to display format
  const defaultOpportunities = [
    {
      name: 'Asset Management Platform',
      value: 1400000,
      winPct: 70,
      riskPct: 20,
      riskLabel: 'IBM risk',
      riskColor: colors.red2,
    },
    {
      name: 'Grid Analytics Expansion',
      value: 1200000,
      winPct: 60,
      riskPct: 10,
      riskLabel: 'Siemens watch',
      riskColor: colors.amber2,
    },
    {
      name: 'Workforce Management',
      value: 960000,
      winPct: 45,
      riskPct: 15,
      riskLabel: 'internal overlap',
      riskColor: colors.amber2,
    },
    {
      name: 'Cybersecurity (NIS2)',
      value: 800000,
      winPct: 35,
      riskPct: 12,
      riskLabel: 'vendor overlap',
      riskColor: colors.blue2,
    },
    {
      name: 'Contract Renewal',
      value: 1800000,
      winPct: 80,
      riskPct: 14,
      riskLabel: 'IBM renewal bid',
      riskColor: colors.red2,
    },
  ]

  // Use API data if available, fallback to defaults
  const displayOpportunities = opportunities && opportunities.length > 0
    ? opportunities.map((opp) => ({
        name: opp.name,
        value: opp.value,
        winPct: opp.win_probability,
        riskPct: opp.risk_percentage,
        riskLabel: opp.competitor_risk || 'Risk',
        riskColor: opp.competitor_risk ? (opp.competitor_risk.toLowerCase().includes('ibm') ? colors.red2 : colors.amber2) : colors.blue2,
      }))
    : defaultOpportunities

  const total = displayOpportunities.reduce((sum, o) => sum + o.value, 0)

  return (
    <div className="rounded-lg border p-6 space-y-4" style={{ borderColor: colors.text3, backgroundColor: colors.card }}>
      <h3 className="text-sm font-semibold" style={{ color: colors.text }}>
        Predicted Revenue by Opportunity — with Competitive Risk
      </h3>

      <div className="space-y-3">
        {displayOpportunities.map((opp, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-4 items-center text-xs">
            {/* Name */}
            <div className="col-span-3">
              <p style={{ color: colors.text }}>{opp.name}</p>
            </div>

            {/* Bar chart with risk overlay */}
            <div className="col-span-4">
              <div className="h-5 rounded-sm overflow-hidden relative" style={{ backgroundColor: colors.text3 }}>
                {/* Blue bar (won portion) */}
                <div
                  className="absolute inset-y-0 left-0 h-full"
                  style={{
                    width: `${((opp.value / total) * (opp.winPct / 100)) * 100}%`,
                    backgroundColor: colors.blue,
                  }}
                />
                {/* Risk overlay on top of won portion */}
                <div
                  className="absolute inset-y-0 left-0 h-full opacity-70"
                  style={{
                    width: `${((opp.value / total) * (opp.winPct / 100)) * 100}%`,
                    background: `linear-gradient(to right, ${opp.riskColor}, transparent)`,
                  }}
                />
              </div>
            </div>

            {/* Value */}
            <div className="col-span-2 text-right">
              <p style={{ color: colors.text, fontWeight: 600 }}>{formatCurrency(opp.value)}</p>
            </div>

            {/* Win% + Risk */}
            <div className="col-span-3 text-right">
              <p style={{ color: colors.green2 }}>
                {opp.winPct}% win
              </p>
              <p style={{ color: colors.text2, fontSize: '0.7rem' }}>{opp.riskLabel}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Totals row */}
      <div className="mt-4 pt-4 border-t" style={{ borderColor: colors.text3 }}>
        <div className="grid grid-cols-12 gap-4 items-center text-xs">
          <div className="col-span-3">
            <p style={{ color: colors.text, fontWeight: 600 }}>Total Pipeline</p>
          </div>
          <div className="col-span-4">
            <div className="h-2 rounded-full" style={{
              background: `linear-gradient(to right, ${colors.green2}, ${colors.amber2}, ${colors.red2})`,
            }} />
          </div>
          <div className="col-span-2 text-right">
            <p style={{ color: colors.text, fontWeight: 600 }}>{formatCurrency(total)}</p>
          </div>
          <div className="col-span-3 text-right">
            <p style={{ color: colors.green2, fontWeight: 600 }}>blended 58% win</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Competitive Battle Map SVG
function CompetitiveBattleMap({
  stakeholders,
  competitors,
}: {
  stakeholders: Array<{ name: string; title: string | null; stance: string; role_type?: string | null }>
  competitors: Array<{ name: string; threat_level: string; threat_score: number }>
}) {
  // Default stakeholder positions
  const defaultStakeholders = [
    { name: 'Rutger van der Leeuw', title: 'CEO', stance: 'supporter', y: 60 },
    { name: 'Jeroen Sanders', title: 'CTO', stance: 'champion', y: 120 },
    { name: 'Han Slootweg', title: 'COO', stance: 'neutral', y: 180 },
    { name: 'Mariëlle Vogt', title: 'CFO', stance: 'risk', y: 240 },
    { name: 'Tom van Beek', title: 'AI CoE', stance: 'supporter', y: 300 },
    { name: 'Erik Janssen', title: 'IT Dir', stance: 'champion', y: 360 },
    { name: 'Pieter de Groot', title: 'Grid Planning', stance: 'neutral', y: 420 },
  ]

  const defaultCompetitors = [
    { name: 'IBM Maximo', x: 620, y: 150, threat: 'high', color: colors.red2 },
    { name: 'McKinsey', x: 620, y: 250, threat: 'advisory', color: colors.coral },
    { name: 'Siemens', x: 620, y: 350, threat: 'medium', color: colors.amber2 },
    { name: 'SAP', x: 620, y: 420, threat: 'low', color: colors.text3 },
  ]

  // Map API stakeholders to display format with positions
  const displayStakeholders = stakeholders && stakeholders.length > 0
    ? stakeholders.map((s, idx) => ({
        ...s,
        stance: s.stance.toLowerCase(),
        y: 60 + idx * 60,
      }))
    : defaultStakeholders

  // Map API competitors to display format with positions
  const displayCompetitors = competitors && competitors.length > 0
    ? competitors.map((c, idx) => {
        const threatToColor: Record<string, string> = {
          'High Threat': colors.red2,
          'Medium Threat': colors.amber2,
          'Monitor': colors.text3,
          'Low Threat': colors.text3,
        }
        return {
          name: c.name,
          x: 620,
          y: 150 + idx * 85,
          threat: c.threat_level.toLowerCase().replace(' threat', '').replace('monitor', 'low'),
          color: threatToColor[c.threat_level] || colors.text3,
        }
      })
    : defaultCompetitors

  const getStanceColor = (stance: string) => {
    switch (stance) {
      case 'champion':
        return colors.green2
      case 'supporter':
        return colors.green
      case 'neutral':
        return colors.amber2
      case 'risk':
        return colors.red2
      default:
        return colors.text2
    }
  }

  return (
    <div className="rounded-lg border p-6 space-y-4" style={{ borderColor: colors.text3, backgroundColor: colors.card }}>
      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5" style={{ backgroundColor: colors.green2 }} />
          <span style={{ color: colors.text2 }}>Our strong</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 border-t-2 border-dashed" style={{ borderColor: colors.amber2 }} />
          <span style={{ color: colors.text2 }}>Our developing</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5" style={{ backgroundColor: colors.red2 }} />
          <span style={{ color: colors.text2 }}>Competitor threat</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 border-t-2 border-dashed" style={{ borderColor: colors.coral }} />
          <span style={{ color: colors.text2 }}>Advisory risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 border-t-2 border-dashed" style={{ borderColor: colors.blue2 }} />
          <span style={{ color: colors.text2 }}>Advisory ally</span>
        </div>
      </div>

      {/* SVG Network */}
      <svg viewBox="0 0 750 480" className="w-full" style={{ maxHeight: '520px' }}>
        {/* Vertical dividers */}
        <line x1="140" y1="0" x2="140" y2="480" stroke={colors.text3} strokeWidth="1" opacity="0.3" />
        <line x1="530" y1="0" x2="530" y2="480" stroke={colors.text3} strokeWidth="1" opacity="0.3" />

        {/* Column labels */}
        <text x="70" y="20" fontSize="11" fontWeight="600" fill={colors.text2}>
          OUR SIDE
        </text>
        <text x="280" y="20" fontSize="11" fontWeight="600" fill={colors.text2}>
          STAKEHOLDERS
        </text>
        <text x="580" y="20" fontSize="11" fontWeight="600" fill={colors.text2}>
          COMPETITORS
        </text>

        {/* Our nodes - left side */}
        <circle cx="70" cy="120" r="20" fill={colors.blue} />
        <text x="70" y="125" fontSize="9" fontWeight="600" fill={colors.text} textAnchor="middle">
          Our
        </text>
        <text x="70" y="135" fontSize="8" fill={colors.text} textAnchor="middle">
          Platform
        </text>

        <circle cx="70" cy="280" r="16" fill={colors.text3} opacity="0.6" />
        <text x="70" y="285" fontSize="8" fontWeight="600" fill={colors.text} textAnchor="middle">
          Deloitte
        </text>

        {/* Stakeholder nodes - center */}
        {displayStakeholders.map((stakeholder, idx) => (
          <g key={idx}>
            <circle cx="280" cy={stakeholder.y} r="14" fill={getStanceColor(stakeholder.stance)} />
            <text x="280" y={stakeholder.y + 4} fontSize="8" fill={colors.bg} textAnchor="middle" fontWeight="600">
              {stakeholder.name.split(' ')[0].charAt(0)}
            </text>
          </g>
        ))}

        {/* Competitor nodes - right side */}
        {displayCompetitors.map((comp, idx) => (
          <circle key={idx} cx={comp.x} cy={comp.y} r="16" fill={comp.color} opacity="0.8" />
        ))}
        {displayCompetitors.map((comp, idx) => (
          <text
            key={`text-${idx}`}
            x={comp.x}
            y={comp.y + 4}
            fontSize="7"
            fontWeight="600"
            fill={colors.bg}
            textAnchor="middle"
          >
            {comp.name.split(' ')[0].charAt(0)}
          </text>
        ))}

        {/* Lines from Our Platform to key stakeholders */}
        {[0, 1, 2, 4, 5].map((idx) => (
          displayStakeholders[idx] && (
            <line
              key={`our-line-${idx}`}
              x1="90"
              y1="120"
              x2="266"
              y2={displayStakeholders[idx].y}
              stroke={colors.green2}
              strokeWidth="2"
              opacity="0.7"
            />
          )
        ))}

        {/* Lines from Deloitte to stakeholders (dashed - developing relationship) */}
        {displayStakeholders[1] && (
          <line
            x1="86"
            y1="280"
            x2="266"
            y2={displayStakeholders[1].y}
            stroke={colors.blue2}
            strokeWidth="2"
            strokeDasharray="4,3"
            opacity="0.6"
          />
        )}

        {/* Competitor threat lines (solid) */}
        {/* IBM to CEO, CFO */}
        {displayStakeholders[0] && displayCompetitors[0] && (
          <line
            x1={displayCompetitors[0].x - 16}
            y1={displayCompetitors[0].y}
            x2="294"
            y2={displayStakeholders[0].y}
            stroke={displayCompetitors[0].color}
            strokeWidth="2"
            opacity="0.6"
          />
        )}
        {displayStakeholders[3] && displayCompetitors[0] && (
          <line
            x1={displayCompetitors[0].x - 16}
            y1={displayCompetitors[0].y}
            x2="294"
            y2={displayStakeholders[3].y}
            stroke={displayCompetitors[0].color}
            strokeWidth="2"
            opacity="0.6"
          />
        )}

        {/* Siemens to COO, Grid Planning */}
        {displayStakeholders[2] && displayCompetitors[2] && (
          <line
            x1={displayCompetitors[2].x - 16}
            y1={displayCompetitors[2].y}
            x2="294"
            y2={displayStakeholders[2].y}
            stroke={displayCompetitors[2].color}
            strokeWidth="2"
            opacity="0.5"
          />
        )}
        {displayStakeholders[6] && displayCompetitors[2] && (
          <line
            x1={displayCompetitors[2].x - 16}
            y1={displayCompetitors[2].y}
            x2="294"
            y2={displayStakeholders[6].y}
            stroke={displayCompetitors[2].color}
            strokeWidth="2"
            opacity="0.5"
          />
        )}

        {/* McKinsey advisory risk (coral dashed) */}
        {displayStakeholders[3] && displayCompetitors[1] && (
          <line
            x1={displayCompetitors[1].x - 16}
            y1={displayCompetitors[1].y}
            x2="294"
            y2={displayStakeholders[3].y}
            stroke={displayCompetitors[1].color}
            strokeWidth="1.5"
            strokeDasharray="4,3"
            opacity="0.5"
          />
        )}
      </svg>
    </div>
  )
}

// Pipeline at Risk vs Protected Chart
function PipelineAtRiskChart({
  pipelineRiskData,
}: {
  pipelineRiskData: Array<{
    month_label: string
    month_index: number
    pipeline_value: number
    at_risk_value: number
    counter_actions: number
    net_win_value: number
  }>
}) {
  // Default data
  const defaultData = {
    months: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
    pipeline: [3800, 4200, 3400, 3800, 4600, 4800, 5200, 4200, 3800, 3200, 2800],
    atRisk: [1000, 1200, 700, 500, 600, 700, 900, 600, 1000, 350, 250],
    actions: [7, 5, 3, 2, 3, 4, 4, 3, 3, 3, 2],
    netWin: [0, 0, 1400, 200, 960, 400, 800, 300, 1800, 600, 200],
    events: [
      { mi: 2, label: 'CTO decision (vs IBM)', col: colors.red2 },
      { mi: 3, label: 'Budget cycle H2', col: colors.amber2 },
      { mi: 8, label: 'Renewal battle', col: colors.amber2 },
    ],
  }

  // Use API data if available, converting euros to €K by dividing by 1000
  const data = pipelineRiskData && pipelineRiskData.length > 0
    ? {
        months: pipelineRiskData.map((d) => d.month_label),
        pipeline: pipelineRiskData.map((d) => d.pipeline_value / 1000),
        atRisk: pipelineRiskData.map((d) => d.at_risk_value / 1000),
        actions: pipelineRiskData.map((d) => d.counter_actions),
        netWin: pipelineRiskData.map((d) => d.net_win_value / 1000),
        events: defaultData.events,
      }
    : defaultData

  const maxPipeline = Math.max(...data.pipeline)
  const barWidth = 100 / data.months.length
  const chartHeight = 300
  const chartPadding = 40

  return (
    <div className="rounded-lg border p-6 space-y-4" style={{ borderColor: colors.text3, backgroundColor: colors.card }}>
      <h3 className="text-sm font-semibold" style={{ color: colors.text }}>
        Pipeline at Risk vs Protected
      </h3>

      <svg viewBox={`0 0 1000 ${chartHeight}`} className="w-full">
        {/* Y-axis labels */}
        {[0, 25, 50, 75, 100].map((pct) => (
          <g key={`yaxis-${pct}`}>
            <line
              x1={chartPadding}
              y1={chartHeight - (chartHeight - chartPadding * 2) * (pct / 100)}
              x2="1000"
              y2={chartHeight - (chartHeight - chartPadding * 2) * (pct / 100)}
              stroke={colors.text3}
              strokeWidth="0.5"
              opacity="0.3"
            />
            <text
              x={chartPadding - 10}
              y={chartHeight - (chartHeight - chartPadding * 2) * (pct / 100) + 4}
              fontSize="9"
              fill={colors.text2}
              textAnchor="end"
            >
              €{(maxPipeline * (pct / 100)).toFixed(0)}K
            </text>
          </g>
        ))}

        {/* Bars */}
        {data.months.map((month, idx) => {
          const x = chartPadding + (idx * (1000 - chartPadding * 2)) / data.months.length
          const barW = ((1000 - chartPadding * 2) / data.months.length) * 0.7
          const total = data.pipeline[idx]
          const risk = data.atRisk[idx]
          const protected_ = total - risk

          const protectedHeight = (protected_ / maxPipeline) * (chartHeight - chartPadding * 2)
          const riskHeight = (risk / maxPipeline) * (chartHeight - chartPadding * 2)

          return (
            <g key={`bar-${idx}`}>
              {/* Protected (blue) */}
              <rect
                x={x - barW / 2}
                y={chartHeight - chartPadding - protectedHeight}
                width={barW}
                height={protectedHeight}
                fill={colors.blue}
                opacity="0.8"
              />
              {/* At Risk (red) on top */}
              <rect
                x={x - barW / 2}
                y={chartHeight - chartPadding - protectedHeight - riskHeight}
                width={barW}
                height={riskHeight}
                fill={colors.red2}
                opacity="0.8"
              />

              {/* Net win indicator (green line) */}
              {data.netWin[idx] > 0 && (
                <line
                  x1={x}
                  y1={chartHeight - chartPadding - (data.netWin[idx] / maxPipeline) * (chartHeight - chartPadding * 2) - 3}
                  x2={x}
                  y2={chartHeight - chartPadding - (data.netWin[idx] / maxPipeline) * (chartHeight - chartPadding * 2) + 3}
                  stroke={colors.green2}
                  strokeWidth="3"
                />
              )}

              {/* Actions dot (right axis) */}
              <circle
                cx={x + barW}
                cy={chartHeight - chartPadding - (data.actions[idx] / 7) * (chartHeight - chartPadding * 2)}
                r="2.5"
                fill={colors.blue2}
                opacity="0.7"
              />

              {/* Month label */}
              <text
                x={x}
                y={chartHeight - 10}
                fontSize="9"
                fill={colors.text2}
                textAnchor="middle"
              >
                {month}
              </text>
            </g>
          )
        })}

        {/* Event markers */}
        {data.events.map((event, idx) => {
          const x = chartPadding + (event.mi * (1000 - chartPadding * 2)) / data.months.length
          return (
            <g key={`event-${idx}`}>
              <line x1={x} y1="20" x2={x} y2="50" stroke={event.col} strokeWidth="2" opacity="0.6" />
              <circle cx={x} cy="22" r="3" fill={event.col} opacity="0.8" />
              <text x={x} y="15" fontSize="8" fill={event.col} textAnchor="middle" fontWeight="600">
                {event.label}
              </text>
            </g>
          )
        })}

        {/* Legend */}
        <g>
          <rect x="chartPadding" y={chartHeight - 25} width="8" height="8" fill={colors.blue} />
          <text x={chartPadding + 12} y={chartHeight - 18} fontSize="9" fill={colors.text2}>
            Protected
          </text>

          <rect x={chartPadding + 100} y={chartHeight - 25} width="8" height="8" fill={colors.red2} />
          <text x={chartPadding + 112} y={chartHeight - 18} fontSize="9" fill={colors.text2}>
            At Risk
          </text>

          <line x1={chartPadding + 200} y1={chartHeight - 21} x2={chartPadding + 210} y2={chartHeight - 21} stroke={colors.green2} strokeWidth="2" />
          <text x={chartPadding + 215} y={chartHeight - 18} fontSize="9" fill={colors.text2}>
            Net Win
          </text>
        </g>
      </svg>
    </div>
  )
}

// Competitive Landscape Cards
function CompetitorCard({
  name,
  type,
  badge,
  threat,
  color,
  strengths,
  counterPlay,
}: {
  name: string
  type: string
  badge: string
  threat: number
  color: string
  strengths: string[]
  counterPlay: string
}) {
  return (
    <div className="rounded-lg border p-5 space-y-4" style={{ borderColor: colors.text3, backgroundColor: colors.card }}>
      <div>
        <h4 className="font-semibold text-sm" style={{ color: colors.text }}>
          {name}
        </h4>
        <p className="text-xs mt-1" style={{ color: colors.text2 }}>
          {type}
        </p>
      </div>

      <div>
        <span
          className="inline-block px-2.5 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: `${color}20`,
            color,
          }}
        >
          {badge}
        </span>
      </div>

      <div>
        <div className="flex justify-between text-xs mb-2">
          <span style={{ color: colors.text2 }}>Threat Score</span>
          <span style={{ color, fontWeight: 600 }}>{threat}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.text3 }}>
          <div className="h-full" style={{ width: `${threat}%`, backgroundColor: color }} />
        </div>
      </div>

      {strengths.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: colors.text }}>
            Strengths
          </p>
          <ul className="space-y-1.5">
            {strengths.map((strength, idx) => (
              <li key={idx} className="text-xs flex gap-2" style={{ color: colors.text2 }}>
                <span style={{ color: colors.text3 }}>•</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div
        className="rounded-lg border p-3 space-y-1"
        style={{
          backgroundColor: `${colors.green}15`,
          borderColor: `${colors.green}40`,
        }}
      >
        <p className="text-xs font-semibold" style={{ color: colors.green2 }}>
          Counter-Play
        </p>
        <p className="text-xs" style={{ color: colors.green }}>
          {counterPlay}
        </p>
      </div>
    </div>
  )
}

// Advisor Allegiance Cards
function AdvisorCard({
  name,
  firm,
  allegiance,
  badge,
  badgeColor,
  context,
  description,
  score,
  actionNote,
}: {
  name: string
  firm: string
  allegiance: string
  badge: string
  badgeColor: string
  context: string
  description: string
  score: number
  actionNote: string
}) {
  const initials = name
    .split(' ')
    .map((p) => p.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)

  return (
    <div className="rounded-lg border p-5 space-y-4" style={{ borderColor: colors.text3, backgroundColor: colors.card }}>
      <div className="flex gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xs font-semibold border flex-shrink-0"
          style={{
            backgroundColor: `${badgeColor}20`,
            borderColor: `${badgeColor}40`,
            color: badgeColor,
          }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: colors.text }}>
            {name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: colors.text2 }}>
            {firm}
          </p>
          <p className="text-xs mt-1" style={{ color: colors.text2 }}>
            {context}
          </p>
        </div>
      </div>

      <div>
        <span
          className="inline-block px-2.5 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: `${badgeColor}20`,
            color: badgeColor,
          }}
        >
          {badge}
        </span>
      </div>

      {description && (
        <p className="text-xs leading-relaxed" style={{ color: colors.text2 }}>
          {description}
        </p>
      )}

      <div>
        <div className="flex justify-between text-xs mb-2">
          <span style={{ color: colors.text2 }}>Allegiance</span>
          <span style={{ color: colors.text2, fontWeight: 600 }}>{score}%</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden relative" style={{ backgroundColor: colors.text3 }}>
          <div
            className="h-full"
            style={{
              width: `${score}%`,
              background:
                score < 33
                  ? `linear-gradient(to right, ${colors.green2}, ${colors.green})`
                  : score < 66
                    ? `linear-gradient(to right, ${colors.amber2}, ${colors.amber})`
                    : `linear-gradient(to right, ${colors.red2}, ${colors.red})`,
            }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-all"
            style={{
              left: `${score}%`,
              marginLeft: '-0.5rem',
              borderColor: colors.card,
              backgroundColor: 'currentColor',
            }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1" style={{ color: colors.text3 }}>
          <span>Partner</span>
          <span>Independent</span>
          <span>Competitor</span>
        </div>
      </div>

      {actionNote && (
        <div
          className="rounded-lg border p-3 space-y-1"
          style={{
            backgroundColor: score > 50 ? `${colors.red}15` : `${colors.green}15`,
            borderColor: score > 50 ? `${colors.red}40` : `${colors.green}40`,
          }}
        >
          <p
            className="text-xs"
            style={{
              color: score > 50 ? colors.red2 : colors.green2,
            }}
          >
            {actionNote}
          </p>
        </div>
      )}
    </div>
  )
}

export function CompetitiveTab({ plan, onUpdate }: CompetitiveTabProps) {
  // Memoize computed KPI data from plan or use defaults
  const kpiData = useMemo(() => {
    // Calculate blended win probability from opportunities
    const blendedWin = plan.opportunities && plan.opportunities.length > 0
      ? Math.round(
          plan.opportunities.reduce((sum, o) => sum + o.win_probability, 0) / plan.opportunities.length
        )
      : 58

    // Calculate total opportunity value
    const opportunityTotal = plan.opportunities && plan.opportunities.length > 0
      ? plan.opportunities.reduce((sum, o) => sum + o.value, 0)
      : 6160000

    // Calculate revenue at risk from opportunities
    const revenueAtRisk = plan.opportunities && plan.opportunities.length > 0
      ? plan.opportunities.reduce((sum, o) => sum + (o.value * o.risk_percentage) / 100, 0)
      : 1200000

    return {
      accountHealth: plan.account_health ?? 71,
      currentArr: plan.current_arr ?? 1800000,
      potentialArr: plan.potential_arr ?? 5400000,
      predictedClosed: (plan.current_arr ?? 1800000) + (plan.potential_arr ?? 5400000) * 0.3, // estimated
      opportunityTotal,
      revenueAtRisk,
      blendedWin,
    }
  }, [plan])

  // Memoize opportunity data for breakdown
  const displayOpportunities = useMemo(
    () =>
      plan.opportunities && plan.opportunities.length > 0
        ? plan.opportunities.map((opp) => ({
            value: opp.value,
          }))
        : [
            { value: 1400000 },
            { value: 1200000 },
            { value: 960000 },
            { value: 800000 },
            { value: 1800000 },
          ],
    [plan.opportunities]
  )

  // Memoize revenue at risk breakdown
  const revenueAtRiskBreakdown = useMemo(
    () =>
      plan.opportunities && plan.opportunities.length > 0
        ? plan.opportunities
            .filter((o) => o.risk_percentage > 0)
            .map((o) => ({
              name: o.name,
              value: (o.value * o.risk_percentage) / 100,
              color: o.competitor_risk?.toLowerCase().includes('ibm') ? colors.red2 : colors.amber2,
            }))
        : [
            { name: 'IBM Maximo (Asset Mgmt)', value: 860000, color: colors.red2 },
            { name: 'Siemens (Grid Analytics)', value: 340000, color: colors.amber2 },
          ],
    [plan.opportunities]
  )

  return (
    <div className="space-y-6 pb-12">
      {/* KPI Strip - 6 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div style={{ backgroundColor: colors.card, borderColor: colors.text3 }} className="rounded-lg border p-4">
          <AccountHealthRing value={kpiData.accountHealth} />
        </div>
        <CurrentArrCard current={kpiData.currentArr} potential={kpiData.potentialArr} />
        <PredictedClosedCard closed={kpiData.predictedClosed} potential={kpiData.potentialArr} />
        <OpportunityPipelineCard opportunities={displayOpportunities} />
        <RevenueAtRiskCard atRisk={kpiData.revenueAtRisk} breakdown={revenueAtRiskBreakdown} />
        <BlendedWinProbabilityCard probability={kpiData.blendedWin} />
      </div>

      {/* Opportunity Breakdown */}
      <OpportunityBreakdown opportunities={plan.opportunities} />

      {/* Two-column section: Battle Map + Pipeline Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CompetitiveBattleMap
          stakeholders={plan.stakeholders}
          competitors={plan.competitors}
        />
        <PipelineAtRiskChart pipelineRiskData={plan.pipeline_risk} />
      </div>

      {/* Competitive Landscape */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold" style={{ color: colors.text }}>
          Competitive Landscape
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plan.competitors && plan.competitors.length > 0 ? (
            plan.competitors.map((comp) => {
              const threatToColor: Record<string, string> = {
                'High Threat': colors.red2,
                'Medium Threat': colors.amber2,
                'Monitor': colors.text3,
                'Low Threat': colors.text3,
              }
              return (
                <CompetitorCard
                  key={comp.id}
                  name={comp.name}
                  type={comp.competitor_type || 'Competitor'}
                  badge={comp.threat_level}
                  threat={comp.threat_score}
                  color={threatToColor[comp.threat_level] || colors.text3}
                  strengths={comp.strengths || []}
                  counterPlay={comp.counter_play || 'Monitor and assess.'}
                />
              )
            })
          ) : (
            <>
              <CompetitorCard
                name="IBM Maximo"
                type="Incumbent — Asset Management BU"
                badge="High Threat"
                threat={80}
                color={colors.red2}
                strengths={[
                  'Established incumbent in asset management for energy utilities',
                  'Deep integration with Enexis SCADA and legacy systems',
                  'Renewal cycle approaching — CEO engagement risk',
                ]}
                counterPlay="Position on modern API-first architecture, cloud migration timeline, and faster deployment. Offer joint pilot on Grid Operations subset."
              />
              <CompetitorCard
                name="Siemens"
                type="New entrant — Grid Analytics"
                badge="Medium Threat"
                threat={55}
                color={colors.amber2}
                strengths={[
                  'Strong foothold in grid-edge hardware and analytics',
                  'Recent partnership with grid modernization team',
                  'Aggressive pricing and bundled solutions approach',
                ]}
                counterPlay="Emphasise proven ROI from pilot, reference customer outcomes, and offer managed services model. Position analytics as complement not replacement."
              />
              <CompetitorCard
                name="SAP"
                type="Emerging — Enterprise ERP"
                badge="Monitor"
                threat={25}
                color={colors.text3}
                strengths={[
                  'Enterprise-wide procurement discussions',
                  'Bundled ERP + analytics positioning',
                  'IT team receptive to consolidation',
                ]}
                counterPlay="Monitor procurement cycles and CFO conversations. Differentiate on analytics, workforce management, and operational agility vs. ERP heavy lifting."
              />
            </>
          )}
        </div>
      </div>

      {/* Advisor Allegiance */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold" style={{ color: colors.text }}>
          Consultant & Advisor Allegiance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {plan.advisors && plan.advisors.length > 0 ? (
            plan.advisors.map((advisor) => {
              let badgeColor = colors.green2
              if (advisor.allegiance_score > 50) {
                badgeColor = colors.red2
              } else if (advisor.allegiance_score > 33) {
                badgeColor = colors.amber2
              }
              return (
                <AdvisorCard
                  key={advisor.id}
                  name={advisor.name}
                  firm={advisor.firm || 'Unknown Firm'}
                  allegiance={advisor.allegiance_label}
                  badge={advisor.allegiance_label}
                  badgeColor={badgeColor}
                  context={`Allegiance context`}
                  description={advisor.notes || ''}
                  score={advisor.allegiance_score}
                  actionNote={advisor.action_note || ''}
                />
              )
            })
          ) : (
            <>
              <AdvisorCard
                name="Martijn Dekker"
                firm="McKinsey & Company"
                allegiance="Risk"
                badge="Risk"
                badgeColor={colors.red2}
                context="Engaged by Mariëlle Vogt, CFO — Vendor Consolidation"
                description="Leading vendor consolidation review across utilities portfolio. High influence over IT roadmap. Tendency to recommend large-scale integrations."
                score={72}
                actionNote="Action: Request CEO intro before July consolidation report. Emphasize strategic fit vs. tactical cost reduction."
              />
              <AdvisorCard
                name="Maria Gonzalez"
                firm="Deloitte Digital"
                allegiance="Neutral+"
                badge="Ally"
                badgeColor={colors.green2}
                context="Engaged by Jeroen Sanders, CTO — Architecture & Cloud"
                description="Cloud modernization advisor with deep energy sector experience. Previously recommended similar solutions. Open to strategic partnerships."
                score={28}
                actionNote="Action: Joint value workshop. Formalise Deloitte as alliance partner and reference customer advocate."
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
