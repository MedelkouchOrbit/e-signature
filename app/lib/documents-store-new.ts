import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  documentsApiService, 
  type Document, 
  type DocumentStatus,
  type CreateDocumentRequest
} from './documents-api-service'

interface GetDocumentsParams {
  limit?: number
  skip?: number
  searchTerm?: string
  status?: DocumentStatus | 'all'
  assignedToMe?: boolean
  page?: number // Add page for convenience
}

interface DocumentsState {
  // Data
  documents: Document[]
  isLoading: boolean
  error: string | null
  
  // Filters and pagination
  currentFilter: DocumentStatus | 'all' | 'inbox'
  searchTerm: string
  currentPage: number
  totalPages: number
  totalCount: number
  itemsPerPage: number
  
  // Actions
  loadDocuments: (params?: Partial<GetDocumentsParams>) => Promise<void>
  createDocument: (data: CreateDocumentRequest) => Promise<Document>
  shareDocument: (documentId: string, emails: string[], message?: string) => Promise<void>
  downloadDocument: (documentId: string, signed?: boolean) => Promise<string | null>
  deleteDocument: (documentId: string) => Promise<void>
  signDocument: (documentId: string) => Promise<void>
  
  // Filter actions
  setFilter: (filter: DocumentStatus | 'all' | 'inbox') => void
  setSearchTerm: (term: string) => void
  setPage: (page: number) => void
  
  // Computed
  getDocumentCounts: () => {
    all: number
    inbox: number
    waiting: number
    signed: number
    drafted: number
  }
  
  // Reset
  reset: () => void
}

const initialState = {
  documents: [],
  isLoading: false,
  error: null,
  currentFilter: 'all' as DocumentStatus | 'all' | 'inbox',
  searchTerm: '',
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  itemsPerPage: 10
}

export const useDocumentsStore = create<DocumentsState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      loadDocuments: async (params = {}) => {
        set({ isLoading: true, error: null })
        
        try {
          const state = get()
          
          // Calculate skip based on page
          const page = params.page ?? state.currentPage
          const limit = params.limit ?? state.itemsPerPage
          const skip = (page - 1) * limit
          
          const requestParams: GetDocumentsParams = {
            limit,
            skip,
            status: params.status ?? (state.currentFilter === 'all' || state.currentFilter === 'inbox' ? 'all' : state.currentFilter),
            searchTerm: params.searchTerm ?? state.searchTerm,
            assignedToMe: state.currentFilter === 'inbox', // Inbox shows documents assigned to me
            ...params
          }
          
          const response = await documentsApiService.getDocuments(requestParams)
          
          set({
            documents: response.results,
            totalCount: response.count,
            totalPages: Math.ceil(response.count / limit),
            currentPage: page,
            isLoading: false
          })
        } catch (error) {
          console.error('Error loading documents:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load documents',
            isLoading: false 
          })
        }
      },
      
      createDocument: async (data: CreateDocumentRequest) => {
        set({ isLoading: true, error: null })
        
        try {
          const document = await documentsApiService.createDocument(data)
          
          // Refresh documents list
          await get().loadDocuments({ page: 1 })
          
          set({ isLoading: false })
          return document
        } catch (error) {
          console.error('Error creating document:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create document',
            isLoading: false 
          })
          throw error
        }
      },
      
      shareDocument: async (documentId: string, emails: string[], message?: string) => {
        try {
          await documentsApiService.shareDocument(documentId, emails, message)
          
          // Refresh the document to get updated sharing info
          await get().loadDocuments()
        } catch (error) {
          console.error('Error sharing document:', error)
          throw error
        }
      },
      
      downloadDocument: async (documentId: string, signed = false) => {
        try {
          return await documentsApiService.downloadDocument(documentId, signed)
        } catch (error) {
          console.error('Error downloading document:', error)
          throw error
        }
      },
      
      deleteDocument: async (documentId: string) => {
        try {
          await documentsApiService.deleteDocument(documentId)
          
          // Remove from local state
          const state = get()
          const updatedDocuments = state.documents.filter(doc => doc.objectId !== documentId)
          set({ 
            documents: updatedDocuments,
            totalCount: state.totalCount - 1
          })
          
          // If current page is empty, go to previous page
          if (updatedDocuments.length === 0 && state.currentPage > 1) {
            await get().loadDocuments({ page: state.currentPage - 1 })
          }
        } catch (error) {
          console.error('Error deleting document:', error)
          throw error
        }
      },
      
      signDocument: async (documentId: string) => {
        try {
          // For now, just redirect to sign page - actual signing logic would be in the sign component
          console.log('Signing document:', documentId)
          
          // Refresh documents to get updated status
          await get().loadDocuments()
        } catch (error) {
          console.error('Error signing document:', error)
          throw error
        }
      },
      
      setFilter: (filter: DocumentStatus | 'all' | 'inbox') => {
        set({ currentFilter: filter, currentPage: 1 })
        // Load documents with new filter
        get().loadDocuments({ page: 1 })
      },
      
      setSearchTerm: (term: string) => {
        set({ searchTerm: term, currentPage: 1 })
      },
      
      setPage: (page: number) => {
        set({ currentPage: page })
        get().loadDocuments({ page })
      },
      
      getDocumentCounts: () => {
        const { documents } = get()
        
        return {
          all: documents.length,
          inbox: documents.filter(doc => doc.canUserSign).length,
          waiting: documents.filter(doc => doc.status === 'waiting').length,
          signed: documents.filter(doc => doc.status === 'signed').length,
          drafted: documents.filter(doc => doc.status === 'drafted').length
        }
      },
      
      reset: () => {
        set(initialState)
      }
    }),
    {
      name: 'documents-store',
      partialize: (state) => ({
        currentFilter: state.currentFilter,
        searchTerm: state.searchTerm,
        itemsPerPage: state.itemsPerPage
      })
    }
  )
)

// Export types for use in components
export type { Document, DocumentStatus, CreateDocumentRequest, GetDocumentsParams }
