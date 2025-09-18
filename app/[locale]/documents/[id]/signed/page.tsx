'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  CheckCircle, 
  FileText, 
  Download, 
  Mail, 
  Share2,
  ArrowLeft 
} from 'lucide-react'
import { documentsApiService } from '@/app/lib/documents-api-service'
import { useToast } from "@/hooks/use-toast"

interface SignedPageProps {
  params: Promise<{ id: string; locale: string }>
}

interface Document {
  objectId: string
  name: string
  status: string
  signedAt?: string
  downloadUrl?: string
}

export default function SignedPage({ params }: SignedPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { toast } = useToast()
  
  const [document, setDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setIsLoading(true)
        
        const documentData = await documentsApiService.getDocument(resolvedParams.id)
        
        // Transform to local interface
        const localDocument: Document = {
          objectId: documentData.objectId,
          name: documentData.name,
          status: documentData.status,
          signedAt: new Date().toISOString(), // Current time as signed time
          downloadUrl: documentData.url || ''
        }
        
        setDocument(localDocument)
        
        console.log('📄 Signed document loaded:', localDocument)
      } catch (error) {
        console.error('❌ Error loading signed document:', error)
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

  const handleDownload = () => {
    if (document?.downloadUrl) {
      window.open(document.downloadUrl, '_blank')
    } else {
      toast({
        title: "Download Unavailable",
        description: "The download link is not available yet",
        variant: "destructive"
      })
    }
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/documents/${document?.objectId}/view`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Signed Document: ${document?.name}`,
          text: 'View this signed document',
          url: shareUrl
        })
      } catch {
        console.log('Share cancelled')
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl)
      toast({
        title: "Link Copied",
        description: "Document link has been copied to clipboard"
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-600">Loading signed document...</p>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="mb-4 text-gray-600">Signed document not found</p>
          <Button onClick={() => router.push('/documents')} variant="outline">
            Back to Documents
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="p-4 text-white bg-green-600">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-white/20">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Document Signed Successfully</h1>
              <p className="text-sm text-green-200">
                Your signature has been recorded
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/documents')}
            variant="ghost"
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Documents
          </Button>
        </div>
      </div>

      <div className="max-w-4xl px-4 py-8 mx-auto sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8">
          {/* Success Message */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
                <h2 className="mb-2 text-2xl font-bold text-green-900">
                  Signature Completed!
                </h2>
                <p className="mb-4 text-green-700">
                  Thank you for signing <span className="font-semibold">{document.name}</span>
                </p>
                <p className="text-sm text-green-600">
                  Signed on {new Date(document.signedAt || '').toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Document Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Document Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{document.name}</h3>
                    <p className="text-sm text-gray-600">Status: {document.status}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Signed
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
                
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share Document
                </Button>
                
                <Button
                  onClick={() => router.push(`/documents/${document.objectId}/view`)}
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  View Document
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                What happens next?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full">
                    <span className="text-xs font-semibold text-blue-600">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Email confirmation</p>
                    <p className="text-sm text-gray-600">
                      You&apos;ll receive an email confirmation with a copy of the signed document
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full">
                    <span className="text-xs font-semibold text-blue-600">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Document processing</p>
                    <p className="text-sm text-gray-600">
                      The signed document will be processed and all parties will be notified
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full">
                    <span className="text-xs font-semibold text-blue-600">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Download availability</p>
                    <p className="text-sm text-gray-600">
                      You can download or view the signed document anytime from your documents
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}