"use client"

import { useEffect, useState } from "react"
import { useDataSyncStore } from "@/app/lib/data-sync-store"
import { dataSyncService, DataSyncService } from "@/app/lib/data-sync-service"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function SyncStatusIndicator() {
  const store = useDataSyncStore()
  const [syncService] = useState(() => DataSyncService.getInstance())
  const [serviceStatus, setServiceStatus] = useState(syncService.getStatus())

  useEffect(() => {
    // Subscribe to sync service status updates
    const unsubscribe = syncService.subscribeToStatus(setServiceStatus)
    return unsubscribe
  }, [syncService])

  const handleManualSync = async () => {
    try {
      await dataSyncService.syncEnvironmentalData()
    } catch (error) {
      console.error("Manual sync failed:", error)
    }
  }

  const handleToggleAutoSync = () => {
    if (serviceStatus.isActive) {
      syncService.stopAutoSync()
    } else {
      syncService.startAutoSync()
    }
  }

  const formatTime = (date: Date | null) => {
    if (!date) return "Never"
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(date))
  }

  const getSyncStatusBadge = () => {
    if (store.isSyncing) {
      return <Badge variant="secondary" className="animate-pulse bg-yellow-600 text-white">Syncing...</Badge>
    }
    if (store.syncError) {
      return <Badge variant="destructive" className="bg-red-600 text-white">Error</Badge>
    }
    if (store.usageData) {
      return <Badge variant="default" className="bg-green-600 text-white">Synced</Badge>
    }
    return <Badge variant="outline" className="border-gray-500 text-gray-300">Not Synced</Badge>
  }

  return (
    <Card className="w-full bg-gray-900 text-white border-gray-700 rounded-2xl shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-white">
          WatiqaSign Data Sync
          {getSyncStatusBadge()}
        </CardTitle>
        <CardDescription className="text-gray-300">
          Real-time synchronization with WatiqaSign API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Usage Data Display */}
        {store.usageData ? (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-300">Documents Signed</p>
              <p className="text-2xl font-bold text-green-400">
                {store.usageData.documentsSigned.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-300">Active Users</p>
              <p className="text-2xl font-bold text-blue-400">
                {store.usageData.usersActive.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-300">Total Templates</p>
              <p className="text-lg text-white">{store.usageData.totalTemplates || 'N/A'}</p>
            </div>
            <div>
              <p className="font-medium text-gray-300">Energy Usage</p>
              <p className="text-lg text-white">{store.usageData.currentEnergyConsumption?.toFixed(2)} kWh</p>
            </div>
          </div>
        ) : store.isSyncing ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full bg-gray-800" />
            <Skeleton className="h-16 w-full bg-gray-800" />
          </div>
        ) : (
          <p className="text-gray-400">No data available. Click sync to fetch data.</p>
        )}

        {/* Environmental Impact */}
        {store.environmentalImpact && (
          <div className="pt-4 border-t border-gray-700">
            <p className="font-medium mb-2 text-gray-300">Environmental Impact</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <p className="font-medium text-white">{store.environmentalImpact.paperSaved.toFixed(1)} kg</p>
                <p className="text-gray-400">Paper Saved</p>
              </div>
              <div className="text-center">
                <p className="font-medium text-white">{store.environmentalImpact.treesSaved.toFixed(1)}</p>
                <p className="text-gray-400">Trees Saved</p>
              </div>
              <div className="text-center">
                <p className="font-medium text-white">{store.environmentalImpact.co2Reduced.toFixed(1)} kg</p>
                <p className="text-gray-400">CO2 Reduced</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {store.syncError && (
          <div className="p-3 bg-red-900/50 border border-red-700 rounded text-sm text-red-200">
            <p className="font-medium">Sync Error:</p>
            <p>{store.syncError}</p>
          </div>
        )}

        {/* Sync Status Info */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>Last sync: {formatTime(store.lastSyncTime)}</p>
          <p>Auto-sync: {serviceStatus.isActive ? 'Active' : 'Inactive'}</p>
          {serviceStatus.nextSync && (
            <p>Next sync: {formatTime(serviceStatus.nextSync)}</p>
          )}
          <p>Sync count: {serviceStatus.syncCount} | Errors: {serviceStatus.errorCount}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={handleManualSync} 
            disabled={store.isSyncing}
            size="sm"
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
            variant="outline"
          >
            {store.isSyncing ? "Syncing..." : "Manual Sync"}
          </Button>
          <Button 
            onClick={handleToggleAutoSync}
            variant="outline"
            size="sm"
            className={`flex-1 ${
              serviceStatus.isActive 
                ? "bg-red-700 hover:bg-red-600 text-white border-red-600" 
                : "bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
            }`}
          >
            {serviceStatus.isActive ? "Stop Auto" : "Start Auto"}
          </Button>
        </div>

        {/* Data Source Indicator */}
        {store.usageData && (
          <div className="text-xs text-center text-gray-400">
            Data source: {store.usageData.period} | 
            {store.usageData.error ? " Fallback mode" : " Live WatiqaSign API"}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
