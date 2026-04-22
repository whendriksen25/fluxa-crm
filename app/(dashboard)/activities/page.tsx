"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Activity,
  Phone,
  Mail,
  Calendar,
  CheckSquare,
  StickyNote,
  ArrowRightLeft,
  Loader2,
  Check,
} from "lucide-react"

const typeConfig: Record<
  string,
  { label: string; icon: typeof Phone; color: string }
> = {
  call: { label: "Call", icon: Phone, color: "text-blue-400" },
  email: { label: "Email", icon: Mail, color: "text-emerald-400" },
  meeting: { label: "Meeting", icon: Calendar, color: "text-purple-400" },
  task: { label: "Task", icon: CheckSquare, color: "text-amber-400" },
  note: { label: "Note", icon: StickyNote, color: "text-zinc-400" },
  deal_moved: { label: "Deal moved", icon: ArrowRightLeft, color: "text-orange-400" },
  system: { label: "System", icon: Activity, color: "text-zinc-500" },
}

interface ActivityItem {
  id: string
  type: string
  title: string | null
  description: string | null
  is_task: boolean
  completed: boolean
  due_date: string | null
  created_at: string
  contact: { first_name: string; last_name: string } | null
  deal: { title: string } | null
  company: { name: string } | null
  user: { full_name: string } | null
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 25

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formType, setFormType] = useState("note")
  const [formTitle, setFormTitle] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formIsTask, setFormIsTask] = useState(false)
  const [formDueDate, setFormDueDate] = useState("")

  const fetchActivities = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (typeFilter) params.set("type", typeFilter)
      params.set("page", page.toString())
      params.set("pageSize", pageSize.toString())

      const res = await fetch(`/api/activities?${params}`)
      const data = await res.json()
      if (res.ok) {
        setActivities(data.activities || [])
        setTotal(data.total || 0)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [typeFilter, page])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formType,
          title: formTitle,
          description: formDescription || null,
          is_task: formIsTask,
          due_date: formDueDate || null,
        }),
      })
      if (res.ok) {
        setDialogOpen(false)
        setFormTitle("")
        setFormDescription("")
        setFormIsTask(false)
        setFormDueDate("")
        setFormType("note")
        fetchActivities()
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }

  async function handleComplete(activityId: string) {
    try {
      await fetch(`/api/activities/${activityId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      })
      fetchActivities()
    } catch {
      // silently fail
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activities</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total > 0
              ? `${total} activit${total === 1 ? "y" : "ies"} total`
              : "All tasks, calls, emails, and notes in one feed."}
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Log activity
        </Button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value)
            setPage(1)
          }}
          className="flex h-8 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
        >
          <option value="">All types</option>
          {Object.entries(typeConfig).map(([value, cfg]) => (
            <option key={value} value={value}>
              {cfg.label}
            </option>
          ))}
        </select>
      </div>

      {/* Activity feed */}
      {loading && activities.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card px-6 py-20 text-center">
          <p className="text-sm text-muted-foreground">Loading activities...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card">
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent">
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium">No activities yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Log a call, note, or task to start tracking your team&apos;s work.
            </p>
            <Button size="sm" className="mt-6" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Log your first activity
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {activities.map((activity) => {
              const cfg = typeConfig[activity.type] || typeConfig.system
              const Icon = cfg.icon
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 rounded-xl border border-border/50 bg-card px-4 py-3 transition-colors hover:bg-accent/30"
                >
                  <div className={`mt-0.5 ${cfg.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {activity.title || "Untitled"}
                      </span>
                      {activity.is_task && !activity.completed && (
                        <Badge
                          variant="outline"
                          className="bg-amber-500/10 text-amber-400 border-amber-500/20"
                        >
                          Task
                        </Badge>
                      )}
                      {activity.is_task && activity.completed && (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        >
                          Done
                        </Badge>
                      )}
                    </div>
                    {activity.description && (
                      <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                        {activity.description}
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDate(activity.created_at)}</span>
                      {activity.user?.full_name && (
                        <>
                          <span>·</span>
                          <span>{activity.user.full_name}</span>
                        </>
                      )}
                      {activity.contact && (
                        <>
                          <span>·</span>
                          <span>
                            {activity.contact.first_name} {activity.contact.last_name}
                          </span>
                        </>
                      )}
                      {activity.deal?.title && (
                        <>
                          <span>·</span>
                          <span>{activity.deal.title}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {activity.is_task && !activity.completed && (
                    <button
                      onClick={() => handleComplete(activity.id)}
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-emerald-400"
                      title="Mark complete"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDialogOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-border/50 bg-card p-6 shadow-2xl">
            <h2 className="text-lg font-semibold">Log activity</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Record a call, note, task, or anything else.
            </p>

            <form onSubmit={handleCreate} className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="actType">Type</Label>
                <select
                  id="actType"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                >
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                  <option value="task">Task</option>
                  <option value="note">Note</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="actTitle">Title *</Label>
                <Input
                  id="actTitle"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Called Sophie about contract"
                  required
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="actDesc">Description</Label>
                <Textarea
                  id="actDesc"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Optional notes..."
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formIsTask}
                    onChange={(e) => setFormIsTask(e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  Add to work queue (task)
                </label>
              </div>

              {formIsTask && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="actDue">Due date</Label>
                  <Input
                    id="actDue"
                    type="datetime-local"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Log activity"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
