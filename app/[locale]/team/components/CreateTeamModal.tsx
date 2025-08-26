'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Loader2, Users, Building2, Search } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

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

interface CreateTeamModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (teamData: { name: string, selectedMembers: TeamMember[] }) => Promise<void>
  organizationMembers: TeamMember[]
}

export function CreateTeamModal({ isOpen, onClose, onSubmit, organizationMembers }: CreateTeamModalProps) {
  const [currentTab, setCurrentTab] = useState('team-info')
  const [formData, setFormData] = useState({
    name: ''
  })
  const [selectedMembers, setSelectedMembers] = useState<TeamMember[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Team name is required')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      
      await onSubmit({
        name: formData.name.trim(),
        selectedMembers
      })
      
      // Reset form on success
      setFormData({ name: '' })
      setSelectedMembers([])
      setCurrentTab('team-info')
      
    } catch (error) {
      console.error('Error creating team:', error)
      setError(error instanceof Error ? error.message : 'Failed to create team')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ name: '' })
      setSelectedMembers([])
      setCurrentTab('team-info')
      setSearchTerm('')
      setError(null)
      onClose()
    }
  }

  const handleNext = () => {
    if (!formData.name.trim()) {
      setError('Team name is required')
      return
    }
    setError(null)
    setCurrentTab('add-members')
  }

  const handleBack = () => {
    setCurrentTab('team-info')
  }

  const toggleMemberSelection = (member: TeamMember) => {
    setSelectedMembers(prev => {
      const isSelected = prev.some(m => m.objectId === member.objectId)
      if (isSelected) {
        return prev.filter(m => m.objectId !== member.objectId)
      } else {
        return [...prev, member]
      }
    })
  }

  const filteredMembers = organizationMembers.filter(member =>
    member.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.Email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.Company && member.Company.toLowerCase().includes(searchTerm.toLowerCase()))
  )

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
      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
        <span className="text-sm font-medium text-green-700">
          {name?.charAt(0)?.toUpperCase() || '?'}
        </span>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-green-600" />
            Create New Team
          </DialogTitle>
          <DialogDescription>
            Create a new team and add members from your organization.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="team-info" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Team Info
            </TabsTrigger>
            <TabsTrigger value="add-members" className="flex items-center gap-2" disabled={!formData.name.trim()}>
              <Users className="h-4 w-4" />
              Add Members ({selectedMembers.length})
            </TabsTrigger>
          </TabsList>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <TabsContent value="team-info" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name *</Label>
              <Input
                id="team-name"
                type="text"
                placeholder="e.g., Development Team, Sales Team"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
                maxLength={100}
                required
              />
              <p className="text-xs text-muted-foreground">
                Choose a descriptive name for your team (max 100 characters)
              </p>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Next Step: Add Members</h4>
              <p className="text-sm text-muted-foreground">
                After setting the team name, you can select members from your organization to add to this team.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="add-members" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Select Team Members</h4>
                <div className="text-sm text-muted-foreground">
                  {selectedMembers.length} of {organizationMembers.length} selected
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members by name, email, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Selected Members Summary */}
              {selectedMembers.length > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h5 className="font-medium text-green-800 mb-2">Selected Members ({selectedMembers.length})</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedMembers.map(member => (
                      <Badge key={member.objectId} variant="secondary" className="bg-green-100 text-green-800">
                        {member.Name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Members List */}
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {searchTerm ? 'No members found matching your search' : 'No members available'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 p-4">
                    {filteredMembers.map((member) => {
                      const isSelected = selectedMembers.some(m => m.objectId === member.objectId)
                      
                      return (
                        <div
                          key={member.objectId}
                          className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={() => toggleMemberSelection(member)}
                        >
                          <Checkbox 
                            checked={isSelected}
                            onChange={() => toggleMemberSelection(member)}
                          />
                          {getMemberAvatar(member.Name)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">{member.Name}</p>
                            <p className="text-xs text-muted-foreground truncate">{member.Email}</p>
                            {member.Company && (
                              <p className="text-xs text-muted-foreground truncate">{member.Company}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {getUserRoleBadge(member.UserRole)}
                            {member.IsDisabled && (
                              <Badge variant="destructive" className="text-xs">Disabled</Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {currentTab === 'add-members' && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Back
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
          
          <div className="flex gap-2">
            {currentTab === 'team-info' ? (
              <Button
                onClick={handleNext}
                disabled={!formData.name.trim()}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Next: Add Members
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.name.trim()}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Team
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
