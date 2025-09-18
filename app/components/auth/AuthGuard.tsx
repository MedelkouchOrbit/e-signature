"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { useAuthStore } from "@/app/lib/auth/auth-store"
import { useRouter, usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Skeleton } from "@/components/ui/skeleton"
import { openSignApiService } from "@/app/lib/api-service"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, logout } = useAuthStore()
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

  // Check if the current path is a public path (only on client side)
  const isPublicPath = isClient ? publicPaths.some((path) => pathname.startsWith(path)) : false

  // Set client flag after hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Function to validate session token with OpenSign API
  const validateSession = useCallback(async () => {
    if (typeof window === 'undefined') return false
    
    const sessionToken = openSignApiService.getSessionToken()
    
    if (!sessionToken || sessionToken.trim() === '') {
      console.log("AuthGuard: No session token to validate")
      return false
    }

    // Basic format validation for OpenSign tokens
    if (!sessionToken.startsWith('r:') || sessionToken.length < 10) {
      console.log("AuthGuard: Invalid token format")
      openSignApiService.clearSessionToken()
      return false
    }

    try {
      console.log("AuthGuard: Making API call to validate session...")
      // Try to verify session with OpenSign API using getUserDetails
      const result = await openSignApiService.callFunction('getUserDetails', {})
      console.log("AuthGuard: Session validation successful", result)
      return true
    } catch (error) {
      console.log("AuthGuard: Session validation failed, token may be expired:", error)
      // Clear expired token immediately
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
      // Use locale-aware routing - default to 'en' if no locale detected
      const currentLocale = pathname.split('/')[1] || 'en'
      router?.push(`/${currentLocale}/auth/login`)
    }
  }, [logout, router, pathname])

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

      // Always validate the token, even if store says we're authenticated
      // This ensures we catch expired tokens
      console.log("AuthGuard: Validating session token...")
      setIsValidating(true)
      validateSession().then((isValid) => {
        setIsValidating(false)
        if (!isValid) {
          console.log("AuthGuard: Session validation failed, redirecting to login.")
          handleAuthFailure()
        } else {
          console.log("AuthGuard: Session validation successful")
        }
      }).catch((error) => {
        setIsValidating(false)
        console.log("AuthGuard: Session validation error:", error, "- redirecting to login.")
        handleAuthFailure()
      })
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
            <h2 className="mb-2 text-xl font-semibold text-gray-800">Authentication Required</h2>
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
        <Skeleton className="w-full max-w-screen-xl mb-8 h-14" /> {/* Nav skeleton */}
        <div className="grid flex-1 w-full max-w-screen-xl grid-cols-1 gap-8 md:grid-cols-2">
          <Skeleton className="w-full h-64" /> {/* Content skeleton */}
          <Skeleton className="w-full h-64" /> {/* Content skeleton */}
        </div>
        <Skeleton className="w-full h-10 max-w-screen-xl mt-8" /> {/* Footer skeleton */}
        <p className="mt-4 text-gray-500 dark:text-gray-400">{isClient ? "Access Denied" : t("loading")}</p>
      </div>
    )
  }

  // Show loading while validating session OR when no token on protected routes
  if (isValidating || (!isAuthenticated && !isPublicPath)) {
    return (
      <div className="flex flex-col min-h-[100dvh] items-center justify-center p-4">
        <Skeleton className="w-full max-w-screen-xl mb-8 h-14" /> {/* Nav skeleton */}
        <div className="grid flex-1 w-full max-w-screen-xl grid-cols-1 gap-8 md:grid-cols-2">
          <Skeleton className="w-full h-64" /> {/* Content skeleton */}
          <Skeleton className="w-full h-64" /> {/* Content skeleton */}
        </div>
        <Skeleton className="w-full h-10 max-w-screen-xl mt-8" /> {/* Footer skeleton */}
        <p className="mt-4 text-gray-500 dark:text-gray-400">{t("loading")}</p>
      </div>
    )
  }

  // If authenticated or on a public path, render the children
  return <>{children}</>
}
