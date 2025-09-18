'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/app/components/auth/AuthGuard'
import { CheckCircle, FileText, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TemplatePDFViewerWrapper } from '@/app/components/templates/TemplatePDFViewerWrapper'
import { TemplateReviewStep } from '@/app/components/templates/TemplateReviewStep'
import { SaveTemplatePopup } from '@/app/components/templates/SaveTemplatePopup'

const StepIndicator = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { id: 1, label: "Add Document" },
    { id: 2, label: "Template Settings" },
    { id: 3, label: "Place Fields" },
    { id: 4, label: "Review & Finish" }
  ]

  return (
    <div className="flex items-center justify-center py-6 bg-white border-b">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep
        const isCompleted = step.id < currentStep

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex items-center space-x-2">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full",
                  isActive
                    ? "bg-green-500 text-white"
                    : isCompleted
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-600"
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  isActive ? "text-green-600" : isCompleted ? "text-green-600" : "text-gray-500"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="w-16 h-px mx-4 bg-gray-300" />
            )}
          </div>
        )
      })}
    </div>
  )
}

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

interface Signer {
  objectId: string
  name: string
  email: string
  phone?: string
}

export default function CreateTemplatePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [fieldPlacements, setFieldPlacements] = useState<FieldPlacement[]>([])
  const [selectedFieldType, setSelectedFieldType] = useState<string | null>(null)
  const [showSavePopup, setShowSavePopup] = useState(false)
  
  // Signer management states
  const [availableSigners, setAvailableSigners] = useState<Signer[]>([])
  const [selectedSigners, setSelectedSigners] = useState<Signer[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Store hooks and form state
  const [templateData, setTemplateData] = useState<CreateTemplateFormData>({
    name: '',
    description: '',
    fileUrl: null,
    sendInOrder: false,
    otpEnabled: false,
  })

  // Fetch signers from API
  const fetchSigners = async (search: string = '') => {
    setIsLoading(true)
    try {
      const response = await fetch('http://94.249.71.89:9000/api/app/functions/getsigners', {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': 'r:cb49ad2c656ef9efc30fc3daf4ced0ba',
        },
        body: JSON.stringify({ search })
      })

      if (response.ok) {
        const data = await response.json()
        setAvailableSigners(data.result || [])
      } else {
        console.error('Failed to fetch signers')
      }
    } catch (error) {
      console.error('Error fetching signers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load signers on component mount
  useEffect(() => {
    fetchSigners()
  }, [])

  // Search signers when search term changes
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchSigners(searchTerm)
    }, 300)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.signer-dropdown')) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Helper functions
  const getInitials = (name: string, email: string) => {
    if (name && name.trim()) {
      return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    }
    return email.split('@')[0].slice(0, 2).toUpperCase()
  }

  const getAvatarColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500']
    return colors[index % colors.length]
  }

  const toggleSigner = (signer: Signer) => {
    const isSelected = selectedSigners.some(s => s.objectId === signer.objectId)
    if (isSelected) {
      setSelectedSigners(selectedSigners.filter(s => s.objectId !== signer.objectId))
    } else {
      setSelectedSigners([...selectedSigners, signer])
    }
  }

  const removeSigner = (signerId: string) => {
    setSelectedSigners(selectedSigners.filter(s => s.objectId !== signerId))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      // Create a temporary URL for the file
      const fileUrl = URL.createObjectURL(file)
      setTemplateData(prev => ({ 
        ...prev, 
        fileUrl,
        name: file.name 
      }))
    }
  }

  const handleRemoveFile = () => {
    if (templateData.fileUrl) {
      URL.revokeObjectURL(templateData.fileUrl)
    }
    setTemplateData(prev => ({ ...prev, fileUrl: null, name: '' }))
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleCancel = () => {
    router.push('/templates')
  }

  const handleFieldClick = (fieldType: string) => {
    setSelectedFieldType(selectedFieldType === fieldType ? null : fieldType)
  }

  const handleDocumentClick = (x: number, y: number, page: number) => {
    if (selectedFieldType) {
      const placement: FieldPlacement = {
        id: Date.now().toString(),
        type: selectedFieldType,
        x,
        y,
        width: 100,
        height: 30,
        page,
        required: true
      }
      setFieldPlacements(prev => [...prev, placement])
      setSelectedFieldType(null)
    }
  }

  const handleSaveTemplateClick = () => {
    setShowSavePopup(true)
  }

  const handleSaveTemplate = async (templateData: { name: string; description?: string }) => {
    try {
      // Here you would make the API call to save the template
      console.log('Saving template:', { 
        name: templateData.name, 
        description: templateData.description || '', 
        fieldPlacements, 
        selectedSigners 
      })
      
      // Navigate back to templates list
      router.push('/templates')
    } catch (error) {
      console.error('Error saving template:', error)
    }
  }

  const filteredSigners = availableSigners.filter(signer => 
    !selectedSigners.some(s => s.objectId === signer.objectId)
  )

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} />

        {/* Main Content */}
        <div className="p-6 mx-auto max-w-7xl">
          {/* Step 1: Add Document */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Create Template</h2>
              
              {/* Document Upload Area */}
              <div className="bg-white border rounded-lg p-8">
                <div className="text-center">
                  {/* File Upload Zone */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-gray-400 transition-colors">
                    <div className="space-y-6">
                      <FileText className="w-16 h-16 mx-auto text-gray-400" />
                      
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Add document</h3>
                        <p className="text-sm text-gray-500">Drag & drop your document here</p>
                      </div>
                      
                      {/* Upload Button */}
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => document.getElementById('file-upload')?.click()}
                          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium inline-flex items-center space-x-2"
                        >
                          <span>Upload Document</span>
                          <span className="text-lg">+</span>
                        </button>
                        <input
                          id="file-upload"
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Upload Progress */}
                  {templateData.fileUrl && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Document uploaded successfully</span>
                      </div>
                    </div>
                  )}
                  
                  {/* File Info */}
                  {templateData.fileUrl && (
                    <div className="mt-4 p-4 bg-gray-50 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <span className="text-sm text-gray-700">{templateData.name || 'Document.pdf'}</span>
                        </div>
                        <button 
                          onClick={handleRemoveFile}
                          className="text-sm text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={!templateData.fileUrl}
                  className="px-6 py-2 font-medium text-white transition-colors bg-green-500 rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Template Settings - Add Signers */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left Panel - PDF Document */}
                <div className="lg:col-span-2">
                  <div className="bg-white border rounded-lg overflow-hidden">
                    {/* Document Header */}
                    <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <h3 className="font-medium text-gray-900">{templateData.name || 'Document.pdf'}</h3>
                        <span className="text-sm text-gray-500">Waiting</span>
                      </div>
                      <button 
                        onClick={handleCancel}
                        className="text-sm text-red-500 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                    
                    {/* PDF Viewer */}
                    <div className="p-4">
                      {templateData.fileUrl ? (
                        <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
                          <TemplatePDFViewerWrapper
                            fileUrl={templateData.fileUrl}
                            onFieldPlacement={() => {}}
                            fieldPlacements={[]}
                            selectedFieldType={null}
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

                {/* Right Panel - Add Signers */}
                <div className="lg:col-span-1">
                  <div className="bg-white border rounded-lg p-6 space-y-6">
                    {/* Add Signers Header */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Signers</h3>
                      <p className="text-sm text-gray-600">Add the people who will sign the document</p>
                    </div>

                    {/* Assignees Section */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Assignees</h4>
                      
                      {/* Selected Signers Display */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {selectedSigners.map((signer, index) => (
                          <div key={signer.objectId} className="flex items-center space-x-2">
                            <div className={`w-8 h-8 ${getAvatarColor(index)} rounded-full flex items-center justify-center text-white text-xs font-medium`}>
                              {getInitials(signer.name, signer.email)}
                            </div>
                            <span className="text-sm text-gray-700">{signer.email}</span>
                            <button
                              onClick={() => removeSigner(signer.objectId)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        
                        {/* Add Signer Button/Dropdown */}
                        <div className="relative signer-dropdown">
                          <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-8 h-8 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center text-gray-400 hover:border-gray-400"
                          >
                            <span className="text-lg">+</span>
                          </button>

                          {/* Dropdown */}
                          {isDropdownOpen && (
                            <div className="absolute top-10 left-0 z-10 w-80 bg-white border border-gray-200 rounded-lg shadow-lg">
                              <div className="p-3 border-b">
                                <input
                                  type="text"
                                  placeholder="Search signers..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                              </div>
                              
                              <div className="max-h-60 overflow-y-auto">
                                {isLoading ? (
                                  <div className="p-4 text-center text-gray-500">Loading...</div>
                                ) : filteredSigners.length === 0 ? (
                                  <div className="p-4 text-center text-gray-500">No signers found</div>
                                ) : (
                                  filteredSigners.map((signer, index) => (
                                    <div
                                      key={signer.objectId}
                                      onClick={() => toggleSigner(signer)}
                                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer"
                                    >
                                      <div className={`w-8 h-8 ${getAvatarColor(index)} rounded-full flex items-center justify-center text-white text-xs font-medium`}>
                                        {getInitials(signer.name, signer.email)}
                                      </div>
                                      <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900">{signer.name || signer.email}</div>
                                        <div className="text-sm text-gray-500">{signer.email}</div>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Order of Signers Section */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Order of Signers</h4>
                      
                      {selectedSigners.length === 0 ? (
                        <div className="text-sm text-gray-500 p-4 border border-gray-200 rounded-lg text-center">
                          No signers selected yet
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {selectedSigners.map((signer, index) => (
                            <div key={signer.objectId} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-xs">
                                {String(index + 1).padStart(2, '0')}
                              </div>
                              <div className={`w-6 h-6 ${getAvatarColor(index)} rounded-full flex items-center justify-center text-white text-xs font-medium`}>
                                {getInitials(signer.name, signer.email)}
                              </div>
                              <span className="text-sm text-gray-700 flex-1">{signer.email}</span>
                              <button className="text-gray-400 hover:text-gray-600">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t">
                      <button
                        onClick={handleNext}
                        disabled={selectedSigners.length === 0}
                        className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Continue
                      </button>
                    </div>
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
                  disabled={selectedSigners.length === 0}
                  className="px-6 py-2 font-medium text-white transition-colors bg-green-500 rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Place Fields */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Place Fields</h2>
              
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                {/* Field Types Panel */}
                <div className="lg:col-span-1">
                  <div className="bg-white border rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold text-gray-900">Field Types</h3>
                    {['Signature', 'Initial', 'Date', 'Text', 'Email'].map((fieldType) => (
                      <button
                        key={fieldType}
                        onClick={() => handleFieldClick(fieldType.toLowerCase())}
                        className={cn(
                          "w-full p-3 text-left border rounded-lg hover:bg-gray-50",
                          selectedFieldType === fieldType.toLowerCase() && "bg-blue-50 border-blue-300"
                        )}
                      >
                        {fieldType}
                      </button>
                    ))}
                    
                    {fieldPlacements.length > 0 && (
                      <div className="pt-4 border-t">
                        <h4 className="font-medium text-gray-900 mb-2">Placed Fields</h4>
                        {fieldPlacements.map((field) => (
                          <div key={field.id} className="text-sm text-gray-600 mb-1">
                            {field.type} on page {field.page}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* PDF Document Panel */}
                <div className="lg:col-span-3">
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                      <h3 className="font-medium text-gray-900">Document</h3>
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
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-2 font-medium text-gray-600 transition-colors border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  ← Back
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 py-2 font-medium text-white transition-colors bg-green-500 rounded-md hover:bg-green-600"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review & Finish */}
          {currentStep === 4 && (
            <TemplateReviewStep
              fileUrl={templateData.fileUrl || ''}
              templateName={templateData.name || 'Document.pdf'}
              fieldPlacements={fieldPlacements}
              onCancel={handleCancel}
              onSaveTemplate={handleSaveTemplateClick}
              onBack={() => setCurrentStep(3)}
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