import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2 } from 'lucide-react'
import { priorities } from '../data/initialData'

/**
 * The visual part of a task card. Used both inside a column (as a
 * draggable wrapper) and inside the DragOverlay (as a plain visual).
 *
 * We split it out so we can render the same look in two contexts:
 * - Inside a column: wrapped with drag behavior.
 * - In the overlay: just visuals, no drag logic.
 */
export function TaskCardVisual({ task, onEdit, onDelete }) {
  const priority = priorities[task.priority]

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 hover:border-violet-500/40 hover:bg-[var(--color-surface-hover)] transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-medium text-[var(--color-text)] leading-snug text-sm">
          {task.title}
        </h3>
        <div className="flex gap-1 shrink-0">
          {onEdit && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onEdit(task)}
              className="p-1 rounded hover:bg-violet-500/20 text-slate-500 hover:text-violet-400 transition-colors"
              title="Edit"
            >
              <Pencil size={13} />
            </button>
          )}
          {onDelete && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onDelete(task.id)}
              className="p-1 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-[var(--color-text-muted)] mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      <span
        className={`inline-block text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${priority.pill}`}
      >
        {priority.label}
      </span>
    </div>
  )
}

/**
 * The draggable wrapper around a task card.
 * Used inside columns. Adds drag behavior via useDraggable.
 */
export function TaskCard({ task, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing touch-none ${
        isDragging ? 'opacity-30' : ''
      }`}
    >
      <TaskCardVisual task={task} onEdit={onEdit} onDelete={onDelete} />
    </div>
  )
}
