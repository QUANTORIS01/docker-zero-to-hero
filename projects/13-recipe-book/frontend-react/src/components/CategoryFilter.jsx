const categories = [
  { id: '', label: 'All' },
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'dessert', label: 'Dessert' },
  { id: 'snack', label: 'Snack' },
]

export default function CategoryFilter({ value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            value === cat.id
              ? 'bg-violet-600 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  )
}
