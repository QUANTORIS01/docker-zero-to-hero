import { useEffect, useState } from 'react'
import { roomApi } from '../api'

export default function RoomsList({ onSelectRoom }) {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)

  const fetchRooms = async () => {
    try {
      const data = await roomApi.list()
      setRooms(data.results || data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setError(null)
    try {
      await roomApi.create(newName.trim())
      setNewName('')
      await fetchRooms()
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const key = Object.keys(data)[0]
        const val = data[key]
        setError(Array.isArray(val) ? val[0] : String(val))
      } else {
        setError(err.message)
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 h-full overflow-y-auto">
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          type="text"
          placeholder="New room name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 px-3 py-2 bg-slate-800 rounded border border-slate-700 focus:border-blue-500 outline-none"
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-medium disabled:opacity-50"
        >
          {creating ? '...' : 'Create'}
        </button>
      </form>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {loading ? (
        <p className="text-slate-400 text-center">Loading rooms...</p>
      ) : rooms.length === 0 ? (
        <p className="text-slate-400 text-center">
          No rooms yet. Create the first one!
        </p>
      ) : (
        <ul className="space-y-2">
          {rooms.map((room) => (
            <li key={room.id}>
              <button
                onClick={() => onSelectRoom(room)}
                className="w-full text-left px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-between transition-colors"
              >
                <span className="font-medium">#{room.name}</span>
                <span className="text-sm text-slate-400">
                  {room.message_count} messages
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}