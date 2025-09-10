#!/usr/bin/env node

// Test the getfilecontent endpoint specifically for the document causing issues

import { readFileSync } from 'fs';
import fetch from 'node-fetch';

// Simple env loader
function loadEnv() {
  try {
    const envContent = readFileSync('.env.local', 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...values] = line.split('=');
        if (key && values.length) {
          envVars[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
    return envVars;
  } catch (error) {
    console.log('No .env.local file found, using defaults');
    return {};
  }
}

const env = loadEnv();
const BASE_URL = 'http://localhost:3000/api/proxy/opensign'; // Use the proxy
const TEST_DOCUMENT_ID = 'GQPB5IAUV1'; // The document ID from the user's curl request

async function testGetFileContent() {
  console.log('🧪 Testing getfilecontent Endpoint');
  console.log('===================================\n');
  
  console.log(`📄 Document ID: ${TEST_DOCUMENT_ID}`);
  console.log(`🔗 Endpoint: ${BASE_URL}/functions/getfilecontent`);
  
  try {
    const response = await fetch(`${BASE_URL}/functions/getfilecontent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': 'r:fc16b73c981e796f56d4bab8de6cc628' // From the user's curl
      },
      body: JSON.stringify({ docId: TEST_DOCUMENT_ID })
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error(`❌ Request failed: ${response.status}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('\n📄 Response Analysis:');
    console.log('- Has result:', !!data.result);
    console.log('- Success status:', data.result?.success);
    console.log('- Has fileContent:', !!data.result?.fileContent);
    console.log('- Error message:', data.error || 'None');
    
    if (data.result?.fileContent) {
      const base64Data = data.result.fileContent;
      console.log('- Base64 content length:', base64Data.length, 'characters');
      console.log('- Estimated file size:', Math.round(base64Data.length * 0.75 / 1024), 'KB');
      
      // Test validity
      try {
        const binaryString = atob(base64Data);
        console.log('✅ Base64 is valid');
        
        if (binaryString.startsWith('%PDF')) {
          console.log('✅ Content is a valid PDF file');
          console.log('\n🎯 SUCCESS: getfilecontent endpoint works perfectly!');
          console.log('📋 The base64 content can be converted to a blob URL for the PDF viewer');
        } else {
          console.log('⚠️ Content is not a PDF file');
          console.log('- First 10 chars:', binaryString.substring(0, 10));
        }
      } catch (error) {
        console.error('❌ Invalid base64 data');
      }
    } else {
      console.log('❌ No file content returned');
      console.log('Full response:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('💥 Request error:', error.message);
  }
}

async function testGetFileUrl() {
  console.log('\n\n🧪 Testing getfileurl Endpoint (for comparison)');
  console.log('================================================\n');
  
  try {
    const response = await fetch(`${BASE_URL}/functions/getfileurl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': 'r:fc16b73c981e796f56d4bab8de6cc628'
      },
      body: JSON.stringify({ docId: TEST_DOCUMENT_ID })
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('- Has result:', !!data.result);
      console.log('- Success status:', data.result?.success);
      console.log('- Has fileUrl:', !!data.result?.fileUrl);
      
      if (data.result?.fileUrl) {
        const url = data.result.fileUrl;
        console.log('- URL length:', url.length);
        console.log('- Has AWS params:', url.includes('X-Amz-'));
        console.log('- Has JWT token:', url.includes('&token='));
        console.log('- Conflicting auth:', url.includes('X-Amz-') && url.includes('&token='));
        
        if (url.includes('X-Amz-') && url.includes('&token=')) {
          console.log('⚠️ PROBLEM: URL has conflicting authentication methods');
          console.log('🎯 This is why we get 403 errors - server doesn\'t know which auth to use');
        }
      }
    }
  } catch (error) {
    console.error('💥 getfileurl test error:', error.message);
  }
}

// Run both tests
async function runTests() {
  await testGetFileContent();
  await testGetFileUrl();
  
  console.log('\n🎯 CONCLUSION:');
  console.log('- If getfilecontent works → Use base64 content (bypasses all URL issues)');
  console.log('- If getfileurl has conflicting auth → Skip URL-based methods');
  console.log('- This approach eliminates both 400 and 403 errors');
}

runTests();
