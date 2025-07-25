"use client"

import { EnvironmentalCalculator, type UsageData, type EnvironmentalImpact } from "./environmental-calculator"
import { useDataSyncStore } from "./data-sync-store"
import { openSignApiService } from "@/app/lib/api-service"

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

// OpenSign API response types
interface OpenSignResponse<T> {
  results: T[]
}

interface OpenSignUsageStats {
  documents: OpenSignResponse<{ objectId: string; IsCompleted?: boolean; Status?: string; Signers?: Array<{ isSigned?: boolean }> }>
  templates: OpenSignResponse<{ objectId: string }>
  users: OpenSignResponse<{ objectId: string }>
  contacts: OpenSignResponse<{ objectId: string }>
  fetchedAt: string
  errors?: string[]
}

export class DataSyncService {
  private static instance: DataSyncService
  private config: DataSyncConfig
  private status: SyncStatus
  private syncInterval: NodeJS.Timeout | null = null
  private subscribers: Set<(data: { usage: UsageData; impact: EnvironmentalImpact }) => void> = new Set()
  private errorSubscribers: Set<(error: string) => void> = new Set()
  private statusSubscribers: Set<(status: SyncStatus) => void> = new Set()
  private usageStatsCache: { data: OpenSignUsageStats; timestamp: number } | null = null
  private readonly cacheTimeout = 5 * 60 * 1000 // 5 minutes cache

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
   * Fetch usage statistics directly from OpenSign API with caching
   */
  async getUsageStatistics(useCache = true): Promise<OpenSignUsageStats> {
    // Check cache first (only in browser environment)
    if (useCache && typeof window !== 'undefined' && this.usageStatsCache) {
      if (Date.now() - this.usageStatsCache.timestamp < this.cacheTimeout) {
        console.log('📋 Using cached OpenSign usage statistics');
        return this.usageStatsCache.data;
      }
    }

    try {
      console.log('🔄 Fetching fresh usage statistics from OpenSign API...');
      
      const [documentsResponse, templatesResponse, usersResponse, contactsResponse] = await Promise.allSettled([
        openSignApiService.get<{ results: Array<{ objectId: string; IsCompleted?: boolean; Status?: string; Signers?: Array<{ isSigned?: boolean }> }> }>("classes/contracts_Document?limit=1000"),
        openSignApiService.get<{ results: Array<{ objectId: string }> }>("classes/contracts_Template?limit=1000"),
        openSignApiService.get<{ results: Array<{ objectId: string }> }>("classes/contracts_Users?limit=1000"),
        openSignApiService.get<{ results: Array<{ objectId: string }> }>("classes/contracts_Contactbook?limit=1000"),
      ]);

      // Check for any failed requests and log them
      const errors = [
        { name: 'documents', response: documentsResponse },
        { name: 'templates', response: templatesResponse },
        { name: 'users', response: usersResponse },
        { name: 'contacts', response: contactsResponse }
      ].filter(({ response }) => response.status === 'rejected')
       .map(({ name, response }) => {
         const rejectedResponse = response as PromiseRejectedResult;
         return `${name}: ${rejectedResponse.reason}`;
       });

      if (errors.length > 0) {
        console.warn('⚠️ Some OpenSign API requests failed:', errors);
      }

      const result: OpenSignUsageStats = {
        documents: documentsResponse.status === 'fulfilled' ? documentsResponse.value : { results: [] },
        templates: templatesResponse.status === 'fulfilled' ? templatesResponse.value : { results: [] },
        users: usersResponse.status === 'fulfilled' ? usersResponse.value : { results: [] },
        contacts: contactsResponse.status === 'fulfilled' ? contactsResponse.value : { results: [] },
        fetchedAt: new Date().toISOString(),
        errors: errors.length > 0 ? errors : undefined
      };

      // Cache the result (only in browser environment)
      if (useCache && typeof window !== 'undefined') {
        try {
          this.usageStatsCache = {
            data: result,
            timestamp: Date.now()
          };
        } catch (e) {
          console.warn('⚠️ Failed to cache usage statistics:', e);
        }
      }

      console.log('✅ Usage statistics fetched successfully');
      return result;
      
    } catch (error) {
      console.error("❌ Error fetching usage statistics:", error);
      
      // Enhanced error context
      const enhancedError = new Error(
        `Failed to fetch OpenSign usage statistics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      
      // Add original error as cause if available
      if (error instanceof Error) {
        Object.defineProperty(enhancedError, 'cause', {
          value: error,
          writable: false,
          enumerable: false,
          configurable: true
        });
      }
      
      throw enhancedError;
    }
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
      console.log(`🔄 Syncing data from OpenSign API (attempt ${attempt}/${this.config.retryAttempts})...`)

      // Fetch real-time data directly from OpenSign API
      const statsResponse = await this.getUsageStatistics();

      // Process the responses and extract counts
      const documentsCount = statsResponse.documents?.results?.length || 0;
      const templatesCount = statsResponse.templates?.results?.length || 0;
      const usersCount = statsResponse.users?.results?.length || 0;
      const contactsCount = statsResponse.contacts?.results?.length || 0;

      console.log("📈 Raw OpenSign statistics:", {
        documents: documentsCount,
        templates: templatesCount,
        users: usersCount,
        contacts: contactsCount
      });

      // Calculate derived metrics
      const documentsData = statsResponse.documents?.results || [];

      // Count signed documents (documents with completion indicators)
      const signedDocuments = documentsData.filter((doc) => {
        const IsCompleted = doc.IsCompleted as boolean | undefined
        const Status = doc.Status as string | undefined
        const Signers = doc.Signers as Array<{ isSigned?: boolean }> | undefined
        
        return IsCompleted === true || 
               Status === 'completed' || 
               Status === 'signed' ||
               Signers?.some((signer) => signer.isSigned)
      }).length

      // Calculate active users (users with recent activity)
      const activeUsers = Math.min(usersCount, Math.max(1, Math.floor(usersCount * 0.7))) // Assume 70% are active

      // Estimate energy consumption based on document activity (0.05 kWh per document processed)
      const currentEnergyConsumption = Number.parseFloat((documentsCount * 0.05).toFixed(2))

      // Calculate average sheets per document (realistic estimate)
      const avgSheetsPerDoc = documentsCount > 0 ? Math.max(1, Math.floor(2.5)) : 1 // Average 2.5 sheets per document

      // Build comprehensive usage data from real OpenSign metrics
      const usageData: UsageData = {
        documentsSigned: signedDocuments,
        usersActive: activeUsers,
        currentEnergyConsumption,
        signRequests: documentsCount,
        sheetsPerDocument: avgSheetsPerDoc,
        contactsToSign: contactsCount,
        contactsInCopy: Math.floor(contactsCount * 0.2), // Estimate 20% are in copy
        timestamp: new Date().toISOString(),
        period: "real-time",
        // Additional OpenSign specific metrics
        totalTemplates: templatesCount,
        totalUsers: usersCount,
        totalContacts: contactsCount,
      }
      
      // Calculate environmental impact based on real OpenSign data
      const environmentalImpact = EnvironmentalCalculator.calculateEnvironmentalImpact(
        usageData.documentsSigned,
        usageData.usersActive,
        1, // Daily period
      )

      // Update status
      this.status.lastSync = new Date()
      this.status.syncCount++
      this.status.lastError = null
      this.updateNextSyncTime()

      // Update the data sync store
      const store = useDataSyncStore.getState()
      store.setLastSyncTime(new Date())
      store.setUsageData(usageData)
      store.setEnvironmentalImpact(environmentalImpact)

      // Notify subscribers
      this.notifySubscribers({ usage: usageData, impact: environmentalImpact })
      this.notifyStatusSubscribers()

      console.log("✅ Data sync completed successfully", {
        documents: usageData.documentsSigned,
        users: usageData.usersActive,
        period: usageData.period,
        timestamp: usageData.timestamp
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error(`❌ Data sync failed (attempt ${attempt}):`, errorMessage)

      this.status.errorCount++
      this.status.lastError = errorMessage

      // Update store with error
      const store = useDataSyncStore.getState()
      store.failSync(errorMessage)

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

// Simplified data sync service for easy usage
export const dataSyncService = {
  /**
   * Fetch latest usage data from OpenSign API
   */
  async fetchUsageData(): Promise<UsageData> {
    const store = useDataSyncStore.getState()
    store.startSync()

    try {
      console.log("📊 Fetching real-time usage data from OpenSign API...")
      const syncService = DataSyncService.getInstance()
      const statsResponse = await syncService.getUsageStatistics()

      // Process the responses and extract counts
      const documentsCount = statsResponse.documents?.results?.length || 0;
      const templatesCount = statsResponse.templates?.results?.length || 0;
      const usersCount = statsResponse.users?.results?.length || 0;
      const contactsCount = statsResponse.contacts?.results?.length || 0;

      // Calculate derived metrics
      const documentsData = statsResponse.documents?.results || [];

      // Count signed documents (documents with completion indicators)
      const signedDocuments = documentsData.filter((doc) => {
        const IsCompleted = doc.IsCompleted as boolean | undefined
        const Status = doc.Status as string | undefined
        const Signers = doc.Signers as Array<{ isSigned?: boolean }> | undefined
        
        return IsCompleted === true || 
               Status === 'completed' || 
               Status === 'signed' ||
               Signers?.some((signer) => signer.isSigned)
      }).length

      // Calculate active users (users with recent activity)
      const activeUsers = Math.min(usersCount, Math.max(1, Math.floor(usersCount * 0.7))) // Assume 70% are active

      // Estimate energy consumption based on document activity (0.05 kWh per document processed)
      const currentEnergyConsumption = Number.parseFloat((documentsCount * 0.05).toFixed(2))

      // Calculate average sheets per document (realistic estimate)
      const avgSheetsPerDoc = documentsCount > 0 ? Math.max(1, Math.floor(2.5)) : 1 // Average 2.5 sheets per document

      // Build comprehensive usage data from real OpenSign metrics
      const data: UsageData = {
        documentsSigned: signedDocuments,
        usersActive: activeUsers,
        currentEnergyConsumption,
        signRequests: documentsCount,
        sheetsPerDocument: avgSheetsPerDoc,
        contactsToSign: contactsCount,
        contactsInCopy: Math.floor(contactsCount * 0.2), // Estimate 20% are in copy
        timestamp: new Date().toISOString(),
        period: "real-time",
        // Additional OpenSign specific metrics
        totalTemplates: templatesCount,
        totalUsers: usersCount,
        totalContacts: contactsCount,
      }
      
      store.setUsageData(data)
      store.setLastSyncTime(new Date())
      store.completeSync()
      
      console.log("✅ Usage data fetched successfully:", {
        documents: data.documentsSigned,
        users: data.usersActive,
        period: data.period
      })
      
      return data
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error("❌ Error fetching usage data:", errorMessage)
      store.failSync(errorMessage)
      throw error
    }
  },

  /**
   * Calculate and sync environmental impact
   */
  async syncEnvironmentalData(): Promise<EnvironmentalImpact> {
    const store = useDataSyncStore.getState()
    
    try {
      // Get latest usage data
      const usageData = await this.fetchUsageData()
      
      // Calculate environmental impact
      const impact = EnvironmentalCalculator.calculateEnvironmentalImpact(
        usageData.documentsSigned,
        usageData.usersActive,
        1, // Daily calculation
      )
      
      store.setEnvironmentalImpact(impact)
      
      console.log("🌍 Environmental impact calculated:", {
        paperSaved: impact.paperSaved,
        treesSaved: impact.treesSaved,
        co2Reduced: impact.co2Reduced
      })
      
      return impact
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error("❌ Error syncing environmental data:", errorMessage)
      store.failSync(errorMessage)
      throw error
    }
  },

  /**
   * Get the singleton DataSyncService instance
   */
  getInstance(): DataSyncService {
    return DataSyncService.getInstance()
  }
}

/**
 * React hook for easy data synchronization
 */
export function useDataSyncService() {
  const store = useDataSyncStore()

  const syncData = async () => {
    try {
      await dataSyncService.syncEnvironmentalData()
    } catch (error) {
      console.error("Error in useDataSyncService.syncData:", error)
    }
  }

  const fetchUsageData = async () => {
    try {
      return await dataSyncService.fetchUsageData()
    } catch (error) {
      console.error("Error in useDataSyncService.fetchUsageData:", error)
      throw error
    }
  }

  return { 
    syncData,
    fetchUsageData,
    ...store 
  }
}
