#!/usr/bin/env node

// Quick test to verify current signing endpoint status
// For Backend Team: Run this to see what's missing

import { readFileSync } from 'fs';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api/proxy/opensign';
const DOCUMENT_ID = 'GQPB5IAUV1';
const SESSION_TOKEN = 'r:fc16b73c981e796f56d4bab8de6cc628';

console.log('🔍 BACKEND SIGNING ENDPOINT VERIFICATION');
console.log('========================================\n');

async function testSignPdfEndpoint() {
  console.log('1. Testing if signPdf endpoint exists...');
  
  try {
    const response = await fetch(`${BASE_URL}/functions/signPdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': SESSION_TOKEN
      },
      body: JSON.stringify({
        documentId: DOCUMENT_ID,
        signatureData: {
          positions: [{ x: 100, y: 100, width: 150, height: 50, page: 1 }],
          signerInfo: { name: 'joe', email: 'joe@joe.com' }
        }
      })
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 404) {
      console.log('   ❌ ENDPOINT MISSING - Backend needs to implement signPdf function');
    } else if (response.status === 401 || response.status === 403) {
      console.log('   ⚠️ ENDPOINT EXISTS but authorization failed');
    } else {
      console.log('   ✅ ENDPOINT EXISTS and responding');
      const result = await response.json();
      console.log('   Response:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.log('   💥 Request failed:', error.message);
  }
}

async function checkSignerStatus() {
  console.log('\n2. Checking signer status in document...');
  
  try {
    const response = await fetch(`${BASE_URL}/classes/contracts_Document/${DOCUMENT_ID}?include=Signers`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': SESSION_TOKEN
      }
    });

    if (response.ok) {
      const doc = await response.json();
      const joeSigner = doc.Signers?.find(s => 
        s.email === 'joe@joe.com' || s.Email === 'joe@joe.com'
      );
      
      if (joeSigner) {
        console.log('   ✅ joe@joe.com found in signers');
        console.log(`   📋 Status: "${joeSigner.status || joeSigner.Status || 'undefined'}"`);
        
        if (!joeSigner.status && !joeSigner.Status) {
          console.log('   ❌ SIGNER STATUS IS UNDEFINED - Backend needs to fix this');
          console.log('   🔧 Should be "waiting" for unsigned documents');
        } else if ((joeSigner.status || joeSigner.Status) === 'waiting') {
          console.log('   ✅ Signer status is correct');
        }
      } else {
        console.log('   ❌ joe@joe.com NOT found in document signers');
      }
    }
  } catch (error) {
    console.log('   💥 Failed to check document:', error.message);
  }
}

async function listAvailableFunctions() {
  console.log('\n3. Checking what functions are available...');
  
  // Try common signing-related function names
  const functionsToTest = [
    'signPdf',
    'signDocument', 
    'addSignature',
    'completeSign',
    'signContract'
  ];
  
  for (const funcName of functionsToTest) {
    try {
      const response = await fetch(`${BASE_URL}/functions/${funcName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': SESSION_TOKEN
        },
        body: JSON.stringify({ test: true })
      });
      
      console.log(`   ${funcName}: ${response.status} ${response.statusText}`);
      
      if (response.status !== 404) {
        console.log(`     ✅ Function exists: /functions/${funcName}`);
      }
    } catch (error) {
      console.log(`   ${funcName}: Request failed`);
    }
  }
}

// Run all checks
async function runVerification() {
  await testSignPdfEndpoint();
  await checkSignerStatus();
  await listAvailableFunctions();
  
  console.log('\n📋 SUMMARY FOR BACKEND TEAM:');
  console.log('1. Check if signPdf endpoint returned 404 (needs implementation)');
  console.log('2. Check if signer status is undefined (needs fixing)');
  console.log('3. Look for any existing signing functions in the list above');
  console.log('\n🎯 Focus on implementing /functions/signPdf endpoint');
  console.log('📄 See BACKEND_SIGNING_REQUIREMENTS.md for detailed specs');
}

runVerification();
