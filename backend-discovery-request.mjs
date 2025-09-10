#!/usr/bin/env node

// Simple endpoint discovery for backend team

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api/proxy/opensign';
const SESSION_TOKEN = 'r:fc16b73c981e796f56d4bab8de6cc628';

console.log('🔍 BACKEND TEAM: Please analyze these test results');
console.log('================================================');
console.log('Frontend team needs to understand what signing endpoints exist\n');

async function testEndpoint(endpoint, payload = {}) {
  try {
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
    return {
      status: response.status,
      text: text,
      exists: !text.includes('Invalid function')
    };
  } catch (error) {
    return {
      status: 'ERROR',
      text: error.message,
      exists: false
    };
  }
}

// Test various endpoints
const endpointsToTest = [
  { path: '/functions/getDocument', payload: { documentId: 'GQPB5IAUV1' } },
  { path: '/functions/signPdf', payload: { documentId: 'GQPB5IAUV1' } },
  { path: '/functions/signDocument', payload: { documentId: 'GQPB5IAUV1' } },
  { path: '/functions/addSignature', payload: { documentId: 'GQPB5IAUV1' } },
  { path: '/classes/Document/GQPB5IAUV1', payload: {} },
  { path: '/classes/Document', payload: {} }
];

console.log('Testing endpoints...\n');

for (const test of endpointsToTest) {
  const result = await testEndpoint(test.path, test.payload);
  console.log(`${test.path}`);
  console.log(`  Status: ${result.status}`);
  console.log(`  Exists: ${result.exists ? '✅ YES' : '❌ NO'}`);
  console.log(`  Response: ${result.text.substring(0, 100)}...`);
  console.log('');
}

console.log('📋 BACKEND TEAM - Please provide:');
console.log('1. List of ALL available /functions/ endpoints');
console.log('2. Correct endpoint for document signing');
console.log('3. Required parameters for signing');
console.log('4. How to update signer status from "undefined" to "waiting"');
console.log('');
console.log('🎯 Goal: Enable joe@joe.com to sign document GQPB5IAUV1');
