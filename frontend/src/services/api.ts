/// <reference types="vite/client" />
import axios from 'axios'
import type { 
  LoginRequest, 
  RegisterRequest, 
  AddURLRequest, 
  BulkActionRequest,
  AuthResponse,
  URLListResponse,
  URL
} from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect for auth endpoints (login/register) to allow error display
      const isAuthEndpoint = error.config?.url?.includes('/api/auth/login') || 
                            error.config?.url?.includes('/api/auth/register')
      
      if (!isAuthEndpoint) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/login', data)
    return response.data
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/register', data)
    return response.data
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await api.post('/api/auth/logout')
    return response.data
  },
}

// URL API
export const urlAPI = {
  list: async (params?: {
    page?: number
    page_size?: number
    search?: string
    sort_by?: string
    sort_order?: string
  }): Promise<URLListResponse> => {
    const response = await api.get('/api/urls', { params })
    return response.data
  },

  add: async (data: AddURLRequest): Promise<URL> => {
    const response = await api.post('/api/urls', data)
    return response.data
  },

  get: async (id: number): Promise<URL> => {
    const response = await api.get(`/api/urls/${id}`)
    return response.data
  },

  rerun: async (id: number): Promise<{ message: string }> => {
    const response = await api.put(`/api/urls/${id}/rerun`)
    return response.data
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/api/urls/${id}`)
    return response.data
  },

  bulkDelete: async (data: BulkActionRequest): Promise<{ message: string; deleted_count: number }> => {
    const response = await api.post('/api/urls/bulk-delete', data)
    return response.data
  },

  bulkRerun: async (data: BulkActionRequest): Promise<{ message: string; url_count: number }> => {
    const response = await api.post('/api/urls/bulk-rerun', data)
    return response.data
  },
}

export default api 