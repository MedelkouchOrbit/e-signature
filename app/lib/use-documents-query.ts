import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { documentsApiService } from './documents-api-service'
import type { GetDocumentsParams, OpenSignDocument, DocumentStatus } from './documents-api-service'

// Query Keys
export const documentsKeys = {
  all: ['documents'] as const,
  lists: () => [...documentsKeys.all, 'list'] as const,
  list: (filters: GetDocumentsParams) => [...documentsKeys.lists(), filters] as const,
  details: () => [...documentsKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentsKeys.details(), id] as const,
  status: (status: DocumentStatus) => [...documentsKeys.all, 'status', status] as const,
}

// Documents List Hook
export const useDocuments = (params: GetDocumentsParams = {}) => {
  return useQuery({
    queryKey: documentsKeys.list(params),
    queryFn: () => documentsApiService.getDocuments(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Infinite Documents List Hook (for pagination)
export const useInfiniteDocuments = (
  baseParams: Omit<GetDocumentsParams, 'skip' | 'page'> = {}
) => {
  return useInfiniteQuery({
    queryKey: [...documentsKeys.lists(), 'infinite', baseParams],
    queryFn: ({ pageParam = 0 }) => 
      documentsApiService.getDocuments({
        ...baseParams,
        skip: pageParam * (baseParams.limit || 10),
        page: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const hasMore = lastPage.length === (baseParams.limit || 10)
      return hasMore ? allPages.length : undefined
    },
    staleTime: 2 * 60 * 1000,
  })
}

// Single Document Hook
export const useDocument = (documentId: string, enabled = true) => {
  return useQuery({
    queryKey: documentsKeys.detail(documentId),
    queryFn: () => documentsApiService.getDocument(documentId),
    enabled: enabled && !!documentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Documents by Status Hook
export const useDocumentsByStatus = (status: DocumentStatus) => {
  return useQuery({
    queryKey: documentsKeys.status(status),
    queryFn: () => documentsApiService.getDocuments({ status }),
    staleTime: 2 * 60 * 1000,
  })
}

// Document Mutations
export const useDocumentMutations = () => {
  const queryClient = useQueryClient()

  const createDocument = useMutation({
    mutationFn: (documentData: Partial<OpenSignDocument>) => 
      documentsApiService.createDocument(documentData),
    onSuccess: () => {
      // Invalidate and refetch documents list
      queryClient.invalidateQueries({ queryKey: documentsKeys.lists() })
    },
  })

  const updateDocument = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OpenSignDocument> }) =>
      documentsApiService.updateDocument(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate specific document and lists
      queryClient.invalidateQueries({ queryKey: documentsKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: documentsKeys.lists() })
    },
  })

  const deleteDocument = useMutation({
    mutationFn: (documentId: string) => documentsApiService.deleteDocument(documentId),
    onSuccess: (_, documentId) => {
      // Remove from cache and invalidate lists
      queryClient.removeQueries({ queryKey: documentsKeys.detail(documentId) })
      queryClient.invalidateQueries({ queryKey: documentsKeys.lists() })
    },
  })

  const sendDocument = useMutation({
    mutationFn: ({ documentId, recipientData }: { 
      documentId: string; 
      recipientData: any 
    }) => documentsApiService.sendDocument(documentId, recipientData),
    onSuccess: (_, { documentId }) => {
      // Update document cache
      queryClient.invalidateQueries({ queryKey: documentsKeys.detail(documentId) })
      queryClient.invalidateQueries({ queryKey: documentsKeys.lists() })
    },
  })

  const signDocument = useMutation({
    mutationFn: ({ documentId, signatureData }: { 
      documentId: string; 
      signatureData: any 
    }) => documentsApiService.signDocument(documentId, signatureData),
    onSuccess: (_, { documentId }) => {
      // Update document cache
      queryClient.invalidateQueries({ queryKey: documentsKeys.detail(documentId) })
      queryClient.invalidateQueries({ queryKey: documentsKeys.lists() })
    },
  })

  return {
    createDocument: createDocument.mutate,
    updateDocument: updateDocument.mutate,
    deleteDocument: deleteDocument.mutate,
    sendDocument: sendDocument.mutate,
    signDocument: signDocument.mutate,
    
    // Loading states
    isCreating: createDocument.isPending,
    isUpdating: updateDocument.isPending,
    isDeleting: deleteDocument.isPending,
    isSending: sendDocument.isPending,
    isSigning: signDocument.isPending,
    
    // Errors
    createError: createDocument.error,
    updateError: updateDocument.error,
    deleteError: deleteDocument.error,
    sendError: sendDocument.error,
    signError: signDocument.error,
  }
}

// Bulk Operations Hook
export const useBulkDocuments = () => {
  const queryClient = useQueryClient()

  const bulkDelete = useMutation({
    mutationFn: (documentIds: string[]) => 
      Promise.all(documentIds.map(id => documentsApiService.deleteDocument(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsKeys.lists() })
    },
  })

  const bulkStatusUpdate = useMutation({
    mutationFn: ({ documentIds, status }: { documentIds: string[]; status: DocumentStatus }) =>
      Promise.all(documentIds.map(id => 
        documentsApiService.updateDocument(id, { Status: status })
      )),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsKeys.lists() })
    },
  })

  return {
    bulkDelete: bulkDelete.mutate,
    bulkStatusUpdate: bulkStatusUpdate.mutate,
    isBulkDeleting: bulkDelete.isPending,
    isBulkUpdating: bulkStatusUpdate.isPending,
    bulkDeleteError: bulkDelete.error,
    bulkUpdateError: bulkStatusUpdate.error,
  }
}

// Search Hook with Debouncing
export const useDocumentSearch = (searchTerm: string, debounceMs = 300) => {
  return useQuery({
    queryKey: [...documentsKeys.lists(), 'search', searchTerm],
    queryFn: () => documentsApiService.getDocuments({ searchTerm, limit: 50 }),
    enabled: searchTerm.length > 2, // Only search when term is longer than 2 chars
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}
