import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      fileUrl,
      fileName,
      fields,
      signers,
      sendInOrder,
      otpEnabled,
      tourEnabled,
      reminderEnabled,
      reminderInterval,
      completionDays,
      redirectUrl,
      bcc,
      allowModifications
    } = body

    // Get session token from request headers
    const sessionToken = request.headers.get('X-Parse-Session-Token')
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session token provided' },
        { status: 401 }
      )
    }

    console.log('[Template API] Creating template in OpenSign Parse Server')

    // Get current user info from session token (simplified)
    const userResponse = await fetch(`http://94.249.71.89:9000/api/app/users/me`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Origin': 'http://94.249.71.89:9000',
        'Referer': 'http://94.249.71.89:9000/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        _ApplicationId: 'opensign',
        _ClientVersion: 'js6.1.1',
        _InstallationId: '5b57e02d-5015-4c69-bede-06310ad8bae9',
        _SessionToken: sessionToken,
        _method: 'GET'
      })
    })

    let currentUserId = null
    let extUserPtr = null
    if (userResponse.ok) {
      const userData = await userResponse.json()
      currentUserId = userData.objectId
      console.log('[Template API] Current user ID:', currentUserId)

      // Get ExtUserPtr using getUserDetails function (simplified approach)
      try {
        const getUserDetailsResponse = await fetch(`http://94.249.71.89:9000/api/app/functions/getUserDetails`, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
            'Origin': 'http://94.249.71.89:9000',
            'Referer': 'http://94.249.71.89:9000/',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
          },
          body: JSON.stringify({
            _ApplicationId: 'opensign',
            _ClientVersion: 'js6.1.1',
            _InstallationId: '5b57e02d-5015-4c69-bede-06310ad8bae9',
            _SessionToken: sessionToken
          })
        })

        if (getUserDetailsResponse.ok) {
          const userDetailsData = await getUserDetailsResponse.json()
          if (userDetailsData.result && userDetailsData.result.objectId) {
            extUserPtr = {
              __type: "Pointer",
              className: "contracts_Users",
              objectId: userDetailsData.result.objectId
            }
            console.log('[Template API] Found contracts_Users record:', extUserPtr.objectId)
          }
        }
      } catch (error) {
        console.error('[Template API] Error getting contracts_Users record:', error)
      }
    }

    // Create template object using direct Parse API (following OpenSign pattern)
    const templateResponse = await fetch(`http://94.249.71.89:9000/api/app/classes/contracts_Template`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Origin': 'http://94.249.71.89:9000',
        'Referer': 'http://94.249.71.89:9000/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        Name: name,
        Description: description || '',
        URL: fileUrl,
        fileName: fileName,
        Placeholders: fields || [],
        Signers: signers || [],
        SendinOrder: sendInOrder || false,
        IsEnableOTP: otpEnabled || false,
        IsTourEnabled: tourEnabled || false,
        AutomaticReminders: reminderEnabled || false,
        RemindOnceInEvery: reminderInterval || 7,
        TimeToCompleteDays: completionDays || 30,
        RedirectUrl: redirectUrl || '',
        Bcc: bcc || [],
        AllowModifications: allowModifications || false,
        Type: 'template',
        IsArchive: false,
        CreatedBy: currentUserId ? {
          __type: "Pointer",
          className: "_User",
          objectId: currentUserId
        } : undefined,
        ExtUserPtr: extUserPtr,
        _ApplicationId: 'opensign',
        _ClientVersion: 'js6.1.1',
        _InstallationId: '5b57e02d-5015-4c69-bede-06310ad8bae9',
        _SessionToken: sessionToken
      }),
    })

    if (!templateResponse.ok) {
      const errorText = await templateResponse.text()
      console.error('[Template API] Failed to create template:', errorText)
      return NextResponse.json(
        { error: `Failed to create template: ${errorText}` },
        { status: templateResponse.status }
      )
    }

    const templateData = await templateResponse.json()
    console.log('[Template API] Template created successfully:', templateData)

    return NextResponse.json({
      success: true,
      template: {
        id: templateData.objectId,
        ...templateData,
        createdAt: templateData.createdAt,
        updatedAt: templateData.updatedAt
      }
    })

  } catch (error) {
    console.error('[Template API] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
