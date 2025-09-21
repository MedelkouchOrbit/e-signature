'use client'

import React, { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { SuperAdminApiService, SuperAdminOrganization } from '@/app/lib/super-admin-api'
import { Building2 } from "lucide-react"

interface OrganizationSelectorProps {
  selectedOrgId?: string
  onOrganizationChange: (organizationId: string) => void
  label?: string
  placeholder?: string
}

export function OrganizationSelector({ 
  selectedOrgId, 
  onOrganizationChange, 
  label = "Organization",
  placeholder = "Select an organization"
}: OrganizationSelectorProps) {
  const [organizations, setOrganizations] = useState<SuperAdminOrganization[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        setLoading(true)
        const orgs = await SuperAdminApiService.getAllOrganizations()
        setOrganizations(orgs)
      } catch (error) {
        console.error('Error loading organizations:', error)
      } finally {
        setLoading(false)
      }
    }

    loadOrganizations()
  }, [])

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select 
        value={selectedOrgId} 
        onValueChange={onOrganizationChange}
        disabled={loading}
      >
        <SelectTrigger>
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4 text-gray-400" />
            <SelectValue placeholder={loading ? "Loading..." : placeholder} />
          </div>
        </SelectTrigger>
        <SelectContent>
          {organizations.map((org) => (
            <SelectItem key={org.objectId} value={org.objectId}>
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span>{org.Name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}