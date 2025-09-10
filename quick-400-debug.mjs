#!/usr/bin/env node

/**
 * Quick 400 Error Debug Test
 * Focuses on identifying specific 400 error causes
 */

const BASE_URL = 'http://94.249.71.89:9000/api/app';
const USERNAME = 'joe@joe.com';
const PASSWORD = 'Meticx12@';

console.log('🚨 Quick 400 Error Debug Test');
console.log('============================');

async function quickTest() {
  // Step 1: Login and get fresh session token
  console.log('\n🔐 Step 1: Fresh Authentication');
  console.log('-'.repeat(30));
  
  try {
    const loginResponse = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: USERNAME,
        password: PASSWORD
      })
    });
    
    console.log(`Login Status: ${loginResponse.status}`);
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    const sessionToken = loginData.sessionToken;
    const userId = loginData.objectId;
    
    console.log('✅ Login successful');
    console.log(`Session Token: ${sessionToken.substring(0, 30)}...`);
    console.log(`User ID: ${userId}`);
    
    // Step 2: Test common endpoints that might return 400
    const testCases = [
      {
        name: 'Health Check',
        url: `${BASE_URL}/health`,
        method: 'GET',
        headers: {
          'X-Parse-Application-Id': 'opensign'
        }
      },
      {
        name: 'Documents Query',
        url: `${BASE_URL}/classes/contracts_Document?limit=1`,
        method: 'GET',
        headers: {
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': sessionToken
        }
      },
      {
        name: 'signPdf Function (minimal)',
        url: `${BASE_URL}/functions/signPdf`,
        method: 'POST',
        headers: {
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': sessionToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          docId: 'test123'
        })
      },
      {
        name: 'adduser Function (your case)',
        url: `${BASE_URL}/functions/adduser`,
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
          organization: { objectId: "b7cpzhOEUI", company: "Default Organization" },
          team: "eIL74nPXQy",
          tenantId: "default",
          role: "User",
          timezone: "UTC"
        })
      },
      {
        name: 'getfilecontent Function',
        url: `${BASE_URL}/functions/getfilecontent`,
        method: 'POST',
        headers: {
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': sessionToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          docId: 'test123'
        })
      }
    ];
    
    console.log('\n🧪 Step 2: Testing Common 400 Error Cases');
    console.log('-'.repeat(40));
    
    for (const testCase of testCases) {
      console.log(`\n📋 Testing: ${testCase.name}`);
      
      try {
        const response = await fetch(testCase.url, {
          method: testCase.method,
          headers: testCase.headers,
          body: testCase.body
        });
        
        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log(`Content-Type: ${response.headers.get('content-type')}`);
        
        const responseText = await response.text();
        
        if (response.status === 400) {
          console.log('🚨 400 BAD REQUEST DETAILS:');
          console.log(`Raw response: ${responseText}`);
          
          try {
            const errorData = JSON.parse(responseText);
            console.log('📋 Parsed error:', JSON.stringify(errorData, null, 2));
          } catch {
            console.log('📋 Non-JSON error response');
          }
          
        } else if (response.ok) {
          console.log('✅ Success');
          
          try {
            const data = JSON.parse(responseText);
            if (data.result) {
              console.log('📊 Has result data');
            } else if (data.results) {
              console.log(`📊 Found ${data.results.length} results`);
            } else {
              console.log('📊 Response keys:', Object.keys(data).join(', '));
            }
          } catch {
            console.log('📊 Response length:', responseText.length);
          }
          
        } else {
          console.log(`❌ Failed: ${response.status}`);
          console.log(`Response: ${responseText.substring(0, 200)}`);
        }
        
      } catch (error) {
        console.log(`❌ Request error: ${error.message}`);
      }
    }
    
    // Step 3: Summary and recommendations
    console.log('\n📋 Step 3: 400 Error Analysis');
    console.log('-'.repeat(30));
    console.log('Common causes of 400 errors:');
    console.log('1. Missing required parameters in request body');
    console.log('2. Invalid parameter types or formats');
    console.log('3. Authentication issues (expired/invalid session)');
    console.log('4. Permission issues (user not authorized for action)');
    console.log('5. Invalid object references (non-existent IDs)');
    console.log('');
    console.log('🔧 Check the 400 error details above to identify the specific cause');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

quickTest().catch(console.error);
