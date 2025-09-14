/**
 * ✅ Enhanced OpenSign Authentication Services with Superadmin Approval
 * Based on OpenSign patterns with added approval workflow
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { openSignApiService } from '@/app/lib/api-service'

// === Enhanced Types ===
export interface EnhancedUserSignupRequest {
  userDetails: {
    email: string
    password: string
    name: string
    company: string
    jobTitle: string
    phone?: string
    role?: string // Defaults to 'contracts_User'
    timezone?: string
    // Geographic info (optional)
    address?: string
    city?: string
    state?: string
    country?: string
    pincode?: string
  }
}

export interface SignupResponse {
  success: boolean
  message: string
  requiresApproval: boolean
  userId?: string
  sessionToken?: string
}

export interface LoginResponse {
  success: boolean
  user: OpenSignUser
  message?: string
  requiresActivation?: boolean
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
  Company?: string
  JobTitle?: string
  IsDisabled?: boolean
  TenantId?: {
    objectId: string
    className: string
    TenantName?: string
  }
  OrganizationId?: {
    objectId: string
    className: string
    Name?: string
  }
  TeamIds?: Array<{
    objectId: string
    className: string
  }>
}

export interface PendingUser {
  objectId: string
  Name: string
  Email: string
  Company: string
  JobTitle: string
  Phone?: string
  RegistrationDate: string
  IsDisabled: boolean
  UserRole: string
  TenantId?: {
    objectId: string
    TenantName: string
  }
}

export interface UserActivationRequest {
  userId: string
  action: 'approve' | 'reject'
  reason?: string
}

// === Superadmin Configuration ===
export const SUPERADMIN_CONFIG = {
  email: "superadmin@superadmin.com",
  password: "Superadmin12@",
  name: "Super Administrator",
  company: "System Administration",
  role: "contracts_SuperAdmin"
} as const

// === Query Keys ===
const AUTH_QUERY_KEYS = {
  all: ['auth'] as const,
  user: () => [...AUTH_QUERY_KEYS.all, 'user'] as const,
  userDetails: (userId?: string) => [...AUTH_QUERY_KEYS.user(), userId] as const,
  pendingUsers: () => [...AUTH_QUERY_KEYS.all, 'pending-users'] as const,
  allUsers: () => [...AUTH_QUERY_KEYS.all, 'all-users'] as const,
} as const

// === Enhanced Authentication Hooks ===

/**
 * Enhanced user signup with automatic tenant/organization creation
 * and approval requirement
 */
export function useEnhancedUserSignup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: EnhancedUserSignupRequest): Promise<SignupResponse> => {
      const { userDetails } = request
      
      // Set default role if not provided
      const enhancedUserDetails = {
        ...userDetails,
        role: userDetails.role || 'contracts_User',
        timezone: userDetails.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      }

      // Call enhanced signup cloud function
      const response = await openSignApiService.callFunction('enhancedUserSignup', {
        userDetails: enhancedUserDetails
      })

      if (response.error) {
        throw new Error(response.error)
      }

      return {
        success: true,
        message: response.message || "Account created successfully. Please wait for admin approval.",
        requiresApproval: true,
        userId: response.userId
      }
    },
    onSuccess: () => {
      // Invalidate pending users list for superadmin dashboard
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.pendingUsers() })
    },
  })
}

/**
 * Enhanced login with activation status checking
 */
export function useEnhancedUserLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: { email: string; password: string }): Promise<LoginResponse> => {
      try {
        // 1. Authenticate with Parse
        const loginResponse = await openSignApiService.callFunction('loginuser', {
          email: request.email,
          password: request.password
        })

        if (loginResponse.error) {
          throw new Error(loginResponse.error)
        }

        // 2. Get extended user details
        const userDetailsResponse = await openSignApiService.callFunction('getUserDetails', {}, {
          sessionToken: loginResponse.sessionToken
        })

        if (userDetailsResponse.error) {
          throw new Error(userDetailsResponse.error)
        }

        const extUser = userDetailsResponse.result

        // 3. Check activation status
        const isDisabled = extUser?.IsDisabled || false
        if (isDisabled) {
          return {
            success: false,
            message: "Account pending approval. Please contact administrator.",
            requiresActivation: true,
            user: loginResponse
          }
        }

        // 4. Store session data
        if (typeof window !== 'undefined') {
          localStorage.setItem('accesstoken', loginResponse.sessionToken)
          localStorage.setItem('UserInformation', JSON.stringify(loginResponse))
          localStorage.setItem('userEmail', loginResponse.email)
          
          if (extUser?.TenantId) {
            localStorage.setItem('TenantId', extUser.TenantId.objectId)
            localStorage.setItem('TenantName', extUser.TenantId.TenantName || '')
          }
          
          if (extUser?.OrganizationId) {
            localStorage.setItem('OrganizationId', extUser.OrganizationId.objectId)
          }
          
          const userRole = extUser?.UserRole?.replace('contracts_', '') || 'User'
          localStorage.setItem('_user_role', userRole)
        }

        return {
          success: true,
          user: {
            ...loginResponse,
            ...extUser
          }
        }

      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Login failed')
      }
    },
    onSuccess: (data) => {
      if (data.success) {
        // Invalidate user queries
        queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.user() })
      }
    },
  })
}

/**
 * Initialize superadmin account (one-time setup)
 */
export function useInitializeSuperAdmin() {
  return useMutation({
    mutationFn: async (): Promise<{ success: boolean; message: string; existed: boolean }> => {
      const response = await openSignApiService.callFunction('initializeSuperAdmin', {
        superAdminConfig: SUPERADMIN_CONFIG
      })

      if (response.error) {
        throw new Error(response.error)
      }

      return response
    },
  })
}

/**
 * Get current user details (for authenticated users)
 */
export function useCurrentUserDetails() {
  return useQuery({
    queryKey: AUTH_QUERY_KEYS.userDetails(),
    queryFn: async (): Promise<OpenSignUser | null> => {
      const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('accesstoken') : null
      if (!sessionToken) return null

      const response = await openSignApiService.callFunction('getUserDetails', {}, {
        sessionToken
      })

      if (response.error) {
        throw new Error(response.error)
      }

      return response.result
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('accesstoken'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false
  })
}

// === Superadmin Management Hooks ===

/**
 * Get all pending users awaiting approval (superadmin only)
 */
export function usePendingUsers() {
  return useQuery({
    queryKey: AUTH_QUERY_KEYS.pendingUsers(),
    queryFn: async (): Promise<PendingUser[]> => {
      const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('accesstoken') : null
      if (!sessionToken) throw new Error('Not authenticated')

      const response = await openSignApiService.callFunction('getPendingUsers', {}, {
        sessionToken
      })

      if (response.error) {
        throw new Error(response.error)
      }

      return response.results || []
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('accesstoken'),
    staleTime: 2 * 60 * 1000, // 2 minutes for real-time updates
  })
}

/**
 * Get all users (superadmin only)
 */
export function useAllUsers() {
  return useQuery({
    queryKey: AUTH_QUERY_KEYS.allUsers(),
    queryFn: async (): Promise<OpenSignUser[]> => {
      const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('accesstoken') : null
      if (!sessionToken) throw new Error('Not authenticated')

      const response = await openSignApiService.callFunction('getAllUsers', {}, {
        sessionToken
      })

      if (response.error) {
        throw new Error(response.error)
      }

      return response.results || []
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('accesstoken'),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Approve or reject user activation (superadmin only)
 */
export function useManageUserActivation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: UserActivationRequest): Promise<{ success: boolean; message: string }> => {
      const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('accesstoken') : null
      if (!sessionToken) throw new Error('Not authenticated')

      const response = await openSignApiService.callFunction('manageUserActivation', {
        userId: request.userId,
        action: request.action,
        reason: request.reason
      }, {
        sessionToken
      })

      if (response.error) {
        throw new Error(response.error)
      }

      return response
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.pendingUsers() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.allUsers() })
      
      // Show success message based on action
      const action = variables.action === 'approve' ? 'approved' : 'rejected'
      console.log(`User ${action} successfully:`, data.message)
    },
  })
}

/**
 * Check if current user is superadmin
 */
export function useIsSuperAdmin() {
  const { data: user } = useCurrentUserDetails()
  
  return {
    isSuperAdmin: user?.UserRole === 'contracts_SuperAdmin' || user?.email === SUPERADMIN_CONFIG.email,
    isLoading: !user
  }
}

/**
 * Logout user and clear session data
 */
export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<void> => {
      try {
        // Call Parse logout
        await openSignApiService.callFunction('logoutUser', {})
      } catch (error) {
        // Continue even if logout call fails
        console.warn('Logout call failed:', error)
      }

      // Clear local storage
      if (typeof window !== 'undefined') {
        const preserveKeys = ['baseUrl', 'parseAppId', 'appLogo', 'userSettings']
        const preserved: Record<string, string | null> = {}
        
        preserveKeys.forEach(key => {
          preserved[key] = localStorage.getItem(key)
        })
        
        localStorage.clear()
        
        // Restore preserved keys
        Object.entries(preserved).forEach(([key, value]) => {
          if (value) localStorage.setItem(key, value)
        })
      }
    },
    onSuccess: () => {
      // Clear all auth-related queries
      queryClient.removeQueries({ queryKey: AUTH_QUERY_KEYS.all })
      queryClient.clear()
    },
  })
}

// === Utility Functions ===

/**
 * Check if user session is valid
 */
export function isUserLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  
  const sessionToken = localStorage.getItem('accesstoken')
  const userInfo = localStorage.getItem('UserInformation')
  
  return !!(sessionToken && userInfo)
}

/**
 * Get current user role
 */
export function getCurrentUserRole(): string | null {
  if (typeof window === 'undefined') return null
  
  return localStorage.getItem('_user_role')
}

/**
 * Get current tenant info
 */
export function getCurrentTenant(): { id: string; name: string } | null {
  if (typeof window === 'undefined') return null
  
  const tenantId = localStorage.getItem('TenantId')
  const tenantName = localStorage.getItem('TenantName')
  
  if (!tenantId) return null
  
  return {
    id: tenantId,
    name: tenantName || ''
  }
}
