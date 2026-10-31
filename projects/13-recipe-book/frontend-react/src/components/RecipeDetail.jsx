import { ArrowLeft, Clock, Users, Flame } from 'lucide-react'

export default function RecipeDetail({ recipe, onBack }) {
  return (
    <main className="max-w-4xl mx-auto px-6 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={18} /> Back to recipes
      </button>

      <div className="mb-6">
        {recipe.photo && (
          <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden mb-6">
            <img
              src={recipe.photo}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex gap-2 mb-3">
          <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
            {recipe.category_display}
          </span>
          <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {recipe.difficulty_display}
          </span>
        </div>

        <h1 className="text-4xl font-bold text-white mb-3">{recipe.title}</h1>
        <p className="text-slate-400 mb-6">{recipe.description}</p>

        <div className="flex flex-wrap gap-6 text-sm text-slate-400 mb-8 pb-8 border-b border-slate-800">
          <span className="flex items-center gap-2">
            <Clock size={16} /> Prep: {recipe.prep_time_minutes} min
          </span>
          <span className="flex items-center gap-2">
            <Flame size={16} /> Cook: {recipe.cook_time_minutes} min
          </span>
          <span className="flex items-center gap-2">
            <Users size={16} /> {recipe.servings} servings
          </span>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Ingredients</h2>
        <ul className="space-y-2 text-slate-300">
          {recipe.ingredients
            .split('\n')
            .filter(item => item.trim())
            .map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-violet-400 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">Instructions</h2>
        <ol className="space-y-4 text-slate-300">
          {recipe.instructions
            .split('\n')
            .filter(step => step.trim())
            .map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="shrink-0 w-7 h-7 rounded-full bg-violet-500/20 text-violet-300 flex items-center justify-center text-sm font-semibold">
                  {i + 1}
                </span>
                <span className="pt-1">{step}</span>
              </li>
            ))}
        </ol>
      </section>
    </main>
  )
}
