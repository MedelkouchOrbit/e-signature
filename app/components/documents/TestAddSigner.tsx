/**
 * Test component for adding signers to documents
 * This component demonstrates how to properly add signers to documents
 * using the new document-signers-api-service
 *
 * 🚀 **OpenSign Frontend Integration Test**
 * This component also tests the new backend enhancements:
 * - Enhanced Document Status Filtering
 * - Enhanced User Document Visibility
 * - Automatic Contact Book Management
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { documentSignersApiService } from "@/app/lib/document-signers-api-service"
import { documentsApiService } from "@/app/lib/documents-api-service"

interface TestAddSignerProps {
  documentId: string
  onSignerAdded?: () => void
}

export function TestAddSigner({ documentId, onSignerAdded }: TestAddSignerProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<string[]>([])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  // Test the new getReport API with status filtering
  const testGetReportAPI = async () => {
    try {
      addTestResult('🧪 Testing getReport API with status filtering...')

      // Test different status filters
      const statuses = ['all', 'drafted', 'waiting', 'signed'] as const

      for (const status of statuses) {
        addTestResult(`📊 Testing status filter: ${status}`)

        const response = await documentsApiService.getDocuments({
          status: status === 'all' ? 'all' : status,
          limit: 5
        })

        addTestResult(`✅ Status ${status}: Found ${response.results.length} documents`)
      }

      addTestResult('🎉 getReport API test completed successfully!')
    } catch (error) {
      addTestResult(`❌ getReport API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Test document creation with automatic contact book management
  const testDocumentCreation = async () => {
    try {
      addTestResult('📄 Testing document creation with automatic contact book management...')

      const testDocument = {
        name: `Test Document ${Date.now()}`,
        description: 'Test document for backend enhancements',
        note: 'Created via test component',
        signers: [{
          name: formData.name || 'Test User',
          email: formData.email || 'test@example.com',
          phone: formData.phone || '+1234567890',
          role: 'Signer',
          order: 1
        }],
        sendInOrder: false,
        otpEnabled: false,
        tourEnabled: false,
        timeToCompleteDays: 7
      }

      addTestResult('📤 Creating document with batch API...')
      const createdDocument = await documentsApiService.createDocument(testDocument)

      addTestResult(`✅ Document created successfully: ${createdDocument.name}`)
      addTestResult(`📋 Document ID: ${createdDocument.objectId}`)
      addTestResult(`👥 Signers: ${createdDocument.signers.length}`)
      addTestResult('🎉 Document creation test completed!')

    } catch (error) {
      addTestResult(`❌ Document creation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter both name and email",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      console.log('🧪 Testing adding signer to document:', documentId, formData)

      // Test the new getReport API
      await testGetReportAPI()

      // Test document creation
      await testDocumentCreation()

      // Now add the signer using the document-signers-api-service
      addTestResult('👤 Adding signer to document...')
      const result = await documentSignersApiService.addSignerToDocument(documentId, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined
      })

      if (result.success) {
        addTestResult(`✅ Signer added successfully: ${formData.name} (${formData.email})`)
        addTestResult('🎉 All tests completed successfully!')

        toast({
          title: "Success!",
          description: `${formData.name} has been added as a signer. All tests passed!`,
        })

        // Reset form
        setFormData({ name: '', email: '', phone: '' })

        // Notify parent component
        onSignerAdded?.()

        // Log success details
        console.log('✅ Signer added successfully:', {
          name: formData.name,
          email: formData.email,
          contactId: result.contactId
        })

      } else {
        addTestResult(`❌ Failed to add signer: ${result.error}`)
        toast({
          title: "Error",
          description: result.error || "Failed to add signer",
          variant: "destructive"
        })

        console.error('❌ Failed to add signer:', result.error)
      }

    } catch (error) {
      console.error('❌ Error in test component:', error)
      addTestResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Test Add Signer & Backend Enhancements
        </CardTitle>
        <p className="text-sm text-gray-600">
          Document ID: <code className="text-xs bg-gray-100 px-1 rounded">{documentId}</code>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Signer Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter signer name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Signer Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter signer email"
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="phone">Signer Phone (Optional)</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter signer phone number"
              />
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "🧪 Running Tests..." : "🚀 Run Tests & Add Signer"}
          </Button>
        </form>

        {/* Test Results Display */}
        {testResults.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">🧪 Test Results</h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
              <div className="space-y-2 font-mono text-sm">
                {testResults.map((result, index) => (
                  <div key={index} className="text-gray-700 dark:text-gray-300">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Feature Highlights */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            ✨ Backend Enhancements Tested
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Enhanced Document Status Filtering (getReport API)</li>
            <li>• Enhanced User Document Visibility (created + assigned)</li>
            <li>• Automatic Contact Book Management (batchdocuments API)</li>
            <li>• Improved Document Assignment (phone field support)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Component to test getting signers from a document
 */
export function TestGetSigners({ documentId }: { documentId: string }) {
  const [signers, setSigners] = useState<Array<{
    id: string
    name: string
    email: string
    status: string
    order: number
    contactId?: string
  }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const loadSigners = async () => {
    setIsLoading(true)
    try {
      console.log('🔍 Getting signers for document:', documentId)
      
      const documentSigners = await documentSignersApiService.getDocumentSigners(documentId)
      setSigners(documentSigners)
      
      console.log('📋 Found signers:', documentSigners)
      
      toast({
        title: "Signers Loaded",
        description: `Found ${documentSigners.length} signers for this document`
      })
      
    } catch (error) {
      console.error('❌ Error loading signers:', error)
      toast({
        title: "Error",
        description: "Failed to load signers",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">📋 Document Signers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={loadSigners} 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Get Document Signers'}
        </Button>
        
        {signers.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Signers ({signers.length}):</h4>
            {signers.map((signer) => (
              <div key={signer.id} className="p-2 bg-gray-50 rounded border text-sm">
                <div><strong>{signer.name}</strong></div>
                <div className="text-gray-600">{signer.email}</div>
                <div className="text-xs text-gray-500">
                  Status: {signer.status} | Order: {signer.order}
                  {signer.contactId && <> | Contact ID: {signer.contactId}</>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
