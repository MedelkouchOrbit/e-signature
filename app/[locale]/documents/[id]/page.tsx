"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { AuthGuard } from "@/app/components/auth/AuthGuard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, Users, Download, Edit, Share2 } from "lucide-react"
import { documentsApiService, type Document } from "@/app/lib/documents-api-service"
import { useToast } from "@/hooks/use-toast"

export default function DocumentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const documentId = params.id as string

  const loadDocument = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const doc = await documentsApiService.getDocument(documentId)
      setDocument(doc)
    } catch (err) {
      console.error('Error loading document:', err)
      setError('Failed to load document')
      toast({
        title: "Error",
        description: "Failed to load document details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [documentId, toast])

  useEffect(() => {
    loadDocument()
  }, [documentId, loadDocument])

  const handleEdit = () => {
    router.push(`/documents/${documentId}/edit`)
  }

  const handleDownload = async () => {
    try {
      const url = await documentsApiService.downloadDocument(documentId, document?.status === 'signed')
      if (url) {
        window.open(url, '_blank')
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive"
      })
    }
  }

  const handleShare = () => {
    // TODO: Implement share functionality
    toast({
      title: "Share",
      description: "Share functionality coming soon"
    })
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
              <p>Loading document...</p>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (error || !document) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">{error || 'Document not found'}</p>
              <Button onClick={() => router.push('/documents')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Documents
              </Button>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/documents')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{document.name}</h1>
              <p className="text-muted-foreground">Document Details</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Document Info */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="mt-1">{document.name}</p>
                </div>
                
                {document.fileName && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">File Name</label>
                    <p className="mt-1">{document.fileName}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge 
                      variant={
                        document.status === 'signed' ? 'default' : 
                        document.status === 'waiting' ? 'secondary' : 
                        'outline'
                      }
                    >
                      {document.status}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="mt-1">{new Date(document.createdAt).toLocaleString()}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="mt-1">{new Date(document.updatedAt).toLocaleString()}</p>
                </div>

                {document.createdBy && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created By</label>
                    <p className="mt-1">{document.createdBy.name || document.createdBy.id}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Signers */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Signers ({document.signers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {document.signers.map((signer, index) => (
                    <div key={signer.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{signer.name}</p>
                        <p className="text-sm text-muted-foreground">{signer.email}</p>
                        <p className="text-xs text-muted-foreground">{signer.role}</p>
                      </div>
                      <div className="ml-2">
                        <Badge 
                          variant={
                            signer.status === 'signed' ? 'default' : 
                            signer.status === 'waiting' ? 'secondary' : 
                            'outline'
                          }
                          className="text-xs"
                        >
                          {signer.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {document.signers.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      No signers assigned
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
