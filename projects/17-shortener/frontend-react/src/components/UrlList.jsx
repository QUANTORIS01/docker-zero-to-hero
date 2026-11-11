import { useCallback, useEffect, useState } from 'react'
import { urlApi } from '../api'
import UrlCard from './UrlCard'
import UrlForm from './UrlForm'

export default function UrlList() {
  const [urls, setUrls] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [q, setQ] = useState('')
  const [stats, setStats] = useState({ total_links: 0, total_clicks: 0 })

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const [list, st] = await Promise.all([
        urlApi.list({ q }),
        urlApi.stats(),
      ])
      setUrls(list.results || list)
      setStats(st)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [q])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleCreate = async (data) => {
    try {
      setSubmitting(true)
      await urlApi.create(data)
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
    if (!confirm('Delete this short link?')) return
    try {
      await urlApi.remove(id)
      await fetchAll()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4 h-full overflow-y-auto">
      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
        <span>
          🔗 <strong className="text-slate-200">{stats.total_links}</strong> links
        </span>
        <span>
          👆 <strong className="text-slate-200">{stats.total_clicks}</strong> clicks total
        </span>
      </div>

      <UrlForm onCreate={handleCreate} submitting={submitting} />

      {/* Search */}
      <input
        type="text"
        placeholder="Search by URL or short code..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 focus:border-blue-500 outline-none"
      />

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {loading ? (
        <p className="text-slate-400 text-center py-8">Loading...</p>
      ) : urls.length === 0 ? (
        <p className="text-slate-400 text-center py-8">
          No links yet. Shorten your first URL!
        </p>
      ) : (
        <div className="space-y-3">
          {urls.map((u) => (
            <UrlCard key={u.id} item={u} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
