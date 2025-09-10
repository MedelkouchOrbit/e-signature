import fetch from 'node-fetch';

console.log('🔍 Comprehensive API Authentication Test...\n');

const API_BASES = [
  'http://94.249.71.89:9000/1',
  'http://94.249.71.89:9000/api/app', 
  'http://94.249.71.89:9000/app'
];

async function testAuthentication() {
  try {
    // Test login on each base URL
    for (const baseUrl of API_BASES) {
      console.log(`\n🔐 Testing login on: ${baseUrl}`);
      
      const loginResponse = await fetch(`${baseUrl}/login`, {
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

      console.log(`Login status: ${loginResponse.status}`);
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log(`✅ Login successful! User: ${loginData.objectId}`);
        
        const sessionToken = loginData.sessionToken;
        
        // Test different function call formats
        console.log(`\n🧪 Testing function calls on ${baseUrl}...`);
        
        // Format 1: /functions/functionName
        const func1 = await fetch(`${baseUrl}/functions/adduser`, {
          method: 'POST',
          headers: {
            'X-Parse-Application-Id': 'opensign',
            'X-Parse-Session-Token': sessionToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: "test@test.com",
            email: "test@test.com",
            password: "Test123@"
          })
        });
        
        console.log(`/functions/adduser: ${func1.status}`);
        if (func1.status !== 404) {
          const func1Data = await func1.json();
          console.log('Response:', JSON.stringify(func1Data, null, 2));
        }
        
        // Format 2: /classes/calls with function name
        const func2 = await fetch(`${baseUrl}/classes/calls`, {
          method: 'POST',
          headers: {
            'X-Parse-Application-Id': 'opensign',
            'X-Parse-Session-Token': sessionToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            _method: 'POST',
            functionName: 'adduser',
            name: "test2@test.com",
            email: "test2@test.com", 
            password: "Test123@"
          })
        });
        
        console.log(`/classes/calls: ${func2.status}`);
        
        // Test basic authenticated query
        const docsTest = await fetch(`${baseUrl}/classes/contracts_Document?limit=1`, {
          headers: {
            'X-Parse-Application-Id': 'opensign',
            'X-Parse-Session-Token': sessionToken
          }
        });
        
        console.log(`Documents query: ${docsTest.status}`);
        
        // Test user info endpoint
        const userInfo = await fetch(`${baseUrl}/users/me`, {
          headers: {
            'X-Parse-Application-Id': 'opensign',
            'X-Parse-Session-Token': sessionToken
          }
        });
        
        console.log(`User info (/users/me): ${userInfo.status}`);
        
        if (userInfo.ok) {
          const userData = await userInfo.json();
          console.log(`User role: ${userData.role}`);
          console.log(`User active: ${userData.active}`);
        }
        
      } else {
        console.log(`❌ Login failed: ${loginResponse.status}`);
      }
    }
    
    // Test without authentication
    console.log(`\n🔓 Testing unauthenticated endpoints...`);
    
    for (const baseUrl of API_BASES) {
      const healthCheck = await fetch(`${baseUrl}/health`);
      console.log(`${baseUrl}/health: ${healthCheck.status}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuthentication();
