'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { AuthGuard } from '@/app/components/auth/AuthGuard'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, Circle, Edit3, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTemplatesStore } from '@/app/lib/templates-store'
import { TemplatePDFViewerWrapper } from '@/app/components/templates/TemplatePDFViewerWrapper'
import { TemplateReviewStep } from '@/app/components/templates/TemplateReviewStep'
import { SaveTemplatePopup } from '@/app/components/templates/SaveTemplatePopup'

interface CreateTemplateFormData {
  name: string
  description: string
  fileUrl: string | null
  sendInOrder: boolean
  otpEnabled: boolean
}

interface FieldPlacement {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  page: number
  required: boolean
  placeholder?: string
}

// Step Indicator Component matching the screenshots
function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { id: 1, label: 'Add Document', icon: Circle },
    { id: 2, label: 'Place Fields', icon: Edit3 },
    { id: 3, label: 'Review & Finish', icon: CheckCircle },
  ]

  return (
    <div className="flex items-center justify-center py-6 bg-white border-b">
      {steps.map((step, index) => {
        const Icon = step.icon
        const isActive = step.id === currentStep
        const isCompleted = step.id < currentStep

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex items-center space-x-3">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full transition-colors",
                  isActive && "bg-green-500 text-white",
                  isCompleted && "bg-green-500 text-white",
                  !isActive && !isCompleted && "bg-gray-200 text-gray-400"
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  isActive && "text-green-600",
                  isCompleted && "text-green-600",
                  !isActive && !isCompleted && "text-gray-400"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-20 h-px mx-6 transition-colors",
                  step.id < currentStep ? "bg-green-500" : "bg-gray-300"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function CreateTemplatePage() {
  const t = useTranslations('templates')
  const router = useRouter()
  const { toast } = useToast()
  const { uploadTemplate, saveTemplate, isUploading, uploadProgress, uploadError, clearUploadError } = useTemplatesStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [fieldPlacements, setFieldPlacements] = useState<FieldPlacement[]>([])
  const [selectedFieldType, setSelectedFieldType] = useState<string | null>(null)
  const [showSavePopup, setShowSavePopup] = useState(false)
  const [templateData, setTemplateData] = useState<CreateTemplateFormData>({
    name: '',
    description: '',
    fileUrl: null,
    sendInOrder: false,
    otpEnabled: false,
  })

  const handleFileUpload = async (file: File) => {
    try {
      clearUploadError()
      const fileUrl = await uploadTemplate(file, {
        name: templateData.name || file.name.replace(/\.[^/.]+$/, ""),
        description: templateData.description,
        sendInOrder: templateData.sendInOrder,
        otpEnabled: templateData.otpEnabled,
      })
      
      setTemplateData(prev => ({ ...prev, fileUrl }))
      toast({
        title: t('messages.uploadSuccess'),
        description: 'Document uploaded successfully',
      })
    } catch (error) {
      console.error('Upload failed:', error)
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload document',
        variant: "destructive",
      })
    }
  }

  const handleFieldClick = (type: string) => {
    setSelectedFieldType(type)
    toast({
      title: 'Field Selected',
      description: `Click on the document to place a ${type} field`,
    })
  }

  const handleDocumentClick = (x: number, y: number, page: number) => {
    if (!selectedFieldType) {
      toast({
        title: 'No Field Selected',
        description: 'Please select a field type first',
        variant: "destructive",
      })
      return
    }

    const newField: FieldPlacement = {
      id: crypto.randomUUID(),
      type: selectedFieldType,
      x,
      y,
      width: 15, // Default width percentage
      height: 5,  // Default height percentage
      page,
      required: true,
    }

    setFieldPlacements(prev => [...prev, newField])
    setSelectedFieldType(null)
    
    toast({
      title: 'Field Added',
      description: `${selectedFieldType} field placed on the document`,
    })
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (!templateData.fileUrl) {
        toast({
          title: 'Upload Required',
          description: 'Please upload a document first',
          variant: "destructive",
        })
        return
      }
      setCurrentStep(2)
    } else if (currentStep === 2) {
      setCurrentStep(3)
    }
  }

  const handleSaveTemplateClick = () => {
    // Show save popup when user clicks Save Template button
    setShowSavePopup(true)
  }

  const handleSaveTemplate = async (saveData: { name: string; description?: string }) => {
    try {
      if (!templateData.fileUrl) {
        throw new Error('No document uploaded')
      }

      const templateToSave = {
        name: saveData.name,
        description: saveData.description || '',
        fileUrl: templateData.fileUrl,
        fileName: saveData.name + '.pdf',
        fields: fieldPlacements.map(field => ({
          id: field.id,
          type: field.type as 'signature' | 'initials' | 'text' | 'date' | 'email' | 'name' | 'company' | 'checkbox' | 'dropdown' | 'image',
          label: field.type,
          required: field.required,
          width: field.width,
          height: field.height,
          x: field.x,
          y: field.y,
          page: field.page,
          defaultValue: field.placeholder,
          signerRole: 'default'
        })),
        signers: [], // No signers for now
        sendInOrder: templateData.sendInOrder,
        otpEnabled: templateData.otpEnabled,
        tourEnabled: false,
        reminderEnabled: false,
        reminderInterval: 7,
        completionDays: 30,
        bcc: [],
        allowModifications: false
      }

      await saveTemplate(templateToSave)
      
      toast({
        title: "Template Created",
        description: "Your template has been created successfully",
      })
      
      setTimeout(() => router.push('/templates'), 1500)
      
    } catch (error) {
      console.error('Failed to save template:', error)
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save template',
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    router.push('/templates')
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="px-4 py-4 mx-auto max-w-7xl">
            <h1 className="text-xl font-semibold text-gray-900">
              Templates - Create Template
            </h1>
          </div>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} />

        {/* Main Content */}
        <div className="p-6 mx-auto max-w-7xl">
          {/* Step 1: Add Document */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Create Template</h2>
              
              {/* Template Name Input */}
              <div className="max-w-md mx-auto">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Template Name
                </label>
                <input
                  type="text"
                  value={templateData.name}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter template name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex justify-center">
                <div className="w-full max-w-3xl">
                  {!templateData.fileUrl ? (
                    <div className="p-12 text-center bg-white border rounded-lg">
                      <div className="space-y-6">
                        <div className="text-gray-300">
                          <svg className="w-24 h-24 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                          </svg>
                          <div className="mt-4 text-6xl font-light">+</div>
                        </div>
                        <div>
                          <h3 className="mb-2 text-lg font-medium text-gray-600">
                            Add document
                          </h3>
                          <p className="text-sm text-gray-400">
                            Drag & drop your document here
                          </p>
                        </div>
                        
                        {/* Custom Upload Button */}
                        <div className="relative">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleFileUpload(file)
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={isUploading}
                          />
                          <button 
                            disabled={isUploading}
                            className={cn(
                              "inline-flex items-center px-8 py-3 text-base font-medium text-white transition-colors duration-200 border border-transparent rounded-full shadow-lg",
                              isUploading 
                                ? "bg-gray-400 cursor-not-allowed" 
                                : "bg-green-500 hover:bg-green-600"
                            )}
                          >
                            {isUploading ? (
                              <>
                                Uploading... {uploadProgress}%
                                <div className="ml-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              </>
                            ) : (
                              <>
                                Upload Document
                                <span className="ml-2 text-xl">+</span>
                              </>
                            )}
                          </button>
                        </div>
                        
                        {/* Upload Error Display */}
                        {uploadError && (
                          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                            {uploadError}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-white border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                        <div>
                          <p className="font-medium text-gray-900">Document uploaded successfully</p>
                          <p className="text-sm text-gray-500">Ready to proceed to the next step</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Next Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={!templateData.fileUrl}
                  className={cn(
                    "px-6 py-2 rounded-md font-medium transition-colors",
                    templateData.fileUrl 
                      ? "bg-gray-700 text-white hover:bg-gray-800" 
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  )}
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Place Fields */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Place Fields for Template</h2>
              
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                {/* Left Panel - Field Tools */}
                <div className="p-4 bg-white border rounded-lg">
                  <h3 className="mb-3 font-medium text-gray-900">Place Fields for Template</h3>
                  <p className="mb-4 text-sm text-gray-600">Drag a field onto your document</p>
                  
                  <div className="space-y-2">
                    {[
                      'Signature',
                      'Initials', 
                      'Name',
                      'Email',
                      'Phone',
                      'Date',
                      'Company',
                      'Text',
                      'Multiline Text',
                      'Checkbox',
                      'Stamp'
                    ].map((fieldType) => (
                      <button 
                        key={fieldType}
                        onClick={() => handleFieldClick(fieldType.toLowerCase())}
                        className={cn(
                          "w-full p-2 text-sm text-left border rounded hover:bg-gray-50 transition-colors",
                          selectedFieldType === fieldType.toLowerCase() && "bg-blue-50 border-blue-300"
                        )}
                      >
                        {fieldType}
                      </button>
                    ))}
                  </div>
                  
                  {fieldPlacements.length > 0 && (
                    <div className="mt-6">
                      <h4 className="mb-2 text-sm font-medium text-gray-900">Placed Fields</h4>
                      <div className="space-y-1 text-xs text-gray-600">
                        {fieldPlacements.map((field) => (
                          <div key={field.id} className="flex justify-between">
                            <span>{field.type}</span>
                            <span>Page {field.page}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Center Panel - Document */}
                <div className="bg-white border rounded-lg lg:col-span-3">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-medium text-gray-900">Document.pdf</h3>
                    <button 
                      onClick={handleCancel}
                      className="text-sm text-red-500 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                  
                  <div className="p-4">
                    {templateData.fileUrl ? (
                      <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
                        <TemplatePDFViewerWrapper
                          fileUrl={templateData.fileUrl}
                          onFieldPlacement={handleDocumentClick}
                          fieldPlacements={fieldPlacements}
                          selectedFieldType={selectedFieldType}
                          className="w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="p-8 border rounded-lg min-h-96 bg-gray-50">
                        <div className="space-y-4 text-center text-gray-500">
                          <FileText className="w-16 h-16 mx-auto" />
                          <div>
                            <p className="font-medium">Document Preview</p>
                            <p className="text-sm">No document uploaded yet</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-2 font-medium text-gray-600 transition-colors border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  ← Back
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 py-2 font-medium text-white transition-colors bg-gray-700 rounded-md hover:bg-gray-800"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Finish */}
          {currentStep === 3 && (
            <TemplateReviewStep
              fileUrl={templateData.fileUrl || ''}
              templateName={templateData.name || 'Document.pdf'}
              fieldPlacements={fieldPlacements}
              onCancel={handleCancel}
              onSaveTemplate={handleSaveTemplateClick}
              onBack={() => setCurrentStep(2)}
            />
          )}
        </div>
      </div>

      {/* Save Template Popup */}
      <SaveTemplatePopup
        isOpen={showSavePopup}
        templateName={templateData.name}
        onClose={() => setShowSavePopup(false)}
        onSave={handleSaveTemplate}
      />
    </AuthGuard>
  )
}
