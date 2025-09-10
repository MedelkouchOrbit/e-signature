#!/usr/bin/env node

// Quick test of just the signPdf endpoint

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api/proxy/opensign';
const SESSION_TOKEN = 'r:fc16b73c981e796f56d4bab8de6cc628';
const DOCUMENT_ID = 'GQPB5IAUV1';
const USER_ID = 't83Vzh4ABm';

// Test signature
const TEST_SIGNATURE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAXNSR0IArs4c6QAABjhJREFUeF7t3X2MXGUVBvB3d2bmdmdndqe7s53dL2gLrVigH6C0pVAKBRGhECLQNhgTlUQjTdQEE40xGqMxmhgTI40mRhONJhpjGmNMY4zRaGKMJhpjNMZoYjTRxGjiPO+cN3f79u7u3JnZfT/OyXtvduf9eOY372fuOe97b6xWq4nzwYIpMDQ09NKKvf+rHDJly5CkyePGhZuKSRPa7XZZV8b9G3gFFi+aeEQQ59ypB06dkZB/wvDxON8ZDHKQnl/Qby6LZo8oE8PgSFsaE8L1K8rE8Xh3QJjcgIWLJj5SFUne+Y5jx+8+5eXjnv/H4/89dGxg7+D+Aw3r2tY1e3ZWTS3E/5a+XTveGbCQ1aorZdJbJ1YTsAg3bSGxxM2M5+WMhN/bDlm1M2O5xXp5ubTvCJ8/gK+6Ik6a8YbJ1YYsZvn8AXz9BTrfHbA/jxzFxVYRE7A4F27cVhOhvVeXTKxdyQVsxd/jjMvHV5ypqJP2nwcAAAAASUVORK5CYII=";

console.log('🧪 Testing signPdf endpoint directly...');

async function testSignPdf() {
  // First get PDF content
  console.log('1. Getting PDF content...');
  const pdfResponse = await fetch(`${BASE_URL}/functions/getfilecontent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Parse-Application-Id': 'opensign',
      'X-Parse-Session-Token': SESSION_TOKEN
    },
    body: JSON.stringify({ docId: DOCUMENT_ID })
  });

  if (!pdfResponse.ok) {
    console.log('❌ Failed to get PDF:', pdfResponse.status);
    return;
  }

  const pdfData = await pdfResponse.json();
  const pdfContent = pdfData.result?.content;
  
  if (!pdfContent) {
    console.log('❌ No PDF content found');
    return;
  }

  console.log(`✅ Got PDF content (${pdfContent.length} chars)`);

  // Now test signPdf
  console.log('\n2. Testing signPdf...');
  
  const signPayload = {
    docId: DOCUMENT_ID,
    userId: USER_ID,
    signature: TEST_SIGNATURE,
    pdfFile: pdfContent,
    isCustomCompletionMail: false,
    mailProvider: ""
  };

  console.log('Payload:', JSON.stringify(signPayload, null, 2).substring(0, 500) + '...');

  try {
    const signResponse = await fetch(`${BASE_URL}/functions/signPdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': SESSION_TOKEN
      },
      body: JSON.stringify(signPayload)
    });

    console.log(`\nResponse Status: ${signResponse.status} ${signResponse.statusText}`);
    
    const responseText = await signResponse.text();
    console.log('\nResponse Body:');
    console.log(responseText);

    if (signResponse.ok) {
      console.log('\n🎉 SUCCESS: Document signing worked!');
    } else {
      console.log('\n❌ FAILED: Document signing failed');
    }

  } catch (error) {
    console.error('💥 Request failed:', error.message);
  }
}

testSignPdf();
