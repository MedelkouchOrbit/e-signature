'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { SuperAdminApiService, CreateOrganizationRequest, SuperAdminOrganization } from '@/app/lib/super-admin-api'
import { Loader2, Building2 } from "lucide-react"

interface CreateOrganizationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (organization: SuperAdminOrganization) => void
}

export function CreateOrganizationModal({ isOpen, onClose, onSuccess }: CreateOrganizationModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateOrganizationRequest>({
    name: '',
    description: '',
    adminUser: {
      name: '',
      email: '',
      password: '',
      company: '',
      phone: ''
    }
  })

  // Helper function to generate a unique email suggestion
  const generateUniqueEmail = (orgName: string) => {
    if (orgName.trim()) {
      const orgDomain = orgName.toLowerCase().replace(/[^a-z0-9]/g, '')
      const timestamp = Date.now().toString().slice(-6) // Last 6 digits
      return `admin${timestamp}@${orgDomain}.com`
    }
    return ''
  }

  // Auto-fill unique email when organization name changes
  const handleOrgNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      adminUser: {
        ...prev.adminUser,
        company: name,
        // Auto-suggest unique email if current email is empty or looks auto-generated
        email: (!prev.adminUser.email || prev.adminUser.email.includes('admin') && prev.adminUser.email.includes('@')) 
          ? generateUniqueEmail(name) 
          : prev.adminUser.email
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.adminUser.name.trim() || !formData.adminUser.email.trim() || !formData.adminUser.password.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    if (!formData.adminUser.email.includes('@')) {
      toast({
        title: "Validation Error", 
        description: "Please enter a valid email address.",
        variant: "destructive"
      })
      return
    }

    if (formData.adminUser.password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Set company name to organization name if not provided
      const organizationData = {
        ...formData,
        adminUser: {
          ...formData.adminUser,
          company: formData.adminUser.company || formData.name
        }
      }

      const newOrganization = await SuperAdminApiService.createOrganization(organizationData)
      
      toast({
        title: "Success",
        description: `Organization "${formData.name}" has been created successfully.`
      })

      // Reset form
      setFormData({
        name: '',
        description: '',
        adminUser: {
          name: '',
          email: '',
          password: '',
          company: '',
          phone: ''
        }
      })

      onSuccess?.(newOrganization)
      onClose()
    } catch (error) {
      console.error('Error creating organization:', error)
      
      let errorMessage = "Failed to create organization."
      
      if (error instanceof Error) {
        errorMessage = error.message
        
        // If it's a conflict error (user already exists), provide helpful guidance
        if (error.message.includes("already exists")) {
          errorMessage = `${error.message}\n\nSuggestions:\n• Try: admin+${Date.now()}@${formData.name.toLowerCase().replace(/\s+/g, '')}.com\n• Or use: ${formData.adminUser.name.toLowerCase().replace(/\s+/g, '')}@${formData.name.toLowerCase().replace(/\s+/g, '')}.com`
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        description: '',
        adminUser: {
          name: '',
          email: '',
          password: '',
          company: '',
          phone: ''
        }
      })
      onClose()
    }
  }

  const generatePassword = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let result = ''
    for (let i = 0; i < 12; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    setFormData(prev => ({
      ...prev,
      adminUser: {
        ...prev.adminUser,
        password: result
      }
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <span>Create New Organization</span>
          </DialogTitle>
          <DialogDescription>
            Create a new organization with an admin user. This will set up a complete organizational structure.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Organization Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Organization Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name *</Label>
              <Input
                id="org-name"
                value={formData.name}
                onChange={(e) => handleOrgNameChange(e.target.value)}
                placeholder="Enter organization name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-description">Description</Label>
              <Textarea
                id="org-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the organization"
                rows={2}
              />
            </div>
          </div>

          {/* Admin User Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Admin User Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admin-name">Admin Name *</Label>
                <Input
                  id="admin-name"
                  value={formData.adminUser.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    adminUser: { ...prev.adminUser, name: e.target.value }
                  }))}
                  placeholder="Enter admin name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin Email *</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={formData.adminUser.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    adminUser: { ...prev.adminUser, email: e.target.value }
                  }))}
                  placeholder="admin@organization.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">Admin Password *</Label>
              <div className="flex space-x-2">
                <Input
                  id="admin-password"
                  type="text"
                  value={formData.adminUser.password}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    adminUser: { ...prev.adminUser, password: e.target.value }
                  }))}
                  placeholder="Enter password (min 6 characters)"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePassword}
                  disabled={loading}
                >
                  Generate
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admin-company">Company</Label>
                <Input
                  id="admin-company"
                  value={formData.adminUser.company}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    adminUser: { ...prev.adminUser, company: e.target.value }
                  }))}
                  placeholder="Company name (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-phone">Phone</Label>
                <Input
                  id="admin-phone"
                  value={formData.adminUser.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    adminUser: { ...prev.adminUser, phone: e.target.value }
                  }))}
                  placeholder="Phone number (optional)"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Organization'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}