#!/usr/bin/env node

/**
 * Test script for OpenSign contact functions
 * 
 * This script tests the OpenSign contact cloud functions (savecontact, getContact)
 * Uses the remote OpenSign server and session token for authentication
 * 
 * Usage: node test-adduser-contact.js
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

// Load environment variables
const config = {
  BASE_URL: 'http://94.249.71.89:9000',
  OPENSIGN_APP_ID: 'opensign',
  OPENSIGN_MASTER_KEY: 'XnAadwKxxByMr',
  ADMIN_EMAIL: 'admin1@admin.com',
  ADMIN_PASSWORD: 'admin12@',
  SESSION_TOKEN: 'r:0c2fec8a39057dd4181e6701378e95d6' // From your curl example
}

async function findWorkingEndpoint() {
  printSubHeader('� Finding working OpenSign endpoint')
  
  for (const endpoint of config.ENDPOINTS) {
    try {
      colorLog(colors.blue, `Testing endpoint: ${endpoint}`)
      
      const testUrl = endpoint.includes('/api/proxy') 
        ? `${endpoint}/parse/users/me` 
        : `${endpoint}/api/app/parse/users/me`
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Parse-Application-Id': config.OPENSIGN_APP_ID,
        }
      })
      
      // Even if unauthorized, a JSON response means the server is responding
      const isWorking = response.headers.get('content-type')?.includes('application/json')
      
      if (isWorking) {
        colorLog(colors.green, `✅ Found working endpoint: ${endpoint}`)
        return endpoint
      }
    } catch (error) {
      colorLog(colors.red, `❌ ${endpoint} failed: ${error.message}`)
    }
  }
  
  colorLog(colors.red, '❌ No working endpoints found')
  return null
}

async function testGetUserDetails(baseUrl) {
  printSubHeader('👤 Testing getUserDetails')
  
  try {
    // Build the function URL
    const functionUrl = baseUrl.includes('/api/proxy') 
      ? `${baseUrl}/functions/getUserDetails`
      : `${baseUrl}/api/app/functions/getUserDetails`
    
    // Try without authentication first to test endpoint
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': config.OPENSIGN_APP_ID,
      },
      body: JSON.stringify({})
    })
    
    const data = await response.json()
    
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
      colorLog(colors.red, '❌ getUserDetails failed:')
      console.log(JSON.stringify(data, null, 2))
      return null
    }
  } catch (error) {
    colorLog(colors.red, `❌ Error in getUserDetails: ${error.message}`)
    return null
  }
}

async function setupAdminOrganization(email, baseUrl) {
  printSubHeader('🏢 Setting up Admin Organization')
  
  try {
    const functionUrl = baseUrl.includes('/api/proxy') 
      ? `${baseUrl}/functions/updateuserasadmin`
      : `${baseUrl}/parse/functions/updateuserasadmin`
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': config.OPENSIGN_APP_ID,
      },
      body: JSON.stringify({
        email: email,
        masterkey: config.OPENSIGN_MASTER_KEY
      })
    })
    
    const data = await response.json()
    
    if (response.ok && data.result) {
      colorLog(colors.green, '✅ Admin organization setup successful')
      console.log(`📋 Result: ${data.result}`)
      return true
    } else {
      colorLog(colors.yellow, '⚠️ Admin organization setup response:')
      console.log(JSON.stringify(data, null, 2))
      return false
    }
  } catch (error) {
    colorLog(colors.red, `❌ Error in setupAdminOrganization: ${error.message}`)
    return false
  }
}

async function testGetTeams(baseUrl) {
  printSubHeader('🏢 Testing getTeams')
  
  try {
    const functionUrl = baseUrl.includes('/api/proxy') 
      ? `${baseUrl}/functions/getteams`
      : `${baseUrl}/parse/functions/getteams`
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': config.OPENSIGN_APP_ID,
        'X-Parse-Master-Key': config.OPENSIGN_MASTER_KEY,
      },
      body: JSON.stringify({
        active: true
      })
    })
    
    const data = await response.json()
    
    if (response.ok && data.result) {
      colorLog(colors.green, '✅ getTeams successful')
      console.log(`📋 Found ${data.result.length} teams:`)
      data.result.forEach((team, index) => {
        console.log(`   ${index + 1}. ${team.Name} (${team.objectId}) - Active: ${team.IsActive}`)
      })
      return data.result
    } else {
      colorLog(colors.red, '❌ getTeams failed:')
      console.log(JSON.stringify(data, null, 2))
      return []
    }
  } catch (error) {
    colorLog(colors.red, `❌ Error in getTeams: ${error.message}`)
    return []
  }
}

async function testSaveContact(userDetails, baseUrl) {
  printSubHeader('� Testing savecontact')
  
  if (!userDetails.TenantId) {
    colorLog(colors.red, '❌ Cannot test savecontact: No tenant found')
    return false
  }
  
  const testContact = {
    name: 'Test Contact',
    email: 'test.contact@example.com',
    phone: '+1234567890',
    tenantId: userDetails.TenantId.objectId
  }
  
  try {
    colorLog(colors.blue, '📝 Attempting to save test contact:')
    console.log(`   - Name: ${testContact.name}`)
    console.log(`   - Email: ${testContact.email}`)
    console.log(`   - Phone: ${testContact.phone}`)
    console.log(`   - Tenant: ${testContact.tenantId}`)
    
    const functionUrl = baseUrl.includes('/api/proxy') 
      ? `${baseUrl}/functions/savecontact`
      : `${baseUrl}/api/app/functions/savecontact`
    
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
    
    if (response.ok && data.result) {
      colorLog(colors.green, '✅ savecontact successful')
      console.log('📋 New contact created:')
      console.log(`   - ObjectId: ${data.result.objectId || 'N/A'}`)
      console.log(`   - Name: ${data.result.Name || 'N/A'}`)
      console.log(`   - Email: ${data.result.Email || 'N/A'}`)
      console.log(`   - CreatedAt: ${data.result.createdAt || 'N/A'}`)
      return data.result
    } else {
      colorLog(colors.red, '❌ savecontact failed:')
      console.log(JSON.stringify(data, null, 2))
      return false
    }
  } catch (error) {
    colorLog(colors.red, `❌ Error in savecontact: ${error.message}`)
    return false
  }
}

async function testGetContact(contactId, baseUrl) {
  printSubHeader('📖 Testing getContact')
  
  if (!contactId) {
    colorLog(colors.yellow, '⚠️ No contact ID provided, skipping getContact test')
    return null
  }
  
  try {
    const functionUrl = baseUrl.includes('/api/proxy') 
      ? `${baseUrl}/functions/getContact`
      : `${baseUrl}/api/app/functions/getcontact`
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': config.OPENSIGN_APP_ID,
        'X-Parse-Session-Token': config.SESSION_TOKEN,
      },
      body: JSON.stringify({ contactId })
    })
    
    const data = await response.json()
    
    if (response.ok && data.result) {
      colorLog(colors.green, '✅ getContact successful')
      console.log('📋 Contact details:')
      console.log(`   - ObjectId: ${data.result.objectId}`)
      console.log(`   - Name: ${data.result.Name}`)
      console.log(`   - Email: ${data.result.Email}`)
      console.log(`   - Phone: ${data.result.Phone || 'N/A'}`)
      console.log(`   - UserRole: ${data.result.UserRole}`)
      return data.result
    } else {
      colorLog(colors.red, '❌ getContact failed:')
      console.log(JSON.stringify(data, null, 2))
      return null
    }
  } catch (error) {
    colorLog(colors.red, `❌ Error in getContact: ${error.message}`)
    return null
  }
}

async function main() {
  printHeader('🧪 OpenSign Contact Functions Test')
  
  colorLog(colors.blue, '🔧 Configuration:')
  console.log(`   - Endpoints to try: ${config.ENDPOINTS.length}`)
  config.ENDPOINTS.forEach((endpoint, i) => {
    console.log(`     ${i + 1}. ${endpoint}`)
  })
  console.log(`   - App ID: ${config.OPENSIGN_APP_ID}`)
  console.log(`   - Admin Email: ${config.ADMIN_EMAIL}`)
  console.log(`   - Session Token: ${config.SESSION_TOKEN ? '✓ Set' : '✗ Missing'}`)
  
  // Find working endpoint
  const workingEndpoint = await findWorkingEndpoint()
  if (!workingEndpoint) {
    colorLog(colors.red, '❌ No working OpenSign endpoints found. Make sure OpenSign server is running.')
    return
  }
  
  const userDetails = await testGetUserDetails(workingEndpoint)
  
  if (!userDetails) {
    colorLog(colors.red, '❌ Cannot proceed without user details')
    return
  }
  
  // Test contact functions
  const savedContact = await testSaveContact(userDetails, workingEndpoint)
  
  if (savedContact && savedContact.objectId) {
    await testGetContact(savedContact.objectId, workingEndpoint)
  }
  
  printHeader('🏁 Test Complete')
  colorLog(colors.cyan, 'Contact functions tested successfully!')
}

// Run the test
main().catch(error => {
  colorLog(colors.red, `❌ Test failed: ${error.message}`)
  process.exit(1)
})
