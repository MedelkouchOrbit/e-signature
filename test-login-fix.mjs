// Test the login endpoint fix
const API_BASE_URL = 'http://localhost:3000';

async function testLogin() {
  try {
    console.log('🧪 Testing login endpoint fix...');
    
    const response = await fetch(`${API_BASE_URL}/api/proxy/opensign/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': 'opensign',
      },
      body: JSON.stringify({
        username: 'admin@admin.com',
        password: 'admin@123'
      })
    });

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      if (data.sessionToken) {
        console.log('✅ Login successful! Session token:', data.sessionToken.substring(0, 20) + '...');
      }
    } else {
      console.log('❌ Login failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLogin();
