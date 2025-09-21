// Shared type definitions for the e-signature application

// OpenSign API Response type
export interface OpenSignApiResponse<T = unknown> {
  results: T[]
  count?: number
}

// OpenSign Documents Response type
export interface OpenSignDocumentsResponse {
  results: OpenSignDocument[]
  count?: number
}

// OpenSign User type
export interface OpenSignUser {
  objectId: string
  email: string
  name?: string
  Phone?: string
  Company?: string
  JobTitle?: string
  createdAt: string
  updatedAt: string
}

// OpenSign Team Member type  
export interface OpenSignTeamMember {
  objectId: string
  Email: string
  Name?: string
  Phone?: string
  Company?: string
  UserRole?: string
  createdAt: string
  updatedAt: string
}

// OpenSign Placeholder type
export interface OpenSignPlaceholder {
  Id: string
  email?: string
  signerObjId?: string
  signerPtr?: {
    __type: string
    className: string
    objectId: string
  }
  placeHolder: Array<{
    pageDetails: {
      pageNumber: number
      Height: number
      Width: number
    }
    pos: {
      x: number
      y: number
    }
    type: string
    options?: {
      name: string
      status: string
      defaultValue?: string
    }
  }>
}

// OpenSign Signer type
export interface OpenSignSigner {
  objectId: string
  Email: string
  Name?: string
  Phone?: string
  Company?: string
  createdAt: string
  updatedAt: string
}

// OpenSign Document type
export interface OpenSignDocument {
  objectId: string
  Name: string
  URL: string
  Note?: string
  Signers?: OpenSignSigner[]
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
  CreatedBy?: OpenSignUser
}

// Form validation interfaces
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  email?: boolean
  custom?: (value: unknown) => boolean | string
}

export interface ValidationRules {
  [key: string]: ValidationRule
}

export interface ValidationErrors {
  [key: string]: string
}

// API interfaces
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginationData {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface LoadingState {
  isLoading: boolean
  error: string | null
}

// Common component props
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}