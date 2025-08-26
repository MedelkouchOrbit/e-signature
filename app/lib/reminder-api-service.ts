import { openSignApiService } from "./api-service"

export interface ReminderRequest {
  documentId: string
  recipientEmail: string
  recipientName?: string
  customSubject?: string
  customMessage?: string
}

interface OpenSignDocument {
  objectId: string
  Name: string
  ExtUserPtr?: {
    objectId: string
    Name: string
    Email: string
  }
  Signers?: Array<{
    Email: string
    Name: string
  }>
  AuditTrail?: Array<{
    UserPtr: {
      Email: string
    }
    Activity: string
  }>
}

interface AuditTrailEntry {
  UserPtr: {
    Email: string
  }
  Activity: string
}

interface DocumentSigner {
  Email: string
  Name: string
}

/**
 * Reminder API Service for sending reminders using OpenSign's sendmailv3 function
 */
class ReminderApiService {
  
  /**
   * Send reminder email to document signer
   */
  async sendReminder(request: ReminderRequest): Promise<void> {
    try {
      // Get document details first to extract necessary information
      const document = await this.getDocumentDetails(request.documentId)
      
      if (!document) {
        throw new Error('Document not found')
      }

      // Prepare reminder email
      const reminderData = this.buildReminderData(document, request)
      
      // Send reminder using OpenSign's sendmailv3 function
      await openSignApiService.post('functions/sendmailv3', reminderData)
      
      console.log(`Reminder sent successfully to ${request.recipientEmail}`)
    } catch (error) {
      console.error('Error sending reminder:', error)
      throw error
    }
  }

  /**
   * Get document details from OpenSign
   */
  private async getDocumentDetails(documentId: string): Promise<OpenSignDocument | null> {
    try {
      const response = await openSignApiService.get(`classes/contracts_Document/${documentId}`)
      return response as OpenSignDocument
    } catch (error) {
      console.error('Error fetching document details:', error)
      return null
    }
  }

  /**
   * Build reminder email data for sendmailv3 function
   */
  private buildReminderData(document: OpenSignDocument, request: ReminderRequest) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    
    // Create signing URL - similar to how OpenSign does it
    const encodeBase64 = btoa(`${document.objectId}/${request.recipientEmail}`)
    const signingUrl = `${baseUrl}/login/${encodeBase64}`
    
    // Default subject and message templates
    const defaultSubject = request.customSubject || 
      `Reminder: Please sign "${document.Name || 'Document'}"`
    
    const defaultMessage = request.customMessage || 
      `<html><head><meta http-equiv='Content-Type' content='text/html; charset=UTF-8' /></head>
       <body>
         <p>Hi ${request.recipientName || request.recipientEmail},</p>
         <br>
         <p>This is a friendly reminder that you have a document waiting for your signature.</p>
         <p><strong>Document:</strong> "${document.Name || 'Document'}"</p>
         <br>
         <p><a href='${signingUrl}' rel='noopener noreferrer' target='_blank' 
              style='background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>
              Sign Document
           </a></p>
         <br>
         <p>If you have any questions, please contact ${document.ExtUserPtr?.Name || 'the sender'}.</p>
         <br>
         <p>Thanks,<br>Team OpenSign</p>
       </body>
       </html>`

    return {
      replyto: document.ExtUserPtr?.Email || 'noreply@opensign.com',
      extUserId: document.ExtUserPtr?.objectId,
      recipient: request.recipientEmail,
      subject: defaultSubject,
      from: document.ExtUserPtr?.Email || 'noreply@opensign.com',
      html: defaultMessage
    }
  }

  /**
   * Send reminder to all pending signers of a document
   */
  async sendReminderToAll(documentId: string): Promise<void> {
    try {
      const document = await this.getDocumentDetails(documentId)
      
      if (!document || !document.Signers) {
        throw new Error('Document or signers not found')
      }

      // Find pending signers (those who haven't signed yet)
      const pendingSigners = document.Signers.filter((signer: DocumentSigner) => {
        // Check if this signer has signed by looking at AuditTrail
        const hasSignedActivity = document.AuditTrail?.some((audit: AuditTrailEntry) => 
          audit.UserPtr?.Email === signer.Email && 
          (audit.Activity === 'Signed' || audit.Activity === 'Completed')
        )
        
        return !hasSignedActivity
      })

      // Send reminders to all pending signers
      const reminderPromises = pendingSigners.map((signer: DocumentSigner) => 
        this.sendReminder({
          documentId,
          recipientEmail: signer.Email,
          recipientName: signer.Name
        })
      )

      await Promise.all(reminderPromises)
      
      console.log(`Reminders sent to ${pendingSigners.length} pending signers`)
    } catch (error) {
      console.error('Error sending reminders to all:', error)
      throw error
    }
  }

  /**
   * Check if a document has pending signers
   */
  async hasPendingSigners(documentId: string): Promise<boolean> {
    try {
      const document = await this.getDocumentDetails(documentId)
      
      if (!document || !document.Signers) {
        return false
      }

      // Check if any signer hasn't signed yet
      const pendingSigners = document.Signers.filter((signer: DocumentSigner) => {
        const hasSignedActivity = document.AuditTrail?.some((audit: AuditTrailEntry) => 
          audit.UserPtr?.Email === signer.Email && 
          (audit.Activity === 'Signed' || audit.Activity === 'Completed')
        )
        
        return !hasSignedActivity
      })

      return pendingSigners.length > 0
    } catch (error) {
      console.error('Error checking pending signers:', error)
      return false
    }
  }
}

export const reminderApiService = new ReminderApiService()
