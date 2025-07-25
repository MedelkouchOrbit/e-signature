export interface UserCredentials {
  email: string
  password?: string
}

export interface UserRegistration extends UserCredentials {
  name: string
  termsAccepted: boolean
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
  result: {
    sessionToken: string
    objectId: string
    // Add other properties as needed based on the actual response
    [key: string]: unknown
  }
}
