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

    // First, get current user info from session token
    const userResponse = await fetch(`${request.nextUrl.origin}/api/proxy/opensign/users/me`, {
      method: 'GET',
      headers: {
        'X-Parse-Application-Id': process.env.NEXT_PUBLIC_OPENSIGN_APP_ID || 'opensign',
        'X-Parse-Session-Token': sessionToken,
      },
    })

    let currentUserId = null
    let extUserPtr = null
    if (userResponse.ok) {
      const userData = await userResponse.json()
      currentUserId = userData.objectId
      console.log('[Template API] Current user ID:', currentUserId)

      // Get the corresponding contracts_Users record using getUserDetails function
      try {
        const getUserDetailsResponse = await fetch(`${request.nextUrl.origin}/api/proxy/opensign/functions/getUserDetails`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Parse-Application-Id': process.env.NEXT_PUBLIC_OPENSIGN_APP_ID || 'opensign',
            'X-Parse-Session-Token': sessionToken,
          },
          body: JSON.stringify({})
        })

        if (getUserDetailsResponse.ok) {
          const userDetailsData = await getUserDetailsResponse.json()
          if (userDetailsData.result && userDetailsData.result.objectId) {
            extUserPtr = {
              __type: "Pointer",
              className: "contracts_Users",
              objectId: userDetailsData.result.objectId
            }
            console.log('[Template API] Found contracts_Users record via getUserDetails:', extUserPtr.objectId)
          }
        } else {
          console.warn('[Template API] getUserDetails failed, trying direct query...')
          
          // Fallback: Direct query to contracts_Users
          const extUserResponse = await fetch(`${request.nextUrl.origin}/api/proxy/opensign/classes/contracts_Users?where=${encodeURIComponent(JSON.stringify({ UserId: { __type: "Pointer", className: "_User", objectId: currentUserId } }))}`, {
            method: 'GET',
            headers: {
              'X-Parse-Application-Id': process.env.NEXT_PUBLIC_OPENSIGN_APP_ID || 'opensign',
              'X-Parse-Session-Token': sessionToken,
            },
          })

          if (extUserResponse.ok) {
            const extUserData = await extUserResponse.json()
            if (extUserData.results && extUserData.results.length > 0) {
              extUserPtr = {
                __type: "Pointer",
                className: "contracts_Users",
                objectId: extUserData.results[0].objectId
              }
              console.log('[Template API] Found contracts_Users record via direct query:', extUserPtr.objectId)
            }
          }
        }
      } catch (error) {
        console.error('[Template API] Error getting contracts_Users record:', error)
      }
    }

    // Create template object using the proxy endpoint
    const templateResponse = await fetch(`${request.nextUrl.origin}/api/proxy/opensign/classes/contracts_Template`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': process.env.NEXT_PUBLIC_OPENSIGN_APP_ID || 'opensign',
        'X-Parse-Session-Token': sessionToken,
      },
      body: JSON.stringify({
        Name: name,
        Description: description || '',
        URL: fileUrl,
        FileName: fileName,
        Placeholders: fields || [],
        Signers: signers || [],
        SendInOrder: sendInOrder || false,
        IsOTP: otpEnabled || false,
        IsTour: tourEnabled || false,
        IsReminder: reminderEnabled || false,
        ReminderInterval: reminderInterval || 7,
        TimeToCompleteDays: completionDays || 30,
        RedirectURL: redirectUrl || '',
        Bcc: bcc || [],
        AllowModifications: allowModifications || false,
        // FIXED: Correct field values for getReport compatibility
        Type: 'template', // Lowercase to match other templates
        IsArchive: false, // Explicitly set to false (not null)
        CreatedBy: currentUserId ? {
          __type: "Pointer",
          className: "_User",
          objectId: currentUserId
        } : undefined,
        // FIXED: Set ExtUserPtr for proper user association
        ExtUserPtr: extUserPtr
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

    // If there are signers with orders, update them with proper signer assignments
    if (signers && signers.length > 0) {
      console.log('[Template API] Processing signers for template:', templateData.objectId)
      
      // Process each signer
      for (let i = 0; i < signers.length; i++) {
        const signer = signers[i]
        
        try {
          // Create or update signer record
          const signerResponse = await fetch(`${request.nextUrl.origin}/api/proxy/opensign/classes/Signer`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Parse-Application-Id': process.env.NEXT_PUBLIC_OPENSIGN_APP_ID || 'opensign',
              'X-Parse-Session-Token': sessionToken,
            },
            body: JSON.stringify({
              Name: signer.name,
              Email: signer.email,
              Role: signer.role || 'Signer',
              Color: signer.color,
              Order: signer.order,
              TemplateId: templateData.objectId,
              Status: 'pending'
            }),
          })

          if (!signerResponse.ok) {
            console.error(`[Template API] Failed to create signer ${i + 1}:`, await signerResponse.text())
          } else {
            console.log(`[Template API] Signer ${i + 1} created successfully`)
          }
        } catch (signerError) {
          console.error(`[Template API] Error creating signer ${i + 1}:`, signerError)
        }
      }
    }

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
