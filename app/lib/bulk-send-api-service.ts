import { bulkSendSignerService } from './bulk-send-signer-service'
import { openSignApiService } from './api-service'
import { getCurrentUser, getCurrentSessionToken, getCurrentUserFromApi } from '@/app/lib/utils/current-user'

// Bulk Send interfaces - Updated to work with OpenSign's actual implementation
export interface BulkSend {
  id: string
  name: string
  templateId: string
  templateName: string
  status: 'draft' | 'sending' | 'completed' | 'failed'
  totalRecipients: number
  sentCount: number
  completedCount: number
  failedCount: number
  signers: BulkSendSigner[]
  sendInOrder: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  documentIds?: string[] // IDs of created documents
}

export interface BulkSendSigner {
  id: string
  name: string
  email: string
  role: string
  order: number
  status: 'pending' | 'sent' | 'viewed' | 'signed' | 'declined' | 'expired'
  sentAt?: string
  viewedAt?: string
  signedAt?: string
  declinedAt?: string
  documentId?: string // ID of the document created for this signer
}

export interface CreateBulkSendRequest {
  templateId: string
  name: string
  signers: Omit<BulkSendSigner, 'id' | 'status' | 'sentAt' | 'viewedAt' | 'signedAt' | 'declinedAt' | 'documentId'>[]
  sendInOrder: boolean
  message?: string
}

// OpenSign API Response interface
interface OpenSignApiResponse<T = unknown> {
  results: T[]
  count?: number
}

// OpenSign Placeholder interface
interface OpenSignPlaceholder {
  Id?: string
  email?: string
  signerObjId?: string
  signerPtr?: {
    __type: string
    className: string
    objectId: string
  }
  placeHolder?: Array<{
    pageDetails?: {
      pageNumber: number
      Height: number
      Width: number
    }
    pos?: {
      x: number
      y: number
    }
    type?: string
    options?: {
      name: string
      status: string
      defaultValue?: string
    }
  }>
}

// OpenSign Template interfaces (from contracts_Template class)
interface OpenSignTemplate {
  objectId: string
  Name: string
  URL: string
  Note?: string
  Description?: string
  Signers?: Record<string, unknown>[]
  IsArchive?: boolean
  Placeholders?: OpenSignPlaceholder[]
  Type?: string
  CreatedBy?: Record<string, unknown>
  ExtUserPtr?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

// OpenSign Document interfaces (from contracts_Document class)
interface OpenSignDocument {
  objectId: string
  Name: string
  URL: string
  Note?: string
  Signers?: Record<string, unknown>[]
  Placeholders?: OpenSignPlaceholder[]
  IsCompleted?: boolean
  IsDeclined?: boolean
  IsSigned?: boolean
  Status?: string
  TemplateId?: {
    __type: string
    className: string
    objectId: string
  }
  createdAt: string
  updatedAt: string
  CreatedBy?: Record<string, unknown>
  // Bulk send fields (added to MongoDB collection)
  bulk_send_id?: string
  bulk_send_name?: string
  is_bulk_send?: boolean
  bulk_total_recipients?: number
  bulk_order_index?: number
  bulk_created_at?: string
  SentToOthers?: boolean
  DocSentAt?: string
}

class BulkSendApiService {
  
  /**
   * Get bulk sends from MongoDB contracts_Document collection
   * Uses the exact curl command structure to find all bulk send documents
   */
  async getBulkSends(): Promise<BulkSend[]> {
    try {
      

      // Get current user for proper filtering
      const currentUser = await getCurrentUser()
      console.log('� Current user:', currentUser?.id ? `User ${currentUser.id}` : 'Not authenticated')

      // Get bulk send documents with CreatedBy field
      
      const whereQuery = {
        is_bulk_send: true,
        ...(currentUser?.id && {
          CreatedBy: {
            __type: 'Pointer',
            className: '_User',
            objectId: currentUser.id
          }
        })
      }

      const queryParams = new URLSearchParams({
        where: JSON.stringify(whereQuery),
        limit: '1000',
        include: 'ExtUserPtr,Signers'
      })

      const documentsResponse = await openSignApiService.get<OpenSignApiResponse<OpenSignDocument>>(
        `classes/contracts_Document?${queryParams.toString()}`
      )

      console.log(`� Found ${documentsResponse?.results?.length || 0} documents with CreatedBy`)

      // Also get bulk send documents without CreatedBy field
      
      const whereQueryNoCreatedBy = {
        is_bulk_send: true,
        CreatedBy: {
          $exists: false
        }
      }

      const queryParamsNoCreatedBy = new URLSearchParams({
        where: JSON.stringify(whereQueryNoCreatedBy),
        limit: '1000',
        include: 'ExtUserPtr,Signers'
      })

      const documentsResponseNoCreatedBy = await openSignApiService.get<OpenSignApiResponse<OpenSignDocument>>(
        `classes/contracts_Document?${queryParamsNoCreatedBy.toString()}`
      )





      // Combine all documents
      const allBulkSendDocs = [
        ...(documentsResponse?.results || []),
        ...(documentsResponseNoCreatedBy?.results || [])
      ]

      if (allBulkSendDocs.length === 0) {
        return []
      }

      // Group documents by bulk_send_id
      const bulkSendGroups = new Map<string, OpenSignDocument[]>()
      
      for (const doc of allBulkSendDocs) {
        const bulkSendId = doc.bulk_send_id
        if (!bulkSendId) continue

        if (!bulkSendGroups.has(bulkSendId)) {
          bulkSendGroups.set(bulkSendId, [])
        }
        bulkSendGroups.get(bulkSendId)!.push(doc)
      }

      // Convert groups to BulkSend objects
      const bulkSends: BulkSend[] = []

      for (const [bulkSendId, docs] of bulkSendGroups) {
        const bulkSend = this.convertMongoBulkSend(bulkSendId, docs)
        if (bulkSend) {
          bulkSends.push(bulkSend)
        } else {

        }
      }


      
      return bulkSends.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } catch (error) {
      console.error('Error fetching bulk sends from MongoDB:', error)
      throw error
    }
  }

  /**
   * Convert MongoDB document group to BulkSend object
   */
  private convertMongoBulkSend(bulkSendId: string, docs: OpenSignDocument[]): BulkSend | null {
    if (!docs || docs.length === 0) return null

    const firstDoc = docs[0]
    

    
    // Calculate status based on document states
    const completedCount = docs.filter(doc => doc.IsCompleted === true).length
    const sentCount = docs.filter(doc => doc.SentToOthers === true || doc.DocSentAt).length
    
    let status: BulkSend['status'] = 'draft'
    if (completedCount === docs.length) {
      status = 'completed'
    } else if (sentCount > 0) {
      status = 'sending'
    }



    // Create signers array from documents
    const signers: BulkSendSigner[] = docs.map((doc, index) => {
      // Extract signer info from Placeholders or Signers
      let signerName = 'Unknown'
      let signerEmail = ''
      
      if (doc.Placeholders && doc.Placeholders.length > 0) {
        const placeholder = doc.Placeholders[0]
        if (placeholder.email) {
          signerEmail = placeholder.email
          // Extract name from email or document name
          signerName = doc.Name?.split(' - ').pop() || placeholder.email.split('@')[0]
        }
      }

      return {
        id: `signer-${doc.objectId}`,
        name: signerName,
        email: signerEmail,
        role: 'signer',
        order: doc.bulk_order_index || index + 1,
        status: doc.IsCompleted ? 'signed' : (doc.SentToOthers ? 'sent' : 'pending'),
        sentAt: doc.DocSentAt,
        signedAt: doc.IsCompleted ? doc.updatedAt : undefined,
        documentId: doc.objectId
      }
    })

    // Parse the bulk_created_at date properly
    let createdAt = firstDoc.createdAt
    if (firstDoc.bulk_created_at) {
      if (typeof firstDoc.bulk_created_at === 'object' && 'iso' in firstDoc.bulk_created_at) {
        createdAt = (firstDoc.bulk_created_at as {iso: string}).iso
      } else if (typeof firstDoc.bulk_created_at === 'string') {
        createdAt = firstDoc.bulk_created_at
      }
    }

    const bulkSend = {
      id: bulkSendId,
      name: firstDoc.bulk_send_name || `Bulk Send ${bulkSendId}`,
      templateId: firstDoc.TemplateId?.objectId || '',
      templateName: 'Document Template',
      status,
      totalRecipients: docs.length,
      sentCount,
      completedCount,
      failedCount: 0,
      signers,
      sendInOrder: false,
      createdAt,
      updatedAt: firstDoc.updatedAt,
      createdBy: firstDoc.CreatedBy && 'objectId' in firstDoc.CreatedBy 
        ? String(firstDoc.CreatedBy.objectId) 
        : 'system',
      documentIds: docs.map(doc => doc.objectId)
    }

    
    return bulkSend
  }

  /**
   * Fallback mock data when server is unavailable
   */
  private getFallbackMockData(): BulkSend[] {
    const now = new Date().toISOString()
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    return [
      {
        id: 'bulk-invoice-demo-1',
        name: 'Invoice Q4 2024 - Finance Team',
        templateId: 'template-invoice-1',
        templateName: 'Invoice Template',
        status: 'completed',
        totalRecipients: 3,
        sentCount: 3,
        completedCount: 2,
        failedCount: 0,
        signers: [
          {
            id: 'signer-1',
            name: 'Mohammed Elkouch',
            email: 'mohammed@company.com',
            role: 'signer',
            order: 1,
            status: 'signed',
            sentAt: yesterday,
            signedAt: now
          },
          {
            id: 'signer-2',
            name: 'Sarah Johnson',
            email: 'sarah@company.com',
            role: 'signer',
            order: 2,
            status: 'signed',
            sentAt: yesterday,
            signedAt: now
          },
          {
            id: 'signer-3',
            name: 'David Chen',
            email: 'david@company.com',
            role: 'signer',
            order: 3,
            status: 'sent',
            sentAt: yesterday
          }
        ],
        sendInOrder: false,
        createdAt: yesterday,
        updatedAt: now,
        createdBy: 'demo-user',
        documentIds: ['doc-1', 'doc-2', 'doc-3']
      },
      {
        id: 'bulk-contract-demo-2',
        name: 'Employment Contracts - HR Batch',
        templateId: 'template-contract-1',
        templateName: 'Employment Contract',
        status: 'sending',
        totalRecipients: 2,
        sentCount: 2,
        completedCount: 0,
        failedCount: 0,
        signers: [
          {
            id: 'signer-4',
            name: 'Alice Brown',
            email: 'alice@company.com',
            role: 'signer',
            order: 1,
            status: 'viewed',
            sentAt: now
          },
          {
            id: 'signer-5',
            name: 'Bob Wilson',
            email: 'bob@company.com',
            role: 'signer',
            order: 2,
            status: 'sent',
            sentAt: now
          }
        ],
        sendInOrder: true,
        createdAt: now,
        updatedAt: now,
        createdBy: 'demo-user',
        documentIds: ['doc-4', 'doc-5']
      },
      {
        id: 'bulk-nda-demo-3',
        name: 'NDA - Consultant Onboarding',
        templateId: 'template-nda-1',
        templateName: 'Non-Disclosure Agreement',
        status: 'draft',
        totalRecipients: 4,
        sentCount: 0,
        completedCount: 0,
        failedCount: 0,
        signers: [
          {
            id: 'signer-6',
            name: 'Emma Davis',
            email: 'emma@consultant.com',
            role: 'signer',
            order: 1,
            status: 'pending'
          },
          {
            id: 'signer-7',
            name: 'James Miller',
            email: 'james@consultant.com',
            role: 'signer',
            order: 2,
            status: 'pending'
          },
          {
            id: 'signer-8',
            name: 'Lisa Garcia',
            email: 'lisa@consultant.com',
            role: 'signer',
            order: 3,
            status: 'pending'
          },
          {
            id: 'signer-9',
            name: 'Tom Anderson',
            email: 'tom@consultant.com',
            role: 'signer',
            order: 4,
            status: 'pending'
          }
        ],
        sendInOrder: false,
        createdAt: now,
        updatedAt: now,
        createdBy: 'demo-user',
        documentIds: []
      }
    ]
  }

  /**
   * Fallback method for mock data - kept for backward compatibility
   */
  private async getMockBulkSends(): Promise<BulkSend[]> {
    try {
      // Query documents that were created as part of bulk sends
      // We'll identify them by their names containing "Bulk Send:"
      const queryParams = new URLSearchParams({
        limit: '100',
        skip: '0',
        include: 'CreatedBy',
        order: '-createdAt',
        where: JSON.stringify({
          Name: {
            $regex: '^Bulk Send:',
            $options: 'i'
          }
        })
      })

      const response = await openSignApiService.get<{results: OpenSignDocument[]; count: number}>(
        `classes/contracts_Document?${queryParams.toString()}`
      )

      // If we got a successful response but no results, return empty array
      if (!response.results || response.results.length === 0) {
        return []
      }

      // Group documents by bulk send name to reconstruct bulk send objects
      const bulkSendMap = new Map<string, BulkSend>()
      
      response.results?.forEach((doc: OpenSignDocument) => {
        // Extract bulk send name from document name pattern "Bulk Send: [Name] - [Signer]"
        const nameMatch = doc.Name?.match(/^Bulk Send: (.+?) - (.+)$/)
        if (nameMatch) {
          let bulkSendName = nameMatch[1]
          const signerName = nameMatch[2]
          
          // Clean the bulk send name by removing "Bulk Send - " prefix if it exists
          if (bulkSendName.startsWith('Bulk Send - ')) {
            bulkSendName = bulkSendName.replace('Bulk Send - ', '')
          }
          
          // Create the display name as: cleaned_name - signer_name
          // e.g. "invoice - Mohammed Elkouch" or "note de frais - Mohammed Elkouch"
          const displayName = `${bulkSendName} - ${signerName}`
          
          // Create a unique key that combines the display name and creation date
          // This helps group documents that belong to the same bulk send campaign
          const bulkSendKey = `${displayName}-${doc.createdAt.split('T')[0]}`
          
          if (!bulkSendMap.has(bulkSendKey)) {
            bulkSendMap.set(bulkSendKey, {
              id: `bulk-${bulkSendKey.replace(/\s+/g, '-').toLowerCase()}`,
              name: displayName, // This will show "invoice - Mohammed Elkouch"
              templateId: '', // Will be determined from first document
              templateName: '',
              status: 'completed',
              totalRecipients: 0,
              sentCount: 0,
              completedCount: 0,
              failedCount: 0,
              signers: [],
              sendInOrder: false,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
              createdBy: (doc.CreatedBy as {objectId?: string})?.objectId || '',
              documentIds: []
            })
          }
          
          const bulkSend = bulkSendMap.get(bulkSendKey)!
          bulkSend.documentIds?.push(doc.objectId)
          bulkSend.totalRecipients++
          
          // Set template ID and name from the first document
          if (!bulkSend.templateId && doc.TemplateId?.objectId) {
            bulkSend.templateId = doc.TemplateId.objectId
            bulkSend.templateName = displayName // Use the extracted filename as template name (e.g. "note de frais", "invoice")
          }
          
          // Determine status based on document completion
          if (doc.IsCompleted) {
            bulkSend.completedCount++
          } else if (doc.IsDeclined) {
            bulkSend.failedCount++
          } else {
            bulkSend.sentCount++
          }
          
          // Add signer info
          const signerData = doc.Signers?.[0] as {Email?: string; Role?: string} || {}
          bulkSend.signers.push({
            id: `signer-${doc.objectId}`,
            name: signerName,
            email: signerData.Email || '',
            role: signerData.Role || 'signer',
            order: bulkSend.signers.length + 1,
            status: doc.IsCompleted ? 'signed' : doc.IsDeclined ? 'declined' : 'sent',
            documentId: doc.objectId,
            sentAt: doc.createdAt,
            signedAt: doc.IsCompleted ? doc.updatedAt : undefined,
            declinedAt: doc.IsDeclined ? doc.updatedAt : undefined
          })
        }
      })

      const results = Array.from(bulkSendMap.values())
      
      return results
    } catch (error) {
      console.error('Error fetching bulk sends from server:', error)
      // When server is unavailable, throw error to trigger fallback
      throw error
    }
  }

  /**
   * Create bulk send - Uses OpenSign's batchdocuments function to create multiple documents
   */
  async createBulkSend(data: CreateBulkSendRequest): Promise<BulkSend> {
    try {
      // First, get the template details
      const template = await this.getTemplateById(data.templateId)
      if (!template) {
        throw new Error('Template not found')
      }

      // Get current user session token and info
      console.log('🔐 createBulkSend: Starting authentication check...')
      const sessionToken = getCurrentSessionToken()
      let currentUser = getCurrentUser()
      
      console.log('🔐 Session token:', sessionToken ? sessionToken.substring(0, 10) + '...' : 'null')
      console.log('🔐 Current user from storage:', currentUser)
      
      if (!sessionToken) {
        console.error('❌ No session token found')
        throw new Error('User authentication required to create bulk send')
      }

      // If we don't have user ID from local storage, try to get it from the API
      if (!currentUser.id) {
        console.log('📞 User ID not found in local storage, fetching from API...')
        try {
          currentUser = await getCurrentUserFromApi()
          console.log('📞 User from API:', currentUser)
        } catch (error) {
          console.error('❌ Could not get user from API:', error)
        }
      }

      if (!currentUser.id) {
        console.error('❌ No user ID available')
        throw new Error('User ID required to create bulk send')
      }
      
      console.log('✅ Authentication successful:', { sessionToken: sessionToken.substring(0, 10) + '...', userId: currentUser.id })

      // Generate a unique bulk send ID
      const bulkSendId = `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const bulkCreatedAt = new Date().toISOString()

      const documentsToCreate = data.signers.map((signer, index) => {
        // Update placeholders with signer information
        const updatedPlaceholders = template.Placeholders?.map((placeholder: OpenSignPlaceholder) => ({
          ...placeholder,
          email: signer.email,
          signerPtr: {
            objectId: '', // Will be created during batch process
            Email: signer.email,
            Name: signer.name
          },
          signerObjId: ''
        })) || []

        return {
          Name: `${data.name} - ${signer.name}`,
          Description: data.message || `Bulk send: ${data.name}`,
          Status: 'waiting',
          URL: template.URL,
          FileName: template.Name || 'document.pdf',
          Placeholders: updatedPlaceholders,
          Signers: [{
            objectId: '',
            Email: signer.email,
            Name: signer.name,
            Role: signer.role
          }],
          Bcc: [],
          SendInOrder: data.sendInOrder,
          IsOTP: false,
          IsTour: false,
          IsReminder: false,
          ReminderInterval: 7,
          TimeToCompleteDays: 30,
          RedirectURL: '',
          AllowModifications: false,
          Type: 'template',
          IsArchive: false,
          Note: data.message || `Bulk send: ${data.name}`,
          SendinOrder: data.sendInOrder,
          
          // ✅ BULK SEND METADATA - This is what was missing!
          is_bulk_send: true,
          bulk_send_id: bulkSendId,
          bulk_send_name: data.name,
          bulk_total_recipients: data.signers.length,
          bulk_order_index: index + 1,
          bulk_created_at: {
            __type: 'Date',
            iso: bulkCreatedAt
          }
          // ExtUserPtr and CreatedBy will be automatically set by backend
          // ACL will be automatically managed by backend
        }
      })

      // Create documents directly using Parse classes API since createBatchDocs doesn't exist
      const createdDocuments: Array<{objectId: string; createdAt: string; Name: string}> = []
      
      for (const doc of documentsToCreate) {
        try {
          const response = await openSignApiService.post<{objectId: string, createdAt: string}>(
            'classes/contracts_Document',
            doc
          )
          createdDocuments.push({
            Name: doc.Name,
            objectId: response.objectId,
            createdAt: response.createdAt
          })
        } catch (error) {
          console.error('Failed to create document:', doc.Name, error)
          throw new Error(`Failed to create document: ${doc.Name}`)
        }
      }

      // Create and return bulk send object
      const bulkSend: BulkSend = {
        id: bulkSendId,
        name: data.name,
        templateId: data.templateId,
        templateName: template.Name,
        status: 'sending',
        totalRecipients: data.signers.length,
        sentCount: data.signers.length,
        completedCount: 0,
        failedCount: 0,
        signers: data.signers.map((signer, index) => ({
          id: `signer-${Date.now()}-${index}`,
          name: signer.name,
          email: signer.email,
          role: signer.role,
          order: signer.order,
          status: 'sent',
          sentAt: bulkCreatedAt,
          documentId: createdDocuments[index]?.objectId
        })),
        sendInOrder: data.sendInOrder,
        createdAt: bulkCreatedAt,
        updatedAt: bulkCreatedAt,
        createdBy: currentUser.id,
        documentIds: createdDocuments.map(doc => doc.objectId)
      }

      console.log('✅ Created bulk send with ID:', bulkSendId)
      console.log('📄 Created documents:', createdDocuments.length)

      return bulkSend
    } catch (error) {
      console.error('Error creating bulk send:', error)
      throw error
    }
  }

  /**
   * Update an existing document to add bulk send metadata
   * This is useful for fixing documents created without bulk send fields
   */
  async updateDocumentAsBulkSend(documentId: string, bulkSendName: string): Promise<void> {
    try {
      console.log('🔄 Updating document as bulk send:', documentId)
      
      const bulkSendId = `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const bulkCreatedAt = new Date().toISOString()
      
      const updateData = {
        is_bulk_send: true,
        bulk_send_id: bulkSendId,
        bulk_send_name: bulkSendName,
        bulk_total_recipients: 1,
        bulk_order_index: 1,
        bulk_created_at: {
          __type: 'Date',
          iso: bulkCreatedAt
        }
      }
      
      await openSignApiService.put(
        `classes/contracts_Document/${documentId}`,
        updateData
      )
      
      console.log('✅ Successfully updated document with bulk send metadata')
    } catch (error) {
      console.error('❌ Error updating document:', error)
      throw error
    }
  }

  /**
   * Get template by ID from contracts_Template class
   */
  private async getTemplateById(templateId: string): Promise<OpenSignTemplate | null> {
    try {
      console.log('🔍 Fetching template with ID:', templateId)
      
      const queryParams = new URLSearchParams({
        include: 'CreatedBy'
      })
      
      const response = await openSignApiService.get<OpenSignTemplate>(
        `classes/contracts_Template/${templateId}?${queryParams.toString()}`
      )
      
      console.log('✅ Template found:', response?.Name || 'Unknown')
      return response
    } catch (error) {
      console.error('❌ Error fetching template:', error)
      console.error('Template ID that failed:', templateId)
      
      if (error instanceof Error && error.message.includes('Invalid session token')) {
        console.error('🔑 Session token is invalid. Please log in again to get a fresh token.')
      }
      
      return null
    }
  }

  /**
   * Send bulk send - Actually assign signers to the created documents
   */
  async sendBulkSend(bulkSendId: string): Promise<void> {
    try {
      console.log('🚀 Starting bulk send signer assignment for:', bulkSendId)

      // Get all documents
      const documentsResponse = await openSignApiService.get('classes/contracts_Document?include=Placeholders,Signers&limit=1000') as OpenSignApiResponse<OpenSignDocument>
      const documents = documentsResponse?.results || []
      
      // Filter to bulk send documents created for this bulk send
      const bulkSendDocs = documents.filter((doc: OpenSignDocument) => 
        doc.Name?.includes('Bulk Send:') && 
        doc.Placeholders && doc.Placeholders.length > 0 &&
        doc.Placeholders?.some((p: OpenSignPlaceholder) => p.email && (!p.signerObjId || p.signerObjId === ''))
      )

      if (bulkSendDocs.length === 0) {
        console.log('❌ No bulk send documents found that need signer assignment')
        return
      }

      console.log(`📋 Found ${bulkSendDocs.length} bulk send documents to process`)

      // Process each document to assign signers
      const assignments = []
      
      for (const doc of bulkSendDocs) {
        // Get unique signers from placeholders
        const uniqueSigners = new Map()
        
        for (const placeholder of doc.Placeholders || []) {
          if (placeholder.email && (!placeholder.signerObjId || placeholder.signerObjId === '')) {
            if (!uniqueSigners.has(placeholder.email)) {
              // Extract name from document name (format: "Bulk Send: [name] - [signer name]")
              const namePart = doc.Name?.split(' - ').pop() || placeholder.email.split('@')[0]
              
              uniqueSigners.set(placeholder.email, {
                name: namePart,
                email: placeholder.email,
                phone: '' // Default phone
              })
            }
          }
        }

        // Assign each unique signer to this document
        for (const signerData of uniqueSigners.values()) {
          assignments.push({
            documentId: doc.objectId,
            signer: signerData
          })
        }
      }

      console.log(`📋 Will assign ${assignments.length} signers to documents`)

      // Execute assignments
      const results = []
      for (const assignment of assignments) {
        try {
          await bulkSendSignerService.addSignerToBulkSendDocument(
            assignment.documentId, 
            assignment.signer
          )
          results.push({ success: true, documentId: assignment.documentId, email: assignment.signer.email })
        } catch (error) {
          console.error(`❌ Failed to assign ${assignment.signer.email} to ${assignment.documentId}:`, error)
          results.push({ success: false, documentId: assignment.documentId, email: assignment.signer.email, error })
        }
      }

      // Report results
      const successful = results.filter(r => r.success).length
      const failed = results.filter(r => !r.success).length

      console.log(`✅ Bulk send assignment completed: ${successful} successful, ${failed} failed`)

      if (failed > 0) {
        console.warn('Some signer assignments failed:', results.filter(r => !r.success))
      }

    } catch (error) {
      console.error('❌ Failed to send bulk send:', error)
      throw error
    }
  }

  /**
   * Delete bulk send - For now, just show success since documents are handled separately
   * In a real implementation, this would mark documents as deleted/declined
   */
  async deleteBulkSend(bulkSendId: string): Promise<void> {
    try {
      // Get the bulk send to validate it exists
      const bulkSend = await this.getBulkSendById(bulkSendId)
      
      if (!bulkSend) {
        throw new Error('Bulk send not found')
      }

      // For demo purposes, we'll just log the deletion
      // In a real implementation, this would communicate with OpenSign to decline/delete documents
      console.log(`Bulk send "${bulkSend.name}" marked for deletion`)
      
      // Since we're working with a document-based approach and OpenSign server connectivity is unreliable,
      // we'll rely on the UI to remove the item optimistically
      // The next time the list is refreshed, if documents were actually declined, they won't show up
    } catch (error) {
      console.error('Error deleting bulk send:', error)
      throw error
    }
  }

  /**
   * Get bulk send details by ID
   */
  async getBulkSendById(bulkSendId: string): Promise<BulkSend | null> {
    try {
      const bulkSends = await this.getBulkSends()
      return bulkSends.find((bs: BulkSend) => bs.id === bulkSendId) || null
    } catch (error) {
      console.error('Error fetching bulk send:', error)
      return null
    }
  }

  /**
   * Get detailed bulk send information with documents
   */
  async getBulkSendDetails(bulkSendId: string): Promise<{
    id: string
    name: string
    templateName: string
    status: 'draft' | 'sending' | 'completed' | 'failed'
    totalRecipients: number
    completedCount: number
    createdAt: string
    sentAt?: string
    completedAt?: string
    message?: string
    sendInOrder: boolean
    documents: Array<{
      id: string
      recipientName: string
      recipientEmail: string
      status: 'pending' | 'sent' | 'viewed' | 'signed' | 'completed' | 'declined' | 'expired'
      sentAt?: string
      viewedAt?: string
      signedAt?: string
      completedAt?: string
      order: number
    }>
  } | null> {
    try {
      const bulkSend = await this.getBulkSendById(bulkSendId)
      if (!bulkSend) return null

      return {
        id: bulkSend.id,
        name: bulkSend.name,
        templateName: bulkSend.templateName,
        status: bulkSend.status,
        totalRecipients: bulkSend.totalRecipients,
        completedCount: bulkSend.completedCount,
        createdAt: bulkSend.createdAt,
        sentAt: bulkSend.createdAt, // In OpenSign, documents are sent when created
        completedAt: bulkSend.status === 'completed' ? bulkSend.updatedAt : undefined,
        message: undefined, // Would need to be stored in document notes
        sendInOrder: bulkSend.sendInOrder,
        documents: bulkSend.signers.map((signer, index) => ({
          id: signer.documentId || signer.id,
          recipientName: signer.name,
          recipientEmail: signer.email,
          status: signer.status as 'pending' | 'sent' | 'viewed' | 'signed' | 'completed' | 'declined' | 'expired',
          sentAt: signer.sentAt,
          viewedAt: signer.viewedAt,
          signedAt: signer.signedAt,
          completedAt: signer.status === 'signed' ? signer.signedAt : undefined,
          order: index + 1
        }))
      }
    } catch (error) {
      console.error('Error fetching bulk send details:', error)
      return null
    }
  }

  /**
   * Resend a specific document
   */
  async resendDocument(documentId: string): Promise<void> {
    try {
      // In OpenSign, we can potentially use the sendmailv3 function to resend emails
      // This is a placeholder for the actual implementation
      await openSignApiService.post('functions/sendmailv3', {
        documentId: documentId,
        resend: true
      })
    } catch (error) {
      console.error('Error resending document:', error)
      throw error
    }
  }

  /**
   * Get available tenants for bulk send
   */
  async getTenants(): Promise<Array<{id: string; name: string; email: string}>> {
    try {
      console.log('🏢 Fetching available tenants...')
      
      const tenantsResponse = await openSignApiService.get('classes/partners_Tenant', {
        where: {
          IsActive: true
        },
        limit: 100,
        order: 'TenantName'
      }) as OpenSignApiResponse<{
        objectId: string
        TenantName: string
        EmailAddress: string
        IsActive: boolean
      }>

      if (!tenantsResponse || !tenantsResponse.results) {
        console.log('No tenants found')
        return []
      }

      const tenants = tenantsResponse.results.map(tenant => ({
        id: tenant.objectId,
        name: tenant.TenantName || 'Unnamed Tenant',
        email: tenant.EmailAddress
      }))

      console.log(`✅ Found ${tenants.length} active tenants`)
      return tenants

    } catch (error) {
      console.error('Error fetching tenants:', error)
      throw error
    }
  }

  /**
   * Get team members/signers using current session token (no static tokens)
   * This replaces the complex logic in the create page
   */
  async getTeamMembers(): Promise<Array<{
    objectId: string
    Name: string
    Email: string
    UserRole: string
    IsDisabled: boolean
    TeamIds: string[]
    createdAt: string
    updatedAt: string
    Company?: string
  }>> {
    try {
      console.log('🔄 Loading team members using current session token...')

      // Get current session token from localStorage
      const currentToken = typeof window !== 'undefined' ? 
        (localStorage.getItem('accesstoken') || localStorage.getItem('opensign_session_token')) : null
      
      if (!currentToken) {
        console.error('❌ No session token available for team members')
        throw new Error('Please log in to load team members')
      }

      console.log('🔑 Using session token:', `${currentToken.substring(0, 10)}...`)

      // Try multiple approaches to get team members
      let teamMembers: Array<{
        objectId: string
        Name: string
        Email: string
        UserRole: string
        IsDisabled: boolean
        TeamIds: string[]
        createdAt: string
        updatedAt: string
        Company?: string
      }> = []

      // Approach 1: Try getsigners function (most reliable)
      try {
        console.log('📊 Approach 1: Using getsigners function...')
        
        const signersResponse = await fetch('http://94.249.71.89:9000/api/app/functions/getsigners', {
          method: 'POST',
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'X-Parse-Application-Id': 'opensign',
            'X-Parse-Session-Token': currentToken,
          },
          body: JSON.stringify({
            search: ''
          })
        })

        if (signersResponse.ok) {
          const data = await signersResponse.json() as {
            result?: Array<{
              objectId: string
              Name: string
              Email: string
              UserId?: { objectId: string }
              TenantId?: { objectId: string }
            }>
            error?: string
          }

          if (data.result && !data.error) {
            teamMembers = data.result
              .filter(contact => contact.Email && contact.Name)
              .map(contact => ({
                objectId: contact.objectId,
                Name: contact.Name,
                Email: contact.Email,
                UserRole: 'User',
                IsDisabled: false,
                TeamIds: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }))
            
            console.log(`✅ Loaded ${teamMembers.length} contacts from getsigners`)
            return teamMembers
          } else {
            console.log('⚠️ getsigners returned error:', data.error)
          }
        } else {
          console.log('⚠️ getsigners request failed:', signersResponse.status)
        }
      } catch (err) {
        console.log('⚠️ getsigners approach failed:', err)
      }

      // Approach 2: Try organization members via getteams -> getuserlistbyorg
      try {
        console.log('📊 Approach 2: Getting organization members...')
        
        const teamsResponse = await fetch('http://94.249.71.89:9000/api/app/functions/getteams', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify({
            active: true,
            _ApplicationId: 'opensign',
            _ClientVersion: 'js6.1.1',
            _InstallationId: '22ad0a9b-a8a2-400b-99f0-d979c070ea35',
            _SessionToken: currentToken,
          })
        })

        if (teamsResponse.ok) {
          const teamsData = await teamsResponse.json() as {
            result?: Array<{
              objectId: string
              Name: string
              OrganizationId?: {
                __type: string
                className: string
                objectId: string
              }
            }>
            error?: string
          }

          if (teamsData.result?.[0]?.OrganizationId) {
            const orgId = teamsData.result[0].OrganizationId.objectId
            console.log('🏢 Found organization ID:', orgId)

            const membersResponse = await fetch('http://94.249.71.89:9000/api/app/functions/getuserlistbyorg', {
              method: 'POST',
              headers: {
                'Content-Type': 'text/plain',
              },
              body: JSON.stringify({
                organizationId: orgId,
                _ApplicationId: 'opensign',
                _ClientVersion: 'js6.1.1',
                _InstallationId: 'ef44e42e-e0a3-44a0-a359-90c26af8ffac',
                _SessionToken: currentToken,
              })
            })

            if (membersResponse.ok) {
              const membersData = await membersResponse.json() as {
                result?: Array<{
                  objectId: string
                  Name?: string
                  Email?: string
                  UserRole?: string
                  UserId?: { name?: string; email?: string }
                }>
                error?: string
              }

              if (membersData.result && !membersData.error) {
                teamMembers = membersData.result.map(member => ({
                  objectId: member.objectId,
                  Name: member.Name || member.UserId?.name || 'Unknown User',
                  Email: member.Email || member.UserId?.email || '',
                  UserRole: member.UserRole || 'User',
                  IsDisabled: false,
                  TeamIds: [],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }))
                
                console.log(`✅ Loaded ${teamMembers.length} organization members`)
                return teamMembers
              }
            }
          }
        }
      } catch (err) {
        console.log('⚠️ Organization members approach failed:', err)
      }

      // If both approaches fail, return empty array
      console.log('⚠️ All approaches failed, returning empty team members list')
      return []

    } catch (error) {
      console.error('❌ Error loading team members:', error)
      throw error
    }
  }
}

export const bulkSendApiService = new BulkSendApiService()
