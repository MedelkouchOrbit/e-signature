import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'No session token provided' }, { status: 401 });
    }

    const baseUrl = 'http://94.249.71.89:9000';
    const organizationsMap = new Map();

    console.log('🎯 Strategic organization discovery using comprehensive team analysis...');

    // Enhanced Strategy 1: Query ALL teams directly (not limited to current user's org)
    const knownOrgIds = new Set<string>();
    
    try {
      console.log('🌐 Super Admin: Querying ALL teams across organizations...');
      
      // Direct query to get ALL teams, bypassing the organization-specific getteams function
      const allTeamsResponse = await fetch(`${baseUrl}/api/app/classes/contracts_Teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({
          where: {
            IsActive: true
          },
          include: 'OrganizationId',
          order: '-createdAt',
          limit: 1000,
          _method: 'GET',
          _ApplicationId: 'opensign',
          _ClientVersion: 'js6.1.1',
          _InstallationId: 'ef44e42e-e0a3-44a0-a359-90c26af8ffac',
          _SessionToken: sessionToken
        })
      });

      if (allTeamsResponse.ok) {
        const allTeamsData = await allTeamsResponse.json();
        console.log(`📋 ALL teams discovery found ${allTeamsData.results?.length || 0} teams`);
        
        if (allTeamsData.results && Array.isArray(allTeamsData.results)) {
          for (const team of allTeamsData.results) {
            if (team.OrganizationId?.objectId) {
              knownOrgIds.add(team.OrganizationId.objectId);
            }
          }
          
          // Log team distribution by organization
          const teamsByOrg = allTeamsData.results.reduce((acc: Record<string, number>, team: {
            OrganizationId?: { objectId?: string; Name?: string }
          }) => {
            const orgId = team.OrganizationId?.objectId || 'unknown';
            const orgName = team.OrganizationId?.Name || `Org-${orgId}`;
            acc[orgName] = (acc[orgName] || 0) + 1;
            return acc;
          }, {});
          console.log('🏢 Teams by organization:', teamsByOrg);
        }
      } else {
        console.warn('Direct teams query failed, falling back to getteams function...');
        
        // Fallback to original getteams approach
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
          console.log(`📋 Fallback teams discovery found ${teamsData.result?.length || 0} teams`);
          
          if (teamsData.result && Array.isArray(teamsData.result)) {
            for (const team of teamsData.result) {
              if (team.OrganizationId?.objectId) {
                knownOrgIds.add(team.OrganizationId.objectId);
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Teams discovery failed:', error);
    }

    console.log(`🔍 Found ${knownOrgIds.size} organizations with teams`);

    // Strategy 2: Try common organization ID patterns
    // Based on Parse ObjectId patterns, try some likely recent IDs
    const possibleOrgIds = [
      '3ZB9qTD2hV', // Known existing org
      // Add more patterns based on Parse ObjectId generation if needed
    ];

    // Strategy 3: Since addadmin creates orgs, let's try to discover by probing
    // We'll test a range of possible organization IDs
    const testOrgIds = new Set([...knownOrgIds, ...possibleOrgIds]);

    console.log(`🧪 Testing ${testOrgIds.size} potential organization IDs...`);

    // For each potential org ID, try to get users
    for (const orgId of testOrgIds) {
      try {
        console.log(`🔄 Testing organization ${orgId}...`);
        
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
          
          if (userData.result && Array.isArray(userData.result) && userData.result.length > 0) {
            // Found users for this org, so it exists!
            console.log(`✅ Found organization ${orgId} with ${userData.result.length} users`);
            
            const firstUser = userData.result[0];
            const orgName = firstUser.OrganizationId?.Name || 
                           firstUser.Company || 
                           firstUser.TenantId?.TenantName || 
                           'Unknown Organization';
            
            organizationsMap.set(orgId, {
              objectId: orgId,
              Name: orgName,
              IsActive: true,
              createdAt: firstUser.OrganizationId?.createdAt || firstUser.createdAt,
              updatedAt: firstUser.OrganizationId?.updatedAt || firstUser.updatedAt,
              users: userData.result
            });
          } else {
            console.log(`🔍 Organization ${orgId} exists but has no users`);
          }
        } else {
          console.log(`❌ Organization ${orgId} not accessible (${usersResponse.status})`);
        }
      } catch (error) {
        console.log(`⚠️  Error testing organization ${orgId}:`, error);
      }
    }

    // Strategy 4: If we're still missing organizations, try to generate more IDs
    // Parse ObjectIDs follow a pattern - let's try some variations
    if (organizationsMap.size < 5) { // Arbitrary threshold
      console.log('🎲 Generating additional organization ID candidates...');
      
      // Try variations of known working IDs
      for (const baseId of knownOrgIds) {
        // Generate some potential sibling IDs by modifying the last few characters
        const variations = generateIdVariations(baseId);
        
        for (const varId of variations.slice(0, 3)) { // Limit to 3 variations per known ID
          if (!organizationsMap.has(varId)) {
            try {
              const usersResponse = await fetch(`${baseUrl}/api/app/functions/getuserlistbyorg`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'text/plain',
                },
                body: JSON.stringify({
                  organizationId: varId,
                  _ApplicationId: 'opensign',
                  _ClientVersion: 'js6.1.1',
                  _InstallationId: 'ef44e42e-e0a3-44a0-a359-90c26af8ffac',
                  _SessionToken: sessionToken,
                }),
              });

              if (usersResponse.ok) {
                const userData = await usersResponse.json();
                if (userData.result && userData.result.length > 0) {
                  console.log(`🎯 Discovered organization ${varId} via pattern matching!`);
                  
                  const firstUser = userData.result[0];
                  organizationsMap.set(varId, {
                    objectId: varId,
                    Name: firstUser.OrganizationId?.Name || firstUser.Company || 'Discovered Organization',
                    IsActive: true,
                    createdAt: firstUser.createdAt,
                    updatedAt: firstUser.updatedAt,
                    users: userData.result
                  });
                }
              }
            } catch {
              // Silently continue
            }
          }
        }
      }
    }

    const organizations = Array.from(organizationsMap.values());
    console.log(`🏆 Strategic discovery found ${organizations.length} organizations!`);
    
    for (const org of organizations) {
      console.log(`  📍 ${org.Name} (${org.objectId}): ${org.users.length} users`);
    }
    
    return NextResponse.json({ 
      results: organizations,
      count: organizations.length 
    });

  } catch (error) {
    console.error('Error in strategic discovery:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper function to generate ID variations
function generateIdVariations(baseId: string): string[] {
  if (baseId.length !== 10) return [];
  
  const variations = [];
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  
  // Try modifying the last 2 characters
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      const newId = baseId.slice(0, -2) + 
                   chars[Math.floor(Math.random() * chars.length)] + 
                   chars[Math.floor(Math.random() * chars.length)];
      if (newId !== baseId) {
        variations.push(newId);
      }
    }
  }
  
  return variations;
}