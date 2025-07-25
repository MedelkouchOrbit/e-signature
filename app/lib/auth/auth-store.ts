import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

interface AuthState {
  isAuthenticated: boolean
  user: { id: string; email: string } | null
  token: string | null
  login: (user: { id: string; email: string }, token: string) => void
  logout: () => void
  syncWithSessionToken: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      login: (user, token) => {
        set({ isAuthenticated: true, user, token })
        // Also set session token in localStorage and cookies for consistency
        if (typeof window !== 'undefined') {
          localStorage.setItem('opensign_session_token', token)
          // Set cookie for middleware access (expires in 24 hours)
          document.cookie = `opensign_session_token=${token}; path=/; max-age=86400; SameSite=Lax`
        }
      },
      logout: () => {
        set({ isAuthenticated: false, user: null, token: null })
        // Also clear session token from localStorage and cookies
        if (typeof window !== 'undefined') {
          localStorage.removeItem('opensign_session_token')
          // Clear cookie
          document.cookie = 'opensign_session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        }
      },
      syncWithSessionToken: () => {
        // This method syncs auth state with session token existence
        const currentState = get()
        if (typeof window !== 'undefined') {
          const sessionToken = localStorage.getItem('opensign_session_token')
          if (!sessionToken && currentState.isAuthenticated) {
            // If no session token but store says authenticated, logout
            set({ isAuthenticated: false, user: null, token: null })
          } else if (sessionToken && !currentState.isAuthenticated && sessionToken.trim() !== '') {
            // If we have a session token but store says not authenticated, 
            // this could happen after page refresh - validate with API
            console.log('Auth store: Found session token but not authenticated in store')
          }
        }
      },
    }),
    {
      name: "auth-storage", // name of the item in localStorage (or other storage)
      storage: createJSONStorage(() => localStorage), // Use localStorage for persistence
    },
  ),
)
