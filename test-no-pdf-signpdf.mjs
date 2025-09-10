#!/usr/bin/env node

/**
 * Test optimized signPdf approach without PDF content in request
 * This should work if the server can retrieve PDF internally
 */

const BASE_URL = 'http://localhost:3000/api/proxy/opensign';
const ADMIN_TOKEN = 'r:3f77f73a3e0b514c9533112dbcf91a77';

async function testOptimizedApproach() {
  console.log('🧪 Testing optimized signPdf without PDF content...\n');

  try {
    // Test the simplified approach - no PDF content in request
    console.log('🚀 Testing simplified approach (no PDF content)...');
    
    const signRequest = {
      docId: 'GQPB5IAUV1',
      signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      email: 'joe@joe.com'
      // No pdfFile parameter - let server handle PDF retrieval
    };

    const requestSize = JSON.stringify(signRequest).length;
    console.log(`📏 Request size: ${requestSize} bytes (~${Math.round(requestSize/1024)}KB)`);

    const startTime = Date.now();
    
    const signResponse = await fetch(`${BASE_URL}/functions/signPdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': ADMIN_TOKEN
      },
      body: JSON.stringify(signRequest)
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️  Request completed in ${duration}ms`);
    console.log(`📊 Status: ${signResponse.status} ${signResponse.statusText}`);

    const responseText = await signResponse.text();
    
    if (signResponse.ok) {
      console.log('✅ Optimized approach successful!');
      console.log('📄 No PDF content needed in request - server handles retrieval internally');
      try {
        const data = JSON.parse(responseText);
        console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500));
      } catch {
        console.log('Response preview:', responseText.substring(0, 200));
      }
    } else if (responseText.includes('Pdf file not present')) {
      console.log('❌ Server requires PDF content in request');
      console.log('💡 The signPdf function expects pdfFile parameter');
      console.log('🔧 Recommendation: Use chunked/compressed approach for large PDF content');
    } else {
      console.log(`⚠️  Request failed: ${signResponse.status}`);
      console.log('Response:', responseText.substring(0, 300));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testOptimizedApproach();
