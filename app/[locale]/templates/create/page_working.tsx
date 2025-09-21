'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/app/components/auth/AuthGuard'
import { CheckCircle, FileText, X, PenTool, Type, Calendar, Mail, User, Building, RadioIcon, Check, Minus, Eye, Move } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TemplatePDFViewerWrapper } from '@/app/components/templates/TemplatePDFViewerWrapper'
import { TemplateReviewStep } from '@/app/components/templates/TemplateReviewStep'
import { SaveTemplatePopup } from '@/app/components/templates/SaveTemplatePopup'
import dynamic from 'next/dynamic'

// Dynamically import SignatureCanvas to avoid SSR issues
const SignatureCanvas = dynamic(() => import('react-signature-canvas'), { ssr: false })

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
  assignedSigner?: string
}

interface Signer {
  objectId: string
  Name: string
  Email: string
  UserRole?: string
  TenantId?: {
    __type: string
    className: string
    objectId: string
  }
  CreatedBy?: {
    __type: string
    className: string
    objectId: string
  }
  UserId?: {
    __type: string
    className: string
    objectId: string
  }
  IsDeleted?: boolean
}

// Field types configuration matching OpenSign
const FIELD_TYPES = [
  { type: 'signature', label: 'Signature', icon: PenTool, color: 'bg-blue-500' },
  { type: 'initial', label: 'Initials', icon: Type, color: 'bg-green-500' },
  { type: 'name', label: 'Name', icon: User, color: 'bg-purple-500' },
  { type: 'email', label: 'Email', icon: Mail, color: 'bg-red-500' },
  { type: 'date', label: 'Date', icon: Calendar, color: 'bg-yellow-500' },
  { type: 'company', label: 'Company', icon: Building, color: 'bg-indigo-500' },
  { type: 'text', label: 'Text Input', icon: Type, color: 'bg-gray-500' },
  { type: 'checkbox', label: 'Checkbox', icon: Check, color: 'bg-green-600' },
  { type: 'radio', label: 'Radio Button', icon: RadioIcon, color: 'bg-orange-500' },
  { type: 'dropdown', label: 'Dropdown', icon: Minus, color: 'bg-teal-500' }
]

export default function CreateTemplatePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [fieldPlacements, setFieldPlacements] = useState<FieldPlacement[]>([])
  const [selectedFieldType, setSelectedFieldType] = useState<string | null>(null)
  const [showSavePopup, setShowSavePopup] = useState(false)
  const sigCanvasRef = useRef<any>(null)
  
  // Signer management states
  const [availableSigners, setAvailableSigners] = useState<Signer[]>([])
  const [selectedSigners, setSelectedSigners] = useState<Signer[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // New states for field placement and signature modal
  const [isSignerModalOpen, setIsSignerModalOpen] = useState(false)
  const [tempFieldPlacement, setTempFieldPlacement] = useState<Partial<FieldPlacement> | null>(null)
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false)
  const [selectedField, setSelectedField] = useState<FieldPlacement | null>(null)
  const [signatureType, setSignatureType] = useState<'draw' | 'type' | 'upload'>('draw')
  const [typedSignature, setTypedSignature] = useState('')

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
  const getInitials = (name: string | undefined, email: string | undefined) => {
    if (name && name.trim()) {
      return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    }
    if (email) {
      return email.split('@')[0].slice(0, 2).toUpperCase()
    }
    return 'U' // Default fallback
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

  const reorderSigners = (startIndex: number, endIndex: number) => {
    const newSigners = Array.from(selectedSigners)
    const [removed] = newSigners.splice(startIndex, 1)
    newSigners.splice(endIndex, 0, removed)
    setSelectedSigners(newSigners)
  }

  const moveSignerUp = (index: number) => {
    if (index > 0) {
      reorderSigners(index, index - 1)
    }
  }

  const moveSignerDown = (index: number) => {
    if (index < selectedSigners.length - 1) {
      reorderSigners(index, index + 1)
    }
  }

  // Field placement functions
  const getFieldColor = (type: string) => {
    const fieldType = FIELD_TYPES.find(f => f.type === type)
    return fieldType?.color || 'bg-gray-500'
  }

  const handleFieldTypeClick = (fieldType: string) => {
    setSelectedFieldType(selectedFieldType === fieldType ? null : fieldType)
  }

  const handleDocumentClick = (x: number, y: number, page: number) => {
    if (selectedFieldType) {
      const newField: Partial<FieldPlacement> = {
        id: Date.now().toString(),
        type: selectedFieldType,
        x,
        y,
        width: selectedFieldType === 'signature' ? 150 : selectedFieldType === 'checkbox' ? 20 : 100,
        height: selectedFieldType === 'signature' ? 50 : selectedFieldType === 'checkbox' ? 20 : 30,
        page,
        required: true
      }
      
      // Open signer selection modal
      setTempFieldPlacement(newField)
      setIsSignerModalOpen(true)
      setSelectedFieldType(null)
    }
  }

  const handleSignerAssignment = (signerId: string) => {
    if (tempFieldPlacement) {
      const finalField: FieldPlacement = {
        ...tempFieldPlacement,
        assignedSigner: signerId
      } as FieldPlacement
      
      setFieldPlacements(prev => [...prev, finalField])
      setIsSignerModalOpen(false)
      setTempFieldPlacement(null)
    }
  }

  const removeFieldPlacement = (fieldId: string) => {
    setFieldPlacements(prev => prev.filter(f => f.id !== fieldId))
  }

  const handleFieldClick = (field: FieldPlacement) => {
    if (field.type === 'signature') {
      setSelectedField(field)
      setIsSignatureModalOpen(true)
    }
  }

  const saveTemplate = async () => {
    setIsSaving(true)
    try {
      const templatePayload = {
        Name: templateData.name || "New Template",
        Description: templateData.description || "",
        Note: "Please review and sign this document",
        SendinOrder: templateData.sendInOrder || true,
        AutomaticReminders: false,
        RemindOnceInEvery: 5,
        IsTourEnabled: true,
        TimeToCompleteDays: 15,
        AllowModifications: false,
        IsEnableOTP: templateData.otpEnabled || false,
        NotifyOnSignatures: true,
        URL: templateData.fileUrl,
        Bcc: selectedSigners.map(signer => ({
          __type: "Pointer",
          className: "contracts_Contactbook",
          objectId: signer.objectId
        })),
        ExtUserPtr: {
          __type: "Pointer",
          className: "contracts_Users",
          objectId: "ODs8eHFNVW"
        },
        CreatedBy: {
          __type: "Pointer",
          className: "_User",
          objectId: "pyNn9ogqBr"
        },
        _ApplicationId: "opensign",
        _ClientVersion: "js6.1.1",
        _InstallationId: "5b57e02d-5015-4c69-bede-06310ad8bae9",
        _SessionToken: "r:cb49ad2c656ef9efc30fc3daf4ced0ba"
      }

      const response = await fetch('http://94.249.71.89:9000/api/app/classes/contracts_Template', {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'Content-Type': 'text/plain',
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': 'r:cb49ad2c656ef9efc30fc3daf4ced0ba',
        },
        body: JSON.stringify(templatePayload)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Template saved successfully:', result)
        return result
      } else {
        console.error('Failed to save template:', response.statusText)
        throw new Error('Failed to save template')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  const handleNext = async () => {
    try {
      if (currentStep === 2) {
        if (selectedSigners.length === 0) {
          alert('Please select at least one signer before continuing.')
          return
        }
        
        console.log('Saving template...')
        await saveTemplate()
        console.log('Template saved successfully!')
      }
      
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1)
      }
    } catch (error) {
      console.error('Error in handleNext:', error)
      alert('Failed to save template. Please try again.')
    }
  }

  const handleCancel = () => {
    router.push('/templates')
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
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

  const handleSaveTemplateClick = () => {
    setShowSavePopup(true)
  }

  const handleSaveTemplate = async (templateData: { name: string; description?: string }) => {
    try {
      console.log('Saving template:', { 
        name: templateData.name, 
        description: templateData.description || '', 
        fieldPlacements, 
        selectedSigners 
      })
      
      router.push('/templates')
    } catch (error) {
      console.error('Error saving template:', error)
    }
  }

  const handleSignatureSave = async () => {
    if (!selectedField) return

    try {
      let signatureData = ''
      
      if (signatureType === 'draw' && sigCanvasRef.current) {
        signatureData = sigCanvasRef.current.getTrimmedCanvas().toDataURL()
      } else if (signatureType === 'type') {
        signatureData = typedSignature
      }

      // Call the signPdf API
      const response = await fetch('http://94.249.71.89:9000/api/app/functions/signPdf', {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'Content-Type': 'text/plain',
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': 'r:cb49ad2c656ef9efc30fc3daf4ced0ba',
        },
        body: JSON.stringify({
          pdfFile: signatureData,
          _ApplicationId: "opensign",
          _ClientVersion: "js6.1.1",
          _InstallationId: "5b57e02d-5015-4c69-bede-06310ad8bae9",
          _SessionToken: "r:cb49ad2c656ef9efc30fc3daf4ced0ba"
        })
      })

      if (response.ok) {
        console.log('Signature saved successfully')
        setIsSignatureModalOpen(false)
        setSelectedField(null)
      }
    } catch (error) {
      console.error('Error saving signature:', error)
    }
  }

  const clearSignature = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear()
    }
    setTypedSignature('')
  }

  const filteredSigners = availableSigners.filter(signer => 
    !selectedSigners.some(s => s.objectId === signer.objectId) &&
    ((signer.Name && signer.Name.toLowerCase().includes(searchTerm.toLowerCase())) || 
     (signer.Email && signer.Email.toLowerCase().includes(searchTerm.toLowerCase())))
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
              
              <div className="bg-white border rounded-lg p-8">
                <div className="text-center">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-gray-400 transition-colors">
                    <div className="space-y-6">
                      <FileText className="w-16 h-16 mx-auto text-gray-400" />
                      
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Add document</h3>
                        <p className="text-sm text-gray-500">Drag & drop your document here</p>
                      </div>
                      
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
                  
                  {templateData.fileUrl && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Document uploaded successfully</span>
                      </div>
                    </div>
                  )}
                  
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
                  className="px-6 py-2 font-medium text-white transition-colors bg-gray-700 rounded-md hover:bg-gray-800"
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
                <div className="lg:col-span-2">
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <h3 className="font-medium text-gray-900">Document.pdf</h3>
                        <span className="text-sm text-gray-500">Waiting</span>
                      </div>
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

                <div className="lg:col-span-1">
                  <div className="bg-white border rounded-lg p-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Add Signers</h3>
                      <p className="text-sm text-gray-600 mb-6">Add the people who will sign the document</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Assignees</h4>
                      <div className="space-y-3">
                        {selectedSigners.map((signer, index) => (
                          <div key={signer.objectId} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                            <div className={`w-8 h-8 ${getAvatarColor(index)} rounded-full flex items-center justify-center text-white text-xs font-medium`}>
                              {getInitials(signer.Name, signer.Email)}
                            </div>
                            <span className="text-sm text-gray-700">{signer.Email}</span>
                            <button
                              onClick={() => removeSigner(signer.objectId)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        
                        <div className="relative signer-dropdown">
                          <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-8 h-8 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center text-gray-400 hover:border-gray-400"
                          >
                            <span className="text-lg">+</span>
                          </button>

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
                                        {getInitials(signer.Name, signer.Email)}
                                      </div>
                                      <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900">{signer.Name || signer.Email}</div>
                                        <div className="text-sm text-gray-500">{signer.Email}</div>
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
                                {getInitials(signer.Name, signer.Email)}
                              </div>
                              <span className="text-sm text-gray-700 flex-1">{signer.Email}</span>
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => moveSignerUp(index)}
                                  disabled={index === 0}
                                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                >
                                  <Move className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => moveSignerDown(index)}
                                  disabled={index === selectedSigners.length - 1}
                                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                >
                                  <Move className="w-4 h-4 rotate-180" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t">
                      <button
                        onClick={handleNext}
                        disabled={selectedSigners.length === 0 || isSaving}
                        className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isSaving ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          'Continue'
                        )}
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
                  disabled={selectedSigners.length === 0 || isSaving}
                  className="px-6 py-2 font-medium text-white transition-colors bg-green-500 rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Next →'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Place Fields */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Place Fields for Template</h2>
              
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                {/* Left Panel - Widgets */}
                <div className="lg:col-span-1">
                  <div className="bg-white border rounded-lg p-4 space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Widgets</h3>
                      <p className="text-sm text-gray-600">Drag & Drop elements to place them in the document</p>
                    </div>

                    <div className="space-y-2">
                      {FIELD_TYPES.map((fieldType) => {
                        const Icon = fieldType.icon
                        return (
                          <button
                            key={fieldType.type}
                            onClick={() => handleFieldTypeClick(fieldType.type)}
                            className={cn(
                              "w-full flex items-center space-x-3 p-3 rounded-lg border-2 transition-all",
                              selectedFieldType === fieldType.type
                                ? "border-green-500 bg-green-50"
                                : "border-gray-200 hover:border-gray-300"
                            )}
                          >
                            <div className={cn("w-8 h-8 rounded flex items-center justify-center text-white", fieldType.color)}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{fieldType.label}</span>
                          </button>
                        )
                      })}
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Roles</h4>
                      <div className="space-y-2">
                        {selectedSigners.map((signer, index) => (
                          <div key={signer.objectId} className="flex items-center space-x-3 p-2 rounded">
                            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium", getAvatarColor(index))}>
                              {getInitials(signer.Name, signer.Email)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{signer.Name || 'User'}</div>
                              <div className="text-xs text-gray-500">{signer.Email}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel - PDF Document */}
                <div className="lg:col-span-3">
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <h3 className="font-medium text-gray-900">{templateData.name || 'Document.pdf'}</h3>
                        <span className="text-sm text-gray-500">Place Fields for Template</span>
                      </div>
                      <button 
                        onClick={handleCancel}
                        className="text-sm text-red-500 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                    
                    <div className="p-4">
                      {templateData.fileUrl ? (
                        <div className="relative border rounded-lg overflow-hidden" style={{ height: '600px' }}>
                          {/* Clean PDF Viewer without field interference */}
                          <div 
                            className="absolute inset-0 cursor-crosshair"
                            onClick={(e) => {
                              if (selectedFieldType) {
                                const rect = e.currentTarget.getBoundingClientRect()
                                const x = e.clientX - rect.left
                                const y = e.clientY - rect.top
                                handleDocumentClick(x, y, 1)
                              }
                            }}
                          >
                            <TemplatePDFViewerWrapper
                              fileUrl={templateData.fileUrl}
                              onFieldPlacement={() => {}}
                              fieldPlacements={[]}
                              selectedFieldType={null}
                              className="w-full h-full pointer-events-none"
                            />
                          </div>

                          {/* Field Overlays */}
                          {fieldPlacements.map((field) => {
                            const assignedSigner = selectedSigners.find(s => s.objectId === field.assignedSigner)
                            const signerIndex = selectedSigners.findIndex(s => s.objectId === field.assignedSigner)
                            
                            return (
                              <div
                                key={field.id}
                                className={cn(
                                  "absolute border-2 border-dashed cursor-pointer group",
                                  getFieldColor(field.type),
                                  "hover:opacity-80"
                                )}
                                style={{
                                  left: field.x,
                                  top: field.y,
                                  width: field.width,
                                  height: field.height,
                                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                  borderColor: '#3b82f6'
                                }}
                                onClick={() => handleFieldClick(field)}
                              >
                                <div className="flex items-center justify-center h-full text-xs font-medium text-blue-600">
                                  {field.type}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeFieldPlacement(field.id)
                                  }}
                                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                                {assignedSigner && (
                                  <div className="absolute -top-6 left-0 flex items-center space-x-1">
                                    <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-white text-xs", getAvatarColor(signerIndex))}>
                                      {getInitials(assignedSigner.Name, assignedSigner.Email)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
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

              {/* Bottom Navigation */}
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

      {/* Signer Selection Modal */}
      {isSignerModalOpen && tempFieldPlacement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Add/Choose signer</h3>
              <button
                onClick={() => setIsSignerModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Choose from contacts</h4>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedSigners.map((signer, index) => (
                  <button
                    key={signer.objectId}
                    onClick={() => handleSignerAssignment(signer.objectId)}
                    className="w-full flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium", getAvatarColor(index))}>
                      {getInitials(signer.Name, signer.Email)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-gray-900">{signer.Name || signer.Email}</div>
                      <div className="text-sm text-gray-500">{signer.Email}</div>
                    </div>
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setIsSignerModalOpen(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {isSignatureModalOpen && selectedField && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">signature-{selectedField.id}<span className="text-red-500">*</span></h3>
              <button
                onClick={() => setIsSignatureModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Signature Type Tabs */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setSignatureType('draw')}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium",
                    signatureType === 'draw' 
                      ? "bg-blue-600 text-white" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  My signature
                </button>
                <button
                  onClick={() => setSignatureType('type')}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium",
                    signatureType === 'type' 
                      ? "bg-blue-600 text-white" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  Draw
                </button>
                <button
                  onClick={() => setSignatureType('upload')}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium",
                    signatureType === 'upload' 
                      ? "bg-blue-600 text-white" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  Upload image
                </button>
                <button
                  onClick={() => setSignatureType('type')}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium",
                    signatureType === 'type' 
                      ? "bg-blue-600 text-white" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  Type
                </button>
              </div>

              {/* Signature Canvas */}
              <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                {signatureType === 'draw' && (
                  <>
                    <SignatureCanvas
                      // @ts-expect-error - Dynamic import ref issue in backup file
                      ref={sigCanvasRef}
                      penColor="blue"
                      canvasProps={{
                        width: 500,
                        height: 200,
                        className: 'sigCanvas border rounded bg-white'
                      }}
                    />
                  </>
                )}
                
                {signatureType === 'type' && (
                  <div className="w-full h-48 border rounded bg-white flex items-center justify-center">
                    <input
                      type="text"
                      value={typedSignature}
                      onChange={(e) => setTypedSignature(e.target.value)}
                      placeholder="Type your signature here"
                      className="text-2xl font-signature text-blue-600 bg-transparent border-none outline-none text-center w-full"
                      style={{ fontFamily: 'cursive' }}
                    />
                  </div>
                )}
              </div>

              {/* Auto sign checkbox */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoSign"
                  className="rounded border-gray-300"
                />
                <label htmlFor="autoSign" className="text-sm text-gray-700">
                  Auto sign all
                </label>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={clearSignature}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Clear
                </button>
                
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">1 of 1 fields left</span>
                  <button
                    onClick={handleSignatureSave}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  )
}