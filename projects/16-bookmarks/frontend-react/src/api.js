import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401, refresh once and retry (single-flight refresh)
let refreshPromise = null
function handleAuthFailure() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('username')
  window.location.reload()
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    if (status === 401 && !original._retry && !original.url.includes('/auth/refresh')) {
      const refresh = localStorage.getItem('refresh_token')
      if (!refresh) {
        handleAuthFailure()
        return Promise.reject(error)
      }
      original._retry = true
      try {
        if (!refreshPromise) {
          refreshPromise = axios.post('/api/auth/refresh/', { refresh })
            .finally(() => { refreshPromise = null })
        }
        const { data } = await refreshPromise
        localStorage.setItem('access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch (e) {
        handleAuthFailure()
        return Promise.reject(e)
      }
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  register: async (username, password) => {
    const res = await api.post('/auth/register/', { username, password })
    return res.data
  },
  login: async (username, password) => {
    const res = await api.post('/auth/login/', { username, password })
    return res.data
  },
}

export const bookmarkApi = {
  list: async (params = {}) => {
    const res = await api.get('/bookmarks/', { params })
    return res.data
  },
  create: async (data) => {
    const res = await api.post('/bookmarks/', data)
    return res.data
  },
  update: async (id, data) => {
    const res = await api.patch(`/bookmarks/${id}/`, data)
    return res.data
  },
  remove: async (id) => {
    await api.delete(`/bookmarks/${id}/`)
  },
  stats: async () => {
    const res = await api.get('/bookmarks/stats/')
    return res.data
  },
}
