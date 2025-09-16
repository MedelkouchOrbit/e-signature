import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { email, sessionToken } = requestData;
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token is required' }, { status: 401 });
    }

    // Use the getUserDetails backend function
    const response = await fetch('http://94.249.71.89:9000/api/app/functions/getUserDetails', {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Content-Type': 'text/plain',
        'Origin': 'http://localhost:3000',
        'Referer': 'http://localhost:3000/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        email,
        _ApplicationId: 'opensign',
        _ClientVersion: 'js6.1.1',
        _InstallationId: 'ef44e42e-e0a3-44a0-a359-90c26af8ffac',
        _SessionToken: sessionToken
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get user details:', response.status, errorText);
      return NextResponse.json({ 
        error: 'Failed to get user details', 
        details: errorText 
      }, { status: response.status });
    }

    const result = await response.json();
    console.log('Backend getUserDetails response:', result);

    return NextResponse.json({ 
      success: true, 
      user: result
    });

  } catch (error) {
    console.error('Error in get-user-details:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}