import { useState } from 'react'
import Auth from './components/Auth'
import UrlList from './components/UrlList'

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('access_token'))
  const [username, setUsername] = useState(() => localStorage.getItem('username'))

  const handleAuthSuccess = ({ access, refresh, username: name }) => {
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    localStorage.setItem('username', name)
    setToken(access)
    setUsername(name)
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('username')
    setToken(null)
    setUsername(null)
  }

  if (!token) {
    return <Auth onSuccess={handleAuthSuccess} />
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-slate-100">
      <header className="flex-shrink-0 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">🔗 Shortener</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">@{username}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-400 hover:text-red-300"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <UrlList />
      </main>
    </div>
  )
}
