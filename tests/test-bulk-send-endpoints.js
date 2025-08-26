#!/usr/bin/env node

/**
 * Bulk Send API Endpoints Test
 * 
 * Comprehensive test suite for bulk send functionality
 * Tests all CRUD operations and validates responses
 */

const https = require('https');
const http = require('http');

// Configuration
const API_BASE_URL = 'http://94.249.71.89:9000';
const TEST_CREDENTIALS = {
  email: 'medelkouchorbit@gmail.com',
  password: 'Tarik2020@'
};

let sessionToken = null;
let testTemplateId = null;
let testBulkSendId = null;

// Utility functions
function makeRequest(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE_URL + path);
    const isHTTPS = url.protocol === 'https:';
    const lib = isHTTPS ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHTTPS ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': 'opensign',
        'User-Agent': 'BulkSend-Test-Suite',
        ...headers
      }
    };

    if (sessionToken) {
      options.headers['X-Parse-Session-Token'] = sessionToken;
    }

    const req = lib.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

function logTest(testName, status, message, data = null) {
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${emoji} ${testName}: ${message}`);
  if (data && process.env.VERBOSE) {
    console.log('   Response:', JSON.stringify(data, null, 2).substring(0, 500));
  }
}

function logSection(title) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🧪 ${title}`);
  console.log('='.repeat(50));
}

// Test functions
async function testLogin() {
  logSection('Authentication Test');
  
  try {
    const response = await makeRequest('/parse/functions/loginuser', 'POST', TEST_CREDENTIALS);
    
    if (response.status === 200 && response.data.result && response.data.result.sessionToken) {
      sessionToken = response.data.result.sessionToken;
      logTest('Login', 'PASS', `Successfully authenticated (token: ${sessionToken.substring(0, 20)}...)`);
      return true;
    } else {
      logTest('Login', 'FAIL', `Authentication failed - Status: ${response.status}`, response.data);
      return false;
    }
  } catch (error) {
    logTest('Login', 'FAIL', `Authentication error: ${error.message}`);
    return false;
  }
}

async function testGetTemplates() {
  logSection('Template Discovery');
  
  try {
    const response = await makeRequest('/parse/functions/getReport', 'POST', {
      reportId: '6TeaPr321t',
      limit: 10,
      skip: 0
    });
    
    if (response.status === 200 && Array.isArray(response.data) && response.data.length > 0) {
      testTemplateId = response.data[0].objectId;
      logTest('Get Templates', 'PASS', `Found ${response.data.length} templates (using: ${response.data[0].Name})`);
      return true;
    } else {
      logTest('Get Templates', 'WARN', 'No templates found or unexpected response', response.data);
      return false;
    }
  } catch (error) {
    logTest('Get Templates', 'FAIL', `Template discovery error: ${error.message}`);
    return false;
  }
}

async function testGetBulkSends() {
  logSection('Bulk Send Retrieval Test');
  
  try {
    const response = await makeRequest('/parse/functions/getBulkSend', 'POST', {
      limit: 10,
      skip: 0,
      searchTerm: ''
    });
    
    if (response.status === 200) {
      if (response.data.results && Array.isArray(response.data.results)) {
        logTest('Get Bulk Sends', 'PASS', `Found ${response.data.results.length} bulk sends`);
        return true;
      } else if (response.data.error) {
        logTest('Get Bulk Sends', 'FAIL', `API error: ${response.data.error}`);
        return false;
      } else {
        logTest('Get Bulk Sends', 'WARN', 'Unexpected response format', response.data);
        return false;
      }
    } else {
      logTest('Get Bulk Sends', 'FAIL', `HTTP error: ${response.status}`, response.data);
      return false;
    }
  } catch (error) {
    logTest('Get Bulk Sends', 'FAIL', `Request error: ${error.message}`);
    return false;
  }
}

async function testCreateBulkSend() {
  logSection('Bulk Send Creation Test');
  
  if (!testTemplateId) {
    logTest('Create Bulk Send', 'SKIP', 'No template available for testing');
    return false;
  }
  
  const bulkSendData = {
    templateId: testTemplateId,
    name: `Test Bulk Send ${new Date().toISOString()}`,
    signers: [
      {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'signer',
        order: 1
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'signer',
        order: 2
      }
    ],
    sendInOrder: true,
    message: 'Please sign this test document - Automated Test'
  };
  
  try {
    const response = await makeRequest('/parse/functions/createBulkSend', 'POST', bulkSendData);
    
    if (response.status === 200 && response.data.success && response.data.objectId) {
      testBulkSendId = response.data.objectId;
      logTest('Create Bulk Send', 'PASS', `Successfully created bulk send (ID: ${testBulkSendId})`);
      return true;
    } else {
      logTest('Create Bulk Send', 'FAIL', `Creation failed - Status: ${response.status}`, response.data);
      return false;
    }
  } catch (error) {
    logTest('Create Bulk Send', 'FAIL', `Creation error: ${error.message}`);
    return false;
  }
}

async function testGetBulkSendDetails() {
  logSection('Bulk Send Details Test');
  
  if (!testBulkSendId) {
    logTest('Get Bulk Send Details', 'SKIP', 'No bulk send ID available for testing');
    return false;
  }
  
  try {
    const response = await makeRequest(`/parse/classes/contracts_BulkSend/${testBulkSendId}?include=TemplateId`, 'GET');
    
    if (response.status === 200 && response.data.objectId) {
      logTest('Get Bulk Send Details', 'PASS', `Retrieved details for bulk send: ${response.data.Name}`);
      return true;
    } else {
      logTest('Get Bulk Send Details', 'FAIL', `Retrieval failed - Status: ${response.status}`, response.data);
      return false;
    }
  } catch (error) {
    logTest('Get Bulk Send Details', 'FAIL', `Retrieval error: ${error.message}`);
    return false;
  }
}

async function testSendBulkSend() {
  logSection('Bulk Send Sending Test');
  
  if (!testBulkSendId) {
    logTest('Send Bulk Send', 'SKIP', 'No bulk send ID available for testing');
    return false;
  }
  
  try {
    const response = await makeRequest('/parse/functions/sendBulkSend', 'POST', {
      bulkSendId: testBulkSendId
    });
    
    if (response.status === 200 && (response.data.success || response.data.message)) {
      logTest('Send Bulk Send', 'PASS', `Successfully initiated sending: ${response.data.message || 'Bulk send initiated'}`);
      return true;
    } else {
      logTest('Send Bulk Send', 'FAIL', `Sending failed - Status: ${response.status}`, response.data);
      return false;
    }
  } catch (error) {
    logTest('Send Bulk Send', 'FAIL', `Sending error: ${error.message}`);
    return false;
  }
}

async function testDeleteBulkSend() {
  logSection('Bulk Send Deletion Test');
  
  if (!testBulkSendId) {
    logTest('Delete Bulk Send', 'SKIP', 'No bulk send ID available for testing');
    return false;
  }
  
  try {
    const response = await makeRequest('/parse/functions/deleteBulkSend', 'POST', {
      bulkSendId: testBulkSendId
    });
    
    if (response.status === 200 && (response.data.success || response.data.message)) {
      logTest('Delete Bulk Send', 'PASS', `Successfully deleted bulk send: ${response.data.message || 'Deleted'}`);
      return true;
    } else {
      logTest('Delete Bulk Send', 'FAIL', `Deletion failed - Status: ${response.status}`, response.data);
      return false;
    }
  } catch (error) {
    logTest('Delete Bulk Send', 'FAIL', `Deletion error: ${error.message}`);
    return false;
  }
}

async function testInvalidRequests() {
  logSection('Error Handling Tests');
  
  // Test with invalid template ID
  try {
    const response = await makeRequest('/parse/functions/createBulkSend', 'POST', {
      templateId: 'invalid-template-id',
      name: 'Test Invalid Template',
      signers: [{
        name: 'Test User',
        email: 'test@example.com',
        role: 'signer',
        order: 1
      }],
      sendInOrder: false
    });
    
    if (response.data.error) {
      logTest('Invalid Template ID', 'PASS', `Correctly rejected invalid template: ${response.data.error}`);
    } else {
      logTest('Invalid Template ID', 'FAIL', 'Should have rejected invalid template ID', response.data);
    }
  } catch (error) {
    logTest('Invalid Template ID', 'PASS', `Correctly threw error: ${error.message}`);
  }
  
  // Test with invalid bulk send ID
  try {
    const response = await makeRequest('/parse/functions/sendBulkSend', 'POST', {
      bulkSendId: 'invalid-bulk-send-id'
    });
    
    if (response.data.error) {
      logTest('Invalid Bulk Send ID', 'PASS', `Correctly rejected invalid ID: ${response.data.error}`);
    } else {
      logTest('Invalid Bulk Send ID', 'FAIL', 'Should have rejected invalid bulk send ID', response.data);
    }
  } catch (error) {
    logTest('Invalid Bulk Send ID', 'PASS', `Correctly threw error: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Bulk Send API Test Suite');
  console.log(`📡 Testing against: ${API_BASE_URL}`);
  console.log(`👤 Test user: ${TEST_CREDENTIALS.email}`);
  console.log(`🕒 Started at: ${new Date().toISOString()}\n`);
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  };
  
  // Run tests in sequence
  const tests = [
    { name: 'Authentication', fn: testLogin },
    { name: 'Template Discovery', fn: testGetTemplates },
    { name: 'Get Bulk Sends', fn: testGetBulkSends },
    { name: 'Create Bulk Send', fn: testCreateBulkSend },
    { name: 'Get Bulk Send Details', fn: testGetBulkSendDetails },
    { name: 'Send Bulk Send', fn: testSendBulkSend },
    { name: 'Delete Bulk Send', fn: testDeleteBulkSend },
    { name: 'Error Handling', fn: testInvalidRequests }
  ];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.total++;
      if (result === true) {
        results.passed++;
      } else if (result === false) {
        results.failed++;
      } else {
        results.skipped++;
      }
    } catch (error) {
      console.error(`💥 Test "${test.name}" crashed: ${error.message}`);
      results.total++;
      results.failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Summary
  logSection('Test Results Summary');
  console.log(`📊 Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`📈 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.failed > 0) {
    console.log('\n🔧 Troubleshooting:');
    console.log('• Check if OpenSign server is running on port 9000');
    console.log('• Verify credentials are correct');
    console.log('• Ensure bulk send cloud functions are deployed');
    console.log('• Check Parse Server logs for errors');
  }
  
  console.log(`\n🏁 Test completed at: ${new Date().toISOString()}`);
  
  // Exit with error code if tests failed
  process.exit(results.failed > 0 ? 1 : 0);
}

// Handle command line arguments
if (process.argv.includes('--verbose')) {
  process.env.VERBOSE = 'true';
}

// Run the tests
runAllTests().catch(error => {
  console.error('💥 Test suite crashed:', error);
  process.exit(1);
});
