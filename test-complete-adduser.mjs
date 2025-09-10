import fetch from 'node-fetch';

console.log('🚀 Testing COMPLETE adduser request with all required fields...\n');

const API_BASE_URL = 'http://94.249.71.89:9000/api/app';

async function testCompleteAdduser() {
  try {
    // Step 1: Get fresh session token
    console.log('🔐 Step 1: Getting fresh authentication token...');
    const loginResponse = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'joe@joe.com',
        password: 'Meticx12@'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const sessionToken = loginData.sessionToken;
    
    console.log(`✅ Login successful! Token: ${sessionToken.substring(0, 20)}...`);

    // Step 2: Test complete adduser request
    console.log('\n👤 Step 2: Creating user with COMPLETE field structure...');
    
    const completeAdduserRequest = {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': sessionToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // Basic user info
        name: "ned@med.com",
        email: "ned@med.com",
        password: "Meticx12@",
        
        // Complete organization structure
        organization: {
          objectId: "b7cpzhOEUI",
          __type: "Pointer",
          className: "contracts_Organizations"
        },
        
        // Complete team structure
        team: {
          objectId: "eIL74nPXQy",
          __type: "Pointer",
          className: "contracts_Teams"
        },
        
        // Additional required fields
        tenantId: "default",
        role: "User",
        timezone: "UTC",
        active: true,
        phone: "",
        company: "Default Organization"
      })
    };

    console.log('📝 Request payload structure:');
    console.log('- name: ned@med.com');
    console.log('- email: ned@med.com');
    console.log('- organization: Pointer object with className');
    console.log('- team: Pointer object with className');
    console.log('- All required fields included');
    
    const adduserResponse = await fetch(`${API_BASE_URL}/functions/adduser`, completeAdduserRequest);
    
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
      console.log('🎉 SUCCESS! User created successfully!');
      console.log('✅ Response:', JSON.stringify(responseData, null, 2));
    } else if (adduserResponse.status === 400) {
      console.log('🔧 400 Error Details:');
      console.log('Error message:', responseData.error || responseData.message);
      
      if (responseData.error && responseData.error.includes('required fields')) {
        console.log('\n💡 Still missing fields. The API might require:');
        console.log('- firstName and lastName instead of name');
        console.log('- Additional validation fields');
        console.log('- Different organization/team structure');
      } else if (responseData.error && responseData.error.includes('Permission denied')) {
        console.log('\n🔒 Permission issue: User joe@joe.com needs admin role');
      } else if (responseData.error && responseData.error.includes('already exists')) {
        console.log('\n👤 User already exists - try different email');
      }
    } else {
      console.log('❌ Unexpected status:', adduserResponse.status);
      console.log('Response:', JSON.stringify(responseData, null, 2));
    }

    // Step 3: Quick verification of other endpoints still working
    console.log('\n🔍 Step 3: Verifying other endpoints still working...');
    
    const healthCheck = await fetch(`${API_BASE_URL}/health`);
    console.log(`Health check: ${healthCheck.status}`);
    
    const docsCheck = await fetch(`${API_BASE_URL}/classes/contracts_Document?limit=1`, {
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': sessionToken
      }
    });
    console.log(`Documents access: ${docsCheck.status}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCompleteAdduser();
