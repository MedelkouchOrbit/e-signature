/**
 * Simple Bulk Send Signer Test
 * Direct test for adding signers to bulk send documents
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { bulkSendSignerService } from "@/app/lib/bulk-send-signer-service"

interface SimpleBulkSendTestProps {
  documentId?: string
}

export function SimpleBulkSendTest({ documentId: initialDocId }: SimpleBulkSendTestProps) {
  const { toast } = useToast()
  const [documentId, setDocumentId] = useState(initialDocId || '')
  const [signerName, setSignerName] = useState('Mohammed Elkouch')
  const [signerEmail, setSignerEmail] = useState('mohammed.elkouch1998@gmail.com')
  const [signerPhone, setSignerPhone] = useState('+1234567890')
  const [isLoading, setIsLoading] = useState(false)
  const [lastResult, setLastResult] = useState<unknown>(null)

  const checkDocument = async () => {
    if (!documentId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a document ID",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await bulkSendSignerService.getBulkSendDocumentInfo(documentId)
      setLastResult(result)
      
      if (result.success) {
        toast({
          title: "Document Info",
          description: `${result.name} - ${result.isBulkSend ? 'Bulk Send' : 'Regular'} document`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to get document info",
          variant: "destructive"
        })
      }
    } catch {
      toast({
        title: "Error", 
        description: "Failed to check document",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addSigner = async () => {
    if (!documentId.trim() || !signerName.trim() || !signerEmail.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      console.log('🧪 Testing signer addition:', { documentId, signerName, signerEmail, signerPhone })
      
      const result = await bulkSendSignerService.addSignerToBulkSendDocument(documentId, {
        name: signerName,
        email: signerEmail,
        phone: signerPhone || undefined
      })
      
      setLastResult(result)
      
      if (result.success) {
        toast({
          title: "Success!",
          description: `Signer ${signerName} added successfully! Contact ID: ${result.contactId}`,
        })
        
        console.log('✅ Signer added successfully:', result)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add signer",
          variant: "destructive"
        })
        
        console.error('❌ Failed to add signer:', result)
      }
      
    } catch (error) {
      console.error('❌ Error adding signer:', error)
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
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">🎯 Simple Bulk Send Signer Test</CardTitle>
          <p className="text-sm text-gray-600">
            Direct test for adding signers to bulk send document placeholders
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="documentId">Bulk Send Document ID *</Label>
            <Input
              id="documentId"
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              placeholder="Enter document ID from bulk send"
              className="font-mono"
            />
            <Button 
              onClick={checkDocument}
              disabled={isLoading || !documentId.trim()}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Check Document
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="signerName">Signer Name *</Label>
              <Input
                id="signerName"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Enter signer name"
              />
            </div>
            
            <div>
              <Label htmlFor="signerEmail">Signer Email *</Label>
              <Input
                id="signerEmail"
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder="Enter signer email"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="signerPhone">Phone (Optional)</Label>
            <Input
              id="signerPhone"
              value={signerPhone}
              onChange={(e) => setSignerPhone(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          <Button 
            onClick={addSigner}
            disabled={isLoading || !documentId.trim() || !signerName.trim() || !signerEmail.trim()}
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Adding Signer...' : 'Add Signer to Placeholders'}
          </Button>
        </CardContent>
      </Card>

      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📊 Last Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-50 p-3 rounded border overflow-auto">
              {typeof lastResult === 'string' ? lastResult : JSON.stringify(lastResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">✅ What This Does</CardTitle>
        </CardHeader>
        <CardContent className="text-green-700 text-sm space-y-2">
          <div><strong>1. Creates Contact:</strong> Uses savecontact function to create contracts_Contactbook entry</div>
          <div><strong>2. Updates Placeholders:</strong> Sets signerObjId and signerPtr in the Placeholders array</div>
          <div><strong>3. Updates Signers:</strong> Adds contact pointer to Signers array</div>
          <div><strong>4. Document Visibility:</strong> User should now see document in their filtered list</div>
          <div><strong>5. Follows Backend Pattern:</strong> Mimics exactly what linkContactToDoc does</div>
        </CardContent>
      </Card>
    </div>
  )
}
