/**
 * ✅ TypeScript interfaces for Contacts/Signers operations
 * Aligned with OpenSign backend patterns and modern TypeScript practices
 */

export interface Contact {
  objectId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export interface Signer {
  objectId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  userId?: string;
  isRegistered?: boolean;
  status?: SignerStatus;
  createdAt: string;
  updatedAt: string;
}

export type SignerStatus = 'pending' | 'signed' | 'rejected' | 'completed';

export interface CreateContactRequest {
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

export interface EditContactRequest {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
}

export interface BatchContactRequest {
  contacts: CreateContactRequest[];
}

export interface SignerSearchRequest {
  search?: string;
  limit?: number;
  skip?: number;
}

export interface ContactBookResponse {
  isInContactBook: boolean;
  contact?: Contact;
}

// API Response Types
export interface GetSignersResponse {
  result?: Signer[];
  error?: string;
}

export interface GetContactResponse {
  result?: Contact;
  error?: string;
}

export interface SaveContactResponse {
  result?: Contact;
  error?: string;
}

export interface BatchContactResponse {
  result?: {
    success: Contact[];
    errors: Array<{
      email: string;
      error: string;
    }>;
  };
  error?: string;
}
