import fetch from 'node-fetch';

console.log('🔍 Testing your tokens directly to confirm they work...\n');

async function testTokensDirectly() {
  try {
    const cookieToken = 'r:01735791c43b8e2954da0f884d5f575e';
    const headerToken = 'r:af90807d45364664e3707e4fe9a1a99c';
    
    console.log('🧪 Testing both tokens directly against Parse Server...\n');
    
    // Test cookie token
    console.log('🔍 Testing cookie token: r:01735791c43b8e2954da0f884d5f575e');
    const cookieTest = await fetch('http://94.249.71.89:9000/1/functions/getteams', {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': cookieToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ active: true })
    });
    
    console.log(`Cookie token status: ${cookieTest.status}`);
    const cookieData = await cookieTest.json();
    console.log('Cookie token response:', JSON.stringify(cookieData, null, 2));
    
    console.log('\n🔍 Testing header token: r:af90807d45364664e3707e4fe9a1a99c');
    const headerTest = await fetch('http://94.249.71.89:9000/1/functions/getteams', {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': headerToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ active: true })
    });
    
    console.log(`Header token status: ${headerTest.status}`);
    const headerData = await headerTest.json();
    console.log('Header token response:', JSON.stringify(headerData, null, 2));
    
    // Determine which token works
    if (cookieTest.ok && cookieData.result) {
      console.log('\n✅ SOLUTION: Cookie token works perfectly!');
      console.log('🔧 Your frontend should use this token:', cookieToken);
    } else if (headerTest.ok && headerData.result) {
      console.log('\n✅ SOLUTION: Header token works perfectly!');
      console.log('🔧 Your frontend should use this token:', headerToken);
    } else {
      console.log('\n❌ Both tokens are invalid/expired');
      console.log('💡 Need to get fresh admin token');
    }
    
  } catch (error) {
    console.error('❌ Direct test failed:', error.message);
  }
}

testTokensDirectly();
