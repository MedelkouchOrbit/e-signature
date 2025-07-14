// Global type definitions

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  status: 'success' | 'error';
  meta?: {
    page?: number;
    totalPages?: number;
    totalItems?: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  // Add more user properties
}

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Add more global types as needed