import { Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

const statusConfig = {
  pending: {
    label: 'Pending',
    pill: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    icon: Clock,
  },
  processing: {
    label: 'Processing',
    pill: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: Loader2,
  },
  done: {
    label: 'Done',
    pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: CheckCircle2,
  },
  failed: {
    label: 'Failed',
    pill: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    icon: AlertCircle,
  },
}

export default function TaskCard({ task }) {
  const config = statusConfig[task.status] || statusConfig.pending
  const Icon = config.icon
  const isProcessing = task.status === 'processing'

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-white text-sm leading-snug">
          {task.title}
        </h3>
        <span
          className={`flex items-center gap-1.5 shrink-0 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${config.pill}`}
        >
          <Icon size={11} className={isProcessing ? 'animate-spin' : ''} />
          {config.label}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-slate-400 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {task.result && (
        <div className="mt-3 pt-3 border-t border-slate-800">
          <p className="text-xs text-emerald-400">{task.result}</p>
        </div>
      )}

      <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500">
        <span>#{task.id}</span>
        <span>
          {new Date(task.created_at).toLocaleTimeString()}
        </span>
      </div>
    </div>
  )
}
