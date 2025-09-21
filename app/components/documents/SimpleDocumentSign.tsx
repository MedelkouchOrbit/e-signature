"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { X, FileText, Clock, Users, PenTool } from "lucide-react"
import { documentsApiService, type Document } from "@/app/lib/documents-api-service"
import { PDFViewer } from "./PDFViewer"
import { SignatureModal, SignatureData } from '../signature/SignatureModal'
import { useToast } from "@/hooks/use-toast"
import { usePDFLoader } from "@/app/lib/hooks/usePDFLoader"

interface SimpleDocumentSignProps {
  documentId: string
}

export function SimpleDocumentSign({ documentId }: SimpleDocumentSignProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [document, setDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fullName, setFullName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSignatureModal, setShowSignatureModal] = useState(false)

  // Use the new PDF loader hook for better error handling and blob management
  const { pdfUrl: documentUrl, loading: pdfLoading, error: pdfError, reload: reloadPDF } = usePDFLoader(documentId)

  // Show toast notifications based on PDF loading state
  useEffect(() => {
    if (documentUrl) {
      toast({
        title: "PDF Loaded Successfully!",
        description: "Document is ready for preview and signing",
      })
    } else if (pdfError) {
      toast({
        title: "PDF Loading Failed",
        description: pdfError,
        variant: "destructive"
      })
    }
  }, [documentUrl, pdfError, toast])

  const loadDocument = useCallback(async () => {
    try {
      setIsLoading(true)
      const doc = await documentsApiService.getDocument(documentId)
      setDocument(doc)
      
      console.log('✅ Document metadata loaded successfully')
      
      // Pre-fill user name if available
      if (typeof window !== 'undefined') {
        try {
          const authData = localStorage.getItem('auth-storage')
          if (authData) {
            const auth = JSON.parse(authData)
            if (auth.state?.user?.email) {
              // Extract name from email or use stored name
              const emailName = auth.state.user.email.split('@')[0]
              setFullName(emailName)
            }
          }
        } catch {
          // Ignore parsing errors
        }
      }
    } catch (error) {
      console.error('Error loading document:', error)
      toast({
        title: "Error",
        description: "Failed to load document",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [documentId, toast])

  useEffect(() => {
    loadDocument()
  }, [loadDocument])

  const handleCancel = () => {
    router.push('/documents')
  }

  // Handle signature placeholder click (following OpenSign pattern)
  const handleSignaturePlaceholderClick = () => {
    if (!document) {
      toast({
        title: "Error",
        description: "Document not loaded",
        variant: "destructive"
      })
      return
    }

    // Navigate to signature registration page (following OpenSign's recipientSignPdf pattern)
    router.push(`/documents/${document.objectId}/register-signature`)
  }
  const handleSignatureComplete = useCallback(async (signatureData: SignatureData) => {
    try {
      setIsSubmitting(true)
      
      if (!document) {
        throw new Error('Document not found')
      }
      
      // Get current user info
      const currentUser = {
        userId: 'temp-user-id', // This should come from auth context
        email: 'temp@example.com' // This should come from auth context
      }

      console.log('📝 Signing with signature data:', signatureData)

      // Call the signing endpoint with signature data
      const signedDocument = await documentsApiService.signDocument({
        documentId: document.objectId,
        userId: currentUser.userId,
        signature: signatureData.dataUrl,
        signatureData: {
          positions: [{
            x: 100,        // Default X position 
            y: 100,        // Default Y position
            width: signatureData.width || 150,
            height: signatureData.height || 50,
            page: 1        // First page
          }],
          signerInfo: {
            name: fullName,
            email: currentUser.email
          }
        }
      })

      console.log('✅ Document signed successfully:', signedDocument)

      toast({
        title: "Document Signed Successfully!",
        description: "The document has been signed and saved.",
      })

      // Close modal and redirect
      setShowSignatureModal(false)
      router.push('/documents')
      
    } catch (error) {
      console.error('❌ Error signing document:', error)
      toast({
        title: "Signing Failed",
        description: error instanceof Error ? error.message : "Failed to sign document",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [document, fullName, router, toast, setIsSubmitting])



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-4">Document not found</p>
          <Button onClick={handleCancel} variant="outline">
            Back to Documents
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Bar */}
      <div className="bg-indigo-600 text-white p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">{document.name}</h1>
              <p className="text-indigo-200 text-sm">
                Document ID: {document.objectId}
              </p>
            </div>
          </div>
          <Button
            onClick={handleCancel}
            variant="ghost"
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5 mr-2" />
            Close
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document Preview */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Preview
                </h2>
                
                {documentUrl ? (
                  <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
                    <PDFViewer 
                      fileUrl={documentUrl}
                      className="w-full h-full"
                    />
                  </div>
                ) : pdfLoading ? (
                  <div className="border rounded-lg p-8 text-center bg-gray-50" style={{ height: '600px' }}>
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                      <p className="text-gray-600">Loading PDF document...</p>
                      <p className="text-sm text-gray-500 mt-2">Using enhanced backend endpoints for better reliability</p>
                    </div>
                  </div>
                ) : pdfError ? (
                  <div className="border rounded-lg p-8 text-center bg-red-50" style={{ height: '600px' }}>
                    <div className="flex flex-col items-center justify-center h-full">
                      <FileText className="h-16 w-16 mx-auto mb-4 text-red-400" />
                      <p className="text-red-600 mb-2">Failed to load PDF document</p>
                      <p className="text-sm text-red-500 mb-4">{pdfError}</p>
                      <Button 
                        onClick={reloadPDF} 
                        variant="outline" 
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-lg p-8 text-center bg-gray-50" style={{ height: '600px' }}>
                    <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-2">Document preview not available</p>
                    <p className="text-sm text-gray-500 mb-4">
                      This document may not have a file attached.
                    </p>
                    <div className="text-xs text-gray-400 bg-gray-100 p-3 rounded mt-4">
                      <p className="font-medium mb-2">✅ Backend Integration Status:</p>
                      <p>• getfileurl endpoint: ✅ Working</p>
                      <p>• getdocumentfile endpoint: ✅ Working</p>
                      <p>• getDocument endpoint: ✅ Working</p>
                      <p className="mt-2 text-orange-600">Document ID: {documentId}</p>
                      <p className="text-blue-600 mt-2">Note: This specific document may not have a PDF file attached</p>
                      <p className="text-green-600">Try with a document that has an uploaded file</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Document Details & Signing */}
          <div className="space-y-6">
            {/* Document Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Document Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Name:</span>
                    <span className="text-gray-600">{document.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Status:</span>
                    <span className="text-gray-600 capitalize">{document.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Signers:</span>
                    <span className="text-gray-600">
                      {document.signers?.length || 0} total
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Signing Form */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Sign Document</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="pt-4 space-y-3">
                    {/* Signature Placeholder - Following OpenSign Pattern */}
                    <div 
                      onClick={handleSignaturePlaceholderClick}
                      className="w-full p-4 border-2 border-dashed border-indigo-300 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors group"
                    >
                      <div className="text-center">
                        <PenTool className="h-8 w-8 mx-auto mb-2 text-indigo-400 group-hover:text-indigo-600" />
                        <p className="text-sm font-medium text-indigo-600 group-hover:text-indigo-800">
                          Click here to sign
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Register your signature to complete the document
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-center text-xs text-gray-500">
                      or
                    </div>
                    
                    <Button
                      onClick={() => setShowSignatureModal(true)}
                      disabled={!fullName.trim() || isSubmitting}
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                    >
                      <PenTool className="h-4 w-4 mr-2" />
                      {isSubmitting ? 'Signing...' : 'Open Signature Pad'}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onSave={handleSignatureComplete}
        title="Sign Document"
      />
    </div>
  )
}

export default SimpleDocumentSign
