import axios from 'axios'

// Base URL for the Django API.
// In development, Vite's proxy forwards /api to http://localhost:8000.
// In production, Nginx forwards /api to the backend container.
// Either way, the browser only sees a relative path.
const api = axios.create({
  baseURL: '/api',
})

export const recipeApi = {
  /**
   * Fetch a list of recipes.
   * Supports optional filters: { search, category, difficulty }
   */
  list: async (params = {}) => {
    const response = await api.get('/recipes/', { params })
    // DRF returns paginated data: { count, next, previous, results }
    // We only care about `results`.
    return response.data.results || response.data
  },

  /**
   * Fetch a single recipe by ID.
   */
  detail: async (id) => {
    const response = await api.get(`/recipes/${id}/`)
    return response.data
  },
}

export default api
