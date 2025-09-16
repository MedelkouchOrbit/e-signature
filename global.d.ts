import en from './messages/en.json';
 
type Messages = typeof en;

// Environment variables
declare global {
  // Use type safe message keys with `next-intl`
  interface IntlMessages extends Messages {}
  
  // Environment variables
  namespace NodeJS {
    interface ProcessEnv {
      OPENSIGN_APP_ID: string;
      API_OPENSIGN_URL: string;
      NEXTAUTH_SECRET: string;
      NEXTAUTH_URL: string;
    }
  }
  
  // Global variables available in browser
  var OPENSIGN_APP_ID: string;
  var API_OPENSIGN_URL: string;
}

// API Response types
export interface ParseServerResponse<T = unknown> {
  result: T;
  error?: string;
}

export interface OpenSignLoginResponse {
  sessionToken: string;
  objectId: string;
  username: string;
  email: string;
  name?: string;
}

export interface EnhancedSignupResponse {
  success: boolean
  message?: string
  requiresApproval?: boolean
  user: {
    objectId: string
    sessionToken: string
    email: string
    name?: string
  }
  organization?: {
    objectId: string
    name: string
  }
}

// Document creation request
export interface CreateDocumentRequest {
  name: string;
  file: File | Blob;
  signers: Array<{
    name: string;
    email: string;
    role?: string;
  }>;
  message?: string;
  sendInOrder?: boolean;
  expiryDays?: number;
}
