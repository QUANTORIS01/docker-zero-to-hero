import { useState } from 'react'

export default function UrlForm({ onCreate, submitting }) {
  const [originalUrl, setOriginalUrl] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!originalUrl.trim()) {
      setError('URL is required')
      return
    }
    const payload = { original_url: originalUrl.trim() }
    if (expiresAt) {
      payload.expires_at = new Date(expiresAt).toISOString()
    }
    const ok = await onCreate(payload)
    if (ok) {
      setOriginalUrl('')
      setExpiresAt('')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-800 p-4 rounded-lg space-y-3"
    >
      <input
        type="url"
        placeholder="https://example.com/very/long/url"
        value={originalUrl}
        onChange={(e) => setOriginalUrl(e.target.value)}
        className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 outline-none"
      />
      <div className="flex gap-3">
        <input
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="flex-1 px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 outline-none text-sm"
        />
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded font-medium disabled:opacity-50"
        >
          {submitting ? '...' : 'Shorten'}
        </button>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <p className="text-xs text-slate-500">
        Leave the date empty to create a link that never expires.
      </p>
    </form>
  )
}
