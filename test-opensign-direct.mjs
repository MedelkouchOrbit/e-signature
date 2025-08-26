#!/usr/bin/env node

// Test script mimicking the Next.js proxy behavior exactly

const OPENSIGN_BASE_URL = 'http://94.249.71.89:9000'
const OPENSIGN_APP_ID = 'opensign'
const SESSION_TOKEN = 'r:20fec308b4ae76427abe4377e4941561'

const POSSIBLE_MOUNT_PATHS = ['/1', '/api/1', '/parse/1', '/app', '/parse', '/api', '']

async function testFilterDocs() {
  console.log('🔍 Testing filterdocs (mimicking Next.js proxy)...\n')
  
  for (const mountPath of POSSIBLE_MOUNT_PATHS) {
    const targetUrl = `${OPENSIGN_BASE_URL}${mountPath}/functions/filterdocs`
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
      
      // Check if we got HTML (frontend) response
      if (responseText.includes('<!DOCTYPE html>')) {
        console.log(`  ❌ Got HTML response from ${mountPath}`)
        continue
      }
      
      // Try to parse as JSON
      try {
        const data = JSON.parse(responseText)
        
        // If it's a Parse Server error response (but still valid JSON)
        if (data.code && data.error) {
          console.log(`  ✅ Found Parse Server API at ${mountPath} (auth error)`)
          console.log(`  Error: ${data.error}`)
          return mountPath
        }
        
        // If it's successful JSON response
        if (response.ok) {
          console.log(`  ✅ Success with mount path: ${mountPath}`)
          console.log(`  Response:`, JSON.stringify(data, null, 2))
          return mountPath
        }
        
      } catch {
        console.log(`  ❌ Invalid JSON response from ${mountPath}`)
      }
      
    } catch (error) {
      console.log(`  ❌ Failed with mount path ${mountPath}: ${error.message}`)
      continue
    }
  }
  
  return null
}

async function testFileUploadDirect() {
  console.log('\n📤 Testing file upload endpoints directly...\n')
  
  // Create test file data
  const testContent = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]) // PDF header
  const testFile = new Blob([testContent], { type: 'application/pdf' })
  
  for (const mountPath of POSSIBLE_MOUNT_PATHS) {
    const targetUrl = `${OPENSIGN_BASE_URL}${mountPath}/file_upload`
    console.log(`Testing upload: ${targetUrl}`)
    
    try {
      const formData = new FormData()
      formData.append('file', testFile, 'test.pdf')
      
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'X-Parse-Application-Id': OPENSIGN_APP_ID,
          'X-Parse-Session-Token': SESSION_TOKEN,
          // Note: No Content-Type header for FormData
        },
        body: formData,
        signal: AbortSignal.timeout(15000), // 15 second timeout
      })
      
      console.log(`  Status: ${response.status}`)
      console.log(`  Content-Type: ${response.headers.get('content-type')}`)
      
      const responseText = await response.text()
      
      if (responseText.includes('<!DOCTYPE html>')) {
        console.log(`  ❌ Got HTML response from ${mountPath}`)
        continue
      }
      
      try {
        const data = JSON.parse(responseText)
        console.log(`  ✅ JSON response from ${mountPath}:`, JSON.stringify(data, null, 2))
        
        if (data.status === 'Success' || data.imageUrl) {
          console.log(`  🎉 File upload successful!`)
          return { mountPath, data }
        }
        
      } catch {
        console.log(`  ❌ Non-JSON response: ${responseText.substring(0, 100)}...`)
      }
      
    } catch (error) {
      console.log(`  ❌ Upload failed: ${error.message}`)
      
      if (error.name === 'AbortError') {
        console.log(`  ⏰ Request timed out`)
      } else if (error.cause?.code === 'UND_ERR_SOCKET') {
        console.log(`  🔌 Socket connection issue - server may be closing connections`)
      }
    }
  }
  
  return null
}

async function main() {
  console.log('🚀 Direct OpenSign API Test\n')
  
  const workingMountPath = await testFilterDocs()
  
  if (workingMountPath) {
    console.log(`\n✅ Found working API mount path: ${workingMountPath}`)
  } else {
    console.log(`\n❌ No working API endpoints found`)
  }
  
  const uploadResult = await testFileUploadDirect()
  
  if (uploadResult) {
    console.log(`\n🎉 File upload works at: ${uploadResult.mountPath}`)
  } else {
    console.log(`\n❌ File upload failed on all endpoints`)
    console.log(`\n💡 This suggests the Parse Server may have issues with:`)
    console.log(`  - File upload configuration`)
    console.log(`  - Connection timeouts for larger requests`)
    console.log(`  - Authentication for file operations`)
    console.log(`  - Server resource limits`)
  }
}

main().catch(console.error)
