import { useEffect, useRef, useState } from 'react'
import Header from './components/Header'
import TaskForm from './components/TaskForm'
import TaskCard from './components/TaskCard'
import Loading from './components/Loading'
import { taskApi } from './api'

const POLL_INTERVAL_MS = 2000

export default function App() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)

  const fetchTasks = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true)
      const data = await taskApi.list()
      setTasks(data)
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load tasks')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks(true)

    intervalRef.current = setInterval(() => {
      fetchTasks(false)
    }, POLL_INTERVAL_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const handleCreate = async (data) => {
    try {
      setSubmitting(true)
      await taskApi.create(data)
      await fetchTasks(false)
      return true
    } catch (err) {
      setError(err.message || 'Failed to create task')
      return false
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Task Runner</h1>
          <p className="text-slate-400">
            Create a task. A background worker will process it in 10 seconds.
          </p>
        </div>

        <TaskForm onSubmit={handleCreate} submitting={submitting} />

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <section>
          <h2 className="text-lg font-semibold text-white mb-4">
            All tasks ({tasks.length})
          </h2>

          {loading ? (
            <Loading />
          ) : tasks.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              No tasks yet. Create one above.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
