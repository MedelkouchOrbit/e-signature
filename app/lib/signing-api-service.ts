/**
 * API service for document signing functionality
 * Handles all OpenSign-compatible API calls for the signing process
 */

export interface SigningApiResponse<T = unknown> {
  result?: T
  error?: string
  success?: boolean
}

export interface Placeholder {
  objectId?: string
  pos: Array<{
    x: number
    y: number
    width: number
    height: number
  }>
  type: string
  page: number
  signerIndex: number
  required: boolean
}

export interface Signer {
  objectId: string
  Name: string
  Email: string
  Phone?: string
  Role?: string
}

export interface TenantDetails {
  objectId: string
  UserId: string
  TenantId: string
  Name: string
  Domain: string
  // Add other tenant fields as needed
}

export interface ContactDetails {
  objectId: string
  Name: string
  Email: string
  Phone?: string
  // Add other contact fields as needed
}

export interface DocumentDetails {
  objectId: string
  Name: string
  URL: string
  SignedUrl?: string
  Description?: string
  Note?: string
  Placeholders?: Placeholder[]
  Signers?: Signer[]
  SendinOrder?: boolean
  AutomaticReminders?: boolean
  RemindOnceInEvery?: number
  IsEnableOTP?: boolean
  IsTourEnabled?: boolean
  AllowModifications?: boolean
  TimeToCompleteDays?: number
  SignatureType?: Array<{ name: string; enabled: boolean }>
  NotifyOnSignatures?: boolean
  createdAt: string
  updatedAt: string
  status?: string
  ExtUserPtr?: string
}

export interface SubscriptionDetails {
  // Define subscription structure based on API response
  plan?: string
  features?: string[]
  // Add other subscription fields as needed
}

export interface WebhookEventData {
  event: 'viewed' | 'signed' | 'declined' | 'expired'
  contactId: string
  body: {
    type: string
    objectId: string
    file?: string
    name?: string
    note?: string
    description?: string
    signers?: Array<{
      name: string
      email: string
      phone?: string
    }>
    viewedBy?: string
    viewedAt?: string
    createdAt?: string
    signedBy?: string
    signedAt?: string
  }
}

class SigningApiService {
  private baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://app.opensignlabs.com'
  private applicationId = 'opensign'

  private async makeRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' = 'POST', 
    body?: Record<string, unknown>,
    headers?: Record<string, string>
  ): Promise<SigningApiResponse<T>> {
    try {

      const defaultHeaders: Record<string, string> = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        'x-parse-application-id': this.applicationId,
        'pragma': 'no-cache',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        ...headers
      }


      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: defaultHeaders,
        body: body ? JSON.stringify(body) : undefined,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { result: data.result || data, success: true }
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error)
      return { 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }
    }
  }

  /**
   * Make unauthenticated request for public load endpoints
   * Includes x-parse-application-id but does not include x-parse-session-token
   */
  private async makePublicRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' = 'POST', 
    body?: Record<string, unknown>,
    headers?: Record<string, string>
  ): Promise<SigningApiResponse<T>> {
    try {
      const defaultHeaders: Record<string, string> = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        'x-parse-application-id': this.applicationId,
        'pragma': 'no-cache',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        ...headers
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: defaultHeaders,
        body: body ? JSON.stringify(body) : undefined,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { result: data.result || data, success: true }
    } catch (error) {
      console.error(`Public API Error (${endpoint}):`, error)
      return { 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }
    }
  }

  /**
   * Get tenant information for a contact
   */
  async getTenant(contactId: string): Promise<SigningApiResponse<TenantDetails>> {
    return this.makeRequest<TenantDetails>(
      '/api/app/functions/gettenant',
      'POST',
      { contactId }
    )
  }

  /**
   * Get document details by document ID
   */
  async getDocument(docId: string): Promise<SigningApiResponse<DocumentDetails>> {
    return this.makeRequest<DocumentDetails>(
      '/api/app/functions/getDocument',
      'POST',
      { docId }
    )
  }

  /**
   * Get subscription information for a contact
   */
  async getSubscriptions(contactId: string): Promise<SigningApiResponse<SubscriptionDetails>> {
    return this.makeRequest<SubscriptionDetails>(
      '/api/app/functions/getsubscriptions',
      'POST',
      { contactId }
    )
  }

  /**
   * Get contact details by contact ID
   */
  async getContact(contactId: string): Promise<SigningApiResponse<ContactDetails>> {
    return this.makeRequest<ContactDetails>(
      '/api/app/functions/getcontact',
      'POST',
      { contactId }
    )
  }

  /**
   * Send webhook event for tracking document interactions
   */
  async callWebhook(data: WebhookEventData): Promise<SigningApiResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>(
      '/api/app/functions/callwebhook',
      'POST',
      data as unknown as Record<string, unknown>
    )
  }

  /**
   * Submit signature data for a document
   */
  async signDocument(
    docId: string, 
    contactId: string, 
    signatureData: {
      placeholderIndex: number
      signature: string
      coordinates: { x: number; y: number; width: number; height: number }
      pageNumber: number
    }
  ): Promise<SigningApiResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>(
      '/api/app/functions/signPdf',
      'POST',
      {
        docId,
        contactId,
        ...signatureData
      }
    )
  }

  /**
   * Complete the signing process
   */
  async completeSignature(docId: string, contactId: string): Promise<SigningApiResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>(
      '/api/app/functions/completeSignature',
      'POST',
      {
        docId,
        contactId
      }
    )
  }

  /**
   * Decline to sign a document
   */
  async declineDocument(
    docId: string, 
    contactId: string, 
    reason?: string
  ): Promise<SigningApiResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>(
      '/api/app/functions/declineDocument',
      'POST',
      {
        docId,
        contactId,
        reason
      }
    )
  }

  // ===== PUBLIC LOAD ENDPOINTS (NO AUTHENTICATION) =====

  /**
   * Get tenant information for load route (public, no auth required)
   */
  async getTenantPublic(contactId: string): Promise<SigningApiResponse<TenantDetails>> {
    return this.makePublicRequest<TenantDetails>(
      '/api/app/functions/gettenant',
      'POST',
      { contactId }
    )
  }

  /**
   * Get document details for load route (public, no auth required)
   */
  async getDocumentPublic(docId: string): Promise<SigningApiResponse<DocumentDetails>> {
    return this.makePublicRequest<DocumentDetails>(
      '/api/app/functions/getDocument',
      'POST',
      { docId }
    )
  }

  /**
   * Get subscription information for load route (public, no auth required)
   */
  async getSubscriptionsPublic(contactId: string): Promise<SigningApiResponse<SubscriptionDetails>> {
    return this.makePublicRequest<SubscriptionDetails>(
      '/api/app/functions/getsubscriptions',
      'POST',
      { contactId }
    )
  }

  /**
   * Get contact details for load route (public, no auth required)
   */
  async getContactPublic(contactId: string): Promise<SigningApiResponse<ContactDetails>> {
    return this.makePublicRequest<ContactDetails>(
      '/api/app/functions/getcontact',
      'POST',
      { contactId }
    )
  }

  /**
   * Call webhook for load route (public, no auth required)
   */
  async callWebhookPublic(data: WebhookEventData): Promise<SigningApiResponse<Record<string, unknown>>> {
    return this.makePublicRequest<Record<string, unknown>>(
      '/api/app/functions/callwebhook',
      'POST',
      data as unknown as Record<string, unknown>
    )
  }

  /**
   * Submit signature data for load route (public, no auth required)
   */
  async signDocumentPublic(
    docId: string, 
    contactId: string, 
    signatureData: {
      placeholderIndex: number
      signature: string
      coordinates: { x: number; y: number; width: number; height: number }
      pageNumber: number
    }
  ): Promise<SigningApiResponse<Record<string, unknown>>> {
    return this.makePublicRequest<Record<string, unknown>>(
      '/api/app/functions/signPdf',
      'POST',
      {
        docId,
        contactId,
        ...signatureData
      }
    )
  }
}

export const signingApiService = new SigningApiService()