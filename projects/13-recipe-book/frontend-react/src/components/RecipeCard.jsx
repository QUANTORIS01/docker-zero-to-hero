import { Clock, Users } from 'lucide-react'

export default function RecipeCard({ recipe, onClick }) {
  return (
    <article
      onClick={onClick}
      className="group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden cursor-pointer hover:border-violet-500/40 transition-all hover:-translate-y-1"
    >
      <div className="aspect-[4/3] bg-slate-800 overflow-hidden">
        {recipe.photo ? (
          <img
            src={recipe.photo}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 text-4xl">
            🍽️
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
            {recipe.category_display}
          </span>
          <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {recipe.difficulty_display}
          </span>
        </div>
        <h3 className="font-semibold text-white mb-1 line-clamp-1">
          {recipe.title}
        </h3>
        <p className="text-sm text-slate-400 line-clamp-2 mb-3">
          {recipe.description}
        </p>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock size={12} /> {recipe.total_time_minutes} min
          </span>
          <span className="flex items-center gap-1">
            <Users size={12} /> {recipe.servings} servings
          </span>
        </div>
      </div>
    </article>
  )
}
