import { useState } from 'react'
import { authApi } from '../api'

export default function Auth({ onSuccess }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'register') {
        await authApi.register(username, password)
      }
      const tokens = await authApi.login(username, password)
      onSuccess({ ...tokens, username })
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
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 bg-slate-800 p-8 rounded-lg shadow-xl"
      >
        <h1 className="text-2xl font-bold text-center">🔖 Bookmarks</h1>
        <p className="text-center text-slate-400 text-sm">
          {mode === 'login' ? 'Sign in to continue' : 'Create a new account'}
        </p>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
          className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 outline-none"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 outline-none"
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded font-medium disabled:opacity-50"
        >
          {loading ? '...' : mode === 'login' ? 'Sign in' : 'Register'}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login')
            setError(null)
          }}
          className="w-full text-sm text-slate-400 hover:text-slate-300"
        >
          {mode === 'login'
            ? 'Need an account? Register'
            : 'Have an account? Sign in'}
        </button>
      </form>
    </div>
  )
}
