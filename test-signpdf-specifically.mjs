#!/usr/bin/env node

// Test signPdf specifically since it gave a different error

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api/proxy/opensign';
const DOCUMENT_ID = 'GQPB5IAUV1';
const SESSION_TOKEN = 'r:fc16b73c981e796f56d4bab8de6cc628';

console.log('🔍 TESTING signPdf FUNCTION SPECIFICALLY');
console.log('======================================\n');

async function testSignPdf() {
  const payloads = [
    // Test 1: Just document ID
    { documentId: DOCUMENT_ID },
    
    // Test 2: Different ID format
    { docId: DOCUMENT_ID },
    { id: DOCUMENT_ID },
    { objectId: DOCUMENT_ID },
    
    // Test 3: With PDF-specific parameters
    { 
      documentId: DOCUMENT_ID,
      pdfData: 'base64...',
      signaturePos: { x: 100, y: 100, page: 1 }
    },
    
    // Test 4: With signer info
    {
      documentId: DOCUMENT_ID,
      signerEmail: 'joe@joe.com',
      signerName: 'joe'
    },
    
    // Test 5: Empty payload
    {}
  ];
  
  for (let i = 0; i < payloads.length; i++) {
    console.log(`\nTest ${i + 1}: ${JSON.stringify(payloads[i])}`);
    
    try {
      const response = await fetch(`${BASE_URL}/functions/signPdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': SESSION_TOKEN
        },
        body: JSON.stringify(payloads[i])
      });

      console.log(`Status: ${response.status} ${response.statusText}`);
      
      const text = await response.text();
      console.log(`Response: ${text}`);
      
      // If we get anything other than "Invalid function", the function exists
      if (!text.includes('Invalid function')) {
        console.log('✅ signPdf function EXISTS but needs correct parameters!');
      }
      
    } catch (error) {
      console.log(`💥 Request failed: ${error.message}`);
    }
  }
}

console.log('🔍 Based on previous test, signPdf returned "Document not found" instead of "Invalid function"');
console.log('This suggests the function exists but needs the right parameters.\n');

await testSignPdf();

console.log('\n📋 CONCLUSION:');
console.log('- signPdf function appears to exist (different error than other functions)');
console.log('- Need to find the correct parameter format');
console.log('- Backend team should provide signPdf function documentation');
console.log('- All other signing functions are completely missing');
