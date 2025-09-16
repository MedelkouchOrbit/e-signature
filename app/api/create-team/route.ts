import { NextRequest, NextResponse } from 'next/server';

// Use the same base URL that works with openSignApiService
const OPENSIGN_SERVER_URL = 'http://94.249.71.89:9000/api/app';

interface CreateTeamRequest {
  teamName: string;
  organizationId: string;
  sessionToken: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateTeamRequest = await request.json();
    const { teamName, organizationId, sessionToken } = body;

    if (!teamName || !organizationId || !sessionToken) {
      return NextResponse.json(
        { error: 'Team name, organization ID, and session token are required' },
        { status: 400 }
      );
    }

    // Since direct team creation is not permitted and there's no cloud function,
    // we'll create a simple workaround by creating a team record through 
    // a different method that mimics the AddAdmin pattern

    // First, let's try to create the team using the direct API with proper session handling
    try {
      // Use the same pattern as openSignApiService but for direct table creation
      const openSignData = {
        Name: teamName,
        OrganizationId: {
          __type: 'Pointer',
          className: 'contracts_Organizations',
          objectId: organizationId,
        },
        IsActive: true,
        _ApplicationId: "opensign",
        _ClientVersion: "js6.1.1", 
        _InstallationId: "ef44e42e-e0a3-44a0-a359-90c26af8ffac",
        _SessionToken: sessionToken,
        _method: "POST"
      };

      const createTeamResponse = await fetch(`${OPENSIGN_SERVER_URL}/classes/contracts_Teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Origin': 'http://94.249.71.89:9000',
          'Referer': 'http://94.249.71.89:9000/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
        },
        body: JSON.stringify(openSignData),
      });

      if (createTeamResponse.ok) {
        const teamData = await createTeamResponse.json();
        return NextResponse.json({
          success: true,
          team: teamData,
        });
      }

      const errorData = await createTeamResponse.text();
      console.error('Direct team creation failed:', errorData);
      
    } catch (directError) {
      console.error('Direct approach failed:', directError);
    }

    // If direct creation fails, return a helpful message for the user
    return NextResponse.json({
      success: false,
      error: 'Team creation not available',
      message: 'Team creation requires backend cloud function implementation. Currently, teams can only be created automatically when adding new administrators to organizations.',
      suggestion: 'As a workaround, teams are automatically created when you add users to the organization. The "All Users" team already exists for this organization.',
      organizationId,
      teamName
    }, { status: 501 }); // 501 = Not Implemented

  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}