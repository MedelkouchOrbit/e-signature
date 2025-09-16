import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'No session token provided' }, { status: 401 });
    }

    const baseUrl = 'http://94.249.71.89:9000';
    const organizationsMap = new Map();

    console.log('🔍 Discovering organizations via comprehensive user analysis...');

    // Get ALL users (without role filters) to discover all possible organizations
    try {
      const usersResponse = await fetch(`${baseUrl}/api/app/classes/contracts_Users?include=OrganizationId,TenantId&limit=1000`, {
        method: 'GET',
        headers: {
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': sessionToken,
          'Content-Type': 'application/json',
        },
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log(`📊 Found ${usersData.results?.length || 0} total users in system`);
        
        if (usersData.results && Array.isArray(usersData.results)) {
          // Group users by organization and analyze
          const orgStats = new Map();
          
          for (const user of usersData.results) {
            if (user.OrganizationId?.objectId) {
              const orgId = user.OrganizationId.objectId;
              
              if (!orgStats.has(orgId)) {
                orgStats.set(orgId, {
                  objectId: orgId,
                  Name: user.OrganizationId.Name || user.Company || user.TenantId?.TenantName || 'Unknown Organization',
                  IsActive: user.OrganizationId.IsActive !== false,
                  createdAt: user.OrganizationId.createdAt || user.createdAt,
                  updatedAt: user.OrganizationId.updatedAt || user.updatedAt,
                  users: [],
                  userCount: 0,
                  adminUsers: 0,
                  recentUsers: 0
                });
              }
              
              const orgInfo = orgStats.get(orgId);
              orgInfo.users.push(user);
              orgInfo.userCount++;
              
              if (user.UserRole === 'contracts_Admin') {
                orgInfo.adminUsers++;
              }
              
              // Check if user was created in the last hour (indicating recent org creation)
              const userCreated = new Date(user.createdAt);
              const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
              if (userCreated > oneHourAgo) {
                orgInfo.recentUsers++;
              }
              
              // Update organization name if we have better info
              if (user.Company && !orgInfo.Name.startsWith(user.Company)) {
                orgInfo.Name = user.Company;
              }
              if (user.TenantId?.TenantName && orgInfo.Name === 'Unknown Organization') {
                orgInfo.Name = user.TenantId.TenantName;
              }
            }
          }
          
          console.log(`🏢 Discovered ${orgStats.size} organizations from user analysis:`);
          
          // Convert to final format
          for (const [orgId, orgInfo] of orgStats) {
            organizationsMap.set(orgId, {
              objectId: orgInfo.objectId,
              Name: orgInfo.Name,
              IsActive: orgInfo.IsActive,
              createdAt: orgInfo.createdAt,
              updatedAt: orgInfo.updatedAt,
              users: orgInfo.users
            });
            
            console.log(`  📍 ${orgInfo.Name} (${orgId}): ${orgInfo.userCount} users, ${orgInfo.adminUsers} admins, ${orgInfo.recentUsers} recent`);
          }
        }
      } else {
        console.warn('Users query failed:', usersResponse.status);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: usersResponse.status });
      }
    } catch (error) {
      console.error('Users query error:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Also try teams discovery as backup
    try {
      console.log('🔍 Adding teams discovery as backup...');
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
        const teamsData = await teamsResponse.json();
        console.log(`🔗 Teams discovery found ${teamsData.result?.length || 0} teams`);
        
        if (teamsData.result && Array.isArray(teamsData.result)) {
          for (const team of teamsData.result) {
            if (team.OrganizationId?.objectId) {
              const orgId = team.OrganizationId.objectId;
              if (organizationsMap.has(orgId)) {
                // Update existing organization with team info
                const existingOrg = organizationsMap.get(orgId);
                if (team.OrganizationId.Name && existingOrg.Name === 'Unknown Organization') {
                  existingOrg.Name = team.OrganizationId.Name;
                }
              } else {
                // This shouldn't happen if user discovery is complete, but add as backup
                console.log(`⚠️  Found team-only organization: ${orgId}`);
                organizationsMap.set(orgId, {
                  objectId: orgId,
                  Name: team.OrganizationId.Name || 'Team-Only Organization',
                  IsActive: team.OrganizationId.IsActive !== false,
                  createdAt: team.OrganizationId.createdAt,
                  updatedAt: team.OrganizationId.updatedAt,
                  users: [] // Will be filled by separate call
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Teams discovery failed:', error);
    }

    // For any organizations without users loaded, try to get users
    for (const [orgId, org] of organizationsMap) {
      if (!org.users || org.users.length === 0) {
        try {
          console.log(`🔄 Loading users for organization ${orgId}...`);
          const usersResponse = await fetch(`${baseUrl}/api/app/functions/getuserlistbyorg`, {
            method: 'POST',
            headers: {
              'Content-Type': 'text/plain',
            },
            body: JSON.stringify({
              organizationId: orgId,
              _ApplicationId: 'opensign',
              _ClientVersion: 'js6.1.1',
              _InstallationId: 'ef44e42e-e0a3-44a0-a359-90c26af8ffac',
              _SessionToken: sessionToken,
            }),
          });

          if (usersResponse.ok) {
            const userData = await usersResponse.json();
            org.users = userData.result || [];
            console.log(`  ✅ Loaded ${org.users.length} users for ${org.Name}`);
          }
        } catch (error) {
          console.error(`Error loading users for org ${orgId}:`, error);
        }
      }
    }

    const organizations = Array.from(organizationsMap.values());
    console.log(`🎯 Returning ${organizations.length} organizations with complete user data`);
    
    return NextResponse.json({ 
      results: organizations,
      count: organizations.length 
    });

  } catch (error) {
    console.error('Error in comprehensive discovery:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}