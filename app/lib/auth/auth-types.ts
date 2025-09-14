export interface UserCredentials {
  email: string
  password?: string
}

export interface UserRegistration extends UserCredentials {
  name: string
  role: string
  timezone: string
  company?: string // Optional company name for organization creation
  jobTitle?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  pincode?: string
}

export interface AuthUser {
  id: string
  email: string
  name?: string
}

export interface AuthResponse {
  user: AuthUser
  token: string
}

export interface OpenSignLoginResponse {
  objectId: string
  username: string
  email: string
  name?: string
  sessionToken: string
  createdAt: string
  updatedAt: string
  isActive?: boolean
  activationStatus?: 'pending_approval' | 'approved' | 'rejected'
  activatedBy?: string
  activatedAt?: string
  ACL?: {
    [key: string]: {
      read: boolean
      write: boolean
    }
  }
  // Add other properties as needed based on the actual response
  [key: string]: unknown
}

// Enhanced signup response with approval workflow
export interface EnhancedSignupResponse {
  success: boolean
  message: string
  user: OpenSignLoginResponse
  requiresApproval: boolean
}

// Parse Server response wrapper
export interface ParseServerResponse<T = unknown> {
  result?: T
  error?: string
  [key: string]: unknown
}

export interface OTPLoginResponse {
  result: {
    objectId: string
    email: string
    name?: string
    sessionToken: string
    [key: string]: unknown
  }
}
