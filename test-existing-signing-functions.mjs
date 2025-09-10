#!/usr/bin/env node

// Test existing signing functions to understand the backend API

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api/proxy/opensign';
const DOCUMENT_ID = 'GQPB5IAUV1';
const SESSION_TOKEN = 'r:fc16b73c981e796f56d4bab8de6cc628';

console.log('🔍 TESTING EXISTING SIGNING FUNCTIONS');
console.log('====================================\n');

async function testSignDocument() {
  console.log('1. Testing /functions/signDocument...');
  
  const payloads = [
    // Test 1: Simple payload
    { documentId: DOCUMENT_ID },
    
    // Test 2: With signer info
    { 
      documentId: DOCUMENT_ID,
      signerEmail: 'joe@joe.com',
      signerName: 'joe'
    },
    
    // Test 3: With signature data
    {
      documentId: DOCUMENT_ID,
      signatureData: {
        x: 100, y: 100, width: 150, height: 50, page: 1
      },
      signerInfo: {
        name: 'joe',
        email: 'joe@joe.com'
      }
    }
  ];
  
  for (let i = 0; i < payloads.length; i++) {
    console.log(`\n   Test ${i + 1}: ${JSON.stringify(payloads[i])}`);
    
    try {
      const response = await fetch(`${BASE_URL}/functions/signDocument`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': SESSION_TOKEN
        },
        body: JSON.stringify(payloads[i])
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('   ✅ SUCCESS:', JSON.stringify(result, null, 2));
        break; // Stop on first success
      } else {
        const error = await response.text();
        console.log(`   ❌ Error: ${error}`);
      }
    } catch (error) {
      console.log(`   💥 Request failed: ${error.message}`);
    }
  }
}

async function testAddSignature() {
  console.log('\n2. Testing /functions/addSignature...');
  
  const payloads = [
    { docId: DOCUMENT_ID, email: 'joe@joe.com' },
    { documentId: DOCUMENT_ID, signerEmail: 'joe@joe.com' },
    { 
      docId: DOCUMENT_ID,
      signature: {
        x: 100, y: 100, 
        signer: 'joe@joe.com'
      }
    }
  ];
  
  for (let i = 0; i < payloads.length; i++) {
    console.log(`\n   Test ${i + 1}: ${JSON.stringify(payloads[i])}`);
    
    try {
      const response = await fetch(`${BASE_URL}/functions/addSignature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': SESSION_TOKEN
        },
        body: JSON.stringify(payloads[i])
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('   ✅ SUCCESS:', JSON.stringify(result, null, 2));
        break;
      } else {
        const error = await response.text();
        console.log(`   ❌ Error: ${error}`);
      }
    } catch (error) {
      console.log(`   💥 Request failed: ${error.message}`);
    }
  }
}

async function testCompleteSign() {
  console.log('\n3. Testing /functions/completeSign...');
  
  const payloads = [
    { documentId: DOCUMENT_ID },
    { docId: DOCUMENT_ID },
    { 
      documentId: DOCUMENT_ID, 
      signerEmail: 'joe@joe.com',
      completedAt: new Date().toISOString()
    }
  ];
  
  for (let i = 0; i < payloads.length; i++) {
    console.log(`\n   Test ${i + 1}: ${JSON.stringify(payloads[i])}`);
    
    try {
      const response = await fetch(`${BASE_URL}/functions/completeSign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': SESSION_TOKEN
        },
        body: JSON.stringify(payloads[i])
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('   ✅ SUCCESS:', JSON.stringify(result, null, 2));
        break;
      } else {
        const error = await response.text();
        console.log(`   ❌ Error: ${error}`);
      }
    } catch (error) {
      console.log(`   💥 Request failed: ${error.message}`);
    }
  }
}

// Run all tests
async function testExistingFunctions() {
  await testSignDocument();
  await testAddSignature(); 
  await testCompleteSign();
  
  console.log('\n📋 FINDINGS FOR BACKEND TEAM:');
  console.log('- Multiple signing functions already exist');
  console.log('- Need to understand the correct payload format');
  console.log('- May be able to use existing functions instead of creating signPdf');
  console.log('- Backend team should explain the current signing workflow');
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Backend team: Explain current signing function usage');
  console.log('2. Either fix existing functions or implement signPdf');
  console.log('3. Fix signer status field (currently undefined)');
  console.log('4. Test with joe@joe.com signing document GQPB5IAUV1');
}

testExistingFunctions();
