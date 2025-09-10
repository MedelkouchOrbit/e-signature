#!/usr/bin/env node

// Test signPdf with enhanced payload based on backend requirements

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api/proxy/opensign';
const SESSION_TOKEN = 'r:fc16b73c981e796f56d4bab8de6cc628';
const DOCUMENT_ID = 'GQPB5IAUV1';
const USER_ID = 't83Vzh4ABm';

const TEST_SIGNATURE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAXNSR0IArs4c6QAABjhJREFUeF7t3X2MXGUVBvB3d2bmdmdndqe7s53dL2gLrVigH6C0pVAKBRGhECLQNhgTlUQjTdQEE40xGqMxmhgTI40mRhONJhpjGmNMY4zRaGKMJhpjNMZoYjTRxGjiPO+cN3f79u7u3JnZfT/OyXtvduf9eOY372fuOe97b6xWq4nzwYIpMDQ09NKKvf+rHDJly5CkyePGhZuKSRPa7XZZV8b9G3gFFi+aeEQQ59ypB06dkZB/wvDxON8ZDHKQnl/Qby6LZo8oE8PgSFsaE8L1K8rE8Xh3QJjcgIWLJj5SFUne+Y5jx+8+5eXjnv/H4/89dGxg7+D+Aw3r2tY1e3ZWTS3E/5a+XTveGbCQ1aorZdJbJ1YTsAg3bSGxxM2M5+WMhN/bDlm1M2O5xXp5ubTvCJ8/gK+6Ik6a8YbJ1YYsZvn8AXz9BTrfHbA/jxzFxVYRE7A4F27cVhOhvVeXTKxdyQVsxd/jjMvHV5ypqJP2nwcAAAAASUVORK5CYII=";

console.log('🧪 Testing signPdf with enhanced payload...');

async function testSignPdfEnhanced() {
  // Get PDF content
  const pdfResponse = await fetch(`${BASE_URL}/functions/getfilecontent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Parse-Application-Id': 'opensign',
      'X-Parse-Session-Token': SESSION_TOKEN
    },
    body: JSON.stringify({ docId: DOCUMENT_ID })
  });

  const pdfData = await pdfResponse.json();
  const pdfContent = pdfData.result?.content;

  console.log('✅ Got PDF content');

  // Test different payload variations
  const payloadVariations = [
    // Variation 1: Minimal (current)
    {
      docId: DOCUMENT_ID,
      userId: USER_ID,
      signature: TEST_SIGNATURE,
      pdfFile: pdfContent,
      isCustomCompletionMail: false,
      mailProvider: ""
    },
    
    // Variation 2: With signer info
    {
      docId: DOCUMENT_ID,
      userId: USER_ID,
      signature: TEST_SIGNATURE,
      pdfFile: pdfContent,
      signerName: "joe",
      signerEmail: "joe@joe.com",
      isCustomCompletionMail: false,
      mailProvider: ""
    },
    
    // Variation 3: With position data
    {
      docId: DOCUMENT_ID,
      userId: USER_ID,
      signature: TEST_SIGNATURE,
      pdfFile: pdfContent,
      x: 100,
      y: 100,
      isCustomCompletionMail: false,
      mailProvider: ""
    },
    
    // Variation 4: With complete signer object
    {
      docId: DOCUMENT_ID,
      userId: USER_ID,
      signature: TEST_SIGNATURE,
      pdfFile: pdfContent,
      signer: {
        Name: "joe",
        Email: "joe@joe.com",
        UserId: USER_ID
      },
      isCustomCompletionMail: false,
      mailProvider: ""
    }
  ];

  for (let i = 0; i < payloadVariations.length; i++) {
    console.log(`\n${i + 1}. Testing variation ${i + 1}...`);
    
    try {
      const signResponse = await fetch(`${BASE_URL}/functions/signPdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': SESSION_TOKEN
        },
        body: JSON.stringify(payloadVariations[i])
      });

      console.log(`   Status: ${signResponse.status}`);
      
      const responseText = await signResponse.text();
      console.log(`   Response: ${responseText.substring(0, 200)}...`);

      if (signResponse.ok) {
        console.log('   🎉 SUCCESS!');
        break; // Stop on first success
      }

    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
  }
}

testSignPdfEnhanced();
