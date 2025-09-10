#!/usr/bin/env node

/**
 * Test script for real signPdf functionality with large PDF content
 * Tests the optimized proxy with actual PDF signing
 */

const BASE_URL = 'http://localhost:3000/api/proxy/opensign';
const ADMIN_TOKEN = 'r:3f77f73a3e0b514c9533112dbcf91a77';

async function testRealSignPdf() {
  console.log('🧪 Testing real signPdf with large PDF content...\n');

  try {
    // Step 1: Get PDF content for a real document
    console.log('📥 Step 1: Getting PDF content for document GQPB5IAUV1');
    
    const pdfResponse = await fetch(`${BASE_URL}/functions/getfilecontent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': ADMIN_TOKEN
      },
      body: JSON.stringify({ docId: 'GQPB5IAUV1' })
    });

    if (!pdfResponse.ok) {
      throw new Error(`Failed to get PDF content: ${pdfResponse.status}`);
    }

    const pdfData = await pdfResponse.json();
    const pdfContent = pdfData.result?.content || pdfData.result?.fileContent;
    
    if (!pdfContent) {
      throw new Error('No PDF content found');
    }

    console.log(`✅ PDF content retrieved: ${pdfContent.length} bytes (Base64)`);
    console.log(`📊 Estimated raw PDF size: ~${Math.round(pdfContent.length * 0.75 / 1024)}KB`);

    console.log('\n' + '='.repeat(50) + '\n');

    // Step 2: Attempt to sign the PDF
    console.log('✍️  Step 2: Attempting to sign PDF with optimized proxy');
    
    const signRequest = {
      docId: 'GQPB5IAUV1',
      signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      pdfFile: pdfContent,
      email: 'joe@joe.com'
    };

    const requestSize = JSON.stringify(signRequest).length;
    console.log(`📏 Total request size: ${requestSize} bytes (~${Math.round(requestSize/1024)}KB)`);

    if (requestSize > 500000) {
      console.log('🚨 Large request detected - proxy should handle this with extended timeout');
    }

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
    console.log(`📊 Response status: ${signResponse.status} ${signResponse.statusText}`);

    const responseText = await signResponse.text();
    
    if (signResponse.status === 502) {
      try {
        const errorData = JSON.parse(responseText);
        console.log('❌ Proxy error details:');
        console.log('Issue:', errorData.troubleshooting?.issue);
        console.log('Recommendations:', errorData.troubleshooting?.recommendations);
      } catch {
        console.log('❌ Raw error response:', responseText.substring(0, 300));
      }
    } else if (signResponse.ok) {
      console.log('✅ Request successful!');
      try {
        const data = JSON.parse(responseText);
        console.log('Response preview:', JSON.stringify(data, null, 2).substring(0, 300));
      } catch {
        console.log('Response preview (non-JSON):', responseText.substring(0, 200));
      }
    } else {
      console.log('⚠️  Request failed with status:', signResponse.status);
      console.log('Response preview:', responseText.substring(0, 200));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testRealSignPdf();
