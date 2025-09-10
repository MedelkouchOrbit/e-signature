#!/usr/bin/env node

/**
 * Backend Diagnostic Script
 * Run this on your OpenSign server to check Parse Server configuration
 */

const http = require('http');
const https = require('https');

const SERVER_URL = 'http://94.249.71.89:9000';
const PARSE_PATHS = ['/1', '/api/1', '/parse/1', '/app', '/parse', '/api', ''];

console.log('🔍 OpenSign Parse Server Diagnostic Tool');
console.log('='.repeat(50));

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testEndpoint(path, description) {
  const url = `${SERVER_URL}${path}`;
  console.log(`\n🧪 Testing: ${description}`);
  console.log(`📍 URL: ${url}`);
  
  try {
    const response = await makeRequest(url);
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Content-Type: ${response.headers['content-type'] || 'unknown'}`);
    
    const isHtml = response.body.includes('<!DOCTYPE html>') || response.body.includes('<html');
    const isJson = response.headers['content-type']?.includes('application/json');
    
    if (isHtml) {
      console.log('❌ PROBLEM: Returns HTML frontend (not API)');
      return false;
    } else if (isJson || response.body.includes('{')) {
      console.log('✅ SUCCESS: Returns JSON API response');
      return true;
    } else {
      console.log('⚠️  WARNING: Unknown response format');
      console.log('📄 Response preview:', response.body.substring(0, 100));
      return false;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  }
}

async function runDiagnostics() {
  console.log(`🎯 Checking server: ${SERVER_URL}`);
  
  // Test frontend access
  console.log('\n' + '='.repeat(30));
  console.log('📱 FRONTEND ACCESS TEST');
  await testEndpoint('/', 'Frontend Homepage');
  
  // Test Parse Server API paths
  console.log('\n' + '='.repeat(30));
  console.log('🔌 PARSE SERVER API TESTS');
  
  let foundWorkingAPI = false;
  
  for (const path of PARSE_PATHS) {
    const loginPath = `${path}/login`;
    const classPath = `${path}/classes/contracts_Document`;
    
    console.log(`\n📂 Testing mount path: "${path || 'root'}"`);
    
    // Test login endpoint
    const loginWorks = await testEndpoint(loginPath, `Login API`);
    
    // Test classes endpoint  
    const classWorks = await testEndpoint(classPath, `Classes API`);
    
    if (loginWorks || classWorks) {
      foundWorkingAPI = true;
      console.log(`🎉 FOUND WORKING API at path: "${path}"`);
    }
  }
  
  // Summary and recommendations
  console.log('\n' + '='.repeat(50));
  console.log('📋 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(50));
  
  if (foundWorkingAPI) {
    console.log('✅ Parse Server API is accessible');
    console.log('🎯 Frontend team can proceed with testing');
  } else {
    console.log('❌ CRITICAL ISSUE: Parse Server API not accessible');
    console.log('🔧 REQUIRED FIXES:');
    console.log('   1. Mount Parse Server on API path (usually /1)');
    console.log('   2. Ensure Parse Server is initialized and running');
    console.log('   3. Check that API routes are mounted BEFORE static files');
    console.log('');
    console.log('📝 Example server.js fix:');
    console.log('   const api = new ParseServer({...});');
    console.log('   app.use("/1", api);  // ← ADD THIS LINE');
    console.log('   app.use("/", express.static("public"));');
    console.log('');
    console.log('🧪 Test after fix:');
    console.log(`   curl ${SERVER_URL}/1/login`);
    console.log('   (should return JSON, not HTML)');
  }
  
  console.log('\n🔗 Frontend test page: http://localhost:3000/api-test.html');
  console.log('📞 Contact frontend team when fixed for verification');
}

// Run diagnostics
runDiagnostics().catch(console.error);
