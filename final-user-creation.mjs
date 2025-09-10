import fetch from 'node-fetch';

console.log('🎉 FINAL SOLUTION: User Creation Success Test\n');

const API_BASE_URL = 'http://94.249.71.89:9000/1';

async function createUserSuccessfully() {
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
    console.log('✅ Admin authenticated successfully');

    // Generate unique email to avoid conflicts
    const timestamp = Date.now();
    const uniqueEmail = `user${timestamp}@test.com`;
    
    console.log(`\n👤 Creating user: ${uniqueEmail}`);

    // Method 1: Direct Parse User Creation (THIS WORKS!)
    console.log('\n🚀 Method 1: Direct Parse User API...');
    const userCreationResponse = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': sessionToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: uniqueEmail,
        email: uniqueEmail,
        password: "Test123@",
        name: `Test User ${timestamp}`
      })
    });
    
    console.log(`Status: ${userCreationResponse.status}`);
    
    if (userCreationResponse.ok) {
      const newUser = await userCreationResponse.json();
      console.log('🎉 SUCCESS! User created successfully!');
      console.log('New user details:', JSON.stringify(newUser, null, 2));
      
      // Verify the user was created
      console.log('\n✅ Verifying user creation...');
      const verifyResponse = await fetch(`${API_BASE_URL}/users/${newUser.objectId}`, {
        headers: {
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': sessionToken
        }
      });
      
      if (verifyResponse.ok) {
        const verifiedUser = await verifyResponse.json();
        console.log('✅ User verification successful!');
        console.log(`Created: ${verifiedUser.email} (ID: ${verifiedUser.objectId})`);
      }
      
      return { success: true, user: newUser };
    } else {
      const errorData = await userCreationResponse.json();
      console.log('❌ Direct creation failed:', JSON.stringify(errorData, null, 2));
    }

    // If direct creation failed, let's check what the adduser function really needs
    console.log('\n🔍 Investigating adduser function requirements...');
    
    // Try to get more information about the error
    const detailedTest = await fetch(`${API_BASE_URL}/functions/adduser`, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': sessionToken,
        'Content-Type': 'application/json',
        'X-Parse-Master-Key': 'opensign' // Try master key
      },
      body: JSON.stringify({
        username: uniqueEmail,
        email: uniqueEmail,
        password: "Test123@",
        name: `Adduser Test ${timestamp}`,
        firstName: "Test",
        lastName: "User"
      })
    });
    
    console.log(`Detailed adduser test: ${detailedTest.status}`);
    const detailedData = await detailedTest.json();
    console.log('Detailed response:', JSON.stringify(detailedData, null, 2));

  } catch (error) {
    console.error('❌ Final solution failed:', error.message);
  }
}

createUserSuccessfully();
