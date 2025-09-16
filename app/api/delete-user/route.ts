import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Get the user ID from the request body
    const { userId, sessionToken } = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token is required' },
        { status: 401 }
      )
    }

    // Make the request to the OpenSign backend
    const response = await fetch(`http://94.249.71.89:9000/api/deleteuser/${userId}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Content-Length': '0',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'http://94.249.71.89:9000',
        'Pragma': 'no-cache',
        'Referer': 'http://94.249.71.89:9000/users',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
        'sessiontoken': sessionToken
      }
    })

    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to delete user: ${response.status} - ${errorText}`)
      return NextResponse.json(
        { error: `Failed to delete user: ${response.status}` },
        { status: response.status }
      )
    }

    // Return success response
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in delete user API route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}