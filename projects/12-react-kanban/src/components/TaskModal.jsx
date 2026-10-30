import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { columns, priorities } from '../data/initialData'

export function TaskModal({ isOpen, onClose, onSave, task, defaultStatus }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [status, setStatus] = useState(defaultStatus || 'todo')

  // When the modal opens, populate the form with the task data (if editing)
  // or with defaults (if creating a new one).
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setPriority(task.priority)
      setStatus(task.status)
    } else {
      setTitle('')
      setDescription('')
      setPriority('medium')
      setStatus(defaultStatus || 'todo')
    }
  }, [task, defaultStatus, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return

    onSave({
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            {task ? 'Edit task' : 'New task'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:text-white hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs mb-1 text-[var(--color-text-muted)]">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs mb-1 text-[var(--color-text-muted)]">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 resize-none"
              placeholder="Optional details..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-xs mb-1 text-[var(--color-text-muted)]">
              Priority
            </label>
            <div className="flex gap-2">
              {Object.entries(priorities).map(([key, p]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPriority(key)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    priority === key
                      ? p.pill
                      : 'border-[var(--color-border)] text-slate-500 hover:border-slate-600'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1 text-[var(--color-text-muted)]">
              Status
            </label>
            <div className="flex gap-2">
              {columns.map(col => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => setStatus(col.id)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    status === col.id
                      ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                      : 'border-[var(--color-border)] text-slate-500 hover:border-slate-600'
                  }`}
                >
                  {col.title}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-[var(--color-border)] text-slate-400 hover:bg-white/5 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-medium text-sm hover:opacity-90"
            >
              {task ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
