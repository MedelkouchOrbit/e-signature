import fetch from 'node-fetch';

console.log('🔍 Testing your exact API call to identify the 400 error...\n');

async function testYourExactAPI() {
  try {
    // First, let's test if your frontend proxy is working
    console.log('🧪 Step 1: Testing if localhost:3000 proxy is accessible...');
    
    try {
      const proxyHealthResponse = await fetch('http://localhost:3000/api/proxy/opensign/health', {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json',
          'X-Parse-Application-Id': 'opensign'
        },
        timeout: 5000
      });
      
      console.log(`Proxy health check: ${proxyHealthResponse.status}`);
      
      if (proxyHealthResponse.ok) {
        const healthData = await proxyHealthResponse.text();
        console.log('✅ Proxy is accessible');
        console.log('Health response:', healthData.substring(0, 200) + '...');
      } else {
        console.log('⚠️ Proxy health check failed');
      }
    } catch (proxyError) {
      console.log('❌ Proxy not accessible:', proxyError.message);
      console.log('💡 Make sure your Next.js dev server is running on localhost:3000');
    }

    // Step 2: Test your exact request format
    console.log('\n🧪 Step 2: Testing your exact curl request format...');
    
    const yourExactRequest = await fetch('http://localhost:3000/api/proxy/opensign/functions/getteams', {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'Cookie': 'opensign_session_token=r:01735791c43b8e2954da0f884d5f575e',
        'Origin': 'http://localhost:3000',
        'Pragma': 'no-cache',
        'Referer': 'http://localhost:3000/en/team',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': 'r:af90807d45364664e3707e4fe9a1a99c',
        'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"'
      },
      body: JSON.stringify({ active: true })
    });

    console.log(`Your exact request status: ${yourExactRequest.status}`);
    
    const responseText = await yourExactRequest.text();
    console.log('Response body:', responseText);

    // Step 3: Test the direct API to verify token validity
    console.log('\n🧪 Step 3: Testing tokens directly against Parse Server...');
    
    const tokens = [
      'r:01735791c43b8e2954da0f884d5f575e', // Cookie token
      'r:af90807d45364664e3707e4fe9a1a99c'  // Header token
    ];

    for (const [index, token] of tokens.entries()) {
      console.log(`\n🔍 Testing token ${index + 1}: ${token.substring(0, 15)}...`);
      
      const directResponse = await fetch('http://94.249.71.89:9000/1/functions/getteams', {
        method: 'POST',
        headers: {
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active: true })
      });
      
      console.log(`Direct API status: ${directResponse.status}`);
      
      if (directResponse.ok) {
        const directData = await directResponse.json();
        console.log(`✅ Token ${index + 1} is VALID!`);
        console.log(`Teams found: ${directData.result?.length || 0}`);
      } else {
        const errorData = await directResponse.json();
        console.log(`❌ Token ${index + 1} error:`, errorData.error || errorData.message);
      }
    }

    // Step 4: Test with simplified headers
    console.log('\n🧪 Step 4: Testing with simplified headers...');
    
    const simplifiedRequest = await fetch('http://localhost:3000/api/proxy/opensign/functions/getteams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': 'r:01735791c43b8e2954da0f884d5f575e' // Using cookie token
      },
      body: JSON.stringify({ active: true })
    });

    console.log(`Simplified request status: ${simplifiedRequest.status}`);
    
    if (simplifiedRequest.ok) {
      const simplifiedData = await simplifiedRequest.json();
      console.log('✅ Simplified request SUCCESS!');
      console.log('Response:', JSON.stringify(simplifiedData, null, 2));
    } else {
      const simplifiedError = await simplifiedRequest.text();
      console.log('❌ Simplified request failed:', simplifiedError);
    }

    // Step 5: Check your proxy implementation
    console.log('\n🔍 Step 5: Proxy configuration analysis...');
    console.log('🔍 Checking if your proxy correctly forwards session tokens...');
    console.log('💡 Your request has conflicting tokens:');
    console.log('   Cookie: r:01735791c43b8e2954da0f884d5f575e');
    console.log('   Header: r:af90807d45364664e3707e4fe9a1a99c');
    console.log('💡 The proxy might be using the wrong token or not forwarding properly');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testYourExactAPI();
