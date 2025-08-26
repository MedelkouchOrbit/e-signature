'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Loader2, Eye, EyeOff, Users, Search, UserPlus, Contact } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { teamsApiService, contactsApiService } from '@/app/lib/templates-api-service'
import type { OpenSignContact } from '@/app/lib/templates-api-service'

interface AddMemberToTeamModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (userData: {
    name: string
    email: string
    password: string
    role: string
    company?: string
  }) => Promise<void>
  teamName: string
  teamId: string
}

export function AddMemberToTeamModal({ isOpen, onClose, onSubmit, teamName }: AddMemberToTeamModalProps) {
  const [activeTab, setActiveTab] = useState('existing-contacts')
  
  // Form data for new member creation
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'User',
    company: ''
  })
  
  // Contact selection state
  const [contacts, setContacts] = useState<OpenSignContact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactsError, setContactsError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load contacts when modal opens
  useEffect(() => {
    if (isOpen) {
      loadContacts()
    }
  }, [isOpen])

  const loadContacts = async () => {
    setContactsLoading(true)
    setContactsError(null)
    
    try {
      const contactsList = await contactsApiService.getContacts()
      setContacts(contactsList)
    } catch (error) {
      console.error('Error loading contacts:', error)
      setContactsError('Failed to load contacts')
    } finally {
      setContactsLoading(false)
    }
  }

  const filteredContacts = contacts.filter(contact => 
    contact.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.Email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleContactSelection = (contactId: string) => {
    setSelectedContacts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(contactId)) {
        newSet.delete(contactId)
      } else {
        newSet.add(contactId)
      }
      return newSet
    })
  }

  const handleAddSelectedContacts = async () => {
    if (selectedContacts.size === 0) {
      setError('Please select at least one contact to add')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      for (const contactId of selectedContacts) {
        const contact = contacts.find(c => c.objectId === contactId)
        if (contact) {
          // Generate password for existing contact
          const password = teamsApiService.generatePassword(12)
          
          await onSubmit({
            name: contact.Name,
            email: contact.Email,
            password: password,
            role: 'User',
            company: ''
          })
        }
      }

      // Reset state on success
      setSelectedContacts(new Set())
      setActiveTab('existing-contacts')
      
    } catch (error) {
      console.error('Error adding selected contacts:', error)
      setError(error instanceof Error ? error.message : 'Failed to add selected contacts')
    } finally {
      setIsSubmitting(false)
    }
  }

  const generatePassword = () => {
    const newPassword = teamsApiService.generatePassword(12)
    setFormData({ ...formData, password: newPassword })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name.trim()) {
      setError('Name is required')
      return
    }
    
    if (!formData.email.trim()) {
      setError('Email is required')
      return
    }
    
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }
    
    if (!formData.password.trim()) {
      setError('Password is required')
      return
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      
      await onSubmit({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        company: formData.company.trim() || undefined
      })
      
      // Reset form on success
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'User',
        company: ''
      })
      
    } catch (error) {
      console.error('Error adding member to team:', error)
      setError(error instanceof Error ? error.message : 'Failed to add member to team')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'User',
        company: ''
      })
      setSelectedContacts(new Set())
      setSearchTerm('')
      setError(null)
      setShowPassword(false)
      setActiveTab('existing-contacts')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Add Members to {teamName}
          </DialogTitle>
          <DialogDescription>
            Select existing contacts or create new members to add to the {teamName} team.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing-contacts" className="flex items-center gap-2">
              <Contact className="h-4 w-4" />
              Existing Contacts
            </TabsTrigger>
            <TabsTrigger value="new-member" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Create New Member
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing-contacts" className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="contact-search">Search Contacts</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="contact-search"
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Contacts List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {contactsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                  <span className="ml-2 text-sm text-gray-600">Loading contacts...</span>
                </div>
              ) : contactsError ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                  <p className="text-sm text-red-600">{contactsError}</p>
                  <Button variant="outline" size="sm" onClick={loadContacts} className="mt-2">
                    Try Again
                  </Button>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-8">
                  <Contact className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {searchTerm ? 'No contacts found matching your search' : 'No contacts available'}
                  </p>
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <div
                    key={contact.objectId}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <Checkbox
                      id={contact.objectId}
                      checked={selectedContacts.has(contact.objectId)}
                      onCheckedChange={() => handleContactSelection(contact.objectId)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{contact.Name}</p>
                        {contact.UserRole && (
                          <Badge variant="outline" className="text-xs">
                            {contact.UserRole.replace('contracts_', '')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{contact.Email}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Selected count and action */}
            {selectedContacts.size > 0 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-gray-600">
                  {selectedContacts.size} contact{selectedContacts.size !== 1 ? 's' : ''} selected
                </p>
                <Button 
                  onClick={handleAddSelectedContacts}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Add Selected to Team
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="new-member" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="member-name">Full Name *</Label>
                <Input
                  id="member-name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isSubmitting}
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="member-email">Email Address *</Label>
                <Input
                  id="member-email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="member-password">Password *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generatePassword}
                    disabled={isSubmitting}
                  >
                    Generate
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="member-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter a secure password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={isSubmitting}
                    minLength={6}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Password must be at least 6 characters long
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="member-role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="User">User</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="member-company">Company (Optional)</Label>
                <Input
                  id="member-company"
                  type="text"
                  placeholder="Company name"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  disabled={isSubmitting}
                  maxLength={100}
                />
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Add Member
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
