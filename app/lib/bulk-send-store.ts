import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { BulkSend, BulkSendSigner, CreateBulkSendRequest } from "./bulk-send-api-service"

// Bulk Send Store Interface
interface BulkSendState {
  // Data state
  bulkSends: BulkSend[]
  currentBulkSend: BulkSend | null
  
  // UI state
  isLoading: boolean
  error: string | null
  
  // CRUD Actions
  setBulkSends: (bulkSends: BulkSend[]) => void
  addBulkSend: (bulkSend: BulkSend) => void
  updateBulkSend: (id: string, updates: Partial<BulkSend>) => void
  deleteBulkSend: (id: string) => void
  
  // Current bulk send actions
  setCurrentBulkSend: (bulkSend: BulkSend | null) => void
  
  // UI state actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Utility actions
  clearBulkSends: () => void
  getBulkSendById: (id: string) => BulkSend | undefined
  
  // Signer management actions
  addSigner: (bulkSendId: string, signer: Omit<BulkSendSigner, 'id' | 'status'>) => void
  updateSigner: (bulkSendId: string, signerId: string, updates: Partial<BulkSendSigner>) => void
  removeSigner: (bulkSendId: string, signerId: string) => void
  reorderSigners: (bulkSendId: string, signers: BulkSendSigner[]) => void
}

export const useBulkSendStore = create<BulkSendState>()(
  persist(
    (set, get) => ({
      // Initial state
      bulkSends: [],
      currentBulkSend: null,
      isLoading: false,
      error: null,
      
      // CRUD Actions
      setBulkSends: (bulkSends) => 
        set({ bulkSends, error: null }),
      
      addBulkSend: (bulkSend) =>
        set((state) => ({
          bulkSends: [bulkSend, ...state.bulkSends],
          currentBulkSend: bulkSend,
          error: null
        })),
      
      updateBulkSend: (id, updates) =>
        set((state) => ({
          bulkSends: state.bulkSends.map((bs) =>
            bs.id === id ? { ...bs, ...updates, updatedAt: new Date().toISOString() } : bs
          ),
          currentBulkSend: 
            state.currentBulkSend?.id === id 
              ? { ...state.currentBulkSend, ...updates, updatedAt: new Date().toISOString() }
              : state.currentBulkSend
        })),
      
      deleteBulkSend: (id) =>
        set((state) => ({
          bulkSends: state.bulkSends.filter((bs) => bs.id !== id),
          currentBulkSend: state.currentBulkSend?.id === id ? null : state.currentBulkSend
        })),
      
      // Current bulk send actions
      setCurrentBulkSend: (bulkSend) =>
        set({ currentBulkSend: bulkSend }),
      
      // UI state actions
      setLoading: (loading) =>
        set({ isLoading: loading }),
      
      setError: (error) =>
        set({ error, isLoading: false }),
      
      // Utility actions
      clearBulkSends: () =>
        set({ bulkSends: [], currentBulkSend: null, error: null }),
      
      getBulkSendById: (id) =>
        get().bulkSends.find((bs) => bs.id === id),
      
      // Signer management actions
      addSigner: (bulkSendId, signer) =>
        set((state) => ({
          bulkSends: state.bulkSends.map((bs) =>
            bs.id === bulkSendId
              ? {
                  ...bs,
                  signers: [
                    ...bs.signers,
                    {
                      ...signer,
                      id: `signer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      status: 'pending' as const
                    }
                  ],
                  totalRecipients: bs.signers.length + 1,
                  updatedAt: new Date().toISOString()
                }
              : bs
          ),
          currentBulkSend:
            state.currentBulkSend?.id === bulkSendId
              ? {
                  ...state.currentBulkSend,
                  signers: [
                    ...state.currentBulkSend.signers,
                    {
                      ...signer,
                      id: `signer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      status: 'pending' as const
                    }
                  ],
                  totalRecipients: state.currentBulkSend.signers.length + 1,
                  updatedAt: new Date().toISOString()
                }
              : state.currentBulkSend
        })),
      
      updateSigner: (bulkSendId, signerId, updates) =>
        set((state) => ({
          bulkSends: state.bulkSends.map((bs) =>
            bs.id === bulkSendId
              ? {
                  ...bs,
                  signers: bs.signers.map((signer) =>
                    signer.id === signerId ? { ...signer, ...updates } : signer
                  ),
                  updatedAt: new Date().toISOString()
                }
              : bs
          ),
          currentBulkSend:
            state.currentBulkSend?.id === bulkSendId
              ? {
                  ...state.currentBulkSend,
                  signers: state.currentBulkSend.signers.map((signer) =>
                    signer.id === signerId ? { ...signer, ...updates } : signer
                  ),
                  updatedAt: new Date().toISOString()
                }
              : state.currentBulkSend
        })),
      
      removeSigner: (bulkSendId, signerId) =>
        set((state) => ({
          bulkSends: state.bulkSends.map((bs) =>
            bs.id === bulkSendId
              ? {
                  ...bs,
                  signers: bs.signers.filter((signer) => signer.id !== signerId),
                  totalRecipients: Math.max(0, bs.totalRecipients - 1),
                  updatedAt: new Date().toISOString()
                }
              : bs
          ),
          currentBulkSend:
            state.currentBulkSend?.id === bulkSendId
              ? {
                  ...state.currentBulkSend,
                  signers: state.currentBulkSend.signers.filter((signer) => signer.id !== signerId),
                  totalRecipients: Math.max(0, state.currentBulkSend.totalRecipients - 1),
                  updatedAt: new Date().toISOString()
                }
              : state.currentBulkSend
        })),
      
      reorderSigners: (bulkSendId, signers) =>
        set((state) => ({
          bulkSends: state.bulkSends.map((bs) =>
            bs.id === bulkSendId
              ? {
                  ...bs,
                  signers: signers.map((signer, index) => ({ ...signer, order: index + 1 })),
                  updatedAt: new Date().toISOString()
                }
              : bs
          ),
          currentBulkSend:
            state.currentBulkSend?.id === bulkSendId
              ? {
                  ...state.currentBulkSend,
                  signers: signers.map((signer, index) => ({ ...signer, order: index + 1 })),
                  updatedAt: new Date().toISOString()
                }
              : state.currentBulkSend
        }))
    }),
    {
      name: "bulk-send-store",
      storage: createJSONStorage(() => localStorage),
      // Only persist bulk sends data, not UI state
      partialize: (state) => ({
        bulkSends: state.bulkSends,
        currentBulkSend: state.currentBulkSend
      })
    }
  )
)

// Export types for use in components
export type { BulkSend, BulkSendSigner, CreateBulkSendRequest }
