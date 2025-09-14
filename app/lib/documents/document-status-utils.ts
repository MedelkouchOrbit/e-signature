import type { DocumentStatus } from "./documents-types"

/**
 * ✅ OpenSign Backend ReportId Mapping for Document Status Filtering
 * Based on backend analysis: different reportIds return different document statuses
 */

// Status-specific reportIds provided by backend
export const STATUS_REPORT_IDS = {
  'in-progress': '1MwEuxLEkF',      // Documents in progress
  'waiting': '1MwEuxLEkF',          // Alias for in-progress 
  'completed': 'kQUoW4hUXz',        // Completed/signed documents
  'signed': 'kQUoW4hUXz',           // Alias for completed
  'drafted': 'ByHuevtCFY',          // Draft documents
  'draft': 'ByHuevtCFY',            // Alias for drafted
  'declined': 'UPr2Fm5WY3',         // Declined documents
  'expired': 'zNqBHXHsYH',          // Expired documents
  'all': 'ByHuevtCFY'               // Default - shows all documents (draft is most comprehensive)
} as const

/**
 * Get the appropriate reportId for a given document status
 */
export function getReportIdForStatus(status: DocumentStatus | 'all' | 'inbox'): string {
  // Handle special cases
  if (status === 'inbox' || status === 'all') {
    return STATUS_REPORT_IDS.all
  }

  // Handle partially_signed - treat as in-progress
  if (status === 'partially_signed') {
    return STATUS_REPORT_IDS['in-progress']
  }

  // Get reportId for the status, fallback to default
  return STATUS_REPORT_IDS[status as keyof typeof STATUS_REPORT_IDS] || STATUS_REPORT_IDS.all
}

/**
 * Get all available status options with their corresponding reportIds
 */
export function getAvailableStatuses() {
  return [
    { value: 'all', label: 'All Documents', reportId: STATUS_REPORT_IDS.all },
    { value: 'in-progress', label: 'In Progress', reportId: STATUS_REPORT_IDS['in-progress'] },
    { value: 'completed', label: 'Completed', reportId: STATUS_REPORT_IDS.completed },
    { value: 'drafted', label: 'Drafts', reportId: STATUS_REPORT_IDS.drafted },
    { value: 'declined', label: 'Declined', reportId: STATUS_REPORT_IDS.declined },
    { value: 'expired', label: 'Expired', reportId: STATUS_REPORT_IDS.expired },
  ] as const
}

/**
 * Get user's extended ID from auth storage (fallback for user-specific reports)
 */
export function getUserExtendedId(): string {
  if (typeof window === 'undefined') {
    return STATUS_REPORT_IDS.all // Default for SSR
  }

  try {
    const authData = localStorage.getItem('auth-storage')
    if (authData) {
      const parsed = JSON.parse(authData)
      return parsed.state?.user?.extendedId || STATUS_REPORT_IDS.all
    }
  } catch (error) {
    console.warn('Failed to get user extended ID:', error)
  }

  return STATUS_REPORT_IDS.all // Default fallback
}
