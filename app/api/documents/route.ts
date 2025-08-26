import { NextRequest, NextResponse } from 'next/server'

// Mock documents data for testing
const mockDocuments = [
  {
    objectId: "doc1",
    Name: "Sample Contract.pdf",
    URL: "https://example.com/sample1.pdf",
    SignedUrl: null,
    Note: "Sample contract for testing",
    Description: "Test document 1",
    createdAt: "2024-01-15T10:30:00.000Z",
    updatedAt: "2024-01-15T10:30:00.000Z",
    ExpiryDate: "2024-02-15T10:30:00.000Z",
    TimeToCompleteDays: 30,
    IsCompleted: false,
    IsDeclined: false,
    IsSignyourself: false,
    IsEnableOTP: true,
    Signers: [
      {
        objectId: "signer1",
        Name: "John Doe",
        Email: "john@example.com",
        UserId: {
          objectId: "user1",
          className: "_User"
        }
      }
    ],
    CreatedBy: {
      objectId: "user1",
      className: "_User"
    },
    ExtUserPtr: {
      objectId: "user1",
      Name: "Admin User",
      Email: "admin@example.com"
    }
  },
  {
    objectId: "doc2",
    Name: "Employee Agreement.pdf",
    URL: "https://example.com/sample2.pdf",
    SignedUrl: "https://example.com/signed2.pdf",
    Note: "Employee agreement signed",
    Description: "Test document 2",
    createdAt: "2024-01-16T14:20:00.000Z",
    updatedAt: "2024-01-16T15:45:00.000Z",
    ExpiryDate: "2024-02-16T14:20:00.000Z",
    TimeToCompleteDays: 30,
    IsCompleted: true,
    IsDeclined: false,
    IsSignyourself: false,
    IsEnableOTP: false,
    Signers: [
      {
        objectId: "signer2",
        Name: "Jane Smith",
        Email: "jane@example.com",
        UserId: {
          objectId: "user2",
          className: "_User"
        }
      }
    ],
    CreatedBy: {
      objectId: "user1",
      className: "_User"
    },
    ExtUserPtr: {
      objectId: "user1",
      Name: "Admin User",
      Email: "admin@example.com"
    }
  },
  {
    objectId: "doc3",
    Name: "NDA Agreement.pdf",
    URL: "https://example.com/sample3.pdf",
    SignedUrl: null,
    Note: "Pending signature",
    Description: "Test document 3",
    createdAt: "2024-01-17T09:15:00.000Z",
    updatedAt: "2024-01-17T09:15:00.000Z",
    ExpiryDate: "2024-02-17T09:15:00.000Z",
    TimeToCompleteDays: 30,
    IsCompleted: false,
    IsDeclined: false,
    IsSignyourself: true,
    IsEnableOTP: true,
    Signers: [
      {
        objectId: "signer3",
        Name: "Bob Johnson",
        Email: "bob@example.com"
      }
    ],
    CreatedBy: {
      objectId: "user1",
      className: "_User"
    },
    ExtUserPtr: {
      objectId: "user1",
      Name: "Admin User",
      Email: "admin@example.com"
    }
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const order = searchParams.get('order') || '-createdAt'
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    console.log('[Documents API] GET request received:', {
      limit,
      offset,
      order,
      status,
      search
    })

    let filteredDocs = [...mockDocuments]

    // Filter by status
    if (status && status !== 'all') {
      switch (status) {
        case 'completed':
          filteredDocs = filteredDocs.filter(doc => doc.IsCompleted)
          break
        case 'pending':
          filteredDocs = filteredDocs.filter(doc => !doc.IsCompleted && !doc.IsDeclined)
          break
        case 'declined':
          filteredDocs = filteredDocs.filter(doc => doc.IsDeclined)
          break
        case 'awaiting-me':
          filteredDocs = filteredDocs.filter(doc => doc.IsSignyourself && !doc.IsCompleted)
          break
        case 'awaiting-others':
          filteredDocs = filteredDocs.filter(doc => !doc.IsSignyourself && !doc.IsCompleted)
          break
      }
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      filteredDocs = filteredDocs.filter(doc => 
        doc.Name.toLowerCase().includes(searchLower) ||
        doc.Description?.toLowerCase().includes(searchLower) ||
        doc.Note?.toLowerCase().includes(searchLower)
      )
    }

    // Sort documents
    if (order === '-createdAt') {
      filteredDocs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (order === 'createdAt') {
      filteredDocs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }

    // Apply pagination
    const paginatedDocs = filteredDocs.slice(offset, offset + limit)

    // Return response in OpenSign format
    const response = {
      result: paginatedDocs,
      success: true,
      total: filteredDocs.length,
      hasMore: offset + limit < filteredDocs.length
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Parse-Application-Id',
      },
    })

  } catch (error) {
    console.error('[Documents API] Error in GET:', error)
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[Documents API] POST request received:', body)

    // Generate mock document
    const newDoc = {
      objectId: `doc_${Date.now()}`,
      Name: body.name || 'New Document.pdf',
      URL: body.url || 'https://example.com/new-doc.pdf',
      SignedUrl: null,
      Note: body.note || '',
      Description: body.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      TimeToCompleteDays: 30,
      IsCompleted: false,
      IsDeclined: false,
      IsSignyourself: body.isSignyourself || false,
      IsEnableOTP: body.isEnableOTP || false,
      Signers: body.signers || [],
      CreatedBy: {
        objectId: "user1",
        className: "_User"
      },
      ExtUserPtr: {
        objectId: "user1",
        Name: "Admin User",
        Email: "admin@example.com"
      }
    }

    // Add to mock data (in real app, this would save to database)
    mockDocuments.unshift(newDoc)

    return NextResponse.json({
      result: newDoc,
      success: true
    }, {
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Parse-Application-Id',
      },
    })

  } catch (error) {
    console.error('[Documents API] Error in POST:', error)
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const docId = searchParams.get('id')

    console.log('[Documents API] PUT request received:', { docId, body })

    if (!docId) {
      return NextResponse.json(
        { error: 'Document ID is required', code: 101, success: false },
        { status: 400 }
      )
    }

    // Find and update document
    const docIndex = mockDocuments.findIndex(doc => doc.objectId === docId)
    if (docIndex === -1) {
      return NextResponse.json(
        { error: 'Document not found', code: 101, success: false },
        { status: 404 }
      )
    }

    // Update document
    mockDocuments[docIndex] = {
      ...mockDocuments[docIndex],
      ...body,
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      result: mockDocuments[docIndex],
      success: true
    }, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Parse-Application-Id',
      },
    })

  } catch (error) {
    console.error('[Documents API] Error in PUT:', error)
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const docId = searchParams.get('id')

    console.log('[Documents API] DELETE request received:', { docId })

    if (!docId) {
      return NextResponse.json(
        { error: 'Document ID is required', code: 101, success: false },
        { status: 400 }
      )
    }

    // Find and remove document
    const docIndex = mockDocuments.findIndex(doc => doc.objectId === docId)
    if (docIndex === -1) {
      return NextResponse.json(
        { error: 'Document not found', code: 101, success: false },
        { status: 404 }
      )
    }

    const deletedDoc = mockDocuments.splice(docIndex, 1)[0]

    return NextResponse.json({
      result: deletedDoc,
      success: true
    }, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Parse-Application-Id',
      },
    })

  } catch (error) {
    console.error('[Documents API] Error in DELETE:', error)
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Parse-Application-Id',
    },
  })
}
