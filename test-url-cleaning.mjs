#!/usr/bin/env node

// Test the URL cleaning functionality for backend file URLs

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

// Test document IDs - we'll use a real document ID from the system
const TEST_DOCUMENT_ID = 'Ao5Nb0aBX5'; // Using the same document ID from previous tests

// Mock cleaning function (same as in the documents-api-service.ts)
function cleanFileUrl(url) {
  if (!url || typeof url !== 'string') return url;
  
  try {
    // Check if URL has multiple question marks
    const questionMarkCount = (url.match(/\?/g) || []).length;
    if (questionMarkCount > 1) {
      console.log('🧹 Cleaning malformed URL with multiple query parameters');
      // Replace all '?' after the first one with '&'
      let isFirstQuestion = true;
      const cleanedUrl = url.replace(/\?/g, (match) => {
        if (isFirstQuestion) {
          isFirstQuestion = false;
          return match;
        }
        return '&';
      });
      console.log('🧹 Original URL:', url);
      console.log('🧹 Cleaned URL:', cleanedUrl);
      return cleanedUrl;
    }
    
    // Validate URL structure
    new URL(url);
    return url;
  } catch (error) {
    console.warn('⚠️ Invalid URL format:', url, error.message);
    return url; // Return original URL if cleaning fails
  }
}

async function testEndpointWithCleaning(endpoint, docId) {
  console.log(`\n🔍 Testing ${endpoint} with document ID: ${docId}`);
  
  try {
    const response = await fetch(`${BASE_URL}/functions/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': env.NEXT_PUBLIC_PARSE_APPLICATION_ID || 'opensign',
        'X-Parse-Session-Token': env.PARSE_SESSION_TOKEN || ''
      },
      body: JSON.stringify({ documentId: docId })
    });

    if (!response.ok) {
      console.error(`❌ ${endpoint} failed:`, response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    console.log(`✅ ${endpoint} response:`, JSON.stringify(data, null, 2));

    // Extract file URL from response
    let fileUrl = null;
    if (data.result) {
      if (typeof data.result === 'string') {
        fileUrl = data.result;
      } else if (data.result.primaryFileUrl) {
        fileUrl = data.result.primaryFileUrl;
      } else if (data.result.fileUrls && data.result.fileUrls.length > 0) {
        fileUrl = data.result.fileUrls[0].url;
      }
    }

    if (fileUrl) {
      console.log(`📎 Original file URL from ${endpoint}:`, fileUrl);
      
      // Test URL cleaning
      const cleanedUrl = cleanFileUrl(fileUrl);
      console.log(`🧹 Cleaned file URL:`, cleanedUrl);
      
      // Test if cleaned URL is accessible
      console.log(`🌐 Testing file access...`);
      try {
        const fileResponse = await fetch(cleanedUrl, { method: 'HEAD' });
        console.log(`📁 File access test result: ${fileResponse.status} ${fileResponse.statusText}`);
        
        if (fileResponse.ok) {
          console.log(`✅ File URL is accessible after cleaning!`);
          
          // Get content type
          const contentType = fileResponse.headers.get('content-type');
          if (contentType) {
            console.log(`📄 Content-Type: ${contentType}`);
          }
        } else {
          console.log(`❌ File URL still not accessible: ${fileResponse.status}`);
        }
      } catch (fileError) {
        console.error(`💥 File access error:`, fileError.message);
      }
      
      return cleanedUrl;
    } else {
      console.warn(`⚠️ No file URL found in ${endpoint} response`);
      return null;
    }

  } catch (error) {
    console.error(`💥 Error testing ${endpoint}:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Testing URL Cleaning Functionality');
  console.log('=====================================');
  
  // Test all three backend endpoints
  const endpoints = ['getfileurl', 'getdocumentfile', 'getDocument'];
  
  for (const endpoint of endpoints) {
    await testEndpointWithCleaning(endpoint, TEST_DOCUMENT_ID);
    console.log('\n' + '='.repeat(50));
  }
  
  console.log('\n🎯 URL Cleaning Test Complete!');
}

// Run the tests
runTests().catch(console.error);
