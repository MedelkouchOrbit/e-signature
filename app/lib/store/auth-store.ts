import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { openSignApiService } from '../api-service'
import type { OpenSignLoginResponse } from '../auth/auth-types'

export interface User {
  objectId: string
  username: string
  email: string
  name: string
  phone?: string
  createdAt: string
  updatedAt: string
  sessionToken: string
  isActive?: boolean
  activationStatus?: 'pending_approval' | 'approved' | 'rejected'
  role?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  clearError: () => void
  getCurrentUser: () => Promise<User | null>
  setUser: (user: User) => void
  checkAuthStatus: () => Promise<boolean>
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        
        try {
          console.log('[Auth Store] Attempting login for:', email)
          
          const response = await openSignApiService.callFunction<OpenSignLoginResponse>('loginuser', {
            email,
            password
          })

          if (response && response.objectId && response.sessionToken) {
            const user: User = {
              objectId: response.objectId,
              username: response.username || response.email,
              email: response.email,
              name: response.name || response.username || response.email,
              phone: typeof response.phone === 'string' ? response.phone : undefined,
              createdAt: response.createdAt,
              updatedAt: response.updatedAt,
              sessionToken: response.sessionToken,
              isActive: response.isActive,
              activationStatus: response.activationStatus
            }

            // Store session token in API service
            openSignApiService.setSessionToken(response.sessionToken)
            
            // Update store state
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null
            })

            console.log('[Auth Store] Login successful:', user)
          } else {
            throw new Error('Invalid login response')
          }
        } catch (error) {
          console.error('[Auth Store] Login failed:', error)
          const errorMessage = error instanceof Error ? error.message : 'Login failed'
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage
          })
          
          throw error
        }
      },

      logout: () => {
        console.log('[Auth Store] Logging out')
        
        // Clear session token from API service
        openSignApiService.clearSessionToken()
        
        // Clear store state
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        })
      },

      clearError: () => {
        set({ error: null })
      },

      getCurrentUser: async () => {
        const { user } = get()
        
        if (!user?.sessionToken) {
          return null
        }

        try {
          console.log('[Auth Store] Fetching current user details')
          
          // Use the Parse Server REST API endpoint for getting current user
          const userDetails = await openSignApiService.get<{ results: User[] }>('classes/_User', {
            where: { objectId: user.objectId },
            limit: 1
          })

          if (userDetails.results && userDetails.results.length > 0) {
            const updatedUser = { ...user, ...userDetails.results[0] }
            set({ user: updatedUser })
            return updatedUser
          }

          return user
        } catch (error) {
          console.error('[Auth Store] Failed to fetch user details:', error)
          return user // Return cached user if API call fails
        }
      },

      setUser: (user: User) => {
        set({ 
          user, 
          isAuthenticated: true,
          error: null 
        })
        
        // Also set session token in API service
        if (user.sessionToken) {
          openSignApiService.setSessionToken(user.sessionToken)
        }
      },

      checkAuthStatus: async () => {
        const { user } = get()
        
        if (!user?.sessionToken) {
          set({ isAuthenticated: false })
          return false
        }

        try {
          // Verify session by getting user details
          const currentUser = await get().getCurrentUser()
          const isValid = currentUser !== null
          
          set({ isAuthenticated: isValid })
          return isValid
        } catch (error) {
          console.error('[Auth Store] Auth check failed:', error)
          set({ 
            user: null, 
            isAuthenticated: false,
            error: 'Session expired'
          })
          return false
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
