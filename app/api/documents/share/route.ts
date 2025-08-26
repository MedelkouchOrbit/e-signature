import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('[Share Document API] POST request received')

    const body = await request.json()
    const { docId, recipients, message, permissions } = body

    if (!docId) {
      return NextResponse.json(
        { 
          error: 'Document ID is required',
          code: 101,
          success: false 
        },
        { status: 400 }
      )
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { 
          error: 'At least one recipient is required',
          code: 102,
          success: false 
        },
        { status: 400 }
      )
    }

    console.log('[Share Document API] Sharing document:', {
      docId,
      recipients,
      message,
      permissions
    })

    // Validate recipients
    const validRecipients = recipients.filter(recipient => 
      recipient.email && recipient.email.includes('@')
    )

    if (validRecipients.length === 0) {
      return NextResponse.json(
        { 
          error: 'At least one valid email address is required',
          code: 103,
          success: false 
        },
        { status: 400 }
      )
    }

    // In a real app, you would:
    // 1. Validate document exists and user has sharing permissions
    // 2. Create sharing records in database
    // 3. Send email notifications to recipients
    // 4. Generate sharing links if needed
    // 5. Log sharing activity

    // Mock successful sharing response
    const shareId = `share_${Date.now()}`
    const sharedAt = new Date().toISOString()
    
    const response = {
      result: {
        shareId,
        documentId: docId,
        recipients: validRecipients.map(recipient => ({
          ...recipient,
          shareUrl: `https://example.com/shared/${shareId}/${recipient.email}`,
          sharedAt,
          status: 'sent'
        })),
        message: message || 'Document shared with you',
        permissions: permissions || ['view'],
        sharedAt,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      },
      success: true
    }

    console.log('[Share Document API] Document shared successfully:', response.result)

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Parse-Application-Id',
      },
    })

  } catch (error) {
    console.error('[Share Document API] Error:', error)
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Parse-Application-Id',
    },
  })
}
