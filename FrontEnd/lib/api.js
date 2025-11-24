import axios from 'axios'
import { API_BASE_URL } from './constants'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('token')
    }
    return Promise.reject(error)
  }
)

// API methods
export const activityAPI = {
  // Get all activities
  getAll: async (params) => {
    const response = await api.get('/activities', { params })
    return response.data
  },

  // Get activity by ID
  getById: async (id) => {
    const response = await api.get(`/activities/${id}`)
    return response.data
  },

  // Create new activity
  create: async (data) => {
    const response = await api.post('/activities', data)
    return response.data
  },

  // Update activity
  update: async (id, data) => {
    const response = await api.put(`/activities/${id}`, data)
    return response.data
  },

  // Delete activity
  delete: async (id) => {
    const response = await api.delete(`/activities/${id}`)
    return response.data
  },

  // Get carbon stats
  getStats: async (period = 'week') => {
    const response = await api.get('/activities/stats', { params: { period } })
    return response.data
  },
}

export const recommendationAPI = {
  // Get personalized recommendations
  getRecommendations: async () => {
    const response = await api.get('/recommendations')
    return response.data
  },

  // Mark recommendation as completed
  complete: async (id) => {
    const response = await api.post(`/recommendations/${id}/complete`)
    return response.data
  },
}

export default api
