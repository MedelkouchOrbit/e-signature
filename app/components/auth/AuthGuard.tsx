"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/app/lib/auth/auth-store"
import { useAuth } from "@/app/lib/auth/use-auth-query"
import { useRouter, usePathname } from "@/app/i18n/navigation"
import { useTranslations } from "next-intl"
import { Skeleton } from "@/components/ui/skeleton"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, logout } = useAuthStore()
  const { sessionQuery } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations("AuthGuard")
  const [isValidating, setIsValidating] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Define public paths that do not require authentication
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

  // Check if the current path is a public path
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  // Set client flag after hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Function to validate session token with OpenSign API
  const validateSession = useCallback(async () => {
    if (typeof window === 'undefined') return false
    
    const sessionToken = openSignApiService.getSessionToken()
    
    if (!sessionToken) {
      return false
    }

    try {
      // Try to verify session with OpenSign API
      await authApiService.verifySession()
      return true
    } catch (error) {
      console.log("AuthGuard: Session validation failed, token may be expired:", error)
      // Clear expired token
      openSignApiService.clearSessionToken()
      return false
    }
  }, [])

  // Function to handle authentication failure
  const handleAuthFailure = useCallback(() => {
    console.log("AuthGuard: Authentication failed, clearing session and redirecting to login.")
    logout()
    if (typeof window !== 'undefined') {
      openSignApiService.clearSessionToken()
    }
    router.push("/auth/login")
  }, [logout, router])

  // Check token immediately on render for protected routes - CLIENT SIDE ONLY
  const sessionToken = (!isPublicPath && isClient && typeof window !== 'undefined') 
    ? openSignApiService.getSessionToken() 
    : null
  const hasValidToken = sessionToken && sessionToken.trim() !== ''

  useEffect(() => {
    // Only validate session for protected routes on client side
    if (!isPublicPath && isClient && typeof window !== 'undefined') {
      const sessionToken = openSignApiService.getSessionToken()
      
      // If no session token exists, immediately redirect
      if (!sessionToken || sessionToken.trim() === '') {
        console.log("AuthGuard: No session token found in localStorage, redirecting immediately")
        handleAuthFailure()
        return
      }

      // If not authenticated in store but we have a token, validate it
      if (!isAuthenticated) {
        setIsValidating(true)
        validateSession().then((isValid) => {
          setIsValidating(false)
          if (!isValid) {
            console.log("AuthGuard: Session validation failed, redirecting to login.")
            handleAuthFailure()
          }
        }).catch(() => {
          setIsValidating(false)
          console.log("AuthGuard: Session validation error, redirecting to login.")
          handleAuthFailure()
        })
      }
    }
  }, [isAuthenticated, isPublicPath, pathname, router, logout, handleAuthFailure, validateSession, hasValidToken, isClient])

  // For protected routes, ALWAYS block access if no valid token - even more aggressive
  if (!isPublicPath && isClient && typeof window !== 'undefined') {
    const currentToken = openSignApiService.getSessionToken()
    if (!currentToken || currentToken.trim() === '') {
      console.log("AuthGuard: Blocking access - no valid session token found")
      // Force immediate redirect
      setTimeout(() => {
        handleAuthFailure()
      }, 0)
      return (
        <div className="flex flex-col min-h-[100dvh] items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Authentication Required</h2>
            <p className="text-gray-600">Redirecting to login...</p>
          </div>
        </div>
      )
    }
  }

  // Show loading while validating session or not yet client-side
  if (!isPublicPath && (!isClient || isValidating || (!isAuthenticated && hasValidToken))) {
    return (
      <div className="flex flex-col min-h-[100dvh] items-center justify-center p-4">
        <Skeleton className="h-14 w-full max-w-screen-xl mb-8" /> {/* Nav skeleton */}
        <div className="flex-1 w-full max-w-screen-xl grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-64 w-full" /> {/* Content skeleton */}
          <Skeleton className="h-64 w-full" /> {/* Content skeleton */}
        </div>
        <Skeleton className="h-10 w-full max-w-screen-xl mt-8" /> {/* Footer skeleton */}
        <p className="mt-4 text-gray-500 dark:text-gray-400">{isClient ? "Access Denied" : t("loadingMessage")}</p>
      </div>
    )
  }

  // Show loading while validating session OR when no token on protected routes
  if (isValidating || (!isAuthenticated && !isPublicPath)) {
    return (
      <div className="flex flex-col min-h-[100dvh] items-center justify-center p-4">
        <Skeleton className="h-14 w-full max-w-screen-xl mb-8" /> {/* Nav skeleton */}
        <div className="flex-1 w-full max-w-screen-xl grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-64 w-full" /> {/* Content skeleton */}
          <Skeleton className="h-64 w-full" /> {/* Content skeleton */}
        </div>
        <Skeleton className="h-10 w-full max-w-screen-xl mt-8" /> {/* Footer skeleton */}
        <p className="mt-4 text-gray-500 dark:text-gray-400">{t("loadingMessage")}</p>
      </div>
    )
  }

  // If authenticated or on a public path, render the children
  return <>{children}</>
}
