import { NextRequest, NextResponse } from "next/server"

// Setup organization for admin users using OpenSign's updateuserasadmin function
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }
    
    // Get the master key from server environment
    const masterKey = process.env.OPENSIGN_MASTER_KEY
    
    if (!masterKey) {
      return NextResponse.json(
        { error: "Master key not configured. Please contact administrator." },
        { status: 500 }
      )
    }
    
    // Get session token from request headers or cookies
    const sessionToken = request.headers.get('x-parse-session-token') || 
                        request.cookies.get('sessionToken')?.value
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Session token required" },
        { status: 401 }
      )
    }
    
    // Call OpenSign's updateuserasadmin function
    const openSignUrl = process.env.OPENSIGN_URL || 'http://localhost:8080'
    const appId = process.env.OPENSIGN_APP_ID || 'opensign'
    
    const response = await fetch(`${openSignUrl}/parse/functions/updateuserasadmin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': appId,
        'X-Parse-Session-Token': sessionToken,
      },
      body: JSON.stringify({
        email,
        masterkey: masterKey
      })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to setup organization')
    }
    
    return NextResponse.json({ 
      success: true, 
      result: data.result 
    })
    
  } catch (error) {
    console.error('Organization setup error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to setup organization'
      },
      { status: 500 }
    )
  }
}
