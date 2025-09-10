import fetch from 'node-fetch';

console.log('🔍 Finding the exact required fields for adduser function...\n');

const API_BASE_URL = 'http://94.249.71.89:9000/1';

async function findRequiredFields() {
  try {
    // Login with admin
    const loginResponse = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin@admin.com',
        password: 'admin@123'
      })
    });

    const loginData = await loginResponse.json();
    const sessionToken = loginData.sessionToken;
    console.log('✅ Admin logged in successfully');

    // First, let's check what organizations and teams exist
    console.log('\n📊 Checking available organizations...');
    const orgsResponse = await fetch(`${API_BASE_URL}/classes/contracts_Organizations`, {
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': sessionToken
      }
    });
    
    if (orgsResponse.ok) {
      const orgsData = await orgsResponse.json();
      console.log(`Found ${orgsData.results.length} organizations:`);
      orgsData.results.forEach(org => {
        console.log(`  - ${org.company} (ID: ${org.objectId})`);
      });
    }

    console.log('\n📊 Checking available teams...');
    const teamsResponse = await fetch(`${API_BASE_URL}/classes/contracts_Teams`, {
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': sessionToken
      }
    });
    
    if (teamsResponse.ok) {
      const teamsData = await teamsResponse.json();
      console.log(`Found ${teamsData.results.length} teams:`);
      teamsData.results.forEach(team => {
        console.log(`  - ${team.teamname} (ID: ${team.objectId})`);
      });
    }

    // Test different field combinations
    const testCases = [
      {
        name: 'Minimal fields',
        payload: {
          name: "test1@test.com",
          email: "test1@test.com",
          password: "Test123@"
        }
      },
      {
        name: 'Basic fields',
        payload: {
          username: "test2@test.com", 
          email: "test2@test.com",
          password: "Test123@",
          name: "test2@test.com"
        }
      },
      {
        name: 'With organization only',
        payload: {
          name: "test3@test.com",
          email: "test3@test.com", 
          password: "Test123@",
          organization: "b7cpzhOEUI"
        }
      },
      {
        name: 'Standard format',
        payload: {
          name: "test4@test.com",
          email: "test4@test.com",
          password: "Test123@",
          organization: {
            objectId: "b7cpzhOEUI",
            __type: "Pointer",
            className: "contracts_Organizations"
          },
          role: "User"
        }
      },
      {
        name: 'Complete format',
        payload: {
          name: "test5@test.com",
          email: "test5@test.com", 
          password: "Test123@",
          organization: {
            objectId: "b7cpzhOEUI",
            __type: "Pointer", 
            className: "contracts_Organizations"
          },
          team: {
            objectId: "eIL74nPXQy",
            __type: "Pointer",
            className: "contracts_Teams"
          },
          role: "User",
          tenantId: "default",
          timezone: "UTC",
          active: true
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n🧪 Testing: ${testCase.name}`);
      console.log(`Payload: ${JSON.stringify(testCase.payload, null, 2)}`);
      
      const response = await fetch(`${API_BASE_URL}/functions/adduser`, {
        method: 'POST',
        headers: {
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': sessionToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase.payload)
      });
      
      console.log(`Status: ${response.status}`);
      
      const responseData = await response.json();
      console.log(`Response: ${JSON.stringify(responseData, null, 2)}`);
      
      if (response.status === 200 || response.status === 201) {
        console.log('🎉 SUCCESS! This format works!');
        break;
      }
      
      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

findRequiredFields();
