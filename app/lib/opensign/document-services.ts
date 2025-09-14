/**
 * ✅ OpenSign Document Management Services
 * Modern React Query implementation of OpenSign document cloud functions
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { openSignApiService } from '@/app/lib/api-service'
import type { DocumentStatus } from '@/app/lib/documents/documents-types'

// === Types ===
export interface OpenSignDocument {
  objectId: string
  Name: string
  Status?: DocumentStatus
  URL?: string
  SignedUrl?: string
  CertificateUrl?: string
  Note?: string
  Description?: string
  IsCompleted?: boolean
  IsDeclined?: boolean
  IsSignyourself?: boolean
  IsEnableOTP?: boolean
  SendinOrder?: boolean
  TimeToCompleteDays?: number
  ExpiryDate?: {
    iso: string
    __type: "Date"
  }
  DeclineReason?: string
  createdAt: string
  updatedAt: string
  // Related objects
  Signers?: OpenSignSigner[]
  Placeholders?: OpenSignPlaceholder[]
  AuditTrail?: OpenSignAuditEntry[]
  CreatedBy?: {
    objectId: string
    className: string
    name?: string
    email?: string
  }
  ExtUserPtr?: {
    objectId: string
    className: string
    Name?: string
    Email?: string
    TenantId?: {
      objectId: string
      className: string
    }
  }
  DeclineBy?: {
    objectId: string
    className: string
    name?: string
  }
}

export interface OpenSignSigner {
  objectId: string
  name: string
  email: string
  phone?: string
  role?: string
  order?: number
  color: string
  status: 'waiting' | 'signed' | 'declined'
  signedAt?: string
  ipAddress?: string
  UserId?: {
    objectId: string
    className: string
  }
  ExtUserPtr?: {
    objectId: string
    className: string
  }
}

export interface OpenSignPlaceholder {
  objectId: string
  signerObjId: string
  role: string
  email: string
  color: string
  status?: 'waiting' | 'signed' | 'declined'
  signedAt?: string
  signedUrl?: string
  ipAddress?: string
  fields: Array<{
    page: number
    x: number
    y: number
    width: number
    height: number
    type: string
    name?: string
    required?: boolean
    defaultValue?: string
  }>
}

export interface OpenSignAuditEntry {
  objectId: string
  action: string
  ipAddress?: string
  timestamp: string
  UserPtr?: {
    objectId: string
    className: string
    name?: string
    email?: string
  }
}

export interface GetDocumentRequest {
  docId: string
  include?: string
}

export interface SignDocumentRequest {
  docId: string
  userId: string
  signature: string // Base64 signature data
  signatureData?: {
    positions: Array<{
      x: number
      y: number
      width: number
      height: number
      page: number
    }>
  }
  ipAddress?: string
}

export interface CreateDuplicateRequest {
  docId: string
}

export interface ForwardDocumentRequest {
  docId: string
  newSigners: Array<{
    name: string
    email: string
    role?: string
    order?: number
  }>
}

export interface FilterDocumentsRequest {
  filters?: {
    status?: DocumentStatus
    search?: string
    dateFrom?: string
    dateTo?: string
    createdBy?: string
  }
  sort?: {
    field: string
    direction: 'asc' | 'desc'
  }
  limit?: number
  skip?: number
}

export interface ReportFilters {
  status?: DocumentStatus
  search?: string
  dateFrom?: string
  dateTo?: string
  createdBy?: string
  [key: string]: unknown
}

export interface ReportData {
  type: string
  data: unknown[]
  summary: Record<string, number>
  [key: string]: unknown
}

export interface DocumentRecreateSettings {
  name?: string
  signers?: Array<{
    name: string
    email: string
    role?: string
    order?: number
  }>
  settings?: {
    sendInOrder?: boolean
    enableOTP?: boolean
    timeToComplete?: number
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface CertificateData {
  documentId: string
  documentName: string
  signers: Array<{
    name: string
    email: string
    signedAt: string
  }>
  completedAt: string
  [key: string]: unknown
}

// Define response types for Parse Server functions
interface ParseServerResponse<T = unknown> {
  result?: T
  error?: string
  code?: number
}

// === Query Keys ===
export const documentQueryKeys = {
  all: () => ['opensign', 'documents'] as const,
  filtered: (filters: FilterDocumentsRequest) => ['opensign', 'documents', 'filtered', filters] as const,
  detail: (docId: string) => ['opensign', 'documents', 'detail', docId] as const,
  drive: (folderId?: string) => ['opensign', 'documents', 'drive', folderId] as const,
  reports: (reportType: string) => ['opensign', 'documents', 'reports', reportType] as const,
}

// === Document Management Services ===

/**
 * Get document details with all related data
 */
export function useDocument(docId: string, include?: string) {
  return useQuery({
    queryKey: documentQueryKeys.detail(docId),
    queryFn: async (): Promise<OpenSignDocument> => {
      const response = await openSignApiService.post<ParseServerResponse<OpenSignDocument>>('functions/getDocument', {
        docId,
        include
      })
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      return response.result!
    },
    enabled: !!docId,
    staleTime: 30 * 1000, // 30 seconds (documents change frequently)
    meta: {
      description: 'Get document details with signers, placeholders, and audit trail'
    }
  })
}

/**
 * Sign PDF document with signature data
 */
export function useSignDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: SignDocumentRequest): Promise<OpenSignDocument> => {
      const response = await openSignApiService.post<ParseServerResponse<OpenSignDocument>>('functions/signPdf', params)
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      return response.result!
    },
    onSuccess: (signedDocument, variables) => {
      // Update the document cache
      queryClient.setQueryData(documentQueryKeys.detail(variables.docId), signedDocument)
      
      // Invalidate document lists to refresh status
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.all() })
    },
    meta: {
      description: 'Sign PDF document with signature placement and validation'
    }
  })
}

/**
 * Get document folder/drive structure
 */
export function useDrive(folderId?: string, limit: number = 50, skip: number = 0) {
  return useQuery({
    queryKey: [...documentQueryKeys.drive(folderId), { limit, skip }],
    queryFn: async (): Promise<{ documents: OpenSignDocument[]; folders: OpenSignDocument[] }> => {
      const response = await openSignApiService.post<ParseServerResponse<{ documents: OpenSignDocument[]; folders: OpenSignDocument[] }>>('functions/getDrive', {
        docId: folderId,
        limit,
        skip
      })
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      return response.result!
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    meta: {
      description: 'Get document folder structure with pagination'
    }
  })
}

/**
 * Generate reports and analytics
 */
export function useDocumentReports(reportType: string, filters?: ReportFilters) {
  return useQuery({
    queryKey: [...documentQueryKeys.reports(reportType), filters],
    queryFn: async (): Promise<ReportData> => {
      const response = await openSignApiService.post<ParseServerResponse<ReportData>>('functions/getReport', {
        reportType,
        filters
      })
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      return response.result!
    },
    enabled: !!reportType,
    staleTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      description: 'Generate document reports and analytics'
    }
  })
}

/**
 * Create duplicate copy of document
 */
export function useCreateDuplicate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: CreateDuplicateRequest): Promise<OpenSignDocument> => {
      const response = await openSignApiService.post<ParseServerResponse<OpenSignDocument>>('functions/createduplicate', params)
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      return response.result!
    },
    onSuccess: () => {
      // Invalidate document lists to show new duplicate
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.all() })
    },
    meta: {
      description: 'Create duplicate copy of document with reset signing status'
    }
  })
}

/**
 * Forward document to new signers
 */
export function useForwardDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: ForwardDocumentRequest): Promise<OpenSignDocument> => {
      const response = await openSignApiService.post<ParseServerResponse<OpenSignDocument>>('functions/forwarddoc', params)
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      return response.result!
    },
    onSuccess: (updatedDocument, variables) => {
      // Update the document cache
      queryClient.setQueryData(documentQueryKeys.detail(variables.docId), updatedDocument)
      
      // Invalidate document lists
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.all() })
    },
    meta: {
      description: 'Forward document to additional signers'
    }
  })
}

/**
 * Recreate document with new settings
 */
export function useRecreateDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { docId: string; newSettings: DocumentRecreateSettings }): Promise<OpenSignDocument> => {
      const response = await openSignApiService.post<ParseServerResponse<OpenSignDocument>>('functions/recreatedoc', params)
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      return response.result!
    },
    onSuccess: (recreatedDocument, variables) => {
      // Update the document cache
      queryClient.setQueryData(documentQueryKeys.detail(variables.docId), recreatedDocument)
      
      // Invalidate document lists
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.all() })
    },
    meta: {
      description: 'Recreate document with modified configuration'
    }
  })
}

/**
 * Filter documents with advanced criteria
 */
export function useFilterDocuments(filters: FilterDocumentsRequest) {
  return useQuery({
    queryKey: documentQueryKeys.filtered(filters),
    queryFn: async (): Promise<{ results: OpenSignDocument[]; total: number }> => {
      const response = await openSignApiService.post<ParseServerResponse<{ results: OpenSignDocument[]; total: number }>>('functions/filterdocs', filters)
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      return response.result!
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    meta: {
      description: 'Filter documents with advanced search criteria'
    }
  })
}

/**
 * Generate completion certificate for signed document
 */
export function useGenerateCertificate() {
  return useMutation({
    mutationFn: async (docId: string): Promise<{ certificateUrl: string; certificateData: CertificateData }> => {
      const response = await openSignApiService.post<ParseServerResponse<{ certificateUrl: string; certificateData: CertificateData }>>('functions/generatecertificate', {
        docId
      })
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      return response.result!
    },
    meta: {
      description: 'Generate completion certificate for signed document'
    }
  })
}

// === Utility Hooks ===

/**
 * Get document signing permission for current user
 */
export function useDocumentSigningPermission(document: OpenSignDocument | undefined, currentUserId: string | null) {
  if (!document || !currentUserId) {
    return { canSign: false, reason: 'No document or user' }
  }

  const userSigner = document.Signers?.find(s => 
    s.UserId?.objectId === currentUserId || 
    s.ExtUserPtr?.objectId === currentUserId ||
    s.email === document.ExtUserPtr?.Email
  )

  if (!userSigner) {
    return { canSign: false, reason: 'User is not a signer' }
  }

  if (userSigner.status === 'signed') {
    return { canSign: false, reason: 'Already signed' }
  }

  if (userSigner.status === 'declined') {
    return { canSign: false, reason: 'Document declined' }
  }

  // Check signing order if enabled
  if (document.SendinOrder) {
    const pendingSigners = document.Signers?.filter(s => s.status === 'waiting') || []
    const nextSigner = pendingSigners.sort((a, b) => (a.order || 0) - (b.order || 0))[0]
    
    if (nextSigner?.objectId !== userSigner.objectId) {
      return { canSign: false, reason: 'Not your turn to sign (sequential signing)' }
    }
  }

  return { canSign: true, reason: 'Can sign', signer: userSigner }
}

/**
 * Document status summary hook
 */
export function useDocumentStatusSummary(documents: OpenSignDocument[] = []) {
  const summary = documents.reduce((acc, doc) => {
    const status = doc.Status || 'waiting'
    acc[status] = (acc[status] || 0) + 1
    acc.total++
    return acc
  }, {
    waiting: 0,
    signed: 0,
    partially_signed: 0,
    drafted: 0,
    declined: 0,
    expired: 0,
    total: 0
  } as Record<string, number>)

  return summary
}

// === Export all document-related functionality ===
export const documentServices = {
  useDocument,
  useSignDocument,
  useDrive,
  useDocumentReports,
  useCreateDuplicate,
  useForwardDocument,
  useRecreateDocument,
  useFilterDocuments,
  useGenerateCertificate,
  useDocumentSigningPermission,
  useDocumentStatusSummary
}
