// This file is no longer directly used by the client-side hooks
// as Tanstack Query and Zustand now manage the client-side sync.
// It remains relevant for server-side cron jobs (e.g., via vercel.json).

// Cron job scheduler for systematic data updates
export class CronScheduler {
  private static intervals: Map<string, NodeJS.Timeout> = new Map()

  /**
   * Schedule a recurring task
   */
  static schedule(name: string, task: () => Promise<void>, intervalMs: number) {
    // Clear existing interval if it exists
    this.unschedule(name)

    // Schedule new interval
    const interval = setInterval(async () => {
      try {
        await task()
        console.log(`✅ Cron job "${name}" executed successfully at ${new Date().toISOString()}`)
      } catch (error) {
        console.error(`❌ Cron job "${name}" failed:`, error)
      }
    }, intervalMs)

    this.intervals.set(name, interval)
    console.log(`🕐 Scheduled cron job "${name}" to run every ${intervalMs}ms`)
  }

  /**
   * Unschedule a task
   */
  static unschedule(name: string) {
    const interval = this.intervals.get(name)
    if (interval) {
      clearInterval(interval)
      this.intervals.delete(name)
      console.log(`🛑 Unscheduled cron job "${name}"`)
    }
  }

  /**
   * Get all active cron jobs
   */
  static getActiveCrons(): string[] {
    return Array.from(this.intervals.keys())
  }

  /**
   * Clear all cron jobs
   */
  static clearAll() {
    this.intervals.forEach((interval, name) => {
      clearInterval(interval)
      console.log(`🛑 Cleared cron job "${name}"`)
    })
    this.intervals.clear()
  }
}

// Predefined cron intervals
export const CRON_INTERVALS = {
  EVERY_30_SECONDS: 30 * 1000,
  EVERY_MINUTE: 60 * 1000,
  EVERY_5_MINUTES: 5 * 60 * 1000,
  EVERY_15_MINUTES: 15 * 60 * 1000,
  EVERY_HOUR: 60 * 60 * 1000,
  EVERY_DAY: 24 * 60 * 60 * 1000,
} as const
