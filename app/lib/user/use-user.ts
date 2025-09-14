/**
 * ✅ React Query hooks for User Profile operations
 * Following modern React Query patterns
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { userApiService } from "./user-api-service"
import type { UpdateUserProfileRequest } from "./user-types"

// Query Keys for React Query caching
export const USER_QUERY_KEYS = {
  all: ['user'] as const,
  profile: () => [...USER_QUERY_KEYS.all, 'profile'] as const,
  enhanced: () => [...USER_QUERY_KEYS.all, 'enhanced'] as const,
}

/**
 * Hook to get enhanced user profile with statistics
 */
export function useUserProfile() {
  return useQuery({
    queryKey: USER_QUERY_KEYS.enhanced(),
    queryFn: () => userApiService.getEnhancedUserProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to update user profile
 */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: UpdateUserProfileRequest) => 
      userApiService.updateUserProfile(updates),
    onSuccess: () => {
      // Invalidate and refetch user profile
      queryClient.invalidateQueries({ 
        queryKey: USER_QUERY_KEYS.all 
      });
    },
  });
}

/**
 * Hook to get basic user profile (lightweight)
 */
export function useBasicUserProfile() {
  return useQuery({
    queryKey: USER_QUERY_KEYS.profile(),
    queryFn: () => userApiService.getUserProfile(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}
