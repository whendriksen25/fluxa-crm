"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Trash2 } from "lucide-react"

interface KanbanCardProps {
  id: string
  title: string
  value: number
  contactName?: string
  companyName?: string
  onDelete: (id: string) => void
}

export function KanbanCard({
  id,
  title,
  value,
  contactName,
  companyName,
  onDelete,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-lg border border-border/50 bg-background p-3 transition-shadow ${
        isDragging ? "shadow-lg opacity-90 z-50" : "hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-0.5 shrink-0 cursor-grab rounded p-0.5 text-muted-foreground/50 transition-colors hover:text-muted-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight truncate">{title}</p>
          {(contactName || companyName) && (
            <p className="mt-0.5 text-xs text-muted-foreground truncate">
              {contactName}
              {contactName && companyName && " — "}
              {companyName}
            </p>
          )}
          {value > 0 && (
            <p className="mt-1 text-xs font-medium text-emerald-400">
              EUR {value.toLocaleString()}
            </p>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(id)
          }}
          className="shrink-0 rounded p-1 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground hover:text-destructive"
          title="Delete deal"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
