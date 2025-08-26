import { openSignApiService } from "./api-service"

// Document status types matching OpenSign
export type DocumentStatus = 'waiting' | 'signed' | 'drafted' | 'declined' | 'expired'

// Request parameters interface
export interface GetDocumentsParams {
  limit?: number
  skip?: number
  searchTerm?: string
  status?: DocumentStatus | 'all'
  assignedToMe?: boolean
  page?: number
}

// Document interfaces based on OpenSign contracts_Document class
export interface OpenSignDocument {
  objectId: string
  Name: string
  URL?: string
  SignedUrl?: string
  CertificateUrl?: string
  Note?: string
  Description?: string
  createdAt: string
  updatedAt: string
  ExpiryDate?: {
    iso: string
    __type: "Date"
  }
  TimeToCompleteDays?: number
  IsCompleted?: boolean
  IsDeclined?: boolean
  IsSignyourself?: boolean
  IsEnableOTP?: boolean
  IsTour?: boolean
  SendinOrder?: boolean
  DeclineReason?: string
  Signers?: OpenSignSigner[]
  Placeholders?: OpenSignPlaceholder[]
  CreatedBy?: {
    objectId: string
    className: string
  }
  ExtUserPtr?: {
    objectId: string
    Name?: string
    Email?: string
    TenantId?: {
      objectId: string
      className: string
    }
  }
  TemplateId?: {
    objectId: string
    className: string
  }
}

export interface OpenSignSigner {
  objectId: string
  Name: string
  Email: string
  UserId?: {
    objectId: string
    className: string
  }
  ExtUserPtr?: {
    objectId: string
    className: string
  }
  status?: 'waiting' | 'signed' | 'declined'
  signedAt?: string
}

export interface OpenSignPlaceholder {
  id: string
  type: string
  label: string
  required: boolean
  width: number
  height: number
  x: number
  y: number
  page: number
  signerRole: string
  email: string
  signerPtr: Record<string, unknown>
  signerObjId: string
}

// Our internal document interface for the frontend
export interface Document {
  objectId: string
  name: string
  fileName: string
  url?: string
  signedUrl?: string
  note?: string
  description?: string
  status: DocumentStatus
  createdAt: string
  updatedAt: string
  expiryDate?: string
  timeToCompleteDays?: number
  isOtpEnabled?: boolean
  isTourEnabled?: boolean
  sendInOrder?: boolean
  declineReason?: string
  signers: DocumentSigner[]
  placeholders: DocumentPlaceholder[]
  createdBy: {
    id: string
    name: string
    email: string
  }
  assignedTo?: {
    id: string
    name: string
    email: string
  }
  templateId?: string
  // UI-specific properties
  senderName: string
  senderEmail: string
  receiverNames: string[]
  hasUserSigned: boolean
  canUserSign: boolean
  userRole?: string
}

export interface DocumentSigner {
  id: string
  name: string
  email: string
  role?: string
  color?: string
  status: 'waiting' | 'signed' | 'declined'
  signedAt?: string
  userId?: string
  contactId?: string
  order?: number
}

export interface DocumentPlaceholder {
  id: string
  signerObjId: string
  role: string
  email: string
  color: string
  fields: Array<{
    page: number
    x: number
    y: number
    width: number
    height: number
    type: string
    name?: string
    required?: boolean
    defaultValue?: string
  }>
}

// API request/response interfaces
export interface GetDocumentsParams {
  limit?: number
  skip?: number
  searchTerm?: string
  status?: DocumentStatus | 'all'
  assignedToMe?: boolean
  page?: number
}

export interface DocumentListResponse {
  results: Document[]
  count: number
}

export interface CreateDocumentRequest {
  name: string
  description?: string
  note?: string
  templateId?: string
  signers: Array<{
    name: string
    email: string
    role?: string
    order?: number
  }>
  sendInOrder?: boolean
  otpEnabled?: boolean
  tourEnabled?: boolean
  timeToCompleteDays?: number
  expiryDate?: string
}

export interface SignDocumentRequest {
  documentId: string
  signatureData: {
    positions: Array<{
      x: number
      y: number
      width: number
      height: number
      page: number
    }>
    signerInfo: {
      name: string
      email: string
    }
  }
}

// Document API Service Class
class DocumentsApiService {
  
    /**
   * Get documents using direct Parse queries to show both created and assigned documents
   * Uses $or condition to include documents where user is creator OR signer
   */
  async getDocuments(params: GetDocumentsParams = {}): Promise<DocumentListResponse> {
    try {
      const { status, limit = 10, skip = 0, searchTerm = '' } = params;
      
      // Get current user ID from auth store
      let currentUserId: string | null = null;
      let currentUserEmail: string | null = null;
      if (typeof window !== 'undefined') {
        try {
          const authData = localStorage.getItem('auth-storage');
          if (authData) {
            const parsed = JSON.parse(authData);
            currentUserId = parsed.state?.user?.id;
            currentUserEmail = parsed.state?.user?.email;
          }
        } catch {
          console.warn('Could not get user ID from auth store');
        }
      }

      if (!currentUserId) {
        return { results: [], count: 0 };
      }

      // Build base query conditions
      let whereConditions: Record<string, unknown> = {
        Type: { $ne: 'Folder' },
        IsArchive: { $ne: true }
      };

      // Build $or conditions to handle different ways a user can be associated with a document
      const userConditions: Record<string, unknown>[] = [
        // Documents created by user
        { CreatedBy: { __type: 'Pointer', className: '_User', objectId: currentUserId } }
      ];

      // Add condition for documents where user is a signer via contracts_Contactbook
      if (currentUserEmail) {
        userConditions.push({
          Signers: {
            $inQuery: {
              where: { 
                $or: [
                  // User linked via UserId pointer
                  { UserId: { __type: 'Pointer', className: '_User', objectId: currentUserId } },
                  // User linked via Email (fallback for cases where UserId not set)
                  { Email: currentUserEmail }
                ]
              },
              className: 'contracts_Contactbook'
            }
          }
        });

        // Also check placeholders directly by email using $inQuery approach
        userConditions.push({
          objectId: {
            $inQuery: {
              where: {
                Placeholders: {
                  $exists: true
                },
                $or: [
                  { 'Placeholders.email': currentUserEmail },
                  { 'Placeholders.0.email': currentUserEmail },
                  { 'Placeholders.1.email': currentUserEmail },
                  { 'Placeholders.2.email': currentUserEmail },
                  { 'Placeholders.3.email': currentUserEmail },
                  { 'Placeholders.4.email': currentUserEmail }
                ]
              },
              className: 'contracts_Document'
            }
          }
        });
      }

      // Add status-specific conditions
      if (status === 'drafted') {
        whereConditions = {
          ...whereConditions,
          IsCompleted: { $ne: true },
          IsDeclined: { $ne: true },
          SignedUrl: { $exists: false },
          // Only show documents created by user for drafts
          CreatedBy: { __type: 'Pointer', className: '_User', objectId: currentUserId }
        };
      } else if (status === 'waiting') {
        whereConditions = {
          ...whereConditions,
          IsCompleted: { $ne: true },
          IsDeclined: { $ne: true },
          SignedUrl: { $ne: null },
          ExpiryDate: { $gt: { __type: 'Date', iso: new Date().toISOString() } },
          $or: userConditions
        };
      } else if (status === 'signed') {
        whereConditions = {
          ...whereConditions,
          IsCompleted: true,
          IsDeclined: { $ne: true },
          $or: userConditions
        };
      } else {
        // For all documents or no status filter
        whereConditions = {
          ...whereConditions,
          $or: userConditions
        };
      }

      // Add search term if provided
      if (searchTerm) {
        whereConditions = {
          ...whereConditions,
          Name: { $regex: `.*${searchTerm}.*`, $options: 'i' }
        };
      }

      // Construct query parameters
      const queryParams = new URLSearchParams({
        where: JSON.stringify(whereConditions),
        order: '-updatedAt',
        limit: limit.toString(),
        skip: skip.toString(),
        include: 'CreatedBy,ExtUserPtr,ExtUserPtr.TenantId,Signers,Placeholders,AuditTrail.UserPtr',
        keys: 'objectId,Name,URL,SignedUrl,Note,Description,createdAt,updatedAt,ExpiryDate,TimeToCompleteDays,IsCompleted,IsDeclined,IsSignyourself,IsEnableOTP,IsTour,SendinOrder,DeclineReason,Signers,Placeholders,CreatedBy,ExtUserPtr,TemplateId'
      });

      console.log('Query URL:', `classes/contracts_Document?${queryParams.toString()}`);
      console.log('Where conditions:', JSON.stringify(whereConditions, null, 2));
      console.log('Current user ID:', currentUserId);
      console.log('Current user email:', currentUserEmail);

      // Make the API call
      const response = await openSignApiService.get<{ results: OpenSignDocument[]; count: number }>(
        `classes/contracts_Document?${queryParams.toString()}`
      );

      console.log('API Response:', response);

      const documents = (response.results || []).map(doc => transformOpenSignDocument(doc));

      return {
        results: documents,
        count: documents.length
      };
    } catch (error) {
      console.error('[Documents API] Error fetching documents:', error);
      throw error;
    }
  }
  
  /**
   * Get single document by ID
   */
  async getDocument(documentId: string): Promise<Document> {
    try {
      const queryParams = new URLSearchParams({
        include: 'CreatedBy,ExtUserPtr,Signers,Placeholders'
      })
      
      const response = await openSignApiService.get<OpenSignDocument>(
        `classes/contracts_Document/${documentId}?${queryParams.toString()}`
      )
      
      return transformOpenSignDocument(response)
    } catch (error) {
      console.error('Error fetching document:', error)
      throw error
    }
  }
  
  /**
   * Create a new document (usually from template)
   */
  async createDocument(data: CreateDocumentRequest): Promise<Document> {
    try {
      // Transform our format to OpenSign format
      const openSignData = transformToOpenSignFormat(data)
      
      const response = await openSignApiService.post<OpenSignDocument>(
        "classes/contracts_Document", 
        openSignData
      )
      
      return transformOpenSignDocument(response)
    } catch (error) {
      console.error('Error creating document:', error)
      throw error
    }
  }
  
  /**
   * Sign a document
   */
  async signDocument(data: SignDocumentRequest): Promise<Document> {
    try {
      // Use OpenSign's signPdf cloud function
      const response = await openSignApiService.post<OpenSignDocument>(
        "functions/signPdf",
        {
          documentId: data.documentId,
          signatureData: data.signatureData
        }
      )
      
      return transformOpenSignDocument(response)
    } catch (error) {
      console.error('Error signing document:', error)
      throw error
    }
  }
  
  /**
   * Share document with recipients
   */
  async shareDocument(documentId: string, recipients: string[], message?: string): Promise<void> {
    try {
      await openSignApiService.post("functions/shareDocument", {
        documentId,
        recipients,
        message
      })
    } catch (error) {
      console.error('Error sharing document:', error)
      throw error
    }
  }
  
  /**
   * Download document (signed or unsigned)
   */
  async downloadDocument(documentId: string, signed = false): Promise<string> {
    try {
      const document = await this.getDocument(documentId)
      return signed && document.signedUrl ? document.signedUrl : document.url || ''
    } catch (error) {
      console.error('Error downloading document:', error)
      throw error
    }
  }
  
  /**
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      await openSignApiService.delete(`classes/contracts_Document/${documentId}`)
    } catch (error) {
      console.error('Error deleting document:', error)
      throw error
    }
  }
  
  /**
   * Decline document with reason
   */
  async declineDocument(documentId: string, reason: string): Promise<Document> {
    try {
      const response = await openSignApiService.put<OpenSignDocument>(
        `classes/contracts_Document/${documentId}`,
        {
          IsDeclined: true,
          DeclineReason: reason
        }
      )
      
      return transformOpenSignDocument(response)
    } catch (error) {
      console.error('Error declining document:', error)
      throw error
    }
  }
}

// Transform OpenSign document to our internal format
function transformOpenSignDocument(doc: OpenSignDocument): Document {
  // Determine document status based on OpenSign fields
  let status: DocumentStatus = 'waiting'
  
  if (doc.IsDeclined) {
    status = 'declined'
  } else if (doc.IsCompleted) {
    status = 'signed'
  } else if (!doc.SignedUrl && !doc.Signers?.length) {
    status = 'drafted'
  } else if (doc.ExpiryDate) {
    const expiryDate = new Date(doc.ExpiryDate.iso)
    const now = new Date()
    if (now > expiryDate) {
      status = 'expired'
    }
  }
  
  // Transform placeholders as signers/receivers (this is where the actual recipients are)
  const uniqueEmails = new Set<string>()
  const signers: DocumentSigner[] = []
  
  // Extract unique emails from placeholders
  if (doc.Placeholders) {
    doc.Placeholders.forEach((placeholder: OpenSignPlaceholder, index) => {
      if (placeholder.email && !uniqueEmails.has(placeholder.email)) {
        uniqueEmails.add(placeholder.email)
        
        // Extract name from placeholder if available, otherwise use email
        const signerPtrName = (placeholder.signerPtr as { Name?: string })?.Name
        const name = signerPtrName || 
                    placeholder.email.split('@')[0] || 
                    `Signer ${signers.length + 1}`
        
        signers.push({
          id: placeholder.id || `placeholder-${index}`,
          name: name,
          email: placeholder.email,
          role: placeholder.signerRole || 'Signer',
          color: getSignerColor(signers.length),
          status: doc.IsCompleted ? 'signed' : 'waiting',
          userId: placeholder.signerObjId,
          contactId: placeholder.signerObjId,
          order: signers.length + 1
        })
      }
    })
  }
  
  // Fallback to Signers array if no placeholders
  if (signers.length === 0 && doc.Signers) {
    doc.Signers.forEach((signer, index) => {
      signers.push({
        id: signer.objectId,
        name: signer.Name,
        email: signer.Email,
        role: `Signer ${index + 1}`,
        color: getSignerColor(index),
        status: doc.IsCompleted ? 'signed' : 'waiting',
        userId: signer.UserId?.objectId,
        contactId: signer.objectId,
        order: index + 1
      })
    })
  }
  
  // Transform placeholders for field positioning (simplified)
  const placeholders: DocumentPlaceholder[] = (doc.Placeholders || []).map((placeholder: OpenSignPlaceholder) => ({
    id: placeholder.id,
    signerObjId: placeholder.signerObjId,
    role: placeholder.signerRole || 'Signer',
    email: placeholder.email,
    color: '#3B82F6', // Default blue color
    fields: [{
      page: placeholder.page,
      x: placeholder.x,
      y: placeholder.y,
      width: placeholder.width,
      height: placeholder.height,
      type: placeholder.type,
      name: placeholder.label,
      required: placeholder.required,
      defaultValue: ''
    }]
  }))
  
  // Get current user ID from localStorage (if available)
  const currentUserId = typeof window !== 'undefined' 
    ? localStorage.getItem('currentUserId') 
    : null
  
  // Check if current user can sign or has signed
  const userSigner = signers.find(s => s.userId === currentUserId)
  const hasUserSigned = userSigner?.status === 'signed'
  const canUserSign = userSigner?.status === 'waiting' && status !== 'signed' && status !== 'declined'
  
  return {
    objectId: doc.objectId,
    name: doc.Name,
    fileName: doc.Name,
    url: doc.URL,
    signedUrl: doc.SignedUrl,
    note: doc.Note,
    description: doc.Description,
    status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    expiryDate: doc.ExpiryDate?.iso,
    timeToCompleteDays: doc.TimeToCompleteDays,
    isOtpEnabled: doc.IsEnableOTP || false,
    isTourEnabled: doc.IsTour || false,
    sendInOrder: doc.SendinOrder || false,
    declineReason: doc.DeclineReason,
    signers,
    placeholders,
    createdBy: {
      id: doc.CreatedBy?.objectId || doc.ExtUserPtr?.objectId || '',
      name: doc.ExtUserPtr?.Name || 'Unknown',
      email: doc.ExtUserPtr?.Email || ''
    },
    assignedTo: userSigner ? {
      id: userSigner.id,
      name: userSigner.name,
      email: userSigner.email
    } : undefined,
    templateId: doc.TemplateId?.objectId,
    // UI-specific properties
    senderName: doc.ExtUserPtr?.Name || 'Unknown',
    senderEmail: doc.ExtUserPtr?.Email || '',
    receiverNames: signers.map(s => s.name),
    hasUserSigned,
    canUserSign,
    userRole: userSigner?.role
  }
}

// Transform our format to OpenSign format for creation
function transformToOpenSignFormat(data: CreateDocumentRequest): Record<string, unknown> {
  return {
    Name: data.name,
    Description: data.description || '',
    Note: data.note || '',
    TimeToCompleteDays: data.timeToCompleteDays || 30,
    IsEnableOTP: data.otpEnabled || false,
    IsTour: data.tourEnabled || false,
    SendinOrder: data.sendInOrder || false,
    ExpiryDate: data.expiryDate ? {
      __type: "Date",
      iso: data.expiryDate
    } : undefined,
    Signers: data.signers.map((signer, index) => ({
      Name: signer.name,
      Email: signer.email,
      Role: signer.role || `Signer ${index + 1}`,
      order: signer.order || index + 1
    })),
    TemplateId: data.templateId ? {
      __type: "Pointer",
      className: "contracts_Template",
      objectId: data.templateId
    } : undefined
  }
}

// Get signer color based on index (matching OpenSign style)
function getSignerColor(index: number): string {
  const colors = [
    '#3b82f6', // Blue for TK
    '#10b981', // Green for SM  
    '#f59e0b', // Orange for TU
    '#ef4444', // Red for HS
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f97316', // Orange
    '#ec4899', // Pink
    '#6366f1', // Indigo
  ]
  return colors[index % colors.length]
}

export const documentsApiService = new DocumentsApiService()
