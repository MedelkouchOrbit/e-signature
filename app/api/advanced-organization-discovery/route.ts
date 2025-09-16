import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!sessionToken) {
    return NextResponse.json({ error: 'No session token provided' }, { status: 401 });
  }

  console.log('🔍 Advanced organization discovery - trying all possible methods...');

  const baseUrl = 'https://webhook.site/6eb09437-d8f3-441f-9e7f-faf1cd1a4e80';
  const headers = {
    'Content-Type': 'application/json',
    'X-Parse-Application-Id': 'opensign',
    'X-Parse-Session-Token': sessionToken,
  };

  const allOrganizations = new Set<string>();

  // Method 1: Try to query contracts_Organizations directly with different approaches
  console.log('📋 Method 1: Direct organization queries...');
  
  // Try 1a: Basic query
  try {
    const response = await fetch(`${baseUrl}/classes/contracts_Organizations`, {
      method: 'GET',
      headers,
    });
    const data = await response.json();
    if (data.results) {
      console.log(`✅ Direct query found ${data.results.length} organizations`);
      data.results.forEach((org: Record<string, unknown>) => {
        allOrganizations.add(JSON.stringify({
          objectId: org.objectId,
          Name: org.Name || 'Unknown Organization',
          IsActive: org.IsActive !== false,
          source: 'direct-query'
        }));
      });
    }
  } catch (error) {
    console.log('❌ Direct organization query failed:', error);
  }

  // Try 1b: Query with where clause for active organizations
  try {
    const whereClause = encodeURIComponent(JSON.stringify({ IsActive: true }));
    const response = await fetch(`${baseUrl}/classes/contracts_Organizations?where=${whereClause}`, {
      method: 'GET',
      headers,
    });
    const data = await response.json();
    if (data.results) {
      console.log(`✅ Active organizations query found ${data.results.length} organizations`);
      data.results.forEach((org: Record<string, unknown>) => {
        allOrganizations.add(JSON.stringify({
          objectId: org.objectId,
          Name: org.Name || 'Unknown Organization',
          IsActive: org.IsActive !== false,
          source: 'active-query'
        }));
      });
    }
  } catch (error) {
    console.log('❌ Active organizations query failed:', error);
  }

  // Method 2: Discover through users with OrganizationId
  console.log('👥 Method 2: Discovery through users...');
  try {
    const response = await fetch(`${baseUrl}/classes/contracts_Users`, {
      method: 'GET',
      headers,
    });
    const data = await response.json();
    if (data.results) {
      console.log(`📊 Found ${data.results.length} users to analyze`);
      const orgIds = new Set<string>();
      
      data.results.forEach((user: Record<string, unknown>) => {
        if (user.OrganizationId && typeof user.OrganizationId === 'object' && user.OrganizationId !== null) {
          const orgIdObj = user.OrganizationId as Record<string, unknown>;
          if (orgIdObj.objectId && typeof orgIdObj.objectId === 'string') {
            orgIds.add(orgIdObj.objectId);
          }
        }
      });
      
      console.log(`🏢 Found ${orgIds.size} unique organization IDs from users`);
      
      // For each organization ID found, try to get its details
      for (const orgId of orgIds) {
        try {
          const orgResponse = await fetch(`${baseUrl}/classes/contracts_Organizations/${orgId}`, {
            method: 'GET',
            headers,
          });
          const orgData = await orgResponse.json();
          if (orgData.objectId) {
            allOrganizations.add(JSON.stringify({
              objectId: orgData.objectId,
              Name: orgData.Name || 'Unknown Organization',
              IsActive: orgData.IsActive !== false,
              source: 'user-lookup'
            }));
          }
        } catch (error) {
          console.log(`❌ Failed to get organization ${orgId}:`, error);
        }
      }
    }
  } catch (error) {
    console.log('❌ Users query failed:', error);
  }

  // Method 3: Discovery through teams
  console.log('🎯 Method 3: Discovery through teams...');
  try {
    const response = await fetch(`${baseUrl}/functions/getteams`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });
    const data = await response.json();
    if (data.result) {
      console.log(`📋 Found ${data.result.length} teams`);
      const orgIds = new Set<string>();
      
      data.result.forEach((team: Record<string, unknown>) => {
        if (team.OrganizationId && typeof team.OrganizationId === 'object' && team.OrganizationId !== null) {
          const orgIdObj = team.OrganizationId as Record<string, unknown>;
          if (orgIdObj.objectId && typeof orgIdObj.objectId === 'string') {
            orgIds.add(orgIdObj.objectId);
          }
        }
      });
      
      console.log(`🏢 Found ${orgIds.size} unique organization IDs from teams`);
      
      // For each organization ID, get users and organization details
      for (const orgId of orgIds) {
        try {
          // Get organization details
          const orgResponse = await fetch(`${baseUrl}/classes/contracts_Organizations/${orgId}`, {
            method: 'GET',
            headers,
          });
          const orgData = await orgResponse.json();
          
          // Get users for this organization
          const usersResponse = await fetch(`${baseUrl}/functions/getuserlistbyorg`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ orgId }),
          });
          const usersData = await usersResponse.json();
          
          if (orgData.objectId) {
            allOrganizations.add(JSON.stringify({
              objectId: orgData.objectId,
              Name: orgData.Name || 'Unknown Organization',
              IsActive: orgData.IsActive !== false,
              users: usersData.result || [],
              source: 'teams-lookup'
            }));
          }
        } catch (error) {
          console.log(`❌ Failed to get organization ${orgId} from teams:`, error);
        }
      }
    }
  } catch (error) {
    console.log('❌ Teams query failed:', error);
  }

  // Method 4: Try cloud functions that might return organization data
  console.log('☁️ Method 4: Cloud function exploration...');
  
  // Try to call functions that might expose organization data
  const cloudFunctions = ['getteams', 'getuserlistbyorg', 'getuserscount'];
  
  for (const funcName of cloudFunctions) {
    try {
      const response = await fetch(`${baseUrl}/functions/${funcName}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      });
      const data = await response.json();
      console.log(`☁️ Function ${funcName} response:`, data);
    } catch (error) {
      console.log(`❌ Function ${funcName} failed:`, error);
    }
  }

  // Convert Set back to array and parse JSON
  const uniqueOrganizations = Array.from(allOrganizations).map((orgStr: string) => JSON.parse(orgStr));
  
  console.log(`🏆 Advanced discovery found ${uniqueOrganizations.length} total organizations!`);
  uniqueOrganizations.forEach((org, index) => {
    console.log(`  📍 ${index + 1}. ${org.Name} (${org.objectId}) - ${org.source} - Users: ${org.users?.length || 'unknown'}`);
  });

  return NextResponse.json({
    results: uniqueOrganizations,
    count: uniqueOrganizations.length,
    methods: {
      directQuery: uniqueOrganizations.filter(o => o.source === 'direct-query').length,
      activeQuery: uniqueOrganizations.filter(o => o.source === 'active-query').length,
      userLookup: uniqueOrganizations.filter(o => o.source === 'user-lookup').length,
      teamsLookup: uniqueOrganizations.filter(o => o.source === 'teams-lookup').length,
    }
  });
}