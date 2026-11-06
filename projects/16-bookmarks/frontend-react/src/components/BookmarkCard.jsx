export default function BookmarkCard({ bookmark, onDelete }) {
  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-400 hover:text-blue-300 break-words"
          >
            {bookmark.title}
          </a>
          <p className="text-xs text-slate-500 mt-1 break-all">{bookmark.url}</p>
        </div>
        <button
          onClick={() => onDelete(bookmark.id)}
          className="text-red-400 hover:text-red-300 text-sm flex-shrink-0"
          title="Delete"
        >
          ✕
        </button>
      </div>

      {bookmark.description && (
        <p className="text-sm text-slate-300 mt-2">{bookmark.description}</p>
      )}

      {bookmark.tags_list?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {bookmark.tags_list.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500 mt-3">
        {new Date(bookmark.created_at).toLocaleString()}
      </p>
    </div>
  )
}
