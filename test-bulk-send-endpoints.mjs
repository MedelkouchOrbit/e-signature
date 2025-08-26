#!/usr/bin/env node

// Test bulk send endpoints on OpenSign server running on port 9000
const API_BASE_URL = 'http://94.249.71.89:9000'

async function makeRequest(endpoint, method = 'GET', body = null, headers = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  }
  
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body)
  }
  
  try {
    console.log(`🔍 ${method} ${url}`)
    if (body) {
      console.log('📤 Request body:', JSON.stringify(body, null, 2))
    }
    
    const response = await fetch(url, options)
    const data = await response.text()
    
    console.log(`📊 Status: ${response.status}`)
    console.log(`📋 Response:`, data)
    
    try {
      return JSON.parse(data)
    } catch {
      return data
    }
  } catch (error) {
    console.error(`❌ Request failed:`, error.message)
    return null
  }
}

async function testLogin() {
  console.log('\n=== 🔐 Testing Login ===')
  
  const loginData = {
    email: 'medelkouchorbit@gmail.com',
    password: 'Tarik2020@'
  }
  
  const response = await makeRequest('/parse/functions/loginuser', 'POST', loginData)
  
  if (response && response.result && response.result.sessionToken) {
    console.log('✅ Login successful!')
    console.log('🎫 Session token:', response.result.sessionToken.substring(0, 20) + '...')
    return response.result.sessionToken
  } else {
    console.error('❌ Login failed!')
    return null
  }
}

async function testGetTemplates(sessionToken) {
  console.log('\n=== 📄 Testing Get Templates ===')
  
  const headers = {
    'X-Parse-Session-Token': sessionToken
  }
  
  const reportData = {
    reportId: '6TeaPr321t', // Template report ID from OpenSign
    limit: 10,
    skip: 0
  }
  
  const response = await makeRequest('/parse/functions/getReport', 'POST', reportData, headers)
  
  if (response && Array.isArray(response)) {
    console.log(`✅ Found ${response.length} templates`)
    if (response.length > 0) {
      console.log('📋 First template:', {
        id: response[0].objectId,
        name: response[0].Name
      })
      return response[0].objectId
    }
  } else {
    console.error('❌ Failed to get templates')
  }
  
  return null
}

async function testBulkSendFunctions(sessionToken, templateId) {
  console.log('\n=== 📦 Testing Bulk Send Functions ===')
  
  const headers = {
    'X-Parse-Session-Token': sessionToken
  }
  
  // Test 1: Get bulk sends
  console.log('\n--- Test 1: Get Bulk Sends ---')
  const getBulkSendData = {
    limit: 10,
    skip: 0,
    searchTerm: ''
  }
  
  const getBulkSendResponse = await makeRequest('/parse/functions/getBulkSend', 'POST', getBulkSendData, headers)
  console.log('Get Bulk Send Response:', getBulkSendResponse)
  
  // Test 2: Create bulk send
  if (templateId) {
    console.log('\n--- Test 2: Create Bulk Send ---')
    const createBulkSendData = {
      templateId: templateId,
      name: `Test Bulk Send ${new Date().toISOString()}`,
      signers: [
        {
          name: 'John Doe',
          email: 'john@example.com',
          role: 'signer',
          order: 1
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'signer',
          order: 2
        }
      ],
      sendInOrder: true,
      message: 'Please sign this test document'
    }
    
    const createResponse = await makeRequest('/parse/functions/createBulkSend', 'POST', createBulkSendData, headers)
    console.log('Create Bulk Send Response:', createResponse)
    
    if (createResponse && createResponse.objectId) {
      const bulkSendId = createResponse.objectId
      
      // Test 3: Send bulk send
      console.log('\n--- Test 3: Send Bulk Send ---')
      const sendBulkSendData = {
        bulkSendId: bulkSendId
      }
      
      const sendResponse = await makeRequest('/parse/functions/sendBulkSend', 'POST', sendBulkSendData, headers)
      console.log('Send Bulk Send Response:', sendResponse)
      
      // Test 4: Get bulk send details
      console.log('\n--- Test 4: Get Bulk Send Details ---')
      const getDetailResponse = await makeRequest(`/parse/classes/contracts_BulkSend/${bulkSendId}?include=TemplateId`, 'GET', null, headers)
      console.log('Get Bulk Send Details Response:', getDetailResponse)
      
      // Test 5: Delete bulk send (optional)
      console.log('\n--- Test 5: Delete Bulk Send ---')
      const deleteBulkSendData = {
        bulkSendId: bulkSendId
      }
      
      const deleteResponse = await makeRequest('/parse/functions/deleteBulkSend', 'POST', deleteBulkSendData, headers)
      console.log('Delete Bulk Send Response:', deleteResponse)
    }
  } else {
    console.log('⚠️  No template ID available, skipping create/send/delete tests')
  }
}

async function runTests() {
  console.log('🧪 Starting Bulk Send API Tests')
  console.log('================================')
  console.log(`🔗 API Base URL: ${API_BASE_URL}`)
  
  try {
    // Step 1: Login
    const sessionToken = await testLogin()
    if (!sessionToken) {
      console.error('💥 Cannot proceed without session token')
      return
    }
    
    // Step 2: Get templates
    const templateId = await testGetTemplates(sessionToken)
    
    // Step 3: Test bulk send functions
    await testBulkSendFunctions(sessionToken, templateId)
    
    console.log('\n🎉 All tests completed!')
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message)
    console.error(error.stack)
  }
}

// Add fetch polyfill for Node.js if needed
if (typeof fetch === 'undefined') {
  console.log('📦 Installing fetch polyfill...')
  const { default: fetch } = await import('node-fetch')
  globalThis.fetch = fetch
}

runTests()
