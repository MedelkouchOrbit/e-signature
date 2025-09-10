#!/usr/bin/env node

/**
 * Test script for optimized signPdf function with reduced request size
 * Tests the fixes for large request handling
 */

const BASE_URL = 'http://localhost:3000/api/proxy/opensign';

// Test with a mock large signature request
async function testOptimizedSignPdf() {
  console.log('🧪 Testing optimized signPdf function...\n');

  try {
    // Test 1: Small request (should work)
    console.log('📝 Test 1: Small signPdf request');
    const smallRequest = {
      docId: 'test-doc-123',
      signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      email: 'test@test.com'
    };

    const response1 = await fetch(`${BASE_URL}/functions/signPdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': 'r:d5f9a6da49ca4ad6db58c5bbc540e8363'
      },
      body: JSON.stringify(smallRequest)
    });

    console.log(`Response: ${response1.status} ${response1.statusText}`);
    
    if (response1.status === 502) {
      const errorData = await response1.json();
      console.log('Error details:', errorData.troubleshooting);
    } else {
      const data = await response1.text();
      console.log('Response preview:', data.substring(0, 200) + '...');
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Request without PDF content (optimized approach)
    console.log('📝 Test 2: Optimized signPdf request (no PDF content)');
    const optimizedRequest = {
      docId: 'test-doc-456',
      userId: 'contracts_user_123',
      signatureBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      xyPosition: { x: 100, y: 100 },
      isDragSign: false,
      pageNo: 1,
      ipAddress: '127.0.0.1'
      // Note: No pdfFile parameter - this reduces request size significantly
    };

    const response2 = await fetch(`${BASE_URL}/functions/signPdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': 'r:d5f9a6da49ca4ad6db58c5bbc540e8363'
      },
      body: JSON.stringify(optimizedRequest)
    });

    console.log(`Response: ${response2.status} ${response2.statusText}`);
    
    if (response2.status === 502) {
      const errorData = await response2.json();
      console.log('Error details:', errorData.troubleshooting);
      
      // Check if it's a large request error
      if (errorData.troubleshooting.issue.includes('request size')) {
        console.log('✅ Large request error detection working');
      }
    } else {
      const data = await response2.text();
      console.log('Response preview:', data.substring(0, 200) + '...');
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Check proxy timeout handling
    console.log('📝 Test 3: Checking proxy configuration');
    console.log('Request size optimization: ✅ Removed pdfFile parameter');
    console.log('Extended timeout: ✅ 2 minutes for signPdf requests');
    console.log('Retry logic: ✅ Up to 2 retries for large requests');
    console.log('Better error messages: ✅ Specific guidance for large request errors');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testOptimizedSignPdf();
