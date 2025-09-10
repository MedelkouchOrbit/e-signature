#!/usr/bin/env node

// Quick test with Name parameter added

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api/proxy/opensign';
const SESSION_TOKEN = 'r:fc16b73c981e796f56d4bab8de6cc628';

console.log('🚀 Testing signPdf with Name parameter...');

async function quickTest() {
  const payload = {
    docId: 'GQPB5IAUV1',
    userId: 't83Vzh4ABm',
    signature: 'data:image/png;base64,test...',
    pdfFile: 'test...',
    Name: 'joe', // Added this parameter
    isCustomCompletionMail: false,
    mailProvider: ''
  };

  try {
    const response = await fetch(`${BASE_URL}/functions/signPdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': SESSION_TOKEN
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${text.substring(0, 200)}...`);
    
    if (!text.includes("Cannot read properties of undefined (reading 'Name')")) {
      console.log('✅ NAME ERROR FIXED!');
    } else {
      console.log('❌ Still has Name error');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

quickTest();
