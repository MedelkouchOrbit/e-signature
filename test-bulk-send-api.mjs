#!/usr/bin/env node

// Test script for bulk send API endpoints
import { openSignApiService } from '../app/lib/api-service.js'

const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com'
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpass123'

console.log('🧪 Testing Bulk Send API Endpoints')
console.log('=======================================')

async function login() {
  console.log('\n📋 Step 1: Login to get session token...')
  try {
    const response = await openSignApiService.post('functions/loginuser', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })
    
    console.log('✅ Login successful')
    console.log('Response structure:', JSON.stringify(response, null, 2))
    return response
  } catch (error) {
    console.error('❌ Login failed:', error.message)
    throw error
  }
}

async function testGetBulkSends() {
  console.log('\n📋 Step 2: Test getBulkSend function...')
  try {
    const response = await openSignApiService.post('functions/getBulkSend', {
      limit: 10,
      skip: 0,
      searchTerm: ''
    })
    
    console.log('✅ getBulkSend successful')
    console.log('Response:', JSON.stringify(response, null, 2))
    return response
  } catch (error) {
    console.error('❌ getBulkSend failed:', error.message)
    if (error.response) {
      console.error('Response data:', error.response.data)
      console.error('Response status:', error.response.status)
    }
    return { results: [], count: 0 }
  }
}

async function testGetTemplates() {
  console.log('\n📋 Step 3: Get available templates...')
  try {
    const response = await openSignApiService.post('functions/getReport', {
      reportId: '6TeaPr321t', // Template report ID
      limit: 10,
      skip: 0
    })
    
    console.log('✅ getTemplates successful')
    console.log('Templates found:', response?.length || 0)
    
    if (response && response.length > 0) {
      console.log('First template:', JSON.stringify(response[0], null, 2))
      return response[0]
    }
    
    return null
  } catch (error) {
    console.error('❌ getTemplates failed:', error.message)
    return null
  }
}

async function testCreateBulkSend(templateId) {
  console.log('\n📋 Step 4: Test createBulkSend function...')
  
  if (!templateId) {
    console.log('⚠️  No template available, skipping create test')
    return null
  }
  
  try {
    const bulkSendData = {
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
    
    const response = await openSignApiService.post('functions/createBulkSend', bulkSendData)
    
    console.log('✅ createBulkSend successful')
    console.log('Response:', JSON.stringify(response, null, 2))
    return response
  } catch (error) {
    console.error('❌ createBulkSend failed:', error.message)
    if (error.response) {
      console.error('Response data:', error.response.data)
      console.error('Response status:', error.response.status)
    }
    return null
  }
}

async function testSendBulkSend(bulkSendId) {
  console.log('\n📋 Step 5: Test sendBulkSend function...')
  
  if (!bulkSendId) {
    console.log('⚠️  No bulk send ID available, skipping send test')
    return
  }
  
  try {
    const response = await openSignApiService.post('functions/sendBulkSend', {
      bulkSendId: bulkSendId
    })
    
    console.log('✅ sendBulkSend successful')
    console.log('Response:', JSON.stringify(response, null, 2))
  } catch (error) {
    console.error('❌ sendBulkSend failed:', error.message)
    if (error.response) {
      console.error('Response data:', error.response.data)
      console.error('Response status:', error.response.status)
    }
  }
}

async function testDeleteBulkSend(bulkSendId) {
  console.log('\n📋 Step 6: Test deleteBulkSend function...')
  
  if (!bulkSendId) {
    console.log('⚠️  No bulk send ID available, skipping delete test')
    return
  }
  
  try {
    const response = await openSignApiService.post('functions/deleteBulkSend', {
      bulkSendId: bulkSendId
    })
    
    console.log('✅ deleteBulkSend successful')
    console.log('Response:', JSON.stringify(response, null, 2))
  } catch (error) {
    console.error('❌ deleteBulkSend failed:', error.message)
    if (error.response) {
      console.error('Response data:', error.response.data)
      console.error('Response status:', error.response.status)
    }
  }
}

async function runTests() {
  try {
    // Step 1: Login
    await login()
    
    // Step 2: Test getBulkSends
    await testGetBulkSends()
    
    // Step 3: Get templates
    const template = await testGetTemplates()
    
    // Step 4: Create bulk send
    const bulkSend = await testCreateBulkSend(template?.objectId)
    
    // Step 5: Send bulk send
    await testSendBulkSend(bulkSend?.objectId)
    
    // Step 6: Delete bulk send (optional - comment out to keep test data)
    await testDeleteBulkSend(bulkSend?.objectId)
    
    console.log('\n🎉 All tests completed!')
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message)
    process.exit(1)
  }
}

// Run the tests
runTests()
