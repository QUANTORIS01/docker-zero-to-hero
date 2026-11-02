import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

export const taskApi = {
  list: async () => {
    const response = await api.get('/tasks/')
    return response.data.results || response.data
  },

  detail: async (id) => {
    const response = await api.get(`/tasks/${id}/`)
    return response.data
  },

  create: async (data) => {
    const response = await api.post('/tasks/', data)
    return response.data
  },
}

export default api
