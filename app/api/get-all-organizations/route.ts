import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'No session token provided' }, { status: 401 });
    }

    const baseUrl = 'http://94.249.71.89:9000';
    const appId = 'opensign';
    const organizationsMap = new Map();
    
    console.log(`Discovering organizations via multiple methods...`);

    // Method 1: Try to directly query organizations table (might fail due to permissions)
    try {
      console.log('🔍 Attempting direct organizations query...');
      const orgsResponse = await fetch(`${baseUrl}/api/app/classes/contracts_Organizations?limit=1000`, {
        method: 'GET',
        headers: {
          'X-Parse-Application-Id': appId,
          'X-Parse-Session-Token': sessionToken,
          'Content-Type': 'application/json',
        },
      });

      if (orgsResponse.ok) {
        const orgsData = await orgsResponse.json();
        console.log(`Direct organizations query SUCCESS: Found ${orgsData.results?.length || 0} organizations`);
        
        if (orgsData.results && Array.isArray(orgsData.results)) {
          for (const org of orgsData.results) {
            organizationsMap.set(org.objectId, {
              objectId: org.objectId,
              Name: org.Name || 'Unknown Organization',
              IsActive: org.IsActive !== false,
              createdAt: org.createdAt,
              updatedAt: org.updatedAt,
            });
            console.log(`Added organization from direct query: ${org.objectId} - ${org.Name || 'Unknown'}`);
          }
        }
      } else {
        console.warn('Direct organizations query failed:', orgsResponse.status);
      }
    } catch (error) {
      console.warn('Direct organizations query error:', error);
    }

    // Method 2: Get all teams to discover organizations
    try {
      console.log('🔍 Attempting teams discovery...');
      const teamsResponse = await fetch(`${baseUrl}/api/app/functions/getteams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({
          _ApplicationId: appId,
          _ClientVersion: 'js6.1.1',
          _InstallationId: 'ef44e42e-e0a3-44a0-a359-90c26af8ffac',
          _SessionToken: sessionToken
        })
      });

      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        console.log(`Teams discovery: Found ${teamsData.result?.length || 0} teams`);
        
        if (teamsData.result && Array.isArray(teamsData.result)) {
          for (const team of teamsData.result) {
            if (team.OrganizationId?.objectId) {
              const orgId = team.OrganizationId.objectId;
              if (!organizationsMap.has(orgId)) {
                organizationsMap.set(orgId, {
                  objectId: orgId,
                  Name: team.OrganizationId.Name || 'Unknown Organization',
                  IsActive: team.OrganizationId.IsActive !== false,
                  createdAt: team.OrganizationId.createdAt,
                  updatedAt: team.OrganizationId.updatedAt,
                });
                console.log(`Added organization from teams: ${orgId} - ${team.OrganizationId.Name || 'Unknown'}`);
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Teams discovery failed:', error);
    }

    console.log(`Found ${organizationsMap.size} organizations via teams discovery`);

    // Method 2: Try to discover organizations by querying all users and extracting their organizations
    try {
      const usersResponse = await fetch(`${baseUrl}/api/app/classes/contracts_Users?include=OrganizationId&limit=1000`, {
        method: 'GET',
        headers: {
          'X-Parse-Application-Id': appId,
          'X-Parse-Session-Token': sessionToken,
          'Content-Type': 'application/json',
        },
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log(`Users discovery found ${usersData.results?.length || 0} total users`);
        
        if (usersData.results && Array.isArray(usersData.results)) {
          for (const user of usersData.results) {
            if (user.OrganizationId?.objectId) {
              const orgId = user.OrganizationId.objectId;
              if (!organizationsMap.has(orgId)) {
                organizationsMap.set(orgId, {
                  objectId: orgId,
                  Name: user.OrganizationId.Name || user.Company || 'Unknown Organization',
                  IsActive: user.OrganizationId.IsActive !== false,
                  createdAt: user.OrganizationId.createdAt || user.createdAt,
                  updatedAt: user.OrganizationId.updatedAt || user.updatedAt,
                });
                console.log(`Added organization from users: ${orgId} - ${user.OrganizationId.Name || user.Company || 'Unknown'}`);
              }
            }
          }
        }
      } else {
        console.warn('Users discovery failed:', usersResponse.status);
      }
    } catch (error) {
      console.warn('Users discovery error:', error);
    }

    // Method 3: Try to directly query the contracts_Organizations table
    try {
      const orgsResponse = await fetch(`${baseUrl}/api/app/classes/contracts_Organizations?limit=1000`, {
        method: 'GET',
        headers: {
          'X-Parse-Application-Id': appId,
          'X-Parse-Session-Token': sessionToken,
          'Content-Type': 'application/json',
        },
      });

      if (orgsResponse.ok) {
        const orgsData = await orgsResponse.json();
        console.log(`Direct organizations query found ${orgsData.results?.length || 0} organizations`);
        
        if (orgsData.results && Array.isArray(orgsData.results)) {
          for (const org of orgsData.results) {
            if (org.objectId) {
              const orgId = org.objectId;
              if (!organizationsMap.has(orgId)) {
                organizationsMap.set(orgId, {
                  objectId: orgId,
                  Name: org.Name || 'Unknown Organization',
                  IsActive: org.IsActive !== false,
                  createdAt: org.createdAt,
                  updatedAt: org.updatedAt,
                });
                console.log(`Added organization from direct query: ${orgId} - ${org.Name || 'Unknown'}`);
              }
            }
          }
        }
      } else {
        console.warn('Direct organizations query failed:', orgsResponse.status, orgsResponse.statusText);
        const errorText = await orgsResponse.text();
        console.warn('Direct organizations error:', errorText);
      }
    } catch (error) {
      console.warn('Direct organizations query error:', error);
    }

    console.log(`Found ${organizationsMap.size} total unique organizations after all discovery methods`);
    
    // We need to discover organizations by finding all admin users
    // Let's try using the getuserlistbyorg function with different organization IDs
    // But first, we need to find a way to get all organizations
    
    // Since we can't directly query organizations, let's try a different approach
    // Let's get all teams first, as teams are linked to organizations
    const teamsResponse = await fetch(`${baseUrl}/api/app/functions/getteams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Accept': '*/*',
        'Origin': 'http://localhost:3000',
        'Referer': 'http://localhost:3000/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        _ApplicationId: appId,
        _ClientVersion: 'js6.1.1',
        _InstallationId: 'ef44e42e-e0a3-44a0-a359-90c26af8ffac',
        _SessionToken: sessionToken
      })
    });

    if (!teamsResponse.ok) {
      const errorText = await teamsResponse.text();
      console.error('Failed to fetch teams:', teamsResponse.status, teamsResponse.statusText);
      console.error('Teams error response body:', errorText);
      return NextResponse.json({ error: 'Failed to fetch teams', details: errorText }, { status: teamsResponse.status });
    }

    const teamsData = await teamsResponse.json();
    console.log('Teams response:', JSON.stringify(teamsData, null, 2));

    if (!teamsData.result || !Array.isArray(teamsData.result)) {
      console.error('Invalid teams response format:', teamsData);
      return NextResponse.json({ error: 'Invalid teams response format' }, { status: 500 });
    }

    // Extract unique organization IDs from teams
    const organizationIds = new Set<string>();

    teamsData.result.forEach((team: {
      OrganizationId?: {
        objectId: string;
        Name?: string;
        IsActive?: boolean;
        createdAt?: string;
        updatedAt?: string;
      }
    }) => {
      if (team.OrganizationId && team.OrganizationId.objectId) {
        const orgId = team.OrganizationId.objectId;
        organizationIds.add(orgId);
        
        if (!organizationsMap.has(orgId)) {
          organizationsMap.set(orgId, {
            objectId: orgId,
            Name: team.OrganizationId.Name || 'Unknown Organization',
            IsActive: team.OrganizationId.IsActive !== false,
            createdAt: team.OrganizationId.createdAt,
            updatedAt: team.OrganizationId.updatedAt
          });
        }
      }
    });

    console.log(`Found ${organizationIds.size} unique organizations`);

    // Now get users for each organization
    const organizations = [];
    
    for (const orgId of organizationIds) {
      try {
        const usersResponse = await fetch(`${baseUrl}/api/app/functions/getuserlistbyorg`, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
            'Accept': '*/*',
            'Origin': 'http://localhost:3000',
            'Referer': 'http://localhost:3000/',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
          },
          body: JSON.stringify({
            organizationId: orgId,
            _ApplicationId: appId,
            _ClientVersion: 'js6.1.1',
            _InstallationId: 'ef44e42e-e0a3-44a0-a359-90c26af8ffac',
            _SessionToken: sessionToken
          })
        });

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          const organization = organizationsMap.get(orgId);
          
          organizations.push({
            ...organization,
            users: usersData.result || []
          });
          
          console.log(`Added organization ${organization.Name} with ${usersData.result?.length || 0} users`);
        } else {
          console.warn(`Failed to fetch users for organization ${orgId}`);
          const organization = organizationsMap.get(orgId);
          organizations.push({
            ...organization,
            users: []
          });
        }
      } catch (userError) {
        console.error(`Error fetching users for organization ${orgId}:`, userError);
        const organization = organizationsMap.get(orgId);
        organizations.push({
          ...organization,
          users: []
        });
      }
    }
    
    console.log(`Returning ${organizations.length} organizations with users`);
    
    return NextResponse.json({ 
      results: organizations,
      count: organizations.length 
    });

  } catch (error) {
    console.error('Error in get-all-organizations:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}