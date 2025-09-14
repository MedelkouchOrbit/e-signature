/**
 * ✅ React Query Status Filtering Integration Test
 * Test the useDocuments hook with different status filters
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDocuments, useDocumentsByStatus } from "@/app/lib/documents/use-documents"
import { getAvailableStatuses } from "@/app/lib/documents/document-status-utils"
import type { DocumentStatus } from "@/app/lib/documents/documents-types"

export function ReactQueryStatusTest() {
  const [selectedStatus, setSelectedStatus] = useState<DocumentStatus>('waiting')

  // Test the general useDocuments hook
  const { 
    data: allDocuments, 
    isLoading: allLoading, 
    error: allError,
    refetch: refetchAll
  } = useDocuments({ limit: 10 })

  // Test the status-specific hook
  const { 
    data: statusDocuments, 
    isLoading: statusLoading, 
    error: statusError,
    refetch: refetchStatus
  } = useDocumentsByStatus(selectedStatus)

  // Test the parameterized hook
  const { 
    data: paramDocuments, 
    isLoading: paramLoading, 
    error: paramError,
    refetch: refetchParam
  } = useDocuments({ 
    status: selectedStatus,
    limit: 20 
  })

  const availableStatuses = getAvailableStatuses()

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⚛️ React Query Status Integration Test
            <Badge variant="outline">useDocuments Hook</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Status Selector */}
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium">Test Status:</label>
            <Select 
              value={selectedStatus} 
              onValueChange={(value) => setSelectedStatus(value as DocumentStatus)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.filter(s => s.value !== 'all').map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* All Documents Test */}
          <Card className="bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>📄 useDocuments() - All Documents</span>
                <Button size="sm" onClick={() => refetchAll()} disabled={allLoading}>
                  {allLoading ? 'Loading...' : 'Refresh'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div>
                    {allLoading ? (
                      <Badge variant="secondary">Loading</Badge>
                    ) : allError ? (
                      <Badge variant="destructive">Error</Badge>
                    ) : (
                      <Badge variant="default">Success</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Documents:</span>
                  <div className="font-semibold">{allDocuments?.results?.length || 0}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <div className="font-semibold">{allDocuments?.count || 0}</div>
                </div>
              </div>
              {allError && (
                <div className="mt-2 text-red-600 text-sm">
                  Error: {allError.message}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status-Specific Hook Test */}
          <Card className="bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>🎯 useDocumentsByStatus({selectedStatus})</span>
                <Button size="sm" onClick={() => refetchStatus()} disabled={statusLoading}>
                  {statusLoading ? 'Loading...' : 'Refresh'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div>
                    {statusLoading ? (
                      <Badge variant="secondary">Loading</Badge>
                    ) : statusError ? (
                      <Badge variant="destructive">Error</Badge>
                    ) : (
                      <Badge variant="default">Success</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Documents:</span>
                  <div className="font-semibold">{statusDocuments?.results?.length || 0}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Filter:</span>
                  <div className="font-mono text-xs text-blue-600">{selectedStatus}</div>
                </div>
              </div>
              {statusError && (
                <div className="mt-2 text-red-600 text-sm">
                  Error: {statusError.message}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Parameterized Hook Test */}
          <Card className="bg-purple-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>⚙️ useDocuments({`{ status: '${selectedStatus}', limit: 20 }`})</span>
                <Button size="sm" onClick={() => refetchParam()} disabled={paramLoading}>
                  {paramLoading ? 'Loading...' : 'Refresh'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div>
                    {paramLoading ? (
                      <Badge variant="secondary">Loading</Badge>
                    ) : paramError ? (
                      <Badge variant="destructive">Error</Badge>
                    ) : (
                      <Badge variant="default">Success</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Documents:</span>
                  <div className="font-semibold">{paramDocuments?.results?.length || 0}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <div className="font-semibold">{paramDocuments?.count || 0}</div>
                </div>
              </div>
              {paramError && (
                <div className="mt-2 text-red-600 text-sm">
                  Error: {paramError.message}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document List Preview */}
          {(paramDocuments?.results && paramDocuments.results.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📋 Document Preview ({selectedStatus})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {paramDocuments.results.slice(0, 5).map((doc) => (
                    <div key={doc.objectId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium text-sm">{doc.name}</div>
                        <div className="text-xs text-muted-foreground">ID: {doc.objectId}</div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {doc.status}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {paramDocuments.results.length > 5 && (
                    <div className="text-center text-sm text-muted-foreground">
                      ... and {paramDocuments.results.length - 5} more documents
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🧪 Test Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button onClick={() => refetchAll()} variant="outline" size="sm">
                  Refresh All
                </Button>
                <Button onClick={() => refetchStatus()} variant="outline" size="sm">
                  Refresh Status
                </Button>
                <Button onClick={() => refetchParam()} variant="outline" size="sm">
                  Refresh Param
                </Button>
              </div>
            </CardContent>
          </Card>

        </CardContent>
      </Card>
    </div>
  )
}
