import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'No session token provided' }, { status: 401 });
    }

    const baseUrl = 'http://94.249.71.89:9000';
    
    console.log('Testing direct database access methods...');

    // Try multiple approaches to see what data we can access
    const results: {
      organizations: unknown,
      teams: unknown,
      users: unknown,
      adminUsers: unknown,
      error: unknown
    } = {
      organizations: null,
      teams: null,
      users: null,
      adminUsers: null,
      error: null
    };

    // 1. Try direct organizations query
    try {
      const orgsResponse = await fetch(`${baseUrl}/api/app/classes/contracts_Organizations?limit=100`, {
        method: 'GET',
        headers: {
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': sessionToken,
          'Content-Type': 'application/json',
        },
      });
      
      if (orgsResponse.ok) {
        results.organizations = await orgsResponse.json();
      } else {
        results.organizations = { error: `Status ${orgsResponse.status}: ${orgsResponse.statusText}` };
      }
    } catch (error) {
      results.organizations = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // 2. Try teams function
    try {
      const teamsResponse = await fetch(`${baseUrl}/api/app/functions/getteams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({
          _ApplicationId: 'opensign',
          _ClientVersion: 'js6.1.1',
          _InstallationId: 'ef44e42e-e0a3-44a0-a359-90c26af8ffac',
          _SessionToken: sessionToken
        })
      });
      
      if (teamsResponse.ok) {
        results.teams = await teamsResponse.json();
      } else {
        results.teams = { error: `Status ${teamsResponse.status}: ${teamsResponse.statusText}` };
      }
    } catch (error) {
      results.teams = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // 3. Try users query (all users)
    try {
      const usersResponse = await fetch(`${baseUrl}/api/app/classes/contracts_Users?include=OrganizationId&limit=100`, {
        method: 'GET',
        headers: {
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': sessionToken,
          'Content-Type': 'application/json',
        },
      });
      
      if (usersResponse.ok) {
        results.users = await usersResponse.json();
      } else {
        results.users = { error: `Status ${usersResponse.status}: ${usersResponse.statusText}` };
      }
    } catch (error) {
      results.users = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // 4. Try admin users only
    try {
      const adminUsersResponse = await fetch(`${baseUrl}/api/app/classes/contracts_Users?where=${encodeURIComponent(JSON.stringify({
        UserRole: 'contracts_Admin'
      }))}&include=OrganizationId&limit=100`, {
        method: 'GET',
        headers: {
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': sessionToken,
          'Content-Type': 'application/json',
        },
      });
      
      if (adminUsersResponse.ok) {
        results.adminUsers = await adminUsersResponse.json();
      } else {
        results.adminUsers = { error: `Status ${adminUsersResponse.status}: ${adminUsersResponse.statusText}` };
      }
    } catch (error) {
      results.adminUsers = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    console.log('Debug results:', JSON.stringify(results, null, 2));

    return NextResponse.json({ debug: results });

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}