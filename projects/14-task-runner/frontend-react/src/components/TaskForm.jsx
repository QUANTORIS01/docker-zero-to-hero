import { useState } from 'react'
import { Send } from 'lucide-react'

export default function TaskForm({ onSubmit, submitting }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    const ok = await onSubmit({ title, description, email })
    if (ok) {
      setTitle('')
      setDescription('')
      setEmail('')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8"
    >
      <h2 className="text-lg font-semibold text-white mb-4">Create a new task</h2>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Task title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
        />

        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
        />

        <input
          type="email"
          placeholder="Email (optional, for notification)"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
        />

        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-500 text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={16} />
          {submitting ? 'Sending...' : 'Create task'}
        </button>
      </div>
    </form>
  )
}
