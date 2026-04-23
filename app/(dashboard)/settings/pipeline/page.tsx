import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

const defaultStages = [
  { name: "New Lead", color: "#6366f1", type: "normal" },
  { name: "Contacted", color: "#3b82f6", type: "normal" },
  { name: "Proposal Sent", color: "#f59e0b", type: "normal" },
  { name: "Negotiation", color: "#f97316", type: "normal" },
  { name: "Won", color: "#22c55e", type: "won" },
  { name: "Lost", color: "#ef4444", type: "lost" },
]

export default function PipelineSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Pipeline stages
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Customize the stages in your sales pipeline. Drag to reorder.
          </p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add stage
        </Button>
      </div>

      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        {defaultStages.map((stage, i) => (
          <div
            key={stage.name}
            className={`flex items-center gap-4 px-5 py-4 ${
              i < defaultStages.length - 1
                ? "border-b border-border/50"
                : ""
            }`}
          >
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: stage.color }}
            />
            <span className="flex-1 text-sm font-medium">{stage.name}</span>
            {stage.type === "won" && (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                Won stage
              </span>
            )}
            {stage.type === "lost" && (
              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-400">
                Lost stage
              </span>
            )}
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        You can rename, reorder, or add new stages. Every pipeline needs at
        least one &quot;Won&quot; and one &quot;Lost&quot; stage so Bridge knows
        when a deal is closed.
      </p>
    </div>
  )
}
