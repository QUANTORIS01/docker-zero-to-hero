import { useEffect, useRef, useState } from 'react'
import { messageApi } from '../api'

export default function ChatRoom({ room, username, onBack }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)
  const wsRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Load message history
  useEffect(() => {
    let cancelled = false
    messageApi
      .list(room.slug)
      .then((data) => {
        if (!cancelled) setMessages(data.results || data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [room.slug])

  // Connect WebSocket
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${protocol}//${window.location.host}/ws/chat/${room.slug}/?token=${token}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setError('WebSocket error')
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setMessages((prev) => [
          ...prev,
          {
            id: data.id,
            content: data.message,
            author: { username: data.author },
            created_at: data.created_at,
          },
        ])
      } catch (e) {
        console.error('bad ws message', e)
      }
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [room.slug])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify({ message: text }))
    setInput('')
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-slate-700">
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-slate-200"
        >
          ← Back
        </button>
        <h2 className="font-semibold">#{room.name}</h2>
        <span
          className={`text-xs ml-auto ${
            connected ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {connected ? '● connected' : '● disconnected'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        {messages.length === 0 && !error && (
          <p className="text-slate-500 text-sm text-center">
            No messages yet. Say hi! 👋
          </p>
        )}
        {messages.map((m) => {
          const mine = m.author?.username === username
          return (
            <div
              key={m.id}
              className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg ${
                  mine ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                {!mine && (
                  <div className="text-xs text-slate-300 mb-1">
                    @{m.author?.username}
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap break-words">
                  {m.content}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="flex-shrink-0 flex gap-2 p-4 border-t border-slate-700"
      >
        <input
          type="text"
          placeholder={connected ? 'Type a message...' : 'Connecting...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!connected}
          className="flex-1 px-3 py-2 bg-slate-800 rounded border border-slate-700 focus:border-blue-500 outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!connected || !input.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-medium disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}