#!/usr/bin/env node

// Test script to verify OpenSign Parse Server connectivity and file upload

const OPENSIGN_BASE_URL = 'http://94.249.71.89:9000'
const OPENSIGN_APP_ID = 'opensign'

// Test session token from the logs
const SESSION_TOKEN = 'r:20fec308b4ae76427abe4377e4941561'

const POSSIBLE_MOUNT_PATHS = ['/1', '/api/1', '/parse/1', '/app', '/parse', '/api', '']

async function testConnection() {
  console.log('🔍 Testing OpenSign Parse Server connectivity...\n')
  
  // Test 1: Basic connectivity with functions/filterdocs
  console.log('📋 Test 1: Testing filterdocs endpoint...')
  
  for (const mountPath of POSSIBLE_MOUNT_PATHS) {
    const testUrl = `${OPENSIGN_BASE_URL}${mountPath}/functions/filterdocs`
    console.log(`  Testing: ${testUrl}`)
    
    try {
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Parse-Application-Id': OPENSIGN_APP_ID,
          'X-Parse-Session-Token': SESSION_TOKEN,
        },
        body: JSON.stringify({
          searchTerm: '',
          limit: 1,
          skip: 0,
        }),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })
      
      const responseText = await response.text()
      
      if (responseText.includes('<!DOCTYPE html>')) {
        console.log(`    ❌ Got HTML (frontend) response`)
        continue
      }
      
      try {
        const data = JSON.parse(responseText)
        if (response.ok || (data.code && data.error)) {
          console.log(`    ✅ Found valid Parse Server API at ${mountPath}`)
          console.log(`    Response status: ${response.status}`)
          console.log(`    Response data:`, JSON.stringify(data, null, 2))
          return mountPath
        }
      } catch {
        console.log(`    ❌ Invalid JSON response`)
      }
      
    } catch (error) {
      console.log(`    ❌ Error: ${error.message}`)
    }
  }
  
  console.log('  ❌ No working endpoints found for filterdocs\n')
  return null
}

async function testFileUpload(workingMountPath) {
  if (!workingMountPath) {
    console.log('📤 Test 2: Skipping file upload test (no working API endpoint)\n')
    return
  }
  
  console.log('📤 Test 2: Testing file upload endpoint...')
  
  // Create a simple test file
  const testFileContent = 'This is a test PDF file content for OpenSign upload test.'
  const testFile = new Blob([testFileContent], { type: 'application/pdf' })
  
  const formData = new FormData()
  formData.append('file', testFile, 'test-upload.pdf')
  
  const uploadUrl = `${OPENSIGN_BASE_URL}${workingMountPath}/file_upload`
  console.log(`  Testing upload to: ${uploadUrl}`)
  
  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': OPENSIGN_APP_ID,
        'X-Parse-Session-Token': SESSION_TOKEN,
        // Don't set Content-Type for FormData - let fetch set it with boundary
      },
      body: formData,
      signal: AbortSignal.timeout(30000), // 30 second timeout for upload
    })
    
    console.log(`  Response status: ${response.status}`)
    console.log(`  Response headers:`, Object.fromEntries(response.headers.entries()))
    
    const responseText = await response.text()
    
    try {
      const data = JSON.parse(responseText)
      console.log(`  ✅ Upload response:`, JSON.stringify(data, null, 2))
    } catch {
      console.log(`  Response text (not JSON):`, responseText.substring(0, 200))
    }
    
  } catch (error) {
    console.log(`  ❌ Upload failed: ${error.message}`)
    if (error.name === 'AbortError') {
      console.log(`  💡 This might be a timeout issue. Parse Server may be slow or overloaded.`)
    }
  }
  
  console.log('')
}

async function main() {
  console.log('🚀 OpenSign Parse Server Connection Test\n')
  console.log(`Base URL: ${OPENSIGN_BASE_URL}`)
  console.log(`App ID: ${OPENSIGN_APP_ID}`)
  console.log(`Session Token: ${SESSION_TOKEN}\n`)
  
  const workingMountPath = await testConnection()
  await testFileUpload(workingMountPath)
  
  console.log('🏁 Test completed')
  
  if (!workingMountPath) {
    console.log('\n💡 Recommendations:')
    console.log('1. Verify OpenSign Parse Server is running on the expected port')
    console.log('2. Check if the Parse Server is properly mounted (not just the frontend)')
    console.log('3. Verify network connectivity to 94.249.71.89:9000')
    console.log('4. Check Parse Server configuration and logs')
    process.exit(1)
  }
}

main().catch(console.error)
