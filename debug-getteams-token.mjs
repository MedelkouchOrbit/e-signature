import fetch from 'node-fetch';

console.log('🔍 Debugging getteams session token issue...\n');

const DIRECT_API_URL = 'http://94.249.71.89:9000/1';
const PROXY_API_URL = 'http://localhost:3000/api/proxy/opensign';

async function debugGetTeams() {
  try {
    // Step 1: Get fresh admin session token directly from API
    console.log('🔐 Step 1: Getting fresh admin session token...');
    const loginResponse = await fetch(`${DIRECT_API_URL}/login`, {
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
      throw new Error(`Direct login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const freshToken = loginData.sessionToken;
    
    console.log(`✅ Fresh token obtained: ${freshToken.substring(0, 20)}...`);

    // Step 2: Test getteams directly on Parse Server
    console.log('\n🧪 Step 2: Testing getteams on direct Parse API...');
    const directTeamsResponse = await fetch(`${DIRECT_API_URL}/functions/getteams`, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': freshToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ active: true })
    });

    console.log(`Direct API status: ${directTeamsResponse.status}`);
    
    if (directTeamsResponse.ok) {
      const directData = await directTeamsResponse.json();
      console.log('✅ Direct API SUCCESS!');
      console.log('Teams data:', JSON.stringify(directData, null, 2));
    } else {
      const directError = await directTeamsResponse.json();
      console.log('❌ Direct API error:', JSON.stringify(directError, null, 2));
    }

    // Step 3: Test your frontend proxy endpoint
    console.log('\n🧪 Step 3: Testing your frontend proxy endpoint...');
    
    const proxyResponse = await fetch(`${PROXY_API_URL}/functions/getteams`, {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': freshToken
      },
      body: JSON.stringify({ active: true })
    });

    console.log(`Proxy API status: ${proxyResponse.status}`);
    
    if (proxyResponse.ok) {
      const proxyData = await proxyResponse.json();
      console.log('✅ Proxy API SUCCESS!');
      console.log('Proxy response:', JSON.stringify(proxyData, null, 2));
    } else {
      console.log('❌ Proxy API failed');
      const proxyText = await proxyResponse.text();
      console.log('Proxy error:', proxyText);
    }

    // Step 4: Test session token validation
    console.log('\n🔍 Step 4: Validating session token format...');
    console.log(`Token length: ${freshToken.length}`);
    console.log(`Token starts with 'r:': ${freshToken.startsWith('r:')}`);
    console.log(`Full token: ${freshToken}`);

    // Step 5: Test with the exact curl format you used
    console.log('\n🧪 Step 5: Simulating your exact curl request...');
    
    const curlSimulation = await fetch(`${PROXY_API_URL}/functions/getteams`, {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
        'Pragma': 'no-cache',
        'Referer': 'http://localhost:3000/en/team',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': freshToken,
        'Cookie': `opensign_session_token=${freshToken}`
      },
      body: JSON.stringify({ active: true })
    });

    console.log(`Curl simulation status: ${curlSimulation.status}`);
    
    if (curlSimulation.ok) {
      const curlData = await curlSimulation.json();
      console.log('✅ Curl simulation SUCCESS!');
      console.log('Response:', JSON.stringify(curlData, null, 2));
    } else {
      const curlError = await curlSimulation.text();
      console.log('❌ Curl simulation failed:', curlError);
    }

    // Step 6: Check if there are any other session tokens stored
    console.log('\n🔍 Step 6: Session token analysis...');
    console.log('Your curl used token: r:af90807d45364664e3707e4fe9a1a99c');
    console.log('Fresh token we got: ' + freshToken);
    console.log('Cookie token: r:c0200ebd8cd6665a83d7966f5db1d094');
    
    if (freshToken !== 'r:af90807d45364664e3707e4fe9a1a99c') {
      console.log('⚠️ Your curl token is different from fresh admin token!');
      console.log('💡 Try using the fresh token above in your curl request');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugGetTeams();
