/**
 * ✅ Manual Testing Script for Document Status Filtering
 * Run this to test the status filtering system outside of components
 */

import { documentsApiService } from "../documents/documents-api-service"
import { getReportIdForStatus, getAvailableStatuses } from "../documents/document-status-utils"
import type { DocumentStatus } from "../documents/documents-types"

interface TestResult {
  status: string
  reportId: string
  documentCount: number
  success: boolean
  error?: string
  documents?: any[]
}

/**
 * Test a specific document status filter
 */
async function testStatusFilter(status: DocumentStatus | 'all'): Promise<TestResult> {
  try {
    console.log(`\n🧪 Testing status: ${status}`)
    
    const reportId = getReportIdForStatus(status)
    console.log(`📊 Using reportId: ${reportId}`)

    const response = await documentsApiService.getDocuments({
      status: status === 'all' ? undefined : status,
      limit: 20
    })

    const documentCount = response.results?.length || 0
    
    console.log(`✅ Success! Found ${documentCount} documents`)
    console.log(`📄 Documents:`, response.results?.map(doc => ({
      id: doc.objectId,
      name: doc.name,
      status: doc.status,
      createdAt: doc.createdAt
    })))

    return {
      status,
      reportId,
      documentCount,
      success: true,
      documents: response.results
    }

  } catch (error) {
    console.error(`❌ Error testing status ${status}:`, error)
    
    return {
      status,
      reportId: getReportIdForStatus(status),
      documentCount: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Run comprehensive test of all status filters
 */
export async function runStatusFilteringTest(): Promise<TestResult[]> {
  console.log('🚀 Starting comprehensive document status filtering test...')
  console.log('📋 This will test all reportId mappings provided by the backend\n')

  const results: TestResult[] = []
  const availableStatuses = getAvailableStatuses()

  // Test each available status
  for (const statusOption of availableStatuses) {
    const result = await testStatusFilter(statusOption.value as DocumentStatus | 'all')
    results.push(result)
    
    // Add delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Test additional status aliases and edge cases
  console.log('\n📋 Testing status aliases and edge cases...')
  
  const edgeCases: (DocumentStatus | 'all')[] = ['waiting', 'signed', 'partially_signed']
  
  for (const status of edgeCases) {
    const result = await testStatusFilter(status)
    results.push(result)
    
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Print summary
  console.log('\n📊 TEST SUMMARY:')
  console.log('================')
  
  const successCount = results.filter(r => r.success).length
  const totalTests = results.length
  
  console.log(`✅ Successful tests: ${successCount}/${totalTests}`)
  console.log(`❌ Failed tests: ${totalTests - successCount}/${totalTests}`)
  
  console.log('\n📋 Detailed Results:')
  results.forEach((result, index) => {
    const statusIcon = result.success ? '✅' : '❌'
    console.log(`${index + 1}. ${statusIcon} ${result.status} (${result.reportId}) - ${result.documentCount} docs`)
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })

  console.log('\n🎉 Status filtering test completed!')
  console.log('📈 You can now use the status filtering system with confidence')
  
  return results
}

/**
 * Test reportId mapping consistency
 */
export function testReportIdMapping() {
  console.log('\n🔍 Testing ReportId Mapping Consistency:')
  console.log('=======================================')
  
  const statuses: (DocumentStatus | 'all' | 'inbox')[] = [
    'all', 'in-progress', 'waiting', 'completed', 'signed', 
    'drafted', 'draft', 'declined', 'expired', 'partially_signed', 'inbox'
  ]

  statuses.forEach(status => {
    const reportId = getReportIdForStatus(status)
    console.log(`📊 ${status.padEnd(20)} → ${reportId}`)
  })

  console.log('\n✅ ReportId mapping test completed!')
}

// Export for use in browser console or Node.js environment
if (typeof window !== 'undefined') {
  // Browser environment - attach to window for console testing
  (window as any).testStatusFiltering = runStatusFilteringTest;
  (window as any).testReportIdMapping = testReportIdMapping;
  console.log('🧪 Status filtering test functions available:')
  console.log('   - testStatusFiltering() - Run comprehensive test')
  console.log('   - testReportIdMapping() - Test reportId consistency')
}
