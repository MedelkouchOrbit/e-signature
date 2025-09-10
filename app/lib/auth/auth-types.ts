export interface UserCredentials {
  email: string
  password?: string
}

export interface UserRegistration extends UserCredentials {
  name: string
  role: string
  timezone: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    name?: string
  }
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
  ACL?: {
    [key: string]: {
      read: boolean
      write: boolean
    }
  }
  // Add other properties as needed based on the actual response
  [key: string]: unknown
}
