"use client"

import { useState, useEffect, useCallback } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useDroppable } from "@dnd-kit/core"
import { Button } from "@/components/ui/button"
import { KanbanCard } from "@/components/kanban/kanban-card"
import { DealDialog } from "@/components/kanban/deal-dialog"
import { Plus, Kanban } from "lucide-react"
import type { KanbanStage, Deal } from "@/lib/types"

interface DealWithRelations extends Deal {
  contact?: { id: string; first_name: string; last_name: string } | null
  company?: { id: string; name: string } | null
}

function DroppableColumn({
  stage,
  deals,
  onDeleteDeal,
}: {
  stage: KanbanStage
  deals: DealWithRelations[]
  onDeleteDeal: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl border border-border/50 bg-card">
      <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: stage.color }}
        />
        <span className="text-sm font-medium">{stage.name}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {deals.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-[200px] flex-col gap-2 p-3 transition-colors ${
          isOver ? "bg-accent/30" : ""
        }`}
      >
        <SortableContext
          items={deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {deals.map((deal) => (
            <KanbanCard
              key={deal.id}
              id={deal.id}
              title={deal.title}
              value={deal.value}
              contactName={
                deal.contact
                  ? `${deal.contact.first_name} ${deal.contact.last_name}`
                  : undefined
              }
              companyName={deal.company?.name}
              onDelete={onDeleteDeal}
            />
          ))}
        </SortableContext>

        {deals.length === 0 && !isOver && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Drop deals here
          </p>
        )}
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const [stages, setStages] = useState<KanbanStage[]>([])
  const [deals, setDeals] = useState<DealWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [activeDeal, setActiveDeal] = useState<DealWithRelations | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  const fetchPipeline = useCallback(async () => {
    try {
      const res = await fetch("/api/deals")
      const data = await res.json()

      if (res.ok) {
        setStages(data.stages || [])
        setDeals(data.deals || [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPipeline()
  }, [fetchPipeline])

  function getDealsByStage(stageId: string) {
    return deals
      .filter((d) => d.stage_id === stageId)
      .sort((a, b) => a.stage_position - b.stage_position)
  }

  function handleDragStart(event: DragStartEvent) {
    const deal = deals.find((d) => d.id === event.active.id)
    setActiveDeal(deal || null)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeDealItem = deals.find((d) => d.id === activeId)
    if (!activeDealItem) return

    // Check if dropping over a stage (column) or another deal
    const overStage = stages.find((s) => s.id === overId)
    const overDeal = deals.find((d) => d.id === overId)

    let targetStageId: string | null = null

    if (overStage) {
      targetStageId = overStage.id
    } else if (overDeal) {
      targetStageId = overDeal.stage_id
    }

    if (targetStageId && activeDealItem.stage_id !== targetStageId) {
      // Move deal to new stage optimistically
      setDeals((prev) =>
        prev.map((d) =>
          d.id === activeId ? { ...d, stage_id: targetStageId } : d
        )
      )
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDeal(null)
    const { active } = event

    const activeId = active.id as string
    const deal = deals.find((d) => d.id === activeId)
    if (!deal) return

    // Calculate new position
    const stageDeals = deals
      .filter((d) => d.stage_id === deal.stage_id)
      .sort((a, b) => a.stage_position - b.stage_position)
    const position = stageDeals.findIndex((d) => d.id === activeId)

    // Persist to server
    try {
      await fetch("/api/deals/move", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId: activeId,
          stageId: deal.stage_id,
          position: position >= 0 ? position : 0,
        }),
      })
    } catch {
      // Revert on error by refetching
      fetchPipeline()
    }
  }

  async function handleDeleteDeal(dealId: string) {
    // Optimistic delete
    setDeals((prev) => prev.filter((d) => d.id !== dealId))

    try {
      await fetch(`/api/deals/${dealId}`, { method: "DELETE" })
    } catch {
      fetchPipeline()
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-accent" />
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 w-72 animate-pulse rounded-xl bg-accent" />
          ))}
        </div>
      </div>
    )
  }

  const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {deals.length} deal{deals.length !== 1 ? "s" : ""} — EUR{" "}
            {totalValue.toLocaleString()} total value
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add deal
        </Button>
      </div>

      {stages.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card px-6 py-20 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent">
            <Kanban className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium">No pipeline set up</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Something went wrong. Try signing out and signing back in.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => (
              <DroppableColumn
                key={stage.id}
                stage={stage}
                deals={getDealsByStage(stage.id)}
                onDeleteDeal={handleDeleteDeal}
              />
            ))}
          </div>

          <DragOverlay>
            {activeDeal && (
              <div className="w-72 rounded-lg border border-border/50 bg-card p-3 shadow-xl">
                <p className="text-sm font-medium">{activeDeal.title}</p>
                {activeDeal.value > 0 && (
                  <p className="mt-1 text-xs font-medium text-emerald-400">
                    EUR {activeDeal.value.toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      <DealDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={fetchPipeline}
      />
    </div>
  )
}
