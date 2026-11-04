import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// ─────────────────────────────────────────────────────────────
// Request interceptor: attach access token from localStorage
// ─────────────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─────────────────────────────────────────────────────────────
// Response interceptor: on 401, try refresh, retry once
// Uses a shared promise so concurrent 401s refresh only once
// ─────────────────────────────────────────────────────────────
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

    // Only handle 401 once per request, and never on the refresh call
    if (status === 401 && !original._retry && !original.url.includes('/auth/refresh')) {
      const refresh = localStorage.getItem('refresh_token')
      if (!refresh) {
        handleAuthFailure()
        return Promise.reject(error)
      }

      original._retry = true
      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post('/api/auth/refresh/', { refresh })
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

// ─────────────────────────────────────────────────────────────
// API surface — token is added automatically by the interceptor
// ─────────────────────────────────────────────────────────────
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

export const roomApi = {
  list: async () => {
    const res = await api.get('/rooms/')
    return res.data
  },
  create: async (name) => {
    const res = await api.post('/rooms/', { name })
    return res.data
  },
}

export const messageApi = {
  list: async (roomSlug) => {
    const res = await api.get(`/rooms/${roomSlug}/messages/`)
    return res.data
  },
}