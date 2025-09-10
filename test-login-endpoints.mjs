import fetch from 'node-fetch';

console.log('🔍 Testing different login endpoints to fix frontend authentication...\n');

const API_BASE_URL = 'http://94.249.71.89:9000/1';

async function testLoginEndpoints() {
  try {
    const credentials = {
      username: 'admin@admin.com',
      password: 'admin@123'
    };

    // Test 1: Standard Parse login endpoint
    console.log('🧪 Test 1: Standard Parse /login endpoint...');
    const standardLogin = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    console.log(`Status: ${standardLogin.status}`);
    if (standardLogin.ok) {
      const data = await standardLogin.json();
      console.log('✅ SUCCESS! Response:', JSON.stringify(data, null, 2));
    }

    // Test 2: OpenSign loginuser function
    console.log('\n🧪 Test 2: OpenSign loginuser function...');
    const loginuserFunction = await fetch(`${API_BASE_URL}/functions/loginuser`, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    console.log(`Status: ${loginuserFunction.status}`);
    const loginuserData = await loginuserFunction.json();
    console.log('Response:', JSON.stringify(loginuserData, null, 2));

    // Test 3: AuthLoginAsMail function (for comparison)
    console.log('\n🧪 Test 3: AuthLoginAsMail function...');
    const authLoginFunction = await fetch(`${API_BASE_URL}/functions/AuthLoginAsMail`, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@admin.com',
        password: 'admin@123'
      })
    });
    
    console.log(`Status: ${authLoginFunction.status}`);
    const authLoginData = await authLoginFunction.json();
    console.log('Response:', JSON.stringify(authLoginData, null, 2));

    // Test 4: Different credential format for loginuser
    console.log('\n🧪 Test 4: loginuser with different format...');
    const altLoginuser = await fetch(`${API_BASE_URL}/functions/loginuser`, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@admin.com',
        password: 'admin@123'
      })
    });
    
    console.log(`Status: ${altLoginuser.status}`);
    const altData = await altLoginuser.json();
    console.log('Response:', JSON.stringify(altData, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLoginEndpoints();
