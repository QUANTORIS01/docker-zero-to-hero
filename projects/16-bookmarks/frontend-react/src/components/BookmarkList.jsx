import { useCallback, useEffect, useState } from 'react'
import { bookmarkApi } from '../api'
import BookmarkCard from './BookmarkCard'
import BookmarkForm from './BookmarkForm'

export default function BookmarkList() {
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [q, setQ] = useState('')
  const [tag, setTag] = useState('')
  const [stats, setStats] = useState({ total: 0, top_tags: [] })

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const [list, st] = await Promise.all([
        bookmarkApi.list({ q, tag }),
        bookmarkApi.stats(),
      ])
      setBookmarks(list.results || list)
      setStats(st)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [q, tag])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleCreate = async (data) => {
    try {
      setSubmitting(true)
      await bookmarkApi.create(data)
      await fetchAll()
      return true
    } catch (err) {
      const d = err.response?.data
      if (d && typeof d === 'object') {
        const k = Object.keys(d)[0]
        const v = d[k]
        setError(Array.isArray(v) ? v[0] : String(v))
      } else {
        setError(err.message)
      }
      return false
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this bookmark?')) return
    try {
      await bookmarkApi.remove(id)
      await fetchAll()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4 h-full overflow-y-auto">
      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
        <span>
          📚 <strong className="text-slate-200">{stats.total}</strong> bookmarks
        </span>
        {stats.top_tags.map((t) => (
          <button
            key={t.name}
            onClick={() => setTag(tag === t.name ? '' : t.name)}
            className={`px-2 py-0.5 rounded text-xs ${
              tag === t.name
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            #{t.name} ({t.count})
          </button>
        ))}
      </div>

      <BookmarkForm onCreate={handleCreate} submitting={submitting} />

      {/* Search + tag filter */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search by title, URL, description or tag..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 px-3 py-2 bg-slate-800 rounded border border-slate-700 focus:border-blue-500 outline-none"
        />
        {tag && (
          <button
            onClick={() => setTag('')}
            className="px-3 py-2 bg-red-700 hover:bg-red-600 rounded text-sm"
          >
            clear #{tag}
          </button>
        )}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {loading ? (
        <p className="text-slate-400 text-center py-8">Loading...</p>
      ) : bookmarks.length === 0 ? (
        <p className="text-slate-400 text-center py-8">
          No bookmarks yet. Add the first one!
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {bookmarks.map((bm) => (
            <BookmarkCard key={bm.id} bookmark={bm} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
