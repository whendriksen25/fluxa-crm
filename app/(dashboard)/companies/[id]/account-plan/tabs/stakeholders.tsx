"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, Users } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { EmptyState } from "./empty-state"
import type { AccountPlanFull, AccountStakeholder, StakeholderStance } from "@/lib/types"
import { StakeholderDialog } from "./stakeholder-dialog"

// Color palette matching template
const COLORS = {
  bg: "#0b1120",
  card: "#0f1724",
  card2: "#141e30",
  b1: "rgba(255,255,255,.06)",
  b2: "rgba(255,255,255,.08)",
  green: "#1fa870",
  green2: "#28d688",
  blue: "#2568b8",
  blue2: "#4a8fe0",
  amber: "#c07a18",
  amber2: "#e8991f",
  amber3: "#f5c048",
  red: "#c43838",
  red2: "#ef5757",
  coral: "#a03428",
  coral2: "#c86050",
  gold: "#c07a18",
  gold2: "#f5c048",
  text: "#e8eef6",
  text2: "#8a9bb7",
  text3: "#4a5f80",
  gray: "#3e5877",
}

const stanceColors: Record<StakeholderStance, string> = {
  Champion: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  Supporter: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  Neutral: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  "Neutral+": "border-amber-500/30 bg-amber-500/10 text-amber-400",
  Risk: "border-red-500/30 bg-red-500/10 text-red-400",
  Unknown: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
}

const stanceBgColors: Record<StakeholderStance, string> = {
  Champion: "bg-emerald-500/20",
  Supporter: "bg-blue-500/20",
  Neutral: "bg-amber-500/20",
  "Neutral+": "bg-amber-500/20",
  Risk: "bg-red-500/20",
  Unknown: "bg-zinc-500/20",
}

const stanceTextColors: Record<StakeholderStance, string> = {
  Champion: "text-emerald-400",
  Supporter: "text-blue-400",
  Neutral: "text-amber-400",
  "Neutral+": "text-amber-400",
  Risk: "text-red-400",
  Unknown: "text-zinc-400",
}

const roleBadgeColors: Record<string, string> = {
  "Economic Buyer": "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
  "Technical Evaluator": "border-purple-500/30 bg-purple-500/10 text-purple-400",
  "End User": "border-blue-500/30 bg-blue-500/10 text-blue-400",
  "Influencer": "border-amber-500/30 bg-amber-500/10 text-amber-400",
  "External Advisor": "border-pink-500/30 bg-pink-500/10 text-pink-400",
  "Executive Sponsor": "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
}

interface StakeholderTabProps {
  plan: AccountPlanFull
  onUpdate: () => void
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function StakeholderAvatar({ name, stance }: { name: string; stance: StakeholderStance }) {
  const initials = getInitials(name)
  const bgColor = stanceBgColors[stance]
  const textColor = stanceTextColors[stance]

  return (
    <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${stanceColors[stance].split(" ")[0]} ${bgColor}`}>
      <span className={`text-xs font-semibold ${textColor}`}>{initials}</span>
    </div>
  )
}

function InfluenceBar({ weight }: { weight: number }) {
  const [displayWidth, setDisplayWidth] = useState(0)
  const percentage = (weight / 10) * 100
  const barColor = weight >= 8 ? "bg-emerald-500/60" : weight >= 5 ? "bg-amber-500/60" : "bg-red-500/60"

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayWidth(percentage)
    }, 100)
    return () => clearTimeout(timer)
  }, [percentage])

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Influence</span>
        <span className="font-semibold text-foreground">{weight}/10</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/30">
        <div className={`h-full transition-all duration-500 ${barColor}`} style={{ width: `${displayWidth}%` }} />
      </div>
    </div>
  )
}

function StakeholderCard({
  stakeholder,
  onEdit,
  onDelete,
}: {
  stakeholder: AccountStakeholder
  onEdit: () => void
  onDelete: () => void
}) {
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  async function handleDelete() {
    setDeleting(true)
    try {
      await fetch(`/api/account-plans/entity/${stakeholder.id}?table=account_stakeholders`, { method: "DELETE" })
      toast(`${stakeholder.name} removed`, "success")
      onDelete()
    } catch {
      toast("Failed to delete stakeholder", "error")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="group rounded-xl border border-border/50 bg-card p-4 hover:border-border transition-all duration-200 hover:shadow-md hover:shadow-black/10">
      <div className="flex flex-col gap-3">
        {/* Avatar + Name + Title + Actions */}
        <div className="flex gap-3">
          <StakeholderAvatar name={stakeholder.name} stance={stakeholder.stance} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold leading-tight text-foreground truncate">{stakeholder.name}</p>
            {stakeholder.title && <p className="mt-0.5 truncate text-xs text-muted-foreground">{stakeholder.title}</p>}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Stance Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={stanceColors[stakeholder.stance]}>
            {stakeholder.stance}
          </Badge>
          {stakeholder.is_external && (
            <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-400">
              External
            </Badge>
          )}
        </div>

        {/* Role Type */}
        {stakeholder.role_type && (
          <Badge variant="outline" className={roleBadgeColors[stakeholder.role_type] || "border-zinc-500/30 bg-zinc-500/10 text-zinc-400"}>
            {stakeholder.role_type}
          </Badge>
        )}

        {/* Influence Bar */}
        <InfluenceBar weight={stakeholder.influence_weight} />
      </div>
    </div>
  )
}

function ConnectionBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    org: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    champion: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    risk: "border-red-500/30 bg-red-500/10 text-red-400",
    positive: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    influence: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  }

  return (
    <Badge variant="outline" className={colors[type] || colors.org}>
      {type}
    </Badge>
  )
}

function ConnectionItem({
  fromName,
  toName,
  connectionType,
  label,
}: {
  fromName: string
  toName: string
  connectionType: string
  label: string | null
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/30 bg-card/50 px-4 py-3">
      <div className="flex flex-1 items-center gap-2 min-w-0">
        <span className="truncate font-medium text-foreground text-sm">{fromName}</span>
        <span className="text-muted-foreground">→</span>
        <span className="truncate font-medium text-foreground text-sm">{toName}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <ConnectionBadge type={connectionType} />
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
      </div>
    </div>
  )
}

function LegendSection({ title, items }: { title: string; items: Array<{ label: string; color: string }> }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs">
            <div className={`h-3 w-3 rounded-full ${item.color}`} />
            <span className="text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface NetworkNode {
  id: string
  name: string
  title: string
  role: "exec" | "tech" | "user" | "advisor" | "influencer"
  stance: StakeholderStance
  influence: number
  ring?: number
  angle?: number
  x?: number
  y?: number
  isExternal?: boolean
}

interface NetworkEdge {
  from: string
  to: string
  type: "org" | "champion" | "risk" | "positive"
  label?: string
}

function StakeholderNetworkVisualization({ stakeholders, connections, company }: { stakeholders: AccountStakeholder[]; connections?: Array<{ id: string; from_stakeholder_id: string; to_stakeholder_id: string; connection_type: string; label: string | null }>; company?: string }) {
  // Build nodes from stakeholders
  const createNodesFromStakeholders = (): NetworkNode[] => {
    if (!stakeholders || stakeholders.length === 0) {
      return []
    }

    const ringRadii = [155, 265, 350]
    const roles: Record<string, "exec" | "tech" | "user" | "advisor"> = {
      "Economic Buyer": "exec",
      "Technical Evaluator": "tech",
      "End User": "user",
      "External Advisor": "advisor",
    }

    // Partition stakeholders
    const executives = stakeholders.filter((s) => s.role_type === "Economic Buyer").slice(0, 4)
    const technical = stakeholders.filter((s) => s.role_type === "Technical Evaluator").slice(0, 3)
    const endUsers = stakeholders.filter((s) => s.role_type === "End User").slice(0, 2)
    const external = stakeholders.filter((s) => s.is_external === true).slice(0, 2)

    const nodes: NetworkNode[] = []
    const cx = 440,
      cy = 330

    // Distribute executives on ring 1
    executives.forEach((s, i) => {
      const angle = (270 - (i * 360) / executives.length) % 360
      const ring = ringRadii[0]
      const x = cx + ring * Math.cos((angle * Math.PI) / 180)
      const y = cy + ring * Math.sin((angle * Math.PI) / 180)
      nodes.push({
        id: s.id,
        name: s.name,
        title: s.title || "",
        role: roles[s.role_type || ""] || "exec",
        stance: s.stance,
        influence: s.influence_weight,
        ring: 0,
        angle,
        x,
        y,
      })
    })

    // Distribute technical on ring 2
    technical.forEach((s, i) => {
      const angle = (60 - (i * 360) / (technical.length + 1)) % 360
      const ring = ringRadii[1]
      const x = cx + ring * Math.cos((angle * Math.PI) / 180)
      const y = cy + ring * Math.sin((angle * Math.PI) / 180)
      nodes.push({
        id: s.id,
        name: s.name,
        title: s.title || "",
        role: "tech",
        stance: s.stance,
        influence: s.influence_weight,
        ring: 1,
        angle,
        x,
        y,
      })
    })

    // Distribute end users on ring 3
    endUsers.forEach((s, i) => {
      const angle = (345 - (i * 360) / (endUsers.length + 1)) % 360
      const ring = ringRadii[2]
      const x = cx + ring * Math.cos((angle * Math.PI) / 180)
      const y = cy + ring * Math.sin((angle * Math.PI) / 180)
      nodes.push({
        id: s.id,
        name: s.name,
        title: s.title || "",
        role: "user",
        stance: s.stance,
        influence: s.influence_weight,
        ring: 2,
        angle,
        x,
        y,
      })
    })

    // External advisors in fixed positions on right
    external.forEach((s, i) => {
      nodes.push({
        id: s.id,
        name: s.name,
        title: s.title || "",
        role: "advisor",
        stance: s.stance,
        influence: s.influence_weight,
        x: 820,
        y: 210 + i * 260,
        isExternal: true,
      })
    })

    return nodes
  }

  const nodes = createNodesFromStakeholders()

  // Color mappings
  const getStanceColor = (stance: StakeholderStance) => {
    const colorMap: Record<StakeholderStance, { fill: string; edge: string }> = {
      Champion: { fill: COLORS.green, edge: COLORS.green2 },
      Supporter: { fill: COLORS.blue, edge: COLORS.blue2 },
      Neutral: { fill: COLORS.amber, edge: COLORS.amber2 },
      "Neutral+": { fill: COLORS.blue, edge: COLORS.blue2 },
      Risk: { fill: COLORS.red, edge: COLORS.red2 },
      Unknown: { fill: COLORS.gray, edge: COLORS.text3 },
    }
    return colorMap[stance] || colorMap.Unknown
  }

  const getRoleShape = (node: NetworkNode, colors: { fill: string; edge: string }) => {
    const r = 14 + node.influence * 2.2
    const { x = 0, y = 0 } = node

    switch (node.role) {
      case "exec": {
        // Diamond (rotated square)
        const points = [
          [x, y - r],
          [x + r, y],
          [x, y + r],
          [x - r, y],
        ]
        return (
          <polygon
            points={points.map((p) => p.join(",")).join(" ")}
            fill={colors.fill}
            stroke={colors.edge}
            strokeWidth="2"
          />
        )
      }
      case "tech": {
        // Rounded rectangle
        return (
          <rect
            x={x - r}
            y={y - r}
            width={r * 2}
            height={r * 2}
            rx="6"
            fill={colors.fill}
            stroke={colors.edge}
            strokeWidth="2"
          />
        )
      }
      case "user": {
        // Triangle pointing up
        const h = r * 2.2
        const points = [
          [x, y - h / 2],
          [x + r, y + h / 2],
          [x - r, y + h / 2],
        ]
        return (
          <polygon
            points={points.map((p) => p.join(",")).join(" ")}
            fill={colors.fill}
            stroke={colors.edge}
            strokeWidth="2"
          />
        )
      }
      case "advisor": {
        // Hexagon with dashed border
        const angles = Array.from({ length: 6 }, (_, i) => ((i * 60) * Math.PI) / 180)
        const hexPoints = angles.map((a) => [x + r * Math.cos(a), y + r * Math.sin(a)])
        return (
          <polygon
            points={hexPoints.map((p) => p.join(",")).join(" ")}
            fill={colors.fill}
            stroke={colors.edge}
            strokeWidth="2"
            strokeDasharray="6,4"
          />
        )
      }
      default:
        // Circle for influencer or default
        return <circle cx={x} cy={y} r={r} fill={colors.fill} stroke={colors.edge} strokeWidth="2" />
    }
  }

  return (
    <div className="rounded-xl border border-border/30 bg-card/50 p-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Stakeholder & Influence Network</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Node size = influence weight · Colour = stance · Shape = role type · Dashed ring = external party · Lines = influence flow
        </p>
      </div>

      <svg width="100%" height="720" viewBox="0 0 1000 660" className="w-full bg-card/30 rounded-lg border border-border/20">
        <defs>
          {/* Arrow markers for influence edges */}
          <marker
            id="arrowChampion"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill={COLORS.gold2} />
          </marker>
          <marker
            id="arrowRisk"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill={COLORS.red} />
          </marker>
          <marker
            id="arrowPositive"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill={COLORS.blue} />
          </marker>
        </defs>

        {/* Ring guides */}
        <circle cx="440" cy="330" r="155" fill="none" stroke={COLORS.text3} strokeDasharray="4,4" opacity="0.3" />
        <circle cx="440" cy="330" r="265" fill="none" stroke={COLORS.text3} strokeDasharray="4,4" opacity="0.3" />
        <circle cx="440" cy="330" r="350" fill="none" stroke={COLORS.text3} strokeDasharray="4,4" opacity="0.3" />

        {/* Ring labels */}
        <text x="440" y="185" textAnchor="middle" fontSize="11" fill={COLORS.text3} opacity="0.6">
          C-suite
        </text>
        <text x="440" y="75" textAnchor="middle" fontSize="11" fill={COLORS.text3} opacity="0.6">
          VP / Director
        </text>
        <text x="440" y="-20" textAnchor="middle" fontSize="11" fill={COLORS.text3} opacity="0.6">
          Manager
        </text>

        {/* Relationship edges from connections data */}
        {(() => {
          // Build a map from stakeholder ID to node for quick lookup
          const nodeById = new Map(nodes.map((n) => [n.id, n]))

          // Define edge style properties per connection type
          const edgeStyles: Record<string, { color: string; width: number; dasharray: string; marker: string }> = {
            org: { color: "rgba(43,62,92,0.7)", width: 1.2, dasharray: "none", marker: "none" },
            champion: { color: COLORS.gold2, width: 2.0, dasharray: "6,4", marker: "url(#arrowChampion)" },
            risk: { color: COLORS.red, width: 2.5, dasharray: "8,4", marker: "url(#arrowRisk)" },
            positive: { color: COLORS.blue, width: 2.0, dasharray: "6,4", marker: "url(#arrowPositive)" },
            influence: { color: COLORS.amber3, width: 2.0, dasharray: "6,4", marker: "url(#arrowChampion)" },
          }

          return (connections || []).map((conn) => {
            const fromNode = nodeById.get(conn.from_stakeholder_id)
            const toNode = nodeById.get(conn.to_stakeholder_id)

            // Skip if either node not found
            if (!fromNode || !toNode || !fromNode.x || !fromNode.y || !toNode.x || !toNode.y) {
              return null
            }

            const style = edgeStyles[conn.connection_type] || edgeStyles.org
            const r0 = 14 + fromNode.influence * 2.2
            const r1 = 14 + toNode.influence * 2.2

            const x0 = fromNode.x
            const y0 = fromNode.y
            const x1 = toNode.x
            const y1 = toNode.y

            // Calculate distance and shorten line to node boundaries
            const dx = x1 - x0
            const dy = y1 - y0
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist === 0) return null

            const startX = x0 + (r0 / dist) * dx
            const startY = y0 + (r0 / dist) * dy
            const endX = x1 - (r1 / dist) * dx
            const endY = y1 - (r1 / dist) * dy

            // For org edges, draw straight lines; for influence edges, draw bezier curves
            if (conn.connection_type === "org") {
              return (
                <line
                  key={`edge-${conn.id}`}
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke={style.color}
                  strokeWidth={style.width}
                  fill="none"
                />
              )
            } else {
              // Bezier curve with perpendicular control point offset
              const mx = (startX + endX) / 2 - (endY - startY) * 0.2
              const my = (startY + endY) / 2 + (endX - startX) * 0.2

              return (
                <g key={`edge-${conn.id}`}>
                  <path
                    d={`M ${startX} ${startY} Q ${mx} ${my} ${endX} ${endY}`}
                    stroke={style.color}
                    strokeWidth={style.width}
                    fill="none"
                    strokeDasharray={style.dasharray === "none" ? undefined : style.dasharray}
                    markerEnd={style.marker === "none" ? undefined : style.marker}
                  />
                  {/* Label with background if present */}
                  {conn.label && (
                    <g>
                      <rect
                        x={mx - 20}
                        y={my - 8}
                        width="40"
                        height="16"
                        fill={COLORS.card2}
                        opacity="0.9"
                        rx="3"
                      />
                      <text
                        x={mx}
                        y={my + 3}
                        textAnchor="middle"
                        fontSize="9"
                        fill={COLORS.text}
                        opacity="0.85"
                      >
                        {conn.label}
                      </text>
                    </g>
                  )}
                </g>
              )
            }
          })
        })()}

        {/* Central company node */}
        <circle cx="440" cy="330" r="32" fill={COLORS.card2} stroke={COLORS.text2} strokeWidth="2" opacity="0.8" />
        <text x="440" y="328" textAnchor="middle" fontSize="12" fontWeight="600" fill={COLORS.text}>
          {company || "Company"}
        </text>

        {/* Nodes */}
        {nodes.map((node) => {
          const colors = getStanceColor(node.stance)
          return (
            <g key={node.id} className="group">
              {getRoleShape(node, colors)}
              {/* Node label */}
              <text
                x={node.x}
                y={(node.y || 0) + 30}
                textAnchor="middle"
                fontSize="10"
                fontWeight="500"
                fill={COLORS.text}
                opacity="0.85"
              >
                {node.name.split(" ")[0]}
              </text>
              <text
                x={node.x}
                y={(node.y || 0) + 43}
                textAnchor="middle"
                fontSize="9"
                fill={COLORS.text2}
                opacity="0.7"
              >
                {node.title}
              </text>
            </g>
          )
        })}

        {/* External advisor box */}
        {nodes.some((n) => n.isExternal) && (
          <rect x="780" y="140" width="110" height="390" fill="none" stroke={COLORS.text3} strokeDasharray="6,4" opacity="0.4" />
        )}

        {/* Legend in top-left */}
        <g opacity="0.85">
          <rect x="15" y="15" width="180" height="140" fill={COLORS.card2} opacity="0.9" rx="4" />
          <text x="25" y="32" fontSize="11" fontWeight="600" fill={COLORS.text}>
            Legend
          </text>

          {/* Stance colors */}
          <circle cx="25" cy="50" r="4" fill={COLORS.green} />
          <text x="35" y="54" fontSize="9" fill={COLORS.text2}>
            Champion
          </text>

          <circle cx="25" cy="68" r="4" fill={COLORS.blue} />
          <text x="35" y="72" fontSize="9" fill={COLORS.text2}>
            Supporter
          </text>

          <circle cx="25" cy="86" r="4" fill={COLORS.amber} />
          <text x="35" y="90" fontSize="9" fill={COLORS.text2}>
            Neutral
          </text>

          <circle cx="25" cy="104" r="4" fill={COLORS.red} />
          <text x="35" y="108" fontSize="9" fill={COLORS.text2}>
            Risk
          </text>

          <circle cx="25" cy="122" r="4" fill={COLORS.gray} />
          <text x="35" y="126" fontSize="9" fill={COLORS.text2}>
            Unknown
          </text>

          {/* Role shapes */}
          <text x="105" y="50" fontSize="11" fontWeight="600" fill={COLORS.text}>
            Roles
          </text>
          <text x="105" y="68" fontSize="9" fill={COLORS.text2}>
            ◆ Executive
          </text>
          <text x="105" y="86" fontSize="9" fill={COLORS.text2}>
            ■ Technical
          </text>
          <text x="105" y="104" fontSize="9" fill={COLORS.text2}>
            ▲ End User
          </text>
          <text x="105" y="122" fontSize="9" fill={COLORS.text2}>
            ⬡ Advisor
          </text>
        </g>
      </svg>
    </div>
  )
}

export function StakeholderTab({ plan, onUpdate }: StakeholderTabProps) {
  const { toast } = useToast()
  const stakeholders = plan.stakeholders || []
  const connections = plan.connections || []
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStakeholder, setEditingStakeholder] = useState<AccountStakeholder | null>(null)

  function handleAdd() {
    setEditingStakeholder(null)
    setDialogOpen(true)
  }

  function handleEdit(stakeholder: AccountStakeholder) {
    setEditingStakeholder(stakeholder)
    setDialogOpen(true)
  }

  function handleSaved() {
    const isNew = !editingStakeholder
    toast(isNew ? "Stakeholder added" : "Changes saved", "success")
    onUpdate()
  }

  if (!stakeholders || stakeholders.length === 0) {
    return (
      <>
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No stakeholders mapped yet"
          description="Add stakeholders to map the influence network and understand buying dynamics for this account."
          actionLabel="Add Stakeholder"
          onAction={handleAdd}
        />

        <StakeholderDialog
          planId={plan.id}
          stakeholder={editingStakeholder}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSaved={handleSaved}
        />
      </>
    )
  }

  // Calculate stance counts for summary badges
  const stanceCounts = stakeholders.reduce((acc, s) => {
    acc[s.stance] = (acc[s.stance] || 0) + 1
    return acc
  }, {} as Record<StakeholderStance, number>)

  const stanceSummary = (Object.entries(stanceCounts) as Array<[StakeholderStance, number]>)
    .filter(([, count]) => count > 0)
    .map(([stance, count]) => `${count} ${stance}`)
    .join(" · ")

  // Build a map of stakeholder IDs to names for connections
  const stakeholderMap = new Map(stakeholders.map((s) => [s.id, s.name]))

  return (
    <div className="space-y-6">
      {/* SVG Network Visualization */}
      <StakeholderNetworkVisualization stakeholders={stakeholders} connections={connections} company="Enexis Groep" />

      {/* Stakeholder Cards Grid */}
      <div>
        <div className="mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Stakeholders</h3>
            <Button variant="outline" size="sm" onClick={handleAdd}>
              <Plus className="mr-2 h-3.5 w-3.5" />
              Add Stakeholder
            </Button>
          </div>
          {/* Summary Badges */}
          {stanceSummary && (
            <div className="flex flex-wrap gap-2">
              {(Object.entries(stanceCounts) as Array<[StakeholderStance, number]>)
                .filter(([, count]) => count > 0)
                .map(([stance, count]) => (
                  <Badge key={stance} variant="secondary" className={`${stanceColors[stance]} text-xs font-medium`}>
                    {count} {stance}
                  </Badge>
                ))}
            </div>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stakeholders.map((stakeholder) => (
            <StakeholderCard
              key={stakeholder.id}
              stakeholder={stakeholder}
              onEdit={() => handleEdit(stakeholder)}
              onDelete={onUpdate}
            />
          ))}
        </div>
      </div>

      {/* Connections */}
      {connections && connections.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Relationships
          </h3>
          <div className="space-y-2">
            {connections.map((connection) => {
              const fromName = stakeholderMap.get(connection.from_stakeholder_id) || "Unknown"
              const toName = stakeholderMap.get(connection.to_stakeholder_id) || "Unknown"

              return (
                <ConnectionItem
                  key={connection.id}
                  fromName={fromName}
                  toName={toName}
                  connectionType={connection.connection_type}
                  label={connection.label}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Influence Flow & Node Legend Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Influence Flow — Critical Paths Panel */}
        <div className="rounded-xl border border-border/30 bg-card/50 p-4">
          <h3 className="mb-4 font-semibold text-foreground">Influence Flow — Critical Paths</h3>
          <div className="space-y-3">
            {connections && connections.length > 0 ? (
              <>
                {/* Risk connections */}
                {connections
                  .filter((conn) => conn.connection_type === "risk")
                  .map((conn) => {
                    const fromName = stakeholderMap.get(conn.from_stakeholder_id) || "Unknown"
                    const toName = stakeholderMap.get(conn.to_stakeholder_id) || "Unknown"
                    return (
                      <div key={conn.id} className="flex gap-2 text-xs">
                        <span className="text-red-500 flex-shrink-0">●</span>
                        <div className="flex-1 text-muted-foreground">
                          <span className="font-medium text-foreground">{fromName}</span>
                          <span> → </span>
                          <span className="font-medium text-foreground">{toName}</span>
                          {conn.label && (
                            <>
                              <span> — </span>
                              <span className="text-foreground">{conn.label}</span>
                            </>
                          )}
                          <span>. Active risk. Potential resistance or barrier.</span>
                        </div>
                      </div>
                    )
                  })}

                {/* Champion connections */}
                {connections
                  .filter((conn) => conn.connection_type === "champion")
                  .map((conn) => {
                    const fromName = stakeholderMap.get(conn.from_stakeholder_id) || "Unknown"
                    const toName = stakeholderMap.get(conn.to_stakeholder_id) || "Unknown"
                    return (
                      <div key={conn.id} className="flex gap-2 text-xs">
                        <span className="text-yellow-500 flex-shrink-0">●</span>
                        <div className="flex-1 text-muted-foreground">
                          <span className="font-medium text-foreground">{fromName}</span>
                          <span> → </span>
                          <span className="font-medium text-foreground">{toName}</span>
                          {conn.label && (
                            <>
                              <span> — </span>
                              <span className="text-foreground">{conn.label}</span>
                            </>
                          )}
                          <span>. Champion chain actively sponsoring.</span>
                        </div>
                      </div>
                    )
                  })}

                {/* Positive connections */}
                {connections
                  .filter((conn) => conn.connection_type === "positive")
                  .map((conn) => {
                    const fromName = stakeholderMap.get(conn.from_stakeholder_id) || "Unknown"
                    const toName = stakeholderMap.get(conn.to_stakeholder_id) || "Unknown"
                    return (
                      <div key={conn.id} className="flex gap-2 text-xs">
                        <span className="text-blue-500 flex-shrink-0">●</span>
                        <div className="flex-1 text-muted-foreground">
                          <span className="font-medium text-foreground">{fromName}</span>
                          <span> → </span>
                          <span className="font-medium text-foreground">{toName}</span>
                          {conn.label && (
                            <>
                              <span> — </span>
                              <span className="text-foreground">{conn.label}</span>
                            </>
                          )}
                          <span>. Positive alignment. Potential partner.</span>
                        </div>
                      </div>
                    )
                  })}

                {/* Highest-influence stakeholder org connection */}
                {stakeholders && stakeholders.length > 0 && (
                  <div className="flex gap-2 text-xs pt-2 border-t border-border/20">
                    <span className="text-blue-500 flex-shrink-0">●</span>
                    <div className="flex-1 text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {stakeholders.reduce((max, s) => (s.influence_weight > max.influence_weight ? s : max)).name}
                      </span>
                      <span> → All C-suite. </span>
                      <span>Top-down organizational mandate.</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No influence paths defined yet. Add connections to map critical paths.</p>
            )}
          </div>
        </div>

        {/* Node Legend Panel */}
        <div className="rounded-xl border border-border/30 bg-card/50 p-4">
          <h3 className="mb-4 font-semibold text-foreground">Node Legend</h3>
          <div className="grid grid-cols-2 gap-6">
            {/* Shape = Role Type */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shape = Role Type</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-sm text-foreground">◆</span>
                  <span className="text-muted-foreground">Economic Buyer / C-suite</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-sm text-foreground">■</span>
                  <span className="text-muted-foreground">Technical Evaluator</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-sm text-foreground">▲</span>
                  <span className="text-muted-foreground">End User / Influencer</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-sm text-foreground">⬡</span>
                  <span className="text-muted-foreground">External Advisor</span>
                </div>
              </div>
            </div>

            {/* Colour = Stance */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Colour = Stance</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground">Champion / Strong Supporter</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground">Supporter</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-muted-foreground">Neutral / Undecided</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-muted-foreground">Risk / Opponent</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 rounded-full bg-zinc-500" />
                  <span className="text-muted-foreground">Unknown</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-4 rounded-xl border border-border/30 bg-card/50 p-4">
        <h3 className="font-semibold text-foreground">Legend</h3>

        <LegendSection
          title="Stance"
          items={[
            { label: "Champion", color: "bg-emerald-500" },
            { label: "Supporter", color: "bg-blue-500" },
            { label: "Neutral", color: "bg-amber-500" },
            { label: "Risk", color: "bg-red-500" },
            { label: "Unknown", color: "bg-zinc-500" },
          ]}
        />

        <LegendSection
          title="Role Type"
          items={[
            { label: "Economic Buyer", color: "bg-cyan-500" },
            { label: "Technical Evaluator", color: "bg-purple-500" },
            { label: "End User", color: "bg-blue-500" },
            { label: "Influencer", color: "bg-amber-500" },
            { label: "External Advisor", color: "bg-pink-500" },
            { label: "Executive Sponsor", color: "bg-emerald-500" },
          ]}
        />

        <LegendSection
          title="Connection Type"
          items={[
            { label: "Org", color: "bg-blue-500" },
            { label: "Champion", color: "bg-emerald-500" },
            { label: "Risk", color: "bg-red-500" },
            { label: "Positive", color: "bg-emerald-500" },
            { label: "Influence", color: "bg-amber-500" },
          ]}
        />
      </div>

      {/* Dialog */}
      <StakeholderDialog
        planId={plan.id}
        stakeholder={editingStakeholder}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  )
}
