import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authApiService } from './auth-api-service'
import { useAuthStore } from './auth-store'
import type { UserCredentials, UserRegistration, ParseServerResponse } from './auth-types'

// Query Keys
export const authKeys = {
  session: ['auth', 'session'] as const,
  user: ['auth', 'user'] as const,
}

// Auth Hooks using React Query
export const useAuth = () => {
  const { login, logout } = useAuthStore()
  const queryClient = useQueryClient()

  // Login Mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: UserCredentials) => authApiService.login(credentials),
    onSuccess: (data) => {
      if (data?.sessionToken) {
        login(
          { 
            id: data.objectId, 
            email: data.email,
            name: data.name 
          }, 
          data.sessionToken
        )
        // Invalidate and refetch user data
        queryClient.invalidateQueries({ queryKey: authKeys.session })
      }
    },
    onError: (error) => {
      console.error('Login failed:', error)
    }
  })

  // Session Verification Query
  const sessionQuery = useQuery({
    queryKey: authKeys.session,
    queryFn: () => authApiService.verifySession(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Signup Mutation
  const signupMutation = useMutation({
    mutationFn: (data: UserRegistration) => authApiService.signup(data),
    onError: (error) => {
      console.error('Signup failed:', error)
    }
  })

  // Logout Mutation
  const logoutMutation = useMutation({
    mutationFn: () => authApiService.logout(),
    onSuccess: () => {
      logout()
      queryClient.clear() // Clear all cached data
    }
  })

  return {
    // Mutations
    login: loginMutation.mutate,
    signup: signupMutation.mutate,
    logout: logoutMutation.mutate,
    
    // Loading States
    isLoggingIn: loginMutation.isPending,
    isSigningUp: signupMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isVerifyingSession: sessionQuery.isLoading,
    
    // Error States
    loginError: loginMutation.error,
    signupError: signupMutation.error,
    sessionError: sessionQuery.error,
    
    // Data
    sessionData: sessionQuery.data,
    
    // Status
    isAuthenticated: sessionQuery.isSuccess && !sessionQuery.error,
  }
}

// OTP Hooks
export const useOTPAuth = () => {
  const sendOTPMutation = useMutation({
    mutationFn: ({ email, tenantId, docId }: { 
      email: string; 
      tenantId?: string; 
      docId?: string 
    }) => authApiService.sendOTPEmail(email, tenantId, docId),
  })

  const verifyOTPMutation = useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: number }) => 
      authApiService.loginWithOTP(email, otp),
    onSuccess: (data) => {
      if (data?.result?.sessionToken) {
        // Handle OTP login success
        const { login } = useAuthStore.getState()
        login(
          { 
            id: data.result.objectId, 
            email: data.result.email,
            name: data.result.name 
          }, 
          data.result.sessionToken
        )
      }
    }
  })

  return {
    sendOTP: sendOTPMutation.mutate,
    verifyOTP: verifyOTPMutation.mutate,
    isSendingOTP: sendOTPMutation.isPending,
    isVerifyingOTP: verifyOTPMutation.isPending,
    sendOTPError: sendOTPMutation.error,
    verifyOTPError: verifyOTPMutation.error,
  }
}

// Superadmin hooks for user management
export const useSuperAdmin = () => {
  const queryClient = useQueryClient()

  // Get pending users query
  const {
    data: pendingUsers,
    isLoading: isLoadingPending,
    error: pendingError,
    refetch: refetchPending
  } = useQuery({
    queryKey: ['auth', 'pending-users'],
    queryFn: () => authApiService.getPendingUsers(),
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Get all users query
  const {
    data: allUsers,
    isLoading: isLoadingAll,
    error: allUsersError,
    refetch: refetchAllUsers
  } = useQuery({
    queryKey: ['auth', 'all-users'],
    queryFn: () => authApiService.getAllUsers(),
  })

  // Approve user mutation
  const approveUserMutation = useMutation({
    mutationFn: ({ userId, adminId }: { userId: string; adminId: string }) => 
      authApiService.approveUser(userId, adminId),
    onSuccess: () => {
      // Refresh pending users and all users
      queryClient.invalidateQueries({ queryKey: ['auth', 'pending-users'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'all-users'] })
    },
  })

  // Reject user mutation
  const rejectUserMutation = useMutation({
    mutationFn: ({ userId, adminId, reason }: { userId: string; adminId: string; reason?: string }) => 
      authApiService.rejectUser(userId, adminId, reason),
    onSuccess: () => {
      // Refresh pending users and all users
      queryClient.invalidateQueries({ queryKey: ['auth', 'pending-users'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'all-users'] })
    },
  })

  return {
    // Data
    pendingUsers: pendingUsers || [],
    allUsers: allUsers || [],
    
    // Loading states
    isLoadingPending,
    isLoadingAll,
    
    // Errors
    pendingError,
    allUsersError,
    
    // Actions
    approveUser: approveUserMutation.mutate,
    rejectUser: rejectUserMutation.mutate,
    refetchPending,
    refetchAllUsers,
    
    // Mutation states
    isApprovingUser: approveUserMutation.isPending,
    isRejectingUser: rejectUserMutation.isPending,
    approveError: approveUserMutation.error,
    rejectError: rejectUserMutation.error,
  }
}
