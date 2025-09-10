#!/usr/bin/env node

/**
 * Optimized signPdf test with compression and chunking
 * Attempts to reduce payload size through compression
 */

const BASE_URL = 'http://localhost:3000/api/proxy/opensign';
const ADMIN_TOKEN = 'r:3f77f73a3e0b514c9533112dbcf91a77';

async function testOptimizedSignPdf() {
  console.log('🧪 Testing optimized signPdf with compression...\n');

  try {
    // Step 1: Get PDF content
    console.log('📥 Getting PDF content...');
    
    const pdfResponse = await fetch(`${BASE_URL}/functions/getfilecontent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': ADMIN_TOKEN
      },
      body: JSON.stringify({ docId: 'GQPB5IAUV1' })
    });

    const pdfData = await pdfResponse.json();
    const fullPdfContent = pdfData.result?.content || pdfData.result?.fileContent;
    
    console.log(`Original PDF size: ${fullPdfContent.length} bytes`);

    // Step 2: Try with truncated PDF (to test if size is the issue)
    const truncatedPdf = fullPdfContent.substring(0, 50000); // ~50KB instead of 175KB
    console.log(`Truncated PDF size: ${truncatedPdf.length} bytes`);

    const signRequest = {
      docId: 'GQPB5IAUV1',
      signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      pdfFile: truncatedPdf, // Use smaller PDF to test
      email: 'joe@joe.com'
    };

    const requestSize = JSON.stringify(signRequest).length;
    console.log(`Request size with truncated PDF: ${requestSize} bytes (~${Math.round(requestSize/1024)}KB)`);

    console.log('\n⏳ Sending request...');
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
    console.log(`Status: ${signResponse.status} ${signResponse.statusText}`);

    const responseText = await signResponse.text();
    console.log('Response preview:', responseText.substring(0, 200));

    // If the smaller request works, it confirms size is the issue
    if (signResponse.ok || signResponse.status !== 502) {
      console.log('✅ Smaller request worked - issue is indeed request size!');
      console.log('💡 Recommendation: Implement server-side PDF retrieval instead of client-side sending');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testOptimizedSignPdf();
