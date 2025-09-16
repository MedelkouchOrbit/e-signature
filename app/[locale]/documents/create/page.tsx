"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Upload, Palette, FileCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { DocumentUpload } from "@/app/components/documents/DocumentUpload"
import { DocumentDesign } from "@/app/components/documents/DocumentDesign"
import { type Document } from "@/app/lib/documents-store"
import { useToast } from "@/hooks/use-toast"

type CreateStep = 'upload' | 'design' | 'complete'

interface StepIndicatorProps {
  currentStep: CreateStep
  className?: string
}

function StepIndicator({ currentStep, className }: StepIndicatorProps) {
  const t = useTranslations("documents")
  
  const steps = [
    { id: 'upload', label: t("upload"), icon: Upload },
    { id: 'design', label: t("design"), icon: Palette },
    { id: 'complete', label: 'Complete', icon: FileCheck },
  ] as const

  const getStepIndex = (step: CreateStep) => steps.findIndex(s => s.id === step)
  const currentIndex = getStepIndex(currentStep)

  return (
    <div className={cn("flex items-center justify-center space-x-8", className)}>
      {steps.map((step, index) => {
        const Icon = step.icon
        const isActive = index === currentIndex
        const isCompleted = index < currentIndex
        const isUpcoming = index > currentIndex

        return (
          <div key={step.id} className="flex items-center space-x-2">
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                isActive && "border-blue-500 bg-blue-500 text-white",
                isCompleted && "border-green-500 bg-green-500 text-white",
                isUpcoming && "border-gray-300 bg-gray-100 text-gray-400"
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <span
              className={cn(
                "text-sm font-medium",
                isActive && "text-blue-600",
                isCompleted && "text-green-600",
                isUpcoming && "text-gray-400"
              )}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-8 h-0.5 mx-4 transition-colors",
                  index < currentIndex ? "bg-green-500" : "bg-gray-300"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function CreateDocumentPage() {
  const t = useTranslations("documents")
  const router = useRouter()
  const { toast } = useToast()

  const [currentStep, setCurrentStep] = useState<CreateStep>('upload')
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null)
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null)

  const handleUploadComplete = (fileUrl: string) => {
    setUploadedFileUrl(fileUrl)
    
    // Create a mock document object for design step
    const mockDocument: Document = {
      objectId: 'temp-' + Date.now(),
      name: 'Uploaded Document',
      fileName: 'Uploaded Document',
      url: fileUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'drafted',
      signers: [],
      placeholders: [],
      createdBy: {
        id: 'temp-user',
        name: 'Current User',
        email: 'user@example.com'
      },
      senderName: 'Current User',
      senderEmail: 'user@example.com',
      receiverNames: [],
      hasUserSigned: false,
      canUserSign: false,
      isCurrentUserCreator: true,
    }
    
    setCurrentDocument(mockDocument)
    setCurrentStep('design')
  }

  const handleDesignComplete = () => {
    setCurrentStep('complete')
    
    toast({
      title: t("sign_success"),
      description: "Document has been processed and is ready",
    })
    
    // Navigate back to documents list after a delay
    setTimeout(() => {
      router.push('/documents')
    }, 2000)
  }

  const handleBack = () => {
    if (currentStep === 'design') {
      setCurrentStep('upload')
    } else if (currentStep === 'complete') {
      setCurrentStep('design')
    }
  }

  const handleCancel = () => {
    router.push('/documents')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button variant="ghost" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Documents
            </Button>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t("createDocument")}
            </h1>
            <p className="text-gray-600">
              Upload, design, and sign your document in simple steps
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} className="mb-8" />

        {/* Step Content */}
        <div className="space-y-6">
          {currentStep === 'upload' && (
            <DocumentUpload
              onUploadComplete={handleUploadComplete}
              onCancel={handleCancel}
            />
          )}

          {currentStep === 'design' && uploadedFileUrl && currentDocument && (
            <DocumentDesign
              document={currentDocument}
              fileUrl={uploadedFileUrl}
              onBack={handleBack}
              onContinue={handleDesignComplete}
            />
          )}

          {currentStep === 'complete' && (
            <Card className="max-w-2xl mx-auto">
              <CardContent className="pt-6">
                <div className="text-center space-y-6">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <FileCheck className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Document Created Successfully!
                    </h2>
                    <p className="text-gray-600">
                      Your document has been processed and is ready for use.
                    </p>
                  </div>

                  <div className="flex justify-center space-x-4">
                    <Button variant="outline" onClick={() => router.push('/documents')}>
                      View All Documents
                    </Button>
                    <Button onClick={() => {
                      setCurrentStep('upload')
                      setUploadedFileUrl(null)
                      setCurrentDocument(null)
                    }}>
                      Create Another Document
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
