'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/app/components/auth/AuthGuard'
import StepIndicator from '@/app/components/templates/create/StepIndicator'
import SignerManagement from '@/app/components/templates/create/SignerManagement'
import PDFViewer from '@/app/components/templates/create/PDFViewer'
import FieldPlacementPanel from '@/app/components/templates/create/FieldPlacementPanel'
import SignatureModal from '@/app/components/templates/create/SignatureModal'
import { 
  CreateTemplateFormData, 
  FieldPlacement, 
  Signer, 
  SigningMode 
} from '@/app/components/templates/create/types'

export default function CreateTemplatePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  
  // Template data and state
  const [templateData, setTemplateData] = useState<CreateTemplateFormData>({
    name: '',
    description: '',
    fileUrl: null,
    sendInOrder: false,
    otpEnabled: false,
  })
  
  // Field and signer management
  const [fieldPlacements, setFieldPlacements] = useState<FieldPlacement[]>([])
  const [selectedSigners, setSelectedSigners] = useState<Signer[]>([])
  const [selectedFieldType, setSelectedFieldType] = useState<string | null>(null)
  const [selectedField, setSelectedField] = useState<FieldPlacement | null>(null)
  const [signingMode] = useState<SigningMode>('add_signers')
  
  // Modal states
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false)
  
  // Session and user state
  const [sessionToken, setSessionToken] = useState<string>('')
  const [isLoading] = useState(false)

  // Initialize session data
  useEffect(() => {
    const token = localStorage.getItem('opensign_session_token') || ''
    setSessionToken(token)
  }, [])

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      const url = URL.createObjectURL(file)
      setTemplateData(prev => ({ ...prev, fileUrl: url }))
    }
  }

  // Field placement handlers
  const handleFieldPlaced = (placement: Partial<FieldPlacement>) => {
    if (placement.id) {
      const newField: FieldPlacement = {
        id: placement.id,
        type: placement.type || 'text',
        x: placement.x || 0,
        y: placement.y || 0,
        width: placement.width || 15,
        height: placement.height || 8,
        page: placement.page || 1,
        required: placement.required || true,
        placeholder: placement.placeholder || '',
        assignedSigner: placement.assignedSigner
      }
      setFieldPlacements(prev => [...prev, newField])
      setSelectedFieldType(null)
    }
  }

  const handleFieldSelected = (field: FieldPlacement) => {
    setSelectedField(field)
  }

  const handleFieldRemove = (fieldId: string) => {
    setFieldPlacements(prev => prev.filter(f => f.id !== fieldId))
    setSelectedField(null)
  }

  const handleFieldUpdate = (fieldId: string, updates: Partial<FieldPlacement>) => {
    setFieldPlacements(prev =>
      prev.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    )
    if (selectedField?.id === fieldId) {
      setSelectedField(prev => prev ? { ...prev, ...updates } : null)
    }
  }

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Step validation
  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return templateData.fileUrl !== null
      case 2:
        return templateData.name.trim() !== '' && 
               (signingMode === 'sign_yourself' || selectedSigners.length > 0)
      case 3:
        return fieldPlacements.length > 0
      default:
        return true
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Document</h2>
              <p className="text-gray-600 mb-8">Choose a PDF document to create your template</p>
            </div>
            
            <div className="max-w-md mx-auto">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="space-y-4">
                    <div className="text-4xl text-gray-400">📄</div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">Click to upload PDF</p>
                      <p className="text-sm text-gray-500">Or drag and drop your file here</p>
                    </div>
                  </div>
                </label>
              </div>
              
              {templateData.fileUrl && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm">✓ PDF uploaded successfully</p>
                </div>
              )}
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Template Settings</h2>
              <p className="text-gray-600 mb-8">Configure your template and add signers</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={templateData.name}
                    onChange={(e) => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter template name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={templateData.description}
                    onChange={(e) => setTemplateData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter template description"
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="sendInOrder"
                      checked={templateData.sendInOrder}
                      onChange={(e) => setTemplateData(prev => ({ ...prev, sendInOrder: e.target.checked }))}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor="sendInOrder" className="ml-2 text-sm text-gray-700">
                      Send documents in order
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="otpEnabled"
                      checked={templateData.otpEnabled}
                      onChange={(e) => setTemplateData(prev => ({ ...prev, otpEnabled: e.target.checked }))}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor="otpEnabled" className="ml-2 text-sm text-gray-700">
                      Enable OTP verification
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <SignerManagement
                  sessionToken={sessionToken}
                  selectedSigners={selectedSigners}
                  onSignerChange={setSelectedSigners}
                />
              </div>
            </div>
          </div>
        )
      
      case 3:
        return (
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Place Fields</h2>
              <p className="text-gray-600">Click on field types and then click on the document to place them</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <FieldPlacementPanel
                  fieldPlacements={fieldPlacements}
                  selectedSigners={selectedSigners}
                  selectedFieldType={selectedFieldType}
                  onFieldTypeSelect={setSelectedFieldType}
                  onFieldRemove={handleFieldRemove}
                  onFieldUpdate={handleFieldUpdate}
                  selectedField={selectedField}
                />
              </div>
              
              <div className="lg:col-span-3">
                <PDFViewer
                  fileUrl={templateData.fileUrl}
                  fieldPlacements={fieldPlacements}
                  selectedFieldType={selectedFieldType}
                  onFieldPlaced={handleFieldPlaced}
                  onFieldSelected={handleFieldSelected}
                  selectedField={selectedField}
                />
              </div>
            </div>
          </div>
        )
      
      case 4:
        return (
          <div className="p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Review & Finish</h2>
              <p className="text-gray-600 mb-8">Review your template before saving</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Template Details</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div>
                      <span className="font-medium text-gray-700">Name:</span>
                      <span className="ml-2 text-gray-900">{templateData.name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Description:</span>
                      <span className="ml-2 text-gray-900">{templateData.description || 'No description'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Send in order:</span>
                      <span className="ml-2 text-gray-900">{templateData.sendInOrder ? 'Yes' : 'No'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">OTP enabled:</span>
                      <span className="ml-2 text-gray-900">{templateData.otpEnabled ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Signers ({selectedSigners.length})</h3>
                  <div className="space-y-2">
                    {selectedSigners.map((signer, index) => (
                      <div key={signer.objectId} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{signer.Name || signer.Email}</p>
                            <p className="text-sm text-gray-500">{signer.Email}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Fields ({fieldPlacements.length})</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{fieldPlacements.length} fields placed across the document</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Document Preview</h3>
                <div className="border rounded-lg overflow-hidden">
                  <PDFViewer
                    fileUrl={templateData.fileUrl}
                    fieldPlacements={fieldPlacements}
                    selectedFieldType={null}
                    onFieldPlaced={() => {}}
                    onFieldSelected={() => {}}
                  />
                </div>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  const handleFinish = () => {
    // Simple save logic - in a real app, this would make API calls
    console.log('Saving template:', {
      templateData,
      selectedSigners,
      fieldPlacements
    })
    
    router.push('/templates')
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-2xl font-bold text-gray-900">Create Template</h1>
              <button
                onClick={() => router.push('/templates')}
                className="text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm min-h-[600px]">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex space-x-4">
              {currentStep < 4 ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceedToNext() || isLoading}
                  className="px-8 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Loading...' : 'Next'}
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  className="px-8 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600"
                >
                  Finish & Save
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Signature Modal */}
        {isSignatureModalOpen && (
          <SignatureModal
            isOpen={isSignatureModalOpen}
            onClose={() => setIsSignatureModalOpen(false)}
            onSave={(data) => {
              console.log('Signature saved:', data)
              setIsSignatureModalOpen(false)
            }}
          />
        )}
      </div>
    </AuthGuard>
  )
}