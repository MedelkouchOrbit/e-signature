#!/usr/bin/env node

// Test script with corrected API path from server logs

const OPENSIGN_BASE_URL = 'http://94.249.71.89:9000'
const OPENSIGN_APP_ID = 'opensign'
const SESSION_TOKEN = 'r:20fec308b4ae76427abe4377e4941561'

async function testCorrectPath() {
  console.log('🔍 Testing with correct API path from server logs...\n')
  
  // From the logs, the working path appears to be the root with 'api/app/' prefix
  const testPaths = [
    'api/app/functions/filterdocs',
    'functions/filterdocs',
    'api/functions/filterdocs'
  ]
  
  for (const path of testPaths) {
    const targetUrl = `${OPENSIGN_BASE_URL}/${path}`
    console.log(`Testing: ${targetUrl}`)
    
    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'X-Parse-Application-Id': OPENSIGN_APP_ID,
          'Content-Type': 'application/json',
          'X-Parse-Session-Token': SESSION_TOKEN,
        },
        body: JSON.stringify({
          searchTerm: '',
          limit: 10,
          skip: 0,
        }),
      })
      
      const responseText = await response.text()
      console.log(`  Status: ${response.status}`)
      console.log(`  Content-Type: ${response.headers.get('content-type')}`)
      
      if (responseText.includes('<!DOCTYPE html>')) {
        console.log(`  ❌ Got HTML response`)
        continue
      }
      
      try {
        const data = JSON.parse(responseText)
        console.log(`  ✅ JSON response:`, JSON.stringify(data, null, 2))
        return path
      } catch {
        console.log(`  ❌ Invalid JSON: ${responseText.substring(0, 100)}`)
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`)
    }
  }
  
  return null
}

async function testFileUploadCorrect() {
  console.log('\n📤 Testing file upload with correct path...\n')
  
  const uploadPaths = [
    'api/app/file_upload',
    'file_upload',
    'api/file_upload'
  ]
  
  const testContent = new Uint8Array([0x25, 0x50, 0x44, 0x46]) // PDF start
  const testFile = new Blob([testContent], { type: 'application/pdf' })
  
  for (const path of uploadPaths) {
    const targetUrl = `${OPENSIGN_BASE_URL}/${path}`
    console.log(`Testing upload: ${targetUrl}`)
    
    try {
      const formData = new FormData()
      formData.append('file', testFile, 'test.pdf')
      
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'X-Parse-Application-Id': OPENSIGN_APP_ID,
          'X-Parse-Session-Token': SESSION_TOKEN,
        },
        body: formData,
        signal: AbortSignal.timeout(10000),
      })
      
      console.log(`  Status: ${response.status}`)
      
      const responseText = await response.text()
      
      if (responseText.includes('<!DOCTYPE html>')) {
        console.log(`  ❌ Got HTML response`)
        continue
      }
      
      try {
        const data = JSON.parse(responseText)
        console.log(`  ✅ Upload response:`, JSON.stringify(data, null, 2))
        return { path, data }
      } catch {
        console.log(`  ❌ Non-JSON: ${responseText.substring(0, 100)}`)
      }
      
    } catch (error) {
      console.log(`  ❌ Upload error: ${error.message}`)
    }
  }
  
  return null
}

async function main() {
  console.log('🚀 OpenSign API Test - Corrected Paths\n')
  
  const workingPath = await testCorrectPath()
  const uploadResult = await testFileUploadCorrect()
  
  if (!workingPath && !uploadResult) {
    console.log('\n❌ All tests failed - this suggests the Parse Server may not be properly accessible')
    console.log('\n💡 Possible issues:')
    console.log('1. Parse Server is not running or not mounted correctly')
    console.log('2. Network/firewall blocking direct connections')
    console.log('3. Server configured to only accept requests through specific proxy/routing')
    console.log('4. Authentication or session issues')
    
    console.log('\n🔍 Yet your Next.js proxy was working... Let me check the difference.')
  }
}

main().catch(console.error)
