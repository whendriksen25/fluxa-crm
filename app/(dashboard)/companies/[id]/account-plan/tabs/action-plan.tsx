"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { Plus, Pencil, Trash2, ClipboardList } from "lucide-react"
import type { AccountPlanFull, AccountAction } from "@/lib/types"
import { ActionDialog } from "./action-dialog"
import { EmptyState } from "./empty-state"

interface ActionPlanTabProps {
  plan: AccountPlanFull
  onUpdate: () => void
}

const statusColors: Record<string, string> = {
  Open: "bg-blue-500/10 text-blue-400",
  "In Progress": "bg-amber-500/10 text-amber-400",
  Completed: "bg-emerald-500/10 text-emerald-400",
  Blocked: "bg-red-500/10 text-red-400",
}

const priorityColors: Record<string, string> = {
  P1: "bg-red-500/20 text-red-400 border border-red-500/30",
  P2: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  P3: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "--"
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })
}

function getStatusCounts(actions: AccountAction[]) {
  return {
    Open: actions.filter((a: AccountAction) => a.status === "Open").length,
    "In Progress": actions.filter((a: AccountAction) => a.status === "In Progress").length,
    Completed: actions.filter((a: AccountAction) => a.status === "Completed").length,
    Blocked: actions.filter((a: AccountAction) => a.status === "Blocked").length,
  }
}

function getDueDateColor(dueDate: string | null, status: string): string {
  if (!dueDate || status === "Completed") return "text-muted-foreground"

  const now = new Date()
  const due = new Date(dueDate)
  const daysUntilDue = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntilDue < 0) return "text-red-400"
  if (daysUntilDue <= 7) return "text-amber-400"
  return "text-muted-foreground"
}

function getCompletionPercentage(actions: AccountAction[]): number {
  if (actions.length === 0) return 0
  const completed = actions.filter((a) => a.status === "Completed").length
  return Math.round((completed / actions.length) * 100)
}

const statusSummaryConfig = [
  { key: "Open" as const, label: "Open", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  { key: "In Progress" as const, label: "In Progress", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  { key: "Completed" as const, label: "Completed", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  { key: "Blocked" as const, label: "Blocked", color: "bg-red-500/10 text-red-400 border-red-500/30" },
]

export function ActionPlanTab({ plan, onUpdate }: ActionPlanTabProps) {
  const { toast } = useToast()
  const counts = getStatusCounts(plan.actions)
  const completionPercentage = getCompletionPercentage(plan.actions)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAction, setEditingAction] = useState<AccountAction | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function handleAdd() {
    setEditingAction(null)
    setDialogOpen(true)
  }

  function handleEdit(action: AccountAction) {
    setEditingAction(action)
    setDialogOpen(true)
  }

  async function handleDelete(actionId: string) {
    setDeletingId(actionId)
    try {
      const response = await fetch(`/api/account-plans/entity/${actionId}?table=account_actions`, { method: "DELETE" })
      if (!response.ok) {
        toast("Failed to delete action", "error")
        return
      }
      toast("Action deleted")
      onUpdate()
    } catch (error) {
      toast("Failed to delete action", "error")
    } finally {
      setDeletingId(null)
    }
  }

  function handleDialogSaved() {
    if (editingAction) {
      toast("Action updated")
    } else {
      toast("Action created")
    }
    setDialogOpen(false)
    onUpdate()
  }

  if (plan.actions.length === 0) {
    return (
      <>
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title="No action items yet"
          description="Track tasks, milestones, and next steps to keep your account plan moving forward."
          actionLabel="Add Action"
          onAction={handleAdd}
        />

        <ActionDialog
          planId={plan.id}
          action={editingAction}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSaved={handleDialogSaved}
        />
      </>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statusSummaryConfig.map(({ key, label, color }) => (
          <div key={key} className={`rounded-lg border border-border/30 ${color} px-4 py-3`}>
            <p className="text-xs font-medium uppercase tracking-wider opacity-75">{label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{counts[key]}</p>
          </div>
        ))}
      </div>

      {/* Actions Table */}
      <div className="rounded-xl border border-border/50 bg-card p-5">
        {/* Completion Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Progress</p>
            <p className="text-xs font-semibold text-emerald-400">{completionPercentage}% Complete</p>
          </div>
          <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Actions</h3>
          <Button variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="mr-2 h-3.5 w-3.5" />
            Add Action
          </Button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/30">
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-muted-foreground font-medium w-12">#</th>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-muted-foreground font-medium w-16">Priority</th>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-muted-foreground font-medium flex-1">Action</th>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-muted-foreground font-medium w-32">Owner</th>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-muted-foreground font-medium w-24">Due</th>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-muted-foreground font-medium w-32">Stakeholder</th>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-muted-foreground font-medium w-24">Status</th>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-muted-foreground font-medium flex-1">Notes</th>
              <th className="px-3 py-2 text-right text-xs uppercase tracking-wider text-muted-foreground font-medium w-20"></th>
            </tr>
          </thead>
          <tbody>
            {plan.actions.map((action, idx) => (
              <tr key={action.id} className={`border-b border-border/20 hover:bg-accent/30 transition-colors ${idx % 2 === 0 ? "even:bg-accent/20" : ""}`}>
                {/* # */}
                <td className="px-3 py-3">
                  <code className="text-xs font-mono text-muted-foreground">{action.action_code || `A-${(idx + 1).toString().padStart(2, "0")}`}</code>
                </td>

                {/* Priority */}
                <td className="px-3 py-3">
                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${priorityColors[action.priority]}`}>
                    {action.priority}
                  </span>
                </td>

                {/* Action */}
                <td className="px-3 py-3">
                  <div className="max-w-md">
                    <p className="font-semibold text-foreground">{action.title}</p>
                    {action.description && <p className="mt-0.5 text-xs text-muted-foreground">{action.description}</p>}
                  </div>
                </td>

                {/* Owner */}
                <td className="px-3 py-3">
                  <p className="text-sm text-foreground">{action.owner_name || "--"}</p>
                </td>

                {/* Due Date */}
                <td className="px-3 py-3">
                  <p className={`text-sm ${getDueDateColor(action.due_date, action.status)}`}>{formatDate(action.due_date)}</p>
                </td>

                {/* Linked Stakeholder */}
                <td className="px-3 py-3">
                  {action.linked_stakeholder_name ? (
                    <Badge variant="secondary" className="bg-accent/30 text-xs">
                      {action.linked_stakeholder_name}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">--</span>
                  )}
                </td>

                {/* Status */}
                <td className="px-3 py-3">
                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusColors[action.status]}`}>
                    {action.status}
                  </span>
                </td>

                {/* Notes */}
                <td className="px-3 py-3">
                  {action.notes && <p className="max-w-md text-xs text-muted-foreground">{action.notes}</p>}
                </td>

                {/* Actions */}
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => handleEdit(action)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(action.id)}
                      disabled={deletingId === action.id}
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

      {/* Dialog */}
      <ActionDialog
        planId={plan.id}
        action={editingAction}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={handleDialogSaved}
      />
    </div>
  )
}
