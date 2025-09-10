import fetch from 'node-fetch';

console.log('🎯 Final adduser solution test - trying all possible approaches...\n');

const API_BASE_URL = 'http://94.249.71.89:9000/1';

async function solveAdduser() {
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

    // Method 1: Direct user creation using Parse REST API
    console.log('\n🧪 Method 1: Direct Parse User Creation...');
    const directUserResponse = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': sessionToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: "newuser@test.com",
        email: "newuser@test.com",
        password: "Test123@",
        name: "New User"
      })
    });
    
    console.log(`Direct user creation status: ${directUserResponse.status}`);
    if (directUserResponse.ok) {
      const userData = await directUserResponse.json();
      console.log('🎉 SUCCESS with direct user creation!');
      console.log('User created:', JSON.stringify(userData, null, 2));
    } else {
      const errorData = await directUserResponse.json();
      console.log('Direct creation error:', JSON.stringify(errorData, null, 2));
    }

    // Method 2: Try adduser with username instead of name
    console.log('\n🧪 Method 2: adduser with username field...');
    const usernameTest = await fetch(`${API_BASE_URL}/functions/adduser`, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': sessionToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: "username@test.com",
        email: "username@test.com",
        password: "Test123@"
      })
    });
    
    console.log(`Username test status: ${usernameTest.status}`);
    const usernameData = await usernameTest.json();
    console.log('Username test response:', JSON.stringify(usernameData, null, 2));

    // Method 3: Try without organization/team references
    console.log('\n🧪 Method 3: adduser without org/team...');
    const noOrgTest = await fetch(`${API_BASE_URL}/functions/adduser`, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': sessionToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: "noorg@test.com",
        email: "noorg@test.com",
        password: "Test123@",
        role: "User"
      })
    });
    
    console.log(`No org test status: ${noOrgTest.status}`);
    const noOrgData = await noOrgTest.json();
    console.log('No org test response:', JSON.stringify(noOrgData, null, 2));

    // Method 4: Try with different field names
    console.log('\n🧪 Method 4: Alternative field names...');
    const altFieldsTest = await fetch(`${API_BASE_URL}/functions/adduser`, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': sessionToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: "altfields@test.com",
        email: "altfields@test.com", 
        password: "Test123@",
        name: "Alt Fields",
        firstName: "Alt",
        lastName: "Fields"
      })
    });
    
    console.log(`Alt fields test status: ${altFieldsTest.status}`);
    const altFieldsData = await altFieldsTest.json();
    console.log('Alt fields test response:', JSON.stringify(altFieldsData, null, 2));

    // Method 5: Check what other cloud functions exist
    console.log('\n🔍 Method 5: Testing other functions to understand the pattern...');
    
    const otherFunctions = ['getUsers', 'createUser', 'addUser', 'registerUser', 'signup'];
    
    for (const funcName of otherFunctions) {
      const funcResponse = await fetch(`${API_BASE_URL}/functions/${funcName}`, {
        method: 'POST',
        headers: {
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': sessionToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: "test@test.com",
          password: "Test123@"
        })
      });
      
      console.log(`${funcName}: ${funcResponse.status}`);
      
      if (funcResponse.status !== 404) {
        const funcData = await funcResponse.json();
        console.log(`  Response: ${JSON.stringify(funcData, null, 2)}`);
      }
    }

  } catch (error) {
    console.error('❌ Solution test failed:', error.message);
  }
}

solveAdduser();
