import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api/client'

interface User {
  id: string
  username: string
  nickname: string
  role: string
  avatarUrl?: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const refreshToken = ref(localStorage.getItem('refreshToken') || '')
  const user = ref<User | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const isKP = computed(() => user.value?.role === 'KP' || user.value?.role === 'ADMIN')
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  async function login(username: string, password: string) {
    const res = await api.post('/auth/login', { username, password })
    token.value = res.data.accessToken
    refreshToken.value = res.data.refreshToken
    user.value = res.data.user
    localStorage.setItem('token', token.value)
    localStorage.setItem('refreshToken', refreshToken.value)
    return res.data
  }

  async function register(data: { username: string; password: string; email?: string; nickname?: string }) {
    return api.post('/auth/register', data)
  }

  async function fetchMe() {
    if (!token.value) return
    try {
      const res = await api.get('/users/me')
      user.value = res.data
    } catch {
      logout()
    }
  }

  function logout() {
    token.value = ''
    refreshToken.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
  }

  return { token, refreshToken, user, isLoggedIn, isKP, isAdmin, login, register, fetchMe, logout }
})
