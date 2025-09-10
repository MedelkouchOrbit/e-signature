import fetch from 'node-fetch';

console.log('🔍 Investigating actual data structure and adduser requirements...\n');

const API_BASE_URL = 'http://94.249.71.89:9000/1';

async function investigateData() {
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

    // Check current user details
    console.log('\n👤 Current admin user details:');
    const userMeResponse = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': sessionToken
      }
    });
    
    if (userMeResponse.ok) {
      const userData = await userMeResponse.json();
      console.log(JSON.stringify(userData, null, 2));
    }

    // Check what Parse classes exist
    console.log('\n📊 Checking Parse schemas...');
    const schemasResponse = await fetch(`${API_BASE_URL}/schemas`, {
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': sessionToken,
        'X-Parse-Master-Key': 'opensign' // Try master key
      }
    });
    
    console.log(`Schemas endpoint: ${schemasResponse.status}`);

    // Try different class names
    const classNames = [
      'contracts_Organizations', 
      'contracts_Teams',
      '_User',
      'Organization',
      'Team',
      'contracts_Organization', // singular
      'contracts_Team'
    ];
    
    for (const className of classNames) {
      console.log(`\n🔍 Checking class: ${className}`);
      const classResponse = await fetch(`${API_BASE_URL}/classes/${className}?limit=5`, {
        headers: {
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': sessionToken
        }
      });
      
      console.log(`Status: ${classResponse.status}`);
      
      if (classResponse.ok) {
        const classData = await classResponse.json();
        console.log(`Found ${classData.results.length} records`);
        if (classData.results.length > 0) {
          console.log('Sample record:', JSON.stringify(classData.results[0], null, 2));
        }
      }
    }

    // Try to find existing users to see the structure
    console.log('\n👥 Checking existing users...');
    const usersResponse = await fetch(`${API_BASE_URL}/users?limit=5`, {
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': sessionToken
      }
    });
    
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log(`Found ${usersData.results.length} users`);
      if (usersData.results.length > 0) {
        console.log('Sample user:', JSON.stringify(usersData.results[0], null, 2));
      }
    }

    // Try a very simple adduser request
    console.log('\n🧪 Testing simplest possible adduser...');
    const simpleTest = await fetch(`${API_BASE_URL}/functions/adduser`, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': sessionToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: "simple@test.com",
        password: "Test123@"
      })
    });
    
    console.log(`Simple test status: ${simpleTest.status}`);
    const simpleData = await simpleTest.json();
    console.log('Simple test response:', JSON.stringify(simpleData, null, 2));

  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
  }
}

investigateData();
