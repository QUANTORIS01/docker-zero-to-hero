import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { Column } from './components/Column'
import { TaskCardVisual } from './components/TaskCard'
import { TaskModal } from './components/TaskModal'
import { useLocalStorage } from './hooks/useLocalStorage'
import { columns, initialTasks } from './data/initialData'

export default function App() {
  const [tasks, setTasks] = useLocalStorage('kanban-tasks', initialTasks)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [defaultStatus, setDefaultStatus] = useState('todo')
  const [filterPriority, setFilterPriority] = useState('all')
  const [activeTask, setActiveTask] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor),
  )

  const handleAddTask = (status) => {
    setEditingTask(null)
    setDefaultStatus(status)
    setIsModalOpen(true)
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setIsModalOpen(true)
  }

  const handleDeleteTask = (taskId) => {
    if (!window.confirm('Delete this task?')) return
    setTasks(tasks.filter(t => t.id !== taskId))
  }

  const handleSaveTask = (data) => {
    if (editingTask) {
      setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...data } : t))
    } else {
      const newTask = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      }
      setTasks([...tasks, newTask])
    }
    setIsModalOpen(false)

    if (filterPriority !== 'all' && data.priority !== filterPriority) {
      setFilterPriority('all')
    }
  }

  const handleDragStart = (event) => {
    const { active } = event
    const task = tasks.find(t => t.id === active.id)
    if (task) setActiveTask(task)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveTask(null)

    // Dropped outside any column - do nothing.
    if (!over) return

    const taskId = active.id
    const newStatus = over.id

    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // Dropped on the same column - nothing changes.
    if (task.status === newStatus) return

    // Move the task to the new column.
    setTasks(tasks.map(t =>
      t.id === taskId ? { ...t, status: newStatus } : t
    ))
  }

  const handleDragCancel = () => {
    setActiveTask(null)
  }

  const filteredTasks = filterPriority === 'all'
    ? tasks
    : tasks.filter(t => t.priority === filterPriority)

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--color-border)] sticky top-0 z-40 bg-[var(--color-bg)]/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent">
            Kanban Board
          </h1>
          <div className="flex items-center gap-3">
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
            >
              <option value="all">All priorities</option>
              <option value="high">High only</option>
              <option value="medium">Medium only</option>
              <option value="low">Low only</option>
            </select>
            <button
              onClick={() => handleAddTask('todo')}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-500 text-white px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
            >
              <Plus size={16} /> New task
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map(column => (
              <Column
                key={column.id}
                column={column}
                tasks={filteredTasks.filter(t => t.status === column.id)}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onAddTask={handleAddTask}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="rotate-3 shadow-2xl shadow-violet-500/30 opacity-95">
                <TaskCardVisual task={activeTask} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        defaultStatus={defaultStatus}
      />
    </div>
  )
}
