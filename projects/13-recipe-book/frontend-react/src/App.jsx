import { useEffect, useState } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import CategoryFilter from './components/CategoryFilter'
import RecipeCard from './components/RecipeCard'
import RecipeDetail from './components/RecipeDetail'
import Loading from './components/Loading'
import { recipeApi } from './api'

export default function App() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState(null)

  // Load the list whenever search or category changes.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const params = {}
    if (search) params.search = search
    if (category) params.category = category

    recipeApi
      .list(params)
      .then(data => {
        if (!cancelled) setRecipes(data)
      })
      .catch(err => {
        if (!cancelled) setError(err.message || 'Failed to load recipes')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [search, category])

  // Load a single recipe when the user clicks a card.
  const handleSelectRecipe = async (id) => {
    try {
      const recipe = await recipeApi.detail(id)
      setSelectedRecipe(recipe)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen">
      <Header />

      {selectedRecipe ? (
        <RecipeDetail
          recipe={selectedRecipe}
          onBack={() => setSelectedRecipe(null)}
        />
      ) : (
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Recipe Book</h1>
            <p className="text-slate-400">
              Discover and share your favorite recipes.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <SearchBar value={search} onChange={setSearch} />
            <CategoryFilter value={category} onChange={setCategory} />
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <Loading />
          ) : recipes.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              No recipes found. Try a different search.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onClick={() => handleSelectRecipe(recipe.id)}
                />
              ))}
            </div>
          )}
        </main>
      )}
    </div>
  )
}
