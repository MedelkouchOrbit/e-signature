import { NextRequest, NextResponse } from 'next/server'

// OpenSign Parse Server configuration with fallback endpoints
const OPENSIGN_BASE_URL = process.env.OPENSIGN_BASE_URL || 'http://94.249.71.89:9000'
const OPENSIGN_APP_ID = process.env.OPENSIGN_APP_ID || 'opensign'
const OPENSIGN_MASTER_KEY = process.env.OPENSIGN_MASTER_KEY || ''
const OPENSIGN_USERNAME = process.env.OPENSIGN_USERNAME || ''
const OPENSIGN_PASSWORD = process.env.OPENSIGN_PASSWORD || ''

// Possible Parse Server mount paths to try
const POSSIBLE_MOUNT_PATHS = ['/1', '/api/1', '/parse/1', '/app', '/parse', '/api', '']

// Cache for session token to avoid multiple login attempts
let cachedSessionToken: string | null = null
let tokenExpiry: number = 0

// Helper function to authenticate and get session token
async function getSessionToken(): Promise<string | null> {
  // Return cached token if still valid (expires after 1 hour)
  if (cachedSessionToken && Date.now() < tokenExpiry) {
    return cachedSessionToken
  }

  // If we have username/password, try to login
  if (OPENSIGN_USERNAME && OPENSIGN_PASSWORD) {
    try {
      console.log('[OpenSign Proxy] Attempting to authenticate...')
      
      for (const mountPath of POSSIBLE_MOUNT_PATHS) {
        const loginUrl = `${OPENSIGN_BASE_URL}${mountPath}/login`
        
        const response = await fetch(loginUrl, {
          method: 'POST',
          headers: {
            'X-Parse-Application-Id': OPENSIGN_APP_ID,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: OPENSIGN_USERNAME,
            password: OPENSIGN_PASSWORD,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.sessionToken) {
            cachedSessionToken = data.sessionToken
            tokenExpiry = Date.now() + (60 * 60 * 1000) // 1 hour
            console.log('[OpenSign Proxy] ✅ Authentication successful')
            return cachedSessionToken
          }
        }
      }
    } catch (error) {
      console.error('[OpenSign Proxy] Authentication failed:', error)
    }
  }

  return null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  return handleRequest(request, resolvedParams, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  return handleRequest(request, resolvedParams, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  return handleRequest(request, resolvedParams, 'PUT')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  return handleRequest(request, resolvedParams, 'DELETE')
}

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  try {
    // Reconstruct the path
    const path = params.path.join('/')
    const searchParams = request.nextUrl.searchParams.toString()
    const fullPath = searchParams ? `${path}?${searchParams}` : path
    
    // Read request body once at the beginning
    let requestBody = ''
    if (method === 'POST' || method === 'PUT') {
      try {
        requestBody = await request.text()
      } catch (error) {
        console.error('Error reading request body:', error)
      }
    }
    
    console.log(`[OpenSign Proxy] ${method} attempting to proxy: ${fullPath}`)

    // Try different Parse Server mount paths
    let lastError: Error | null = null
    
    for (const mountPath of POSSIBLE_MOUNT_PATHS) {
      const targetUrl = `${OPENSIGN_BASE_URL}${mountPath}/${fullPath}`
      console.log(`[OpenSign Proxy] Trying endpoint: ${targetUrl}`)

      try {
        const response = await attemptRequest(targetUrl, request, method, requestBody)
        const responseText = await response.text()
        
        // Check if we got HTML (frontend) response
        if (responseText.includes('<!DOCTYPE html>')) {
          console.log(`[OpenSign Proxy] Got HTML response from ${mountPath}, trying next path...`)
          continue
        }
        
        // Try to parse as JSON to see if it's a valid API response
        try {
          const data = JSON.parse(responseText)
          
          // If it's a Parse Server error response (but still valid JSON), that means we found the right endpoint
          if (data.code && data.error) {
            console.log(`[OpenSign Proxy] ✅ Found Parse Server API at ${mountPath} (authentication error)`)
            return NextResponse.json(data, {
              status: response.status,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Parse-Application-Id, X-Parse-Session-Token',
              },
            })
          }
          
          // If it's successful JSON response
          if (response.ok) {
            console.log(`[OpenSign Proxy] ✅ Success with mount path: ${mountPath}`)
            return NextResponse.json(data, {
              status: response.status,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Parse-Application-Id, X-Parse-Session-Token',
              },
            })
          }
          
        } catch {
          // Not valid JSON, continue to next mount path
          console.log(`[OpenSign Proxy] Invalid JSON response from ${mountPath}`)
        }
        
        // Store the error for final fallback
        lastError = new Error(`HTTP ${response.status}: ${responseText}`)
        
      } catch (error) {
        console.log(`[OpenSign Proxy] ❌ Failed with mount path ${mountPath}:`, error)
        lastError = error as Error
        continue
      }
    }

    // If all attempts failed, return error with troubleshooting info
    console.error('[OpenSign Proxy] All mount paths failed:', lastError)
    
    return NextResponse.json(
      { 
        error: 'Parse Server API not accessible', 
        details: lastError?.message || 'All endpoint attempts failed',
        troubleshooting: {
          issue: 'Parse Server API endpoints are not responding with JSON',
          attempted_endpoints: POSSIBLE_MOUNT_PATHS.map(path => `${OPENSIGN_BASE_URL}${path}/${fullPath}`),
          received: 'HTML response (OpenSign frontend) instead of JSON API response',
          recommendations: [
            'Verify Parse Server is running and properly mounted',
            'Check if Parse Server port/configuration is correct',
            'Ensure API routes are not being intercepted by frontend routing',
            'Verify network connectivity and firewall settings'
          ]
        }
      },
      { 
        status: 502,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Parse-Application-Id, X-Parse-Session-Token',
        },
      }
    )

  } catch (error) {
    console.error('[OpenSign Proxy] Unexpected error:', error)
    
    return NextResponse.json(
      { 
        error: 'Proxy request failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Parse-Application-Id, X-Parse-Session-Token',
        },
      }
    )
  }
}

async function attemptRequest(targetUrl: string, request: NextRequest, method: string, requestBody?: string): Promise<Response> {
  // Prepare headers
  const headers: HeadersInit = {
    'X-Parse-Application-Id': OPENSIGN_APP_ID,
    'Content-Type': 'application/json',
  }

  // Copy relevant headers from the original request
  let sessionToken = request.headers.get('X-Parse-Session-Token')
  
  // Check if session token is missing or malformed (like 'X-Parse-Session-Token;')
  if (!sessionToken || sessionToken === ';' || sessionToken.trim() === '') {
    console.log('[OpenSign Proxy] Missing or malformed session token, attempting auto-authentication...')
    
    // Try to get a session token automatically
    const autoToken = await getSessionToken()
    if (autoToken) {
      sessionToken = autoToken
      console.log('[OpenSign Proxy] Using auto-generated session token')
    } else if (OPENSIGN_MASTER_KEY) {
      // Fall back to master key if available (for development only)
      headers['X-Parse-Master-Key'] = OPENSIGN_MASTER_KEY
      console.log('[OpenSign Proxy] Using master key for authentication')
    } else {
      console.log('[OpenSign Proxy] No authentication method available')
    }
  }
  
  if (sessionToken && sessionToken !== ';') {
    headers['X-Parse-Session-Token'] = sessionToken
  }

  // Copy other relevant headers
  const authorization = request.headers.get('Authorization')
  if (authorization) {
    headers['Authorization'] = authorization
  }

  // Add CORS headers for browser requests
  const origin = request.headers.get('Origin')
  if (origin) {
    headers['Origin'] = origin
  }

  // Prepare the fetch options
  const fetchOptions: RequestInit = {
    method,
    headers,
  }

  // Add body for POST, PUT requests
  if ((method === 'POST' || method === 'PUT') && requestBody) {
    fetchOptions.body = requestBody
  }

  // Make the request to OpenSign Parse Server
  return fetch(targetUrl, fetchOptions)
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Parse-Application-Id, X-Parse-Session-Token',
    },
  })
}
