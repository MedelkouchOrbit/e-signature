import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { type Document, type DocumentStatus } from "./documents-api-service"
import { type CreateDocumentRequest } from "../../global.d"

// Mock documents API service - this should be imported from the actual service
const documentsApiService = {
  getDocuments: async (_params?: GetDocumentsParams) => ({ results: [], totalCount: 0 }),
  createDocument: async (_data: CreateDocumentRequest) => ({} as Document),
  shareDocument: async (_documentId: string, _emails: string[], _message?: string) => {},
  downloadDocument: async (_documentId: string, _signed?: boolean) => '',
  deleteDocument: async (_documentId: string) => {},
}

interface GetDocumentsParams {
  limit?: number
  skip?: number
  offset?: number
  searchTerm?: string
  search?: string // Alias for searchTerm
  status?: DocumentStatus | 'all' | 'inbox'
  assignedToMe?: boolean
  page?: number // Add page for convenience
}

interface DocumentsCache {
  allDocuments: Document[]
  lastFetch: number
  isStale: boolean
}

interface DocumentsState {
  // Data
  documents: Document[] // Currently displayed documents after filtering
  currentDocument: Document | null
  isLoading: boolean
  error: string | null
  uploadError: string | null
  isUploading: boolean
  uploadProgress: number
  
  // Single cache for all documents
  cache: DocumentsCache
  
  // Filters and pagination
  currentFilter: DocumentStatus | 'all' | 'inbox'
  searchTerm: string
  searchQuery: string // Alias for searchTerm
  currentPage: number
  pageSize: number
  itemsPerPage: number // Alias for pageSize
  totalDocuments: number
  totalPages: number
  totalCount: number
  hasMore: boolean
  
  // Actions
  loadDocuments: () => Promise<void>
  fetchDocuments: (params?: GetDocumentsParams) => Promise<void> // Alias for loadDocuments
  refreshCache: (force?: boolean) => Promise<void>
  createDocument: (data: CreateDocumentRequest) => Promise<Document>
  uploadDocument: (data: CreateDocumentRequest) => Promise<Document> // Alias for createDocument
  shareDocument: (documentId: string, emails: string[], message?: string) => Promise<void>
  downloadDocument: (documentId: string, signed?: boolean) => Promise<string | null>
  deleteDocument: (documentId: string) => Promise<void>
  duplicateDocument: (documentId: string) => Promise<void>
  signDocument: (documentId: string) => Promise<void>
  
  // Filter actions
  setFilter: (filter: DocumentStatus | 'all' | 'inbox') => void
  setSearchTerm: (term: string) => void
  setSearchQuery: (query: string) => void // Alias for setSearchTerm
  setPage: (page: number) => void
  setCurrentPage: (page: number) => void // Alias for setPage
  setCurrentDocument: (doc: Document | null) => void
  
  // Cache actions
  invalidateCache: () => void
  clearError: () => void
  
  // Helper methods
  applyFilters: (searchTerm: string, status: DocumentStatus | 'all' | 'inbox') => Document[]
  updateDisplayedDocuments: () => void
  
  // Computed
  getDocumentCounts: () => {
    all: number
    inbox: number
    waiting: number
    signed: number
    drafted: number
    partially_signed: number
    declined: number
    expired: number
  }
  
  // Reset
  reset: () => void
}

const initialState = {
  documents: [],
  isLoading: false,
  error: null,
  cache: {
    allDocuments: [],
    lastFetch: 0,
    isStale: true
  },
  currentFilter: 'all' as DocumentStatus | 'all' | 'inbox', // Default to 'all'
  searchTerm: '',
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  itemsPerPage: 10
}

export const useDocumentsStore = create<DocumentsState>()(
  persist(
    (set, get) => ({
      // Initial state
      documents: [],
      currentDocument: null,
      isLoading: false,
      error: null,
      uploadError: null,
      isUploading: false,
      uploadProgress: 0,
      
      // Cache
      cache: {
        allDocuments: [],
        lastFetch: 0,
        isStale: true
      },
      
      // Filters and pagination
      currentFilter: 'all' as DocumentStatus | 'all' | 'inbox',
      searchTerm: '',
      searchQuery: '', // Alias for searchTerm
      currentPage: 1,
      pageSize: 10,
      itemsPerPage: 10, // Alias for pageSize
      totalDocuments: 0,
      totalPages: 1,
      totalCount: 0,
      hasMore: false,
      
      // Helper function to filter documents based on search and status
      applyFilters: (searchTerm: string, status: DocumentStatus | 'all' | 'inbox') => {
        const { cache } = get()
        let filteredDocuments = [...cache.allDocuments]
        
        // Apply status filter
        if (status === 'inbox') {
          // For inbox, show documents where user can sign or is assigned
          filteredDocuments = filteredDocuments.filter(doc => doc.canUserSign || doc.userRole === 'assignee')
        } else if (status !== 'all') {
          // Filter by specific status - handle all possible statuses
          filteredDocuments = filteredDocuments.filter(doc => {
            switch (status) {
              case 'waiting':
                return doc.status === 'waiting'
              case 'signed':
                return doc.status === 'signed'
              case 'drafted':
                return doc.status === 'drafted'
              case 'partially_signed':
                return doc.status === 'partially_signed'
              case 'declined':
                return doc.status === 'declined'
              case 'expired':
                return doc.status === 'expired'
              default:
                return doc.status === status
            }
          })
        }
        
        // Apply search filter
        if (searchTerm.trim()) {
          const search = searchTerm.toLowerCase().trim()
          filteredDocuments = filteredDocuments.filter(doc => 
            doc.name?.toLowerCase().includes(search) ||
            doc.description?.toLowerCase().includes(search) ||
            doc.senderEmail?.toLowerCase().includes(search)
          )
        }
        
        return filteredDocuments
      },
      
      // Update displayed documents based on current filter and cache
      updateDisplayedDocuments: () => {
        const state = get()
        const { currentFilter, searchTerm, currentPage, itemsPerPage } = state
        
        const filtered = state.applyFilters(searchTerm, currentFilter)
        const totalCount = filtered.length
        const totalPages = Math.ceil(totalCount / itemsPerPage)
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        const pageDocuments = filtered.slice(startIndex, endIndex)
        
        set({
          documents: pageDocuments,
          totalCount,
          totalPages: Math.max(1, totalPages)
        })
      },
      
      refreshCache: async (force = false) => {
        const state = get()
        const now = Date.now()
        const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
        
        const cacheAge = now - state.cache.lastFetch
        
        // Skip refresh if cache is fresh and not forced
        if (!force && !state.cache.isStale && cacheAge < CACHE_DURATION) {
          return
        }
        
        set({ isLoading: true, error: null })
        
        try {
          console.log(`🔄 Refreshing documents cache...`)
          
          // Make ONE API call to get ALL documents using status='all'
          // This will fetch from ALL report IDs and combine the results
          const response = await documentsApiService.getDocuments({
            status: 'all', // This is KEY - fetch ALL documents from all statuses
            limit: 1000 // Get all documents
          })
          
          // Update cache with all documents
          const newCache = {
            allDocuments: response.results,
            lastFetch: now,
            isStale: false
          }
          
          set({ 
            cache: newCache,
            isLoading: false 
          })
          
          console.log(`✅ Cache refreshed: ${response.results.length} documents loaded from ALL statuses`)
          
          // Update displayed documents
          get().updateDisplayedDocuments()
          
        } catch (error) {
          console.error(`❌ Error refreshing cache:`, error)
          set({ 
            error: error instanceof Error ? error.message : `Failed to refresh cache`,
            isLoading: false,
            cache: {
              ...state.cache,
              isStale: true
            }
          })
        }
      },
      
      loadDocuments: async () => {
        const state = get()
        const startTime = performance.now()
        
        const now = Date.now()
        const cacheAge = now - state.cache.lastFetch
        const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
        
        const canUseCache = !state.cache.isStale && 
                           cacheAge < CACHE_DURATION && 
                           state.cache.allDocuments.length > 0
        
        if (canUseCache) {
          const endTime = performance.now()
          console.log(`⚡ CACHE HIT! Documents loaded instantly in ${(endTime - startTime).toFixed(2)}ms`)
          console.log(`📊 Cache stats: ${state.cache.allDocuments.length} documents, age: ${Math.round(cacheAge / 1000)}s`)
          
          // Use cached data
          get().updateDisplayedDocuments()
          return
        }
        
        // Cache is stale or empty, refresh it
        console.log(`🔄 CACHE MISS - Refreshing...`)
        await get().refreshCache(true)
        
        const endTime = performance.now()
        console.log(`🏁 Load completed in ${(endTime - startTime).toFixed(2)}ms`)
      },
      
      createDocument: async (data: CreateDocumentRequest) => {
        set({ isLoading: true, error: null })
        
        try {
          const document = await documentsApiService.createDocument(data)
          
          // Invalidate cache and refresh
          get().invalidateCache()
          await get().refreshCache(true)
          
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
          
          // Refresh cache to get updated document
          await get().refreshCache(true)
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
          
          // Remove from cache immediately for instant UI update
          const state = get()
          const newCache = {
            ...state.cache,
            allDocuments: state.cache.allDocuments.filter(doc => doc.objectId !== documentId)
          }
          
          set({ cache: newCache })
          
          // Update displayed documents
          get().updateDisplayedDocuments()
          
          // If current page is empty after deletion, go to previous page
          const newState = get()
          if (newState.documents.length === 0 && newState.currentPage > 1) {
            set({ currentPage: newState.currentPage - 1 })
            get().updateDisplayedDocuments()
          }
        } catch (error) {
          console.error('Error deleting document:', error)
          throw error
        }
      },
      
      signDocument: async (documentId: string) => {
        try {
          console.log('Signing document:', documentId)
          
          // Refresh cache to get updated document status
          await get().refreshCache(true)
        } catch (error) {
          console.error('[Documents Store] Error signing document:', error)
          set({
            error: error instanceof Error ? error.message : 'Sign failed',
            isLoading: false
          })
          throw error
        }
      },
      
      // Alias methods for compatibility
      fetchDocuments: async (params?: GetDocumentsParams) => {
        return await get().loadDocuments()
      },
      
      uploadDocument: async (data: CreateDocumentRequest) => {
        return await get().createDocument(data)
      },
      
      setSearchQuery: (query: string) => {
        get().setSearchTerm(query)
      },
      
      setCurrentPage: (page: number) => {
        get().setPage(page)
      },
      
      duplicateDocument: async (documentId: string) => {
        // Use createDocument with existing document data
        console.log('Duplicating document:', documentId)
        set({ isLoading: true, error: null })
        
        try {
          // For now, just refresh the cache
          await get().refreshCache(true)
          set({ isLoading: false })
        } catch (error) {
          console.error('Error duplicating document:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Duplicate failed',
            isLoading: false
          })
          throw error
        }
      },
      
      clearError: () => {
        set({ error: null, uploadError: null })
      },
      
      setFilter: (filter: DocumentStatus | 'all' | 'inbox') => {
        const startTime = performance.now()
        set({ currentFilter: filter, currentPage: 1 })
        
        // Use cached data for instant filter response
        get().updateDisplayedDocuments()
        
        const endTime = performance.now()
        console.log(`🔍 Filter "${filter}" applied instantly in ${(endTime - startTime).toFixed(2)}ms using cache`)
      },
      
      setSearchTerm: (term: string) => {
        const startTime = performance.now()
        set({ searchTerm: term, currentPage: 1 })
        
        // Use cached data for instant search response
        get().updateDisplayedDocuments()
        
        const endTime = performance.now()
        console.log(`🔎 Search "${term}" applied instantly in ${(endTime - startTime).toFixed(2)}ms using cache`)
      },
      
      setPage: (page: number) => {
        const startTime = performance.now()
        set({ currentPage: page })
        
        // Use cached data for instant pagination
        get().updateDisplayedDocuments()
        
        const endTime = performance.now()
        console.log(`📄 Page ${page} loaded instantly in ${(endTime - startTime).toFixed(2)}ms using cache`)
      },
      
      invalidateCache: () => {
        const state = get()
        set({
          cache: {
            ...state.cache,
            isStale: true
          }
        })
      },
      
      getDocumentCounts: () => {
        const { cache } = get()
        const allDocs = cache?.allDocuments || []
        
        return {
          all: allDocs.length,
          inbox: allDocs.filter(doc => doc.canUserSign || doc.userRole === 'assignee').length,
          waiting: allDocs.filter(doc => doc.status === 'waiting').length,
          signed: allDocs.filter(doc => doc.status === 'signed').length,
          drafted: allDocs.filter(doc => doc.status === 'drafted').length,
          partially_signed: allDocs.filter(doc => doc.status === 'partially_signed').length,
          declined: allDocs.filter(doc => doc.status === 'declined').length,
          expired: allDocs.filter(doc => doc.status === 'expired').length
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
        searchTerm: state.searchTerm,
        itemsPerPage: state.itemsPerPage,
        // Don't persist cache as it should be fresh on app load
      })
    }
  )
)

// Export types for use in components
export type { Document, DocumentStatus, CreateDocumentRequest, GetDocumentsParams }

// Expose cache stats globally for debugging (development only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  interface CacheStatsResult {
    documentCounts: ReturnType<DocumentsState['getDocumentCounts']>
    cacheInfo: {
      allDocuments: number
      lastFetch: string
      isStale: boolean
    }
  }
  
  interface WindowWithDebug extends Window {
    getDocumentsCacheStats: () => CacheStatsResult
    forceRefreshCache: () => void
    invalidateCache: () => void
  }
  
  const windowWithDebug = window as unknown as WindowWithDebug
  
  windowWithDebug.getDocumentsCacheStats = () => {
    const state = useDocumentsStore.getState()
    const counts = state.getDocumentCounts()
    
    const cacheInfo = {
      allDocuments: state.cache.allDocuments.length,
      lastFetch: new Date(state.cache.lastFetch).toLocaleString(),
      isStale: state.cache.isStale
    }
    
    console.table({
      'Document Counts': counts,
      'Cache Info': cacheInfo
    })
    
    return { documentCounts: counts, cacheInfo }
  }
  
  windowWithDebug.forceRefreshCache = () => {
    console.log(`🔄 Forcing cache refresh...`)
    useDocumentsStore.getState().refreshCache(true)
  }
  
  windowWithDebug.invalidateCache = () => {
    console.log(`🗑️ Invalidating cache...`)
    useDocumentsStore.getState().invalidateCache()
  }
}
