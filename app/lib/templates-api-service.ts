import { openSignApiService } from "@/app/lib/api-service"
import type { Template, TemplateField, TemplateSigner, CreateTemplateRequest, UpdateTemplateRequest, TemplateListResponse } from "./templates-store"

// OpenSign Contact/Assignee interface for dynamic loading
export interface OpenSignContact {
  objectId: string
  Name: string
  Email: string
  Phone?: string
  UserRole?: string
  CreatedBy?: { objectId: string }
  UserId?: { objectId: string }
  TenantId?: { objectId: string }
  IsDeleted?: boolean
  createdAt: string
  updatedAt: string
}

// OpenSign Team Member interface
export interface OpenSignTeamMember {
  objectId: string
  Name: string
  Email: string
  Phone?: string
  UserRole?: string
  Company?: string
  JobTitle?: string
  IsDisabled?: boolean
  TeamIds?: Array<{
    objectId: string
    Name: string
    IsActive: boolean
  }>
  TenantId?: {
    objectId: string
    TenantName: string
  }
  OrganizationId?: {
    objectId: string
    Name: string
  }
  UserId?: {
    objectId: string
    name: string
    email: string
    phone?: string
  }
  createdAt: string
  updatedAt: string
}

// Interface for creating new team member
export interface CreateTeamMemberRequest {
  name: string
  email: string
  phone?: string
  password: string
  jobTitle?: string
  role: string
  team: string
  organization: {
    objectId: string
    company: string
  }
  tenantId: string
  timezone?: string
}

interface OpenSignTemplate {
  objectId: string
  Name?: string
  Description?: string
  URL?: string
  fileName?: string
  IsArchive?: boolean
  createdAt: string
  updatedAt: string
  CreatedBy?: { objectId: string }
  ExtUserPtr?: { objectId: string }
  Placeholders?: OpenSignPlaceholder[]
  SendinOrder?: boolean
  IsEnableOTP?: boolean
  IsTourEnabled?: boolean
  AutomaticReminders?: boolean
  RemindOnceInEvery?: number
  TimeToCompleteDays?: number
  RedirectUrl?: string
  Bcc?: { Email: string }[]
  AllowModifications?: boolean
}

interface OpenSignPlaceholder {
  Id: string
  Role: string
  name?: string
  email?: string
  blockColor?: string
  placeHolder?: OpenSignPage[]
}

interface OpenSignPage {
  pageNumber: number
  pos?: OpenSignPosition[]
}

interface OpenSignPosition {
  key: string
  type: string
  xPosition: number
  yPosition: number
  Width: number
  Height: number
  options?: {
    name?: string
    status?: string
    defaultValue?: string
    options?: string[]
  }
}

// Fallback templates when server is unavailable
function getFallbackTemplates(): TemplateListResponse {
  return {
    results: [],
    count: 0
  }
}

export const templatesApiService = {
  // Get all templates for the current user using OpenSign getReport function
  getTemplates: async (limit = 100, skip = 0, searchTerm = ""): Promise<TemplateListResponse> => {
    try {
      const response = await openSignApiService.post("functions/getReport", {
        reportId: "6TeaPr321t", // Templates report ID from OpenSign
        limit,
        skip,
        searchTerm
      }) as {
        result?: Record<string, unknown>[]
        error?: string
      }
      
      if (response.error) {
        throw new Error(`OpenSign API Error: ${response.error}`)
      }
      
      // Transform OpenSign template format to our format
      const templates = response.result?.map(result => transformOpenSignTemplate(result)) || []
      
      return {
        results: templates,
        count: templates.length
      }
    } catch (error) {
      console.error('Error fetching templates from server:', error)
      // Return fallback mock templates when server is unavailable
      return getFallbackTemplates()
    }
  },

    // Get single template by ID using OpenSign GetTemplate function
  getTemplate: async (templateId: string): Promise<Template> => {
    try {
      const response = await openSignApiService.post("functions/GetTemplate", {
        templateId
      }) as Record<string, unknown>
      
      if (response.error) {
        throw new Error(`OpenSign API Error: ${response.error as string}`)
      }
      
      return transformOpenSignTemplate(response)
    } catch (error) {
      console.error('Error fetching template:', error)
      throw error
    }
  },

  // Create a new template
  createTemplate: async (templateData: CreateTemplateRequest): Promise<Template> => {
    const openSignData = transformToOpenSignFormat(templateData)
    
    const response = await openSignApiService.post("classes/contracts_Template", openSignData)
    
    return transformOpenSignTemplate(response as Record<string, unknown>)
  },

  // Update an existing template
  updateTemplate: async (templateData: UpdateTemplateRequest): Promise<Template> => {
    const { id, ...data } = templateData
    const openSignData = transformToOpenSignFormat(data)
    
    const response = await openSignApiService.put(`classes/contracts_Template/${id}`, openSignData)
    
    return transformOpenSignTemplate(response as Record<string, unknown>)
  },

  // Delete a template
  deleteTemplate: async (templateId: string): Promise<void> => {
    await openSignApiService.delete(`classes/contracts_Template/${templateId}`)
  },

  // Save document as template
  saveAsTemplate: async (docId: string): Promise<Template> => {
    const response = await openSignApiService.post("functions/saveastemplate", {
      docId
    }) as Record<string, unknown> & { error?: string }
    
    if (response.error) {
      throw new Error(response.error as string)
    }
    
    return transformOpenSignTemplate(response)
  },

  // Duplicate a template
  duplicateTemplate: async (templateId: string, newName: string): Promise<Template> => {
    const template = await templatesApiService.getTemplate(templateId)
    
    const duplicateData: CreateTemplateRequest = {
      ...template,
      name: newName
    }
    
    return templatesApiService.createTemplate(duplicateData)
  }
}

// Transform OpenSign template format to our internal format
function transformOpenSignTemplate(data: Record<string, unknown>): Template {
  // Type assertion with proper checking
  const openSignTemplate = data as unknown as OpenSignTemplate
  
  const signers: TemplateSigner[] = (openSignTemplate.Placeholders as unknown[] || []).map((placeholder: unknown, index: number) => {
    const p = placeholder as Record<string, unknown>
    return {
      id: (p.Id || p.objectId) as string,
      role: (p.Role as string) || `Role ${index + 1}`,
      name: (p.name as string) || '',
      email: (p.email as string) || '',
      color: (p.blockColor as string) || getSignerColor(index),
      order: index + 1,
      status: 'pending' as const
    }
  })

  const fields: TemplateField[] = []
  
  // Extract fields from placeholders
  const placeholders = openSignTemplate.Placeholders as unknown[] || []
  placeholders.forEach((placeholder: unknown) => {
    const p = placeholder as Record<string, unknown>
    const placeHolder = p.placeHolder as unknown[] || []
    
    placeHolder.forEach((page: unknown) => {
      const pageData = page as Record<string, unknown>
      const positions = pageData.pos as unknown[] || []
      
      positions.forEach((position: unknown) => {
        const pos = position as Record<string, unknown>
        const options = pos.options as Record<string, unknown> || {}
        
        fields.push({
          id: (pos.key as string) || Math.random().toString(),
          type: mapOpenSignFieldType(pos.type as string),
          label: (options.name as string) || (pos.type as string),
          required: options.status === 'required',
          width: (pos.Width as number) || 100,
          height: (pos.Height as number) || 30,
          x: (pos.xPosition as number) || 0,
          y: (pos.yPosition as number) || 0,
          page: (pageData.pageNumber as number) || 1,
          defaultValue: (options.defaultValue as string) || '',
          options: (options.options as string[]) || [],
          signerRole: (p.Id as string) || (p.objectId as string) || '',
          signerIndex: Number(p.Role) || 0
        })
      })
    })
  })

  const createdBy = openSignTemplate.CreatedBy as Record<string, unknown> || {}
  const extUserPtr = openSignTemplate.ExtUserPtr as Record<string, unknown> || {}
  const bcc = openSignTemplate.Bcc as Record<string, unknown>[] || []

  return {
    id: openSignTemplate.objectId as string,
    name: (openSignTemplate.Name as string) || 'Untitled Template',
    description: (openSignTemplate.Description as string) || '',
    url: (openSignTemplate.URL as string) || '',
    fileName: (openSignTemplate.fileName as string) || '',
    status: openSignTemplate.IsArchive ? 'archived' : 'active',
    createdAt: (openSignTemplate.createdAt as string) || new Date().toISOString(),
    updatedAt: (openSignTemplate.updatedAt as string) || new Date().toISOString(),
    createdBy: (createdBy.objectId as string) || (extUserPtr.objectId as string) || '',
    fields,
    signers,
    sendInOrder: (openSignTemplate.SendinOrder as boolean) || false,
    otpEnabled: (openSignTemplate.IsEnableOTP as boolean) || false,
    tourEnabled: (openSignTemplate.IsTourEnabled as boolean) || false,
    reminderEnabled: (openSignTemplate.AutomaticReminders as boolean) || false,
    reminderInterval: (openSignTemplate.RemindOnceInEvery as number) || 5,
    completionDays: (openSignTemplate.TimeToCompleteDays as number) || 15,
    redirectUrl: (openSignTemplate.RedirectUrl as string) || '',
    bcc: bcc.map((b) => (b.Email as string)),
    allowModifications: (openSignTemplate.AllowModifications as boolean) || false
  }
}

// Transform our format to OpenSign format
function transformToOpenSignFormat(templateData: Partial<CreateTemplateRequest>): Record<string, unknown> {
  const placeholders: Record<string, unknown>[] = []
  
  // Group fields by signer
  const fieldsBySigner = templateData.fields?.reduce((acc, field) => {
    const signerRole = field.signerRole || 'default'
    if (!acc[signerRole]) acc[signerRole] = []
    acc[signerRole].push(field)
    return acc
  }, {} as Record<string, TemplateField[]>) || {}

  // Create placeholders for each signer
  templateData.signers?.forEach((signer) => {
    const signerFields = fieldsBySigner[signer.id] || []
    
    // Group fields by page
    const fieldsByPage = signerFields.reduce((acc, field) => {
      const page = field.page || 1
      if (!acc[page]) acc[page] = []
      acc[page].push(field)
      return acc
    }, {} as Record<number, TemplateField[]>)

    const placeHolder = Object.entries(fieldsByPage).map(([pageNumber, fields]) => ({
      pageNumber: parseInt(pageNumber),
      pos: fields.map(field => ({
        key: field.id,
        type: mapToOpenSignFieldType(field.type),
        xPosition: field.x,
        yPosition: field.y,
        Width: field.width,
        Height: field.height,
        options: {
          name: field.label,
          status: field.required ? 'required' : 'optional',
          defaultValue: field.defaultValue || '',
          options: field.options || []
        }
      }))
    }))

    placeholders.push({
      Id: signer.id,
      Role: signer.role,
      blockColor: signer.color,
      email: signer.email || '',
      placeHolder
    })
  })

  return {
    Name: templateData.name,
    Description: templateData.description || '',
    Type: 'template', // FIXED: Set Type to ensure it's not 'Folder'
    IsArchive: false, // FIXED: Explicitly set IsArchive to false
    URL: templateData.url || '',
    fileName: templateData.fileName || '',
    SendinOrder: templateData.sendInOrder || false,
    IsEnableOTP: templateData.otpEnabled || false,
    IsTourEnabled: templateData.tourEnabled || false,
    AutomaticReminders: templateData.reminderEnabled || false,
    RemindOnceInEvery: templateData.reminderInterval || 5,
    TimeToCompleteDays: templateData.completionDays || 15,
    RedirectUrl: templateData.redirectUrl || '',
    AllowModifications: templateData.allowModifications || false,
    Placeholders: placeholders
  }
}

// Map our field types to OpenSign field types
function mapToOpenSignFieldType(type: string): string {
  const mapping = {
    'signature': 'signature',
    'initials': 'initials',
    'text': 'text',
    'date': 'date',
    'email': 'email',
    'name': 'name',
    'company': 'company',
    'checkbox': 'checkbox',
    'dropdown': 'dropdown',
    'image': 'image'
  }
  return mapping[type as keyof typeof mapping] || 'text'
}

// Map OpenSign field types to our field types
function mapOpenSignFieldType(type: string): TemplateField['type'] {
  const mapping = {
    'signature': 'signature',
    'initials': 'initials',
    'text': 'text',
    'date': 'date',
    'email': 'email',
    'name': 'name',
    'company': 'company',
    'checkbox': 'checkbox',
    'dropdown': 'dropdown',
    'image': 'image'
  }
  return mapping[type as keyof typeof mapping] as TemplateField['type'] || 'text'
}

// Get default signer color based on index
function getSignerColor(index: number): string {
  const colors = [
    '#47a3ad', // Primary teal
    '#22C55E', // Green
    '#3B82F6', // Blue
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#10B981'  // Emerald
  ]
  return colors[index % colors.length]
}

// ================== DYNAMIC ASSIGNEE MANAGEMENT ==================

/**
 * Get contacts/assignees from OpenSign backend
 * Uses the 'getSigners' cloud function to search contacts
 */
export async function getAssignees(search: string = ''): Promise<OpenSignContact[]> {
  try {
    console.log('🔍 Fetching assignees from OpenSign backend...', { search })
    
    interface GetSignersResponse {
      result?: OpenSignContact[]
      error?: string
    }
    
    const data = await openSignApiService.post<GetSignersResponse>('/functions/getsigners', {
      search: search.trim()
    })
    
    if (data.error) {
      throw new Error(`OpenSign Error: ${data.error}`)
    }

    // The result should be an array of contacts
    const contacts = Array.isArray(data.result) ? data.result : []
    
    console.log('✅ Successfully fetched assignees:', {
      count: contacts.length,
      search,
      sample: contacts.slice(0, 3).map((c: OpenSignContact) => ({ name: c.Name, email: c.Email }))
    })

    return contacts
    
  } catch (error) {
    console.error('❌ Error fetching assignees:', error)
    
    // Return empty array on error rather than throwing
    // This allows the UI to gracefully handle the error
    return []
  }
}

/**
 * Create a new contact/assignee in OpenSign backend
 * Uses the 'savecontact' cloud function
 */
export async function createAssignee(contact: {
  name: string
  email: string
  phone?: string
}): Promise<OpenSignContact | null> {
  try {
    console.log('👤 Creating new assignee in OpenSign backend...', contact)
    
    interface SaveContactResponse {
      result?: OpenSignContact
      error?: string
    }
    
    const data = await openSignApiService.post<SaveContactResponse>('/functions/savecontact', {
      name: contact.name,
      email: contact.email,
      phone: contact.phone || '',
      tenantId: null // Will be set by the backend based on current user
    })
    
    if (data.error) {
      throw new Error(`OpenSign Error: ${data.error}`)
    }

    console.log('✅ Successfully created assignee:', data.result)
    return data.result || null
    
  } catch (error) {
    console.error('❌ Error creating assignee:', error)
    
    // Handle duplicate contact error gracefully
    if (error instanceof Error && error.message.includes('Contact already exists')) {
      console.warn('⚠️ Contact already exists, fetching existing contact...')
      const existingContacts = await getAssignees(contact.email)
      return existingContacts.find(c => c.Email === contact.email) || null
    }
    
    return null
  }
}

/**
 * Generate assignee initials for display (like TU, SM, etc.)
 * Falls back to first 2 letters of name if no proper initials
 */
export function generateAssigneeInitials(contact: OpenSignContact): string {
  if (!contact.Name) return 'UN' // Unknown
  
  const words = contact.Name.trim().split(/\s+/)
  
  if (words.length >= 2) {
    // Use first letter of first and last word
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  } else if (words.length === 1 && words[0].length >= 2) {
    // Use first 2 letters of single word
    return words[0].substring(0, 2).toUpperCase()
  } else {
    // Fallback
    return contact.Name.substring(0, 2).toUpperCase()
  }
}

// =============================================================================
// TEAMS API SERVICE
// =============================================================================

export const teamsApiService = {
  // Get all team members for the current organization
  getTeamMembers: async (): Promise<OpenSignTeamMember[]> => {
    try {
      console.log('👥 Fetching team members from OpenSign backend...')
      
      // First get current user details to get organization ID
      const userResponse = await openSignApiService.post("functions/getUserDetails", {}) as {
        result?: {
          OrganizationId?: { objectId: string }
        }
        error?: string
      }
      
      if (userResponse.error) {
        throw new Error(`Failed to get user details: ${userResponse.error}`)
      }
      
      const organizationId = userResponse.result?.OrganizationId?.objectId
      if (!organizationId) {
        console.log('👥 No organization ID found, user is not part of an organization')
        console.log('👥 Teams feature requires organization setup. Returning empty list.')
        return []
      }
      
      // Get team members by organization
      const response = await openSignApiService.post("functions/getuserlistbyorg", {
        organizationId
      }) as {
        result?: OpenSignTeamMember[]
        error?: string
      }
      
      if (response.error) {
        console.warn(`⚠️ Team members API returned error: ${response.error}`)
        return []
      }
      
      const teamMembers = response.result || []
      console.log(`👥 Successfully fetched ${teamMembers.length} team members`)
      
      return teamMembers
    } catch (error) {
      console.error('❌ Error fetching team members:', error)
      // Return empty array instead of throwing to gracefully handle the error
      return []
    }
  },

  // Get available teams for team assignment
  getTeams: async (): Promise<Array<{ objectId: string; Name: string; IsActive: boolean }>> => {
    try {
      console.log('🏢 Fetching teams from OpenSign backend...')
      
      // First check if user has organization access
      const userDetails = await teamsApiService.getCurrentUserDetails()
      if (!userDetails.organization) {
        console.log('🏢 No organization found for user, teams feature not available')
        return []
      }
      
      const response = await openSignApiService.post("functions/getteams", {
        active: true
      }) as {
        result?: Array<{ objectId: string; Name: string; IsActive: boolean }>
        error?: string
      }
      
      if (response.error) {
        console.warn(`⚠️ Teams API returned error: ${response.error}`)
        // Return empty array instead of throwing to gracefully handle missing teams
        return []
      }
      
      const teams = response.result || []
      console.log(`🏢 Successfully fetched ${teams.length} teams`)
      
      return teams
    } catch (error) {
      console.error('❌ Error fetching teams:', error)
      // Return empty array instead of throwing to gracefully handle the error
      return []
    }
  },

  // Create a new team member
  createTeamMember: async (memberData: CreateTeamMemberRequest): Promise<OpenSignTeamMember> => {
    try {
      console.log('👤 Creating new team member in OpenSign backend...', memberData)
      
      const response = await openSignApiService.post("functions/adduser", {
        name: memberData.name,
        email: memberData.email,
        phone: memberData.phone,
        password: memberData.password,
        organization: memberData.organization,
        team: memberData.team,
        tenantId: memberData.tenantId,
        timezone: memberData.timezone,
        role: memberData.role
      }) as {
        result?: OpenSignTeamMember
        error?: string
      }
      
      if (response.error) {
        throw new Error(`Failed to create team member: ${response.error}`)
      }
      
      if (!response.result) {
        throw new Error('No team member data returned from OpenSign')
      }
      
      console.log('✅ Team member created successfully:', response.result.objectId)
      return response.result
    } catch (error) {
      console.error('❌ Error creating team member:', error)
      throw error
    }
  },

  // Generate a random password for new team members
  generatePassword: (length = 12): string => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  },

  // Get current user organization and tenant details for creating team members
  getCurrentUserDetails: async (): Promise<{
    organization?: { objectId: string; company: string }
    tenantId?: string
    role?: string
    UserRole?: string
  }> => {
    try {
      console.log('👤 Fetching current user details...')
      
      const response = await openSignApiService.post("functions/getUserDetails", {}) as {
        result?: {
          OrganizationId?: { objectId: string; Name: string }
          TenantId?: { objectId: string }
          UserRole?: string
          Company?: string
        }
        error?: string
      }
      
      if (response.error) {
        throw new Error(`Failed to get user details: ${response.error}`)
      }
      
      console.log('👤 User details received:', response.result)
      
      return {
        organization: response.result?.OrganizationId ? {
          objectId: response.result.OrganizationId.objectId,
          company: response.result.OrganizationId.Name
        } : undefined,
        tenantId: response.result?.TenantId?.objectId,
        role: response.result?.UserRole,
        UserRole: response.result?.UserRole
      }
    } catch (error) {
      console.error('❌ Error fetching user details:', error)
      throw error
    }
  }
}

// =============================================================================
// CONTACTS API SERVICE
// =============================================================================

export const contactsApiService = {
  // Get all contacts for the current user
  getContacts: async (): Promise<OpenSignContact[]> => {
    try {
      console.log('📇 Fetching contacts from OpenSign backend...')
      
      // Use the getsigners function to get all contacts
      const response = await openSignApiService.post("functions/getsigners", {
        search: '' // Empty search to get all contacts
      }) as {
        result?: OpenSignContact[]
        error?: string
      }
      
      if (response.error) {
        console.warn(`⚠️ Contacts API returned error: ${response.error}`)
        return []
      }
      
      const contacts = response.result || []
      console.log(`📇 Successfully fetched ${contacts.length} contacts`)
      
      return contacts
    } catch (error) {
      console.error('❌ Error fetching contacts:', error)
      return []
    }
  },

  // Create a new contact
  createContact: async (contact: {
    name: string
    email: string
    phone?: string
  }): Promise<OpenSignContact | null> => {
    try {
      console.log('📇 Creating new contact in OpenSign backend...', contact)
      
      const response = await openSignApiService.post("functions/savecontact", {
        name: contact.name,
        email: contact.email,
        phone: contact.phone || ''
      }) as {
        result?: OpenSignContact
        error?: string
      }
      
      if (response.error) {
        throw new Error(`OpenSign Error: ${response.error}`)
      }

      console.log('✅ Successfully created contact:', response.result)
      return response.result || null
      
    } catch (error) {
      console.error('❌ Error creating contact:', error)
      
      // Handle duplicate contact error gracefully
      if (error instanceof Error && error.message.includes('Contact already exists')) {
        console.warn('⚠️ Contact already exists')
        throw new Error('Contact with this email already exists')
      }
      
      throw error
    }
  },

  // Get a specific contact by ID
  getContact: async (contactId: string): Promise<OpenSignContact | null> => {
    try {
      console.log('📇 Fetching contact by ID:', contactId)
      
      const response = await openSignApiService.post("functions/getcontact", {
        contactId
      }) as {
        result?: OpenSignContact
        error?: string
      }
      
      if (response.error) {
        console.warn(`⚠️ Get contact API returned error: ${response.error}`)
        return null
      }
      
      console.log('✅ Successfully fetched contact:', response.result)
      return response.result || null
      
    } catch (error) {
      console.error('❌ Error fetching contact:', error)
      return null
    }
  }
}

// OpenSign Team interface
export interface OpenSignTeam {
  objectId: string
  Name: string
  IsActive: boolean
  OrganizationId?: {
    objectId: string
    Name?: string
  }
  Ancestors?: Array<{
    objectId: string
  }>
  createdAt: string
  updatedAt: string
}

// OpenSign Organization interface
export interface OpenSignOrganization {
  objectId: string
  Name: string
  ExtUserId?: { objectId: string }
  CreatedBy?: { objectId: string }
  createdAt: string
  updatedAt: string
}