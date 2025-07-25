import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { UsageData, EnvironmentalImpact } from "./environmental-calculator"

interface DataSyncState {
  // Sync status
  isSyncing: boolean
  lastSyncTime: Date | null
  syncError: string | null
  
  // Data storage
  usageData: UsageData | null
  environmentalImpact: EnvironmentalImpact | null
  
  // Actions
  startSync: () => void
  completeSync: () => void
  failSync: (error: string) => void
  setLastSyncTime: (time: Date) => void
  setUsageData: (data: UsageData) => void
  setEnvironmentalImpact: (impact: EnvironmentalImpact) => void
  clearData: () => void
}

export const useDataSyncStore = create<DataSyncState>()(
  persist(
    (set) => ({
      // Initial state
      isSyncing: false,
      lastSyncTime: null,
      syncError: null,
      usageData: null,
      environmentalImpact: null,
      
      // Sync actions
      startSync: () => set({ isSyncing: true, syncError: null }),
      completeSync: () => set({ isSyncing: false, syncError: null }),
      failSync: (error) => set({ isSyncing: false, syncError: error }),
      setLastSyncTime: (time) => set({ lastSyncTime: time }),
      
      // Data actions
      setUsageData: (data) => set({ usageData: data }),
      setEnvironmentalImpact: (impact) => set({ environmentalImpact: impact }),
      clearData: () => set({ 
        usageData: null, 
        environmentalImpact: null, 
        syncError: null 
      }),
    }),
    {
      name: "data-sync-storage",
      storage: createJSONStorage(() => localStorage),
      // Only persist data, not sync status
      partialize: (state) => ({
        lastSyncTime: state.lastSyncTime,
        usageData: state.usageData,
        environmentalImpact: state.environmentalImpact,
      }),
    }
  )
)
