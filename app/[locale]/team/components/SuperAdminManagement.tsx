'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Building2, 
  Users, 
  Search, 
  MoreHorizontal, 
  ChevronRight, 
  ChevronDown,
  UserPlus,
  Loader2,
  Trash2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { 
  SuperAdminApiService, 
  SuperAdminOrganization,
  SuperAdminOrganizationWithUsers,
  SuperAdminUser, 
  SuperAdminTeam
} from '@/app/lib/super-admin-api'
import { CreateOrganizationModal } from './CreateOrganizationModal'
import { CreateTeamModal } from './CreateTeamModal'
import { AddMemberToTeamModal } from './AddMemberToTeamModal'

// interface TeamMember { // Disabled since team creation is not available
//   objectId: string
//   Name: string
//   Email: string
//   UserRole?: string
//   Company?: string
//   createdAt: string
// }

interface OrganizationWithData extends SuperAdminOrganizationWithUsers {
  teams: SuperAdminTeam[]
  isExpanded?: boolean
}

export function SuperAdminManagement() {
  const { toast } = useToast()
  
  // State management
  const [organizations, setOrganizations] = useState<OrganizationWithData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set())
  const [togglingUsers, setTogglingUsers] = useState<Set<string>>(new Set()) // Track users being toggled
  
  // Modal states
  const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false)
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false)
  const [isOrgSelectorForTeamOpen, setIsOrgSelectorForTeamOpen] = useState(false)
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [selectedOrgForUser, setSelectedOrgForUser] = useState<OrganizationWithData | null>(null)
  const [selectedOrgForTeam, setSelectedOrgForTeam] = useState<OrganizationWithData | null>(null)
  const [togglingTeams, setTogglingTeams] = useState<Set<string>>(new Set()) // Track teams being toggled
  
  // Delete confirmation states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<SuperAdminUser | null>(null)
  const [confirmationEmail, setConfirmationEmail] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // Load all super admin data
  const loadSuperAdminData = React.useCallback(async () => {
    try {
      setLoading(true)
      
      console.log('🔄 Loading super admin data...')
      
      // Get all teams first (this is more reliable)
      let teamsData: SuperAdminTeam[] = []
      try {
        teamsData = await SuperAdminApiService.getAllTeams()
        console.log('🔗 Loaded teams:', teamsData.length)
      } catch (error) {
        console.warn('⚠️ Failed to load teams:', error)
      }
      
      // Get organizations with users using the new admin discovery method
      let orgsWithUsersData: SuperAdminOrganizationWithUsers[] = []
      try {
        orgsWithUsersData = await SuperAdminApiService.getAllOrganizations()
        console.log('🏢 Loaded organizations with users via admin discovery:', orgsWithUsersData.length)
      } catch (error) {
        console.warn('⚠️ Failed to load organizations via admin discovery:', error)
        
        // Fallback: try to get all users and build organizations manually
        try {
          const usersData = await SuperAdminApiService.getAllUsers()
          console.log('👥 Fallback: loaded users:', usersData.length)
          
          // Build organizations from user data
          const orgMap = new Map<string, SuperAdminOrganizationWithUsers>()
          usersData.forEach(user => {
            if (user.OrganizationId?.objectId) {
              const orgId = user.OrganizationId.objectId
              if (!orgMap.has(orgId)) {
                orgMap.set(orgId, {
                  objectId: orgId,
                  Name: user.OrganizationId.Name || user.Company || `Organization ${orgId.substring(0, 8)}`,
                  IsActive: true,
                  createdAt: user.createdAt || new Date().toISOString(),
                  updatedAt: user.updatedAt || new Date().toISOString(),
                  users: []
                })
              }
              // Add user to organization
              orgMap.get(orgId)!.users.push(user)
            }
          })
          orgsWithUsersData = Array.from(orgMap.values())
          console.log('🔧 Fallback: created organizations from user data:', orgsWithUsersData.length)
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError)
        }
      }
      
      // Combine data by organization (add teams to existing organizations with users)
      const orgsWithData: OrganizationWithData[] = orgsWithUsersData.map(org => {
        const orgTeams = teamsData.filter(team => 
          team.OrganizationId?.objectId === org.objectId
        )
        
        return {
          ...org,
          teams: orgTeams,
          isExpanded: false
        }
      })
      
      setOrganizations(orgsWithData)
      console.log('✅ Super admin data loaded successfully')
      
      // Show success message
      if (orgsWithData.length > 0) {
        const totalUsers = orgsWithData.reduce((sum, org) => sum + (org.users?.length || 0), 0)
        toast({
          title: "Data Loaded",
          description: `Successfully loaded ${orgsWithData.length} organizations and ${totalUsers} users.`
        })
      }
      
    } catch (error) {
      console.error('❌ Error loading super admin data:', error)
      toast({
        title: "Error",
        description: "Failed to load organizations and users. Please check your permissions.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadSuperAdminData()
  }, [loadSuperAdminData])

  // Toggle organization expansion
  const toggleOrgExpansion = (orgId: string) => {
    setExpandedOrgs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orgId)) {
        newSet.delete(orgId)
      } else {
        newSet.add(orgId)
      }
      return newSet
    })
  }

  // Handle organization creation
  const handleCreateOrganization = async (newOrg: SuperAdminOrganization & { objectId?: string, backendResult?: unknown }) => {
    try {
      // First, add the organization with empty data
      const orgWithData: OrganizationWithData = {
        ...newOrg,
        users: [],
        teams: [],
        isExpanded: false
      }
      setOrganizations(prev => [orgWithData, ...prev])
      
      toast({
        title: "Success",
        description: `Organization "${newOrg.Name}" created successfully.`
      })

      // If we have an organization ID, fetch the real data
      if (newOrg.objectId) {
        console.log('Fetching users for newly created organization:', newOrg.objectId)
        
        try {
          // Fetch users for the new organization
          const users = await SuperAdminApiService.getUsersByOrganization(newOrg.objectId)
          console.log(`Found ${users.length} users in new organization:`, users)
          
          // Fetch teams for the new organization
          const orgTeams = await SuperAdminApiService.getTeamsByOrganization(newOrg.objectId)
          console.log(`Found ${orgTeams.length} teams in new organization:`, orgTeams)
          
          // Update the organization with real data
          setOrganizations(prev => prev.map(org => 
            org.objectId === newOrg.objectId ? {
              ...org,
              users: users,
              teams: orgTeams
            } : org
          ))
          
          // Expand the organization to show the new data
          setExpandedOrgs(prev => new Set([...prev, newOrg.objectId!]))
          
        } catch (fetchError) {
          console.error('Failed to fetch new organization data:', fetchError)
          // Organization is still created, just refresh all data as fallback
          await loadSuperAdminData()
        }
      } else {
        console.warn('No organization ID returned from creation, refreshing all data')
        // Fallback: refresh all data
        await loadSuperAdminData()
      }
      
    } catch (error) {
      console.error('Error in handleCreateOrganization:', error)
      toast({
        title: "Error", 
        description: "Failed to refresh organization data after creation.",
        variant: "destructive"
      })
    }
  }

  // Handle user activation/deactivation with loading state
  const handleToggleUserStatus = async (user: SuperAdminUser) => {
    try {
      // Add user to loading state
      setTogglingUsers(prev => new Set([...prev, user.objectId]))
      
      const newStatus = !user.IsDisabled
      
      // Use the SuperAdminApiService method
      await SuperAdminApiService.toggleUserStatus(user.objectId, newStatus)
      
      // Update local state
      setOrganizations(prev => prev.map(org => ({
        ...org,
        users: org.users.map(u => 
          u.objectId === user.objectId ? { ...u, IsDisabled: newStatus } : u
        )
      })))
      
      toast({
        title: "Success",
        description: `User ${newStatus ? 'deactivated' : 'activated'} successfully.`
      })
    } catch (error) {
      console.error('Error toggling user status:', error)
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive"
      })
    } finally {
      // Remove user from loading state
      setTogglingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(user.objectId)
        return newSet
      })
    }
  }

  // Handle team activation/deactivation
  const handleToggleTeamStatus = async (team: SuperAdminTeam) => {
    try {
      // Add team to loading state
      setTogglingTeams(prev => new Set([...prev, team.objectId]))
      
      const newStatus = !team.IsActive
      
      // Use the SuperAdminApiService method (we'll need to add this)
      await SuperAdminApiService.toggleTeamStatus(team.objectId, newStatus)
      
      // Update local state
      setOrganizations(prev => prev.map(org => ({
        ...org,
        teams: org.teams.map(t => 
          t.objectId === team.objectId ? { ...t, IsActive: newStatus } : t
        )
      })))
      
      toast({
        title: "Success",
        description: `Team ${newStatus ? 'activated' : 'deactivated'} successfully.`
      })
    } catch (error) {
      console.error('Error toggling team status:', error)
      toast({
        title: "Error",
        description: "Failed to update team status.",
        variant: "destructive"
      })
    } finally {
      // Remove team from loading state
      setTogglingTeams(prev => {
        const newSet = new Set(prev)
        newSet.delete(team.objectId)
        return newSet
      })
    }
  }

  // Handle delete user confirmation dialog
  const handleDeleteUser = (user: SuperAdminUser) => {
    setUserToDelete(user)
    setConfirmationEmail('')
    setIsDeleteDialogOpen(true)
  }

  // Confirm delete user
  const confirmDeleteUser = async () => {
    if (!userToDelete || !confirmationEmail) return
    
    // Check if the confirmation email matches the user's email
    if (confirmationEmail.toLowerCase() !== userToDelete.Email.toLowerCase()) {
      toast({
        title: "Error",
        description: "Email confirmation does not match the user's email.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsDeleting(true)
      
      // Use the UserId from the user object (this is the _User table ID needed for deletion)
      const userIdForDeletion = userToDelete.UserId?.objectId
      
      if (!userIdForDeletion) {
        throw new Error('User ID not found for deletion')
      }
      
      await SuperAdminApiService.deleteUser(userIdForDeletion)
      
      // Remove user from local state
      setOrganizations(prev => prev.map(org => ({
        ...org,
        users: org.users.filter(u => u.objectId !== userToDelete.objectId)
      })))
      
      // Close dialog and reset state
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
      setConfirmationEmail('')
      
      toast({
        title: "Success",
        description: `User ${userToDelete.Name} has been deleted successfully.`
      })
    } catch (error) {
      console.error('Error deleting user:', error)
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Cancel delete user
  const cancelDeleteUser = () => {
    setIsDeleteDialogOpen(false)
    setUserToDelete(null)
    setConfirmationEmail('')
  }

  // Filter organizations based on search
  const filteredOrganizations = organizations.filter(org =>
    org.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.users.some(user => 
      user.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.Email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getUserRoleDisplay = (role: string) => {
    return role.replace('contracts_', '')
  }

  // Toggle Switch Component for User Status
  const UserStatusToggle = ({ user, isLoading }: { user: SuperAdminUser, isLoading: boolean }) => {
    const isActive = !user.IsDisabled
    
    // Only show toggle for admins and org admins (you can customize this logic based on your requirements)
    const canToggleUser = true // For now, allow all super admin users to toggle
    
    if (!canToggleUser) {
      return (
        <span className={`text-xs font-medium ${isActive ? 'text-green-700' : 'text-gray-500'}`}>
          {isActive ? 'Active' : 'Disabled'}
        </span>
      )
    }
    
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleToggleUserStatus(user)}
          disabled={isLoading}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out
            ${isActive ? 'bg-green-600' : 'bg-gray-300'}
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
          `}
          aria-pressed={isActive}
          aria-label={`${isActive ? 'Deactivate' : 'Activate'} user ${user.Name}`}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out
              ${isActive ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
          {isLoading && (
            <Loader2 className="absolute inset-0 w-3 h-3 m-auto text-gray-600 animate-spin" />
          )}
        </button>
        <span className={`text-xs font-medium ${isActive ? 'text-green-700' : 'text-gray-500'}`}>
          {isActive ? 'Active' : 'Disabled'}
        </span>
      </div>
    )
  }

  // Toggle Switch Component for Team Status
  const TeamStatusToggle = ({ team, isLoading }: { team: SuperAdminTeam, isLoading: boolean }) => {
    const isActive = team.IsActive
    
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleToggleTeamStatus(team)}
          disabled={isLoading}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out
            ${isActive ? 'bg-green-600' : 'bg-gray-300'}
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
          `}
          aria-pressed={isActive}
          aria-label={`${isActive ? 'Deactivate' : 'Activate'} team ${team.Name}`}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out
              ${isActive ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
          {isLoading && (
            <Loader2 className="absolute inset-0 w-3 h-3 m-auto text-gray-600 animate-spin" />
          )}
        </button>
        <span className={`text-xs font-medium ${isActive ? 'text-green-700' : 'text-gray-500'}`}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-b-2 border-blue-600 rounded-full animate-spin"></div>
        <span className="ml-2 text-gray-600">Loading super admin data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Super Admin Management</h2>
          <p className="text-gray-600">Manage users and teams across organizations. Create teams for specific organizations and assign users to them.</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setIsCreateOrgModalOpen(true)}
            className="text-white bg-blue-600 hover:bg-blue-700"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Create Organization
          </Button>
          <Button 
            onClick={() => {
              // Open organization selector for team creation
              setIsOrgSelectorForTeamOpen(true)
            }}
            className="text-white bg-blue-600 hover:bg-blue-700"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Create Team
          </Button>
          <Button 
            onClick={() => {
              // Set the first organization as default for adding users
              if (organizations.length > 0) {
                setSelectedOrgForUser(organizations[0])
                setIsAddUserModalOpen(true)
              }
            }}
            className="text-white bg-green-600 hover:bg-green-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
        <Input
          placeholder="Search users or teams..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Organizations List */}
      {filteredOrganizations.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              {searchTerm ? 'No users found' : 'No data available'}
            </h3>
            <p className="mb-4 text-gray-600">
              {searchTerm 
                ? 'Try adjusting your search terms.' 
                : 'Unable to load organization data. Please check your permissions.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(filteredOrganizations || []).map((org, index) => {
            const uniqueKey = org.objectId || `org-${index}`
            return (
              <Card key={uniqueKey} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleOrgExpansion(org.objectId)}
                      className="w-8 h-8 p-1"
                    >
                      {expandedOrgs.has(org.objectId) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">{org.Name}</CardTitle>
                      <CardDescription>
                        Created {formatDate(org.createdAt)}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{org.users.length} users</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Building2 className="w-4 h-4" />
                        <span>{org.teams.length} teams</span>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedOrgForUser(org)
                          setIsAddUserModalOpen(true)
                        }}>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedOrgForTeam(org)
                          setIsCreateTeamModalOpen(true)
                        }}>
                          <Building2 className="w-4 h-4 mr-2" />
                          Create Team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              {expandedOrgs.has(org.objectId) && (
                <CardContent className="pt-0">
                  {org.users.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                      <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>No users in this organization yet.</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => {
                          setSelectedOrgForUser(org)
                          setIsAddUserModalOpen(true)
                        }}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add First User
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Teams</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[120px]">Toggle Status</TableHead>
                          <TableHead className="w-[50px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(org.users || []).map((user, index) => {
                          const isUserBeingToggled = togglingUsers.has(user.objectId)
                          const uniqueKey = user.objectId || `user-${index}`
                          
                          return (
                            <TableRow key={uniqueKey}>
                              <TableCell>
                                <div className="font-medium">{user.Name}</div>
                                {user.Company && (
                                  <div className="text-sm text-gray-500">{user.Company}</div>
                                )}
                              </TableCell>
                              <TableCell>{user.Email}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {getUserRoleDisplay(user.UserRole)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {user.TeamIds?.length ? (
                                  <div className="text-sm">
                                    {user.TeamIds.length} team{user.TeamIds.length > 1 ? 's' : ''}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">No teams</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={user.IsDisabled ? "destructive" : "default"}
                                  className={user.IsDisabled ? "" : "bg-green-100 text-green-800"}
                                >
                                  {user.IsDisabled ? 'Disabled' : 'Active'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <UserStatusToggle 
                                  user={user} 
                                  isLoading={isUserBeingToggled}
                                />
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem 
                                      className="text-red-600 focus:text-red-600"
                                      onClick={() => handleDeleteUser(user)}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete User
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}

                  {/* Teams Section */}
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">Teams ({org.teams.length})</h4>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedOrgForTeam(org)
                          setIsCreateTeamModalOpen(true)
                        }}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Building2 className="w-4 h-4 mr-2" />
                        Create Team
                      </Button>
                    </div>

                    {org.teams.length === 0 ? (
                      <div className="py-8 text-center text-gray-500 border border-gray-200 rounded-lg">
                        <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p>No teams in this organization yet.</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => {
                            setSelectedOrgForTeam(org)
                            setIsCreateTeamModalOpen(true)
                          }}
                        >
                          <Building2 className="w-4 h-4 mr-2" />
                          Create First Team
                        </Button>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Team Name</TableHead>
                            <TableHead>Organization</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[120px]">Toggle Status</TableHead>
                            <TableHead className="w-[50px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(org.teams || []).map((team, index) => {
                            const isTeamBeingToggled = togglingTeams.has(team.objectId)
                            const uniqueKey = team.objectId || `team-${index}`
                            
                            return (
                              <TableRow key={uniqueKey}>
                                <TableCell>
                                  <div className="font-medium">{team.Name}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm text-gray-500">
                                    {org.Name}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm text-gray-500">
                                    {formatDate(team.createdAt)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={team.IsActive ? "default" : "secondary"}
                                    className={team.IsActive ? "bg-green-100 text-green-800" : ""}
                                  >
                                    {team.IsActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <TeamStatusToggle 
                                    team={team} 
                                    isLoading={isTeamBeingToggled}
                                  />
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreHorizontal className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem>
                                        <Users className="w-4 h-4 mr-2" />
                                        Manage Members
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <CreateOrganizationModal 
        isOpen={isCreateOrgModalOpen}
        onClose={() => setIsCreateOrgModalOpen(false)}
        onSuccess={handleCreateOrganization}
      />

      {/* Create Team Modal - Disabled due to backend limitations */}
      {/* 
      <CreateTeamModal
        isOpen={isCreateTeamModalOpen}
        onClose={() => setIsCreateTeamModalOpen(false)}
        onSubmit={handleCreateTeam}
        organizationMembers={organizations[0]?.users || []}
      />
      */}

      {selectedOrgForUser && (
        <AddMemberToTeamModal
          isOpen={isAddUserModalOpen}
          onClose={() => {
            setIsAddUserModalOpen(false)
            setSelectedOrgForUser(null)
          }}
          onSubmit={async (userData) => {
            try {
              await SuperAdminApiService.createUser({
                name: userData.name,
                email: userData.email,
                password: userData.password,
                role: userData.role,
                company: userData.company,
                organizationId: selectedOrgForUser.objectId
              })
              
              toast({
                title: "Success",
                description: `User "${userData.name}" has been added to ${selectedOrgForUser.Name}.`
              })
              
              await loadSuperAdminData() // Reload data
            } catch (error) {
              console.error('Error adding user:', error)
              throw error
            }
          }}
          teamName={`${selectedOrgForUser.Name} Organization`}
          teamId={selectedOrgForUser.objectId}
        />
      )}

      {/* Create Team Modal */}
      {selectedOrgForTeam && (
        <CreateTeamModal
          isOpen={isCreateTeamModalOpen}
          onClose={() => {
            setIsCreateTeamModalOpen(false)
            setSelectedOrgForTeam(null)
          }}
          onSubmit={async (teamData) => {
            try {
              await SuperAdminApiService.createTeam(selectedOrgForTeam.objectId, teamData.name)
              
              toast({
                title: "Success",
                description: `Team "${teamData.name}" has been created in ${selectedOrgForTeam.Name}.`
              })
              
              await loadSuperAdminData() // Reload data
            } catch (error) {
              console.error('Error creating team:', error)
              throw error
            }
          }}
          organizationMembers={selectedOrgForTeam.users || []}
          organizationId={selectedOrgForTeam.objectId}
          organizationName={selectedOrgForTeam.Name}
          onAddMember={async (userData) => {
            try {
              await SuperAdminApiService.createUser({
                name: userData.name,
                email: userData.email,
                password: userData.password,
                role: userData.role,
                company: userData.company,
                organizationId: selectedOrgForTeam.objectId
              })
              
              toast({
                title: "Success",
                description: `User "${userData.name}" has been added to ${selectedOrgForTeam.Name}.`
              })
              
              // Reload data to refresh the organization members list
              await loadSuperAdminData()
            } catch (error) {
              console.error('Error adding user:', error)
              throw error
            }
          }}
        />
      )}

      {/* Delete User Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete User Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the user account for{' '}
              <strong>{userToDelete?.Name}</strong> ({userToDelete?.Email}).
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid items-center grid-cols-4 gap-4">
              <label htmlFor="confirmation-email" className="text-sm font-medium text-right">
                Confirm Email:
              </label>
              <Input
                id="confirmation-email"
                type="email"
                placeholder={userToDelete?.Email}
                value={confirmationEmail}
                onChange={(e) => setConfirmationEmail(e.target.value)}
                className="col-span-3"
                disabled={isDeleting}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Please type the user&apos;s email address to confirm deletion.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cancelDeleteUser} disabled={isDeleting}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteUser}
              disabled={isDeleting || !confirmationEmail || confirmationEmail.toLowerCase() !== userToDelete?.Email.toLowerCase()}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Organization Selector for Team Creation */}
      <Dialog open={isOrgSelectorForTeamOpen} onOpenChange={setIsOrgSelectorForTeamOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Select Organization</DialogTitle>
            <DialogDescription>
              Choose the organization where you want to create a new team.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              {organizations.map((org) => (
                <div
                  key={org.objectId}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    setSelectedOrgForTeam(org)
                    setIsOrgSelectorForTeamOpen(false)
                    setIsCreateTeamModalOpen(true)
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium">{org.Name}</div>
                      <div className="text-sm text-gray-500">
                        {org.users.length} users • {org.teams.length} teams
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOrgSelectorForTeamOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}