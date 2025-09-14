// Document status types matching OpenSign enhanced backend
export type DocumentStatus = 'waiting' | 'signed' | 'partially_signed' | 'drafted' | 'declined' | 'expired'

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
  Status?: string // Backend should set: "waiting", "signed", "declined", "expired"
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
  label?: string
  required?: boolean
  width?: number
  height?: number
  x?: number
  y?: number
  page?: number
  signerRole?: string
  email: string
  signerPtr: Record<string, unknown>
  signerObjId?: string
  status?: 'waiting' | 'signed' | 'declined' // ✅ Backend now provides status
  signedAt?: string // ✅ Backend provides signing timestamp in ISO format
  signedUrl?: string // ✅ Backend provides signed PDF URL
  ipAddress?: string // ✅ Backend provides signer IP address for audit
  order?: number // For sequential signing (SendinOrder)
}

// Our internal document interface for the frontend
export interface Document {
  objectId: string
  name: string
  description?: string
  note?: string
  status: DocumentStatus
  url?: string
  signedUrl?: string
  certificateUrl?: string
  createdAt: string
  updatedAt: string
  expiryDate?: string
  timeToCompleteDays?: number
  isCompleted: boolean
  isDeclined: boolean
  isSignyourself: boolean
  isEnableOTP: boolean
  isTour: boolean
  sendInOrder: boolean
  declineReason?: string
  signers: DocumentSigner[]
  placeholders: DocumentPlaceholder[]
  createdBy: {
    objectId: string
    name?: string
    email?: string
  }
  assignedTo?: {
    objectId: string
    name?: string
    email?: string
  }
  templateId?: string
}

export interface DocumentSigner {
  objectId: string
  name: string
  email: string
  phone?: string
  role?: string
  order?: number
  color: string
  status: 'waiting' | 'signed' | 'declined'
  signedAt?: string
}

export interface DocumentPlaceholder {
  id: string
  signerObjId: string
  role: string
  email: string
  color: string
  status?: 'waiting' | 'signed' | 'declined' // ✅ Enhanced: Status tracking from backend
  signedAt?: string // ✅ Enhanced: Signing timestamp from backend
  signedUrl?: string // ✅ Enhanced: Signed PDF URL from backend  
  ipAddress?: string // ✅ Enhanced: IP address for audit trail
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
    phone?: string
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
  userId: string // Required: User ID of the signer (dynamically retrieved from auth system)
  signature: string // Required: Base64 signature data (e.g., "data:image/png;base64,...")
  signatureData?: {
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

// Enhanced response interface matching backend implementation
export interface EnhancedSignResponse {
  status: 'success' | 'error' | 'partial_success'
  code?: number
  message?: string
  data?: {
    documentId?: string
    newStatus?: 'waiting' | 'signed' | 'partially_signed'
    signedPlaceholder?: {
      id: string
      email: string
      signedAt: string
      type: string
    }
    remainingSigners?: string[]
    signedUrl?: string
  }
  document?: OpenSignDocument
}
