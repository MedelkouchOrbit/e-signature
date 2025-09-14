/**
 * ✅ OpenSign Authentication Services
 * Modern React Query implementation of OpenSign auth cloud functions
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { openSignApiService } from '@/app/lib/api-service'

// === Types ===
export interface UserSignupRequest {
  userDetails: {
    email: string
    password: string
    name: string
    role: string // e.g., 'contracts_User'
    company: string
    phone?: string
    jobTitle?: string
    timezone?: string
    pincode?: string
    country?: string
    state?: string
    city?: string
    address?: string
  }
}

export interface UserLoginRequest {
  email: string
  password: string
}

export interface AuthLoginAsMailRequest {
  email: string
}

export interface OpenSignUser {
  objectId: string
  username: string
  email: string
  name?: string
  sessionToken: string
  createdAt: string
  updatedAt: string
  // Extended user data from contracts_Users
  UserRole?: string
  TenantId?: {
    objectId: string
    className: string
  }
  Company?: string
  JobTitle?: string
  Phone?: string
  Timezone?: string
}

export interface SendOTPRequest {
  email: string
  otp: string
}

// Define response types for Parse Server functions
interface ParseServerResponse<T = unknown> {
  result?: T
  error?: string
  code?: number
}

// === Query Keys ===
export const authQueryKeys = {
  userDetails: () => ['opensign', 'user', 'details'] as const,
  currentUser: () => ['opensign', 'user', 'current'] as const,
}

// === Authentication Services ===

/**
 * Register new user with OpenSign
 */
export function useUserSignup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: UserSignupRequest): Promise<OpenSignUser> => {
      const response = await openSignApiService.post<ParseServerResponse<OpenSignUser>>('functions/usersignup', params)
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      return response.result!
    },
    onSuccess: (user) => {
      // Cache the user data
      queryClient.setQueryData(authQueryKeys.currentUser(), user)
      
      // Store session token for future requests
      if (typeof window !== 'undefined' && user.sessionToken) {
        openSignApiService.setSessionToken(user.sessionToken)
        localStorage.setItem('opensign_user_id', user.objectId)
      }
    },
    meta: {
      description: 'Register new user with tenant setup and role assignment'
    }
  })
}

/**
 * Login user with email and password
 */
export function useUserLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: UserLoginRequest): Promise<OpenSignUser> => {
      const response = await openSignApiService.post<ParseServerResponse<OpenSignUser>>('functions/loginuser', params)
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      return response.result!
    },
    onSuccess: (user) => {
      // Cache the user data
      queryClient.setQueryData(authQueryKeys.currentUser(), user)
      
      // Store session token for future requests
      if (typeof window !== 'undefined' && user.sessionToken) {
        openSignApiService.setSessionToken(user.sessionToken)
        localStorage.setItem('opensign_user_id', user.objectId)
      }
    },
    meta: {
      description: 'Authenticate user with email and password'
    }
  })
}

/**
 * Magic link authentication (login by email only)
 */
export function useAuthLoginAsMail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: AuthLoginAsMailRequest): Promise<{ sessionToken: string }> => {
      const response = await openSignApiService.post<ParseServerResponse<{ sessionToken: string }>>('functions/AuthLoginAsMail', params)
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      return response.result!
    },
    onSuccess: (authData) => {
      // Store session token for future requests
      if (typeof window !== 'undefined' && authData.sessionToken) {
        openSignApiService.setSessionToken(authData.sessionToken)
      }
      
      // Invalidate user queries to refetch with new token
      queryClient.invalidateQueries({ queryKey: authQueryKeys.currentUser() })
    },
    meta: {
      description: 'Magic link authentication without password'
    }
  })
}

/**
 * Send OTP email for two-factor authentication
 */
export function useSendOTP() {
  return useMutation({
    mutationFn: async (params: SendOTPRequest): Promise<{ status: string }> => {
      const response = await openSignApiService.post<ParseServerResponse<{ status: string }>>('functions/SendOTPMailV1', params)
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      return response.result!
    },
    meta: {
      description: 'Send OTP email for two-factor authentication'
    }
  })
}

/**
 * Get current user extended details
 */
export function useUserDetails() {
  return useQuery({
    queryKey: authQueryKeys.userDetails(),
    queryFn: async (): Promise<OpenSignUser> => {
      const response = await openSignApiService.post<ParseServerResponse<OpenSignUser>>('functions/getUserDetails', {})
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      return response.result!
    },
    enabled: typeof window !== 'undefined' && !!openSignApiService.getSessionToken(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      description: 'Get current user extended details from contracts_Users'
    }
  })
}

/**
 * Get user ID by email (utility function)
 */
export function useGetUserByEmail() {
  return useMutation({
    mutationFn: async (email: string): Promise<{ id: string; objectId: string }> => {
      const response = await openSignApiService.post<ParseServerResponse<{ id: string; objectId: string }>>('functions/getUserId', { email })
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      return response.result!
    },
    meta: {
      description: 'Get user ID by email address'
    }
  })
}

/**
 * Logout user and clear cached data
 */
export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<void> => {
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('opensign_session_token')
        localStorage.removeItem('opensign_user_id')
      }
      
      // Clear all cached data
      queryClient.clear()
    },
    meta: {
      description: 'Logout user and clear all cached data'
    }
  })
}

// === Utility Functions ===

/**
 * Get current session token
 */
export function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('opensign_session_token')
}

/**
 * Get current user ID
 */
export function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('opensign_user_id')
}

/**
 * Check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const sessionToken = getSessionToken()
  return !!sessionToken
}

/**
 * Auth state management hook
 */
export function useAuthState() {
  const isAuthenticated = useIsAuthenticated()
  const { data: userDetails, isLoading, error } = useUserDetails()
  const logout = useLogout()

  return {
    isAuthenticated,
    user: userDetails,
    isLoading,
    error,
    logout: logout.mutate,
    isLoggingOut: logout.isPending
  }
}
