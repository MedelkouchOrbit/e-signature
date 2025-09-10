#!/usr/bin/env node

/**
 * Comprehensive API Test - All Endpoints
 * Tests all OpenSign API endpoints to identify 400 errors and authentication issues
 */

const API_BASE_URLS = [
  'http://94.249.71.89:9000/1',
  'http://94.249.71.89:9000/api/app',
  'http://94.249.71.89:9000/app'
];

const PROXY_BASE_URL = 'http://localhost:3000/api/proxy/opensign';
const USERNAME = 'joe@joe.com';
const PASSWORD = 'Meticx12@';

console.log('🔍 Comprehensive API Test - All Endpoints');
console.log('==========================================');

async function makeRequest(url, options = {}) {
  try {
    console.log(`🌐 Testing: ${url}`);
    console.log(`📋 Method: ${options.method || 'GET'}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📄 Content-Type: ${response.headers.get('content-type')}`);
    
    let responseData;
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      responseData = text.includes('<!DOCTYPE html>') ? 'HTML_RESPONSE' : text;
    }
    
    return {
      status: response.status,
      ok: response.ok,
      data: responseData,
      contentType
    };
    
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    return {
      status: 0,
      ok: false,
      error: error.message,
      data: null
    };
  }
}

async function testAuthentication() {
  console.log('\n🔐 Testing Authentication on All Base URLs');
  console.log('='.repeat(50));
  
  const results = {};
  
  for (const baseUrl of API_BASE_URLS) {
    console.log(`\n📍 Testing: ${baseUrl}`);
    console.log('-'.repeat(30));
    
    const loginResult = await makeRequest(`${baseUrl}/login`, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign'
      },
      body: JSON.stringify({
        username: USERNAME,
        password: PASSWORD
      })
    });
    
    if (loginResult.ok && loginResult.data?.sessionToken) {
      console.log('✅ Login successful');
      console.log(`🎫 Session Token: ${loginResult.data.sessionToken.substring(0, 20)}...`);
      console.log(`👤 User ID: ${loginResult.data.objectId}`);
      
      results[baseUrl] = {
        success: true,
        sessionToken: loginResult.data.sessionToken,
        userId: loginResult.data.objectId,
        userData: loginResult.data
      };
    } else if (loginResult.data === 'HTML_RESPONSE') {
      console.log('❌ HTML response (API not mounted)');
      results[baseUrl] = { success: false, issue: 'HTML_RESPONSE' };
    } else {
      console.log('❌ Login failed:', loginResult.data?.error || loginResult.error);
      results[baseUrl] = { 
        success: false, 
        issue: loginResult.data?.error || loginResult.error,
        status: loginResult.status
      };
    }
  }
  
  // Test proxy authentication
  console.log(`\n📍 Testing Proxy: ${PROXY_BASE_URL}`);
  console.log('-'.repeat(30));
  
  const proxyLoginResult = await makeRequest(`${PROXY_BASE_URL}/login`, {
    method: 'POST',
    body: JSON.stringify({
      username: USERNAME,
      password: PASSWORD
    })
  });
  
  if (proxyLoginResult.ok && proxyLoginResult.data?.sessionToken) {
    console.log('✅ Proxy login successful');
    results['proxy'] = {
      success: true,
      sessionToken: proxyLoginResult.data.sessionToken,
      userId: proxyLoginResult.data.objectId
    };
  } else {
    console.log('❌ Proxy login failed:', proxyLoginResult.data?.error || proxyLoginResult.error);
    results['proxy'] = { 
      success: false, 
      issue: proxyLoginResult.data?.error || proxyLoginResult.error 
    };
  }
  
  return results;
}

async function testEndpoints(authResults) {
  console.log('\n🧪 Testing All API Endpoints');
  console.log('='.repeat(50));
  
  const testCases = [
    {
      name: 'Health Check',
      path: '/health',
      method: 'GET',
      needsAuth: false
    },
    {
      name: 'Documents List',
      path: '/classes/contracts_Document?limit=1',
      method: 'GET',
      needsAuth: true
    },
    {
      name: 'Users List',
      path: '/classes/_User?limit=1',
      method: 'GET',
      needsAuth: true
    },
    {
      name: 'signPdf Function',
      path: '/functions/signPdf',
      method: 'POST',
      needsAuth: true,
      body: {
        docId: 'test123'
      }
    },
    {
      name: 'adduser Function',
      path: '/functions/adduser',
      method: 'POST',
      needsAuth: true,
      body: {
        name: "test@example.com",
        email: "test@example.com",
        password: "TestPass123",
        role: "User"
      }
    },
    {
      name: 'getfilecontent Function',
      path: '/functions/getfilecontent',
      method: 'POST',
      needsAuth: true,
      body: {
        docId: 'test123'
      }
    }
  ];
  
  for (const [baseUrl, authResult] of Object.entries(authResults)) {
    if (!authResult.success) {
      console.log(`\n❌ Skipping ${baseUrl} - authentication failed`);
      continue;
    }
    
    console.log(`\n📍 Testing endpoints for: ${baseUrl}`);
    console.log('-'.repeat(40));
    
    for (const testCase of testCases) {
      console.log(`\n🧪 ${testCase.name}`);
      
      const url = baseUrl === 'proxy' ? 
        `${PROXY_BASE_URL}${testCase.path}` : 
        `${baseUrl}${testCase.path}`;
      
      const headers = testCase.needsAuth ? {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': authResult.sessionToken
      } : {
        'X-Parse-Application-Id': 'opensign'
      };
      
      const options = {
        method: testCase.method,
        headers
      };
      
      if (testCase.body) {
        options.body = JSON.stringify(testCase.body);
      }
      
      const result = await makeRequest(url, options);
      
      if (result.ok) {
        console.log('✅ Success');
        if (result.data && typeof result.data === 'object') {
          console.log(`📊 Response keys: ${Object.keys(result.data).join(', ')}`);
        }
      } else if (result.status === 400) {
        console.log('⚠️ 400 Bad Request');
        console.log(`📋 Error: ${JSON.stringify(result.data, null, 2)}`);
      } else if (result.status === 401) {
        console.log('🔒 401 Unauthorized');
        console.log(`📋 Error: ${JSON.stringify(result.data, null, 2)}`);
      } else if (result.status === 403) {
        console.log('🚫 403 Forbidden');
        console.log(`📋 Error: ${JSON.stringify(result.data, null, 2)}`);
      } else if (result.data === 'HTML_RESPONSE') {
        console.log('❌ HTML Response (API not mounted)');
      } else {
        console.log(`❌ Failed (${result.status})`);
        console.log(`📋 Error: ${JSON.stringify(result.data, null, 2)}`);
      }
    }
  }
}

async function runComprehensiveTest() {
  console.log('🚀 Starting comprehensive API test...\n');
  
  // Test authentication on all endpoints
  const authResults = await testAuthentication();
  
  // Test all endpoints with valid authentication
  await testEndpoints(authResults);
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 TEST SUMMARY');
  console.log('='.repeat(50));
  
  const workingAuths = Object.entries(authResults).filter(([_, result]) => result.success);
  
  if (workingAuths.length > 0) {
    console.log('✅ Working authentication endpoints:');
    workingAuths.forEach(([url, _]) => {
      console.log(`   - ${url}`);
    });
    
    console.log('\n🎯 Recommendations:');
    console.log('1. Use working endpoints for API calls');
    console.log('2. Check 400 errors in endpoint details above');
    console.log('3. Verify request parameters for failing endpoints');
    console.log('4. Ensure proper authentication headers');
    
  } else {
    console.log('❌ No working authentication endpoints found');
    console.log('\n🔧 Issues to fix:');
    Object.entries(authResults).forEach(([url, result]) => {
      console.log(`   - ${url}: ${result.issue}`);
    });
  }
  
  console.log('\n📞 Use this data to identify specific 400 error causes');
}

// Run the comprehensive test
runComprehensiveTest().catch(console.error);
