import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('[Sign Document API] POST request received')

    const body = await request.json()
    const { docId, signatureData, signerInfo } = body

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

    if (!signatureData) {
      return NextResponse.json(
        { 
          error: 'Signature data is required',
          code: 102,
          success: false 
        },
        { status: 400 }
      )
    }

    console.log('[Sign Document API] Processing signature:', {
      docId,
      signatureData,
      signerInfo
    })

    // In a real app, you would:
    // 1. Validate the document exists and user has permission to sign
    // 2. Apply the signature to the PDF
    // 3. Generate signed PDF
    // 4. Update document status in database
    // 5. Send notifications to relevant parties

    // Mock successful signing response
    const signedDocumentUrl = `https://example.com/signed/${docId}_signed_${Date.now()}.pdf`
    
    const response = {
      result: {
        documentId: docId,
        signedUrl: signedDocumentUrl,
        signedAt: new Date().toISOString(),
        signerInfo: signerInfo || {
          name: 'Test User',
          email: 'test@example.com'
        },
        signatureData: {
          ...signatureData,
          signatureId: `sig_${Date.now()}`,
          appliedAt: new Date().toISOString()
        },
        status: 'signed'
      },
      success: true
    }

    console.log('[Sign Document API] Document signed successfully:', response.result)

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Parse-Application-Id',
      },
    })

  } catch (error) {
    console.error('[Sign Document API] Error:', error)
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
