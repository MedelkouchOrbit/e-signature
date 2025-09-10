import { NextResponse } from 'next/server'

interface TestResult {
  endpoint: string
  status: number | string
  success: boolean
  hasFileUrl?: boolean
  response?: unknown
  error?: string
}

export async function GET() {
  try {
    const documentId = 'GQPB5IAUV1'
    const baseUrl = process.env.OPENSIGN_BASE_URL || 'http://94.249.71.89:9000'
    
    // Test session token (you should replace with actual token)
    const sessionToken = 'r:fc16b73c981e796f56d4bab8de6cc628'
    
    const headers = {
      'Content-Type': 'application/json',
      'X-Parse-Application-Id': 'opensign',
      'X-Parse-Session-Token': sessionToken
    }

    const results = {
      timestamp: new Date().toISOString(),
      documentId,
      tests: [] as TestResult[]
    }

    // Test 1: Enhanced getDocument
    try {
      const response1 = await fetch(`${baseUrl}/api/app/functions/getDocument`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ docId: documentId })
      })
      
      const data1 = await response1.json()
      results.tests.push({
        endpoint: 'getDocument',
        status: response1.status,
        success: !!data1.result,
        hasFileUrl: !!(data1.result?.primaryFileUrl || data1.result?.fileUrls?.length),
        response: data1
      })
    } catch (error) {
      results.tests.push({
        endpoint: 'getDocument',
        status: 'error',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 2: getDocumentFile
    try {
      const response2 = await fetch(`${baseUrl}/api/app/functions/getdocumentfile`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ docId: documentId })
      })
      
      const data2 = await response2.json()
      results.tests.push({
        endpoint: 'getdocumentfile',
        status: response2.status,
        success: !!data2.success,
        hasFileUrl: !!data2.document?.primaryFileUrl,
        response: data2
      })
    } catch (error) {
      results.tests.push({
        endpoint: 'getdocumentfile',
        status: 'error',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 3: getFileUrl
    try {
      const response3 = await fetch(`${baseUrl}/api/app/functions/getfileurl`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ docId: documentId })
      })
      
      const data3 = await response3.json()
      results.tests.push({
        endpoint: 'getfileurl',
        status: response3.status,
        success: !!data3.success,
        hasFileUrl: !!data3.fileUrl,
        response: data3
      })
    } catch (error) {
      results.tests.push({
        endpoint: 'getfileurl',
        status: 'error',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
