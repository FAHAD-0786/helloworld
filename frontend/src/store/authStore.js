import { create } from 'zustand'
import api from '../utils/api'

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('pp_user') || 'null'),
  token: localStorage.getItem('pp_token') || null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const fd = new FormData()
      fd.append('username', email)
      fd.append('password', password)
      const res = await api.post('/auth/token', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const { access_token, user } = res.data
      localStorage.setItem('pp_token', access_token)
      localStorage.setItem('pp_user', JSON.stringify(user))
      set({ token: access_token, user, isLoading: false })
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed'
      set({ isLoading: false, error: msg })
      return { success: false, error: msg }
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null })
    try {
      await api.post('/auth/register', data)
      set({ isLoading: false })
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed'
      set({ isLoading: false, error: msg })
      return { success: false, error: msg }
    }
  },

  logout: () => {
    localStorage.removeItem('pp_token')
    localStorage.removeItem('pp_user')
    set({ user: null, token: null })
  },

  clearError: () => set({ error: null }),
}))

export default useAuthStore
