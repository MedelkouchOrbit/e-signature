'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Loader2, Users, Building2, Search, UserPlus } from "lucide-react"
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

export function CreateTeamModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  organizationMembers
}: CreateTeamModalProps) {
  const [currentTab, setCurrentTab] = useState('team-info')
  const [formData, setFormData] = useState({
    name: ''
  })
  const [selectedMembers, setSelectedMembers] = useState<TeamMember[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // New member form state
  const [newMemberData, setNewMemberData] = useState({
    name: '',
    email: '',
    role: 'User',
    company: ''
  })

  const handleAddNewMember = () => {
    if (!newMemberData.name.trim() || !newMemberData.email.trim()) {
      setError('Name and email are required')
      return
    }

    // Create a new team member object
    const newMember: TeamMember = {
      objectId: `temp_${Date.now()}`, // Temporary ID
      Name: newMemberData.name.trim(),
      Email: newMemberData.email.trim(),
      UserRole: newMemberData.role,
      Company: newMemberData.company.trim() || undefined,
      IsDisabled: false,
      createdAt: new Date().toISOString()
    }

    // Add to selected members
    setSelectedMembers(prev => [...prev, newMember])
    
    // Reset form
    setNewMemberData({
      name: '',
      email: '',
      role: 'User',
      company: ''
    })

    // Switch back to add-members tab to see the added member
    setCurrentTab('add-members')
    setError(null)
  }

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
      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
        <span className="text-sm font-medium text-green-700">
          {name?.charAt(0)?.toUpperCase() || '?'}
        </span>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a new team and add members from your organization.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="team-info" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Team Info
            </TabsTrigger>
            <TabsTrigger value="add-members" className="flex items-center gap-2" disabled={!formData.name.trim()}>
              <Users className="w-4 h-4" />
              Add Members ({selectedMembers.length})
            </TabsTrigger>
            <TabsTrigger value="create-member" className="flex items-center gap-2" disabled={!formData.name.trim()}>
              <UserPlus className="w-4 h-4" />
              Create Member
            </TabsTrigger>
          </TabsList>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="w-4 h-4" />
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
              <h4 className="mb-2 font-medium">Next Step: Add Members</h4>
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

              {/* Search and Add Member Button */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search members by name, email, or company..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => setCurrentTab('create-member')}
                    className="text-white bg-green-600 hover:bg-green-700 shrink-0"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                </div>
              </div>

              {/* Selected Members Summary */}
              {selectedMembers.length > 0 && (
                <div className="p-3 border border-green-200 rounded-lg bg-green-50">
                  <h5 className="mb-2 font-medium text-green-800">Selected Members ({selectedMembers.length})</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedMembers.map(member => (
                      <Badge key={member.objectId} variant="secondary" className="text-green-800 bg-green-100">
                        {member.Name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Members List */}
              <div className="overflow-y-auto border rounded-lg max-h-64">
                {filteredMembers.length === 0 ? (
                  <div className="py-8 text-center">
                    <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {searchTerm ? 'No members found matching your search' : 'No members available'}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 space-y-2">
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
                            <p className="text-sm font-medium text-gray-900 truncate">{member.Name}</p>
                            <p className="text-xs truncate text-muted-foreground">{member.Email}</p>
                            {member.Company && (
                              <p className="text-xs truncate text-muted-foreground">{member.Company}</p>
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

          <TabsContent value="create-member" className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-medium">Create New Team Member</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-member-name">Full Name *</Label>
                  <Input
                    id="new-member-name"
                    placeholder="Enter full name"
                    value={newMemberData.name}
                    onChange={(e) => setNewMemberData({ ...newMemberData, name: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-member-email">Email *</Label>
                  <Input
                    id="new-member-email"
                    type="email"
                    placeholder="Enter email address"
                    value={newMemberData.email}
                    onChange={(e) => setNewMemberData({ ...newMemberData, email: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-member-role">Role</Label>
                  <select 
                    id="new-member-role"
                    className="flex w-full h-10 px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newMemberData.role}
                    onChange={(e) => setNewMemberData({ ...newMemberData, role: e.target.value })}
                  >
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-member-company">Company (Optional)</Label>
                  <Input
                    id="new-member-company"
                    placeholder="Enter company name"
                    value={newMemberData.company}
                    onChange={(e) => setNewMemberData({ ...newMemberData, company: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex justify-end pt-4 border-t">
                <Button 
                  type="button"
                  className="text-white bg-green-600 hover:bg-green-700"
                  onClick={handleAddNewMember}
                  disabled={!newMemberData.name.trim() || !newMemberData.email.trim()}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add to Team
                </Button>
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
                className="text-white bg-green-600 hover:bg-green-700"
              >
                Next: Add Members
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.name.trim()}
                className="text-white bg-green-600 hover:bg-green-700"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Team
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
