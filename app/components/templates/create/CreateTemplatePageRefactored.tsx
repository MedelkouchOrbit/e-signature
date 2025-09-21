'use client'

import React, { useState, useEffect } from 'react'
import { AuthGuard } from '@/app/components/auth/AuthGuard'
import StepIndicator from './StepIndicator'
import DocumentUpload from './DocumentUpload'
import TemplateSettings from './TemplateSettings'
import FieldPlacementStep from './FieldPlacementStep'
import SignerManagement from './SignerManagement'
import { SaveTemplatePopup } from '@/app/components/templates/SaveTemplatePopup'
import SignatureModal from './SignatureModal'
import { 
  CreateTemplateFormData, 
  FieldPlacement, 
  Signer, 
  SigningMode 
} from './types'
import { useTemplateApi } from './useTemplateApi'

export default function CreateTemplatePageRefactored() {
  const [currentStep, setCurrentStep] = useState(1)
  
  // Template data state
  const [templateData, setTemplateData] = useState<CreateTemplateFormData>({
    name: '',
    description: '',
    fileUrl: null,
    sendInOrder: false,
    otpEnabled: false,
  })
  
  // Field placement state
  const [fieldPlacements, setFieldPlacements] = useState<FieldPlacement[]>([])
  const [selectedFieldType, setSelectedFieldType] = useState<string | null>(null)
  const [selectedField, setSelectedField] = useState<FieldPlacement | null>(null)
  
  // Signer management state
  const [selectedSigners, setSelectedSigners] = useState<Signer[]>([])
  const [signingMode, setSigningMode] = useState<SigningMode>('add_signers')
  
  // Modal states
  const [showSavePopup, setShowSavePopup] = useState(false)
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false)
  const [showSelfSignModal, setShowSelfSignModal] = useState(false)
  
  // User session states
  const [sessionToken, setSessionToken] = useState<string>('')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [extUserId, setExtUserId] = useState<string>('')
  
  // Custom hook for API operations
  const { saveTemplate, isSaving } = useTemplateApi({
    sessionToken,
    currentUserId,
    extUserId
  })

  // Initialize session data
  useEffect(() => {
    const token = localStorage.getItem('opensign_session_token') || ''
    const userId = localStorage.getItem('user_id') || ''
    const extId = localStorage.getItem('ext_user_id') || ''
    
    setSessionToken(token)
    setCurrentUserId(userId)
    setExtUserId(extId)
  }, [])

  // Template data handlers
  const handleTemplateDataChange = (updates: Partial<CreateTemplateFormData>) => {
    setTemplateData(prev => ({ ...prev, ...updates }))
  }

  // Field placement handlers
  const handleFieldPlaced = (placement: Partial<FieldPlacement>) => {
    const newField: FieldPlacement = {
      id: placement.id || `field_${Date.now()}`,
      type: placement.type || 'text',
      x: placement.x || 0,
      y: placement.y || 0,
      width: placement.width || 15,
      height: placement.height || 8,
      page: placement.page || 1,
      required: placement.required || true,
      placeholder: placement.placeholder,
      assignedSigner: placement.assignedSigner
    }
    
    setFieldPlacements(prev => [...prev, newField])
    setSelectedFieldType(null) // Clear selection after placing
  }

  const handleFieldSelected = (field: FieldPlacement) => {
    setSelectedField(field)
  }

  const handleFieldRemove = (fieldId: string) => {
    setFieldPlacements(prev => prev.filter(f => f.id !== fieldId))
    if (selectedField?.id === fieldId) {
      setSelectedField(null)
    }
  }

  const handleFieldUpdate = (fieldId: string, updates: Partial<FieldPlacement>) => {
    setFieldPlacements(prev => 
      prev.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    )
    
    // Update selected field if it's the one being updated
    if (selectedField?.id === fieldId) {
      setSelectedField(prev => prev ? { ...prev, ...updates } : null)
    }
  }

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSaveTemplate = async () => {
    try {
      const result = await saveTemplate(templateData, fieldPlacements, selectedSigners, signingMode)
      if (result.success) {
        setShowSavePopup(true)
      }
    } catch (error) {
      console.error('Failed to save template:', error)
      alert('Failed to save template. Please try again.')
    }
  }

  const handleSignatureCreate = (signatureData: string) => {
    // Handle signature creation
    console.log('Signature created:', signatureData)
    setIsSignatureModalOpen(false)
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <DocumentUpload
            templateData={templateData}
            onTemplateDataChange={handleTemplateDataChange}
            onNext={handleNext}
          />
        )
      
      case 2:
        return (
          <div className="space-y-8">
            <TemplateSettings
              templateData={templateData}
              onTemplateDataChange={handleTemplateDataChange}
              signingMode={signingMode}
              onSigningModeChange={setSigningMode}
              selectedSigners={selectedSigners}
              sessionToken={sessionToken}
              onNext={handleNext}
              onBack={handleBack}
            />
            
            {signingMode === 'add_signers' && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg border p-6">
                  <SignerManagement
                    sessionToken={sessionToken}
                    selectedSigners={selectedSigners}
                    onSignerChange={setSelectedSigners}
                  />
                </div>
              </div>
            )}
          </div>
        )
      
      case 3:
        return (
          <FieldPlacementStep
            templateData={templateData}
            fieldPlacements={fieldPlacements}
            selectedSigners={selectedSigners}
            selectedFieldType={selectedFieldType}
            selectedField={selectedField}
            onFieldPlaced={handleFieldPlaced}
            onFieldSelected={handleFieldSelected}
            onFieldTypeSelect={setSelectedFieldType}
            onFieldRemove={handleFieldRemove}
            onFieldUpdate={handleFieldUpdate}
            onNext={handleNext}
            onBack={handleBack}
          />
        )
      
      case 4:
        return (
          <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Review & Finish</h1>
              <p className="text-gray-600">Review your template and save it</p>
            </div>
            
            <div className="bg-white rounded-lg border p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Template Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{templateData.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fields</p>
                    <p className="font-medium">{fieldPlacements.length} fields</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Signers</p>
                    <p className="font-medium">{selectedSigners.length} signers</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mode</p>
                    <p className="font-medium capitalize">{signingMode.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Back
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={isSaving}
                className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <StepIndicator currentStep={currentStep} />
        
        <main className="pb-16">
          {renderCurrentStep()}
        </main>

        {/* Modals */}
        <SignatureModal
          isOpen={isSignatureModalOpen}
          onClose={() => setIsSignatureModalOpen(false)}
          onSave={handleSignatureCreate}
          title="Create Signature"
        />

        {showSavePopup && (
          <SaveTemplatePopup
            isOpen={showSavePopup}
            onClose={() => setShowSavePopup(false)}
            onSave={async () => {}}
            templateName={templateData.name}
          />
        )}

        {showSelfSignModal && (
          <SignatureModal
            isOpen={showSelfSignModal}
            onClose={() => setShowSelfSignModal(false)}
            onSave={(signatureData) => {
              console.log('Self signature:', signatureData)
              setShowSelfSignModal(false)
            }}
            title="Sign Document"
          />
        )}
      </div>
    </AuthGuard>
  )
}