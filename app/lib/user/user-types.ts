/**
 * ✅ User Profile Types
 * Modular types for user profile operations
 */

export interface EnhancedUserProfile {
  id: string
  name: string
  email: string
  phone?: string
  profilePicture?: string
  createdAt: string
  updatedAt: string
  isEmailVerified: boolean
  extendedId?: string
  // Enhanced profile data
  documentsCreated: number
  documentsWaitingForSignature: number
  documentsSigned: number
  templatesCreated: number
  organizationRole?: string
  subscription?: {
    plan: string
    status: string
    expiresAt?: string
  }
}

export interface GetUserProfileResponse {
  result?: EnhancedUserProfile
  error?: string
}

export interface UpdateUserProfileRequest {
  name?: string
  phone?: string
  profilePicture?: string
}
