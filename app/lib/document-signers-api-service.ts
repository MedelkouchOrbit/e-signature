/**
 * Document Signers API Service
 * Handles adding and managing signers for documents in OpenSign
 */

import { openSignApiService } from './api-service'

export interface DocumentSigner {
  id: string
  name: string
  email: string
  role: string
  color: string
  status: 'waiting' | 'signed' | 'declined'
  order: number
  userId?: string
  contactId?: string
}

export interface OpenSignContactResponse {
  objectId: string
  Name: string
  Email: string
  Phone?: string
  UserId?: {
    objectId: string
    __type: string
    className: string
  }
  UserRole?: string
  IsDeleted?: boolean
  createdAt: string
  updatedAt: string
}

export interface OpenSignDocument {
  objectId: string
  Name: string
  Signers?: OpenSignSigner[]
  Placeholders?: OpenSignPlaceholder[]
  AuditTrail?: OpenSignAuditTrail[]
  IsCompleted?: boolean
}

export interface OpenSignSigner {
  objectId: string
  Name: string
  Email: string
  UserId?: {
    objectId: string
    __type: string
    className: string
  }
}

export interface OpenSignPlaceholder {
  id: string
  email: string
  Role?: string
  signerRole?: string
  signerObjId?: string
  signerPtr?: {
    objectId: string
    Name?: string
    UserId?: {
      objectId: string
    }
  }
  order?: number
}

export interface OpenSignAuditTrail {
  Activity: string
  UserPtr?: {
    objectId: string
    Email: string
  }
}

/**
 * Add a signer to a document by ensuring they exist as a contact
 * and then linking them to the document
 */
export async function addSignerToDocument(documentId: string, signerData: {
  name: string
  email: string
  phone?: string
}): Promise<{ success: boolean; contactId?: string; error?: string }> {
  try {
    console.log('🔄 Adding signer to document:', documentId, signerData)

    // First, get the document to check if it's a bulk send document
    const document = await openSignApiService.get<OpenSignDocument>(`classes/contracts_Document/${documentId}?include=Signers,Placeholders`)
    
    if (!document) {
      return { success: false, error: 'Document not found' }
    }

    // Check if this is a bulk send document (Name contains "Bulk Send:")
    const isBulkSendDocument = document.Name?.includes('Bulk Send:')
    console.log(`📋 Document type: ${isBulkSendDocument ? 'Bulk Send' : 'Regular'} - "${document.Name}"`)

    // First, ensure the signer exists as a contact using savecontact
    const contactResponse = await openSignApiService.post<{
      result?: OpenSignContactResponse
      error?: string
    }>('functions/savecontact', {
      name: signerData.name,
      email: signerData.email.toLowerCase().trim(),
      phone: signerData.phone || ''
    })

    if (contactResponse.error) {
      console.error('❌ Error creating contact:', contactResponse.error)
      return { success: false, error: contactResponse.error }
    }

    const contact = contactResponse.result
    if (!contact?.objectId) {
      console.error('❌ No contact returned from savecontact')
      return { success: false, error: 'Failed to create contact' }
    }

    console.log('✅ Contact created/found:', contact.objectId)

    // Now link the contact to the document using linkContactToDoc
    const linkResponse = await openSignApiService.post<{
      contactId?: string
      error?: string
    }>('functions/linkcontacttodoc', {
      docId: documentId,
      email: signerData.email.toLowerCase().trim(),
      name: signerData.name,
      phone: signerData.phone || ''
    })

    if (linkResponse.error) {
      console.error('❌ Error linking contact to document:', linkResponse.error)
      return { success: false, error: linkResponse.error }
    }

    const contactId = linkResponse.contactId || contact.objectId
    console.log('✅ Successfully linked contact to document:', contactId)

    // For bulk send documents, we need to also update the Placeholders array
    if (isBulkSendDocument) {
      try {
        await updateBulkSendPlaceholders(documentId, document, contactId, signerData)
        console.log('✅ Updated bulk send placeholders')
      } catch (error) {
        console.warn('⚠️ Failed to update bulk send placeholders:', error)
        // Don't fail the entire operation if placeholder update fails
      }
    }

    return {
      success: true,
      contactId: contactId
    }

  } catch (error) {
    console.error('❌ Error in addSignerToDocument:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update placeholders array for bulk send documents
 */
async function updateBulkSendPlaceholders(
  documentId: string, 
  document: OpenSignDocument, 
  contactId: string, 
  signerData: { name: string; email: string; phone?: string }
): Promise<void> {
  const placeholders = document.Placeholders || []
  
  // Find if there's already a placeholder for this email or if we need to add one
  const existingPlaceholderIndex = placeholders.findIndex((ph: OpenSignPlaceholder) => 
    ph.email?.toLowerCase() === signerData.email.toLowerCase()
  )

  let updatedPlaceholders: OpenSignPlaceholder[]

  if (existingPlaceholderIndex >= 0) {
    // Update existing placeholder
    updatedPlaceholders = placeholders.map((ph: OpenSignPlaceholder, index: number) => {
      if (index === existingPlaceholderIndex) {
        return {
          ...ph,
          email: signerData.email,
          signerObjId: contactId,
          signerPtr: {
            objectId: contactId,
            Name: signerData.name,
            UserId: undefined // Will be set when contact has a user
          }
        }
      }
      return ph
    })
    console.log(`✅ Updated existing placeholder at index ${existingPlaceholderIndex}`)
  } else {
    // Add new placeholder
    const newPlaceholder: OpenSignPlaceholder = {
      id: `placeholder-${Date.now()}`,
      email: signerData.email,
      Role: 'signer',
      signerRole: 'signer',
      signerObjId: contactId,
      signerPtr: {
        objectId: contactId,
        Name: signerData.name,
        UserId: undefined // Will be set when contact has a user
      },
      order: placeholders.length + 1
    }
    
    updatedPlaceholders = [...placeholders, newPlaceholder]
    console.log(`✅ Added new placeholder for ${signerData.email}`)
  }

  // Update the document with new placeholders
  await openSignApiService.put(`classes/contracts_Document/${documentId}`, {
    Placeholders: updatedPlaceholders
  })

  console.log(`📋 Updated document ${documentId} with ${updatedPlaceholders.length} placeholders`)
}

/**
 * Remove a signer from a document
 */
export async function removeSignerFromDocument(documentId: string, contactId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🗑️ Removing signer from document:', documentId, contactId)

    // Get the current document to check type and update its arrays
    const document = await openSignApiService.get<OpenSignDocument>(`classes/contracts_Document/${documentId}?include=Signers,Placeholders`)

    if (!document) {
      return { success: false, error: 'Document not found' }
    }

    const isBulkSendDocument = document.Name?.includes('Bulk Send:')
    console.log(`📋 Document type: ${isBulkSendDocument ? 'Bulk Send' : 'Regular'} - "${document.Name}"`)

    // Remove from Signers array
    const updatedSigners = (document.Signers || []).filter((signer: OpenSignSigner) => 
      signer.objectId !== contactId
    )

    // For bulk send documents, handle placeholders differently
    let updatedPlaceholders: OpenSignPlaceholder[]

    if (isBulkSendDocument) {
      // For bulk send documents, we should clear the signer reference but keep the placeholder for re-assignment
      updatedPlaceholders = (document.Placeholders || []).map((placeholder: OpenSignPlaceholder) => {
        if (placeholder.signerObjId === contactId) {
          // Clear signer reference but keep placeholder structure
          return {
            ...placeholder,
            signerObjId: undefined,
            signerPtr: undefined
          }
        }
        return placeholder
      })
      console.log(`✅ Updated placeholders for bulk send document - cleared signer references`)
    } else {
      // For regular documents, remove placeholders that reference this contact
      updatedPlaceholders = (document.Placeholders || []).filter((placeholder: OpenSignPlaceholder) => 
        placeholder.signerObjId !== contactId
      )
      console.log(`✅ Removed placeholders for regular document`)
    }

    // Update the document
    await openSignApiService.put(`classes/contracts_Document/${documentId}`, {
      Signers: updatedSigners,
      Placeholders: updatedPlaceholders
    })

    console.log('✅ Successfully removed signer from document')
    return { success: true }

  } catch (error) {
    console.error('❌ Error removing signer from document:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get all signers for a document
 */
export async function getDocumentSigners(documentId: string): Promise<DocumentSigner[]> {
  try {
    console.log('📋 Getting signers for document:', documentId)

    const document = await openSignApiService.get<OpenSignDocument>(`classes/contracts_Document/${documentId}?include=Signers,Placeholders,AuditTrail.UserPtr`)

    if (!document) {
      console.warn('⚠️ Document not found:', documentId)
      return []
    }

    const signers: DocumentSigner[] = []
    const placeholders = document.Placeholders || []
    const auditTrail = document.AuditTrail || []

    // Extract signers from placeholders (this is where the real signer info is)
    placeholders.forEach((placeholder: OpenSignPlaceholder, index: number) => {
      if (placeholder.email && placeholder.Role !== 'prefill') {
        // Check if this signer has signed based on audit trail
        const hasSignedActivity = auditTrail.some((audit: OpenSignAuditTrail) => 
          audit.UserPtr?.Email === placeholder.email && 
          (audit.Activity === 'Signed' || audit.Activity === 'Completed')
        )

        const signer: DocumentSigner = {
          id: placeholder.id || `placeholder-${index}`,
          name: placeholder.signerPtr?.Name || placeholder.email.split('@')[0],
          email: placeholder.email,
          role: placeholder.signerRole || placeholder.Role || 'Signer',
          color: getSignerColor(index),
          status: document.IsCompleted ? 'signed' : hasSignedActivity ? 'signed' : 'waiting',
          order: index + 1,
          contactId: placeholder.signerObjId,
          userId: placeholder.signerPtr?.UserId?.objectId
        }

        signers.push(signer)
      }
    })

    console.log(`✅ Found ${signers.length} signers for document`)
    return signers

  } catch (error) {
    console.error('❌ Error getting document signers:', error)
    return []
  }
}

/**
 * Update signer order in a document
 */
export async function updateSignerOrder(documentId: string, signerOrder: { contactId: string; order: number }[]): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔄 Updating signer order for document:', documentId)

    const document = await openSignApiService.get<OpenSignDocument>(`classes/contracts_Document/${documentId}?include=Placeholders`)

    if (!document) {
      return { success: false, error: 'Document not found' }
    }

    // Update placeholder order based on signerOrder array
    const updatedPlaceholders = (document.Placeholders || []).map((placeholder: OpenSignPlaceholder) => {
      const orderInfo = signerOrder.find(item => item.contactId === placeholder.signerObjId)
      if (orderInfo) {
        return {
          ...placeholder,
          order: orderInfo.order
        }
      }
      return placeholder
    })

    // Sort placeholders by order
    updatedPlaceholders.sort((a: OpenSignPlaceholder, b: OpenSignPlaceholder) => (a.order || 0) - (b.order || 0))

    await openSignApiService.put(`classes/contracts_Document/${documentId}`, {
      Placeholders: updatedPlaceholders
    })

    console.log('✅ Successfully updated signer order')
    return { success: true }

  } catch (error) {
    console.error('❌ Error updating signer order:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get signer color based on index (consistent with OpenSign style)
 */
function getSignerColor(index: number): string {
  const colors = [
    '#3B82F6', // Blue
    '#EF4444', // Red  
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
  ]
  return colors[index % colors.length]
}

/**
 * Check if a user can sign a document (has permission and hasn't signed yet)
 */
export async function canUserSignDocument(documentId: string, userEmail: string): Promise<{ canSign: boolean; reason?: string }> {
  try {
    const signers = await getDocumentSigners(documentId)
    const userSigner = signers.find(s => s.email.toLowerCase() === userEmail.toLowerCase())

    if (!userSigner) {
      return { canSign: false, reason: 'User is not a signer for this document' }
    }

    if (userSigner.status === 'signed') {
      return { canSign: false, reason: 'User has already signed this document' }
    }

    return { canSign: true }

  } catch (error) {
    console.error('❌ Error checking if user can sign document:', error)
    return { canSign: false, reason: 'Error checking permissions' }
  }
}

/**
 * Bulk Send specific function to add multiple signers efficiently
 */
export async function addSignersToBulkSendDocument(documentId: string, signers: Array<{
  name: string
  email: string
  phone?: string
  role?: string
}>): Promise<{ success: boolean; addedSigners?: Array<{ email: string; contactId: string }>; error?: string }> {
  try {
    console.log('🔄 Adding multiple signers to bulk send document:', documentId, signers.length)

    // Get document details first
    const document = await openSignApiService.get<OpenSignDocument>(`classes/contracts_Document/${documentId}?include=Signers,Placeholders`)
    
    if (!document) {
      return { success: false, error: 'Document not found' }
    }

    if (!document.Name?.includes('Bulk Send:')) {
      return { success: false, error: 'This function is only for bulk send documents' }
    }

    const addedSigners: Array<{ email: string; contactId: string }> = []
    const currentPlaceholders = document.Placeholders || []

    // Process each signer
    for (const signer of signers) {
      try {
        // Create contact
        const contactResponse = await openSignApiService.post<{
          result?: OpenSignContactResponse
          error?: string
        }>('functions/savecontact', {
          name: signer.name,
          email: signer.email.toLowerCase().trim(),
          phone: signer.phone || ''
        })

        if (contactResponse.error || !contactResponse.result?.objectId) {
          console.warn(`⚠️ Failed to create contact for ${signer.email}:`, contactResponse.error)
          continue
        }

        const contactId = contactResponse.result.objectId

        // Link to document
        const linkResponse = await openSignApiService.post<{
          contactId?: string
          error?: string
        }>('functions/linkcontacttodoc', {
          docId: documentId,
          email: signer.email.toLowerCase().trim(),
          name: signer.name,
          phone: signer.phone || ''
        })

        if (linkResponse.error) {
          console.warn(`⚠️ Failed to link contact ${contactId} to document:`, linkResponse.error)
          continue
        }

        addedSigners.push({ email: signer.email, contactId })
        
        // Add placeholder for this signer
        const newPlaceholder: OpenSignPlaceholder = {
          id: `placeholder-${Date.now()}-${addedSigners.length}`,
          email: signer.email,
          Role: signer.role || 'signer',
          signerRole: signer.role || 'signer',
          signerObjId: contactId,
          signerPtr: {
            objectId: contactId,
            Name: signer.name,
            UserId: undefined
          },
          order: currentPlaceholders.length + addedSigners.length
        }

        currentPlaceholders.push(newPlaceholder)

      } catch (error) {
        console.warn(`⚠️ Error processing signer ${signer.email}:`, error)
        continue
      }
    }

    // Update document with all new placeholders at once
    if (addedSigners.length > 0) {
      await openSignApiService.put(`classes/contracts_Document/${documentId}`, {
        Placeholders: currentPlaceholders
      })

      console.log(`✅ Successfully added ${addedSigners.length} signers to bulk send document`)
    }

    return {
      success: true,
      addedSigners
    }

  } catch (error) {
    console.error('❌ Error in addSignersToBulkSendDocument:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export const documentSignersApiService = {
  addSignerToDocument,
  removeSignerFromDocument,
  getDocumentSigners,
  updateSignerOrder,
  canUserSignDocument,
  addSignersToBulkSendDocument
}
