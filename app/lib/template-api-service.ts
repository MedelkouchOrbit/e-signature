// Template API service for template creation operations
import { CreateTemplateFormData, FieldPlacement, Signer, PlaceholderPage } from '../components/templates/create/types'

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

interface TemplateUpdatePayload {
  Placeholders?: SignerPlaceholder[]
  Signers?: Array<{
    __type: string
    className: string
    objectId: string
  }>
  Name?: string
  Description?: string
  SendinOrder?: boolean
  IsEnableOTP?: boolean
  URL?: string
  _ApplicationId: string
  _ClientVersion: string
  _InstallationId: string
  _SessionToken: string
}

export class TemplateApiService {
  private baseUrl = 'http://94.249.71.89:9000/api/app'
  private sessionToken: string

  constructor(sessionToken: string) {
    this.sessionToken = sessionToken
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const defaultHeaders = {
      'Accept': '*/*',
      'Content-Type': 'text/plain',
      'X-Parse-Application-Id': 'opensign',
      'X-Parse-Session-Token': this.sessionToken,
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async createTemplate(templateData: CreateTemplateFormData, currentUserId: string, extUserId: string) {
    const payload = {
      Name: templateData.name,
      Description: templateData.description || "",
      Note: "Template created via API",
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
      SendinOrder: templateData.sendInOrder || false,
      AutomaticReminders: false,
      RemindOnceInEvery: 5,
      IsEnableOTP: templateData.otpEnabled || false,
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
      _SessionToken: this.sessionToken
    }

    return this.makeRequest('/classes/contracts_Template', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }

  async uploadFile(fileBlob: Blob, fileName: string): Promise<string> {
    // Convert blob to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64Data = result.split(',')[1]
        resolve(base64Data)
      }
      reader.onerror = reject
      reader.readAsDataURL(fileBlob)
    })

    const payload = {
      base64: base64,
      fileData: {
        metadata: {},
        tags: {}
      },
      _ContentType: "text/plain",
      _ApplicationId: "opensign",
      _ClientVersion: "js6.1.1",
      _InstallationId: "5b57e02d-5015-4c69-bede-06310ad8bae9",
      _SessionToken: this.sessionToken
    }

    const result = await this.makeRequest(`/files/${fileName}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    // Process the uploaded file
    await this.makeRequest('/functions/fileupload', {
      method: 'POST',
      body: JSON.stringify({
        url: result.url,
        _ApplicationId: "opensign",
        _ClientVersion: "js6.1.1",
        _InstallationId: "5b57e02d-5015-4c69-bede-06310ad8bae9",
        _SessionToken: this.sessionToken
      })
    })

    return result.url
  }

  async updateTemplate(templateId: string, updates: {
    placeholders?: SignerPlaceholder[]
    signers?: Signer[]
    templateData?: Partial<CreateTemplateFormData>
    fileUrl?: string
  }) {
    const payload: TemplateUpdatePayload = {
      _ApplicationId: "opensign",
      _ClientVersion: "js6.1.1",
      _InstallationId: "5b57e02d-5015-4c69-bede-06310ad8bae9",
      _SessionToken: this.sessionToken
    }

    if (updates.placeholders) {
      payload.Placeholders = updates.placeholders
    }

    if (updates.signers) {
      payload.Signers = updates.signers.map(signer => ({
        __type: "Pointer",
        className: "contracts_Contactbook",
        objectId: signer.objectId
      }))
    }

    if (updates.templateData) {
      if (updates.templateData.name) payload.Name = updates.templateData.name
      if (updates.templateData.description !== undefined) payload.Description = updates.templateData.description
      if (updates.templateData.sendInOrder !== undefined) payload.SendinOrder = updates.templateData.sendInOrder
      if (updates.templateData.otpEnabled !== undefined) payload.IsEnableOTP = updates.templateData.otpEnabled
    }

    if (updates.fileUrl) {
      payload.URL = updates.fileUrl
    }

    return this.makeRequest(`/classes/contracts_Template/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
  }

  formatPlaceholdersForAPI(fieldPlacements: FieldPlacement[], selectedSigners: Signer[]) {
    const signerGroups: { [key: string]: SignerPlaceholder } = {}
    
    selectedSigners.forEach((signer, index) => {
      const signerKey = signer.Name || signer.Email
      if (!signerGroups[signerKey]) {
        signerGroups[signerKey] = {
          signerPtr: {
            __type: "Pointer",
            className: "contracts_Contactbook",
            objectId: signer.objectId
          },
          signerObjId: signer.objectId,
          blockColor: this.getSignerColor(index),
          Role: "Signer",
          Id: index,
          placeHolder: []
        }
      }
    })

    // Group field placements by page
    const pageGroups: { [key: number]: FieldPlacement[] } = {}
    fieldPlacements.forEach(field => {
      if (!pageGroups[field.page]) {
        pageGroups[field.page] = []
      }
      pageGroups[field.page].push(field)
    })

    // Add placeholders to appropriate signers
    Object.keys(pageGroups).forEach(pageNum => {
      const page = parseInt(pageNum)
      const fieldsOnPage = pageGroups[page]
      
      // Assign to appropriate signer or first signer if unassigned
      fieldsOnPage.forEach(field => {
        const assignedSigner = field.assignedSigner || (selectedSigners[0]?.Name || selectedSigners[0]?.Email)
        if (assignedSigner && signerGroups[assignedSigner]) {
          // Check if this page already exists for this signer
          const existingPageIndex = signerGroups[assignedSigner].placeHolder.findIndex(
            (p: PlaceholderPage) => p.pageNumber === page
          )
          
          if (existingPageIndex >= 0) {
            // Add to existing page
            signerGroups[assignedSigner].placeHolder[existingPageIndex].pos.push({
              xPosition: field.x,
              yPosition: field.y,
              isStamp: field.type === 'signature' || field.type === 'initial',
              key: signerGroups[assignedSigner].placeHolder[existingPageIndex].pos.length,
              scale: 1,
              zIndex: signerGroups[assignedSigner].placeHolder[existingPageIndex].pos.length + 1,
              type: field.type,
              options: {
                name: field.placeholder || field.type,
                status: field.required ? "required" : "optional"
              },
              Width: field.width,
              Height: field.height
            })
          } else {
            // Create new page
            signerGroups[assignedSigner].placeHolder.push({
              pageNumber: page,
              pos: [{
                xPosition: field.x,
                yPosition: field.y,
                isStamp: field.type === 'signature' || field.type === 'initial',
                key: 0,
                scale: 1,
                zIndex: 1,
                type: field.type,
                options: {
                  name: field.placeholder || field.type,
                  status: field.required ? "required" : "optional"
                },
                Width: field.width,
                Height: field.height
              }]
            })
          }
        }
      })
    })
    
    return Object.values(signerGroups)
  }

  private getSignerColor(index: number): string {
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#6366f1']
    return colors[index % colors.length]
  }

  async fetchTenantDetails(userId: string) {
    try {
      const response = await this.makeRequest(`/functions/getUserDetails`, {
        method: 'POST',
        body: JSON.stringify({
          userId: userId,
          _ApplicationId: "opensign",
          _ClientVersion: "js6.1.1",
          _InstallationId: "5b57e02d-5015-4c69-bede-06310ad8bae9",
          _SessionToken: this.sessionToken
        })
      })
      return response.result
    } catch (error) {
      console.error('Error fetching tenant details:', error)
      return null
    }
  }
}

export default TemplateApiService