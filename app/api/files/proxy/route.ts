import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileUrl = searchParams.get('url')
    
    if (!fileUrl) {
      return NextResponse.json(
        { error: 'File URL is required' },
        { status: 400 }
      )
    }

    // Get session token from headers or cookies
    const sessionToken = request.headers.get('x-session-token') || 
                        request.cookies.get('opensign_session_token')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token is required' },
        { status: 401 }
      )
    }

    // Fetch the file with authentication headers
    const response = await fetch(fileUrl, {
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': sessionToken,
        'Accept': '*/*',
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch file: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `Failed to fetch file: ${response.status}` },
        { status: response.status }
      )
    }

    // Get the file content
    const fileBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'application/pdf'

    // Return the file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=0',
        'Content-Length': fileBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error('Error proxying file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}