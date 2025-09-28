'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Download, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  Clock,
  User,
  FileText,
  Pen
} from 'lucide-react'
import { cn } from "@/lib/utils"
import { signingApiService, type DocumentDetails, type ContactDetails, type TenantDetails } from '@/app/lib/signing-api-service'
import { SignatureModal, type SignatureData } from '@/app/components/signature/SignatureModal'
import { useToast } from "@/hooks/use-toast"
import Image from 'next/image'
import dynamic from 'next/dynamic'

// Dynamic imports for PDF components to avoid SSR issues
const Document = dynamic(() => import('react-pdf').then(mod => ({ default: mod.Document })), { ssr: false })
const Page = dynamic(() => import('react-pdf').then(mod => ({ default: mod.Page })), { ssr: false })

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  import('react-pdf').then(({ pdfjs }) => {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
  })
}

interface RecipientSignPageProps {
  docId: string
  contactId: string
}

interface SignerInfo {
  name: string
  email: string
  phone?: string
  status: 'signed' | 'pending' | 'current'
  signedAt?: string
}

interface SignatureField {
  id: string
  x: number
  y: number
  width: number
  height: number
  page: number
  type: 'signature' | 'initial' | 'date' | 'text'
  required: boolean
  signed: boolean
  value?: string
}

export function RecipientSignPage({ docId, contactId }: RecipientSignPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  // States
  const [isLoading, setIsLoading] = useState(true)
  const [document, setDocument] = useState<DocumentDetails | null>(null)
  const [contact, setContact] = useState<ContactDetails | null>(null)
  const [tenant, setTenant] = useState<TenantDetails | null>(null)
  const [signers, setSigners] = useState<SignerInfo[]>([])
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  
  // Signature modal state
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false)
  const [currentSignatureField, setCurrentSignatureField] = useState<SignatureField | null>(null)
  const [signatures, setSignatures] = useState<Record<string, SignatureData>>({})
  
  // Remaining fields count
  const remainingFields = signatureFields.filter(field => !field.signed).length

  // Load initial data
  const loadSigningData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      console.log('🔄 Loading signing data...')
      
      // Load document, contact, and tenant data in parallel
      const [docResponse, contactResponse, tenantResponse] = await Promise.all([
        signingApiService.getDocument(docId),
        signingApiService.getContact(contactId),
        signingApiService.getTenant(contactId)
      ])

      if (!docResponse.success || !docResponse.result) {
        throw new Error('Failed to load document')
      }
      
      if (!contactResponse.success || !contactResponse.result) {
        throw new Error('Failed to load contact')
      }

      const documentData = docResponse.result
      const contactData = contactResponse.result
      const tenantData = tenantResponse.result

      setDocument(documentData)
      setContact(contactData)
      setTenant(tenantData || null)
      setPdfUrl(documentData.URL)

      // Parse signers from document
      if (documentData.Signers) {
        const signerList: SignerInfo[] = documentData.Signers.map((signer) => ({
          name: signer.Name,
          email: signer.Email,
          phone: signer.Phone,
          status: signer.Email === contactData.Email ? 'current' : 'pending'
        }))
        setSigners(signerList)
      }

      // Parse signature fields from placeholders
      if (documentData.Placeholders) {
        const fields: SignatureField[] = documentData.Placeholders.flatMap((placeholder, index) => 
          placeholder.pos?.map((position, posIndex) => ({
            id: `${index}-${posIndex}`,
            x: position.x,
            y: position.y,
            width: position.width,
            height: position.height,
            page: placeholder.page || 1,
            type: placeholder.type as 'signature' | 'initial' | 'date' | 'text',
            required: placeholder.required || true,
            signed: false
          })) || []
        )
        setSignatureFields(fields)
      }

      console.log('✅ Signing data loaded successfully')
    } catch (error) {
      console.error('❌ Error loading signing data:', error)
      toast({
        title: "Loading Error",
        description: "Failed to load document data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [docId, contactId, toast])

  useEffect(() => {
    loadSigningData()
  }, [loadSigningData])

  // Send viewed webhook when page loads
  const sendViewedWebhook = React.useCallback(async () => {
    if (!document || !contact) return
    
    try {
      await signingApiService.callWebhook({
        event: 'viewed',
        contactId,
        body: {
          type: 'request-sign',
          objectId: docId,
          file: document.URL,
          name: document.Name,
          note: document.Note || 'Please review and sign this document',
          description: document.Description || '',
          signers: signers.map(s => ({
            name: s.name,
            email: s.email,
            phone: s.phone
          })),
          viewedBy: contact.Email,
          viewedAt: new Date().toISOString(),
          createdAt: document.createdAt
        }
      })
      console.log('📊 Viewed webhook sent successfully')
    } catch (error) {
      console.error('❌ Error sending viewed webhook:', error)
    }
  }, [document, contact, contactId, docId, signers])

  useEffect(() => {
    sendViewedWebhook()
  }, [sendViewedWebhook])

  const handleSignatureFieldClick = (field: SignatureField) => {
    if (field.signed) return
    
    setCurrentSignatureField(field)
    setIsSignatureModalOpen(true)
  }

  const handleSaveSignature = (signatureData: SignatureData) => {
    if (!currentSignatureField) return

    // Save signature to state
    setSignatures(prev => ({
      ...prev,
      [currentSignatureField.id]: signatureData
    }))

    // Mark field as signed
    setSignatureFields(prev => 
      prev.map(field => 
        field.id === currentSignatureField.id 
          ? { ...field, signed: true, value: signatureData.dataUrl }
          : field
      )
    )

    setIsSignatureModalOpen(false)
    setCurrentSignatureField(null)

    toast({
      title: "Signature Added",
      description: "Your signature has been placed successfully"
    })
  }

  const handleFinishSigning = async () => {
    const unsignedFields = signatureFields.filter(field => field.required && !field.signed)
    
    if (unsignedFields.length > 0) {
      toast({
        title: "Missing Signatures",
        description: `Please complete ${unsignedFields.length} required signature field(s)`,
        variant: "destructive"
      })
      return
    }

    try {
      console.log('🖊️ Completing signature process...')
      
      // Submit all signatures
      for (const field of signatureFields) {
        if (field.signed && signatures[field.id]) {
          await signingApiService.signDocument(docId, contactId, {
            placeholderIndex: parseInt(field.id.split('-')[0]),
            signature: signatures[field.id].dataUrl,
            coordinates: {
              x: field.x,
              y: field.y,
              width: field.width,
              height: field.height
            },
            pageNumber: field.page
          })
        }
      }

      // Complete the signature process
      await signingApiService.completeSignature(docId, contactId)

      // Send signed webhook
      await signingApiService.callWebhook({
        event: 'signed',
        contactId,
        body: {
          type: 'request-sign',
          objectId: docId,
          file: document?.URL || '',
          name: document?.Name || '',
          note: document?.Note || '',
          description: document?.Description || '',
          signers: signers.map(s => ({
            name: s.name,
            email: s.email,
            phone: s.phone
          })),
          signedBy: contact?.Email || '',
          signedAt: new Date().toISOString(),
          createdAt: document?.createdAt || ''
        }
      })

      toast({
        title: "Document Signed",
        description: "Your signature has been submitted successfully"
      })

      // Redirect to success page or back to documents
      router.push('/documents?status=signed')
    } catch (error) {
      console.error('❌ Error completing signature:', error)
      toast({
        title: "Signing Error",
        description: "Failed to complete the signing process",
        variant: "destructive"
      })
    }
  }

  const handleDecline = async () => {
    if (!confirm('Are you sure you want to decline this document?')) {
      return
    }

    try {
      await signingApiService.declineDocument(docId, contactId, 'Declined by user')
      
      toast({
        title: "Document Declined",
        description: "You have declined to sign this document"
      })

      router.push('/documents?status=declined')
    } catch (error) {
      console.error('❌ Error declining document:', error)
      toast({
        title: "Error",
        description: "Failed to decline document",
        variant: "destructive"
      })
    }
  }

  const handleDownload = async () => {
    if (!document?.URL) return
    
    try {
      const link = window.document.createElement('a')
      link.href = document.URL
      link.download = document.Name || 'document.pdf'
      link.click()
    } catch (error) {
      console.error('❌ Error downloading document:', error)
      toast({
        title: "Download Error",
        description: "Failed to download document",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Loading Document</h2>
          <p className="text-gray-600">Please wait while we prepare your document for signing...</p>
        </div>
      </div>
    )
  }

  if (!document || !contact) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Document Not Found</h2>
          <p className="text-gray-600 mb-4">The document you&apos;re looking for could not be loaded.</p>
          <Button onClick={() => router.push('/documents')}>
            Go Back to Documents
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{document.Name}</h1>
              <p className="text-sm text-gray-600">
                {remainingFields > 0 ? `${remainingFields} field${remainingFields > 1 ? 's' : ''} left` : 'Ready to finish'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleDecline}
              className="text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              Decline
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
              className="text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={handleFinishSigning}
              disabled={remainingFields > 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Finish
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex h-[calc(100vh-80px)]">
        {/* Left Sidebar - Document Thumbnail */}
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Pages</h3>
            <div className="space-y-2">
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    "w-full p-2 text-left text-sm rounded border",
                    currentPage === pageNum
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:bg-gray-50"
                  )}
                >
                  Page {pageNum}
                  {signatureFields.filter(f => f.page === pageNum && !f.signed).length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Action Required
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content - PDF Viewer */}
        <div className="flex-1 bg-gray-100 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* PDF Controls */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {numPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                  disabled={currentPage >= numPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600 min-w-16 text-center">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScale(Math.min(2, scale + 0.1))}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 overflow-auto p-4">
              <div className="flex justify-center">
                <div className="relative bg-white shadow-lg">
                  {pdfUrl && (
                    <Document
                      file={pdfUrl}
                      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                      loading={<div className="p-8 text-center">Loading PDF...</div>}
                      error={<div className="p-8 text-center text-red-600">Error loading PDF</div>}
                    >
                      <div className="relative">
                        <Page
                          pageNumber={currentPage}
                          scale={scale}
                          loading={<div className="p-8 text-center">Loading page...</div>}
                        />
                        
                        {/* Signature Fields Overlay */}
                        {signatureFields
                          .filter(field => field.page === currentPage)
                          .map((field) => (
                            <div
                              key={field.id}
                              className={cn(
                                "absolute border-2 border-dashed cursor-pointer transition-all",
                                field.signed
                                  ? "border-green-500 bg-green-50"
                                  : "border-blue-500 bg-blue-50 hover:bg-blue-100"
                              )}
                              style={{
                                left: field.x * scale,
                                top: field.y * scale,
                                width: field.width * scale,
                                height: field.height * scale,
                              }}
                              onClick={() => handleSignatureFieldClick(field)}
                            >
                              {field.signed ? (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Image
                                    src={field.value || ''}
                                    alt="Signature"
                                    width={field.width * scale}
                                    height={field.height * scale}
                                    className="max-w-full max-h-full object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-blue-600">
                                  <Pen className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </Document>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Signers */}
        <div className="w-80 bg-white border-l border-gray-200 p-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Signed by</h3>
              <div className="space-y-3">
                {signers.filter(s => s.status === 'signed').map((signer, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{signer.name}</p>
                      <p className="text-xs text-gray-500">{signer.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Yet to sign</h3>
              <div className="space-y-3">
                {signers.filter(s => s.status !== 'signed').map((signer, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      signer.status === 'current' 
                        ? "bg-blue-100" 
                        : "bg-gray-100"
                    )}>
                      {signer.status === 'current' ? (
                        <User className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{signer.name}</p>
                      <p className="text-xs text-gray-500">{signer.email}</p>
                      {signer.status === 'current' && (
                        <Badge variant="outline" className="text-xs mt-1">
                          Your turn
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => {
          setIsSignatureModalOpen(false)
          setCurrentSignatureField(null)
        }}
        onSave={handleSaveSignature}
        title={`Sign Field: ${currentSignatureField?.type || 'signature'}`}
      />
    </div>
  )
}