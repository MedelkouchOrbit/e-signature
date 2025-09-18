'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { 
  FileText, 
  ArrowLeft, 
  User, 
  Mail, 
  Phone,
  Building,
  Calendar,
  PenTool
} from 'lucide-react'
import { documentsApiService } from '@/app/lib/documents-api-service'
import { PDFViewerWrapper } from '@/app/components/documents/PDFViewerWrapper'
import { SignatureModal, SignatureData } from '@/app/components/signature/SignatureModal'

interface SignatureRegistrationPageProps {
  params: Promise<{ id: string; locale: string }>
}

interface Document {
  objectId: string
  name: string
  status: string
  URL: string
  createdAt: string
  signers: Array<{ email: string; name: string }>
}

interface SignerInfo {
  name: string
  email: string
  phone?: string
  company?: string
}

export default function SignatureRegistrationPage({ params }: SignatureRegistrationPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { toast } = useToast()
  
  const [document, setDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  
  // Signer information form state
  const [signerInfo, setSignerInfo] = useState<SignerInfo>({
    name: '',
    email: '',
    phone: '',
    company: ''
  })

  // Load document details
  useEffect(() => {
    const loadDocument = async () => {
      try {
        setIsLoading(true)
        
        const documentData = await documentsApiService.getDocument(resolvedParams.id)
        
        // Transform API document to local document interface
        const localDocument: Document = {
          objectId: documentData.objectId,
          name: documentData.name,
          status: documentData.status,
          URL: documentData.url || '', // API uses 'url', local interface uses 'URL'
          createdAt: documentData.createdAt,
          signers: documentData.signers || []
        }
        
        setDocument(localDocument)
        
        console.log('📄 Document loaded for signature registration:', documentData)
      } catch (error) {
        console.error('❌ Error loading document:', error)
        toast({
          title: "Error Loading Document",
          description: error instanceof Error ? error.message : "Failed to load document",
          variant: "destructive"
        })
        router.push('/documents')
      } finally {
        setIsLoading(false)
      }
    }

    loadDocument()
  }, [resolvedParams.id, router, toast])

  // Handle form input changes
  const handleInputChange = (field: keyof SignerInfo, value: string) => {
    setSignerInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle signature completion and document signing
  const handleSignatureComplete = async (signatureData: SignatureData) => {
    try {
      setIsSubmitting(true)
      
      if (!document) {
        throw new Error('Document not found')
      }

      // Validate signer info
      if (!signerInfo.name.trim() || !signerInfo.email.trim()) {
        toast({
          title: "Missing Information",
          description: "Please provide your name and email address",
          variant: "destructive"
        })
        return
      }

      console.log('📝 Registering signature for document:', {
        documentId: document.objectId,
        signerInfo,
        signatureData
      })

      // Call the signing endpoint using OpenSign pattern
      const signedDocument = await documentsApiService.signDocument({
        documentId: document.objectId,
        userId: 'guest-signer', // Guest signing workflow
        signature: signatureData.dataUrl,
        signatureData: {
          positions: [{
            x: 100,        // Default position - in real app this would be from placeholder click
            y: 100,        
            width: signatureData.width || 150,
            height: signatureData.height || 50,
            page: 1        
          }],
          signerInfo: {
            name: signerInfo.name,
            email: signerInfo.email,
            ...(signerInfo.phone && { phone: signerInfo.phone }),
            ...(signerInfo.company && { company: signerInfo.company })
          }
        }
      })

      console.log('✅ Signature registered successfully:', signedDocument)

      toast({
        title: "Signature Registered Successfully!",
        description: `Thank you ${signerInfo.name}, your signature has been recorded.`,
      })

      // Close modal and redirect to signed document
      setShowSignatureModal(false)
      router.push(`/documents/${document.objectId}/signed`)
      
    } catch (error) {
      console.error('❌ Error registering signature:', error)
      toast({
        title: "Signature Registration Failed",
        description: error instanceof Error ? error.message : "Failed to register signature",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle continue to signature button (following OpenSign modal pattern)
  const handleContinueToSignature = () => {
    // Validate required fields
    if (!signerInfo.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your full name to continue",
        variant: "destructive"
      })
      return
    }

    if (!signerInfo.email.trim()) {
      toast({
        title: "Email Required", 
        description: "Please enter your email address to continue",
        variant: "destructive"
      })
      return
    }

    // Open signature modal (this follows OpenSign's pattern of modal-based signature registration)
    setShowSignatureModal(true)
  }

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
          <Button onClick={() => router.push('/documents')} variant="outline">
            Back to Documents
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Following OpenSign's header design */}
      <div className="bg-indigo-600 text-white p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">{document.name}</h1>
              <p className="text-indigo-200 text-sm">
                Register your signature to sign this document
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Signer Information Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="h-5 w-5 text-indigo-600" />
                  Register Signature
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Please fill in your details below to register your signature for this document.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Document Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Document Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Name:</span>
                      <span className="text-gray-600">{document.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Created:</span>
                      <span className="text-gray-600">
                        {new Date(document.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Signer Information Form */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Your Information</h3>
                  
                  <div>
                    <Label htmlFor="fullName" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name *
                    </Label>
                    <Input
                      id="fullName"
                      value={signerInfo.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter your full name"
                      className="mt-1"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={signerInfo.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter your email address"
                      className="mt-1"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      We&apos;ll send you a copy of the signed document
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number (Optional)
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={signerInfo.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter your phone number"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="company" className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Company (Optional)
                    </Label>
                    <Input
                      id="company"
                      value={signerInfo.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder="Enter your company name"
                      className="mt-1"
                    />
                  </div>
                </div>

                <Separator />

                {/* Continue Button */}
                <Button
                  onClick={handleContinueToSignature}
                  disabled={!signerInfo.name.trim() || !signerInfo.email.trim() || isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  size="lg"
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Processing...' : 'Continue'}
                </Button>
                
                <p className="text-xs text-gray-500 text-center">
                  By continuing, you agree to electronically sign this document
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - PDF Viewer */}
          <div>
            <Card className="h-[calc(100vh-12rem)]">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Document Preview</CardTitle>
                <p className="text-sm text-gray-600">
                  Review the document content before signing
                </p>
              </CardHeader>
              <CardContent className="p-0 h-full">
                <div className="h-[calc(100%-4rem)] border-t">
                  <PDFViewerWrapper
                    fileUrl={document.URL}
                    className="w-full h-full"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Signature Modal - Following OpenSign's modal pattern */}
      {showSignatureModal && (
        <SignatureModal
          isOpen={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          onSave={handleSignatureComplete}
          title={`Sign as ${signerInfo.name}`}
        />
      )}
    </div>
  )
}