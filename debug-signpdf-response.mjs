#!/usr/bin/env node

/**
 * Debug signPdf response to understand the actual format being returned
 */

const BASE_URL = 'http://94.249.71.89:9000';
const SESSION_TOKEN = 'r:cb552b4c0b21281759308cfbd99f9898';

// Test with a simple signature call
const TEST_DOC_ID = 'avtOApfK8d';
const TEST_USER_ID = '4apCqg38VG'; 
const SAMPLE_SIGNATURE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

console.log('🔍 Debug signPdf Response Format');
console.log('=================================\n');

async function debugSignPdf() {
  try {
    // First get PDF content
    console.log('📄 Getting PDF content...');
    const pdfResponse = await fetch(`${BASE_URL}/api/app/functions/getfilecontent`, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': SESSION_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        docId: TEST_DOC_ID
      })
    });

    if (!pdfResponse.ok) {
      throw new Error(`PDF fetch failed: ${pdfResponse.status}`);
    }

    const pdfData = await pdfResponse.json();
    const pdfContent = pdfData.result?.content || pdfData.result?.fileContent;
    
    if (!pdfContent) {
      throw new Error('No PDF content found');
    }

    console.log('✅ PDF content retrieved\n');

    // Now call signPdf and capture the full response
    console.log('📝 Calling signPdf...');
    const signResponse = await fetch(`${BASE_URL}/api/app/functions/signPdf`, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': SESSION_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        docId: TEST_DOC_ID,
        userId: TEST_USER_ID,
        signature: SAMPLE_SIGNATURE,
        pdfFile: pdfContent
      })
    });

    console.log(`📊 Response Status: ${signResponse.status} ${signResponse.statusText}`);

    if (!signResponse.ok) {
      const errorText = await signResponse.text();
      console.log('❌ Error Response Body:', errorText);
      return;
    }

    const responseData = await signResponse.json();
    
    console.log('\n🔍 Full Response Analysis:');
    console.log('==========================');
    console.log('Response Type:', typeof responseData);
    console.log('Response Keys:', Object.keys(responseData));
    console.log('\n📋 Full Response Data:');
    console.log(JSON.stringify(responseData, null, 2));
    
    // Check for expected fields
    console.log('\n✅ Field Analysis:');
    console.log('==================');
    console.log(`Has 'status' field: ${responseData.hasOwnProperty('status')} (value: ${responseData.status})`);
    console.log(`Has 'data' field: ${responseData.hasOwnProperty('data')} (type: ${typeof responseData.data})`);
    console.log(`Has 'document' field: ${responseData.hasOwnProperty('document')} (type: ${typeof responseData.document})`);
    console.log(`Has 'message' field: ${responseData.hasOwnProperty('message')} (value: ${responseData.message})`);
    
    if (responseData.data) {
      console.log('\n📦 Data Field Contents:');
      console.log(JSON.stringify(responseData.data, null, 2));
    }
    
    if (responseData.document) {
      console.log('\n📄 Document Field Keys:');
      console.log(Object.keys(responseData.document));
      console.log(`Document Status: ${responseData.document.Status}`);
      console.log(`Document IsCompleted: ${responseData.document.IsCompleted}`);
    }
    
  } catch (error) {
    console.error('💥 Debug failed:', error.message);
  }
}

// Run the debug
debugSignPdf();
