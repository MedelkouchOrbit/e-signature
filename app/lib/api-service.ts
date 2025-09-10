import { API_BASE_URL, API_OPENSIGN_URL, OPENSIGN_APP_ID } from "./constants";

// Generic API error class
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Helper function to get session token safely
const getSessionToken = (): string => {
  if (typeof window === 'undefined') return '';
  // Try multiple possible token keys for compatibility
  return localStorage.getItem("accesstoken") || 
         localStorage.getItem("opensign_session_token") || 
         "";
};

// Helper function to set session token safely
const setSessionToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    // Set both keys for compatibility
    localStorage.setItem("accesstoken", token);
    localStorage.setItem("opensign_session_token", token);
  }
};

// Helper function to clear session token safely
const clearSessionToken = (): void => {
  if (typeof window !== 'undefined') {
    // Clear both keys for compatibility
    localStorage.removeItem("accesstoken");
    localStorage.removeItem("opensign_session_token");
  }
};

// Helper function to handle API responses
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    let errorData: unknown = null;

  try {
    const responseText = await response.text();
    
    // Check if response is HTML (should no longer happen with fixed backend)
    if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html')) {
      console.warn('[API] Note: Backend has been fixed, but still received HTML response:', {
        url: response.url,
        status: response.status,
        contentType: response.headers.get('content-type')
      });
      throw new ApiError("Unexpected HTML response - backend API may need verification", response.status, {
        type: 'UNEXPECTED_HTML_RESPONSE',
        receivedHtml: true,
        url: response.url,
        note: 'Backend should now return JSON - please verify API endpoint'
      });
    }
    
    // Try to parse as JSON
    try {
      errorData = JSON.parse(responseText);
      if (typeof errorData === 'object' && errorData !== null) {
        const data = errorData as Record<string, unknown>;
        errorMessage = (data.message as string) || (data.error as string) || errorMessage;
      }
    } catch {
      // If not JSON, use the text content or status
      errorMessage = responseText || response.statusText || errorMessage;
    }
  } catch {
    // If response body is not readable, use status text
    errorMessage = response.statusText || errorMessage;
  }    throw new ApiError(errorMessage, response.status, errorData);
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }
  
  return response.text() as Promise<T>;
};

// Main API service for internal API routes
export const apiService = {
  get: async <T>(path: string, options?: RequestInit): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}/${path}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });
    return handleResponse<T>(response);
  },

  post: async <T, D = unknown>(path: string, data: D, options?: RequestInit): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: JSON.stringify(data),
      ...options,
    });
    return handleResponse<T>(response);
  },

  put: async <T, D = unknown>(path: string, data: D, options?: RequestInit): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}/${path}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: JSON.stringify(data),
      ...options,
    });
    return handleResponse<T>(response);
  },

  delete: async <T>(path: string, options?: RequestInit): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}/${path}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });
    return handleResponse<T>(response);
  },
};

// OpenSign API service (uses proxy for client-side, direct URL for server-side)
export const openSignApiService = {
  get: async <T>(path: string): Promise<T> => {
    // Use different base URLs for client-side (browser) vs server-side (SSR/API routes)
    const baseUrl = typeof window === 'undefined' 
      ? process.env.OPENSIGN_BASE_URL || "http://94.249.71.89:8080/app"
      : API_OPENSIGN_URL;
    
    const sessionToken = getSessionToken();
    console.log(`[OpenSign API] GET ${baseUrl}/${path}`);
    console.log(`[OpenSign API] Session token: ${sessionToken ? `${sessionToken.substring(0, 15)}...` : 'none'}`);
    
    const response = await fetch(`${baseUrl}/${path}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Parse-Application-Id": OPENSIGN_APP_ID,
        "X-Parse-Session-Token": sessionToken,
      },
    });
    
    console.log(`[OpenSign API] Response status: ${response.status}`);
    const result = await handleResponse<T>(response);
    console.log(`[OpenSign API] Response data:`, result);
    return result;
  },

  post: async <T, D = unknown>(path: string, data: D): Promise<T> => {
    // Use different base URLs for client-side (browser) vs server-side (SSR/API routes)
    const baseUrl = typeof window === 'undefined' 
      ? process.env.OPENSIGN_BASE_URL || "http://94.249.71.89:8080/app"
      : API_OPENSIGN_URL;
    
    const sessionToken = getSessionToken();
    console.log(`[OpenSign API] POST ${baseUrl}/${path}`);
    console.log(`[OpenSign API] Session token: ${sessionToken ? `${sessionToken.substring(0, 15)}...` : 'none'}`);
    console.log(`[OpenSign API] Data:`, data);
    
    const response = await fetch(`${baseUrl}/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Parse-Application-Id": OPENSIGN_APP_ID,
        "X-Parse-Session-Token": sessionToken,
      },
      body: JSON.stringify(data),
    });
    
    console.log(`[OpenSign API] Response status: ${response.status}`);
    const result = await handleResponse<T>(response);
    console.log(`[OpenSign API] Response data:`, result);
    return result;
  },

  put: async <T, D = unknown>(path: string, data: D): Promise<T> => {
    // Use different base URLs for client-side (browser) vs server-side (SSR/API routes)
    const baseUrl = typeof window === 'undefined' 
      ? process.env.OPENSIGN_BASE_URL || "http://94.249.71.89:8080/app"
      : API_OPENSIGN_URL;
    
    const response = await fetch(`${baseUrl}/${path}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Parse-Application-Id": OPENSIGN_APP_ID,
        "X-Parse-Session-Token": getSessionToken(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse<T>(response);
  },

  delete: async <T>(path: string): Promise<T> => {
    // Use different base URLs for client-side (browser) vs server-side (SSR/API routes)
    const baseUrl = typeof window === 'undefined' 
      ? process.env.OPENSIGN_BASE_URL || "http://94.249.71.89:8080/app"
      : API_OPENSIGN_URL;
    
    const response = await fetch(`${baseUrl}/${path}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-Parse-Application-Id": OPENSIGN_APP_ID,
        "X-Parse-Session-Token": getSessionToken(),
      },
    });
    return handleResponse<T>(response);
  },

  // Session management utilities
  setSessionToken,
  getSessionToken,
  clearSessionToken,
};
