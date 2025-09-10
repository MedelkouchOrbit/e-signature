import fetch from 'node-fetch';

console.log('🚀 Testing adduser with ADMIN credentials...\n');

const API_BASE_URL = 'http://94.249.71.89:9000/api/app';

async function testAdminAdduser() {
  try {
    // Step 1: Login with admin credentials
    console.log('🔐 Step 1: Logging in with admin credentials...');
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

    if (!loginResponse.ok) {
      throw new Error(`Admin login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const sessionToken = loginData.sessionToken;
    
    console.log(`✅ Admin login successful! Token: ${sessionToken.substring(0, 20)}...`);
    console.log(`👤 User ID: ${loginData.objectId}`);

    // Step 2: Test adduser with admin permissions
    console.log('\n👤 Step 2: Creating user with ADMIN permissions...');
    
    const adduserRequest = {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': sessionToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: "ned@med.com",
        email: "ned@med.com",
        password: "Meticx12@",
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
        tenantId: "default",
        role: "User",
        timezone: "UTC",
        active: true,
        phone: "",
        company: "Default Organization"
      })
    };

    console.log('📝 Creating user with admin session token...');
    
    const adduserResponse = await fetch(`${API_BASE_URL}/functions/adduser`, adduserRequest);
    
    console.log(`\n📊 Response Status: ${adduserResponse.status}`);
    
    const responseText = await adduserResponse.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.log('⚠️ Non-JSON response:', responseText);
      return;
    }

    if (adduserResponse.status === 200 || adduserResponse.status === 201) {
      console.log('🎉 SUCCESS! User created successfully with admin permissions!');
      console.log('✅ Response:', JSON.stringify(responseData, null, 2));
    } else if (adduserResponse.status === 400) {
      console.log('🔧 400 Error Details:');
      console.log('Error:', responseData.error || responseData.message);
      
      // Try alternative format if still getting 400
      console.log('\n🔄 Trying alternative request format...');
      
      const alternativeRequest = {
        method: 'POST',
        headers: {
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': sessionToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: "test@test.com",
          email: "test@test.com", 
          password: "Test123@",
          role: "User",
          tenantId: "default"
        })
      };
      
      const altResponse = await fetch(`${API_BASE_URL}/functions/adduser`, alternativeRequest);
      console.log(`Alternative format status: ${altResponse.status}`);
      
      const altData = await altResponse.json();
      console.log('Alternative response:', JSON.stringify(altData, null, 2));
      
    } else {
      console.log('❌ Unexpected status:', adduserResponse.status);
      console.log('Response:', JSON.stringify(responseData, null, 2));
    }

    // Step 3: Test other admin functions
    console.log('\n🔍 Step 3: Testing other admin functions...');
    
    // Test getUserListByOrg (admin function)
    const getUserListResponse = await fetch(`${API_BASE_URL}/functions/getUserListByOrg`, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': sessionToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    console.log(`getUserListByOrg status: ${getUserListResponse.status}`);
    
    if (getUserListResponse.ok) {
      const userListData = await getUserListResponse.json();
      console.log(`✅ Admin function working! Found ${userListData.result?.length || 0} users`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAdminAdduser();
