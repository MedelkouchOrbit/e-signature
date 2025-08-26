"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Signature, Download, Share2, Users, Clock, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDocumentsStore, type Document } from "@/app/lib/documents-store"
import { useToast } from "@/hooks/use-toast"
import { PDFViewerWrapper } from "./PDFViewerWrapper"
import { addSignaturesToPDF, uploadSignedPDF } from "@/app/lib/pdf-signature-utils"

interface DocumentDesignProps {
  document: Document
  fileUrl: string
  onBack?: () => void
  onContinue?: () => void
  className?: string
}

interface SignaturePosition {
  x: number
  y: number
  width: number
  height: number
  page: number
  id: string
}

export function DocumentDesign({ 
  document, 
  fileUrl, 
  onBack, 
  onContinue,
  className 
}: DocumentDesignProps) {
  const t = useTranslations("documents")
  const { toast } = useToast()
  
  const {
    signDocument
  } = useDocumentsStore()

  const [showSignatureDialog, setShowSignatureDialog] = useState(false)
  const [signaturePositions, setSignaturePositions] = useState<SignaturePosition[]>([])
  const [isSignatureRequested, setIsSignatureRequested] = useState(false)
  const [isSigningInProgress, setIsSigningInProgress] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentPage, setCurrentPage] = useState(1)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [numPages, setNumPages] = useState(3)

  useEffect(() => {
    // In a real implementation, you would load the PDF here
    // For now, we'll simulate the document loading
    console.log('Loading document:', fileUrl)
  }, [fileUrl])

  const handleRequestSignature = () => {
    // In a real implementation, this would add a signature field to the document
    const newPosition: SignaturePosition = {
      x: 200,
      y: 300,
      width: 150,
      height: 50,
      page: currentPage,
      id: `signature-${Date.now()}-${Math.random()}`
    }
    
    setSignaturePositions([...signaturePositions, newPosition])
    setIsSignatureRequested(true)
    
    toast({
      title: "Signature Requested",
      description: "Signature field added to the document",
    })
  }

  const handleContinue = () => {
    if (signaturePositions.length === 0) {
      toast({
        title: "Signature Required",
        description: "Please add at least one signature field before continuing",
        variant: "destructive",
      })
      return
    }
    
    setShowSignatureDialog(true)
  }

  const handleSign = async () => {
    try {
      setIsSigningInProgress(true)
      
      // Create signed PDF with signature overlays
      const signerName = document.ExtUserPtr?.Name || 'Digital Signature'
      const signedPdfBlob = await addSignaturesToPDF(fileUrl, signaturePositions, signerName)
      
      // Upload the signed PDF
      const signedPdfUrl = await uploadSignedPDF(signedPdfBlob, document.Name)
      
      // Update the document with signature information
      await signDocument(document.objectId, {
        signaturePositions,
        signerDetails: {
          name: document.ExtUserPtr?.Name || '',
          email: document.ExtUserPtr?.Email || '',
        },
        signedFileUrl: signedPdfUrl
      })
      
      setShowSignatureDialog(false)
      
      toast({
        title: t("sign_success"),
        description: t("you_just_signed", { documentName: document.Name }),
      })
      
      onContinue?.()
      
    } catch (error) {
      toast({
        title: t("sign_error"),
        description: error instanceof Error ? error.message : "Failed to sign document",
        variant: "destructive",
      })
    } finally {
      setIsSigningInProgress(false)
    }
  }

  const handleShare = () => {
    // Navigate to share functionality
    toast({
      title: "Share Document",
      description: "Share functionality would be implemented here",
    })
  }

  const handleDownload = () => {
    // Download the document
    if (fileUrl) {
      window.open(fileUrl, '_blank')
    }
  }

  return (
    <div className={cn("w-full max-w-6xl mx-auto", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Document Viewer */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-semibold">
                {document.Name}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant={document.status === 'signed' ? 'default' : 'secondary'}>
                  {t(`status.${document.status}`)}
                </Badge>
                <span className="text-sm text-gray-500">
                  Page {currentPage} of {numPages}
                </span>
              </div>
            </CardHeader>
            
            <CardContent>
              <PDFViewerWrapper 
                fileUrl={fileUrl}
                signatures={signaturePositions}
                onSignatureAdd={(signature: SignaturePosition) => setSignaturePositions([...signaturePositions, signature])}
                onSignatureRemove={(signatureId: string) => 
                  setSignaturePositions(signaturePositions.filter(sig => sig.id !== signatureId))
                }
                className="h-full"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-4">
          {/* Document Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Document Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">{document.Name}</span>
              </div>
              
              {document.ExtUserPtr && (
                <div className="flex items-center space-x-2 text-sm">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{document.ExtUserPtr.Name}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">
                  {new Date(document.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!isSignatureRequested && (
                <Button
                  onClick={handleRequestSignature}
                  className="w-full"
                  variant="outline"
                >
                  <Signature className="h-4 w-4 mr-2" />
                  {t("requestSignaturePlace")}
                </Button>
              )}
              
              <Button
                onClick={handleDownload}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {t("download")}
              </Button>
              
              <Button
                onClick={handleShare}
                variant="outline"
                className="w-full"
              >
                <Share2 className="h-4 w-4 mr-2" />
                {t("share")}
              </Button>
            </CardContent>
          </Card>

          {/* Navigation */}
          <Card>
            <CardContent className="pt-6 space-y-2">
              {onBack && (
                <Button
                  onClick={onBack}
                  variant="outline"
                  className="w-full"
                >
                  Back to Upload
                </Button>
              )}
              
              <Button
                onClick={handleContinue}
                className="w-full"
                disabled={signaturePositions.length === 0}
              >
                {t("continue")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sign Confirmation Dialog */}
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("signDocument")}</DialogTitle>
            <DialogDescription>
              {t("confirmSignature")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-medium mb-2">{document.Name}</h4>
              <p className="text-sm text-gray-600">
                {t("you_will_receive_email")}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSignatureDialog(false)}
              disabled={isSigningInProgress}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSign}
              disabled={isSigningInProgress}
            >
              {isSigningInProgress ? "Signing..." : t("sign")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
