import { create } from "zustand"

export interface SyncStatus {
  isActive: boolean
  lastSync: Date | null
  nextSync: Date | null
  syncCount: number
  errorCount: number
  lastError: string | null
  syncInterval: number // Added to store config
}

interface DataSyncState {
  status: SyncStatus
  actions: {
    startSync: (interval: number) => void
    stopSync: () => void
    setLastSync: (date: Date) => void
    setNextSync: (date: Date | null) => void
    incrementSyncCount: () => void
    setError: (error: string | null) => void
    incrementErrorCount: () => void
    setSyncInterval: (interval: number) => void
  }
}

export const useDataSyncStore = create<DataSyncState>((set, get) => ({
  status: {
    isActive: false,
    lastSync: null,
    nextSync: null,
    syncCount: 0,
    errorCount: 0,
    lastError: null,
    syncInterval: 30000, // Default 30 seconds
  },
  actions: {
    startSync: (interval) =>
      set((state) => ({
        status: {
          ...state.status,
          isActive: true,
          syncInterval: interval,
          lastError: null,
          nextSync: new Date(Date.now() + interval),
        },
      })),
    stopSync: () =>
      set((state) => ({
        status: {
          ...state.status,
          isActive: false,
          nextSync: null,
        },
      })),
    setLastSync: (date) =>
      set((state) => ({
        status: {
          ...state.status,
          lastSync: date,
        },
      })),
    setNextSync: (date) =>
      set((state) => ({
        status: {
          ...state.status,
          nextSync: date,
        },
      })),
    incrementSyncCount: () =>
      set((state) => ({
        status: {
          ...state.status,
          syncCount: state.status.syncCount + 1,
        },
      })),
    setError: (error) =>
      set((state) => ({
        status: {
          ...state.status,
          lastError: error,
        },
      })),
    incrementErrorCount: () =>
      set((state) => ({
        status: {
          ...state.status,
          errorCount: state.status.errorCount + 1,
        },
      })),
    setSyncInterval: (interval) => {
      const currentStatus = get().status
      set((state) => ({
        status: {
          ...state.status,
          syncInterval: interval,
          nextSync: currentStatus.isActive ? new Date(Date.now() + interval) : null,
        },
      }))
    },
  },
}))
