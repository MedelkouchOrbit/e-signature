/**
 * ✅ React Query hooks for Documents operations
 * Following modern React Query patterns with proper error handling
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { documentsApiService } from "../documents/documents-api-service"
import type { 
  DocumentStatus,
  SignDocumentRequest,
  GetDocumentsParams,
  CreateDocumentRequest
} from "../documents/documents-types"

// Query Keys for React Query caching
export const DOCUMENTS_QUERY_KEYS = {
  all: ['documents'] as const,
  lists: () => [...DOCUMENTS_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: GetDocumentsParams) => 
    [...DOCUMENTS_QUERY_KEYS.lists(), { ...filters }] as const,
  details: () => [...DOCUMENTS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...DOCUMENTS_QUERY_KEYS.details(), id] as const,
  reports: () => [...DOCUMENTS_QUERY_KEYS.all, 'reports'] as const,
  report: (id: string) => [...DOCUMENTS_QUERY_KEYS.reports(), id] as const,
}

/**
 * Hook to get all documents with filtering
 */
export function useDocuments(filters?: {
  status?: DocumentStatus;
  search?: string;
  limit?: number;
  skip?: number;
}) {
  return useQuery({
    queryKey: DOCUMENTS_QUERY_KEYS.list(filters),
    queryFn: () => documentsApiService.getDocuments(filters),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to get a single document by ID
 */
export function useDocument(documentId: string) {
  return useQuery({
    queryKey: DOCUMENTS_QUERY_KEYS.detail(documentId),
    queryFn: () => documentsApiService.getDocument(documentId),
    enabled: !!documentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to get document report/details
 */
export function useDocumentReport(documentId: string) {
  return useQuery({
    queryKey: DOCUMENTS_QUERY_KEYS.report(documentId),
    queryFn: () => documentsApiService.getDocument(documentId), // Uses existing getDocument method
    enabled: !!documentId,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to create/send document
 */
export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDocumentRequest) => 
      documentsApiService.createDocument(data),
    onSuccess: () => {
      // Invalidate and refetch documents list
      queryClient.invalidateQueries({ 
        queryKey: DOCUMENTS_QUERY_KEYS.lists() 
      });
    },
  });
}

/**
 * Hook to sign a document
 */
export function useSignDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, signatureData }: { 
      documentId: string; 
      signatureData: any 
    }) => documentsApiService.signDocument(documentId, signatureData),
    onSuccess: (_, variables) => {
      // Invalidate specific document and list
      queryClient.invalidateQueries({ 
        queryKey: DOCUMENTS_QUERY_KEYS.detail(variables.documentId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: DOCUMENTS_QUERY_KEYS.lists() 
      });
    },
  });
}

/**
 * Hook to save document as draft (using createDocument)
 */
export function useSaveDocumentDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDocumentRequest) => 
      documentsApiService.createDocument(data),
    onSuccess: () => {
      // Invalidate documents list
      queryClient.invalidateQueries({ 
        queryKey: DOCUMENTS_QUERY_KEYS.lists() 
      });
    },
  });
}

/**
 * Hook to delete document
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => 
      documentsApiService.deleteDocument(documentId),
    onSuccess: (_, documentId) => {
      // Remove from cache and refetch list
      queryClient.removeQueries({ 
        queryKey: DOCUMENTS_QUERY_KEYS.detail(documentId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: DOCUMENTS_QUERY_KEYS.lists() 
      });
    },
  });
}

/**
 * Hook to get documents by status (completed, pending, etc.)
 */
export function useDocumentsByStatus(status: DocumentStatus) {
  return useQuery({
    queryKey: DOCUMENTS_QUERY_KEYS.list({ status }),
    queryFn: () => documentsApiService.getDocuments({ status }),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to search documents
 */
export function useSearchDocuments(searchTerm: string) {
  return useQuery({
    queryKey: DOCUMENTS_QUERY_KEYS.list({ searchTerm }),
    queryFn: () => documentsApiService.searchDocuments(searchTerm),
    enabled: searchTerm.length > 2, // Only search if term is long enough
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}
