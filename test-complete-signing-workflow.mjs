#!/usr/bin/env node

// Complete document signing test based on backend specifications

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api/proxy/opensign';
const SESSION_TOKEN = 'r:fc16b73c981e796f56d4bab8de6cc628';
const DOCUMENT_ID = 'GQPB5IAUV1';
const USER_ID = 't83Vzh4ABm'; // joe@joe.com's user ID
const SIGNER_EMAIL = 'joe@joe.com';

// Simple base64 signature for testing
const TEST_SIGNATURE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAXNSR0IArs4c6QAABjhJREFUeF7t3X2MXGUVBvB3d2bmdmdndqe7s53dL2gLrVigH6C0pVAKBRGhECLQNhgTlUQjTdQEE40xGqMxmhgTI40mRhONJhpjGmNMY4zRaGKMJhpjNMZoYjTRxGjiPO+cN3f79u7u3JnZfT/OyXtvduf9eOY372fuOe97b6xWq4nzwYIpMDQ09NKKvf+rHDJly5CkyePGhZuKSRPa7XZZV8b9G3gFFi+aeEQQ59ypB06dkZB/wvDxON8ZDHKQnl/Qby6LZo8oE8PgSFsaE8L1K8rE8Xh3QJjcgIWLJj5SFUne+Y5jx+8+5eXjnv/H4/89dGxg7+D+Aw3r2tY1e3ZWTS3E/5a+XTveGbCQ1aorZdJbJ1YTsAg3bSGxxM2M5+WMhN/bDlm1M2O5xXp5ubTvCJ8/gK+6Ik6a8YbJ1YYsZvn8AXz9BTrfHbA/jxzFxVYRE7A4F27cVhOhvVeXTKxdyQVsxd/jjMvHV5ypqJP2nwcAAAAASUVORK5CYII=";

console.log('🚀 COMPLETE DOCUMENT SIGNING TEST');
console.log('================================');
console.log(`Document: ${DOCUMENT_ID}`);
console.log(`Signer: ${SIGNER_EMAIL} (ID: ${USER_ID})`);
console.log('');

async function makeRequest(endpoint, payload) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Parse-Application-Id': 'opensign',
      'X-Parse-Session-Token': SESSION_TOKEN
    },
    body: JSON.stringify(payload)
  });
  
  const text = await response.text();
  let result;
  try {
    result = JSON.parse(text);
  } catch {
    result = text;
  }
  
  return { status: response.status, result };
}

async function testCompleteSigningWorkflow() {
  
  // Step 1: Get document details
  console.log('📄 Step 1: Getting document details...');
  const docResponse = await makeRequest('/functions/getDocument', { 
    docId: DOCUMENT_ID 
  });
  
  console.log(`Status: ${docResponse.status}`);
  if (docResponse.status === 200 && docResponse.result.result) {
    const doc = docResponse.result.result;
    console.log(`✅ Document found: ${doc.Name}`);
    console.log(`   Status: ${doc.Status}`);
    console.log(`   Signers:`, doc.Signers?.map(s => `${s.Name} (${s.Email})`));
  } else {
    console.log('❌ Failed to get document:', docResponse.result);
    return;
  }
  
  // Step 2: Get PDF file content
  console.log('\n📁 Step 2: Getting PDF file content...');
  const pdfResponse = await makeRequest('/functions/getfilecontent', { 
    docId: DOCUMENT_ID 
  });
  
  console.log(`Status: ${pdfResponse.status}`);
  if (pdfResponse.status === 200 && pdfResponse.result.result) {
    const pdfResult = pdfResponse.result.result;
    const pdfContent = pdfResult.content || pdfResult.fileContent;
    
    if (pdfContent) {
      console.log(`✅ PDF content retrieved (${pdfContent.length} characters)`);
      
      // Step 3: Sign the document
      console.log('\n✍️  Step 3: Signing the document...');
      const signResponse = await makeRequest('/functions/signPdf', {
        docId: DOCUMENT_ID,
        userId: USER_ID,
        signature: TEST_SIGNATURE,
        pdfFile: pdfContent,
        isCustomCompletionMail: false,
        mailProvider: ""
      });
    
    console.log(`Status: ${signResponse.status}`);
    if (signResponse.status === 200) {
      console.log('🎉 DOCUMENT SIGNED SUCCESSFULLY!');
      console.log('Response:', JSON.stringify(signResponse.result, null, 2));
      
      // Step 4: Verify document status after signing
      console.log('\n🔍 Step 4: Verifying document status after signing...');
      const verifyResponse = await makeRequest('/functions/getDocument', { 
        docId: DOCUMENT_ID 
      });
      
      if (verifyResponse.status === 200 && verifyResponse.result.result) {
        const updatedDoc = verifyResponse.result.result;
        console.log(`✅ Updated document status: ${updatedDoc.Status}`);
        console.log(`   Signed URL: ${updatedDoc.SignedUrl || 'Not yet available'}`);
      }
      
    } else {
      console.log('❌ Failed to sign document:', signResponse.result);
    }
    
    } else {
      console.log('❌ Failed to get PDF content: No content found in response');
    }
    
  } else {
    console.log('❌ Failed to get PDF content:', pdfResponse.result);
  }
}

async function runTest() {
  try {
    await testCompleteSigningWorkflow();
    
    console.log('\n📋 TEST SUMMARY:');
    console.log('- Backend signPdf endpoint should now work correctly');
    console.log('- Frontend implementation updated with correct parameters');
    console.log('- Document GQPB5IAUV1 should be signable by joe@joe.com');
    console.log('');
    console.log('🎯 Next: Test the frontend signing interface!');
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

runTest();
