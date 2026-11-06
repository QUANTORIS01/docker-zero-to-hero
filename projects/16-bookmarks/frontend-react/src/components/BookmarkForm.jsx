import { useState } from 'react'

export default function BookmarkForm({ onCreate, submitting }) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!url.trim() || !title.trim()) {
      setError('URL and title are required')
      return
    }
    const ok = await onCreate({
      url: url.trim(),
      title: title.trim(),
      description: description.trim(),
      tags: tags.trim(),
    })
    if (ok) {
      setUrl('')
      setTitle('')
      setDescription('')
      setTags('')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-800 p-4 rounded-lg space-y-3"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 outline-none"
        />
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 outline-none"
        />
      </div>
      <input
        type="text"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 outline-none"
      />
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Tags (comma separated, e.g. python,django)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="flex-1 px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 outline-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded font-medium disabled:opacity-50"
        >
          {submitting ? '...' : 'Add bookmark'}
        </button>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </form>
  )
}
