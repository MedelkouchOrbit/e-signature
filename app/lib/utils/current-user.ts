// Utility to get current user information from various sources

export interface CurrentUser {
  id?: string
  email?: string
}

export function getCurrentUser(): CurrentUser {
  if (typeof window === 'undefined') {
    return {}
  }

  let currentUserId: string | null = null
  let currentUserEmail: string | null = null

  // Try to get user ID from direct storage
  currentUserId = localStorage.getItem('currentUserId')

  // Try to get user info from auth storage
  try {
    const authData = localStorage.getItem('auth-storage')
    if (authData) {
      const auth = JSON.parse(authData)
      if (auth.state?.user) {
        currentUserEmail = auth.state.user.email
        if (!currentUserId) {
          currentUserId = auth.state.user.id
        }
      }
    }
  } catch {
    // Ignore parsing errors
  }

  // Try to get user info from opensign_user storage
  try {
    const opensignUser = localStorage.getItem('opensign_user')
    if (opensignUser) {
      const user = JSON.parse(opensignUser)
      if (user.email && !currentUserEmail) {
        currentUserEmail = user.email
      }
      if (user.objectId && !currentUserId) {
        currentUserId = user.objectId
      }
    }
  } catch {
    // Ignore parsing errors
  }

  return {
    id: currentUserId || undefined,
    email: currentUserEmail || undefined
  }
}

// Async function to get current user from the API
export async function getCurrentUserFromApi(): Promise<CurrentUser> {
  try {
    const sessionToken = getCurrentSessionToken()
    if (!sessionToken) {
      return {}
    }

    const response = await fetch('http://94.249.71.89:9000/api/app/users/me', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Origin': 'http://94.249.71.89:9000',
        'Referer': 'http://94.249.71.89:9000/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        _ApplicationId: 'opensign',
        _ClientVersion: 'js6.1.1',
        _InstallationId: 'ef44e42e-e0a3-44a0-a359-90c26af8ffac',
        _SessionToken: sessionToken,
        _method: 'GET'
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const userData = await response.json()
    
    return {
      id: userData.objectId,
      email: userData.email
    }
  } catch (error) {
    console.warn('Could not get current user from API:', error)
    return {}
  }
}

export function getCurrentSessionToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  console.log('🔍 getCurrentSessionToken: Checking for session token...')

  // First, try to get session token from cookies (opensign_session_token)
  try {
    console.log('🍪 Checking cookies for session token...')
    console.log('🍪 All cookies:', document.cookie)
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === 'opensign_session_token') {
        const token = decodeURIComponent(value)
        console.log('✅ Found session token in cookies:', token.substring(0, 10) + '...')
        return token
      }
    }
  } catch (error) {
    console.error('❌ Error parsing cookies:', error)
  }

  // Fallback to localStorage auth-storage
  try {
    console.log('📦 Checking localStorage auth-storage...')
    const authData = localStorage.getItem('auth-storage')
    if (authData) {
      const auth = JSON.parse(authData)
      const token = auth.state?.sessionToken
      if (token) {
        console.log('✅ Found session token in auth-storage:', token.substring(0, 10) + '...')
        return token
      }
    }
  } catch (error) {
    console.error('❌ Error parsing auth-storage:', error)
  }

  // Also check localStorage for opensign_session_token
  try {
    console.log('📦 Checking localStorage opensign_session_token...')
    const sessionToken = localStorage.getItem('opensign_session_token')
    if (sessionToken) {
      console.log('✅ Found session token in localStorage:', sessionToken.substring(0, 10) + '...')
      return sessionToken
    }
  } catch (error) {
    console.error('❌ Error getting localStorage token:', error)
  }

  console.log('❌ No session token found anywhere')
  return null
}

export function isUserDocumentCreator(document: { createdBy?: { id?: string; email?: string } }): boolean {
  const currentUser = getCurrentUser()
  
  if (!document.createdBy) {
    return false
  }

  // Check by user ID
  if (currentUser.id && document.createdBy.id && currentUser.id === document.createdBy.id) {
    return true
  }

  // Check by email
  if (currentUser.email && document.createdBy.email && currentUser.email === document.createdBy.email) {
    return true
  }

  return false
}

export function canUserSignDocument(
  document: { 
    status: string
    sendInOrder?: boolean
    signers: Array<{ 
      userId?: string
      email: string
      status: string
      order?: number
    }>
    createdBy?: { id?: string; email?: string }
  }
): boolean {
  const currentUser = getCurrentUser()
  
  // Document must be in waiting status
  if (document.status !== 'waiting') {
    return false
  }

  // Find the current user in signers list
  const userSigner = document.signers.find(s => 
    (currentUser.id && s.userId === currentUser.id) ||
    (currentUser.email && s.email === currentUser.email)
  )

  // User must be a signer and their status must be waiting
  if (!userSigner || userSigner.status !== 'waiting') {
    return false
  }

  // If sending in order, check if it's the user's turn
  if (document.sendInOrder && userSigner.order) {
    const previousSigners = document.signers.filter(s => 
      s.order && s.order < userSigner!.order!
    )
    const allPreviousSignersSigned = previousSigners.every(s => s.status === 'signed')
    return allPreviousSignersSigned
  }

  // If not sending in order, user can sign anytime
  return true
}
