/**
 * ✅ OpenSign Team Management Services
 * Modern React Query implementation of OpenSign team cloud functions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { openSignApiService } from '@/app/lib/api-service'

// === Types ===
export interface OpenSignTeam {
  objectId: string
  Name: string
  IsActive: boolean
  OrganizationId?: {
    objectId: string
    className: string
    Name?: string
  }
  createdAt: string
  updatedAt: string
}

export interface OpenSignTeamMember {
  objectId: string
  Name: string
  Email: string
  UserRole?: string
  Company?: string
  IsDisabled?: boolean
  TeamIds?: Array<{
    objectId: string
    Name?: string
  }>
  createdAt: string
  updatedAt: string
}

export interface CreateTeamRequest {
  name: string
  isActive?: boolean
}

export interface AddMemberRequest {
  teamId: string
  memberId: string
}

// === Query Keys ===
const teamQueryKeys = {
  all: ['teams'] as const,
  lists: () => [...teamQueryKeys.all, 'list'] as const,
  list: (filters?: { active?: boolean }) => [...teamQueryKeys.lists(), filters] as const,
  details: () => [...teamQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...teamQueryKeys.details(), id] as const,
  members: (teamId: string) => [...teamQueryKeys.all, 'members', teamId] as const,
  orgData: () => ['organization', 'data'] as const,
}

// === Hooks ===

/**
 * Get all teams in organization
 */
export function useTeams(options?: { active?: boolean }) {
  return useQuery({
    queryKey: teamQueryKeys.list(options),
    queryFn: async (): Promise<OpenSignTeam[]> => {
      const response = await openSignApiService.post<{
        result?: OpenSignTeam[]
        error?: string
      }>('functions/getteams', {
        active: options?.active ?? true
      })
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      return response.result || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      description: 'Get teams in organization'
    }
  })
}

/**
 * Get organization data (teams + members)
 */
export function useOrganizationData() {
  return useQuery({
    queryKey: teamQueryKeys.orgData(),
    queryFn: async (): Promise<{ teams: OpenSignTeam[], members: OpenSignTeamMember[] }> => {
      // Get teams
      const teamsResponse = await openSignApiService.post<{
        result?: OpenSignTeam[]
        error?: string
      }>('functions/getteams', { active: true })
      
      if (teamsResponse.error) {
        throw new Error(teamsResponse.error)
      }
      
      // Get members  
      const membersResponse = await openSignApiService.post<{
        result?: OpenSignTeamMember[]
        error?: string
      }>('functions/getSigners', { search: '' })
      
      if (membersResponse.error) {
        throw new Error(membersResponse.error)
      }
      
      return {
        teams: teamsResponse.result || [],
        members: membersResponse.result || []
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      description: 'Get complete organization data'
    }
  })
}

/**
 * Create new team
 */
export function useCreateTeam() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateTeamRequest): Promise<OpenSignTeam> => {
      const response = await openSignApiService.post<{
        result?: OpenSignTeam
        error?: string
      }>('functions/createteam', {
        name: data.name,
        isActive: data.isActive ?? true
      })
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      if (!response.result) {
        throw new Error('No team data returned')
      }
      
      return response.result
    },
    onSuccess: () => {
      // Invalidate teams queries
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.orgData() })
    },
    meta: {
      description: 'Create new team'
    }
  })
}

/**
 * Add member to team
 */
export function useAddMemberToTeam() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: AddMemberRequest): Promise<void> => {
      const response = await openSignApiService.post<{
        result?: { success: boolean }
        error?: string
      }>('functions/addmembertoteam', {
        teamId: data.teamId,
        memberId: data.memberId
      })
      
      if (response.error) {
        throw new Error(response.error)
      }
    },
    onSuccess: () => {
      // Invalidate organization data
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.orgData() })
    },
    meta: {
      description: 'Add member to team'
    }
  })
}

/**
 * Remove member from team
 */
export function useRemoveMemberFromTeam() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: AddMemberRequest): Promise<void> => {
      const response = await openSignApiService.post<{
        result?: { success: boolean }
        error?: string
      }>('functions/removememberfromteam', {
        teamId: data.teamId,
        memberId: data.memberId
      })
      
      if (response.error) {
        throw new Error(response.error)
      }
    },
    onSuccess: () => {
      // Invalidate organization data
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.orgData() })
    },
    meta: {
      description: 'Remove member from team'
    }
  })
}

/**
 * Update team
 */
export function useUpdateTeam() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { teamId: string; updates: Partial<CreateTeamRequest> }): Promise<OpenSignTeam> => {
      const response = await openSignApiService.post<{
        result?: OpenSignTeam
        error?: string
      }>('functions/updateteam', {
        teamId: data.teamId,
        ...data.updates
      })
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      if (!response.result) {
        throw new Error('No team data returned')
      }
      
      return response.result
    },
    onSuccess: (_, variables) => {
      // Invalidate specific team and lists
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.detail(variables.teamId) })
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.orgData() })
    },
    meta: {
      description: 'Update team'
    }
  })
}

/**
 * Delete team
 */
export function useDeleteTeam() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (teamId: string): Promise<void> => {
      const response = await openSignApiService.post<{
        result?: { success: boolean }
        error?: string
      }>('functions/deleteteam', {
        teamId
      })
      
      if (response.error) {
        throw new Error(response.error)
      }
    },
    onSuccess: (_, teamId) => {
      // Remove from cache and invalidate lists
      queryClient.removeQueries({ queryKey: teamQueryKeys.detail(teamId) })
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.orgData() })
    },
    meta: {
      description: 'Delete team'
    }
  })
}
