import { defineStore } from 'pinia'
import http from '@/api/http'

export const useAuth = defineStore('auth', {
  state: () => ({
    user: null,
    access: null
  }),
  getters: {
    isLogged: (s) => !!s.access,
    role: (s) => s.user?.role || null
  },
  actions: {
    async register(payload) {
      const { data } = await http.post('/auth/register', payload)
      return data
    },
    async verify(payload) {
      const { data } = await http.post('/auth/verify', payload)
      return data
    },
    async login(payload) {
      const { data } = await http.post('/auth/login', payload)
      this.user = data.user
      this.access = data.access
      return data
    },
    logout() {
      this.user = null
      this.access = null
    }
  },
  persist: false
})
