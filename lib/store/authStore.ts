'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiClient } from '../api'

export interface AuthUser {
  id: string
  national_id: string
  email?: string
  full_name?: string
  phone_number?: string | null
  role: 'citizen' | 'verifier' | 'admin'
  business_type?: string
}

export interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  error: string | null

  // Actions
  setUser: (user: AuthUser | null) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // API Actions
  loginCitizen: (identifier: string, password: string) => Promise<boolean>
  loginVerifier: (company_pan: string, password: string) => Promise<boolean>
  loginAdmin: (username: string, password: string) => Promise<boolean>
  registerCitizen: (data: any) => Promise<boolean>
  registerVerifier: (data: any) => Promise<boolean>
  logout: () => Promise<void>
  refreshAccessToken: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>(
  persist((set, get) => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: false,
    error: null,

    setUser: (user) => set({ user }),
    setTokens: (accessToken, refreshToken) => {
      set({ accessToken, refreshToken })
      apiClient.setAccessToken(accessToken)
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'auth-session',
          JSON.stringify({
            user: get().user,
            accessToken,
            refreshToken,
          })
        )
      }
    },
    clearAuth: () => {
      set({ user: null, accessToken: null, refreshToken: null, error: null })
      apiClient.setAccessToken(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-session')
      }
    },
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),

    loginCitizen: async (identifier, password) => {
      set({ isLoading: true, error: null })
      try {
        const response = await apiClient.post('/auth/citizen/login', {
          identifier,
          password,
        }, { requireAuth: false })

        if (!response.success) {
          set({ error: response.error || 'Login failed', isLoading: false })
          return false
        }

        const { access_token, refresh_token, citizen } = response.data as any

        const user: AuthUser = {
          id: citizen.user_id || citizen.id,
          national_id: citizen.national_id || identifier,
          email: citizen.email,
          full_name: citizen.full_name,
          phone_number: citizen.phone_number,
          role: 'citizen',
        }

        set({
          user,
          accessToken: access_token,
          refreshToken: refresh_token,
          isLoading: false,
        })

        apiClient.setAccessToken(access_token)

        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'auth-session',
            JSON.stringify({
              user,
              accessToken: access_token,
              refreshToken: refresh_token,
            })
          )
        }

        return true
      } catch (error: any) {
        set({ error: error.message, isLoading: false })
        return false
      }
    },

    loginVerifier: async (company_pan, password) => {
      set({ isLoading: true, error: null })
      try {
        const response = await apiClient.post('/auth/verifier/login', {
          company_pan,
          password,
        }, { requireAuth: false })

        if (!response.success) {
          set({ error: response.error || 'Login failed', isLoading: false })
          return false
        }

        const { access_token, refresh_token, verifier } = response.data as any

        const user: AuthUser = {
          id: verifier.user_id || verifier.id,
          national_id: company_pan,
          role: 'verifier',
          business_type: verifier.business_type,
        }

        set({
          user,
          accessToken: access_token,
          refreshToken: refresh_token,
          isLoading: false,
        })

        apiClient.setAccessToken(access_token)

        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'auth-session',
            JSON.stringify({
              user,
              accessToken: access_token,
              refreshToken: refresh_token,
            })
          )
        }

        return true
      } catch (error: any) {
        set({ error: error.message, isLoading: false })
        return false
      }
    },

    loginAdmin: async (username, password) => {
      set({ isLoading: true, error: null })
      try {
        const response = await apiClient.post('/auth/admin/login', {
          username,
          password,
        }, { requireAuth: false })

        if (!response.success) {
          set({ error: response.error || 'Login failed', isLoading: false })
          return false
        }

        const { access_token, refresh_token, admin } = response.data as any

        const user: AuthUser = {
          id: admin.id,
          national_id: admin.national_id,
          role: 'admin',
        }

        set({
          user,
          accessToken: access_token,
          refreshToken: refresh_token,
          isLoading: false,
        })

        apiClient.setAccessToken(access_token)

        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'auth-session',
            JSON.stringify({
              user,
              accessToken: access_token,
              refreshToken: refresh_token,
            })
          )
        }

        return true
      } catch (error: any) {
        set({ error: error.message, isLoading: false })
        return false
      }
    },

    registerCitizen: async (data) => {
      set({ isLoading: true, error: null })
      try {
        const response = await apiClient.post('/auth/citizen/register', data, { requireAuth: false })

        if (!response.success) {
          set({ error: response.error || 'Registration failed', isLoading: false })
          return false
        }

        const { access_token, refresh_token } = response.data as any

        const user: AuthUser = {
          id: response.data?.citizen?.user_id || response.data?.citizen?.id || data.email,
          national_id: response.data?.citizen?.national_id || '',
          email: data.email,
          full_name: data.full_name,
          phone_number: data.phone_number,
          role: 'citizen',
        }

        set({
          user,
          accessToken: access_token,
          refreshToken: refresh_token,
          isLoading: false,
        })

        apiClient.setAccessToken(access_token)

        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'auth-session',
            JSON.stringify({
              user,
              accessToken: access_token,
              refreshToken: refresh_token,
            })
          )
        }

        return true
      } catch (error: any) {
        set({ error: error.message, isLoading: false })
        return false
      }
    },

    registerVerifier: async (data) => {
      set({ isLoading: true, error: null })
      try {
        const response = await apiClient.post('/auth/verifier/register', data, { requireAuth: false })

        if (!response.success) {
          set({ error: response.error || 'Registration failed', isLoading: false })
          return false
        }

        const { access_token, refresh_token, verifier } = response.data as any

        const user: AuthUser = {
          id: verifier.id,
          national_id: data.company_pan,
          role: 'verifier',
          business_type: verifier.business_type,
        }

        set({
          user,
          accessToken: access_token,
          refreshToken: refresh_token,
          isLoading: false,
        })

        apiClient.setAccessToken(access_token)

        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'auth-session',
            JSON.stringify({
              user,
              accessToken: access_token,
              refreshToken: refresh_token,
            })
          )
        }

        return true
      } catch (error: any) {
        set({ error: error.message, isLoading: false })
        return false
      }
    },

    logout: async () => {
      await apiClient.post('/auth/logout', {}, { requireAuth: true })
      set({ user: null, accessToken: null, refreshToken: null, error: null })
      apiClient.setAccessToken(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-session')
      }
    },

    refreshAccessToken: async () => {
      const state = get()
      if (!state.refreshToken) return false

      try {
        const response = await apiClient.post('/auth/refresh', {}, { requireAuth: true })

        if (!response.success) {
          get().clearAuth()
          return false
        }

        const { access_token } = response.data as any
        get().setTokens(access_token, state.refreshToken)
        return true
      } catch (error) {
        get().clearAuth()
        return false
      }
    },
  }), {
    name: 'auth-store',
    partialize: (state) => ({
      user: state.user,
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
    }),
    onRehydrateStorage: () => (state) => {
      if (state?.accessToken) {
        apiClient.setAccessToken(state.accessToken)
      }
    },
  })
)
