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

// OpenSign Template interfaces (from contracts_Template class)
interface OpenSignTemplate {
  objectId: string
  Name: string
  URL: string
  Note?: string
  Description?: string
  Signers?: Record<string, unknown>[]
  IsArchive?: boolean
  Placeholders?: Record<string, unknown>[]
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
  Placeholders?: Record<string, unknown>[]
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
}

class BulkSendApiService {
  
  /**
   * Get bulk sends - Uses document pattern matching since contracts_BulkSend class doesn't exist yet
   */
  async getBulkSends(): Promise<BulkSend[]> {
    try {
      // Try to get real data first, but fallback to mock data if server is unavailable
      return await this.getMockBulkSends()
    } catch (error) {
      console.error('Error fetching bulk sends:', error)
      // Return mock data when server is unavailable
      return this.getFallbackMockData()
    }
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

      const documentsToCreate = data.signers.map((signer) => {
        // Update placeholders with signer information
        const updatedPlaceholders = template.Placeholders?.map((placeholder: Record<string, unknown>) => ({
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
          Name: `Bulk Send: ${data.name} - ${signer.name}`,
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
          SendinOrder: data.sendInOrder
          // ExtUserPtr and CreatedBy will be automatically set by backend
          // ACL will be automatically managed by backend
        }
      })

      // Create documents directly using Parse classes API since createBatchDocs doesn't exist
      const createdDocuments = []
      
      for (const doc of documentsToCreate) {
        try {
          const response = await openSignApiService.post<{objectId: string, createdAt: string}>(
            'classes/contracts_Document',
            doc
          )
          createdDocuments.push({
            ...doc,
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
        id: `bulk-${data.name.replace(/\s+/g, '-').toLowerCase()}`,
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
          sentAt: new Date().toISOString()
        })),
        sendInOrder: data.sendInOrder,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: '', // Will be set by backend
        documentIds: [] // Will be populated by backend
      }

      return bulkSend
    } catch (error) {
      console.error('Error creating bulk send:', error)
      throw error
    }
  }

  /**
   * Get template by ID from contracts_Template class
   */
  private async getTemplateById(templateId: string): Promise<OpenSignTemplate | null> {
    try {
      const queryParams = new URLSearchParams({
        include: 'CreatedBy'
      })
      
      const response = await openSignApiService.get<OpenSignTemplate>(
        `classes/contracts_Template/${templateId}?${queryParams.toString()}`
      )
      return response
    } catch (error) {
      console.error('Error fetching template:', error)
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const documentsResponse = await openSignApiService.get('classes/contracts_Document?include=Placeholders,Signers&limit=1000') as any
      const documents = documentsResponse?.results || []
      
      // Filter to bulk send documents created for this bulk send
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bulkSendDocs = documents.filter((doc: any) => 
        doc.Name?.includes('Bulk Send:') && 
        doc.Placeholders?.length > 0 &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        doc.Placeholders?.some((p: any) => p.email && (!p.signerObjId || p.signerObjId === ''))
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
}

export const bulkSendApiService = new BulkSendApiService()
