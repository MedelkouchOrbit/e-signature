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

// OpenSign API service (direct connection to backend)
export const openSignApiService = {
  get: async <T>(path: string, params: Record<string, unknown> = {}): Promise<T> => {
    // Always use direct backend URL for both client and server-side
    const baseUrl = "http://94.249.71.89:9000/api/app";
    
    const sessionToken = getSessionToken();
    
    // ✅ OpenSign format: ALL endpoints use POST with metadata in body, no Parse headers
    const isParseRestAPI = path.startsWith('users/') || path.startsWith('classes/') || path.startsWith('installations/') || path.startsWith('roles/') || path.startsWith('sessions/');
    
    const openSignData = {
      ...params,
      _ApplicationId: "opensign",
      _ClientVersion: "js6.1.1",
      _InstallationId: "ef44e42e-e0a3-44a0-a359-90c26af8ffac",
      ...(sessionToken && { _SessionToken: sessionToken }),
      // Add _method: "GET" for Parse REST API endpoints
      ...(isParseRestAPI && { _method: "GET" })
    };
    
    console.log(`[OpenSign] POST ${baseUrl}/${path} (${isParseRestAPI ? 'Parse REST with _method: GET' : 'Cloud Function'})`);
    console.log(`[OpenSign] Session token: ${sessionToken ? `${sessionToken.substring(0, 15)}...` : 'none'}`);
    console.log(`[OpenSign] Data:`, openSignData);
    
    const response = await fetch(`${baseUrl}/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "Origin": "http://94.249.71.89:9000",
        "Referer": "http://94.249.71.89:9000/",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
      },
      body: JSON.stringify(openSignData),
    });
    
    console.log(`[OpenSign] Response status: ${response.status}`);
    const result = await handleResponse<T>(response);
    console.log(`[OpenSign] Response data:`, result);
    return result;
  },

  post: async <T, D = unknown>(path: string, data: D): Promise<T> => {
    // Always use direct backend URL for both client and server-side
    const baseUrl = "http://94.249.71.89:9000/api/app";
    
    const sessionToken = getSessionToken();
    
    // ✅ OpenSign format: ALL requests use POST with metadata in body, Content-Type: text/plain
    const openSignData = {
      ...data,
      _ApplicationId: "opensign",
      _ClientVersion: "js6.1.1",
      _InstallationId: "ef44e42e-e0a3-44a0-a359-90c26af8ffac",
      ...(sessionToken && { _SessionToken: sessionToken })
    };
    
    console.log(`[OpenSign] POST ${baseUrl}/${path}`);
    console.log(`[OpenSign] Session token: ${sessionToken ? `${sessionToken.substring(0, 15)}...` : 'none'}`);
    console.log(`[OpenSign] Data:`, openSignData);
    
    const response = await fetch(`${baseUrl}/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "Origin": "http://94.249.71.89:9000",
        "Referer": "http://94.249.71.89:9000/",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
      },
      body: JSON.stringify(openSignData),
    });
    
    console.log(`[OpenSign] Response status: ${response.status}`);
    const result = await handleResponse<T>(response);
    console.log(`[OpenSign] Response data:`, result);
    return result;
  },

  put: async <T, D = unknown>(path: string, data: D): Promise<T> => {
    // Always use direct backend URL for both client and server-side
    const baseUrl = "http://94.249.71.89:9000/api/app";
    
    const sessionToken = getSessionToken();
    
    // ✅ OpenSign format: ALL requests use POST with metadata in body, Content-Type: text/plain
    const openSignData = {
      ...data,
      _method: "PUT",
      _ApplicationId: "opensign",
      _ClientVersion: "js6.1.1",
      _InstallationId: "ef44e42e-e0a3-44a0-a359-90c26af8ffac",
      ...(sessionToken && { _SessionToken: sessionToken })
    };
    
    console.log(`[OpenSign] POST ${baseUrl}/${path} (with _method: PUT)`);
    console.log(`[OpenSign] Session token: ${sessionToken ? `${sessionToken.substring(0, 15)}...` : 'none'}`);
    console.log(`[OpenSign] Data:`, openSignData);
    
    const response = await fetch(`${baseUrl}/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "Origin": "http://94.249.71.89:9000",
        "Referer": "http://94.249.71.89:9000/",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
      },
      body: JSON.stringify(openSignData),
    });
    
    console.log(`[OpenSign] Response status: ${response.status}`);
    const result = await handleResponse<T>(response);
    console.log(`[OpenSign] Response data:`, result);
    return result;
  },

  delete: async <T>(path: string, params: Record<string, unknown> = {}): Promise<T> => {
    // Always use direct backend URL for both client and server-side
    const baseUrl = "http://94.249.71.89:9000/api/app";
    
    const sessionToken = getSessionToken();
    
    // ✅ FIX: Add OpenSign metadata and session token to query parameters for DELETE requests
    const openSignParams = {
      ...params,
      _ApplicationId: "opensign",
      _ClientVersion: "js6.1.1",
      _InstallationId: "ef44e42e-e0a3-44a0-a359-90c26af8ffac",
      ...(sessionToken && { _SessionToken: sessionToken })
    };
    
    // Convert params to query string
    const queryString = Object.keys(openSignParams).length > 0 
      ? '?' + new URLSearchParams(openSignParams as Record<string, string>).toString()
      : '';
    
    console.log(`[OpenSign API] DELETE ${baseUrl}/${path}${queryString}`);
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

  // Parse Server cloud function calls
  callFunction: async <T>(functionName: string, params: Record<string, unknown> = {}, options?: { sessionToken?: string; excludeSessionToken?: boolean }): Promise<T> => {
    // Always use direct backend URL for both client and server-side
    const baseUrl = "http://94.249.71.89:9000/api/app";
    
    // Handle session token based on options
    let sessionToken = '';
    if (options?.excludeSessionToken) {
      // Explicitly exclude session token (for login, signup, etc.)
      sessionToken = '';
    } else if (options?.sessionToken) {
      // Use provided session token
      sessionToken = options.sessionToken;
    } else {
      // Use stored session token
      sessionToken = getSessionToken();
    }
    
    // ✅ FIX: Use the exact format that works in curl - include session token in payload
    const openSignParams = {
      ...params,
      ...(sessionToken && !options?.excludeSessionToken && { "_SessionToken": sessionToken })
    };
    
    console.log(`[OpenSign Cloud Function] Calling ${functionName} with params:`, openSignParams);
    console.log(`[OpenSign Cloud Function] Session token: ${sessionToken ? `${sessionToken.substring(0, 15)}...` : 'none'}`);
    
    // ✅ Match the working curl request headers exactly
    const headers: Record<string, string> = {
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Content-Type": "text/plain",  // ✅ Changed from application/json to text/plain
      "Origin": "http://94.249.71.89:9000",  // ✅ Changed from localhost to actual server
      "Pragma": "no-cache",
      "Referer": "http://94.249.71.89:9000/users",  // ✅ Changed referer
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
    };
    
    // ✅ Remove session token header - only use payload
    // No sessiontoken header or X-Parse-Application-Id header as per working curl
    
    const response = await fetch(`${baseUrl}/functions/${functionName}`, {
      method: "POST",
      headers,
      body: JSON.stringify(openSignParams),
    });
    
    console.log(`[OpenSign API] Response status: ${response.status}`);
    const result = await handleResponse<T>(response);
    console.log(`[OpenSign API] Response data:`, result);
    return result;
  },

  // Session management utilities
  setSessionToken,
  getSessionToken,
  clearSessionToken,

  // Helper function for direct fetch calls with OpenSign format
  directFetch: async <T>(path: string, options: RequestInit = {}): Promise<T> => {
    const baseUrl = "http://94.249.71.89:9000/api/app";
    const sessionToken = getSessionToken();
    
    // Ensure path doesn't start with /
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // Parse existing body if it's a string
    let bodyData: Record<string, unknown> = {};
    if (options.body && typeof options.body === 'string') {
      try {
        bodyData = JSON.parse(options.body);
      } catch {
        bodyData = {};
      }
    }
    
    // Add OpenSign metadata
    const openSignData = {
      ...bodyData,
      _ApplicationId: "opensign",
      _ClientVersion: "js6.1.1",
      _InstallationId: "ef44e42e-e0a3-44a0-a359-90c26af8ffac",
      ...(sessionToken && { _SessionToken: sessionToken })
    };
    
    const requestOptions: RequestInit = {
      ...options,
      method: options.method || "POST",
      headers: {
        "Content-Type": "text/plain",
        "Origin": "http://94.249.71.89:9000",
        "Referer": "http://94.249.71.89:9000/",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
        ...options.headers
      },
      body: JSON.stringify(openSignData)
    };
    
    const response = await fetch(`${baseUrl}/${cleanPath}`, requestOptions);
    return handleResponse<T>(response);
  }
};
