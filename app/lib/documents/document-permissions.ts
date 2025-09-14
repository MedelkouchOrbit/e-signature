import type { Document } from "./documents-types"

/**
 * Utility functions for document permissions and user interactions
 */

/**
 * Check if current user can sign a specific document
 * Simplified version that checks local auth state and document signers
 */
export async function checkUserSignPermission(document: Document): Promise<boolean> {
  try {
    // Get current user email from auth
    let currentUserEmail = null
    if (typeof window !== 'undefined') {
      try {
        const authData = localStorage.getItem('auth-storage')
        if (authData) {
          const auth = JSON.parse(authData)
          currentUserEmail = auth.state?.user?.email
        }
      } catch {
        return false
      }
    }

    if (!currentUserEmail) {
      return false
    }

    // Check if user is in the signers list
    const userSigner = document.signers?.find(signer => 
      signer.email?.toLowerCase() === currentUserEmail.toLowerCase()
    )

    if (!userSigner) {
      return false
    }

    // Check if document is in a signable state
    if (document.status === 'declined' || document.status === 'expired') {
      return false // Document not available for signing
    }

    // Check if user already signed
    if (userSigner.status === 'signed') {
      return false // User already signed
    }

    // For sequential signing, check if it's user's turn
    if (document.sendInOrder) {
      const sortedSigners = [...(document.signers || [])].sort((a, b) => (a.order || 0) - (b.order || 0))
      const userIndex = sortedSigners.findIndex(s => s.email?.toLowerCase() === currentUserEmail.toLowerCase())
      
      // Check if all previous signers have signed
      for (let i = 0; i < userIndex; i++) {
        if (sortedSigners[i].status !== 'signed') {
          return false // Previous signer hasn't signed yet
        }
      }
    }

    return true

  } catch (error) {
    console.error('Error checking user sign permission:', error)
    return false
  }
}

/**
 * Get user's signing status for a document
 */
export function getUserSigningStatus(document: Document): {
  canSign: boolean
  status: 'not-signer' | 'already-signed' | 'waiting-turn' | 'can-sign'
  message: string
} {
  // Get current user email from auth
  let currentUserEmail = null
  if (typeof window !== 'undefined') {
    try {
      const authData = localStorage.getItem('auth-storage')
      if (authData) {
        const auth = JSON.parse(authData)
        currentUserEmail = auth.state?.user?.email
      }
    } catch {
      return { canSign: false, status: 'not-signer', message: 'Unable to determine user' }
    }
  }

  if (!currentUserEmail) {
    return { canSign: false, status: 'not-signer', message: 'User not authenticated' }
  }

  // Check if user is in the signers list
  const userSigner = document.signers?.find(signer => 
    signer.email?.toLowerCase() === currentUserEmail.toLowerCase()
  )

  if (!userSigner) {
    return { canSign: false, status: 'not-signer', message: 'You are not a signer for this document' }
  }

  // Check if user already signed
  if (userSigner.status === 'signed') {
    return { canSign: false, status: 'already-signed', message: 'You have already signed this document' }
  }

  // Check if document is completed
  if (document.status === 'declined' || document.status === 'expired') {
    return { canSign: false, status: 'already-signed', message: 'Document is no longer available for signing' }
  }

  // For sequential signing, check if it's user's turn
  if (document.sendInOrder) {
    const sortedSigners = [...(document.signers || [])].sort((a, b) => (a.order || 0) - (b.order || 0))
    const userIndex = sortedSigners.findIndex(s => s.email?.toLowerCase() === currentUserEmail.toLowerCase())
    
    // Check if all previous signers have signed
    for (let i = 0; i < userIndex; i++) {
      if (sortedSigners[i].status !== 'signed') {
        const pendingSigner = sortedSigners[i]
        return { 
          canSign: false, 
          status: 'waiting-turn', 
          message: `Waiting for ${pendingSigner.name || pendingSigner.email} to sign first` 
        }
      }
    }
  }

  return { canSign: true, status: 'can-sign', message: 'Ready to sign' }
}
