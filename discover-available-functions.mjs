#!/usr/bin/env node

// Discover available functions by testing known endpoints

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api/proxy/opensign';
const SESSION_TOKEN = 'r:fc16b73c981e796f56d4bab8de6cc628';

console.log('🔍 DISCOVERING AVAILABLE FUNCTIONS');
console.log('=================================\n');

// Test common function patterns
const functionsToTest = [
  'getDocuments',
  'getDocument', 
  'getUserLists',
  'getUserListByOrg',
  'addUser',
  'addContact',
  'addTeam',
  'createDocument',
  'updateDocument',
  'deleteDocument',
  'sign',
  'signDoc',
  'addSign',
  'createSign',
  'signContract',
  'signPdf',
  'sendDocument',
  'uploadFile',
  'downloadFile',
  'getUsers',
  'getTeams',
  'getContacts'
];

async function testFunction(functionName) {
  try {
    const response = await fetch(`${BASE_URL}/functions/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': SESSION_TOKEN
      },
      body: JSON.stringify({})
    });

    const status = response.status;
    const statusText = response.statusText;
    
    let result = 'Unknown';
    try {
      const text = await response.text();
      const parsed = JSON.parse(text);
      
      if (parsed.error === `Invalid function: "${functionName}"`) {
        result = '❌ Function does not exist';
      } else if (status === 400 && parsed.error) {
        result = `⚠️  Function exists but bad params: ${parsed.error}`;
      } else if (status === 200) {
        result = '✅ Function exists and works';
      } else {
        result = `🔍 Status ${status}: ${parsed.error || 'Unknown'}`;
      }
    } catch (e) {
      result = `🔍 Status ${status}: ${statusText}`;
    }
    
    console.log(`${functionName.padEnd(20)} → ${result}`);
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
    
  } catch (error) {
    console.log(`${functionName.padEnd(20)} → 💥 Request failed: ${error.message}`);
  }
}

async function discoverFunctions() {
  console.log('Testing common function names...\n');
  
  for (const func of functionsToTest) {
    await testFunction(func);
  }
  
  console.log('\n🎯 SUMMARY FOR BACKEND TEAM:');
  console.log('- Functions marked ❌ do not exist and need to be implemented');
  console.log('- Functions marked ⚠️ exist but need correct parameters');
  console.log('- Functions marked ✅ are working correctly');
  console.log('- For document signing, we need one of: sign, signDoc, addSign, createSign, or signPdf');
}

discoverFunctions();
