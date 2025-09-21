'use client'

import { useState, useCallback } from 'react'
import { CreateTemplateFormData, FieldPlacement, Signer, SigningMode } from './types'

interface UseTemplateApiProps {
  sessionToken: string
  currentUserId: string
  extUserId: string
}

export const useTemplateApi = ({ sessionToken, currentUserId, extUserId }: UseTemplateApiProps) => {
  const [isSaving, setIsSaving] = useState(false)
  const [templateId, setTemplateId] = useState<string | null>(null)

  const formatPlaceholdersForAPI = useCallback((fieldPlacements: FieldPlacement[], selectedSigners: Signer[]) => {
    const signerGroups: Record<string, {
      signerPtr: { __type: string; className: string; objectId: string }
      signerObjId: string
      blockColor: string
      Role: string
      Id: number
      placeHolder: Array<{
        pageNumber: number
        pos: Array<{
          xPosition: number
          yPosition: number
          isStamp: boolean
          key: number
          scale: number
          zIndex: number
          type: string
          options: { name: string; status: string }
          Width: number
          Height: number
        }>
      }>
    }> = {}
    
    selectedSigners.forEach((signer, index) => {
      const signerFields = fieldPlacements.filter(field => 
        field.assignedSigner === (signer.Name || signer.Email)
      )
      
      if (signerFields.length > 0) {
        signerGroups[signer.objectId] = {
          signerPtr: {
            __type: "Pointer",
            className: "contracts_Contactbook",
            objectId: signer.objectId
          },
          signerObjId: signer.objectId,
          blockColor: ["#93a3db", "#e3d985", "#c3a6e4", "#c4a9a9", "#f5d755"][index % 5],
          Role: "User",
          Id: index,
          placeHolder: [{
            pageNumber: 1,
            pos: signerFields.map((field, fieldIndex) => ({
              xPosition: field.x,
              yPosition: field.y,
              isStamp: field.type === 'signature',
              key: fieldIndex,
              scale: 1,
              zIndex: 1,
              type: field.type,
              options: {
                name: field.placeholder || field.type,
                status: field.required ? "required" : "optional"
              },
              Width: field.width,
              Height: field.height
            }))
          }]
        }
      }
    })
    
    return Object.values(signerGroups)
  }, [])

  const saveTemplate = useCallback(async (
    templateData: CreateTemplateFormData,
    fieldPlacements: FieldPlacement[],
    selectedSigners: Signer[],
    signingMode: SigningMode
  ) => {
    setIsSaving(true)
    try {
      const token = sessionToken || localStorage.getItem('opensign_session_token') || ''
      let uploadedFileUrl = templateData.fileUrl
      let currentTemplateId = templateId
      
      // For sign yourself mode, create a template first if it doesn't exist
      if (signingMode === 'sign_yourself' && !currentTemplateId) {
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
      }
      
      // Handle file upload if it's a blob URL
      if (templateData.fileUrl?.startsWith('blob:')) {
        const response = await fetch(templateData.fileUrl)
        const blob = await response.blob()
        
        // Convert blob to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const result = reader.result as string
            const base64Data = result.split(',')[1]
            resolve(base64Data)
          }
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
        
        const fileName = templateData.name ? 
          `${templateData.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf` : 
          `template_${Date.now()}.pdf`
        
        // Upload file
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
            fileData: { metadata: {}, tags: {} },
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
        
        // Process file upload
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
      }

      // Update template with placeholders
      const placeholders = formatPlaceholdersForAPI(fieldPlacements, selectedSigners)
      
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
          TimeToCompleteDays: 15
        })
      })

      if (!templateUpdateResponse.ok) {
        throw new Error('Failed to update template')
      }

      return { success: true, templateId: currentTemplateId }
    } catch (error) {
      console.error('Error saving template:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }, [sessionToken, currentUserId, extUserId, templateId, formatPlaceholdersForAPI])

  return {
    saveTemplate,
    isSaving,
    templateId,
    setTemplateId
  }
}