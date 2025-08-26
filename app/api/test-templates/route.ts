import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Templates API Test Endpoint',
    endpoints: {
      'GET /api/test-templates': 'This endpoint',
      'POST /api/proxy/opensign/functions/getReport': 'Get templates list',
      'POST /api/proxy/opensign/functions/GetTemplate': 'Get single template',
      'POST /api/proxy/opensign/classes/contracts_Template': 'Create template',
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = Object.fromEntries(request.headers.entries());
    
    // Debug information
    const debugInfo = {
      method: 'POST',
      timestamp: new Date().toISOString(),
      headers: {
        'content-type': headers['content-type'],
        'x-parse-application-id': headers['x-parse-application-id'],
        'x-parse-session-token': headers['x-parse-session-token'] ? 
          `${headers['x-parse-session-token'].substring(0, 20)}...` : 'Not provided',
        'authorization': headers['authorization'] ? 'Provided' : 'Not provided',
      },
      body,
      bodyType: typeof body,
    };

    // Test different template API calls
    const testResults = [];

    // Test 1: Try to get templates list
    try {
      const response = await fetch('http://localhost:3000/api/proxy/opensign/functions/getReport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Parse-Application-Id': headers['x-parse-application-id'] || 'opensign',
          'X-Parse-Session-Token': headers['x-parse-session-token'] || '',
        },
        body: JSON.stringify({
          reportId: "6TeaPr321t",
          limit: 5,
          skip: 0,
          searchTerm: ""
        })
      });

      const result = await response.json();
      testResults.push({
        test: 'getReport',
        status: response.status,
        success: response.ok,
        result: result,
      });
    } catch (error) {
      testResults.push({
        test: 'getReport',
        status: 'error',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Test 2: Try to check user session
    try {
      const response = await fetch('http://localhost:3000/api/proxy/opensign/users/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Parse-Application-Id': headers['x-parse-application-id'] || 'opensign',
          'X-Parse-Session-Token': headers['x-parse-session-token'] || '',
        }
      });

      const result = await response.json();
      testResults.push({
        test: 'users/me',
        status: response.status,
        success: response.ok,
        result: result,
      });
    } catch (error) {
      testResults.push({
        test: 'users/me',
        status: 'error',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return NextResponse.json({
      debugInfo,
      testResults,
      recommendations: [
        'Check if session token is valid and properly formatted',
        'Ensure OpenSign instance is accessible',
        'Verify X-Parse-Application-Id matches OpenSign configuration',
        'Check if user has proper permissions for templates',
      ]
    });

  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to process test request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
