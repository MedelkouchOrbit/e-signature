import { NextRequest, NextResponse } from 'next/server'

// Mock file upload endpoint
export async function POST(request: NextRequest) {
  try {
    console.log('[File Upload API] POST request received')

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { 
          error: 'No file provided',
          code: 101,
          success: false 
        },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          error: 'Invalid file type. Only PDF and DOC files are allowed.',
          code: 102,
          success: false 
        },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          error: 'File size too large. Maximum size is 10MB.',
          code: 103,
          success: false 
        },
        { status: 400 }
      )
    }

    // Simulate file upload processing
    const fileName = file.name
    const fileSize = file.size
    const fileType = file.type

    // In a real app, you would:
    // 1. Save the file to cloud storage (AWS S3, Google Cloud Storage, etc.)
    // 2. Generate a unique file URL
    // 3. Store file metadata in database

    // Mock successful upload response
    const mockFileUrl = `https://example.com/uploads/${Date.now()}_${fileName}`
    
    console.log('[File Upload API] File uploaded successfully:', {
      fileName,
      fileSize,
      fileType,
      url: mockFileUrl
    })

    return NextResponse.json({
      result: {
        url: mockFileUrl,
        name: fileName,
        size: fileSize,
        type: fileType,
        uploadedAt: new Date().toISOString()
      },
      success: true
    }, {
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })

  } catch (error) {
    console.error('[File Upload API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        code: 1,
        success: false
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
