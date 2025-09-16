import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    
    // Extract session token from Authorization header if not provided in body
    const authHeader = request.headers.get('authorization');
    const sessionToken = requestData.sessionToken || (authHeader ? authHeader.replace('Bearer ', '') : null);
    
    console.log('Add user request data:', requestData);
    
    // Handle both the old format and new format
    let name, email, phone, password, role, organization, team, tenantId, timezone;
    
    if (requestData.userDetails) {
      // Old format with userDetails wrapper
      const { userDetails } = requestData;
      name = userDetails.name;
      email = userDetails.email;
      phone = userDetails.phone;
      password = userDetails.password;
      role = userDetails.role || 'OrgAdmin';
      organization = {
        objectId: requestData.organizationId || '3ZB9qTD2hV',
        company: userDetails.Company || 'orbitech'
      };
      team = requestData.teamId || 'pqXvYZRVib';
      tenantId = 'D2SYTuXMoJ';
      timezone = 'Africa/Casablanca';
    } else {
      // New format with direct parameters
      name = requestData.name;
      email = requestData.email;
      phone = requestData.phone;
      password = requestData.password;
      role = requestData.role;
      organization = requestData.organization || {
        objectId: requestData.organizationId || '3ZB9qTD2hV',
        company: 'orbitech'
      };
      team = requestData.team || requestData.teamId || 'pqXvYZRVib';
      tenantId = requestData.tenantId || 'D2SYTuXMoJ';
      timezone = requestData.timezone || 'Africa/Casablanca';
    }
    
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      );
    }

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token is required' },
        { status: 401 }
      );
    }

    // Use the adduser backend function (lowercase)
    const response = await fetch('http://94.249.71.89:9000/api/app/functions/adduser', {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Content-Type': 'text/plain',
        'Origin': 'http://localhost:3000',
        'Referer': 'http://localhost:3000/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        name,
        email,
        phone: phone || '',
        password,
        role, // OrgAdmin, Editor, User, etc.
        organization,
        team,
        tenantId,
        timezone,
        _ApplicationId: 'opensign',
        _ClientVersion: 'js6.1.1',
        _InstallationId: 'ef44e42e-e0a3-44a0-a359-90c26af8ffac',
        _SessionToken: sessionToken
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to add user:', response.status, errorText);
      
      // Check for specific error messages
      if (errorText.includes('User already exist')) {
        return NextResponse.json({ error: 'User already exists with this email' }, { status: 409 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to add user', 
        details: errorText 
      }, { status: response.status });
    }

    const result = await response.json();
    console.log('Backend adduser response:', result);

    return NextResponse.json({ 
      success: true, 
      user: result,
      message: 'User added successfully'
    });

  } catch (error) {
    console.error('Error in add-user:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}