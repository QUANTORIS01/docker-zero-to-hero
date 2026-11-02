import { Zap } from 'lucide-react'

export default function Header() {
  return (
    <header className="border-b border-slate-800 sticky top-0 z-40 bg-slate-950/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="text-violet-500" size={26} />
          <span className="text-xl font-bold bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent">
            Task Runner
          </span>
        </div>
        <a
          href="/admin/"
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          Admin
        </a>
      </div>
    </header>
  )
}
