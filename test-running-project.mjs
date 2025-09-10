import fetch from 'node-fetch';

console.log('🔍 Testing your running project API calls...\n');

async function testRunningProject() {
  try {
    // Test 1: Check if your dev server is responding
    console.log('🧪 Test 1: Checking if localhost:3000 is responding...');
    const healthResponse = await fetch('http://localhost:3000', {
      method: 'GET',
      timeout: 5000
    });
    
    console.log(`Dev server status: ${healthResponse.status}`);
    if (healthResponse.ok) {
      console.log('✅ Your Next.js dev server is running correctly');
    }

    // Test 2: Check the proxy endpoint specifically
    console.log('\n🧪 Test 2: Testing proxy endpoint with working token...');
    const workingToken = 'r:01735791c43b8e2954da0f884d5f575e';
    
    const proxyResponse = await fetch('http://localhost:3000/api/proxy/opensign/functions/getteams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': workingToken
      },
      body: JSON.stringify({ active: true }),
      timeout: 10000
    });

    console.log(`Proxy status: ${proxyResponse.status}`);
    
    if (proxyResponse.ok) {
      const proxyData = await proxyResponse.json();
      console.log('✅ Proxy working! Teams found:', proxyData.result?.length || 0);
    } else {
      const errorText = await proxyResponse.text();
      console.log('❌ Proxy error response:', errorText.substring(0, 200) + '...');
    }

    // Test 3: Check localStorage token (simulate browser behavior)
    console.log('\n🧪 Test 3: Current frontend setup...');
    console.log('💡 To fix your Teams page, run this in your browser console:');
    console.log(`localStorage.setItem('opensign_session_token', '${workingToken}'); location.reload();`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRunningProject();
