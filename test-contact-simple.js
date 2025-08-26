#!/usr/bin/env node

/**
 * Simple test script for OpenSign contact functions
 * 
 * This script tests the OpenSign contact cloud functions (savecontact, getcontact)
 * Uses the remote OpenSign server directly
 * 
 * Usage: node test-contact-simple.js
 */

// ANSI color codes for better output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function colorLog(color, message) {
  console.log(`${color}${message}${colors.reset}`)
}

function printHeader(title) {
  console.log(`\n${colors.bold}${colors.cyan}${'='.repeat(60)}`)
  console.log(`${title}`)
  console.log(`${'='.repeat(60)}${colors.reset}\n`)
}

function printSubHeader(title) {
  console.log(`\n${colors.bold}${colors.blue}${'-'.repeat(40)}`)
  console.log(`${title}`)
  console.log(`${'-'.repeat(40)}${colors.reset}`)
}

// Configuration
const config = {
  BASE_URL: 'http://94.249.71.89:9000',
  OPENSIGN_APP_ID: 'opensign',
  OPENSIGN_MASTER_KEY: 'XnAadwKxxByMr',
  ADMIN_EMAIL: 'admin1@admin.com',
  ADMIN_PASSWORD: 'Meticx12@',
  SESSION_TOKEN: 'r:284e81c6f127ef7f1fb44a237c79f276'
}

async function testGetContact(contactId = 'zBl42KU3yy') {
  printSubHeader('📖 Testing getcontact function')
  
  try {
    const functionUrl = `${config.BASE_URL}/api/app/functions/getcontact`
    
    colorLog(colors.blue, `Testing URL: ${functionUrl}`)
    colorLog(colors.blue, `Contact ID: ${contactId}`)
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': config.OPENSIGN_APP_ID,
      },
      body: JSON.stringify({ contactId })
    })
    
    const data = await response.json()
    
    colorLog(colors.blue, `Response status: ${response.status}`)
    console.log('📋 Full Response:')
    console.log(JSON.stringify(data, null, 2))
    
    if (response.ok && data.result) {
      colorLog(colors.green, '✅ getcontact successful')
      return data.result
    } else {
      colorLog(colors.yellow, '⚠️ getcontact response (might need authentication):')
      return data
    }
  } catch (error) {
    colorLog(colors.red, `❌ Error in getcontact: ${error.message}`)
    return null
  }
}

async function testSaveContact(userDetails) {
  printSubHeader('📇 Testing savecontact function')
  
  const testContact = {
    name: 'Test Contact ' + Date.now(),
    email: `test.contact.${Date.now()}@example.com`,
    phone: '+1234567890',
    tenantId: userDetails?.TenantId?.objectId || 'no-tenant-id'
  }
  
  try {
    const functionUrl = `${config.BASE_URL}/api/app/functions/savecontact`
    
    colorLog(colors.blue, `Testing URL: ${functionUrl}`)
    colorLog(colors.blue, 'Using session token for authentication...')
    colorLog(colors.blue, '📝 Attempting to save contact:')
    console.log(`   - Name: ${testContact.name}`)
    console.log(`   - Email: ${testContact.email}`)
    console.log(`   - Phone: ${testContact.phone}`)
    console.log(`   - Tenant ID: ${testContact.tenantId}`)
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': config.OPENSIGN_APP_ID,
        'X-Parse-Session-Token': config.SESSION_TOKEN,
      },
      body: JSON.stringify(testContact)
    })
    
    const data = await response.json()
    
    colorLog(colors.blue, `Response status: ${response.status}`)
    console.log('📋 Full Response:')
    console.log(JSON.stringify(data, null, 2))
    
    if (response.ok && data.result) {
      colorLog(colors.green, '✅ savecontact successful')
      console.log('📋 New contact created:')
      console.log(`   - ObjectId: ${data.result.objectId || 'N/A'}`)
      console.log(`   - Name: ${data.result.Name || 'N/A'}`)
      console.log(`   - Email: ${data.result.Email || 'N/A'}`)
      return data.result
    } else {
      colorLog(colors.yellow, '⚠️ savecontact response:')
      return data
    }
  } catch (error) {
    colorLog(colors.red, `❌ Error in savecontact: ${error.message}`)
    return null
  }
}

async function testGetUserDetails() {
  printSubHeader('👤 Testing getUserDetails function')
  
  try {
    const functionUrl = `${config.BASE_URL}/api/app/functions/getUserDetails`
    
    colorLog(colors.blue, `Testing URL: ${functionUrl}`)
    colorLog(colors.blue, 'Using session token for authentication...')
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': config.OPENSIGN_APP_ID,
        'X-Parse-Session-Token': config.SESSION_TOKEN,
      },
      body: JSON.stringify({})
    })
    
    const data = await response.json()
    
    colorLog(colors.blue, `Response status: ${response.status}`)
    console.log('📋 Full Response:')
    console.log(JSON.stringify(data, null, 2))
    
    if (response.ok && data.result) {
      colorLog(colors.green, '✅ getUserDetails successful')
      console.log('📋 User Details:')
      console.log(`   - Name: ${data.result.Name}`)
      console.log(`   - Email: ${data.result.Email}`)
      console.log(`   - Role: ${data.result.UserRole}`)
      console.log(`   - Organization: ${data.result.OrganizationId ? data.result.OrganizationId.objectId : 'None'}`)
      console.log(`   - Tenant: ${data.result.TenantId ? data.result.TenantId.objectId : 'None'}`)
      return data.result
    } else {
      colorLog(colors.yellow, '⚠️ getUserDetails failed:')
      return data
    }
  } catch (error) {
    colorLog(colors.red, `❌ Error in getUserDetails: ${error.message}`)
    return null
  }
}

async function main() {
  printHeader('🧪 OpenSign Contact Functions Test - Simple Version')
  
  colorLog(colors.blue, '🔧 Configuration:')
  console.log(`   - Server: ${config.BASE_URL}`)
  console.log(`   - App ID: ${config.OPENSIGN_APP_ID}`)
  console.log(`   - Master Key: ${config.OPENSIGN_MASTER_KEY ? '✓ Set' : '✗ Missing'}`)
  
  // Test basic endpoint connectivity
  colorLog(colors.cyan, '\n🔗 Testing server connectivity...')
  try {
    const healthCheck = await fetch(`${config.BASE_URL}/health`, { method: 'GET' })
    colorLog(colors.blue, `Health check status: ${healthCheck.status}`)
  } catch (error) {
    colorLog(colors.yellow, `Health check failed: ${error.message}`)
  }
  
  // Test cloud functions
  const userDetails = await testGetUserDetails()
  await testGetContact()
  
  if (userDetails) {
    const savedContact = await testSaveContact(userDetails)
    
    if (savedContact && savedContact.objectId) {
      colorLog(colors.cyan, `\n🔄 Testing getcontact with newly created contact ID: ${savedContact.objectId}`)
      await testGetContact(savedContact.objectId)
    }
  } else {
    await testSaveContact(null)
  }
  
  printHeader('🏁 Test Complete')
  colorLog(colors.cyan, 'Check the responses above to understand the API behavior!')
}

// Run the test
main().catch(error => {
  colorLog(colors.red, `❌ Test failed: ${error.message}`)
  process.exit(1)
})
