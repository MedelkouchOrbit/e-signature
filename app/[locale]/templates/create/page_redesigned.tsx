'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { AuthGuard } from '@/app/components/auth/AuthGuard'
import { DocumentUpload } from '@/app/components/documents/DocumentUpload'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, Circle, Edit3, FileText, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CreateTemplateFormData {
  name: string
  description: string
  fileUrl: string | null
  sendInOrder: boolean
  otpEnabled: boolean
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
  const router = useRouter()
  const t = useTranslations('templates')
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [templateData, setTemplateData] = useState<CreateTemplateFormData>({
    name: '',
    description: '',
    fileUrl: null,
    sendInOrder: false,
    otpEnabled: false,
  })

  const handleFileUpload = (fileUrl: string) => {
    setTemplateData(prev => ({ ...prev, fileUrl }))
    toast({
      title: t('messages.uploadSuccess'),
      description: 'Document uploaded successfully',
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
    } else if (currentStep === 3) {
      // Complete template creation
      toast({
        title: "Template Created",
        description: "Your template has been created successfully",
      })
      setTimeout(() => router.push('/templates'), 1500)
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
                                // Simulate file upload for demo
                                setTimeout(() => {
                                  handleFileUpload(`/uploaded/${file.name}`)
                                }, 1000)
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <button className="inline-flex items-center px-8 py-3 text-base font-medium text-white transition-colors duration-200 bg-green-500 border border-transparent rounded-full shadow-lg hover:bg-green-600">
                            Upload Document
                            <span className="ml-2 text-xl">+</span>
                          </button>
                        </div>
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
                    <button className="w-full p-2 text-sm text-left border rounded hover:bg-gray-50">Signature</button>
                    <button className="w-full p-2 text-sm text-left border rounded hover:bg-gray-50">Initials</button>
                    <button className="w-full p-2 text-sm text-left border rounded hover:bg-gray-50">Name</button>
                    <button className="w-full p-2 text-sm text-left border rounded hover:bg-gray-50">Email</button>
                    <button className="w-full p-2 text-sm text-left border rounded hover:bg-gray-50">Phone</button>
                    <button className="w-full p-2 text-sm text-left border rounded hover:bg-gray-50">Date</button>
                    <button className="w-full p-2 text-sm text-left border rounded hover:bg-gray-50">Company</button>
                    <button className="w-full p-2 text-sm text-left border rounded hover:bg-gray-50">Text</button>
                    <button className="w-full p-2 text-sm text-left border rounded hover:bg-gray-50">Multiline Text</button>
                    <button className="w-full p-2 text-sm text-left border rounded hover:bg-gray-50">Checkbox</button>
                    <button className="w-full p-2 text-sm text-left border rounded hover:bg-gray-50">Stamp</button>
                  </div>
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
                    <div className="p-8 border rounded-lg min-h-96 bg-gray-50">
                      <div className="space-y-4 text-center text-gray-500">
                        <FileText className="w-16 h-16 mx-auto" />
                        <div>
                          <p className="font-medium">Document Preview</p>
                          <p className="text-sm">Field placement interface will be implemented here</p>
                        </div>
                        <div className="max-w-md mx-auto text-xs text-gray-400">
                          <p>Documentso Supporter Pledge</p>
                          <p>Our mission is to create an open signing infrastructure that empowers the world...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
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
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Review & Finish</h2>
              
              <div className="bg-white border rounded-lg">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-medium text-gray-900">Document.pdf</h3>
                  <button 
                    onClick={handleCancel}
                    className="text-sm text-red-500 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="p-8 border rounded-lg min-h-96 bg-gray-50">
                    <div className="space-y-6 text-center text-gray-500">
                      <FileText className="w-16 h-16 mx-auto" />
                      <div>
                        <p className="mb-2 font-medium">Template Review</p>
                        <p className="mb-4 text-sm">Review your template before finalizing</p>
                        <div className="max-w-md mx-auto space-y-2 text-xs text-gray-400">
                          <p>Documentso Supporter Pledge</p>
                          <p>Our mission is to create an open signing infrastructure that empowers the world. We believe openness and cooperation are the way every business should be conducted.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center mt-8 space-x-12">
                        <div className="text-center">
                          <div className="flex items-center justify-center w-12 h-8 mx-auto mb-2 bg-gray-200 rounded">
                            <span className="text-xs">📝</span>
                          </div>
                          <span className="text-xs">Signature</span>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center w-12 h-8 mx-auto mb-2 bg-gray-200 rounded">
                            <span className="text-xs">🔖</span>
                          </div>
                          <span className="text-xs">Stamp</span>
                        </div>
                      </div>
                      
                      <div className="mt-6 text-xs text-gray-400">
                        <p>Timur Ercan & Lucas Smith</p>
                        <p>Co-Founders, Documentso</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  className="px-6 py-2 font-medium text-white transition-colors bg-gray-700 rounded-md hover:bg-gray-800"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
