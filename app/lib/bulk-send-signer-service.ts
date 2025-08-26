/**
 * Bulk Send Signer Service
 * Uses the proven API pattern from successful test
 */

import { openSignApiService } from './api-service'

export interface BulkSendSigner {
  name: string
  email: string
  phone?: string
}

export interface BulkSendPlaceholder {
  id: string
  email?: string
  Role?: string
  signerRole?: string
  signerObjId?: string
  signerPtr?: {
    __type: string
    className: string
    objectId: string
  }
  order?: number
  [key: string]: any
}

export interface BulkSendSignerPointer {
  __type: string
  className: string
  objectId: string
}

export interface BulkSendDocument {
  objectId: string
  Name: string
  Placeholders: BulkSendPlaceholder[]
  Signers: BulkSendSignerPointer[]
}

/**
 * Service for managing bulk send document signers
 * Uses the exact pattern that was proven to work in our test
 */
export class BulkSendSignerService {
  
  /**
   * Add a signer to a bulk send document
   * This follows the exact pattern that was proven to work in our test
   */
  async addSignerToBulkSendDocument(documentId: string, signer: BulkSendSigner): Promise<void> {
    try {
      // Step 1: Get document with current placeholders and signers
      const document = await this.getBulkSendDocumentInfo(documentId)
      
      if (!document.Name?.includes('Bulk Send:')) {
        throw new Error('Document is not a bulk send document')
      }

      // Step 2: Create contact in contracts_Contactbook (using direct table creation)
      const contact = await this.createContact(signer)
      
      // Step 3: Update existing placeholders that have the signer email but no signerObjId
      const updatedPlaceholders = document.Placeholders.map(placeholder => {
        if (placeholder.email === signer.email && (!placeholder.signerObjId || placeholder.signerObjId === '')) {
          return {
            ...placeholder,
            signerObjId: contact.objectId,
            signerPtr: {
              __type: 'Pointer',
              className: 'contracts_Contactbook',
              objectId: contact.objectId
            }
          }
        }
        return placeholder
      })

      // Step 4: Add contact pointer to signers array
      const newSigner: BulkSendSignerPointer = {
        __type: 'Pointer',
        className: 'contracts_Contactbook',
        objectId: contact.objectId
      }
      
      const updatedSigners = [...document.Signers, newSigner]

      // Step 5: Update document with new placeholders and signers
      await openSignApiService.put(`classes/contracts_Document/${documentId}`, {
        Placeholders: updatedPlaceholders,
        Signers: updatedSigners
      })

      console.log(`✅ Successfully added signer ${signer.email} to bulk send document ${documentId}`)
      
    } catch (error) {
      console.error('❌ Failed to add signer to bulk send document:', error)
      throw error
    }
  }

  /**
   * Create a contact in contracts_Contactbook
   * Using direct table creation (proven to work in test)
   */
  private async createContact(signer: BulkSendSigner): Promise<{ objectId: string }> {
    try {
      const response = await openSignApiService.post('classes/contracts_Contactbook', {
        Name: signer.name,
        Email: signer.email,
        Phone: signer.phone || ''
      }) as any

      if (!response?.objectId) {
        throw new Error('Failed to create contact - no objectId returned')
      }

      return { objectId: response.objectId }
      
    } catch (error) {
      console.error('❌ Failed to create contact:', error)
      throw error
    }
  }

  /**
   * Get bulk send document information
   */
  async getBulkSendDocumentInfo(documentId: string): Promise<BulkSendDocument> {
    try {
      const response = await openSignApiService.get(`classes/contracts_Document/${documentId}?include=Placeholders,Signers`) as any
      
      if (!response) {
        throw new Error('Document not found')
      }

      return {
        objectId: response.objectId,
        Name: response.Name,
        Placeholders: response.Placeholders || [],
        Signers: response.Signers || []
      }
      
    } catch (error) {
      console.error('❌ Failed to get document info:', error)
      throw error
    }
  }

  /**
   * Check if a signer is already assigned to a document
   */
  async isSignerAssigned(documentId: string, email: string): Promise<boolean> {
    try {
      const document = await this.getBulkSendDocumentInfo(documentId)
      
      // Check if any placeholder has this email with a signerObjId
      return document.Placeholders.some(placeholder => 
        placeholder.email === email && 
        placeholder.signerObjId && 
        placeholder.signerObjId !== ''
      )
      
    } catch (error) {
      console.error('❌ Failed to check signer assignment:', error)
      return false
    }
  }

  /**
   * Get all signers for a bulk send document
   */
  async getDocumentSigners(documentId: string): Promise<Array<{email: string, contactId: string}>> {
    try {
      const document = await this.getBulkSendDocumentInfo(documentId)
      
      return document.Placeholders
        .filter(placeholder => placeholder.email && placeholder.signerObjId && placeholder.signerObjId !== '')
        .map(placeholder => ({
          email: placeholder.email!,
          contactId: placeholder.signerObjId!
        }))
        
    } catch (error) {
      console.error('❌ Failed to get document signers:', error)
      return []
    }
  }
}

// Export singleton instance
export const bulkSendSignerService = new BulkSendSignerService()
