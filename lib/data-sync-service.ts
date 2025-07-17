"use client"

import { EnvironmentalCalculator, type UsageData, type EnvironmentalImpact } from "./environmental-calculator"

export interface DataSyncConfig {
  autoSync: boolean
  syncInterval: number
  retryAttempts: number
  retryDelay: number
}

export interface SyncStatus {
  isActive: boolean
  lastSync: Date | null
  nextSync: Date | null
  syncCount: number
  errorCount: number
  lastError: string | null
}

export class DataSyncService {
  private static instance: DataSyncService
  private config: DataSyncConfig
  private status: SyncStatus
  private syncInterval: NodeJS.Timeout | null = null
  private subscribers: Set<(data: { usage: UsageData; impact: EnvironmentalImpact }) => void> = new Set()
  private errorSubscribers: Set<(error: string) => void> = new Set()
  private statusSubscribers: Set<(status: SyncStatus) => void> = new Set()

  private constructor() {
    this.config = {
      autoSync: true,
      syncInterval: 30000, // 30 seconds
      retryAttempts: 3,
      retryDelay: 5000, // 5 seconds
    }

    this.status = {
      isActive: false,
      lastSync: null,
      nextSync: null,
      syncCount: 0,
      errorCount: 0,
      lastError: null,
    }
  }

  static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService()
    }
    return DataSyncService.instance
  }

  /**
   * Start automatic data synchronization
   */
  startAutoSync(): void {
    if (this.status.isActive) {
      console.log("🔄 Data sync already active")
      return
    }

    this.status.isActive = true
    this.status.lastError = null

    // Initial sync
    this.performSync()

    // Schedule recurring sync
    this.syncInterval = setInterval(() => {
      this.performSync()
    }, this.config.syncInterval)

    this.updateNextSyncTime()
    this.notifyStatusSubscribers()

    console.log(`🚀 Started automatic data sync (every ${this.config.syncInterval}ms)`)
  }

  /**
   * Stop automatic data synchronization
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }

    this.status.isActive = false
    this.status.nextSync = null
    this.notifyStatusSubscribers()

    console.log("🛑 Stopped automatic data sync")
  }

  /**
   * Perform a single sync operation with retry logic
   */
  private async performSync(attempt = 1): Promise<void> {
    try {
      console.log(`🔄 Syncing data (attempt ${attempt}/${this.config.retryAttempts})...`)

      const response = await fetch("/api/usage-data", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const usageData: UsageData = await response.json()
      const environmentalImpact = EnvironmentalCalculator.calculateEnvironmentalImpact(usageData)

      // Update status
      this.status.lastSync = new Date()
      this.status.syncCount++
      this.status.lastError = null
      this.updateNextSyncTime()

      // Notify subscribers
      this.notifySubscribers({ usage: usageData, impact: environmentalImpact })
      this.notifyStatusSubscribers()

      console.log("✅ Data sync completed successfully")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error(`❌ Data sync failed (attempt ${attempt}):`, errorMessage)

      this.status.errorCount++
      this.status.lastError = errorMessage

      // Retry logic
      if (attempt < this.config.retryAttempts) {
        console.log(`⏳ Retrying in ${this.config.retryDelay}ms...`)
        setTimeout(() => {
          this.performSync(attempt + 1)
        }, this.config.retryDelay)
      } else {
        console.error("💥 All retry attempts failed")
        this.notifyErrorSubscribers(errorMessage)
      }

      this.notifyStatusSubscribers()
    }
  }

  /**
   * Manual sync trigger
   */
  async triggerSync(): Promise<void> {
    console.log("🔄 Manual sync triggered")
    await this.performSync()
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<DataSyncConfig>): void {
    const oldInterval = this.config.syncInterval
    this.config = { ...this.config, ...newConfig }

    // Restart sync if interval changed and sync is active
    if (this.status.isActive && oldInterval !== this.config.syncInterval) {
      this.stopAutoSync()
      this.startAutoSync()
    }

    console.log("⚙️ Data sync configuration updated:", this.config)
  }

  /**
   * Subscribe to data updates
   */
  subscribe(callback: (data: { usage: UsageData; impact: EnvironmentalImpact }) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * Subscribe to error updates
   */
  subscribeToErrors(callback: (error: string) => void): () => void {
    this.errorSubscribers.add(callback)
    return () => this.errorSubscribers.delete(callback)
  }

  /**
   * Subscribe to status updates
   */
  subscribeToStatus(callback: (status: SyncStatus) => void): () => void {
    this.statusSubscribers.add(callback)
    return () => this.statusSubscribers.delete(callback)
  }

  /**
   * Get current status
   */
  getStatus(): SyncStatus {
    return { ...this.status }
  }

  /**
   * Get current configuration
   */
  getConfig(): DataSyncConfig {
    return { ...this.config }
  }

  private updateNextSyncTime(): void {
    if (this.status.isActive) {
      this.status.nextSync = new Date(Date.now() + this.config.syncInterval)
    }
  }

  private notifySubscribers(data: { usage: UsageData; impact: EnvironmentalImpact }): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(data)
      } catch (error) {
        console.error("Error in data subscriber:", error)
      }
    })
  }

  private notifyErrorSubscribers(error: string): void {
    this.errorSubscribers.forEach((callback) => {
      try {
        callback(error)
      } catch (error) {
        console.error("Error in error subscriber:", error)
      }
    })
  }

  private notifyStatusSubscribers(): void {
    this.statusSubscribers.forEach((callback) => {
      try {
        callback(this.status)
      } catch (error) {
        console.error("Error in status subscriber:", error)
      }
    })
  }
}

// This file is no longer directly used by the client-side hooks
// as Tanstack Query and Zustand now manage the client-side sync.
// It remains as a conceptual service if you need a more complex
// background sync logic that isn't directly tied to a React hook.
// For this project, its functionality has been absorbed by useEnvironmentalData and useDataSyncStore.

// Keeping it here as a placeholder or for potential future server-side logic.
// If it's purely client-side, it can be removed.
