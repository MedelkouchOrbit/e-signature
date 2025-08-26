/**
 * Test component for adding signers to documents
 * This component demonstrates how to properly add signers to documents
 * using the new document-signers-api-service
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { documentSignersApiService } from "@/app/lib/document-signers-api-service"

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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
      
      const result = await documentSignersApiService.addSignerToDocument(documentId, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined
      })
      
      if (result.success) {
        toast({
          title: "Success!",
          description: `${formData.name} has been added as a signer. Contact ID: ${result.contactId}`,
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
        toast({
          title: "Error",
          description: result.error || "Failed to add signer",
          variant: "destructive"
        })
        
        console.error('❌ Failed to add signer:', result.error)
      }
      
    } catch (error) {
      console.error('❌ Error in test component:', error)
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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">🧪 Test Add Signer</CardTitle>
        <p className="text-sm text-gray-600">
          Document ID: <code className="text-xs bg-gray-100 px-1 rounded">{documentId}</code>
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter signer's full name"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter signer's email"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Enter phone number"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Adding Signer...' : 'Add Signer to Document'}
          </Button>
        </form>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700">
            <strong>What this does:</strong><br/>
            1. Creates a contact in contracts_Contactbook<br/>
            2. Links the contact to the document<br/>
            3. Updates document Signers and Placeholders arrays<br/>
            4. Sets proper ACL permissions
          </p>
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
