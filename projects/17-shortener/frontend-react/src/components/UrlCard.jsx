import { useState } from 'react'

export default function UrlCard({ item, onDelete }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(item.short_url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard may fail in some browsers, ignore
    }
  }

  const expired = item.is_expired

  return (
    <div
      className={`bg-slate-800 p-4 rounded-lg border transition-colors ${
        expired ? 'border-red-800 opacity-70' : 'border-slate-700 hover:border-slate-500'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <a
            href={item.short_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-blue-400 hover:text-blue-300 break-all"
          >
            {item.short_url}
          </a>
          <p className="text-xs text-slate-500 mt-1 break-all">
            {item.original_url}
          </p>
        </div>
        <button
          onClick={() => onDelete(item.id)}
          className="text-red-400 hover:text-red-300 text-sm flex-shrink-0"
          title="Delete"
        >
          ✕
        </button>
      </div>

      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={copyToClipboard}
          className="text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded"
        >
          {copied ? '✅ Copied!' : '📋 Copy'}
        </button>
        <span className="text-xs text-slate-400">
          👆 <strong className="text-slate-200">{item.clicks}</strong> clicks
        </span>
        {expired && (
          <span className="text-xs px-2 py-0.5 bg-red-900 text-red-300 rounded">
            expired
          </span>
        )}
        {item.expires_at && !expired && (
          <span className="text-xs text-slate-500">
            expires {new Date(item.expires_at).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  )
}
