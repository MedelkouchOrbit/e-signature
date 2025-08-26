#!/usr/bin/env node

// Test different file upload approaches for OpenSign Parse Server

const OPENSIGN_BASE_URL = 'http://94.249.71.89:9000'
const OPENSIGN_APP_ID = 'opensign'
const SESSION_TOKEN = 'r:20fec308b4ae76427abe4377e4941561'

async function testFileUploadApproaches() {
  console.log('📤 Testing different file upload approaches...\n')
  
  // Create test file content
  const testContent = 'Test PDF content'
  const testBytes = new TextEncoder().encode(testContent)
  const base64Content = btoa(String.fromCharCode(...testBytes))
  
  // Approach 1: Standard Parse Server file upload with JSON
  console.log('1️⃣ Testing Parse Server standard file upload (JSON with base64)...')
  try {
    const response = await fetch(`${OPENSIGN_BASE_URL}/api/app/files/test.pdf`, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': OPENSIGN_APP_ID,
        'X-Parse-Session-Token': SESSION_TOKEN,
        'Content-Type': 'application/pdf',
      },
      body: testBytes,
    })
    
    console.log(`  Status: ${response.status}`)
    const responseText = await response.text()
    
    try {
      const data = JSON.parse(responseText)
      console.log(`  ✅ Standard upload response:`, JSON.stringify(data, null, 2))
    } catch {
      console.log(`  Response: ${responseText.substring(0, 100)}`)
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`)
  }
  
  // Approach 2: JSON with base64 to file_upload endpoint
  console.log('\n2️⃣ Testing JSON with base64 to file_upload endpoint...')
  try {
    const response = await fetch(`${OPENSIGN_BASE_URL}/api/app/file_upload`, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': OPENSIGN_APP_ID,
        'X-Parse-Session-Token': SESSION_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: 'test.pdf',
        content: base64Content,
        contentType: 'application/pdf'
      }),
    })
    
    console.log(`  Status: ${response.status}`)
    const responseText = await response.text()
    
    try {
      const data = JSON.parse(responseText)
      console.log(`  ✅ JSON base64 response:`, JSON.stringify(data, null, 2))
    } catch {
      console.log(`  Response: ${responseText.substring(0, 100)}`)
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`)
  }
  
  // Approach 3: Test what the working Next.js proxy is doing
  console.log('\n3️⃣ Testing through local Next.js proxy...')
  try {
    const testFile = new Blob([testBytes], { type: 'application/pdf' })
    const formData = new FormData()
    formData.append('file', testFile, 'test.pdf')
    
    const response = await fetch('http://localhost:3001/api/proxy/opensign/file_upload', {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': OPENSIGN_APP_ID,
        'X-Parse-Session-Token': SESSION_TOKEN,
      },
      body: formData,
    })
    
    console.log(`  Status: ${response.status}`)
    const responseText = await response.text()
    
    try {
      const data = JSON.parse(responseText)
      console.log(`  ✅ Next.js proxy response:`, JSON.stringify(data, null, 2))
    } catch {
      console.log(`  Response: ${responseText.substring(0, 200)}`)
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`)
  }
  
  // Approach 4: Check Parse Server classes endpoint for file operations
  console.log('\n4️⃣ Testing Parse Server classes endpoint...')
  try {
    const response = await fetch(`${OPENSIGN_BASE_URL}/api/app/classes/_File`, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': OPENSIGN_APP_ID,
        'X-Parse-Session-Token': SESSION_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'test.pdf',
        __type: 'File',
        url: `data:application/pdf;base64,${base64Content}`
      }),
    })
    
    console.log(`  Status: ${response.status}`)
    const responseText = await response.text()
    
    try {
      const data = JSON.parse(responseText)
      console.log(`  ✅ Classes endpoint response:`, JSON.stringify(data, null, 2))
    } catch {
      console.log(`  Response: ${responseText.substring(0, 100)}`)
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`)
  }
}

async function main() {
  console.log('🚀 OpenSign File Upload Investigation\n')
  await testFileUploadApproaches()
  
  console.log('\n💡 This will help us understand:')
  console.log('1. How Parse Server expects file uploads')
  console.log('2. Whether our Next.js proxy is working differently')
  console.log('3. What format the OpenSign backend actually uses')
}

main().catch(console.error)
