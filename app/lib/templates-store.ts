"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TemplateField {
  id: string
  type: 'signature' | 'initials' | 'text' | 'date' | 'email' | 'name' | 'company' | 'checkbox' | 'dropdown' | 'image'
  label: string
  required: boolean
  width: number
  height: number
  x: number
  y: number
  page: number
  defaultValue?: string
  options?: string[] // For dropdown
  signerRole?: string
  signerIndex?: number
}

export interface TemplateSigner {
  id: string
  role: string
  name?: string
  email?: string
  color: string
  order: number
  status: 'pending' | 'waiting' | 'signed' | 'declined'
  signedAt?: string
  canSign?: boolean // Computed based on order and sendInOrder
}

export interface Template {
  id: string
  name: string
  description?: string
  url?: string
  fileName?: string
  status: 'draft' | 'active' | 'archived'
  createdAt: string
  updatedAt: string
  createdBy: string
  fields: TemplateField[]
  signers: TemplateSigner[]
  sendInOrder: boolean
  otpEnabled: boolean
  tourEnabled: boolean
  reminderEnabled: boolean
  reminderInterval: number
  completionDays: number
  redirectUrl?: string
  bcc: string[]
  allowModifications: boolean
}

// Utility function to calculate signing permissions based on order
export const calculateSigningPermissions = (template: Template): Template => {
  if (!template.sendInOrder) {
    // If not sending in order, everyone can sign
    return {
      ...template,
      signers: template.signers.map(signer => ({
        ...signer,
        canSign: signer.status === 'pending'
      }))
    }
  }

  // If sending in order, only the first pending signer can sign
  const sortedSigners = [...template.signers].sort((a, b) => a.order - b.order)
  let canSignNext = true

  const updatedSigners = sortedSigners.map(signer => {
    if (signer.status === 'signed') {
      return { ...signer, canSign: false }
    }
    
    if (signer.status === 'pending' && canSignNext) {
      canSignNext = false // Only the first pending signer can sign
      return { ...signer, canSign: true, status: 'pending' as const }
    }
    
    // All other pending signers must wait
    return { 
      ...signer, 
      canSign: false, 
      status: signer.status === 'pending' ? 'waiting' as const : signer.status 
    }
  })

  return {
    ...template,
    signers: updatedSigners
  }
}

// Request types for API
export interface CreateTemplateRequest {
  name: string
  description?: string
  url?: string
  fileName?: string
  fields: TemplateField[]
  signers: TemplateSigner[]
  sendInOrder?: boolean
  otpEnabled?: boolean
  tourEnabled?: boolean
  reminderEnabled?: boolean
  reminderInterval?: number
  completionDays?: number
  redirectUrl?: string
  bcc?: string[]
  allowModifications?: boolean
}

export interface UpdateTemplateRequest extends Partial<CreateTemplateRequest> {
  id: string
}

// Response types
export interface TemplateListResponse {
  results: Template[]
  count: number
}

// Store state interface
interface TemplatesState {
  templates: Template[]
  currentTemplate: Template | null
  isLoading: boolean
  isUploading: boolean
  uploadProgress: number
  uploadError: string | null
  error: string | null

  // Actions
  setTemplates: (templates: Template[]) => void
  addTemplate: (template: Template) => void
  createTemplate: (templateData: Partial<Template>) => Promise<Template>
  updateTemplate: (id: string, updates: Partial<Template>) => void
  deleteTemplate: (id: string) => void
  setCurrentTemplate: (template: Template | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Upload functionality (following documents-store pattern)
  uploadTemplate: (file: File, metadata?: {
    name?: string
    description?: string
    note?: string
    sendInOrder?: boolean
    otpEnabled?: boolean
  }) => Promise<string>
  clearUploadError: () => void
  
  // Save functionality
  saveTemplate: (templateData: {
    name: string
    description?: string
    fileUrl: string
    fileName: string
    fields: TemplateField[]
    signers: TemplateSigner[]
    sendInOrder?: boolean
    otpEnabled?: boolean
    tourEnabled?: boolean
    reminderEnabled?: boolean
    reminderInterval?: number
    completionDays?: number
    redirectUrl?: string
    bcc?: string[]
    allowModifications?: boolean
  }) => Promise<Template>
  
  // Field management
  addField: (field: TemplateField) => void
  updateField: (fieldId: string, updates: Partial<TemplateField>) => void
  removeField: (fieldId: string) => void
  
  // Signer management
  addSigner: (signer: TemplateSigner) => void
  updateSigner: (signerId: string, updates: Partial<TemplateSigner>) => void
  updateSignerStatus: (signerId: string, status: TemplateSigner['status']) => void
  removeSigner: (signerId: string) => void
  reorderSigners: (signers: TemplateSigner[]) => void
}

export const useTemplatesStore = create<TemplatesState>()(
  persist(
    (set) => ({
      templates: [],
      currentTemplate: null,
      isLoading: false,
      isUploading: false,
      uploadProgress: 0,
      uploadError: null,
      error: null,

      setTemplates: (templates) => set({ templates }),
      
      addTemplate: (template) => 
        set((state) => ({ 
          templates: [...state.templates, template] 
        })),
      
      clearUploadError: () => set({ uploadError: null }),
      
      saveTemplate: async (templateData) => {
        set({ isLoading: true, error: null })
        
        try {
          console.log('[Templates Store] Saving template to backend:', templateData.name)
          
          const response = await fetch('/api/templates/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Parse-Session-Token': localStorage.getItem('opensign_session_token') || '',
            },
            body: JSON.stringify(templateData),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to save template')
          }

          const { template } = await response.json()
          console.log('[Templates Store] Template saved successfully:', template)

          const savedTemplate: Template = {
            id: template.id,
            name: templateData.name,
            description: templateData.description || '',
            url: templateData.fileUrl,
            fileName: templateData.fileName,
            status: 'active',
            createdAt: template.createdAt,
            updatedAt: template.updatedAt,
            createdBy: 'current-user',
            fields: templateData.fields,
            signers: templateData.signers,
            sendInOrder: templateData.sendInOrder || false,
            otpEnabled: templateData.otpEnabled || false,
            tourEnabled: templateData.tourEnabled || false,
            reminderEnabled: templateData.reminderEnabled || false,
            reminderInterval: templateData.reminderInterval || 7,
            completionDays: templateData.completionDays || 30,
            redirectUrl: templateData.redirectUrl || '',
            bcc: templateData.bcc || [],
            allowModifications: templateData.allowModifications || false,
          }

          set((state) => ({
            templates: [...state.templates, savedTemplate],
            currentTemplate: savedTemplate,
            isLoading: false,
            error: null
          }))

          return savedTemplate
          
        } catch (error) {
          console.error('[Templates Store] Error saving template:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to save template',
            isLoading: false
          })
          throw error
        }
      },
      
      uploadTemplate: async (file: File, metadata = {}) => {
        set({ isUploading: true, uploadProgress: 0, uploadError: null })
        
        try {
          console.log('[Templates Store] Uploading template file to OpenSign Parse Server')
          set({ uploadProgress: 20 })
          
          console.log('[Templates Store] Using OpenSign direct file upload pattern')
          set({ uploadProgress: 40 })
          
          // Convert file to base64
          const fileBuffer = await file.arrayBuffer()
          const base64Data = Buffer.from(fileBuffer).toString('base64')
          
          console.log('[Templates Store] Step 1: Upload base64 data to Parse files')
          set({ uploadProgress: 40 })
          
          // Step 1: Upload file data using direct Parse file upload (matching the curl request)
          const fileId = `${Date.now()}${Math.random().toString(36).substr(2, 9)}.pdf`
          const uploadResponse = await fetch(`http://94.249.71.89:9000/api/app/files/${fileId}`, {
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
              base64: base64Data,
              fileData: { metadata: {}, tags: {} },
              _ContentType: 'application/pdf',
              _ApplicationId: 'opensign',
              _ClientVersion: 'js6.1.1',
              _InstallationId: '5b57e02d-5015-4c69-bede-06310ad8bae9',
              _SessionToken: localStorage.getItem('opensign_session_token') || ''
            }),
          })

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text()
            console.error('[Templates Store] File upload failed:', errorText)
            throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`)
          }

          const uploadData = await uploadResponse.json()
          console.log('[Templates Store] File uploaded to Parse:', uploadData)

          if (!uploadData.url) {
            throw new Error('Upload failed - no URL returned')
          }

          console.log('[Templates Store] Step 2: Call fileupload function for signed URL')
          set({ uploadProgress: 70 })

          // Step 2: Call fileupload function to get signed URL (matching the second curl request)
          const fileUploadResponse = await fetch('http://94.249.71.89:9000/api/app/functions/fileupload', {
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
              url: uploadData.url,
              _ApplicationId: 'opensign',
              _ClientVersion: 'js6.1.1',
              _InstallationId: '5b57e02d-5015-4c69-bede-06310ad8bae9',
              _SessionToken: localStorage.getItem('opensign_session_token') || ''
            }),
          })

          if (!fileUploadResponse.ok) {
            const errorText = await fileUploadResponse.text()
            console.error('[Templates Store] FileUpload function failed:', errorText)
            throw new Error(`FileUpload failed: ${fileUploadResponse.status} - ${errorText}`)
          }

          const fileUploadData = await fileUploadResponse.json()
          console.log('[Templates Store] Got signed URL:', fileUploadData)

          if (!fileUploadData.result?.url) {
            throw new Error('FileUpload failed - no signed URL returned')
          }

          set({ uploadProgress: 100 })

          const fileUrl = fileUploadData.result.url

          // Create a new template with the uploaded file
          if (metadata.name && fileUrl) {
            const newTemplate: Template = {
              id: crypto.randomUUID(),
              name: metadata.name,
              description: metadata.description || '',
              url: fileUrl,
              fileName: file.name,
              status: 'draft',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              createdBy: 'current-user', // This should be from auth context
              fields: [],
              signers: [],
              sendInOrder: metadata.sendInOrder || false,
              otpEnabled: metadata.otpEnabled || false,
              tourEnabled: false,
              reminderEnabled: false,
              reminderInterval: 7,
              completionDays: 30,
              bcc: [],
              allowModifications: false,
            }
            
            set((state) => ({
              templates: [...state.templates, newTemplate],
              currentTemplate: newTemplate,
              isUploading: false,
              uploadError: null
            }))
          } else {
            set({ 
              isUploading: false,
              uploadError: null
            })
          }

          return fileUrl || uploadData.result.url
          
        } catch (error) {
          console.error('[Templates Store] Error uploading template:', error)
          set({
            uploadError: error instanceof Error ? error.message : 'Upload failed',
            isUploading: false,
            uploadProgress: 0
          })
          throw error
        }
      },
      
      createTemplate: async (templateData) => {
        const newTemplate: Template = {
          id: crypto.randomUUID(),
          name: templateData.name || 'Untitled Template',
          description: templateData.description || '',
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'current-user', // This should be from auth context
          fields: [],
          signers: [],
          sendInOrder: templateData.sendInOrder || false,
          otpEnabled: templateData.otpEnabled || false,
          tourEnabled: false,
          reminderEnabled: false,
          reminderInterval: 7,
          completionDays: 30,
          bcc: [],
          allowModifications: false,
          ...templateData
        }
        
        set((state) => ({
          templates: [...state.templates, newTemplate],
          currentTemplate: newTemplate
        }))
        
        return newTemplate
      },
      
      updateTemplate: (id, updates) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
          currentTemplate: 
            state.currentTemplate?.id === id 
              ? { ...state.currentTemplate, ...updates, updatedAt: new Date().toISOString() }
              : state.currentTemplate
        })),
      
      deleteTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
          currentTemplate: state.currentTemplate?.id === id ? null : state.currentTemplate
        })),
      
      setCurrentTemplate: (template) => set({ currentTemplate: template }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      addField: (field) =>
        set((state) => {
          if (!state.currentTemplate) return state
          const updatedTemplate = {
            ...state.currentTemplate,
            fields: [...state.currentTemplate.fields, field],
            updatedAt: new Date().toISOString()
          }
          return {
            currentTemplate: updatedTemplate,
            templates: state.templates.map((t) =>
              t.id === updatedTemplate.id ? updatedTemplate : t
            )
          }
        }),
      
      updateField: (fieldId, updates) =>
        set((state) => {
          if (!state.currentTemplate) return state
          const updatedTemplate = {
            ...state.currentTemplate,
            fields: state.currentTemplate.fields.map((f) =>
              f.id === fieldId ? { ...f, ...updates } : f
            ),
            updatedAt: new Date().toISOString()
          }
          return {
            currentTemplate: updatedTemplate,
            templates: state.templates.map((t) =>
              t.id === updatedTemplate.id ? updatedTemplate : t
            )
          }
        }),
      
      removeField: (fieldId) =>
        set((state) => {
          if (!state.currentTemplate) return state
          const updatedTemplate = {
            ...state.currentTemplate,
            fields: state.currentTemplate.fields.filter((f) => f.id !== fieldId),
            updatedAt: new Date().toISOString()
          }
          return {
            currentTemplate: updatedTemplate,
            templates: state.templates.map((t) =>
              t.id === updatedTemplate.id ? updatedTemplate : t
            )
          }
        }),
      
      addSigner: (signer) =>
        set((state) => {
          if (!state.currentTemplate) return state
          const updatedTemplate = {
            ...state.currentTemplate,
            signers: [...state.currentTemplate.signers, signer],
            updatedAt: new Date().toISOString()
          }
          return {
            currentTemplate: updatedTemplate,
            templates: state.templates.map((t) =>
              t.id === updatedTemplate.id ? updatedTemplate : t
            )
          }
        }),
      
      updateSigner: (signerId, updates) =>
        set((state) => {
          if (!state.currentTemplate) return state
          const updatedTemplate = {
            ...state.currentTemplate,
            signers: state.currentTemplate.signers.map((s) =>
              s.id === signerId ? { ...s, ...updates } : s
            ),
            updatedAt: new Date().toISOString()
          }
          return {
            currentTemplate: updatedTemplate,
            templates: state.templates.map((t) =>
              t.id === updatedTemplate.id ? updatedTemplate : t
            )
          }
        }),
      
      updateSignerStatus: (signerId, status) =>
        set((state) => {
          if (!state.currentTemplate) return state
          let updatedTemplate = {
            ...state.currentTemplate,
            signers: state.currentTemplate.signers.map((s) =>
              s.id === signerId 
                ? { ...s, status, signedAt: status === 'signed' ? new Date().toISOString() : s.signedAt }
                : s
            ),
            updatedAt: new Date().toISOString()
          }
          
          // Recalculate permissions after status update
          updatedTemplate = calculateSigningPermissions(updatedTemplate)
          
          return {
            currentTemplate: updatedTemplate,
            templates: state.templates.map((t) =>
              t.id === updatedTemplate.id ? updatedTemplate : t
            )
          }
        }),
      
      removeSigner: (signerId) =>
        set((state) => {
          if (!state.currentTemplate) return state
          const updatedTemplate = {
            ...state.currentTemplate,
            signers: state.currentTemplate.signers.filter((s) => s.id !== signerId),
            fields: state.currentTemplate.fields.filter((f) => f.signerRole !== signerId),
            updatedAt: new Date().toISOString()
          }
          return {
            currentTemplate: updatedTemplate,
            templates: state.templates.map((t) =>
              t.id === updatedTemplate.id ? updatedTemplate : t
            )
          }
        }),
      
      reorderSigners: (signers) =>
        set((state) => {
          if (!state.currentTemplate) return state
          const updatedTemplate = {
            ...state.currentTemplate,
            signers: signers.map((signer, index) => ({
              ...signer,
              order: index + 1
            })),
            updatedAt: new Date().toISOString()
          }
          return {
            currentTemplate: updatedTemplate,
            templates: state.templates.map((t) =>
              t.id === updatedTemplate.id ? updatedTemplate : t
            )
          }
        }),
    }),
    {
      name: 'templates-storage',
      partialize: (state) => ({ templates: state.templates }),
    }
  )
)
