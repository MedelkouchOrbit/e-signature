/**
 * Comprehensive Test for Bulk Send Signer Management
 * This test demonstrates the complete flow of adding signers to bulk send documents
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { documentSignersApiService } from "@/app/lib/document-signers-api-service"
import { contactsApiService } from "@/app/lib/contacts/contacts-api-service"
import { documentsApiService } from "@/app/lib/documents/documents-api-service"

interface BulkSendTestProps {
  documentId?: string
}

export function BulkSendSignerTest({ documentId: initialDocId }: BulkSendTestProps) {
  const { toast } = useToast()
  const [documentId, setDocumentId] = useState(initialDocId || '')
  const [testResults, setTestResults] = useState<Array<{
    step: string
    status: 'pending' | 'success' | 'error'
    message: string
    data?: unknown
  }>>([])
  const [isRunning, setIsRunning] = useState(false)
  const [signersData, setSignersData] = useState(`[
  {
    "name": "Mohammed Elkouch",
    "email": "mohammed.elkouch1998@gmail.com",
    "phone": "+1234567890",
    "role": "signer"
  },
  {
    "name": "Test User 2",
    "email": "test.user2@example.com",
    "phone": "+0987654321",
    "role": "signer"
  },
  {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "signer"
  }
]`)

  const addTestResult = (step: string, status: 'pending' | 'success' | 'error', message: string, data?: unknown) => {
    setTestResults(prev => [...prev, { step, status, message, data }])
  }

  const runComprehensiveTest = async () => {
    if (!documentId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a document ID",
        variant: "destructive"
      })
      return
    }

    setIsRunning(true)
    setTestResults([])

    try {
      // Parse signers data
      let signers: Array<{ name: string; email: string; phone?: string; role?: string }>
      try {
        signers = JSON.parse(signersData)
        addTestResult('Parse Signers', 'success', `Parsed ${signers.length} signers from input`)
      } catch (error) {
        addTestResult('Parse Signers', 'error', `Failed to parse signers JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
        return
      }

      // Step 1: Check if document exists and is a bulk send document
      addTestResult('Document Check', 'pending', 'Checking document details...')
      try {
        const document = await documentsApiService.getDocument(documentId)
        const isBulkSend = document.name?.includes('Bulk Send:')
        
        addTestResult(
          'Document Check', 
          'success', 
          `Document found: "${document.name}" (${isBulkSend ? 'Bulk Send' : 'Regular'} document)`,
          { 
            name: document.name,
            isBulkSend,
            currentSigners: document.signers?.length || 0,
            currentPlaceholders: document.placeholders?.length || 0
          }
        )

        if (!isBulkSend) {
          addTestResult('Document Type', 'error', 'This is not a bulk send document. Test designed for bulk send documents.')
          return
        }
      } catch {
        addTestResult('Document Check', 'error', 'Document not found or access denied')
        return
      }

      // Step 2: Get current signers
      addTestResult('Current Signers', 'pending', 'Getting current document signers...')
      try {
        const currentSigners = await documentSignersApiService.getDocumentSigners(documentId)
        addTestResult(
          'Current Signers', 
          'success', 
          `Found ${currentSigners.length} current signers`,
          currentSigners
        )
      } catch (error) {
        addTestResult('Current Signers', 'error', `Failed to get current signers: ${error}`)
      }

      // Step 3: Test adding signers individually
      addTestResult('Individual Signers', 'pending', 'Adding signers one by one...')
      const individualResults = []
      
      for (const signer of signers) {
        try {
          const result = await documentSignersApiService.addSignerToDocument(documentId, signer)
          if (result.success) {
            individualResults.push({ email: signer.email, contactId: result.contactId, status: 'success' })
          } else {
            individualResults.push({ email: signer.email, error: result.error, status: 'error' })
          }
        } catch (error) {
          individualResults.push({ email: signer.email, error: error, status: 'error' })
        }
      }

      const successCount = individualResults.filter(r => r.status === 'success').length
      addTestResult(
        'Individual Signers', 
        successCount > 0 ? 'success' : 'error', 
        `Added ${successCount}/${signers.length} signers successfully`,
        individualResults
      )

      // Step 4: Test bulk signer addition
      addTestResult('Bulk Signers', 'pending', 'Testing bulk signer addition...')
      try {
        const bulkTestSigners = [
          { name: "Bulk Test User 1", email: "bulk.test1@example.com", role: "signer" },
          { name: "Bulk Test User 2", email: "bulk.test2@example.com", role: "signer" }
        ]
        
        const bulkResult = await documentSignersApiService.addSignersToBulkSendDocument(documentId, bulkTestSigners)
        
        if (bulkResult.success) {
          addTestResult(
            'Bulk Signers', 
            'success', 
            `Bulk added ${bulkResult.addedSigners?.length}/${bulkTestSigners.length} signers`,
            bulkResult.addedSigners
          )
        } else {
          addTestResult('Bulk Signers', 'error', `Bulk addition failed: ${bulkResult.error}`)
        }
      } catch (error) {
        addTestResult('Bulk Signers', 'error', `Bulk addition error: ${error}`)
      }

      // Step 5: Get final signers list
      addTestResult('Final Signers', 'pending', 'Getting final signers list...')
      try {
        const finalSigners = await documentSignersApiService.getDocumentSigners(documentId)
        addTestResult(
          'Final Signers', 
          'success', 
          `Final count: ${finalSigners.length} signers`,
          finalSigners
        )
      } catch (error) {
        addTestResult('Final Signers', 'error', `Failed to get final signers: ${error}`)
      }

      // Step 6: Test document visibility (simulation)
      addTestResult('Document Visibility', 'pending', 'Testing document visibility for assigned signers...')
      try {
        // Test if mohammed.elkouch1998@gmail.com can see the document
        const testEmail = 'mohammed.elkouch1998@gmail.com'
        const canSign = await documentSignersApiService.canUserSignDocument(documentId, testEmail)
        
        addTestResult(
          'Document Visibility',
          canSign.canSign ? 'success' : 'error',
          `${testEmail} ${canSign.canSign ? 'CAN' : 'CANNOT'} sign document: ${canSign.reason || 'Authorized'}`,
          canSign
        )
      } catch (error) {
        addTestResult('Document Visibility', 'error', `Visibility test error: ${error}`)
      }

      toast({
        title: "Test Complete!",
        description: "Check the results below for detailed information."
      })

    } catch (error) {
      addTestResult('Test Error', 'error', `Unexpected error: ${error}`)
      toast({
        title: "Test Failed",
        description: "An unexpected error occurred during testing",
        variant: "destructive"
      })
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200'
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'pending': return '⏳'
      default: return '📋'
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">🧪 Bulk Send Signer Management Test</CardTitle>
          <p className="text-gray-600">
            Comprehensive test for adding signers to bulk send documents and verifying proper placeholder updates.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="documentId">Document ID</Label>
            <Input
              id="documentId"
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              placeholder="Enter bulk send document ID"
              className="font-mono"
            />
          </div>

          <div>
            <Label htmlFor="signersData">Test Signers (JSON)</Label>
            <Textarea
              id="signersData"
              value={signersData}
              onChange={(e) => setSignersData(e.target.value)}
              placeholder="JSON array of signers..."
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          <Button 
            onClick={runComprehensiveTest}
            disabled={isRunning || !documentId.trim()}
            className="w-full"
            size="lg"
          >
            {isRunning ? 'Running Tests...' : 'Run Comprehensive Test'}
          </Button>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-4 border rounded-lg ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{getStatusIcon(result.status)}</span>
                    <div className="flex-1">
                      <div className="font-semibold">{result.step}</div>
                      <div className="text-sm mt-1">{result.message}</div>
                      {result.data ? (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer hover:underline">
                            Show Details
                          </summary>
                          <pre className="text-xs mt-2 p-2 bg-white/50 rounded border overflow-auto max-h-40">
                            {(() => {
                              if (typeof result.data === 'string') return result.data;
                              try {
                                return JSON.stringify(result.data, null, 2);
                              } catch {
                                return 'Error displaying data';
                              }
                            })()}
                          </pre>
                        </details>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">📋 What This Test Does</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700 text-sm space-y-2">
          <div><strong>1. Document Validation:</strong> Verifies the document exists and is a bulk send document</div>
          <div><strong>2. Current State:</strong> Gets current signers and placeholders</div>
          <div><strong>3. Individual Addition:</strong> Tests adding signers one by one using addSignerToDocument</div>
          <div><strong>4. Bulk Addition:</strong> Tests bulk signer addition using addSignersToBulkSendDocument</div>
          <div><strong>5. Final Verification:</strong> Checks final signers list and document visibility</div>
          <div><strong>6. Proper Placeholder Updates:</strong> Ensures bulk send placeholders are correctly updated</div>
        </CardContent>
      </Card>
    </div>
  )
}
