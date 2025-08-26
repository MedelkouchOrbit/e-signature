"use client"

import { useState, useEffect } from "react"
import { X, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { teamsApiService } from "@/app/lib/templates-api-service"
import type { OpenSignTeamMember, CreateTeamMemberRequest } from "@/app/lib/templates-api-service"

interface AddTeamMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (member: OpenSignTeamMember) => void
}

export function AddTeamMemberModal({ isOpen, onClose, onSuccess }: AddTeamMemberModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    jobTitle: '',
    role: 'User',
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [userDetails, setUserDetails] = useState<{
    organization?: { objectId: string; company: string }
    tenantId?: string
    role?: string
  }>({})

  // Load user details when modal opens
  useEffect(() => {
    if (isOpen) {
      loadInitialData()
    }
  }, [isOpen])

  const loadInitialData = async () => {
    try {
      const userData = await teamsApiService.getCurrentUserDetails()
      setUserDetails(userData)
      
      // Auto-generate password
      const generatedPassword = teamsApiService.generatePassword(12)
      setFormData(prev => ({
        ...prev,
        password: generatedPassword
      }))
    } catch (error) {
      console.error('Error loading initial data:', error)
      setError('Failed to load user data')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Validate required fields
      if (!formData.name || !formData.email || !formData.password) {
        setError('Name, email, and password are required')
        setIsLoading(false)
        return
      }

      // Check if user has permission to add team members
      // OpenSign roles: contracts_Admin, contracts_User, contracts_Guest
      if (!userDetails.role || (!userDetails.role.includes('Admin') && !userDetails.role.includes('Manager'))) {
        setError('You do not have permission to add team members.')
        setIsLoading(false)
        return
      }

      // Check if admin has an organization set up
      if (!userDetails.organization || !userDetails.organization.objectId) {
        setError('Admin account needs to be set up with an organization first. Please contact your system administrator to run the organization setup process.')
        setIsLoading(false)
        return
      }

      // Check if we have a valid tenant ID
      if (!userDetails.tenantId) {
        setError('Missing tenant information. Please contact support.')
        setIsLoading(false)
        return
      }

      // Get teams and use the first one (default team)
      const teams = await teamsApiService.getTeams()
      
      if (!teams || teams.length === 0) {
        setError('No teams found. Please create a team first or contact support.')
        setIsLoading(false)
        return
      }

      const defaultTeam = teams[0].objectId

      const createRequest: CreateTeamMemberRequest = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        jobTitle: formData.jobTitle,
        role: formData.role,
        team: defaultTeam,
        organization: userDetails.organization,
        tenantId: userDetails.tenantId,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }

      const newMember = await teamsApiService.createTeamMember(createRequest)
      
      onSuccess(newMember)
      onClose()
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        jobTitle: '',
        role: 'User',
      })
    } catch (error) {
      console.error('Error creating team member:', error)
      setError(error instanceof Error ? error.message : 'Failed to create team member')
    } finally {
      setIsLoading(false)
    }
  }

  const generateNewPassword = () => {
    const newPassword = teamsApiService.generatePassword(12)
    setFormData(prev => ({ ...prev, password: newPassword }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md mx-4 bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Add Team Member
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 text-red-700 border border-red-300 rounded-md bg-red-50">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
              First Name
            </Label>
            <Input
              id="firstName"
              type="text"
              placeholder="enter first name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Company Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="enter company email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
              Mobile Number
            </Label>
            <div className="flex mt-1">
              <Select defaultValue="EG">
                <SelectTrigger className="w-20 border-gray-300 focus:border-green-500 focus:ring-green-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EG">🇪🇬</SelectItem>
                  <SelectItem value="US">🇺🇸</SelectItem>
                  <SelectItem value="GB">🇬🇧</SelectItem>
                  <SelectItem value="FR">🇫🇷</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="phone"
                type="tel"
                placeholder="+966"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="flex-1 ml-2 border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="jobTitle" className="text-sm font-medium text-gray-700">
              Job Title
            </Label>
            <Input
              id="jobTitle"
              type="text"
              placeholder="enter your job title"
              value={formData.jobTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
              className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <div className="flex mt-1">
              <div className="relative flex-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="pr-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={generateNewPassword}
                className="ml-2 border-gray-300 hover:bg-gray-50"
              >
                Generate
              </Button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? 'Creating...' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
