/**
 * ✅ OpenSign Contact Management Services
 * Modern React Query implementation of OpenSign contact cloud functions
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { openSignApiService } from '@/app/lib/api-service'

// === Types ===
export interface OpenSignContact {
  objectId: string
  Name: string
  Email: string
  Phone?: string
  Company?: string
  JobTitle?: string
  UserRole: string
  IsDeleted?: boolean
  CreatedBy: {
    objectId: string
    className: string
  }
  UserId?: {
    objectId: string
    className: string
  }
  TenantId?: {
    objectId: string
    className: string
  }
  createdAt: string
  updatedAt: string
}

export interface SaveContactRequest {
  name: string
  email: string
  phone?: string
  company?: string
  jobTitle?: string
  tenantId?: string
}

export interface EditContactRequest {
  contactId: string
  name: string
  email: string
  phone?: string
  company?: string
  jobTitle?: string
}

export interface CreateBatchContactRequest {
  contacts: Omit<SaveContactRequest, 'tenantId'>[]
}

// Define response types for Parse Server functions
interface ParseServerResponse<T = unknown> {
  result?: T
  error?: string
  code?: number
}

// === Query Keys ===
export const contactQueryKeys = {
  all: () => ['opensign', 'contacts'] as const,
  search: (searchTerm: string) => ['opensign', 'contacts', 'search', searchTerm] as const,
  detail: (contactId: string) => ['opensign', 'contacts', 'detail', contactId] as const,
}

// === Contact Management Services ===

/**
 * Search contacts/signers with text matching
 * This is the main function used for signer selection in documents
 */
export function useSearchContacts() {
  return useMutation({
    mutationFn: async (searchTerm: string = ''): Promise<OpenSignContact[]> => {
      const response = await openSignApiService.post<ParseServerResponse<OpenSignContact[]>>('functions/getSigners', { 
        search: searchTerm 
      })
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      return response.result || []
    },
    meta: {
      description: 'Search contacts by name and email with regex matching'
    }
  })
}

/**
 * Get contacts with caching - useful for dropdown/autocomplete
 */
export function useContacts(searchTerm: string = '') {
  return useQuery({
    queryKey: contactQueryKeys.search(searchTerm),
    queryFn: async (): Promise<OpenSignContact[]> => {
      const response = await openSignApiService.post<ParseServerResponse<OpenSignContact[]>>('functions/getSigners', { 
        search: searchTerm 
      })
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      return response.result || []
    },
    enabled: true, // Always enabled to allow empty searches
    staleTime: 2 * 60 * 1000, // 2 minutes
    meta: {
      description: 'Get contacts with caching for autocomplete/dropdown'
    }
  })
}

/**
 * Save new contact to address book
 */
export function useSaveContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: SaveContactRequest): Promise<OpenSignContact> => {
      const response = await openSignApiService.post<ParseServerResponse<OpenSignContact>>('functions/savecontact', params)
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      return response.result!
    },
    onSuccess: (newContact) => {
      // Invalidate contact queries to refresh lists
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.all() })
      
      // Optionally add to existing cache
      queryClient.setQueryData(contactQueryKeys.detail(newContact.objectId), newContact)
    },
    meta: {
      description: 'Create new contact in address book with proper ACL'
    }
  })
}

/**
 * Update existing contact information
 */
export function useEditContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: EditContactRequest): Promise<OpenSignContact> => {
      const response = await openSignApiService.post<ParseServerResponse<OpenSignContact>>('functions/editcontact', params)
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      return response.result!
    },
    onSuccess: (updatedContact) => {
      // Update specific contact in cache
      queryClient.setQueryData(contactQueryKeys.detail(updatedContact.objectId), updatedContact)
      
      // Invalidate contact queries to refresh lists
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.all() })
    },
    meta: {
      description: 'Update existing contact information'
    }
  })
}

/**
 * Bulk create multiple contacts (CSV import)
 */
export function useCreateBatchContacts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: CreateBatchContactRequest): Promise<OpenSignContact[]> => {
      const response = await openSignApiService.post<ParseServerResponse<OpenSignContact[]>>('functions/createbatchcontact', params)
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      return response.result || []
    },
    onSuccess: () => {
      // Invalidate all contact queries to refresh lists
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.all() })
    },
    meta: {
      description: 'Bulk create contacts from CSV or array input'
    }
  })
}

/**
 * Delete contact (soft delete)
 */
export function useDeleteContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (contactId: string): Promise<void> => {
      // OpenSign uses soft delete by setting IsDeleted: true
      const response = await openSignApiService.put<ParseServerResponse<OpenSignContact>>(`classes/contracts_Contactbook/${contactId}`, {
        IsDeleted: true
      })
      
      if (response.error) {
        throw new Error(response.error)
      }
    },
    onSuccess: (_, contactId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: contactQueryKeys.detail(contactId) })
      
      // Invalidate contact queries to refresh lists
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.all() })
    },
    meta: {
      description: 'Soft delete contact by setting IsDeleted flag'
    }
  })
}

// === Utility Hooks ===

/**
 * Get contacts formatted for dropdown/select components
 */
export function useContactOptions(searchTerm: string = '') {
  const { data: contacts, isLoading, error } = useContacts(searchTerm)

  const options = contacts?.map(contact => ({
    value: contact.objectId,
    label: contact.Name,
    email: contact.Email,
    phone: contact.Phone,
    company: contact.Company,
    jobTitle: contact.JobTitle
  })) || []

  return {
    options,
    isLoading,
    error
  }
}

/**
 * Hook for creating contact during document creation flow
 */
export function useCreateContactForDocument() {
  const saveContact = useSaveContact()
  
  return useMutation({
    mutationFn: async (contactData: SaveContactRequest): Promise<OpenSignContact> => {
      // First try to save the contact
      try {
        return await saveContact.mutateAsync(contactData)
      } catch (error) {
        // If contact already exists, that's fine for document creation
        if (error instanceof Error && error.message.includes('already exists')) {
          // Could implement logic to find existing contact here
          throw new Error(`Contact with email ${contactData.email} already exists`)
        }
        throw error
      }
    },
    meta: {
      description: 'Create contact specifically for document signing workflow'
    }
  })
}

/**
 * Validate contact email format and availability
 */
export function useValidateContactEmail() {
  return useMutation({
    mutationFn: async (email: string): Promise<{ isValid: boolean; exists: boolean; contact?: OpenSignContact }> => {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return { isValid: false, exists: false }
      }

      try {
        // Search for existing contact
        const response = await openSignApiService.post<ParseServerResponse<OpenSignContact[]>>('functions/getSigners', { 
          search: email 
        })
        
        const contacts = response.result || []
        const existingContact = contacts.find(c => c.Email.toLowerCase() === email.toLowerCase())
        
        return {
          isValid: true,
          exists: !!existingContact,
          contact: existingContact
        }
      } catch {
        // If search fails, assume email is valid but not found
        return { isValid: true, exists: false }
      }
    },
    meta: {
      description: 'Validate email format and check if contact already exists'
    }
  })
}

// === Export all contact-related functionality ===
export const contactServices = {
  useSearchContacts,
  useContacts, 
  useSaveContact,
  useEditContact,
  useCreateBatchContacts,
  useDeleteContact,
  useContactOptions,
  useCreateContactForDocument,
  useValidateContactEmail
}
