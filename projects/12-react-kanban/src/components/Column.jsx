import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { TaskCard } from './TaskCard'

export function Column({ column, tasks, onEdit, onDelete, onAddTask }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { column },
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col bg-white/[0.02] border rounded-xl p-4 min-h-[500px] transition-colors ${
        isOver
          ? 'border-violet-500/50 bg-violet-500/5'
          : 'border-[var(--color-border)]'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className={`font-semibold text-sm ${column.accent}`}>
            {column.title}
          </h2>
          <span className="text-xs bg-white/5 text-slate-400 px-2 py-0.5 rounded-full font-medium">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(column.id)}
          className="p-1 rounded hover:bg-violet-500/20 text-slate-500 hover:text-violet-400 transition-colors"
          title="Add task"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}

        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-500 border border-dashed border-[var(--color-border)] rounded-lg py-8">
            No tasks yet
          </div>
        )}
      </div>
    </div>
  )
}
