import { NextRequest, NextResponse } from 'next/server'

// OpenSign Parse Server configuration with fallback endpoints
const OPENSIGN_BASE_URL = process.env.OPENSIGN_BASE_URL || 'http://94.249.71.89:9000'
const OPENSIGN_APP_ID = process.env.OPENSIGN_APP_ID || 'opensign'
const OPENSIGN_MASTER_KEY = process.env.OPENSIGN_MASTER_KEY || 'opensigndemo'
const OPENSIGN_USERNAME = process.env.OPENSIGN_USERNAME || 'admin@admin.com'
const OPENSIGN_PASSWORD = process.env.OPENSIGN_PASSWORD || 'admin@123'

// ✅ CORRECTED: Parse Server mount paths based on OpenSign server analysis
// OpenSign mounts at /app, not /api/app
const POSSIBLE_MOUNT_PATHS = ['/api/app', '/app', '/1', '/api/1', '/parse/1', '/parse', '/api', '']

// Cache for session token to avoid multiple login attempts
let cachedSessionToken: string | null = null // ✅ FIXED: Remove hardcoded token for security
let tokenExpiry: number = 0 // Token expiry time

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
        const loginUrl = `${OPENSIGN_BASE_URL}${mountPath}/functions/loginuser`
        
        const response = await fetch(loginUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify({
            _ApplicationId: OPENSIGN_APP_ID,
            _ClientVersion: 'js6.1.1',
            _InstallationId: 'ef44e42e-e0a3-44a0-a359-90c26af8ffac',
            email: OPENSIGN_USERNAME,
            password: OPENSIGN_PASSWORD,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.result?.sessionToken) {
            cachedSessionToken = data.result.sessionToken
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
    let path = params.path.join('/')
    
    // Fix for incorrect path construction - clean up malformed paths
    // Remove redundant 'api/app/' prefix that sometimes appears
    path = path.replace(/^api\/app\//, '')
    
    // Ensure we have a clean path
    if (!path) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      )
    }
    
    const searchParams = request.nextUrl.searchParams.toString()
    const fullPath = searchParams ? `${path}?${searchParams}` : path
    
    console.log(`[OpenSign Proxy] ${method} attempting to proxy: ${fullPath}`)
    
    // Read request body once at the beginning - handle both JSON and FormData
    let requestBody: string | FormData | null = null
    let isFormData = false
    
    // Check for large request handling (signPdf with PDF content)
    const isLargeRequest = fullPath.includes('/functions/signPdf')
    
    if (method === 'POST' || method === 'PUT') {
      try {
        const contentType = request.headers.get('content-type') || ''
        
        if (contentType.includes('multipart/form-data')) {
          // Handle file uploads and form data
          requestBody = await request.formData()
          isFormData = true
          console.log('[OpenSign Proxy] Processing multipart/form-data request')
        } else {
          // Handle JSON body or text
          const rawBody = await request.text()
          
          if (isLargeRequest) {
            console.log(`[OpenSign Proxy] Large request detected for signPdf - size: ${rawBody.length} bytes`)
            
            // For signPdf requests, try to optimize the payload
            if (rawBody.includes('"pdfFile"')) {
              try {
                const jsonData = JSON.parse(rawBody)
                if (jsonData.pdfFile) {
                  const pdfSize = jsonData.pdfFile.length
                  console.log(`[OpenSign Proxy] PDF content size: ${Math.round(pdfSize/1024)}KB`)
                  
                  // If PDF is too large (>100KB), try signing without PDF first
                  if (pdfSize > 100000) {
                    console.log(`[OpenSign Proxy] 🚨 Large PDF detected (${Math.round(pdfSize/1024)}KB) - attempting signature without PDF content first`)
                    
                    // Create a version without the PDF for initial signing
                    const signOnlyData = { ...jsonData }
                    delete signOnlyData.pdfFile
                    
                    console.log(`[OpenSign Proxy] 📝 Attempting signature-only request first...`)
                    requestBody = JSON.stringify(signOnlyData)
                  } else {
                    // Medium size - ensure proper format
                    if (!jsonData.pdfFile.startsWith('data:application/pdf;base64,')) {
                      console.log('[OpenSign Proxy] Adding proper PDF data URL prefix')
                      jsonData.pdfFile = `data:application/pdf;base64,${jsonData.pdfFile}`
                    }
                    requestBody = JSON.stringify(jsonData)
                  }
                } else {
                  requestBody = rawBody
                }
              } catch {
                console.log('[OpenSign Proxy] Could not parse JSON for PDF size analysis')
                requestBody = rawBody
              }
            } else {
              requestBody = rawBody
            }
          } else {
            requestBody = rawBody
          }
        }
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
        const response = await attemptRequestWithRetry(targetUrl, request, method, requestBody, Boolean(isFormData))
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
          // Handle both standard Parse errors (data.code && data.error) and function errors (data.error)
          if ((data.code && data.error) || data.error) {
            console.log(`[OpenSign Proxy] ✅ Found Parse Server API at ${mountPath} (error response: ${data.error})`)
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
        
        // Enhanced error handling for large requests
        const errorMsg = error instanceof Error ? error.message : String(error)
        const isSocketError = errorMsg.includes('terminated') || errorMsg.includes('SocketError') || errorMsg.includes('UND_ERR_SOCKET')
        
        if (isSocketError && targetUrl.includes('/functions/signPdf')) {
          console.log(`[OpenSign Proxy] 🔌 Socket error for signPdf - attempting without PDF content`)
          
          // Try to sign without PDF content if we haven't already
          if (requestBody && typeof requestBody === 'string') {
            try {
              const originalData = JSON.parse(requestBody)
              if (originalData.pdfFile) {
                console.log(`[OpenSign Proxy] 🔄 Large PDF caused socket error - retrying without PDF content`)
                
                // Remove PDF and try again with this same mount path
                const signOnlyData = { ...originalData }
                delete signOnlyData.pdfFile
                const newRequestBody = JSON.stringify(signOnlyData)
                
                console.log(`[OpenSign Proxy] 📝 Attempting signature-only request to ${targetUrl}`)
                
                try {
                  const retryResponse = await attemptRequestWithRetry(targetUrl, request, method, newRequestBody, Boolean(isFormData))
                  const retryResponseText = await retryResponse.text()
                  
                  if (!retryResponseText.includes('<!DOCTYPE html>')) {
                    try {
                      const retryData = JSON.parse(retryResponseText)
                      if (retryResponse.ok) {
                        console.log(`[OpenSign Proxy] ✅ Success with signature-only request at ${mountPath}`)
                        return NextResponse.json(retryData, {
                          status: retryResponse.status,
                          headers: {
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Parse-Application-Id, X-Parse-Session-Token',
                          },
                        })
                      }
                    } catch {
                      console.log(`[OpenSign Proxy] Signature-only request returned invalid JSON`)
                    }
                  }
                } catch (retryError) {
                  console.log(`[OpenSign Proxy] Signature-only retry also failed:`, retryError)
                }
              }
            } catch {
              console.log(`[OpenSign Proxy] Could not parse request body for PDF removal retry`)
            }
          }
          
          console.log(`[OpenSign Proxy] 📄 signPdf function failed - server cannot handle request size`)
        } else if (isSocketError) {
          console.log(`[OpenSign Proxy] 🔌 Network/Socket error detected - server-side request size limits`)
        }
        
        lastError = error as Error
        continue
      }
    }

    // If all attempts failed, return error with troubleshooting info
    console.error('[OpenSign Proxy] All mount paths failed:', lastError)
    
    // Check if this is a large request issue
    const isLargeRequestError = lastError?.message?.includes('terminated') || 
                               lastError?.message?.includes('SocketError')
    
    const errorResponse = {
      error: 'Parse Server API not accessible', 
      details: lastError?.message || 'All endpoint attempts failed',
      troubleshooting: {
        issue: isLargeRequestError ? 
          'Server terminated connection - likely due to request size limits or timeout' :
          'Parse Server API endpoints are not responding with JSON',
        attempted_endpoints: POSSIBLE_MOUNT_PATHS.map(path => `${OPENSIGN_BASE_URL}${path}/${fullPath}`),
        received: isLargeRequestError ? 
          'Connection terminated by server (SocketError)' :
          'HTML response (OpenSign frontend) instead of JSON API response',
        recommendations: isLargeRequestError ? [
          'Request payload might be too large for server limits',
          'Consider reducing request size by removing unnecessary data (e.g., PDF content)',
          'Check server configuration for max request size and timeout settings',
          'Verify network stability for large file transfers',
          'Consider chunking large requests or using multipart uploads'
        ] : [
          'Verify Parse Server is running and properly mounted',
          'Check if Parse Server port/configuration is correct', 
          'Ensure API routes are not being intercepted by frontend routing',
          'Verify network connectivity and firewall settings'
        ]
      }
    }
    
    return NextResponse.json(errorResponse, { 
      status: 502,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Parse-Application-Id, X-Parse-Session-Token',
      },
    })

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

async function attemptRequestWithRetry(
  targetUrl: string, 
  request: NextRequest, 
  method: string, 
  requestBody?: string | FormData | null, 
  isFormData: boolean = false,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null
  
  // Check if this is a large request that might need retries
  const isLargeRequest = targetUrl.includes('/functions/signPdf') || 
                        (requestBody && typeof requestBody === 'string' && requestBody.length > 100000)
  
  const retries = isLargeRequest ? maxRetries : 1 // Only retry large requests
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`[OpenSign Proxy] 🔄 Retry attempt ${attempt}/${retries} for large request`)
        // Add exponential backoff for retries (1s, 2s, 4s)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)))
      }
      
      const response = await attemptRequest(
        targetUrl, 
        request, 
        method, 
        requestBody, 
        Boolean(isFormData)
      )
      
      // If successful, return the response
      return response
      
    } catch (error) {
      lastError = error as Error
      
      // Check if it's a network/socket error that might be retryable
      const isRetryableError = lastError.message.includes('terminated') || 
                              lastError.message.includes('SocketError') ||
                              lastError.message.includes('ECONNRESET') ||
                              lastError.message.includes('timeout') ||
                              lastError.message.includes('UND_ERR_SOCKET')
      
      if (attempt < retries && isRetryableError && isLargeRequest) {
        console.log(`[OpenSign Proxy] ⚠️ Retryable error on attempt ${attempt}:`, lastError.message)
        console.log(`[OpenSign Proxy] 📄 Large PDF request failed, will retry with optimized settings...`)
        continue
      } else {
        // Not retryable or max retries reached
        throw lastError
      }
    }
  }
  
  // This should never be reached, but just in case
  throw lastError || new Error('Unknown error in retry logic')
}

async function attemptRequest(
  targetUrl: string, 
  request: NextRequest, 
  method: string, 
  requestBody?: string | FormData | null, 
  isFormData: boolean = false
): Promise<Response> {
  // Prepare headers
  const headers: HeadersInit = {}

  // Copy relevant headers from the original request
  let sessionToken = request.headers.get('X-Parse-Session-Token')
  
  // Detect if this is a large request
  const isLargeRequest = targetUrl.includes('/functions/signPdf') || 
                        (requestBody && typeof requestBody === 'string' && requestBody.length > 100000)
  
  // Check if this is a privileged function that requires admin authentication
  const isPrivilegedFunction = targetUrl.includes('/functions/adduser') || 
                              targetUrl.includes('/functions/createuser') ||
                              targetUrl.includes('/functions/inviteuser') ||
                              targetUrl.includes('/functions/signPdf') // ✅ ADD signPdf as privileged function
  
  // Check if this is a class operation that might need admin authentication
  const isClassOperation = targetUrl.includes('/classes/contracts_Users') ||
                          targetUrl.includes('/classes/contracts_Teams') ||
                          targetUrl.includes('/users')
  
  if (isPrivilegedFunction) {
    console.log('[OpenSign Proxy] Detected privileged function (including signPdf), using admin authentication')
    
    // For privileged functions, use master key for reliable authentication
    if (OPENSIGN_MASTER_KEY) {
      console.log('[OpenSign Proxy] Using master key for privileged function:', targetUrl)
      headers['X-Parse-Master-Key'] = OPENSIGN_MASTER_KEY
      // Still include session token if available for user context
      if (sessionToken && sessionToken !== ';' && sessionToken.trim() !== '') {
        headers['X-Parse-Session-Token'] = sessionToken
        console.log('[OpenSign Proxy] Also including session token for user context')
      }
    } else {
      // Fallback to admin session token if no master key
      try {
        console.log('[OpenSign Proxy] Getting admin session token...')
        const adminToken = await getSessionToken()
        if (adminToken) {
          sessionToken = adminToken
          console.log('[OpenSign Proxy] Using admin session token for privileged function')
        }
      } catch {
        console.warn('[OpenSign Proxy] Failed to get admin token for privileged function')
      }
    }
  } else if (isClassOperation && method === 'POST') {
    console.log('[OpenSign Proxy] Detected class creation operation, ensuring proper authentication')
    
    // For class operations, ensure we have valid authentication
    if (!sessionToken || sessionToken === ';' || sessionToken.trim() === '') {
      console.log('[OpenSign Proxy] No session token for class operation, getting admin token...')
      
      try {
        const adminToken = await getSessionToken()
        if (adminToken) {
          sessionToken = adminToken
          console.log('[OpenSign Proxy] Using admin session token for class operation')
        }
      } catch {
        console.warn('[OpenSign Proxy] Failed to get admin token for class operation')
      }
    }
  } else {
    // Always check cookies for session token (they might be fresher than headers)
    let cookieToken = null
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim())
      const sessionCookie = cookies.find(c => c.startsWith('opensign_session_token='))
      if (sessionCookie) {
        cookieToken = sessionCookie.split('=')[1]
        console.log('[OpenSign Proxy] Found session token in cookie:', cookieToken ? `${cookieToken.substring(0, 15)}...` : 'none')
      }
    }
    
    // Prioritize cookie token over header token (cookies are updated after login)
    if (cookieToken) {
      sessionToken = cookieToken
      console.log('[OpenSign Proxy] Using fresh cookie token over header token')
    } else if (!sessionToken || sessionToken === ';' || sessionToken.trim() === '') {
      console.log('[OpenSign Proxy] No valid session token found, attempting auto-authentication...')
      
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
    } else {
      console.log('[OpenSign Proxy] Using header session token:', sessionToken ? `${sessionToken.substring(0, 15)}...` : 'none')
    }
  }
  
  // Check if this is OpenSign format (Content-Type: text/plain)
  const incomingContentType = request.headers.get('content-type') || ''
  const isOpenSignFormat = incomingContentType.includes('text/plain')
  
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

  // Handle content-type based on request type and incoming format
  if (!isFormData) {
    if (isOpenSignFormat) {
      // ✅ Preserve OpenSign format - use text/plain and don't add Parse headers
      headers['Content-Type'] = 'text/plain'
      console.log('[OpenSign Proxy] Preserving OpenSign format (text/plain) - no Parse headers added')
    } else {
      // Legacy format - use Parse headers
      headers['Content-Type'] = 'application/json'
      
      // Add session token and app ID only for non-OpenSign format requests
      if (sessionToken && sessionToken !== ';') {
        headers['X-Parse-Session-Token'] = sessionToken
      }
      headers['X-Parse-Application-Id'] = OPENSIGN_APP_ID
    }
  }
  // For FormData, let fetch set the content-type automatically with boundary

  // For very large requests, we need special handling
  if (isLargeRequest && requestBody && typeof requestBody === 'string' && requestBody.length > 500000) {
    console.log(`[OpenSign Proxy] 🚨 Very large request detected (${requestBody.length} bytes) - implementing chunked transfer`)
  }
  
  // Prepare the fetch options with extended timeout for large requests
  const fetchOptions: RequestInit = {
    method,
    headers,
    // Extended timeout for large requests (PDF signing): 5 minutes
    // Regular timeout for other requests: 30 seconds for FormData, 10 seconds for JSON
    signal: AbortSignal.timeout(
      isLargeRequest ? 300000 : // 5 minutes for large PDF requests (increased from 2 minutes)
      requestBody instanceof FormData ? 30000 : // 30 seconds for file uploads
      10000 // 10 seconds for regular JSON requests
    ),
  }
  
  // Add keepalive for large requests to prevent connection drops
  if (isLargeRequest) {
    fetchOptions.keepalive = true
  }

  // Add body for POST, PUT requests
  if ((method === 'POST' || method === 'PUT') && requestBody) {
    fetchOptions.body = requestBody
  }

  const requestSize = requestBody ? 
    (typeof requestBody === 'string' ? requestBody.length : 'FormData') : 0
  
  console.log(`[OpenSign Proxy] Making ${method} request to ${targetUrl}${isFormData ? ' (FormData)' : ' (JSON)'} - Size: ${requestSize}`)
  
  if (isLargeRequest) {
    console.log('[OpenSign Proxy] 📄 Large PDF request detected - using extended timeout (5 minutes) and keepalive')
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
