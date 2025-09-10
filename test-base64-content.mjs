#!/usr/bin/env node

// Test the new getfilecontent endpoint with base64 conversion

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
const BASE_URL = env.NEXT_PUBLIC_PARSE_SERVER_URL || 'http://localhost:1337';
const TEST_DOCUMENT_ID = 'Ao5Nb0aBX5'; // Using the same document ID from previous tests

async function testBase64ContentEndpoint() {
  console.log('🧪 Testing getfilecontent Endpoint for Base64 Content');
  console.log('=====================================================\n');
  
  try {
    console.log(`📄 Testing with document ID: ${TEST_DOCUMENT_ID}`);
    console.log(`🔗 Endpoint: ${BASE_URL}/functions/getfilecontent`);
    
    const response = await fetch(`${BASE_URL}/functions/getfilecontent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': env.NEXT_PUBLIC_PARSE_APPLICATION_ID || 'opensign',
        'X-Parse-Session-Token': env.PARSE_SESSION_TOKEN || ''
      },
      body: JSON.stringify({ docId: TEST_DOCUMENT_ID })
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error(`❌ Request failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }

    const data = await response.json();
    console.log('📄 Response Structure:');
    console.log('- Has result:', !!data.result);
    console.log('- Success status:', data.result?.success);
    console.log('- Has fileContent:', !!data.result?.fileContent);
    console.log('- File name:', data.result?.fileName || 'Not provided');
    console.log('- Content type:', data.result?.contentType || 'Not provided');
    
    if (data.result?.fileContent) {
      const base64Data = data.result.fileContent;
      console.log('- Base64 content length:', base64Data.length, 'characters');
      console.log('- Estimated file size:', Math.round(base64Data.length * 0.75 / 1024), 'KB');
      
      // Test base64 validity
      try {
        const binaryString = atob(base64Data);
        console.log('✅ Base64 data is valid');
        console.log('- Decoded binary length:', binaryString.length, 'bytes');
        
        // Check for PDF signature
        if (binaryString.startsWith('%PDF')) {
          console.log('✅ Content appears to be a valid PDF file');
        } else {
          console.log('⚠️ Content does not appear to be a PDF file');
          console.log('- First 10 characters:', binaryString.substring(0, 10));
        }
        
        // Test blob creation (simulating frontend conversion)
        console.log('\n🔧 Testing Frontend Blob Conversion:');
        const byteNumbers = new Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          byteNumbers[i] = binaryString.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        console.log('✅ Successfully converted to Uint8Array');
        console.log('- Array length:', byteArray.length, 'bytes');
        
        // In a real browser environment, you would do:
        // const blob = new Blob([byteArray], { type: 'application/pdf' });
        // const blobUrl = URL.createObjectURL(blob);
        console.log('✅ Blob conversion would succeed in browser environment');
        
      } catch (base64Error) {
        console.error('❌ Invalid base64 data:', base64Error.message);
      }
      
    } else {
      console.warn('⚠️ No file content found in response');
    }
    
    if (data.error) {
      console.error('❌ API Error:', data.error);
    }

    console.log('\n🎯 Base64 Content Test Complete!');
    
  } catch (error) {
    console.error('💥 Test Error:', error.message);
  }
}

// Run the test
testBase64ContentEndpoint();
