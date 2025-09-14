/**
 * ✅ Status Filtering System Test
 * Comprehensive test for the new reportId-based document status filtering
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useDocuments } from "@/app/lib/documents/use-documents"
import { getAvailableStatuses, getReportIdForStatus } from "@/app/lib/documents/document-status-utils"
import type { DocumentStatus } from "@/app/lib/documents/documents-types"

interface TestResult {
  status: string
  reportId: string
  documentCount: number
  success: boolean
  error?: string
  timestamp: string
}

export function StatusFilteringTest() {
  const { toast } = useToast()
  const [selectedStatus, setSelectedStatus] = useState<DocumentStatus | 'all'>('all')
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  // Use React Query to fetch documents with current status
  const { 
    data: documentsData, 
    isLoading, 
    error,
    refetch 
  } = useDocuments({ 
    status: selectedStatus === 'all' ? undefined : selectedStatus,
    limit: 50 // Get more documents for testing
  })

  const availableStatuses = getAvailableStatuses()

  const testSingleStatus = async (status: string) => {
    try {
      console.log(`🧪 Testing status filter: ${status}`)
      
      const reportId = getReportIdForStatus(status as DocumentStatus)
      console.log(`📊 Using reportId: ${reportId} for status: ${status}`)

      // Trigger refetch with the specific status
      const result = await refetch()
      
      const documentCount = result.data?.results?.length || 0
      
      const testResult: TestResult = {
        status,
        reportId,
        documentCount,
        success: true,
        timestamp: new Date().toLocaleTimeString()
      }

      setTestResults(prev => [...prev, testResult])
      
      console.log(`✅ Status ${status}: Found ${documentCount} documents with reportId ${reportId}`)
      
      return testResult

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ Error testing status ${status}:`, error)
      
      const testResult: TestResult = {
        status,
        reportId: getReportIdForStatus(status as DocumentStatus),
        documentCount: 0,
        success: false,
        error: errorMessage,
        timestamp: new Date().toLocaleTimeString()
      }

      setTestResults(prev => [...prev, testResult])
      return testResult
    }
  }

  const runComprehensiveTest = async () => {
    setIsRunning(true)
    setTestResults([])

    toast({
      title: "Starting Status Filter Test",
      description: "Testing all document status filters with reportId mapping...",
    })

    console.log('🚀 Starting comprehensive status filtering test')

    // Test all available statuses
    for (const statusOption of availableStatuses) {
      await testSingleStatus(statusOption.value)
      
      // Add small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Test some edge cases
    await testSingleStatus('partially_signed')
    await testSingleStatus('waiting')
    await testSingleStatus('signed')

    setIsRunning(false)

    toast({
      title: "Status Filter Test Complete",
      description: "Check the results below for detailed analysis",
    })

    console.log('🎉 Comprehensive status filtering test completed')
  }

  const getCurrentStatusInfo = () => {
    const reportId = getReportIdForStatus(selectedStatus)
    const documentCount = documentsData?.results?.length || 0
    
    return {
      status: selectedStatus,
      reportId,
      documentCount,
      isLoading,
      error: error?.message
    }
  }

  const currentInfo = getCurrentStatusInfo()

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 Document Status Filtering Test
            <Badge variant="outline">ReportId Mapping</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status Test */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Interactive Status Test</h3>
            
            <div className="flex gap-4 items-center">
              <Select 
                value={selectedStatus} 
                onValueChange={(value) => setSelectedStatus(value as DocumentStatus | 'all')}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {availableStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={() => refetch()} disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Test Filter'}
              </Button>
            </div>

            {/* Current Status Results */}
            <Card className="bg-gray-50">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <div className="font-mono">{currentInfo.status}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ReportId:</span>
                    <div className="font-mono text-blue-600">{currentInfo.reportId}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Documents:</span>
                    <div className="font-semibold">{currentInfo.documentCount}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <div>
                      {currentInfo.isLoading ? (
                        <Badge variant="secondary">Loading...</Badge>
                      ) : currentInfo.error ? (
                        <Badge variant="destructive">Error</Badge>
                      ) : (
                        <Badge variant="default">Success</Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {currentInfo.error && (
                  <div className="mt-2 text-red-600 text-sm">
                    Error: {currentInfo.error}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Comprehensive Test */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Comprehensive Test</h3>
              <Button 
                onClick={runComprehensiveTest} 
                disabled={isRunning}
                variant="outline"
              >
                {isRunning ? 'Running Tests...' : 'Run All Status Tests'}
              </Button>
            </div>
            
            {testResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Test Results:</h4>
                {testResults.map((result, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge variant={result.success ? "default" : "destructive"}>
                          {result.status}
                        </Badge>
                        <span className="text-sm font-mono text-blue-600">
                          {result.reportId}
                        </span>
                        <span className="text-sm">
                          {result.documentCount} documents
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <Badge variant="default">✓ Success</Badge>
                        ) : (
                          <Badge variant="destructive">✗ Failed</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {result.timestamp}
                        </span>
                      </div>
                    </div>
                    {result.error && (
                      <div className="mt-2 text-sm text-red-600">
                        {result.error}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* ReportId Reference */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">ReportId Reference</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableStatuses.map((status) => (
                <Card key={status.value} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{status.label}</div>
                      <div className="text-sm text-muted-foreground">{status.value}</div>
                    </div>
                    <div className="font-mono text-sm text-blue-600">
                      {status.reportId}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
