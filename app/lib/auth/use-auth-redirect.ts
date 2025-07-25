import { useEffect } from 'react'
import { useRouter, usePathname } from '@/app/i18n/navigation'
import { useAuthStore } from '@/app/lib/auth/auth-store'
import { openSignApiService } from '@/app/lib/api-service'

/**
 * Hook to ensure authentication requirements are met
 * Automatically redirects to login if no token exists
 */
export function useAuthRedirect() {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, logout } = useAuthStore()

  // Define public paths that don't require authentication
  const publicPaths = [
    "/auth/login", 
    "/auth/signup", 
    "/", 
    "/features", 
    "/pricing", 
    "/contact", 
    "/terms", 
    "/privacy"
  ]

  // Check if current path requires authentication
  const requiresAuth = !publicPaths.some(path => pathname.startsWith(path))

  useEffect(() => {
    if (requiresAuth) {
      const sessionToken = openSignApiService.getSessionToken()
      
      // If no token exists, immediately redirect to login
      if (!sessionToken || sessionToken.trim() === '') {
        console.log("useAuthRedirect: No session token found, redirecting to login")
        logout() // Clear any stale auth state
        router.push('/auth/login')
        return
      }

      // If we have a token but auth store says not authenticated, validate it
      if (!isAuthenticated) {
        console.log("useAuthRedirect: Token exists but not authenticated in store")
        // The AuthGuard will handle the validation
      }
    }
  }, [pathname, requiresAuth, isAuthenticated, logout, router])

  return {
    requiresAuth,
    hasToken: !!openSignApiService.getSessionToken(),
    isAuthenticated
  }
}
