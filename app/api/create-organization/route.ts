import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Get the organization data from the request body
    const requestData = await request.json()
    const { name, description, adminUser, sessionToken } = requestData
    
    console.log('Create organization request data:', requestData)
    
    if (!name) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      )
    }

    if (!adminUser || !adminUser.name || !adminUser.email || !adminUser.password) {
      return NextResponse.json(
        { error: 'Admin user details (name, email, password) are required' },
        { status: 400 }
      )
    }

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token is required' },
        { status: 401 }
      )
    }

    // For now, we'll just create the organization
    // TODO: Investigate if admin user creation should be separate or integrated
    console.log('Admin user data received:', adminUser)

    // Make the request to create organization using the addadmin cloud function
    const response = await fetch('http://94.249.71.89:9000/api/app/functions/addadmin', {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Content-Type': 'text/plain',
        'Origin': 'http://94.249.71.89:9000',
        'Pragma': 'no-cache',
        'Referer': 'http://94.249.71.89:9000/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        userDetails: {
          name: adminUser.name,
          email: adminUser.email,
          password: adminUser.password,
          company: name, // Use organization name as company
          phone: adminUser.phone || '',
          role: 'Admin'
        },
        _ApplicationId: 'opensign',
        _ClientVersion: 'js6.1.1',
        _InstallationId: '5b57e02d-5015-4c69-bede-06310ad8bae9',
        _SessionToken: sessionToken
      })
    })

    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to create organization: ${response.status} - ${errorText}`)
      return NextResponse.json(
        { error: `Failed to create organization: ${response.status}` },
        { status: response.status }
      )
    }

    const result = await response.json()
    
    console.log('Backend addadmin response:', JSON.stringify(result, null, 2))
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Check if the backend returned "User already exist" which means the operation failed
    if (result.result?.message === "User already exist") {
      return NextResponse.json(
        { 
          error: `Admin user with email "${adminUser.email}" already exists. Please use a different email address or delete the existing user first.`,
          details: 'The email address is already registered in the system. Each admin user must have a unique email address.'
        },
        { status: 409 } // Conflict status code
      )
    }

    // Return the created organization data
    // The addadmin function creates the organization, admin user, and team
    return NextResponse.json({
      success: true,
      message: result.message || 'Organization created successfully',
      organization: {
        objectId: result.objectId || undefined, // This might come from the backend response
        Name: name,
        Description: description || '',
        IsActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      sessionToken: result.sessionToken, // Admin user session token
      backendResult: result // Include full backend response for debugging
    })

  } catch (error) {
    console.error('Error in create organization API route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}