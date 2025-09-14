/**
 * ✅ React Query hooks for Contacts operations
 * Following modern React Query patterns with proper error handling
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { contactsApiService } from "../contacts/contacts-api-service"
import type {
  CreateContactRequest,
  EditContactRequest
} from "../contacts/contacts-types"

// Query Keys for React Query caching
export const CONTACTS_QUERY_KEYS = {
  all: ['contacts'] as const,
  lists: () => [...CONTACTS_QUERY_KEYS.all, 'list'] as const,
  signers: (searchTerm?: string) => 
    [...CONTACTS_QUERY_KEYS.all, 'signers', { searchTerm }] as const,
  details: () => [...CONTACTS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CONTACTS_QUERY_KEYS.details(), id] as const,
  inContactBook: (email: string) => 
    [...CONTACTS_QUERY_KEYS.all, 'inContactBook', email] as const,
}

/**
 * Hook to get signers/contacts
 */
export function useSigners(searchTerm: string = '') {
  return useQuery({
    queryKey: CONTACTS_QUERY_KEYS.signers(searchTerm),
    queryFn: () => contactsApiService.getSigners(searchTerm),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to get a single contact by ID
 */
export function useContact(contactId: string) {
  return useQuery({
    queryKey: CONTACTS_QUERY_KEYS.detail(contactId),
    queryFn: () => contactsApiService.getContact(contactId),
    enabled: !!contactId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to check if user is in contact book
 */
export function useIsUserInContactBook(email: string) {
  return useQuery({
    queryKey: CONTACTS_QUERY_KEYS.inContactBook(email),
    queryFn: () => contactsApiService.isUserInContactBook(email),
    enabled: !!email && email.includes('@'),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to save contact
 */
export function useSaveContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContactRequest) => 
      contactsApiService.saveContact(data),
    onSuccess: () => {
      // Invalidate and refetch contacts/signers lists
      queryClient.invalidateQueries({ 
        queryKey: CONTACTS_QUERY_KEYS.all 
      });
    },
  });
}

/**
 * Hook to edit contact
 */
export function useEditContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { contactId: string; contactData: EditContactRequest }) => 
      contactsApiService.editContact(data.contactId, data.contactData),
    onSuccess: (_, variables) => {
      // Invalidate specific contact and all lists
      queryClient.invalidateQueries({ 
        queryKey: CONTACTS_QUERY_KEYS.detail(variables.contactId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: CONTACTS_QUERY_KEYS.all 
      });
    },
  });
}

/**
 * Hook to delete contact
 */
export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contactId: string) => 
      contactsApiService.deleteContact(contactId),
    onSuccess: (_, contactId) => {
      // Remove from cache and refetch lists
      queryClient.removeQueries({ 
        queryKey: CONTACTS_QUERY_KEYS.detail(contactId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: CONTACTS_QUERY_KEYS.all 
      });
    },
  });
}

/**
 * Hook to create batch contacts
 */
export function useCreateBatchContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contacts: CreateContactRequest[]) => 
      contactsApiService.createBatchContacts(contacts),
    onSuccess: () => {
      // Invalidate all contact queries
      queryClient.invalidateQueries({ 
        queryKey: CONTACTS_QUERY_KEYS.all 
      });
    },
  });
}
