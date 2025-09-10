#!/usr/bin/env node

// Simple test with timeout to find working signPdf format

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api/proxy/opensign';
const SESSION_TOKEN = 'r:fc16b73c981e796f56d4bab8de6cc628';

console.log('🔍 Testing signPdf parameter requirements...');

// The error "Cannot read properties of undefined (reading 'Name')" suggests
// the backend expects a signer object with a Name property

async function testWithTimeout(payload, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(`${BASE_URL}/functions/signPdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': SESSION_TOKEN
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const text = await response.text();
    return { status: response.status, text };
    
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return { status: 'TIMEOUT', text: 'Request timed out' };
    }
    return { status: 'ERROR', text: error.message };
  }
}

async function findCorrectFormat() {
  // Test minimal payloads to understand the required structure
  const tests = [
    { name: 'Empty payload', payload: {} },
    { name: 'Only docId', payload: { docId: 'GQPB5IAUV1' } },
    { name: 'With userId', payload: { docId: 'GQPB5IAUV1', userId: 't83Vzh4ABm' } },
    { name: 'With signer Name', payload: { docId: 'GQPB5IAUV1', Name: 'joe' } },
    { name: 'With signer object', payload: { 
      docId: 'GQPB5IAUV1', 
      signer: { Name: 'joe', Email: 'joe@joe.com' }
    }},
    { name: 'Backend format from analysis', payload: {
      docId: 'GQPB5IAUV1',
      userId: 't83Vzh4ABm',
      signature: 'data:image/png;base64,test...',
      pdfFile: 'JVBERi0xLjQKMSAwIG9iago...'
    }}
  ];
  
  for (const test of tests) {
    console.log(`\n🧪 Testing: ${test.name}`);
    const result = await testWithTimeout(test.payload, 5000);
    console.log(`   Status: ${result.status}`);
    console.log(`   Response: ${result.text.substring(0, 100)}...`);
    
    // If we get a different error, we're making progress
    if (!result.text.includes("Cannot read properties of undefined (reading 'Name')")) {
      console.log('   ✅ Different error - progress made!');
    }
  }
  
  console.log('\n📋 Analysis:');
  console.log('- The backend expects a "Name" property');
  console.log('- This might be in the signer object or document object');
  console.log('- Need to provide complete signer information');
}

findCorrectFormat();
