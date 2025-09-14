import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { DocumentSigner, OpenSignPlaceholder } from "./documents-api-service"

// Document interfaces based on backend analysis
export interface SignatureData {
  xPosition?: number
  yPosition?: number
  width?: number
  height?: number
  signatureImageUrl?: string
  signaturePositions?: Array<{
    x: number
    y: number
    width: number
    height: number
    page: number
  }>
  signerDetails?: {
    name: string
    email: string
  }
  signedFileUrl?: string
}

// Helper function to generate signer colors
const getSignerColor = (index: number): string => {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#6366F1', '#06B6D4'
  ]
  return colors[index % colors.length]
}

// Helper function to extract signers from placeholders
const extractSignersFromPlaceholders = (placeholders: OpenSignPlaceholder[] = []): DocumentSigner[] => {
  const uniqueEmails = new Set<string>()
  const signers: DocumentSigner[] = []
  
  placeholders.forEach((placeholder, index) => {
    if (placeholder.email && !uniqueEmails.has(placeholder.email)) {
      uniqueEmails.add(placeholder.email)
      
      // Extract name from placeholder if available, otherwise use email
      const signerPtrName = (placeholder.signerPtr as { Name?: string })?.Name
      const name = signerPtrName || 
                  placeholder.email.split('@')[0] || 
                  `Signer ${signers.length + 1}`
      
      signers.push({
        id: placeholder.id || `placeholder-${index}`,
        name: name,
        email: placeholder.email,
        role: placeholder.signerRole || 'Signer',
        color: getSignerColor(signers.length),
        status: 'waiting', // Will be updated based on document status
        userId: placeholder.signerObjId,
        order: signers.length + 1
      })
    }
  })
  
  return signers
}

export interface DocumentResponse {
  objectId: string
  Name: string
  URL?: string
  SignedUrl?: string
  CertificateUrl?: string
  Note?: string
  Description?: string
  createdAt: string
  updatedAt: string
  ExpiryDate?: string
  TimeToCompleteDays?: number
  IsCompleted?: boolean
  IsDeclined?: boolean
  IsSignyourself?: boolean
  IsEnableOTP?: boolean
  DeclineReason?: string
  Signers?: Record<string, unknown>[]
  Placeholders?: OpenSignPlaceholder[]
  CreatedBy?: {
    objectId: string
    className: string
  }
  ExtUserPtr?: {
    objectId: string
    Name: string
    Email: string
    TenantId?: {
      objectId: string
      className: string
    }
  }
}

export interface DocumentPlaceholder {
  Id: string
  signerObjId: string
  signerPtr: Record<string, unknown> // Using Record for flexibility
  Role: string
  email: string
  blockColor: string
  placeHolder: Array<{
    pageNumber: number
    pos: Array<{
      xPosition: number
      yPosition: number
      width: number
      height: number
      type: string
      options?: {
        name?: string
        status?: string
        defaultValue?: string
      }
    }>
  }>
}

export interface Document {
  objectId: string
  Name: string
  URL?: string
  SignedUrl?: string
  CertificateUrl?: string
  Note?: string
  Description?: string
  createdAt: string
  updatedAt: string
  ExpiryDate?: string
  TimeToCompleteDays?: number
  IsCompleted?: boolean
  IsDeclined?: boolean
  IsSignyourself?: boolean
  IsEnableOTP?: boolean
  DeclineReason?: string
  Signers?: Record<string, unknown>[] // Original signers from API (usually empty)
  Placeholders?: OpenSignPlaceholder[] // Placeholders containing receiver emails
  signers?: DocumentSigner[] // Computed signers from placeholders for UI
  CreatedBy?: {
    objectId: string
    className: string
  }
  ExtUserPtr?: {
    objectId: string
    Name: string
    Email: string
    TenantId?: {
      objectId: string
      className: string
    }
  }
  // Computed status property
  status: 'signed' | 'declined' | 'waiting' | 'drafted'
}

export interface ShareRecipient {
  email: string
  name?: string
  role?: string
  permissions?: string[]
}

export interface DocumentsState {
  // Document data
  documents: Document[]
  currentDocument: Document | null
  isLoading: boolean
  error: string | null
  
  // Upload state
  isUploading: boolean
  uploadProgress: number
  uploadError: string | null
  
  // Filtering and pagination
  currentFilter: string
  searchQuery: string
  currentPage: number
  pageSize: number
  totalDocuments: number
  hasMore: boolean
  
  // Actions
  fetchDocuments: (filters?: {
    status?: string
    search?: string
    limit?: number
    offset?: number
  }) => Promise<void>
  uploadDocument: (file: File, metadata?: {
    name?: string
    description?: string
    note?: string
  }) => Promise<string>
  signDocument: (docId: string, signatureData: SignatureData, signerInfo?: {
    name: string
    email: string
  }) => Promise<void>
  shareDocument: (docId: string, recipients: ShareRecipient[], message?: string) => Promise<void>
  declineDocument: (docId: string, reason: string) => Promise<void>
  forwardDocument: (docId: string, email: string) => Promise<void>
  duplicateDocument: (docId: string) => Promise<void>
  deleteDocument: (docId: string) => Promise<void>
  recreateDocument: (docId: string) => Promise<void>
  
  // UI state management
  setCurrentDocument: (doc: Document | null) => void
  setFilter: (filter: string) => void
  setSearchQuery: (query: string) => void
  setCurrentPage: (page: number) => void
  clearError: () => void
  reset: () => void
}

const useDocumentsStore = create<DocumentsState>()(
  persist(
    (set, get) => ({
      // Initial state
      documents: [],
      currentDocument: null,
      isLoading: false,
      error: null,
      
      isUploading: false,
      uploadProgress: 0,
      uploadError: null,
      
      currentFilter: 'all',
      searchQuery: '',
      currentPage: 1,
      pageSize: 10,
      totalDocuments: 0,
      hasMore: false,
      
      fetchDocuments: async (filters = {}) => {
        set({ isLoading: true, error: null })
        
        try {
          const { status = 'all', search = '', limit = 10, offset = 0 } = filters
          
          // Use OpenSign API only
          const response = await fetch('/api/proxy/opensign/functions/filterdocs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Parse-Application-Id': process.env.NEXT_PUBLIC_OPENSIGN_APP_ID || 'opensign',
              'X-Parse-Session-Token': localStorage.getItem('opensign_session_token') || '',
            },
            body: JSON.stringify({
              searchTerm: search,
              limit,
              skip: offset,
            }),
          })

          if (!response.ok) {
            throw new Error(`Failed to fetch documents: ${response.statusText}`)
          }

          const data = await response.json()
          console.log('[Documents Store] Fetched documents:', data)

          if (data.result) {
            const documents: Document[] = data.result.map((doc: DocumentResponse) => ({
              ...doc,
              status: doc.IsCompleted 
                ? 'signed' 
                : doc.IsDeclined 
                  ? 'declined' 
                  : doc.SignedUrl 
                    ? 'waiting' 
                    : 'drafted',
              signers: extractSignersFromPlaceholders(doc.Placeholders || [])
            }))
            
            // Apply client-side status filtering
            const filteredDocs = status === 'all' ? documents : documents.filter((doc: Document) => {
              switch (status) {
                case 'completed':
                  return doc.status === 'signed'
                case 'pending':
                  return doc.status === 'drafted' || doc.status === 'waiting'
                case 'declined':
                  return doc.status === 'declined'
                default:
                  return true
              }
            })
            
            const total = filteredDocs.length
            const hasMore = offset + limit < total
            
            set({
              documents: filteredDocs,
              totalDocuments: total,
              hasMore,
              isLoading: false,
              error: null
            })
          } else {
            throw new Error(data.error || 'Failed to fetch documents')
          }
          
        } catch (error) {
          console.error('[Documents Store] Error fetching documents:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch documents',
            isLoading: false
          })
        }
      },

      uploadDocument: async (file: File, metadata = {}) => {
        set({ isUploading: true, uploadProgress: 0, uploadError: null })
        
        try {
          console.log('[Documents Store] Uploading file to OpenSign Parse Server')
          set({ uploadProgress: 20 })
          
          // Generate unique filename
          const fileName = metadata.name || `${Date.now()}-${file.name}`
          const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
          
          console.log('[Documents Store] Using base64fileupload function with file data')
          set({ uploadProgress: 40 })
          
          // Convert file to base64
          const fileBuffer = await file.arrayBuffer()
          const base64Data = Buffer.from(fileBuffer).toString('base64')
          
          // Use the base64fileupload function (primary method)
          const uploadResponse = await fetch('/api/proxy/opensign/functions/base64fileupload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Parse-Application-Id': process.env.NEXT_PUBLIC_OPENSIGN_APP_ID || 'opensign',
              'X-Parse-Session-Token': localStorage.getItem('opensign_session_token') || '',
            },
            body: JSON.stringify({
              fileName: sanitizedFileName,
              fileData: base64Data
            }),
          })

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text()
            console.error('[Documents Store] Base64 file upload failed:', errorText)
            throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`)
          }

          const uploadData = await uploadResponse.json()
          console.log('[Documents Store] File uploaded via base64fileupload:', uploadData)

          if (!uploadData.result || !uploadData.result.url) {
            throw new Error(uploadData.error || 'Upload failed - no URL returned')
          }

          set({ uploadProgress: 70 })

          // Create document record if metadata provided
          const fileUrl = uploadData.result.url
          if (metadata.name && fileUrl) {
            const createResponse = await fetch('/api/proxy/opensign/classes/contracts_Document', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Parse-Application-Id': process.env.NEXT_PUBLIC_OPENSIGN_APP_ID || 'opensign',
                'X-Parse-Session-Token': localStorage.getItem('opensign_session_token') || '',
              },
              body: JSON.stringify({
                Name: metadata.name,
                URL: fileUrl,
                Note: metadata.note || '',
                Description: metadata.description || '',
                TimeToCompleteDays: 15,
                IsSignyourself: false,
                IsEnableOTP: false,
              }),
            })

            if (!createResponse.ok) {
              console.warn('[Documents Store] Failed to create document record, but file uploaded successfully')
            }
          }

          set({ 
            uploadProgress: 100,
            isUploading: false,
            uploadError: null
          })

          // Refresh documents list
          await get().fetchDocuments()

          return fileUrl || uploadData.result.url
          
        } catch (error) {
          console.error('[Documents Store] Error uploading document:', error)
          set({
            uploadError: error instanceof Error ? error.message : 'Upload failed',
            isUploading: false,
            uploadProgress: 0
          })
          throw error
        }
      },

      signDocument: async (docId: string, signatureData: SignatureData, signerInfo = { name: 'Test User', email: 'test@example.com' }) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/proxy/opensign/functions/signPdf', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Parse-Application-Id': process.env.NEXT_PUBLIC_OPENSIGN_APP_ID || 'opensign',
              'X-Parse-Session-Token': localStorage.getItem('opensign_session_token') || '',
            },
            body: JSON.stringify({
              docId,
              ...signatureData,
              signerInfo
            }),
          })

          if (!response.ok) {
            throw new Error(`Failed to sign document: ${response.statusText}`)
          }

          const data = await response.json()
          console.log('[Documents Store] Document signed:', data)

          if (data.result) {
            // Refresh documents list
            await get().fetchDocuments()
          } else {
            throw new Error(data.error || 'Failed to sign document')
          }

          set({ isLoading: false, error: null })
          
        } catch (error) {
          console.error('[Documents Store] Error signing document:', error)
          set({
            error: error instanceof Error ? error.message : 'Sign failed',
            isLoading: false
          })
          throw error
        }
      },

      shareDocument: async (docId: string, recipients: ShareRecipient[], message = '') => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/proxy/opensign/functions/forwarddoc', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Parse-Application-Id': process.env.NEXT_PUBLIC_OPENSIGN_APP_ID || 'opensign',
              'X-Parse-Session-Token': localStorage.getItem('opensign_session_token') || '',
            },
            body: JSON.stringify({
              docId,
              recipients: recipients.map(r => r.email),
              message
            }),
          })

          if (!response.ok) {
            throw new Error(`Failed to share document: ${response.statusText}`)
          }

          const data = await response.json()
          console.log('[Documents Store] Document shared:', data)

          if (!data.result) {
            throw new Error(data.error || 'Failed to share document')
          }

          set({ isLoading: false, error: null })
          
        } catch (error) {
          console.error('[Documents Store] Error sharing document:', error)
          set({
            error: error instanceof Error ? error.message : 'Share failed',
            isLoading: false
          })
          throw error
        }
      },

      declineDocument: async (docId: string, reason: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/proxy/opensign/functions/declinedoc', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Parse-Application-Id': process.env.NEXT_PUBLIC_OPENSIGN_APP_ID || 'opensign',
              'X-Parse-Session-Token': localStorage.getItem('opensign_session_token') || '',
            },
            body: JSON.stringify({ docId, reason }),
          })

          if (!response.ok) {
            throw new Error(`Failed to decline document: ${response.statusText}`)
          }

          const data = await response.json()
          console.log('[Documents Store] Document declined:', data)

          if (!data.result) {
            throw new Error(data.error || 'Failed to decline document')
          }

          set({ isLoading: false, error: null })

          // Refresh documents list
          await get().fetchDocuments()
          
        } catch (error) {
          console.error('[Documents Store] Error declining document:', error)
          set({
            error: error instanceof Error ? error.message : 'Decline failed',
            isLoading: false
          })
          throw error
        }
      },

      forwardDocument: async (docId: string, email: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/proxy/opensign/functions/forwarddoc', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Parse-Application-Id': process.env.NEXT_PUBLIC_OPENSIGN_APP_ID || 'opensign',
              'X-Parse-Session-Token': localStorage.getItem('opensign_session_token') || '',
            },
            body: JSON.stringify({ docId, recipients: [email] }),
          })

          if (!response.ok) {
            throw new Error(`Failed to forward document: ${response.statusText}`)
          }

          const data = await response.json()
          console.log('[Documents Store] Document forwarded:', data)

          if (!data.result) {
            throw new Error(data.error || 'Failed to forward document')
          }

          set({ isLoading: false, error: null })
          
        } catch (error) {
          console.error('[Documents Store] Error forwarding document:', error)
          set({
            error: error instanceof Error ? error.message : 'Forward failed',
            isLoading: false
          })
          throw error
        }
      },

      duplicateDocument: async (docId: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/proxy/opensign/functions/createduplicate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Parse-Application-Id': process.env.NEXT_PUBLIC_OPENSIGN_APP_ID || 'opensign',
              'X-Parse-Session-Token': localStorage.getItem('opensign_session_token') || '',
            },
            body: JSON.stringify({ docId }),
          })

          if (!response.ok) {
            throw new Error(`Failed to duplicate document: ${response.statusText}`)
          }

          const data = await response.json()
          console.log('[Documents Store] Document duplicated:', data)

          if (!data.result) {
            throw new Error(data.error || 'Failed to duplicate document')
          }

          set({ isLoading: false, error: null })

          // Refresh documents list
          await get().fetchDocuments()
          
        } catch (error) {
          console.error('[Documents Store] Error duplicating document:', error)
          set({
            error: error instanceof Error ? error.message : 'Duplicate failed',
            isLoading: false
          })
          throw error
        }
      },

      deleteDocument: async (docId: string) => {
        set({ isLoading: true, error: null })
        
        try {
          // Mark as archived instead of actual deletion
          const response = await fetch(`/api/proxy/opensign/classes/contracts_Document/${docId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Parse-Application-Id': process.env.NEXT_PUBLIC_OPENSIGN_APP_ID || 'opensign',
              'X-Parse-Session-Token': localStorage.getItem('opensign_session_token') || '',
            },
            body: JSON.stringify({
              IsArchive: true,
            }),
          })

          if (!response.ok) {
            throw new Error(`Failed to delete document: ${response.statusText}`)
          }

          console.log('[Documents Store] Document deleted (archived)')

          set({ isLoading: false, error: null })

          // Refresh documents list
          await get().fetchDocuments()
          
        } catch (error) {
          console.error('[Documents Store] Error deleting document:', error)
          set({
            error: error instanceof Error ? error.message : 'Delete failed',
            isLoading: false
          })
          throw error
        }
      },

      recreateDocument: async (docId: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/proxy/opensign/functions/createduplicate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Parse-Application-Id': process.env.NEXT_PUBLIC_OPENSIGN_APP_ID || 'opensign',
              'X-Parse-Session-Token': localStorage.getItem('opensign_session_token') || '',
            },
            body: JSON.stringify({ docId }),
          })

          if (!response.ok) {
            throw new Error(`Failed to recreate document: ${response.statusText}`)
          }

          const data = await response.json()
          console.log('[Documents Store] Document recreated:', data)

          if (!data.result) {
            throw new Error(data.error || 'Failed to recreate document')
          }

          set({ isLoading: false, error: null })

          // Refresh documents list
          await get().fetchDocuments()
          
        } catch (error) {
          console.error('[Documents Store] Error recreating document:', error)
          set({
            error: error instanceof Error ? error.message : 'Recreate failed',
            isLoading: false
          })
          throw error
        }
      },

      // UI state management
      setCurrentDocument: (doc: Document | null) => set({ currentDocument: doc }),

      setFilter: (filter: string) => {
        set({ currentFilter: filter, currentPage: 1 })
        get().fetchDocuments({ status: filter, search: get().searchQuery })
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query, currentPage: 1 })
        get().fetchDocuments({ status: get().currentFilter, search: query })
      },

      setCurrentPage: (page: number) => {
        set({ currentPage: page })
        const { currentFilter, searchQuery, pageSize } = get()
        get().fetchDocuments({
          status: currentFilter,
          search: searchQuery,
          limit: pageSize,
          offset: (page - 1) * pageSize
        })
      },

      clearError: () => set({ error: null, uploadError: null }),

      reset: () => set({
        documents: [],
        currentDocument: null,
        isLoading: false,
        error: null,
        isUploading: false,
        uploadProgress: 0,
        uploadError: null,
        currentFilter: 'all',
        searchQuery: '',
        currentPage: 1,
        totalDocuments: 0,
        hasMore: false
      })
    }),
    {
      name: 'documents-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentFilter: state.currentFilter,
        searchQuery: state.searchQuery,
        currentPage: state.currentPage,
        pageSize: state.pageSize
      })
    }
  )
)

export { useDocumentsStore }
