'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Download, 
  FileText, 
  CheckCircle, 
  Clock, 
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { 
  signingApiService, 
  type DocumentDetails, 
  type ContactDetails, 
  type TenantDetails, 
  type SubscriptionDetails,
  type WebhookEventData
} from "@/app/lib/signing-api-service"
import { SignatureDrawer } from "@/app/components/signing/SignatureDrawer"
// import { PDFViewer } from "@/app/components/signing/PDFViewer"

// Local types for UI components
interface Document {
  objectId: string
  name: string
  description?: string
  note?: string
  file: string
  signers: Signer[]
  placeholders: Placeholder[]
  createdAt: string
  status?: string
}

interface Signer {
  name: string
  email: string
  phone?: string
  objectId?: string
}

interface Contact {
  objectId: string
  name: string
  email: string
  phone?: string
}

interface Tenant {
  name: string
  logo?: string
}

interface Placeholder {
  id: string
  x: number
  y: number
  width: number
  height: number
  page: number
  type: 'signature' | 'initial' | 'date' | 'text'
  signerEmail: string
}

interface Subscription {
  plan?: string
  features?: string[]
}

export default function RecipientSignPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  
  const docId = params.docId as string
  const contactId = params.contactId as string
  
  // State
  const [document, setDocument] = useState<Document | null>(null)
  const [contact, setContact] = useState<Contact | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [tenant, setTenant] = useState<Tenant | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages] = useState(1) // Set to 1 for now, will be dynamic with real PDF viewer
  const [zoom, setZoom] = useState(100)
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false)
  const [selectedPlaceholder, setSelectedPlaceholder] = useState<Placeholder | null>(null)
  const [signedPlaceholders, setSignedPlaceholders] = useState<Set<string>>(new Set())

  // Load document data on component mount
  useEffect(() => {
    const loadDocumentData = async () => {
      if (!docId || !contactId) {
        setError('Missing document ID or contact ID')
        setIsLoading(false)
        return
      }

      console.log('📋 Loading document data for:', { docId, contactId })
      setIsLoading(true)
      setError(null)

      try {
        // Load all required data using public API methods (no authentication)
        console.log('🚀 Making API calls with public methods (no auth headers)...')
        
        const [documentResponse, contactResponse, tenantResponse, subscriptionResponse] = await Promise.all([
          signingApiService.getDocumentPublic(docId).then(res => {
            console.log('📄 getDocumentPublic response:', res)
            return res
          }),
          signingApiService.getContactPublic(contactId).then(res => {
            console.log('👤 getContactPublic response:', res)
            return res
          }),
          signingApiService.getTenantPublic(contactId).then(res => {
            console.log('🏢 getTenantPublic response:', res)
            return res
          }),
          signingApiService.getSubscriptionsPublic(contactId).then(res => {
            console.log('💳 getSubscriptionsPublic response:', res)
            return res
          })
        ])

        console.log('✅ All API calls completed')

        // Check for errors
        if (documentResponse.error) {
          throw new Error(`Failed to load document: ${documentResponse.error}`)
        }
        if (contactResponse.error) {
          throw new Error(`Failed to load contact: ${contactResponse.error}`)
        }

        // Transform and set document data
        if (documentResponse.result) {
          const transformedDoc = transformDocumentData(documentResponse.result)
          setDocument(transformedDoc)
          console.log('✅ Document loaded successfully:', transformedDoc.name)
        } else {
          // Fallback mock data for testing if API fails
          console.log('⚠️ No document data from API, using mock data')
          setDocument({
            objectId: docId,
            name: `Document ${docId}`,
            description: 'Sample document for signing',
            note: 'Please review and sign this document',
            file: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            signers: [
              {
                name: 'John Doe',
                email: 'john@example.com',
                phone: '+1234567890',
                objectId: contactId
              }
            ],
            placeholders: [
              {
                id: 'signature-1',
                x: 100,
                y: 200,
                width: 150,
                height: 50,
                page: 1,
                type: 'signature',
                signerEmail: 'john@example.com'
              }
            ],
            createdAt: new Date().toISOString(),
            status: 'sent'
          })
        }

        // Set contact data
        if (contactResponse.result) {
          setContact({
            objectId: contactResponse.result.objectId,
            name: contactResponse.result.Name,
            email: contactResponse.result.Email,
            phone: contactResponse.result.Phone,
          })
          console.log('✅ Contact loaded:', contactResponse.result.Name)
        } else {
          // Fallback mock contact data
          console.log('⚠️ No contact data from API, using mock data')
          setContact({
            objectId: contactId,
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1234567890',
          })
        }

        // Set tenant data (optional, might not always be available)
        if (tenantResponse.result && !tenantResponse.error) {
          setTenant({
            name: tenantResponse.result.Name,
            logo: tenantResponse.result.Domain, // Using domain as a placeholder for logo
          })
          console.log('✅ Tenant loaded:', tenantResponse.result.Name)
        }

        // Set subscription data (optional)
        if (subscriptionResponse.result && !subscriptionResponse.error) {
          setSubscription({
            plan: subscriptionResponse.result.plan,
            features: subscriptionResponse.result.features,
          })
          console.log('✅ Subscription loaded')
        }

      } catch (error) {
        console.error('❌ Error loading document data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load document')
        toast({
          title: "Error Loading Document",
          description: error instanceof Error ? error.message : 'Failed to load document',
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadDocumentData()
  }, [docId, contactId, toast])

  // Helper functions
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500'
    ]
    const index = name.length % colors.length
    return colors[index]
  }

  // Transform API responses to local types
  const transformDocumentData = (apiDoc: DocumentDetails): Document => ({
    objectId: apiDoc.objectId,
    name: apiDoc.Name,
    description: apiDoc.Description || '',
    note: apiDoc.Note || '',
    file: apiDoc.URL,
    signers: (apiDoc.Signers || []).map(s => ({
      name: s.Name,
      email: s.Email,
      phone: s.Phone,
      objectId: s.objectId
    })),
    placeholders: (apiDoc.Placeholders || []).map((p, index) => ({
      id: p.objectId || `placeholder-${index}`,
      x: p.pos[0]?.x || 0,
      y: p.pos[0]?.y || 0,
      width: p.pos[0]?.width || 100,
      height: p.pos[0]?.height || 50,
      page: p.page,
      type: p.type as 'signature' | 'initial' | 'date' | 'text',
      signerEmail: apiDoc.Signers?.[p.signerIndex]?.Email || ''
    })),
    createdAt: apiDoc.createdAt,
    status: apiDoc.status
  })

  const transformContactData = (apiContact: ContactDetails): Contact => ({
    objectId: apiContact.objectId,
    name: apiContact.Name,
    email: apiContact.Email,
    phone: apiContact.Phone
  })

  const transformTenantData = (apiTenant: TenantDetails): Tenant => ({
    name: apiTenant.Name,
    logo: undefined // Add logo field if available in API
  })

  const transformSubscriptionData = (apiSub: SubscriptionDetails): Subscription => ({
    plan: apiSub.plan,
    features: apiSub.features
  })

  // Load document data
  const loadDocumentData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Make parallel API calls
      const [documentRes, contactRes, tenantRes, subscriptionRes] = await Promise.allSettled([
        signingApiService.getDocument(docId),
        signingApiService.getContact(contactId),
        signingApiService.getTenant(contactId),
        signingApiService.getSubscriptions(contactId)
      ])

      // Handle document result
      if (documentRes.status === 'fulfilled' && documentRes.value.success && documentRes.value.result) {
        const transformedDoc = transformDocumentData(documentRes.value.result)
        setDocument(transformedDoc)
        
        // Get contact email for webhook
        let contactEmail = ''
        if (contactRes.status === 'fulfilled' && contactRes.value.success && contactRes.value.result) {
          contactEmail = contactRes.value.result.Email
          setContact(transformContactData(contactRes.value.result))
        }
        
        // Send viewed webhook
        const webhookData: WebhookEventData = {
          event: 'viewed',
          contactId,
          body: {
            type: 'request-sign',
            objectId: docId,
            file: transformedDoc.file,
            name: transformedDoc.name,
            note: transformedDoc.note,
            description: transformedDoc.description,
            signers: transformedDoc.signers.map(s => ({
              name: s.name,
              email: s.email,
              phone: s.phone
            })),
            viewedBy: contactEmail,
            viewedAt: new Date().toISOString(),
            createdAt: transformedDoc.createdAt
          }
        }
        
        await signingApiService.callWebhook(webhookData)
      } else {
        throw new Error('Failed to load document')
      }

      if (tenantRes.status === 'fulfilled' && tenantRes.value.success && tenantRes.value.result) {
        setTenant(transformTenantData(tenantRes.value.result))
      }

      if (subscriptionRes.status === 'fulfilled' && subscriptionRes.value.success && subscriptionRes.value.result) {
        setSubscription(transformSubscriptionData(subscriptionRes.value.result))
      }

    } catch (err) {
      console.error('Error loading document data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load document')
      toast({
        title: "Error",
        description: "Failed to load document. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [docId, contactId, toast])

  // Load data on mount
  useEffect(() => {
    loadDocumentData()
  }, [loadDocumentData])

  // Handle signature placement
  const handleSignaturePlacement = (placeholder: Placeholder) => {
    setSelectedPlaceholder(placeholder)
    setIsSignatureModalOpen(true)
  }

  // Handle signature completion
  const handleSignatureComplete = useCallback((signatureData: string, type: 'draw' | 'upload' | 'type') => {
    if (selectedPlaceholder) {
      // TODO: Process signature data and type
      console.log('Signature data:', signatureData, 'Type:', type)
      
      // Add to signed placeholders
      setSignedPlaceholders(prev => new Set([...prev, selectedPlaceholder.id]))
      
      // Close modal
      setIsSignatureModalOpen(false)
      setSelectedPlaceholder(null)
      
      toast({
        title: "Signature Added",
        description: "Your signature has been placed successfully.",
      })
    }
  }, [selectedPlaceholder, toast])

  // Handle decline
  const handleDecline = () => {
    // Show confirmation dialog
    if (confirm('Are you sure you want to decline signing this document?')) {
      router.push('/documents')
      toast({
        title: "Document Declined",
        description: "You have declined to sign this document.",
        variant: "destructive"
      })
    }
  }

  // Handle download
  const handleDownload = async () => {
    if (document) {
      try {
        // Create download link using window.document instead of document variable
        const link = window.document.createElement('a')
        link.href = document.file
        link.download = document.name
        window.document.body.appendChild(link)
        link.click()
        window.document.body.removeChild(link)
        
        toast({
          title: "Download Started",
          description: "Document download has started.",
        })
      } catch (error) {
        console.error('Download error:', error)
        toast({
          title: "Download Error",
          description: "Failed to download document.",
          variant: "destructive"
        })
      }
    }
  }

  // Handle finish signing
  const handleFinish = async () => {
    try {
      // Check if all required fields are signed
      const requiredPlaceholders = document?.placeholders?.filter((p: Placeholder) => 
        p.signerEmail === contact?.email
      ) || []
      
      const remainingFields = requiredPlaceholders.filter((p: Placeholder) => 
        !signedPlaceholders.has(p.id)
      ).length
      
      if (remainingFields > 0) {
        toast({
          title: "Incomplete Signing",
          description: `Please sign all required fields. ${remainingFields} field(s) remaining.`,
          variant: "destructive"
        })
        return
      }

      // Submit signatures (implement actual PDF signing logic here)
      toast({
        title: "Document Signed",
        description: "Document has been signed successfully!",
      })

      // Redirect back to documents
      setTimeout(() => {
        router.push('/documents')
      }, 2000)

    } catch (error) {
      console.error('Signing error:', error)
      toast({
        title: "Signing Error",
        description: "Failed to complete signing process.",
        variant: "destructive"
      })
    }
  }

  // Get remaining fields count
  const getRemainingFieldsCount = () => {
    if (!document || !contact) return 0
    
    const requiredPlaceholders = document.placeholders?.filter((p: Placeholder) => 
      p.signerEmail === contact.email
    ) || []
    
    return requiredPlaceholders.filter((p: Placeholder) => !signedPlaceholders.has(p.id)).length
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Document</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error || 'Document not found'}</p>
            <Button onClick={() => router.push('/documents')} className="w-full">
              Back to Documents
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const remainingFields = getRemainingFieldsCount()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Action Bar */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <FileText className="w-6 h-6 text-gray-400" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900 truncate max-w-md">
                  {document.name}
                </h1>
                <p className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDecline}
                className="text-gray-600 hover:text-gray-800"
              >
                Decline
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="text-gray-600 hover:text-gray-800"
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
              <Button
                size="sm"
                onClick={handleFinish}
                disabled={remainingFields > 0}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Finish
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 gap-4 grid grid-cols-1 lg:grid-cols-4">
        {/* Left Sidebar - Document Thumbnail */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pages</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "w-full aspect-[8.5/11] border-2 rounded-lg flex items-center justify-center text-xs font-medium transition-colors",
                        currentPage === page
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                      )}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - PDF Viewer */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.max(50, zoom - 25))}
                    disabled={zoom <= 50}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[60px] text-center">
                    {zoom}%
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.min(200, zoom + 25))}
                    disabled={zoom >= 200}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
                
                {remainingFields > 0 && (
                  <Badge variant="outline" className="text-orange-600 bg-orange-50">
                    {remainingFields} of {document.placeholders?.filter(p => p.signerEmail === contact?.email).length || 0} fields left
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* PDF Viewer Placeholder - Replace with actual PDFViewer component */}
              <div className="h-[600px] bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">PDF Viewer</p>
                  <p className="text-sm text-gray-500">Document: {document.name}</p>
                  <p className="text-sm text-gray-500">
                    {document.placeholders?.filter(p => p.signerEmail === contact?.email).length || 0} signature fields
                  </p>
                  {document.placeholders?.filter(p => p.signerEmail === contact?.email).map((placeholder, index) => (
                    <Button
                      key={placeholder.id}
                      size="sm"
                      onClick={() => handleSignaturePlacement(placeholder)}
                      className="mx-1 mt-2"
                      variant={signedPlaceholders.has(placeholder.id) ? "default" : "outline"}
                    >
                      {signedPlaceholders.has(placeholder.id) ? (
                        <CheckCircle className="w-4 h-4 mr-1" />
                      ) : (
                        <Clock className="w-4 h-4 mr-1" />
                      )}
                      Sign Field {index + 1}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Signers */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Signed by</CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-4">
              {/* Current User Status */}
              {contact && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={cn("text-white", getAvatarColor(contact.name))}>
                      {getInitials(contact.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {contact.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {contact.email}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {remainingFields === 0 ? (
                        <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Signed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-blue-600 bg-blue-50">
                          <Clock className="w-3 h-3 mr-1" />
                          Yet to sign
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Other Signers */}
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Other Signers
                </h4>
                <div className="space-y-2">
                  {document.signers
                    ?.filter(signer => signer.email !== contact?.email)
                    .map((signer, index) => (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-3 p-2 rounded-lg border hover:bg-gray-50 transition-colors">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className={cn("text-white text-xs", getAvatarColor(signer.name))}>
                                {getInitials(signer.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {signer.name}
                              </p>
                              <Badge variant="outline" className="text-xs mt-1">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p className="font-medium">{signer.name}</p>
                          <p className="text-xs text-gray-400">{signer.email}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Signature Modal */}
      {isSignatureModalOpen && selectedPlaceholder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Add Your Signature</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSignatureModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4">
              <SignatureDrawer
                isOpen={isSignatureModalOpen}
                onClose={() => setIsSignatureModalOpen(false)}
                onSave={handleSignatureComplete}
                fieldName={`signature-${selectedPlaceholder?.id}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}