"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Filter, MoreHorizontal, Users } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { teamsApiService, type OpenSignTeamMember } from "@/app/lib/templates-api-service"
import { AddTeamMemberModal } from "@/app/[locale]/team/components/AddTeamMemberModal"
import { useToast } from "@/hooks/use-toast"

export function TeamMembers() {
  const t = useTranslations("team")
  const { toast } = useToast()

  // State
  const [teamMembers, setTeamMembers] = useState<OpenSignTeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("All Members")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)

  // Load team members and current user role
  const loadTeamMembers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load both team members and current user details
      const [members, userDetails] = await Promise.all([
        teamsApiService.getTeamMembers(),
        teamsApiService.getCurrentUserDetails()
      ])
      
      setTeamMembers(members)
      setCurrentUserRole(userDetails.role || null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(errorMessage)
      toast({
        title: t("error"),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [t, toast])

  // Filter team members
  const filteredTeamMembers = useMemo(() => {
    return teamMembers.filter((member) => {
      // Search filter
      const matchesSearch = 
        member.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.Company?.toLowerCase().includes(searchTerm.toLowerCase())

      // Status filter
      const matchesStatus = statusFilter === "All Members" || 
        (statusFilter === "Active" && !member.IsDisabled) ||
        (statusFilter === "Inactive" && member.IsDisabled)

      return matchesSearch && matchesStatus
    })
  }, [teamMembers, searchTerm, statusFilter])

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    if (role?.includes('Admin')) return 'Manager'
    if (role?.includes('User')) return 'Manager'
    if (role?.includes('Guest')) return 'Guest'
    return 'Manager'
  }

  // Handle team member creation success
  const handleMemberCreated = (newMember: OpenSignTeamMember) => {
    setTeamMembers(prev => [newMember, ...prev])
    setIsAddModalOpen(false)
    toast({
      title: t("addMember.success"),
      description: `${newMember.Name} has been added to the team`,
    })
  }

  // Handle member actions
  const handleMemberAction = async (member: OpenSignTeamMember, action: string) => {
    switch (action) {
      case "edit":
        console.log("Edit member:", member)
        break
      case "activate":
      case "deactivate":
        console.log(`${action} member:`, member)
        break
      case "delete":
        console.log("Delete member:", member)
        break
      case "resendInvite":
        console.log("Resend invite to:", member)
        break
    }
  }

  // Load data on mount
  useEffect(() => {
    loadTeamMembers()
  }, [loadTeamMembers])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-500">Loading team members...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-3">
              <p className="text-red-600">Error loading team members</p>
              <Button onClick={loadTeamMembers} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Members</h1>
          <p className="text-gray-600">Manage your team members and their roles</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search team members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              
              {/* Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] border-gray-300 focus:border-green-500 focus:ring-green-500">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Members">All Members</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Add Member Button */}
            {currentUserRole && (currentUserRole.includes('Admin') || currentUserRole.includes('Manager')) && (
              <Button 
                onClick={() => setIsAddModalOpen(true)} 
                className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Team Member
              </Button>
            )}
          </div>
        </div>

        {/* Team Members Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {filteredTeamMembers.length} Team Members
              </h2>
              <div className="text-sm text-gray-500">
                {filteredTeamMembers.length} of {teamMembers.length} row(s) selected.
              </div>
            </div>
          </div>

          {/* Table Content */}
          {filteredTeamMembers.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No team members found</h3>
              <p className="mt-2 text-gray-500">No team members found. Add your first team member to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-900 py-4">Name</TableHead>
                    <TableHead className="font-semibold text-gray-900">Position</TableHead>
                    <TableHead className="font-semibold text-gray-900">Email</TableHead>
                    <TableHead className="font-semibold text-gray-900">Phone Number</TableHead>
                    <TableHead className="font-semibold text-gray-900">Company Name</TableHead>
                    <TableHead className="font-semibold text-gray-900">Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeamMembers.map((member) => (
                    <TableRow 
                      key={member.objectId} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700 mr-3">
                            {member.Name ? member.Name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <span className="font-medium text-gray-900">{member.Name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {getRoleDisplayName(member.UserRole || '')}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {member.Email}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {member.Phone || '1234567890'}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {member.Company || 'ABC Company'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={member.IsDisabled ? "secondary" : "default"}
                          className={member.IsDisabled ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-800"}
                        >
                          {member.IsDisabled ? "Inactive" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleMemberAction(member, "edit")}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleMemberAction(member, member.IsDisabled ? "activate" : "deactivate")}
                            >
                              {member.IsDisabled ? "Activate" : "Deactivate"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMemberAction(member, "resendInvite")}>
                              Resend Invite
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleMemberAction(member, "delete")}
                              className="text-red-600"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Table Footer */}
          {filteredTeamMembers.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div>
                  0 of {filteredTeamMembers.length} row(s) selected.
                </div>
                <div className="flex items-center space-x-2">
                  <span>Rows per page</span>
                  <Select defaultValue="10">
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>Page 1 of 1</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Team Member Modal */}
        <AddTeamMemberModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleMemberCreated}
        />
      </div>
    </div>
  )
}
