"use client"

import { useEffect, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { EnvironmentalCalculator, type UsageData, type EnvironmentalImpact } from "@/lib/environmental-calculator"
import { useDataSyncStore } from "@/lib/data-sync-store"

// Query key for environmental data
const ENVIRONMENTAL_DATA_QUERY_KEY = ["environmentalData"]

// Function to fetch usage data from the API
const fetchUsageData = async (): Promise<UsageData> => {
  try {
    const response = await fetch("/api/usage-data")
    if (!response.ok) {
      // If the API call fails, throw an error to be caught by Tanstack Query
      const errorData = await response.json()
      throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`)
    }
    return response.json()
  } catch (error) {
    console.error("Failed to fetch usage data from API:", error)
    // Re-throw the error so Tanstack Query can handle it and update its error state
    throw error
  }
}

export function useEnvironmentalData() {
  const queryClient = useQueryClient()
  const { status: syncStatus, actions: syncActions } = useDataSyncStore()

  // Use Tanstack Query to fetch and manage environmental data
  const {
    data: usageData,
    isLoading,
    isFetching,
    error,
  } = useQuery<UsageData, Error>({
    queryKey: ENVIRONMENTAL_DATA_QUERY_KEY,
    queryFn: fetchUsageData,
    // Refetch data automatically based on the syncInterval from Zustand store
    refetchInterval: syncStatus.isActive ? syncStatus.syncInterval : false,
    // Keep data fresh for a short period to avoid immediate refetches on component mount
    staleTime: 1000 * 10, // 10 seconds
    // Refetch on reconnect only if auto-sync is active
    refetchOnReconnect: syncStatus.isActive,
    // No initialData needed here, as the API route will be available.
    // The component should handle loading states gracefully.
  })

  // Calculate environmental impact whenever usageData changes
  const environmentalImpact: EnvironmentalImpact | null = usageData
    ? EnvironmentalCalculator.calculateEnvironmentalImpact(usageData)
    : null

  // Effect to manage sync status in Zustand store based on query lifecycle
  useEffect(() => {
    if (isLoading || isFetching) {
      // When fetching starts, update sync status to active/syncing
      if (!syncStatus.isActive) {
        syncActions.startSync(syncStatus.syncInterval)
      }
      syncActions.setError(null) // Clear any previous errors
    } else if (error) {
      syncActions.setError(error.message)
      syncActions.incrementErrorCount()
      syncActions.stopSync() // Stop auto-sync on persistent error
    } else if (usageData) {
      // On successful fetch, update last sync time and increment count
      syncActions.setLastSync(new Date())
      syncActions.incrementSyncCount()
      syncActions.setError(null)
      // Update next sync time based on current interval
      if (syncStatus.isActive) {
        syncActions.setNextSync(new Date(Date.now() + syncStatus.syncInterval))
      }
    }
  }, [isLoading, isFetching, error, usageData, syncStatus.isActive, syncStatus.syncInterval, syncActions])

  // Manual sync trigger (invalidates query cache, forcing a refetch)
  const triggerManualSync = useCallback(async () => {
    syncActions.setError(null) // Clear error before manual sync
    syncActions.startSync(syncStatus.syncInterval) // Ensure sync is active
    await queryClient.invalidateQueries({ queryKey: ENVIRONMENTAL_DATA_QUERY_KEY })
  }, [queryClient, syncActions, syncStatus.syncInterval])

  // Toggle auto-sync
  const toggleAutoSync = useCallback(() => {
    if (syncStatus.isActive) {
      syncActions.stopSync()
    } else {
      syncActions.startSync(syncStatus.syncInterval)
      // Immediately refetch when auto-sync is re-enabled
      queryClient.invalidateQueries({ queryKey: ENVIRONMENTAL_DATA_QUERY_KEY })
    }
  }, [syncStatus.isActive, syncActions, syncStatus.syncInterval, queryClient])

  // Update sync interval
  const updateSyncInterval = useCallback(
    (interval: number) => {
      syncActions.setSyncInterval(interval)
      // If auto-sync is active, refetch immediately with new interval
      if (syncStatus.isActive) {
        queryClient.invalidateQueries({ queryKey: ENVIRONMENTAL_DATA_QUERY_KEY })
      }
    },
    [syncActions, syncStatus.isActive, queryClient],
  )

  return {
    usageData,
    environmentalImpact,
    loading: isLoading || isFetching, // Combine Tanstack Query loading states
    error: error ? error.message : null,
    syncStatus,
    triggerManualSync,
    toggleAutoSync,
    updateSyncInterval,
  }
}
