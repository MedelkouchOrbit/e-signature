'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/app/components/auth/AuthGuard'
import { CheckCircle, FileText, X, PenTool, Type, Calendar, Mail, User, Building, RadioIcon, Check, Minus, Move, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TemplateReviewStep } from '@/app/components/templates/TemplateReviewStep'
import { SaveTemplatePopup } from '@/app/components/templates/SaveTemplatePopup'
import dynamic from 'next/dynamic'
import Image from 'next/image'

// Dynamic imports for PDF components to avoid SSR issues
const Document = dynamic(() => import('react-pdf').then(mod => ({ default: mod.Document })), { ssr: false })
const Page = dynamic(() => import('react-pdf').then(mod => ({ default: mod.Page })), { ssr: false })

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  import('react-pdf').then(({ pdfjs }) => {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
  })
}

// Signature Canvas Props Interface
interface SignatureCanvasProps {
  ref?: React.RefObject<SignatureCanvasRef | null>
  penColor?: string
  canvasProps?: {
    width: number
    height: number
    className: string
  }
}

interface SignatureCanvasRef {
  clear: () => void
  toDataURL: () => string
  isEmpty: () => boolean
  getCanvas: () => HTMLCanvasElement
}

// Dynamically import SignatureCanvas to avoid SSR issues  
const SignatureCanvas = dynamic(() => import('react-signature-canvas'), { 
  ssr: false,
  loading: () => <div className="p-4">Loading signature pad...</div>
}) as React.ComponentType<SignatureCanvasProps>

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

interface PlaceholderPage {
  pageNumber: number
  pos: FieldPosition[]
}

interface FieldPosition {
  xPosition: number
  yPosition: number
  isStamp: boolean
  key: number
  scale: number
  zIndex: number
  type: string
  options: {
    name: string
    status: string
  }
  Width: number
  Height: number
}

interface SignerPlaceholder {
  signerPtr: {
    __type: string
    className: string
    objectId: string
  }
  signerObjId: string
  blockColor: string
  Role: string
  Id: number
  placeHolder: PlaceholderPage[]
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

interface DocumentDetails {
  objectId: string
  Name: string
  URL: string
  SignedUrl: string
  Description: string
  Note: string
  Placeholders: SignerPlaceholder[]
  Signers: Signer[]
  SendinOrder: boolean
  AutomaticReminders: boolean
  RemindOnceInEvery: number
  IsEnableOTP: boolean
  IsTourEnabled: boolean
  AllowModifications: boolean
  TimeToCompleteDays: number
  SignatureType: Array<{ name: string; enabled: boolean }>
  NotifyOnSignatures: boolean
  createdAt: string
  updatedAt: string
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
  const sigCanvasRef = useRef<SignatureCanvasRef>(null)
  
  // Signer management states
  const [availableSigners, setAvailableSigners] = useState<Signer[]>([])
  const [selectedSigners, setSelectedSigners] = useState<Signer[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [sessionToken, setSessionToken] = useState<string>('')
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [documentDetails, setDocumentDetails] = useState<DocumentDetails | null>(null)

  // New states for field placement and signature modal
  const [isSignerModalOpen, setIsSignerModalOpen] = useState(false)
  const [tempFieldPlacement, setTempFieldPlacement] = useState<Partial<FieldPlacement> | null>(null)
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false)
  const [selectedField, setSelectedField] = useState<FieldPlacement | null>(null)
  const [signatureType, setSignatureType] = useState<'draw' | 'type' | 'upload'>('draw')
  const [typedSignature, setTypedSignature] = useState('')
  const [showSendConfirmationPopup, setShowSendConfirmationPopup] = useState(false)
  const [signersList, setSignersList] = useState<Signer[]>([])
  
  // New state for signing mode
  const [signingMode, setSigningMode] = useState<'sign_yourself' | 'add_signers'>('add_signers')
  const [showSelfSignModal, setShowSelfSignModal] = useState(false)
  const [selfSignatureData, setSelfSignatureData] = useState<string>('')
  
  // User session states
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [extUserId, setExtUserId] = useState<string>('')
  
  // New states for self-signing interface in step 2
  const [selfSignatureType, setSelfSignatureType] = useState<'draw' | 'type' | 'upload'>('draw')
  const [selfTypedSignature, setSelfTypedSignature] = useState('')
  const [tenantDetails, setTenantDetails] = useState(null)
  
  // PDF viewer states
  const [currentPage, setCurrentPage] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1)

  // Store hooks and form state
  const [templateData, setTemplateData] = useState<CreateTemplateFormData>({
    name: '',
    description: '',
    fileUrl: null,
    sendInOrder: false,
    otpEnabled: false,
  })

  // Fetch signers from API
  const fetchSigners = useCallback(async (search: string = '') => {
    setIsLoading(true)
    try {
      const token = sessionToken || localStorage.getItem('opensign_session_token') || ''
      const response = await fetch('http://94.249.71.89:9000/api/app/functions/getsigners', {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': token,
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
  }, [sessionToken])

  // Load signers on component mount
  useEffect(() => {
    // Get session token from localStorage on component mount
    const token = localStorage.getItem('opensign_session_token') || ''
    setSessionToken(token)
    fetchSigners()
    
    // Get user information from session token
    if (token) {
      fetchUserInfo(token)
    }
  }, [fetchSigners])

  // Fetch user information from session token
  const fetchUserInfo = async (token: string) => {
    try {
      const response = await fetch('http://94.249.71.89:9000/api/app/users/me', {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Content-Type': 'text/plain',
          'Origin': 'http://94.249.71.89:9000',
          'Pragma': 'no-cache',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
        },
        body: JSON.stringify({
          "_method": "GET",
          "_ApplicationId": "opensign",
          "_ClientVersion": "js6.1.1",
          "_InstallationId": "5b57e02d-5015-4c69-bede-06310ad8bae9",
          "_SessionToken": token
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('User info fetched:', data)
        if (data) {
          // Use the fetched user data or fallback to defaults
          setCurrentUserId(data.objectId || 'pyNn9ogqBr')
          setExtUserId(data.ExtUserId || 'ODs8eHFNVW')
          console.log('User ID set to:', data.objectId || '')
          console.log('ExtUserId set to:', data.ExtUserId || '')
        } else {
          // No user data returned, use fallbacks
          setCurrentUserId('')
          setExtUserId('')
        }
      } else {
        console.error('Failed to fetch user info:', response.status, response.statusText)
        // Fallback to default values if API fails
        setCurrentUserId('')
        setExtUserId('')
      }
    } catch (error) {
      console.error('Error fetching user info:', error)
      // Fallback to default values if API fails
      setCurrentUserId('')
      setExtUserId('')
    }
  }

  // Fetch tenant details using userId
  const fetchTenantDetails = useCallback(async (userId: string) => {
    try {
      const token = sessionToken || localStorage.getItem('opensign_session_token') || ''
      const response = await fetch('http://94.249.71.89:9000/api/app/functions/gettenant', {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': token,
        },
        body: JSON.stringify({ 
          userId: userId,
          contactId: undefined // Optional parameter
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Tenant details response:', data)
        
        if (data.result) {
          setTenantDetails(data.result)
          return data.result
        } else {
          console.error('No result in tenant details response')
          return null
        }
      } else {
        console.error('Failed to fetch tenant details:', response.status)
        return null
      }
    } catch (error) {
      console.error('Error fetching tenant details:', error)
      return null
    }
  }, [sessionToken])

  // Fetch tenant details when currentUserId is available
  useEffect(() => {
    if (currentUserId && sessionToken) {
      fetchTenantDetails(currentUserId)
    }
  }, [currentUserId, sessionToken, fetchTenantDetails])

  // Search signers when search term changes
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (sessionToken) {
        fetchSigners(searchTerm)
      }
    }, 300)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm, sessionToken, fetchSigners])

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

  const getFieldTypeConfig = (type: string) => {
    const configs = {
      signature: { bgColor: 'rgba(59, 130, 246, 0.1)', borderColor: '#3b82f6', textColor: '#1d4ed8' },
      initial: { bgColor: 'rgba(34, 197, 94, 0.1)', borderColor: '#22c55e', textColor: '#15803d' },
      name: { bgColor: 'rgba(168, 85, 247, 0.1)', borderColor: '#a855f7', textColor: '#7c3aed' },
      email: { bgColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', textColor: '#dc2626' },
      date: { bgColor: 'rgba(234, 179, 8, 0.1)', borderColor: '#eab308', textColor: '#ca8a04' },
      company: { bgColor: 'rgba(99, 102, 241, 0.1)', borderColor: '#6366f1', textColor: '#4f46e5' },
      text: { bgColor: 'rgba(107, 114, 128, 0.1)', borderColor: '#6b7280', textColor: '#374151' },
      checkbox: { bgColor: 'rgba(34, 197, 94, 0.1)', borderColor: '#22c55e', textColor: '#15803d' },
      radio: { bgColor: 'rgba(249, 115, 22, 0.1)', borderColor: '#f97316', textColor: '#ea580c' },
      dropdown: { bgColor: 'rgba(20, 184, 166, 0.1)', borderColor: '#14b8a6', textColor: '#0f766e' }
    }
    return configs[type as keyof typeof configs] || configs.text
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
      
      if (signingMode === 'sign_yourself') {
        // For self-signing mode, directly place the field and assign to current user
        const finalField: FieldPlacement = {
          ...newField,
          assignedSigner: currentUserId || 'self' // Use current user ID or 'self' as fallback
        } as FieldPlacement
        
        setFieldPlacements(prev => [...prev, finalField])
        
        // If it's a signature field, show signature modal
        if (selectedFieldType === 'signature') {
          setSelectedField(finalField)
          setIsSignatureModalOpen(true)
        }
        
        setSelectedFieldType(null)
      } else {
        // For add_signers mode, open signer selection modal
        setTempFieldPlacement(newField)
        setIsSignerModalOpen(true)
        setSelectedFieldType(null)
      }
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

  // Auto-populate signature modal with Step 2 data for self-signing mode
  useEffect(() => {
    if (isSignatureModalOpen && signingMode === 'sign_yourself') {
      // If we have signature data from Step 2, pre-populate based on the type used
      if (selfSignatureData) {
        // If the signature was drawn or uploaded, use draw mode
        setSignatureType('draw')
        
        // Try to load the signature into the canvas
        if (sigCanvasRef.current) {
          setTimeout(() => {
            try {
              const img = new window.Image()
              img.onload = () => {
                if (sigCanvasRef.current) {
                  const canvas = sigCanvasRef.current.getCanvas()
                  if (canvas) {
                    const ctx = canvas.getContext('2d')
                    if (ctx) {
                      ctx.clearRect(0, 0, canvas.width, canvas.height)
                      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                    }
                  }
                }
              }
              img.src = selfSignatureData
            } catch (error) {
              console.log('Could not load Step 2 signature into canvas:', error)
            }
          }, 100) // Small delay to ensure canvas is ready
        }
      } else if (selfTypedSignature) {
        // If the signature was typed, use type mode and pre-fill
        setSignatureType('type')
        setTypedSignature(selfTypedSignature)
      }
    }
  }, [isSignatureModalOpen, signingMode, selfSignatureData, selfTypedSignature])

  // Get document details API call for Step 4
  const getDocumentDetails = async (docId: string) => {
    try {
      const token = sessionToken || localStorage.getItem('opensign_session_token') || ''
      const response = await fetch('http://94.249.71.89:9000/api/app/functions/getDocument', {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'X-Parse-Application-Id': 'opensign',
          'sessionToken': token,
        },
        body: JSON.stringify({ docId })
      })

      if (response.ok) {
        const data = await response.json()
        setDocumentDetails(data.result || data)
        return data.result || data
      } else {
        console.error('Failed to fetch document details')
        return null
      }
    } catch (error) {
      console.error('Error fetching document details:', error)
      return null
    }
  }

  // Send mail to signers API call
  const sendMailToSigners = async () => {
    try {
      const token = sessionToken || localStorage.getItem('opensign_session_token') || ''
      
      // Send mail to each signer
      for (const signer of selectedSigners) {
        const mailPayload = {
          extUserId: extUserId || "ODs8eHFNVW",
          recipient: signer.Email,
          subject: `superadmin has requested you to sign ${templateData.name || 'Document'}`,
          replyto: "email",
          from: "email",
          html: `<html><head><meta http-equiv='Content-Type' content='text/html; charset=UTF-8' /></head><body><p>Hi ${signer.Name || signer.Email},</p><br><p>We hope this email finds you well. superadmin has requested you to review and sign ${templateData.name || 'Document'}.</p><p>Your signature is crucial to proceed with the next steps as it signifies your agreement and authorization.</p><br><p><a href='http://94.249.71.89:9000/login/${btoa(signer.Email)}' rel='noopener noreferrer' target='_blank'>Sign here</a></p><br><br><p>If you have any questions or need further clarification regarding the document or the signing process, please contact the sender.</p><br><p>Thanks</p><p>Team WatiqaSign™</p><br></body></html>`
        }

        const response = await fetch('http://94.249.71.89:9000/api/app/functions/sendmailv3', {
          method: 'POST',
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'X-Parse-Application-Id': 'opensign',
            'sessionToken': token,
          },
          body: JSON.stringify(mailPayload)
        })

        if (response.ok) {
          console.log(`Mail sent successfully to ${signer.Email}`)
        } else {
          console.error(`Failed to send mail to ${signer.Email}`)
        }
      }
      
      return { status: 'success' }
    } catch (error) {
      console.error('Error sending mails:', error)
      return { status: 'error' }
    }
  }

  const saveTemplate = async () => {
    setIsSaving(true)
    try {
      const token = sessionToken || localStorage.getItem('opensign_session_token') || ''
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
          objectId: extUserId
        },
        CreatedBy: {
          __type: "Pointer",
          className: "_User",
          objectId: currentUserId
        },
        _ApplicationId: "opensign",
        _ClientVersion: "js6.1.1",
        _InstallationId: "5b57e02d-5015-4c69-bede-06310ad8bae9",
        _SessionToken: token
      }

      const response = await fetch('http://94.249.71.89:9000/api/app/classes/contracts_Template', {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'Content-Type': 'text/plain',
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': token,
        },
        body: JSON.stringify(templatePayload)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Template saved successfully:', result)
        
        // Store the template ID for later use
        if (result.objectId) {
          setTemplateId(result.objectId)
        }
        
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

  const formatPlaceholdersForAPI = () => {
    // Group field placements by signer
    const signerGroups: { [key: string]: SignerPlaceholder } = {}
    
    fieldPlacements.forEach(field => {
      if (!field.assignedSigner) return
      
      const signer = selectedSigners.find(s => s.objectId === field.assignedSigner)
      if (!signer) return
      
      if (!signerGroups[field.assignedSigner]) {
        signerGroups[field.assignedSigner] = {
          signerPtr: {
            __type: "Pointer",
            className: "contracts_Contactbook",
            objectId: field.assignedSigner
          },
          signerObjId: field.assignedSigner,
          blockColor: "#93a3db",
          Role: "signer",
          Id: Math.floor(Math.random() * 100000000),
          placeHolder: []
        }
      }
      
      const pageGroup = signerGroups[field.assignedSigner].placeHolder.find(
        (p: PlaceholderPage) => p.pageNumber === field.page
      )
      
      const fieldData: FieldPosition = {
        xPosition: field.x,
        yPosition: field.y,
        isStamp: false,
        key: Math.floor(Math.random() * 100000000),
        scale: 1,
        zIndex: 3,
        type: field.type,
        options: {
          name: `${field.type}-${field.id}`,
          status: field.required ? "required" : "optional"
        },
        Width: field.width,
        Height: field.height
      }
      
      if (pageGroup) {
        pageGroup.pos.push(fieldData)
      } else {
        signerGroups[field.assignedSigner].placeHolder.push({
          pageNumber: field.page,
          pos: [fieldData]
        })
      }
    })
    
    return Object.values(signerGroups)
  }

  const saveFieldPlacements = async () => {
    setIsSaving(true)
    try {
      const token = sessionToken || localStorage.getItem('opensign_session_token') || ''
      let uploadedFileUrl = templateData.fileUrl
      let currentTemplateId = templateId
      
      // For sign yourself mode, we need to create a template first if it doesn't exist
      if (signingMode === 'sign_yourself' && !currentTemplateId) {
        console.log('Creating template for sign yourself mode...')
        
        const templateCreateResponse = await fetch('http://94.249.71.89:9000/api/app/classes/contracts_Template', {
          method: 'POST',
          headers: {
            'Accept': '*/*',
            'Content-Type': 'text/plain',
            'X-Parse-Application-Id': 'opensign',
            'X-Parse-Session-Token': token,
          },
          body: JSON.stringify({
            Name: templateData.name || "Self-Sign Template",
            Description: templateData.description || "Self-signing template",
            Note: "Self-signing template",
            Folder: "Others",
            SignedUrl: "",
            URL: "",
            Type: "Template",
            CreatedBy: {
              __type: "Pointer",
              className: "_User",
              objectId: currentUserId
            },
            ExtUserPtr: {
              __type: "Pointer",
              className: "contracts_Users",
              objectId: extUserId
            },
            Signers: [],
            Placeholders: [],
            SendinOrder: false,
            AutomaticReminders: false,
            RemindOnceInEvery: 5,
            IsEnableOTP: false,
            AllowModifications: false,
            IsTourEnabled: true,
            TimeToCompleteDays: 15,
            SignatureType: [
              {"name": "draw", "enabled": true},
              {"name": "typed", "enabled": true},
              {"name": "upload", "enabled": true},
              {"name": "default", "enabled": true}
            ],
            NotifyOnSignatures: true,
            _ApplicationId: "opensign",
            _ClientVersion: "js6.1.1",
            _InstallationId: "5b57e02d-5015-4c69-bede-06310ad8bae9",
            _SessionToken: token
          })
        })

        if (!templateCreateResponse.ok) {
          throw new Error('Failed to create template for self-signing')
        }

        const templateCreateResult = await templateCreateResponse.json()
        currentTemplateId = templateCreateResult.objectId
        setTemplateId(currentTemplateId)
        console.log('Template created for self-signing:', currentTemplateId)
      }
      
      // If we have a blob URL, we need to upload it first
      if (templateData.fileUrl?.startsWith('blob:')) {
        console.log('Converting blob URL to file...')
        
        // Convert blob URL to blob
        const response = await fetch(templateData.fileUrl)
        const blob = await response.blob()
        
        // Convert blob to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const result = reader.result as string
            // Remove data:application/pdf;base64, prefix
            const base64Data = result.split(',')[1]
            resolve(base64Data)
          }
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
        
        // Generate a proper filename instead of using templateId
        const fileName = templateData.name ? 
          `${templateData.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf` : 
          `template_${Date.now()}.pdf`
        
        // Upload file using the base64 data with proper filename
        const fileUploadResponse = await fetch(`http://94.249.71.89:9000/api/app/files/${fileName}`, {
          method: 'POST',
          headers: {
            'Accept': '*/*',
            'Content-Type': 'text/plain',
            'X-Parse-Application-Id': 'opensign',
            'X-Parse-Session-Token': token,
          },
          body: JSON.stringify({
            base64: base64,
            fileData: {
              metadata: {},
              tags: {}
            },
            _ContentType: "text/plain",
            _ApplicationId: "opensign",
            _ClientVersion: "js6.1.1",
            _InstallationId: "5b57e02d-5015-4c69-bede-06310ad8bae9",
            _SessionToken: token
          })
        })

        if (!fileUploadResponse.ok) {
          throw new Error('Failed to upload file')
        }

        const fileResult = await fileUploadResponse.json()
        uploadedFileUrl = fileResult.url
        console.log('File uploaded successfully:', uploadedFileUrl)
        
        // Call fileupload function with the uploaded URL
        const fileuploadResponse = await fetch('http://94.249.71.89:9000/api/app/functions/fileupload', {
          method: 'POST',
          headers: {
            'Accept': '*/*',
            'Content-Type': 'text/plain',
            'X-Parse-Application-Id': 'opensign',
            'X-Parse-Session-Token': token,
          },
          body: JSON.stringify({
            url: uploadedFileUrl,
            _ApplicationId: "opensign",
            _ClientVersion: "js6.1.1",
            _InstallationId: "5b57e02d-5015-4c69-bede-06310ad8bae9",
            _SessionToken: token
          })
        })

        if (!fileuploadResponse.ok) {
          throw new Error('Failed to process file upload')
        }

        const fileuploadResult = await fileuploadResponse.json()
        console.log('File upload processed:', fileuploadResult)
      }

      // Step 2: Update template with placeholders
      const placeholders = formatPlaceholdersForAPI()
      
      if (!currentTemplateId) {
        throw new Error('Template ID not found. Please save template first.')
      }
      
      const templateUpdateResponse = await fetch(`http://94.249.71.89:9000/api/app/classes/contracts_Template/${currentTemplateId}`, {
        method: 'PUT',
        headers: {
          'Accept': '*/*',
          'Content-Type': 'text/plain',
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': token,
        },
        body: JSON.stringify({
          Placeholders: placeholders,
          Signers: selectedSigners.map(signer => ({
            __type: "Pointer",
            className: "contracts_Contactbook",
            objectId: signer.objectId
          })),
          Name: templateData.name || "New Template",
          Note: "Please review and sign this document",
          Description: templateData.description || "",
          SendinOrder: templateData.sendInOrder || true,
          AutomaticReminders: false,
          RemindOnceInEvery: 5,
          IsEnableOTP: templateData.otpEnabled || false,
          AllowModifications: false,
          IsTourEnabled: true,
          URL: uploadedFileUrl,
          SignatureType: [
            {"name": "draw", "enabled": true},
            {"name": "typed", "enabled": true},
            {"name": "upload", "enabled": true},
            {"name": "default", "enabled": true}
          ],
          NotifyOnSignatures: true,
          TimeToCompleteDays: 15,
          Bcc: selectedSigners.map(signer => ({
            __type: "Pointer",
            className: "contracts_Contactbook",
            objectId: signer.objectId
          }))
          // Removed _method field as it's not needed in the body
        })
      })

      if (!templateUpdateResponse.ok) {
        throw new Error('Failed to update template')
      }

      const templateResult = await templateUpdateResponse.json()
      console.log('Template updated:', templateResult)

      // Step 4: Create document
      const documentResponse = await fetch('http://94.249.71.89:9000/api/app/classes/contracts_Document', {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': token,
        },
        body: JSON.stringify({
          Name: templateData.name || "New Template",
          URL: uploadedFileUrl,
          SignedUrl: uploadedFileUrl,
          Description: templateData.description || "",
          Note: "Please review and sign this document",
          Placeholders: placeholders,
          ExtUserPtr: {
            __type: "Pointer",
            className: "contracts_Users",
            objectId: extUserId
          },
          CreatedBy: {
            __type: "Pointer",
            className: "_User",
            objectId: currentUserId
          },
          Signers: selectedSigners.map(signer => ({
            __type: "Pointer",
            className: "contracts_Contactbook",
            objectId: signer.objectId
          })),
          SendinOrder: templateData.sendInOrder || true,
          AutomaticReminders: false,
          RemindOnceInEvery: 5,
          IsEnableOTP: templateData.otpEnabled || false,
          IsTourEnabled: true,
          AllowModifications: false,
          TimeToCompleteDays: 15,
          SignatureType: [
            {"name": "draw", "enabled": true},
            {"name": "typed", "enabled": true},
            {"name": "upload", "enabled": true},
            {"name": "default", "enabled": true}
          ],
          NotifyOnSignatures: true,
          Bcc: selectedSigners.map(signer => signer), // Full signer objects
          TemplateId: {
            __type: "Pointer",
            className: "contracts_Template",
            objectId: currentTemplateId
          }
        })
      })

      if (!documentResponse.ok) {
        throw new Error('Failed to create document')
      }

      const documentResult = await documentResponse.json()
      console.log('Document created:', documentResult)

      // Store document ID and signers list for later use in Step 4
      if (documentResult.objectId) {
        setDocumentId(documentResult.objectId)
      }
      
      // Store the signers list for the send confirmation popup
      setSignersList(selectedSigners)

      return documentResult

    } catch (error) {
      console.error('Error saving field placements:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  const handleNext = async () => {
    try {
      if (currentStep === 2) {
        // Handle self-signing mode
        if (signingMode === 'sign_yourself') {
          // Capture signature data based on the selected type
          let capturedSignature = ''
          
          if (selfSignatureType === 'draw' && sigCanvasRef.current) {
            if (sigCanvasRef.current.isEmpty()) {
              alert('Please draw your signature before continuing.')
              return
            }
            capturedSignature = sigCanvasRef.current.toDataURL()
          } else if (selfSignatureType === 'type') {
            if (!selfTypedSignature.trim()) {
              alert('Please type your signature before continuing.')
              return
            }
            // Create a simple signature from typed text
            const canvas = document.createElement('canvas')
            canvas.width = 300
            canvas.height = 100
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.font = '36px cursive'
              ctx.fillStyle = 'black'
              ctx.textAlign = 'center'
              ctx.fillText(selfTypedSignature, 150, 60)
              capturedSignature = canvas.toDataURL()
            }
          } else if (selfSignatureType === 'upload') {
            if (!selfSignatureData) {
              alert('Please upload your signature before continuing.')
              return
            }
            capturedSignature = selfSignatureData
          }
          
          if (!capturedSignature) {
            alert('Please provide your signature before continuing.')
            return
          }
          
          // Save signature data locally for the next step
          setSelfSignatureData(capturedSignature)
          
          console.log('Signature captured for self-signing mode')
        }
        
        // Handle add signers mode
        if (signingMode === 'add_signers') {
          if (selectedSigners.length === 0) {
            alert('Please select at least one signer before continuing.')
            return
          }
          
          console.log('Signers selected for add signers mode')
        }
      }
      
      // Step 3: Just validate fields are placed - no backend requests
      if (currentStep === 3) {
        if (fieldPlacements.length === 0) {
          alert('Please place at least one field before continuing.')
          return
        }
        
        console.log('Field placements ready for final submission')
        
        // For self-signing mode, update signature fields with captured signature data
        if (signingMode === 'sign_yourself' && selfSignatureData) {
          setFieldPlacements(prev => prev.map(field => 
            field.type === 'signature' 
              ? { ...field, signed: true, signatureData: selfSignatureData }
              : field
          ))
        }
      }
      
      // Move to next step without any backend requests
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1)
      }
    } catch (error) {
      console.error('Error in handleNext:', error)
      alert('Failed to proceed. Please try again.')
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
    setShowSendConfirmationPopup(true)
  }

  const handleSaveTemplate = async (templateData: { name: string; description?: string }) => {
    try {
      setIsSaving(true)
      console.log('Sending template to signers:', { 
        name: templateData.name, 
        description: templateData.description || '', 
        fieldPlacements, 
        selectedSigners 
      })
      
      // Send mail to all signers
      const mailResult = await sendMailToSigners()
      
      if (mailResult.status === 'success') {
        alert('Template sent successfully to all signers!')
        router.push('/templates')
      } else {
        alert('Failed to send template. Please try again.')
      }
    } catch (error) {
      console.error('Error sending template:', error)
      alert('Failed to send template. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignatureSave = async () => {
    if (!selectedField) return

    try {
      let signatureData = ''
      
      if (signatureType === 'draw' && sigCanvasRef.current) {
        signatureData = sigCanvasRef.current.toDataURL()
      } else if (signatureType === 'type') {
        signatureData = typedSignature
      }

      if (!signatureData) {
        alert('Please provide a signature before saving.')
        return
      }

      console.log('Signature saved locally:', signatureData)
      
      // Close the modal and update the field placement with signature data
      setIsSignatureModalOpen(false)
      setSelectedField(null)
      
      // Update the field placement to indicate it's been signed
      setFieldPlacements(prev => prev.map(field => 
        field.id === selectedField.id 
          ? { ...field, signed: true, signatureData }
          : field
      ))
      
    } catch (error) {
      console.error('Error saving signature:', error)
      alert('Error saving signature. Please try again.')
    }
  }

  const clearSignature = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear()
    }
    setTypedSignature('')
  }

  // Final send function - triggers getTenant and signPdf APIs based on OpenSign pattern
  const handleFinalSend = async () => {
    setIsSaving(true)
    try {
      const token = sessionToken || localStorage.getItem('opensign_session_token') || ''
      
      if (!currentUserId) {
        alert('User authentication failed. Please refresh and try again.')
        return
      }

      // Step 1: Get tenant details (like OpenSign getTenantDetails)
      console.log('Step 1: Getting tenant details...')
      const tenantResponse = await fetch('http://94.249.71.89:9000/api/app/functions/gettenant', {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Content-Type': 'text/plain',
          'Origin': 'http://94.249.71.89:9000',
          'Pragma': 'no-cache',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
        },
        body: JSON.stringify({
          userId: currentUserId,
          _ApplicationId: "opensign",
          _ClientVersion: "js6.1.1",
          _InstallationId: "5b57e02d-5015-4c69-bede-06310ad8bae9",
          _SessionToken: token
        })
      })

      let isCustomCompletionMail = false
      if (tenantResponse.ok) {
        const tenantDetails = await tenantResponse.json()
        console.log('Tenant details:', tenantDetails)
        
        if (tenantDetails?.result?.CompletionBody && tenantDetails?.result?.CompletionSubject) {
          isCustomCompletionMail = true
        }
      } else {
        console.warn('Failed to get tenant details, proceeding without custom completion mail')
      }

      // Step 2: Handle different modes
      if (signingMode === 'sign_yourself') {
        // For self-signing mode, call signPdf API
        console.log('Step 2: Self-signing mode - calling signPdf...')
        
        // Convert PDF to base64
        let pdfBase64 = ''
        if (templateData.fileUrl?.startsWith('blob:')) {
          const response = await fetch(templateData.fileUrl)
          const arrayBuffer = await response.arrayBuffer()
          const uint8Array = new Uint8Array(arrayBuffer)
          const binaryString = uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '')
          pdfBase64 = btoa(binaryString)
        }

        if (!pdfBase64) {
          alert('PDF file could not be processed. Please try again.')
          return
        }

        // Get signature data from field placements
        const signatureField = fieldPlacements.find(field => field.type === 'signature' && field.signatureData)
        let signature = ''
        
        if (signatureField && signatureField.signatureData) {
          // Remove the data:image/png;base64, prefix if present
          signature = signatureField.signatureData.includes(',') 
            ? signatureField.signatureData.split(',')[1] 
            : signatureField.signatureData
        }

        if (!signature) {
          alert('No signature found. Please ensure you have signed the document.')
          return
        }

        // Create a temporary document first (needed for signPdf)
        const createDocResponse = await fetch('http://94.249.71.89:9000/api/app/classes/contracts_Document', {
          method: 'POST',
          headers: {
            'Accept': '*/*',
            'Content-Type': 'text/plain',
            'X-Parse-Application-Id': 'opensign',
            'X-Parse-Session-Token': token,
          },
          body: JSON.stringify({
            Name: templateData.name || `Self-signed document ${new Date().toISOString()}`,
            Description: templateData.description || "Self-signed document",
            Note: "Self-signed via template creation",
            URL: templateData.fileUrl || "",
            CreatedBy: {
              __type: "Pointer",
              className: "_User",
              objectId: currentUserId
            },
            ExtUserPtr: {
              __type: "Pointer",
              className: "contracts_Users",
              objectId: extUserId
            },
            _ApplicationId: "opensign",
            _ClientVersion: "js6.1.1",
            _InstallationId: "5b57e02d-5015-4c69-bede-06310ad8bae9",
            _SessionToken: token
          })
        })

        if (!createDocResponse.ok) {
          throw new Error('Failed to create document for signing')
        }

        const docResult = await createDocResponse.json()
        const documentId = docResult.objectId
        console.log('Document created for signing:', documentId)

        // Call signPdf API following OpenSign pattern
        const signPdfResponse = await fetch('http://94.249.71.89:9000/api/app/functions/signPdf', {
          method: 'POST',
          headers: {
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Content-Type': 'text/plain',
            'Origin': 'http://94.249.71.89:9000',
            'Pragma': 'no-cache',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
          },
          body: JSON.stringify({
            docId: documentId,
            pdfFile: pdfBase64,
            signature: signature,
            isCustomCompletionMail: isCustomCompletionMail.toString(),
            _ApplicationId: "opensign",
            _ClientVersion: "js6.1.1",
            _InstallationId: "5b57e02d-5015-4c69-bede-06310ad8bae9",
            _SessionToken: token
          })
        })

        if (!signPdfResponse.ok) {
          const errorText = await signPdfResponse.text()
          console.error('Failed to sign PDF:', errorText)
          throw new Error(`Failed to sign PDF: ${signPdfResponse.status}`)
        }

        const signPdfResult = await signPdfResponse.json()
        console.log('PDF signed successfully:', signPdfResult)
        
        alert('Document signed successfully!')
        router.push('/templates')

      } else if (signingMode === 'add_signers') {
        // For add signers mode, save template and send to signers
        console.log('Step 2: Add signers mode - saving template and sending emails...')
        
        // Create template and send emails (reuse existing saveTemplate logic but simplified)
        const templateResponse = await fetch('http://94.249.71.89:9000/api/app/classes/contracts_Template', {
          method: 'POST',
          headers: {
            'Accept': '*/*',
            'Content-Type': 'text/plain',
            'X-Parse-Application-Id': 'opensign',
            'X-Parse-Session-Token': token,
          },
          body: JSON.stringify({
            Name: templateData.name || "New Template",
            Description: templateData.description || "",
            Note: "Please review and sign this document",
            URL: templateData.fileUrl,
            CreatedBy: {
              __type: "Pointer",
              className: "_User",
              objectId: currentUserId
            },
            ExtUserPtr: {
              __type: "Pointer",
              className: "contracts_Users",
              objectId: extUserId
            },
            Signers: selectedSigners.map(signer => ({
              __type: "Pointer",
              className: "contracts_Contactbook",
              objectId: signer.objectId
            })),
            SendinOrder: true,
            AutomaticReminders: false,
            RemindOnceInEvery: 5,
            IsEnableOTP: false,
            AllowModifications: false,
            IsTourEnabled: true,
            TimeToCompleteDays: 15,
            SignatureType: [
              {"name": "draw", "enabled": true},
              {"name": "typed", "enabled": true},
              {"name": "upload", "enabled": true},
              {"name": "default", "enabled": true}
            ],
            NotifyOnSignatures: true,
            _ApplicationId: "opensign",
            _ClientVersion: "js6.1.1",
            _InstallationId: "5b57e02d-5015-4c69-bede-06310ad8bae9",
            _SessionToken: token
          })
        })

        if (!templateResponse.ok) {
          throw new Error('Failed to create template')
        }

        const templateResult = await templateResponse.json()
        console.log('Template created:', templateResult)

        // Send emails to signers
        const mailResult = await sendMailToSigners()
        
        if (mailResult.status === 'success') {
          alert('Template saved and sent successfully to all signers!')
          router.push('/templates')
        } else {
          alert('Template saved but failed to send emails. Please try again.')
        }
      }

    } catch (error) {
      console.error('Error in final send:', error)
      alert('Failed to complete the process. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Self-signing handlers
  const handleSelfSign = async () => {
    try {
      if (!templateData.fileUrl) {
        alert('Please upload a PDF file first');
        return;
      }

      const token = sessionToken || localStorage.getItem('opensign_session_token') || ''
      
      // Get signature data
      let signatureData = ''
      if (signatureType === 'draw' && sigCanvasRef.current) {
        signatureData = sigCanvasRef.current.toDataURL()
      } else if (signatureType === 'type') {
        signatureData = typedSignature
      }

      // Validate signature data
      if (!signatureData) {
        alert('Please draw or type your signature before continuing.')
        return
      }

      // Convert PDF file to base64
      let pdfBase64 = ''
      try {
        console.log('Fetching PDF from URL:', templateData.fileUrl)
        const response = await fetch(templateData.fileUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        console.log('PDF arrayBuffer size:', arrayBuffer.byteLength)
        const uint8Array = new Uint8Array(arrayBuffer)
        const binaryString = uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '')
        pdfBase64 = btoa(binaryString)
        console.log('PDF base64 length:', pdfBase64.length)
      } catch (error) {
        console.error('Error converting PDF to base64:', error)
        alert('Error processing PDF file')
        return
      }

      // Validate all required data before making API call
      if (!pdfBase64) {
        alert('PDF file could not be processed. Please try again.')
        return
      }
      
      if (!currentUserId) {
        alert('User authentication failed. Please refresh and try again.')
        return
      }

      if (!token) {
        alert('Session token not found. Please log in again.')
        return
      }

      // First create a document, then sign it
      console.log('Step 1: Creating document record first...')
      
      // Create the document first
      const createDocBody = {
        "Name": templateData.name || `Self-signed document ${new Date().toISOString()}`,
        "Description": templateData.description || "Self-signed document",
        "Note": "Self-signed via template creation",
        "URL": templateData.fileUrl || "",
        "CreatedBy": {
          "__type": "Pointer",
          "className": "_User",
          "objectId": currentUserId
        },
        "_ApplicationId": "opensign",
        "_ClientVersion": "js6.1.1", 
        "_InstallationId": "5b57e02d-5015-4c69-bede-06310ad8bae9",
        "_SessionToken": token
      }

      console.log('Creating document with:', {
        Name: createDocBody.Name,
        CreatedBy: createDocBody.CreatedBy,
        hasToken: !!token
      })

      const createDocResponse = await fetch('http://94.249.71.89:9000/api/app/classes/contracts_Document', {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Content-Type': 'text/plain',
          'Origin': 'http://localhost:3000',
          'Referer': 'http://localhost:3000/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
        },
        body: JSON.stringify(createDocBody)
      })

      if (!createDocResponse.ok) {
        const errorText = await createDocResponse.text()
        console.error('Failed to create document:', {
          status: createDocResponse.status,
          statusText: createDocResponse.statusText,
          errorBody: errorText
        })
        alert(`Failed to create document: ${createDocResponse.status} - ${errorText}`)
        return
      }

      const docResult = await createDocResponse.json()
      console.log('Document created successfully:', docResult)
      
      const documentId = docResult.objectId
      if (!documentId) {
        console.error('No document ID in response:', docResult)
        alert('Document creation failed - no ID returned.')
        return
      }

      console.log('Step 2: Now signing the document with ID:', documentId)

      // Now sign the document using the document ID
      const signPdfBody = {
        "documentId": documentId,
        "pdfFile": pdfBase64,
        "CreatedBy": {
          "__type": "Pointer",
          "className": "_User", 
          "objectId": currentUserId
        },
        "_ApplicationId": "opensign",
        "_ClientVersion": "js6.1.1",
        "_InstallationId": "5b57e02d-5015-4c69-bede-06310ad8bae9",
        "_SessionToken": token
      }

      console.log('Signing document with:', {
        documentId: documentId,
        pdfFile: `[PDF Base64 - ${pdfBase64?.length} chars]`,
        CreatedBy: signPdfBody.CreatedBy,
        hasToken: !!token
      })

      const signPdfResponse = await fetch('http://94.249.71.89:9000/api/app/functions/signPdf', {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Content-Type': 'text/plain',
          'Origin': 'http://localhost:3000',
          'Referer': 'http://localhost:3000/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
        },
        body: JSON.stringify(signPdfBody)
      })

      console.log('SignPdf response status:', signPdfResponse.status)

      if (!signPdfResponse.ok) {
        const errorText = await signPdfResponse.text()
        console.error('Failed to sign PDF:', {
          status: signPdfResponse.status,
          statusText: signPdfResponse.statusText,
          errorBody: errorText,
          documentId: documentId,
          sentUserId: currentUserId
        })
        alert(`Failed to sign PDF: ${signPdfResponse.status} - ${errorText}`)
        return
      }

      const signPdfResult = await signPdfResponse.json()
      console.log('PDF signed successfully:', signPdfResult)

      // Success - store signature data and close modal
      setSelfSignatureData(signatureData)
      setShowSelfSignModal(false)
      
      // Navigate to next step after successful signing
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1)
      }
      
      alert('Document signed and created successfully!')

    } catch (error) {
      console.error('Error in self-signing process:', error)
      alert('Error during signing process. Please try again.')
    }
  }

  const createSelfSignedDocument = async () => {
    try {
      const token = sessionToken || localStorage.getItem('opensign_session_token') || ''
      
      // Create document with self-signature
      const response = await fetch('http://94.249.71.89:9000/api/app/classes/contracts_Document', {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Content-Type': 'text/plain',
          'Origin': 'http://94.249.71.89:9000',
          'Pragma': 'no-cache',
          'Referer': 'http://94.249.71.89:9000/form/sHAnZphf69',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
        },
        body: JSON.stringify({
          ExtUserPtr: {
            __type: "Pointer",
            className: "contracts_Users",
            objectId: extUserId
          },
          Name: templateData.name || new Date().toISOString().replace('T', ' ').slice(0, 19),
          Description: templateData.description || "",
          Note: "Note to myself",
          URL: templateData.fileUrl,
          CreatedBy: {
            __type: "Pointer",
            className: "_User",
            objectId: currentUserId
          },
          _ApplicationId: "opensign",
          _ClientVersion: "js6.1.1",
          _InstallationId: "5b57e02d-5015-4c69-bede-06310ad8bae9",
          _SessionToken: token
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Self-signed document created:', result)
        alert('Document created and signed successfully!')
        router.push('/templates')
      } else {
        console.error('Failed to create self-signed document')
      }
    } catch (error) {
      console.error('Error creating self-signed document:', error)
    }
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
              
              <div className="p-8 bg-white border rounded-lg">
                <div className="text-center">
                  <div className="p-12 transition-colors border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400">
                    <div className="space-y-6">
                      <FileText className="w-16 h-16 mx-auto text-gray-400" />
                      
                      <div>
                        <h3 className="mb-2 text-lg font-medium text-gray-900">Add document</h3>
                        <p className="text-sm text-gray-500">Drag & drop your document here</p>
                      </div>
                      
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => document.getElementById('file-upload')?.click()}
                          className="inline-flex items-center px-6 py-3 space-x-2 font-medium text-white transition-colors bg-green-500 rounded-lg hover:bg-green-600"
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
                    <div className="p-4 mt-6 border border-green-200 rounded-lg bg-green-50">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Document uploaded successfully</span>
                      </div>
                    </div>
                  )}
                  
                  {templateData.fileUrl && (
                    <div className="p-4 mt-4 border rounded-lg bg-gray-50">
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
                  <div className="overflow-hidden bg-white border rounded-lg">
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
                        <div className="overflow-hidden border rounded-lg" style={{ height: '600px' }}>
                          <iframe
                            src={templateData.fileUrl}
                            className="w-full h-full border-0"
                            title="PDF Preview"
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
                  <div className="p-6 space-y-6 bg-white border rounded-lg">
                    <div>
                      <h3 className="mb-4 text-lg font-medium text-gray-900">Signing Options</h3>
                      <p className="mb-6 text-sm text-gray-600">Choose how the document will be signed</p>
                    </div>

                    {/* Radio Button for Signing Mode */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="sign_yourself"
                          name="signingMode"
                          value="sign_yourself"
                          checked={signingMode === 'sign_yourself'}
                          onChange={(e) => setSigningMode(e.target.value as 'sign_yourself' | 'add_signers')}
                          className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                        />
                        <label htmlFor="sign_yourself" className="text-sm font-medium text-gray-900">
                          Sign yourself
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="add_signers"
                          name="signingMode"
                          value="add_signers"
                          checked={signingMode === 'add_signers'}
                          onChange={(e) => setSigningMode(e.target.value as 'sign_yourself' | 'add_signers')}
                          className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                        />
                        <label htmlFor="add_signers" className="text-sm font-medium text-gray-900">
                          Add Signers
                        </label>
                      </div>
                    </div>

                    {/* Self-Signing Section */}
                    {signingMode === 'sign_yourself' && (
                      <div className="pt-4 space-y-4 border-t">
                        <div>
                          <h4 className="mb-4 text-lg font-medium text-gray-900">Signature</h4>
                          
                          {/* Signature Type Tabs */}
                          <div className="flex mb-4 space-x-1">
                            <button
                              onClick={() => setSelfSignatureType('draw')}
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                selfSignatureType === 'draw'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              Draw
                            </button>
                            <button
                              onClick={() => setSelfSignatureType('type')}
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                selfSignatureType === 'type'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              Type
                            </button>
                            <button
                              onClick={() => setSelfSignatureType('upload')}
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                selfSignatureType === 'upload'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              Upload
                            </button>
                          </div>

                          {/* Signature Canvas/Input Area */}
                          <div className="relative">
                            {selfSignatureType === 'draw' && (
                              <div className="p-4 border-2 border-gray-300 border-dashed rounded-lg">
                                <div className="relative">
                                  <SignatureCanvas
                                    ref={sigCanvasRef}
                                    penColor="black"
                                    canvasProps={{
                                      width: 300,
                                      height: 150,
                                      className: "border-0 w-full"
                                    }}
                                  />
                                  <button
                                    onClick={() => {
                                      if (sigCanvasRef.current) {
                                        sigCanvasRef.current.clear()
                                      }
                                    }}
                                    className="absolute text-sm text-gray-400 top-2 right-2 hover:text-gray-600"
                                  >
                                    Clear
                                  </button>
                                </div>
                                <p className="mt-2 text-sm text-center text-gray-500">
                                  Draw or type name here
                                </p>
                              </div>
                            )}

                            {selfSignatureType === 'type' && (
                              <div className="p-4 border-2 border-gray-300 border-dashed rounded-lg">
                                <input
                                  type="text"
                                  value={selfTypedSignature}
                                  onChange={(e) => setSelfTypedSignature(e.target.value)}
                                  placeholder="Type your name here"
                                  className="w-full p-3 text-2xl text-center border-0 font-script focus:outline-none"
                                  style={{ fontFamily: 'cursive' }}
                                />
                                <p className="mt-2 text-sm text-center text-gray-500">
                                  Type your name above
                                </p>
                              </div>
                            )}

                            {selfSignatureType === 'upload' && (
                              <div className="p-8 text-center border-2 border-gray-300 border-dashed rounded-lg">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  id="signature-upload"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      const reader = new FileReader()
                                      reader.onload = (event) => {
                                        setSelfSignatureData(event.target?.result as string)
                                      }
                                      reader.readAsDataURL(file)
                                    }
                                  }}
                                />
                                <label htmlFor="signature-upload" className="cursor-pointer">
                                  <div className="text-gray-400 hover:text-gray-600">
                                    <Upload className="w-8 h-8 mx-auto mb-2" />
                                    <p className="text-sm">Click to upload signature image</p>
                                  </div>
                                </label>
                                {selfSignatureData && (
                                  <div className="mt-4">
                                    <Image 
                                      src={selfSignatureData} 
                                      alt="Uploaded signature" 
                                      width={100}
                                      height={50}
                                      className="mx-auto max-h-20"
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Add Signers Section */}
                    {signingMode === 'add_signers' && (
                      <div className="pt-4 border-t">
                        <h4 className="mb-3 text-sm font-medium text-gray-900">Assignees</h4>
                        <div className="space-y-3">
                          {selectedSigners.map((signer, index) => (
                            <div key={signer.objectId} className="flex items-center p-3 space-x-3 border border-gray-200 rounded-lg">
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
                              className="flex items-center justify-center w-8 h-8 text-gray-400 border-2 border-gray-300 border-dashed rounded-full hover:border-gray-400"
                            >
                              <span className="text-lg">+</span>
                            </button>

                            {isDropdownOpen && (
                              <div className="absolute left-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg top-10 w-80">
                                <div className="p-3 border-b">
                                  <input
                                    type="text"
                                    placeholder="Search signers..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                  />
                                </div>
                                
                                <div className="overflow-y-auto max-h-60">
                                  {isLoading ? (
                                    <div className="p-4 text-center text-gray-500">Loading...</div>
                                  ) : filteredSigners.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">No signers found</div>
                                  ) : (
                                    filteredSigners.map((signer, index) => (
                                      <div
                                        key={signer.objectId}
                                        onClick={() => toggleSigner(signer)}
                                        className="flex items-center p-3 space-x-3 cursor-pointer hover:bg-gray-50"
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
                    )}

                    {/* Order of Signers - only show for add_signers mode */}
                    {signingMode === 'add_signers' && selectedSigners.length > 0 && (
                      <div className="pt-4 border-t">
                        <h4 className="mb-3 text-sm font-medium text-gray-900">Order of Signers</h4>
                        
                        <div className="space-y-2">
                          {selectedSigners.map((signer, index) => (
                            <div key={signer.objectId} className="flex items-center p-3 space-x-3 border border-gray-200 rounded-lg">
                              <div className="flex items-center justify-center w-6 h-6 text-xs text-gray-600 bg-gray-200 rounded-full">
                                {String(index + 1).padStart(2, '0')}
                              </div>
                              <div className={`w-6 h-6 ${getAvatarColor(index)} rounded-full flex items-center justify-center text-white text-xs font-medium`}>
                                {getInitials(signer.Name, signer.Email)}
                              </div>
                              <span className="flex-1 text-sm text-gray-700">{signer.Email}</span>
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
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <button
                        onClick={handleNext}
                        disabled={(signingMode === 'add_signers' && selectedSigners.length === 0) || isSaving}
                        className="flex items-center justify-center w-full px-4 py-2 text-white transition-colors bg-green-500 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <>
                            <svg className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
            </div>
          )}

          {/* Step 3: Place Fields */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Place Fields for Template</h2>
              
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                {/* Left Panel - Widgets */}
                <div className="lg:col-span-1">
                  <div className="p-4 space-y-4 bg-white border rounded-lg">
                    <div>
                      <h3 className="mb-2 text-lg font-medium text-gray-900">Widgets</h3>
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

                    {/* Roles Section - only show for add_signers mode */}
                    {signingMode === 'add_signers' && selectedSigners.length > 0 && (
                      <div className="pt-4 border-t">
                        <h4 className="mb-3 text-sm font-medium text-gray-900">Roles</h4>
                        <div className="space-y-2">
                          {selectedSigners.map((signer, index) => (
                            <div key={signer.objectId} className="flex items-center p-2 space-x-3 rounded">
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
                    )}

                    {/* Current User Display - only show for sign_yourself mode */}
                    {signingMode === 'sign_yourself' && (
                      <div className="pt-4 border-t">
                        <h4 className="mb-3 text-sm font-medium text-gray-900">Signer</h4>
                        <div className="flex items-center p-2 space-x-3 rounded">
                          <div className="flex items-center justify-center w-6 h-6 text-xs font-medium text-white bg-blue-500 rounded-full">
                            ME
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">You</div>
                            <div className="text-xs text-gray-500">Self-signing mode</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel - PDF Document */}
                <div className="lg:col-span-3">
                  <div className="overflow-hidden bg-white border rounded-lg">
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
                        <div className="relative overflow-hidden border rounded-lg" style={{ height: '600px' }}>
                          {/* Clean PDF viewer using react-pdf */}
                          <div className="absolute inset-0 overflow-auto bg-gray-100">
                            <div 
                              className="relative flex justify-center p-4"
                              onClick={(e) => {
                                if (selectedFieldType && e.target === e.currentTarget) {
                                  const rect = e.currentTarget.getBoundingClientRect()
                                  const x = e.clientX - rect.left
                                  const y = e.clientY - rect.top
                                  handleDocumentClick(x, y, currentPage)
                                }
                              }}
                            >
                              <Document 
                                file={templateData.fileUrl}
                                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                loading={<div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading PDF...</div></div>}
                              >
                                <div className="relative bg-white shadow-lg">
                                  <Page 
                                    pageNumber={currentPage}
                                    scale={scale}
                                    className="relative"
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    onClick={(e) => {
                                      if (selectedFieldType) {
                                        const rect = e.currentTarget.getBoundingClientRect()
                                        const x = e.clientX - rect.left
                                        const y = e.clientY - rect.top
                                        handleDocumentClick(x, y, currentPage)
                                      }
                                    }}
                                  />

                                  {/* Field Overlays - Only for current page */}
                                  {fieldPlacements
                                    .filter(field => field.page === currentPage)
                                    .map((field) => {
                                      const assignedSigner = selectedSigners.find(s => s.objectId === field.assignedSigner)
                                      const signerIndex = selectedSigners.findIndex(s => s.objectId === field.assignedSigner)
                                      
                                      return (
                                        <div
                                          key={field.id}
                                          className="absolute transition-all border-2 border-dashed cursor-pointer group hover:shadow-md"
                                          style={{
                                            left: field.x * scale,
                                            top: field.y * scale,
                                            width: field.width * scale,
                                            height: field.height * scale,
                                            backgroundColor: field.type === 'signature' && field.signatureData 
                                              ? 'rgba(255, 255, 255, 0.9)' 
                                              : getFieldTypeConfig(field.type).bgColor,
                                            borderColor: getFieldTypeConfig(field.type).borderColor,
                                          }}
                                          onClick={() => handleFieldClick(field)}
                                        >
                                          <div className="flex items-center justify-center h-full text-xs font-medium" style={{ color: getFieldTypeConfig(field.type).textColor }}>
                                            {field.type === 'signature' && field.signatureData ? (
                                              <img
                                                src={field.signatureData}
                                                alt="signature"
                                                className="object-contain w-full h-full"
                                                style={{ maxWidth: '100%', maxHeight: '100%' }}
                                              />
                                            ) : (
                                              field.type
                                            )}
                                          </div>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              removeFieldPlacement(field.id)
                                            }}
                                            className="absolute flex items-center justify-center w-6 h-6 text-white transition-opacity bg-red-500 rounded-full opacity-0 -top-2 -right-2 group-hover:opacity-100"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                          {assignedSigner && (
                                            <div className="absolute left-0 flex items-center space-x-1 -top-6">
                                              <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-white text-xs", getAvatarColor(signerIndex))}>
                                                {getInitials(assignedSigner.Name, assignedSigner.Email)}
                                              </div>
                                              <span className="px-1 text-xs text-gray-700 bg-white rounded">{assignedSigner.Name}</span>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                </div>
                              </Document>
                            </div>

                            {/* PDF Navigation Controls */}
                            <div className="absolute flex items-center px-4 py-2 space-x-4 transform -translate-x-1/2 bg-white border rounded-lg shadow-sm bottom-4 left-1/2">
                              <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage <= 1}
                                className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <span className="text-sm">Page {currentPage} of {numPages}</span>
                              <button
                                onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                                disabled={currentPage >= numPages}
                                className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                              <div className="w-px h-4 bg-gray-300"></div>
                              <button
                                onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                                className="p-1 rounded hover:bg-gray-100"
                              >
                                <ZoomOut className="w-4 h-4" />
                              </button>
                              <span className="text-sm">{Math.round(scale * 100)}%</span>
                              <button
                                onClick={() => setScale(Math.min(2, scale + 0.1))}
                                className="p-1 rounded hover:bg-gray-100"
                              >
                                <ZoomIn className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
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
                  onClick={() => setCurrentStep(4)}
                  className="px-6 py-2 font-medium text-white transition-colors bg-green-500 rounded-md hover:bg-green-600"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review & Finish */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Review & Finish</h2>
              
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                {/* Left Panel - Summary */}
                <div className="lg:col-span-1">
                  <div className="p-4 space-y-4 bg-white border rounded-lg">
                    <div>
                      <h3 className="mb-2 text-lg font-medium text-gray-900">Summary</h3>
                      <p className="text-sm text-gray-600">Review your template before {signingMode === 'sign_yourself' ? 'saving' : 'sending'}</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Document</label>
                        <p className="text-sm text-gray-900">{templateData.name || 'Document.pdf'}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700">Mode</label>
                        <p className="text-sm text-gray-900">
                          {signingMode === 'sign_yourself' ? 'Self-Signing' : 'Multiple Signers'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700">Fields Placed</label>
                        <p className="text-sm text-gray-900">{fieldPlacements.length} field{fieldPlacements.length !== 1 ? 's' : ''}</p>
                      </div>

                      {signingMode === 'add_signers' && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Signers</label>
                          <div className="space-y-1">
                            {selectedSigners.map((signer, index) => (
                              <div key={signer.objectId} className="flex items-center space-x-2">
                                <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-white text-xs", getAvatarColor(index))}>
                                  {getInitials(signer.Name, signer.Email)}
                                </div>
                                <span className="text-sm text-gray-700">{signer.Name || signer.Email}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {signingMode === 'sign_yourself' && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Your Signature</label>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center justify-center w-4 h-4 text-xs text-white bg-blue-500 rounded-full">
                              ✓
                            </div>
                            <span className="text-sm text-gray-700">Ready to sign</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Panel - PDF Preview (same as Step 3) */}
                <div className="lg:col-span-3">
                  <div className="overflow-hidden bg-white border rounded-lg">
                    <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <h3 className="font-medium text-gray-900">{templateData.name || 'Document.pdf'}</h3>
                        <span className="text-sm text-gray-500">Final Review</span>
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
                        <div className="relative overflow-hidden border rounded-lg" style={{ height: '600px' }}>
                          {/* Same PDF viewer as Step 3 but read-only */}
                          <div className="absolute inset-0 overflow-auto bg-gray-100">
                            <div className="relative flex justify-center p-4">
                              <Document 
                                file={templateData.fileUrl}
                                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                loading={<div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading PDF...</div></div>}
                              >
                                <div className="relative bg-white shadow-lg">
                                  <Page 
                                    pageNumber={currentPage}
                                    scale={scale}
                                    className="relative"
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                  />

                                  {/* Field Overlays - Read-only view with completed content */}
                                  {fieldPlacements
                                    .filter(field => field.page === currentPage)
                                    .map((field) => {
                                      const assignedSigner = selectedSigners.find(s => s.objectId === field.assignedSigner)
                                      const signerIndex = selectedSigners.findIndex(s => s.objectId === field.assignedSigner)
                                      
                                      return (
                                        <div
                                          key={field.id}
                                          className="absolute border-2 border-solid"
                                          style={{
                                            left: field.x * scale,
                                            top: field.y * scale,
                                            width: field.width * scale,
                                            height: field.height * scale,
                                            backgroundColor: field.type === 'signature' && field.signatureData 
                                              ? 'rgba(255, 255, 255, 0.9)' 
                                              : getFieldTypeConfig(field.type).bgColor,
                                            borderColor: field.type === 'signature' && field.signatureData
                                              ? '#22c55e'
                                              : getFieldTypeConfig(field.type).borderColor,
                                          }}
                                        >
                                          <div className="flex items-center justify-center h-full text-xs font-medium" style={{ color: getFieldTypeConfig(field.type).textColor }}>
                                            {field.type === 'signature' && field.signatureData ? (
                                              <img
                                                src={field.signatureData}
                                                alt="signature"
                                                className="object-contain w-full h-full"
                                                style={{ maxWidth: '100%', maxHeight: '100%' }}
                                              />
                                            ) : (
                                              field.type
                                            )}
                                          </div>
                                          
                                          {/* Status indicator for completed fields */}
                                          {field.type === 'signature' && field.signatureData && (
                                            <div className="absolute flex items-center justify-center w-6 h-6 text-white bg-green-500 rounded-full -top-2 -right-2">
                                              <CheckCircle className="w-4 h-4" />
                                            </div>
                                          )}
                                          
                                          {assignedSigner && (
                                            <div className="absolute left-0 flex items-center space-x-1 -top-6">
                                              <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-white text-xs", getAvatarColor(signerIndex))}>
                                                {getInitials(assignedSigner.Name, assignedSigner.Email)}
                                              </div>
                                              <span className="px-1 text-xs text-gray-700 bg-white rounded">{assignedSigner.Name}</span>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                </div>
                              </Document>
                            </div>

                            {/* PDF Navigation Controls */}
                            <div className="absolute flex items-center px-4 py-2 space-x-4 transform -translate-x-1/2 bg-white border rounded-lg shadow-sm bottom-4 left-1/2">
                              <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage <= 1}
                                className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <span className="text-sm">Page {currentPage} of {numPages}</span>
                              <button
                                onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                                disabled={currentPage >= numPages}
                                className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                              <div className="w-px h-4 bg-gray-300"></div>
                              <button
                                onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                                className="p-1 rounded hover:bg-gray-100"
                              >
                                <ZoomOut className="w-4 h-4" />
                              </button>
                              <span className="text-sm">{Math.round(scale * 100)}%</span>
                              <button
                                onClick={() => setScale(Math.min(2, scale + 0.1))}
                                className="p-1 rounded hover:bg-gray-100"
                              >
                                <ZoomIn className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
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
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-2 font-medium text-gray-600 transition-colors border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  ← Back
                </button>
                <button
                  onClick={handleFinalSend}
                  disabled={isSaving}
                  className="px-8 py-2 font-medium text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <svg className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {signingMode === 'sign_yourself' ? 'Saving...' : 'Sending...'}
                    </>
                  ) : (
                    signingMode === 'sign_yourself' ? 'Save' : 'Send'
                  )}
                </button>
              </div>
            </div>
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

      {/* Send Confirmation Popup */}
      {showSendConfirmationPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 mx-4 bg-white rounded-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Send Mail</h2>
              <button
                onClick={() => setShowSendConfirmationPopup(false)}
                className="text-gray-400 transition-colors hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <p className="text-gray-700">
                Are you sure you want to send out this document for signatures?
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={async () => {
                    try {
                      setIsSaving(true)
                      const mailResult = await sendMailToSigners()
                      
                      if (mailResult.status === 'success') {
                        setShowSendConfirmationPopup(false)
                        alert('Document sent successfully to all signers!')
                        router.push('/templates')
                      } else {
                        alert('Failed to send document. Please try again.')
                      }
                    } catch (error) {
                      console.error('Error sending document:', error)
                      alert('Failed to send document. Please try again.')
                    } finally {
                      setIsSaving(false)
                    }
                  }}
                  disabled={isSaving}
                  className="px-8 py-3 font-medium text-white transition-colors bg-blue-600 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Sending...' : 'Send'}
                </button>
                
                <button
                  onClick={() => {
                    // TODO: Implement customize email functionality
                    console.log('Customize email clicked')
                  }}
                  className="font-medium text-left text-red-500 transition-colors hover:text-red-600"
                >
                  Customize email
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-300"></div>
                <span className="text-sm font-medium text-gray-500">OR</span>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>

              {/* Signers List */}
              <div className="space-y-3">
                {signersList.map((signer, index) => (
                  <div key={signer.objectId} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium",
                        getAvatarColor(index)
                      )}>
                        {getInitials(signer.Name, signer.Email)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {signer.Name || signer.Email}
                        </p>
                        <p className="text-xs text-gray-500">{signer.Email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        // Copy individual signer link to clipboard
                        const signerLink = `http://94.249.71.89:9000/login/${btoa(signer.Email)}`
                        navigator.clipboard.writeText(signerLink).then(() => {
                          alert('Link copied to clipboard!')
                        }).catch(err => {
                          console.error('Failed to copy link:', err)
                        })
                      }}
                      className="flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy link
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signer Selection Modal */}
      {isSignerModalOpen && tempFieldPlacement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-w-full p-6 bg-white rounded-lg w-96">
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
              
              <div className="space-y-2 overflow-y-auto max-h-60">
                {selectedSigners.map((signer, index) => (
                  <button
                    key={signer.objectId}
                    onClick={() => handleSignerAssignment(signer.objectId)}
                    className="flex items-center w-full p-3 space-x-3 border border-gray-200 rounded-lg hover:bg-gray-50"
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
                className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {isSignatureModalOpen && selectedField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
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
              <div className="p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
                {signatureType === 'draw' && (
                  <div className="space-y-3">
                    {/* Show Step 2 signature if available for self-signing mode */}
                    {signingMode === 'sign_yourself' && selfSignatureData && (
                      <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-900">Signature from Step 2</p>
                            <p className="text-xs text-blue-700">Your signature from the template settings</p>
                          </div>
                          <button
                            onClick={() => {
                              // Use the signature from Step 2
                              if (sigCanvasRef.current) {
                                // Clear current canvas and set the Step 2 signature
                                sigCanvasRef.current.clear()
                                // We'll handle setting the signature in the canvas
                                const img = new window.Image()
                                img.onload = () => {
                                  const canvas = sigCanvasRef.current?.getCanvas()
                                  if (canvas) {
                                    const ctx = canvas.getContext('2d')
                                    if (ctx) {
                                      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                                    }
                                  }
                                }
                                img.src = selfSignatureData
                              }
                            }}
                            className="px-3 py-1 text-sm text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                          >
                            Use This Signature
                          </button>
                        </div>
                        <div className="mt-2">
                          <Image
                            src={selfSignatureData}
                            alt="Step 2 signature"
                            width={100}
                            height={50}
                            className="border rounded max-h-12"
                          />
                        </div>
                      </div>
                    )}
                    
                    <SignatureCanvas
                      ref={sigCanvasRef}
                      penColor="blue"
                      canvasProps={{
                        width: 500,
                        height: 200,
                        className: 'sigCanvas border rounded bg-white'
                      }}
                    />
                  </div>
                )}
                
                {signatureType === 'type' && (
                  <div className="space-y-3">
                    {/* Show Step 2 typed signature if available for self-signing mode */}
                    {signingMode === 'sign_yourself' && selfTypedSignature && (
                      <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-900">Typed signature from Step 2</p>
                            <p className="text-xs text-blue-700 font-cursive" style={{ fontFamily: 'cursive' }}>
                              {selfTypedSignature}
                            </p>
                          </div>
                          <button
                            onClick={() => setTypedSignature(selfTypedSignature)}
                            className="px-3 py-1 text-sm text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                          >
                            Use This
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-center w-full h-48 bg-white border rounded">
                      <input
                        type="text"
                        value={typedSignature}
                        onChange={(e) => setTypedSignature(e.target.value)}
                        placeholder="Type your signature here"
                        className="w-full text-2xl text-center text-blue-600 bg-transparent border-none outline-none font-signature"
                        style={{ fontFamily: 'cursive' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Auto sign checkbox */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoSign"
                  className="border-gray-300 rounded"
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
                    className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Self-Signing Modal */}
      {showSelfSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Sign Document</h2>
              <button
                onClick={() => setShowSelfSignModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Signature Field */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Signature
                </label>
                
                {/* Signature Type Tabs */}
                <div className="flex p-1 mb-4 space-x-1 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => setSignatureType('draw')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      signatureType === 'draw'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Draw
                  </button>
                  <button
                    onClick={() => setSignatureType('type')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      signatureType === 'type'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Type
                  </button>
                  <button
                    onClick={() => setSignatureType('upload')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      signatureType === 'upload'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Upload
                  </button>
                </div>

                {/* Signature Canvas */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white min-h-[200px] flex items-center justify-center">
                  {signatureType === 'draw' && (
                    <div className="relative w-full h-full">
                      <SignatureCanvas
                        ref={sigCanvasRef}
                        penColor="black"
                        canvasProps={{
                          width: 600,
                          height: 200,
                          className: 'w-full h-full'
                        }}
                      />
                      <div className="absolute bottom-2 right-2">
                        <button
                          onClick={clearSignature}
                          className="px-3 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {signatureType === 'type' && (
                    <div className="w-full p-4">
                      <input
                        type="text"
                        value={typedSignature}
                        onChange={(e) => setTypedSignature(e.target.value)}
                        placeholder="Type your name here"
                        className="w-full px-3 py-2 text-2xl bg-transparent border-none outline-none font-script"
                        style={{ fontFamily: 'Dancing Script, cursive' }}
                      />
                    </div>
                  )}
                  
                  {signatureType === 'upload' && (
                    <div className="p-8 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="signature-upload"
                      />
                      <label
                        htmlFor="signature-upload"
                        className="text-gray-600 cursor-pointer hover:text-gray-900"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-gray-100 rounded-full">
                            <Upload className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-sm font-medium">Click to upload signature</span>
                            <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                          </div>
                        </div>
                      </label>
                    </div>
                  )}
                  
                  {signatureType !== 'upload' && (signatureType === 'draw' ? !sigCanvasRef.current?.isEmpty() : typedSignature) && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {signatureType === 'type' && (
                        <span className="text-2xl font-script" style={{ fontFamily: 'Dancing Script, cursive' }}>
                          {typedSignature}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <p className="mt-2 text-xs text-gray-500">
                  Draw or type name here
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end pt-6 space-x-3 border-t">
                <button
                  onClick={() => setShowSelfSignModal(false)}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSelfSign}
                  className="px-8 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  )
}