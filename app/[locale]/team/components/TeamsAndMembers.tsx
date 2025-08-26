'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Calendar, Building2, AlertCircle, ChevronRight, ChevronDown } from "lucide-react"
import { teamsApiService } from '@/app/lib/templates-api-service'
import { CreateTeamModal } from './CreateTeamModal'
import { AddMemberToTeamModal } from './AddMemberToTeamModal'

interface Team {
  objectId: string
  Name: string
  IsActive: boolean
  OrganizationId?: {
    objectId: string
    Name?: string
  }
  createdAt: string
  updatedAt: string
}

interface TeamMember {
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
}

interface OrganizationData {
  teams: Team[]
  members: TeamMember[]
}

export function TeamsAndMembers() {
  const [organizationData, setOrganizationData] = useState<OrganizationData>({
    teams: [],
    members: []
  })
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set())
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false)
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false)
  const [selectedTeamForMember, setSelectedTeamForMember] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load organization data
  const loadOrganizationData = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Loading organization data...')
      
      // Load teams and organization users in parallel
      const [teamsData, membersData] = await Promise.all([
        teamsApiService.getTeams(),
        teamsApiService.getTeamMembers()
      ])
      
      // Convert teams data to proper interface
      const formattedTeams: Team[] = teamsData.map(team => ({
        objectId: team.objectId,
        Name: team.Name,
        IsActive: team.IsActive,
        OrganizationId: ('OrganizationId' in team) ? team.OrganizationId as { objectId: string; Name?: string } : undefined,
        createdAt: ('createdAt' in team) ? team.createdAt as string : new Date().toISOString(),
        updatedAt: ('updatedAt' in team) ? team.updatedAt as string : new Date().toISOString()
      }))
      
      setOrganizationData({
        teams: formattedTeams,
        members: membersData
      })
      
      // Auto-expand all teams and select first one
      const teamIds = new Set(formattedTeams.map(team => team.objectId))
      setExpandedTeams(teamIds)
      
      if (formattedTeams.length > 0 && !selectedTeam) {
        setSelectedTeam(formattedTeams[0])
      }
      
      console.log(`✅ Loaded ${formattedTeams.length} teams and ${membersData.length} organization members`)
      
    } catch (error) {
      console.error('❌ Error loading organization data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load organization data')
    } finally {
      setLoading(false)
    }
  }, [selectedTeam])

  useEffect(() => {
    loadOrganizationData()
  }, [loadOrganizationData])

  const handleCreateTeam = async (teamData: { name: string, selectedMembers: TeamMember[] }) => {
    try {
      console.log('🆕 Creating team:', teamData.name, 'with', teamData.selectedMembers.length, 'members')
      
      // Step 1: Create the team using master key (no session token for elevated privileges)
      console.log('📝 Step 1: Creating team in contracts_Teams using master key...')
      const createTeamResponse = await fetch('/api/proxy/opensign/classes/contracts_Teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Parse-Application-Id': 'opensign',
          // Intentionally omit X-Parse-Session-Token to trigger master key usage
        },
        body: JSON.stringify({
          Name: teamData.name,
          IsActive: true,
          OrganizationId: {
            __type: 'Pointer',
            className: 'contracts_Organizations',
            objectId: 'aynU0FOfNQ' // Your organization ID
          }
        })
      })

      if (!createTeamResponse.ok) {
        const errorData = await createTeamResponse.json()
        throw new Error(errorData.error || 'Failed to create team')
      }

      const teamResult = await createTeamResponse.json()
      const newTeamId = teamResult.objectId
      
      if (!newTeamId) {
        throw new Error('No team ID returned from server')
      }
      
      console.log('✅ Team created successfully with ID:', newTeamId)

      // Step 2: Add selected members using addUser function
      if (teamData.selectedMembers.length > 0) {
        console.log('👥 Step 2: Adding', teamData.selectedMembers.length, 'members using addUser function...')
        
        // Get current user details for organization and tenant info
        const userDetails = await teamsApiService.getCurrentUserDetails()
        
        if (!userDetails.organization || !userDetails.tenantId) {
          throw new Error('Unable to get organization or tenant information')
        }

        // Add each member sequentially using addUser function
        for (let i = 0; i < teamData.selectedMembers.length; i++) {
          const member = teamData.selectedMembers[i]
          
          try {
            console.log(`👤 Adding member ${i + 1}/${teamData.selectedMembers.length}: ${member.Name} using addUser`)
            
            // Use addUser function to add member to the newly created team
            const addMemberResponse = await fetch('/api/proxy/opensign/functions/adduser', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Parse-Application-Id': 'opensign',
                'X-Parse-Session-Token': sessionStorage.getItem('opensign_session_token') || document.cookie.replace(/(?:(?:^|.*;\s*)opensign_session_token\s*\=\s*([^;]*).*$)|^.*$/, "$1"),
              },
              body: JSON.stringify({
                name: member.Name,
                email: member.Email,
                password: teamsApiService.generatePassword(12), // Generate random password
                organization: {
                  objectId: userDetails.organization.objectId,
                  company: userDetails.organization.company
                },
                team: newTeamId, // Use the team ID from Step 1
                tenantId: userDetails.tenantId,
                role: member.UserRole?.replace('contracts_', '') || 'User',
                timezone: 'UTC'
              })
            })

            const memberResult = await addMemberResponse.json()
            
            if (addMemberResponse.ok && memberResult.result) {
              console.log('✅ Successfully added member:', member.Name, 'using addUser')
            } else {
              console.warn('⚠️ Failed to add member:', member.Name, memberResult.error)
            }
            
            // Small delay to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 100))
            
          } catch (memberError) {
            console.warn('⚠️ Error adding member:', member.Name, memberError)
          }
        }
        
        console.log('👥 Finished adding members using addUser function')
      }

      // Step 3: Reload data and close modal
      console.log('🔄 Step 3: Reloading organization data...')
      await loadOrganizationData()
      setIsCreateTeamModalOpen(false)
      
      // Expand the newly created team
      setExpandedTeams(prev => new Set([...prev, newTeamId]))
      
      console.log('🎉 Team creation completed: contracts_Teams + addUser!')
      
    } catch (error) {
      console.error('❌ Error creating team:', error)
      throw error
    }
  }

  const handleAddMemberToTeam = async (userData: {
    name: string
    email: string
    password: string
    role: string
    company?: string
  }) => {
    if (!selectedTeamForMember) {
      throw new Error('No team selected')
    }
    
    try {
      console.log('👤 Adding member to team:', userData, 'Team:', selectedTeamForMember.Name)
      
      // Get current user details for organization and tenant info
      const userDetails = await teamsApiService.getCurrentUserDetails()
      
      if (!userDetails.organization || !userDetails.tenantId) {
        throw new Error('Unable to get organization or tenant information')
      }
      
      const newUser = await teamsApiService.createTeamMember({
        ...userData,
        organization: userDetails.organization,
        team: selectedTeamForMember.objectId,
        tenantId: userDetails.tenantId,
        timezone: 'UTC'
      })
      
      if (newUser) {
        // Reload organization data to show the new member
        await loadOrganizationData()
        setIsAddMemberModalOpen(false)
        setSelectedTeamForMember(null)
        
        // Keep the team expanded to show the new member
        setExpandedTeams(prev => new Set([...prev, selectedTeamForMember.objectId]))
      }
    } catch (error) {
      console.error('❌ Error adding member to team:', error)
      throw error
    }
  }

  const openAddMemberModal = (team: Team) => {
    setSelectedTeamForMember(team)
    setIsAddMemberModalOpen(true)
  }

  const toggleTeamExpansion = (teamId: string) => {
    setExpandedTeams(prev => {
      const newSet = new Set(prev)
      if (newSet.has(teamId)) {
        newSet.delete(teamId)
      } else {
        newSet.add(teamId)
      }
      return newSet
    })
  }

  const getTeamMembers = (team: Team) => {
    return organizationData.members.filter(member => 
      member.TeamIds?.some(teamId => teamId.objectId === team.objectId)
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-100 text-green-800 border-green-200" : ""}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    )
  }

  const getUserRoleBadge = (role?: string) => {
    const isAdmin = role?.includes('Admin')
    const displayRole = role?.replace('contracts_', '') || 'User'
    
    return (
      <Badge 
        variant={isAdmin ? "destructive" : "outline"}
        className={isAdmin ? "" : "bg-blue-50 text-blue-700 border-blue-200"}
      >
        {displayRole}
      </Badge>
    )
  }

  const getMemberAvatar = (name: string) => {
    return (
      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
        <span className="text-sm font-medium text-green-700">
          {name?.charAt(0)?.toUpperCase() || '?'}
        </span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-b-2 border-green-600 rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading organization data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-destructive" />
          <p className="mb-2 font-medium text-destructive">Error Loading Organization Data</p>
          <p className="mb-4 text-sm text-muted-foreground">{error}</p>
          <Button onClick={loadOrganizationData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium">Organization Teams & Members</h3>
          <p className="text-sm text-muted-foreground">
            Manage your teams and their members within your organization
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateTeamModalOpen(true)} 
          className="flex items-center gap-2 text-white bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          Create Team
        </Button>
      </div>

      {/* Organization Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-green-600" />
            Organization Overview
          </CardTitle>
          <CardDescription>
            Teams and members in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-4">
            <div className="p-4 text-center border border-green-200 rounded-lg bg-green-50">
              <div className="text-2xl font-bold text-green-700">{organizationData.teams.length}</div>
              <div className="text-sm text-green-600">Teams</div>
            </div>
            <div className="p-4 text-center border border-blue-200 rounded-lg bg-blue-50">
              <div className="text-2xl font-bold text-blue-700">{organizationData.members.length}</div>
              <div className="text-sm text-blue-600">Total Members</div>
            </div>
            <div className="p-4 text-center border border-purple-200 rounded-lg bg-purple-50">
              <div className="text-2xl font-bold text-purple-700">
                {organizationData.teams.filter(t => t.IsActive).length}
              </div>
              <div className="text-sm text-purple-600">Active Teams</div>
            </div>
            <div className="p-4 text-center border border-orange-200 rounded-lg bg-orange-50">
              <div className="text-2xl font-bold text-orange-700">
                {organizationData.members.filter(m => m.UserRole?.includes('Admin')).length}
              </div>
              <div className="text-sm text-orange-600">Admins</div>
            </div>
          </div>

          {/* Teams List with Members */}
          <div className="space-y-4">
            <h4 className="mb-4 font-medium text-gray-900">Teams & Members</h4>
            
            {organizationData.teams.length === 0 ? (
              <div className="py-8 text-center">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-medium text-gray-900">No teams found</h3>
                <p className="mb-4 text-muted-foreground">Create your first team to get started</p>
                <Button 
                  onClick={() => setIsCreateTeamModalOpen(true)}
                  className="text-white bg-green-600 hover:bg-green-700"
                >
                  Create Team
                </Button>
              </div>
            ) : (
              organizationData.teams.map((team) => {
                const teamMembers = getTeamMembers(team)
                const isExpanded = expandedTeams.has(team.objectId)
                
                return (
                  <div key={team.objectId} className="border rounded-lg">
                    {/* Team Header */}
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleTeamExpansion(team.objectId)}
                    >
                      <div className="flex items-center space-x-3">
                        <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                        <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                          <Building2 className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{team.Name}</h4>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Users className="w-3 h-3" />
                            <span>{teamMembers.length} members</span>
                            <span>•</span>
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(team.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(team.IsActive)}
                      </div>
                    </div>
                    
                    {/* Team Members (Expanded) */}
                    {isExpanded && (
                      <div className="border-t bg-gray-50">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-gray-900">Team Members ({teamMembers.length})</h5>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => openAddMemberModal(team)}
                            >
                              <Users className="w-3 h-3 mr-1" />
                              Add Members
                            </Button>
                          </div>
                          
                          {teamMembers.length === 0 ? (
                            <div className="py-6 text-center">
                              <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">No members in this team</p>
                            </div>
                          ) : (
                            <div className="grid gap-3">
                              {teamMembers.map((member) => (
                                <div key={member.objectId} className="flex items-center justify-between p-3 bg-white border rounded-md">
                                  <div className="flex items-center space-x-3">
                                    {getMemberAvatar(member.Name)}
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{member.Name}</p>
                                      <p className="text-xs text-muted-foreground">{member.Email}</p>
                                      {member.Company && (
                                        <p className="text-xs text-muted-foreground">{member.Company}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {getUserRoleBadge(member.UserRole)}
                                    {member.IsDisabled && (
                                      <Badge variant="destructive" className="text-xs">Disabled</Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={isCreateTeamModalOpen}
        onClose={() => setIsCreateTeamModalOpen(false)}
        onSubmit={handleCreateTeam}
        organizationMembers={organizationData.members}
      />

      {/* Add Member to Team Modal */}
      <AddMemberToTeamModal
        isOpen={isAddMemberModalOpen}
        onClose={() => {
          setIsAddMemberModalOpen(false)
          setSelectedTeamForMember(null)
        }}
        onSubmit={handleAddMemberToTeam}
        teamName={selectedTeamForMember?.Name || ''}
        teamId={selectedTeamForMember?.objectId || ''}
      />
    </div>
  )
}
