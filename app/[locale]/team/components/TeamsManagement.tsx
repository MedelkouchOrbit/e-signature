'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Calendar, Building2, AlertCircle } from "lucide-react"
import { teamsApiService } from '@/app/lib/templates-api-service'
import { CreateTeamModal } from './CreateTeamModal'
import { AddUserToTeamModal } from './AddUserToTeamModal'

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

export function TeamsManagement() {
  const [teams, setTeams] = useState<Team[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false)
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load teams and organization users
  const loadTeamsData = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Loading teams and organization data...')
      
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
        // Handle missing properties gracefully
        OrganizationId: ('OrganizationId' in team) ? team.OrganizationId as { objectId: string; Name?: string } : undefined,
        createdAt: ('createdAt' in team) ? team.createdAt as string : new Date().toISOString(),
        updatedAt: ('updatedAt' in team) ? team.updatedAt as string : new Date().toISOString()
      }))
      
      setTeams(formattedTeams)
      setTeamMembers(membersData)
      
      // Auto-select first team if available
      if (formattedTeams.length > 0 && !selectedTeam) {
        setSelectedTeam(formattedTeams[0])
      }
      
      console.log(`✅ Loaded ${formattedTeams.length} teams and ${membersData.length} organization users`)
      
    } catch (error) {
      console.error('❌ Error loading teams data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load teams data')
    } finally {
      setLoading(false)
    }
  }, [selectedTeam])

  useEffect(() => {
    loadTeamsData()
  }, [loadTeamsData])

  const handleCreateTeam = async (teamData: { name: string }) => {
    try {
      console.log('🆕 Creating new team:', teamData)
      
      const newTeam = await teamsApiService.createTeam(teamData)
      
      if (newTeam) {
        // Reload teams to get the latest data
        await loadTeamsData()
        setIsCreateTeamModalOpen(false)
        
        // Select the newly created team
        const createdTeam = teams.find(t => t.objectId === newTeam.objectId)
        if (createdTeam) {
          setSelectedTeam(createdTeam)
        }
      }
    } catch (error) {
      console.error('❌ Error creating team:', error)
      // Don't close modal on error, let user see the error
      throw error
    }
  }

  const handleAddUserToTeam = async (userData: {
    name: string
    email: string
    password: string
    role: string
    company?: string
  }) => {
    if (!selectedTeam) {
      throw new Error('No team selected')
    }
    
    try {
      console.log('👤 Adding user to team:', userData)
      
      // Get current user details for organization and tenant info
      const userDetails = await teamsApiService.getCurrentUserDetails()
      
      if (!userDetails.organization || !userDetails.tenantId) {
        throw new Error('Unable to get organization or tenant information')
      }
      
      const newUser = await teamsApiService.createTeamMember({
        ...userData,
        organization: userDetails.organization,
        team: selectedTeam.objectId,
        tenantId: userDetails.tenantId,
        timezone: 'UTC'
      })
      
      if (newUser) {
        // Reload team members
        await loadTeamsData()
        setIsAddUserModalOpen(false)
      }
    } catch (error) {
      console.error('❌ Error adding user to team:', error)
      throw error
    }
  }

  const getTeamMembersForSelectedTeam = () => {
    if (!selectedTeam) return []
    
    return teamMembers.filter(member => 
      member.TeamIds?.some(teamId => teamId.objectId === selectedTeam.objectId)
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
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    )
  }

  const getUserRoleBadge = (role?: string) => {
    const roleColor = role?.includes('Admin') ? "destructive" : "outline"
    const displayRole = role?.replace('contracts_', '') || 'User'
    
    return (
      <Badge variant={roleColor}>
        {displayRole}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading teams...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <p className="text-destructive font-medium mb-2">Error Loading Teams</p>
          <p className="text-muted-foreground text-sm mb-4">{error}</p>
          <Button onClick={loadTeamsData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Teams Management</h3>
          <p className="text-sm text-muted-foreground">
            Organize your organization into teams and manage team members
          </p>
        </div>
        <Button onClick={() => setIsCreateTeamModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Team
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Teams ({teams.length})
            </CardTitle>
            <CardDescription>
              Select a team to view its members
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {teams.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No teams found</p>
                <Button 
                  onClick={() => setIsCreateTeamModalOpen(true)} 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                >
                  Create your first team
                </Button>
              </div>
            ) : (
              teams.map((team) => (
                <div
                  key={team.objectId}
                  onClick={() => setSelectedTeam(team)}
                  className={`p-3 rounded-md border cursor-pointer transition-colors ${
                    selectedTeam?.objectId === team.objectId
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">{team.Name}</h4>
                    {getStatusBadge(team.IsActive)}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(team.createdAt)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {selectedTeam ? `${selectedTeam.Name} Members` : 'Select a Team'}
                </CardTitle>
                <CardDescription>
                  {selectedTeam 
                    ? `Manage members of the ${selectedTeam.Name} team`
                    : 'Choose a team from the left to view its members'
                  }
                </CardDescription>
              </div>
              {selectedTeam && (
                <Button 
                  onClick={() => setIsAddUserModalOpen(true)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Member
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedTeam ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a team to view its members</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getTeamMembersForSelectedTeam().length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">No members in this team</p>
                    <Button 
                      onClick={() => setIsAddUserModalOpen(true)}
                      variant="outline" 
                      size="sm"
                    >
                      Add first member
                    </Button>
                  </div>
                ) : (
                  getTeamMembersForSelectedTeam().map((member) => (
                    <div key={member.objectId} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {member.Name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{member.Name}</p>
                          <p className="text-xs text-muted-foreground">{member.Email}</p>
                          {member.Company && (
                            <p className="text-xs text-muted-foreground">{member.Company}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getUserRoleBadge(member.UserRole)}
                        {member.IsDisabled && (
                          <Badge variant="destructive">Disabled</Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <CreateTeamModal
        isOpen={isCreateTeamModalOpen}
        onClose={() => setIsCreateTeamModalOpen(false)}
        onSubmit={handleCreateTeam}
      />

      <AddUserToTeamModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSubmit={handleAddUserToTeam}
        teamName={selectedTeam?.Name || ''}
      />
    </div>
  )
}
