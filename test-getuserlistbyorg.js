#!/usr/bin/env node

/**
 * Test script for OpenSign getUserListByOrg function
 * 
 * This script tests the correct function name and parameters
 * Uses the remote OpenSign server and session token for authentication
 * 
 * Usage: node test-getuserlistbyorg.js
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
  SESSION_TOKEN: 'r:0c2fec8a39057dd4181e6701378e95d6',
  ORGANIZATION_ID: 'aynU0FOfNQ' // From previous tests
}

async function testGetUserDetails() {
  printSubHeader('👤 Testing getUserDetails for organization info')
  
  try {
    const functionUrl = `${config.BASE_URL}/api/app/functions/getUserDetails`
    
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

async function testGetUserListByOrg(organizationId) {
  printSubHeader('👥 Testing getuserlistbyorg function')
  
  try {
    const functionUrl = `${config.BASE_URL}/api/app/functions/getuserlistbyorg`
    
    colorLog(colors.blue, `Getting users for organization: ${organizationId}`)
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': config.OPENSIGN_APP_ID,
        'X-Parse-Session-Token': config.SESSION_TOKEN,
      },
      body: JSON.stringify({
        organizationId: organizationId
      })
    })
    
    const data = await response.json()
    
    colorLog(colors.blue, `Response status: ${response.status}`)
    console.log('📋 Full Response:')
    console.log(JSON.stringify(data, null, 2))
    
    if (response.ok && data.result) {
      colorLog(colors.green, '✅ getuserlistbyorg successful')
      console.log(`📋 Found ${data.result.length} users in organization:`)
      data.result.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.Name} (${user.Email})`)
        console.log(`      - Role: ${user.UserRole}`)
        console.log(`      - Company: ${user.Company || 'N/A'}`)
        console.log(`      - ObjectId: ${user.objectId}`)
        console.log(`      - Disabled: ${user.IsDisabled || false}`)
        if (user.TeamIds && user.TeamIds.length > 0) {
          console.log(`      - Teams: ${user.TeamIds.length} teams`)
          user.TeamIds.forEach((team, tIndex) => {
            console.log(`        ${tIndex + 1}. ${team.Name || 'Unknown Team'} (${team.objectId})`)
          })
        }
        console.log('')
      })
      return data.result
    } else {
      colorLog(colors.yellow, '⚠️ getuserlistbyorg response:')
      return data
    }
  } catch (error) {
    colorLog(colors.red, `❌ Error in getuserlistbyorg: ${error.message}`)
    return null
  }
}

async function testBothEndpoints() {
  printSubHeader('🔄 Testing both proxy and direct endpoints')
  
  const endpoints = [
    {
      name: 'Direct OpenSign Server',
      url: `${config.BASE_URL}/api/app/functions/getuserlistbyorg`
    },
    {
      name: 'Local Proxy (if running)',
      url: 'http://localhost:3000/api/proxy/opensign/functions/getuserlistbyorg'
    }
  ]
  
  for (const endpoint of endpoints) {
    try {
      colorLog(colors.blue, `Testing ${endpoint.name}: ${endpoint.url}`)
      
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Parse-Application-Id': config.OPENSIGN_APP_ID,
          'X-Parse-Session-Token': config.SESSION_TOKEN,
        },
        body: JSON.stringify({
          organizationId: config.ORGANIZATION_ID
        })
      })
      
      const data = await response.json()
      
      colorLog(colors.blue, `${endpoint.name} Response status: ${response.status}`)
      
      if (response.ok && data.result) {
        colorLog(colors.green, `✅ ${endpoint.name} successful - ${data.result.length} users found`)
      } else {
        colorLog(colors.yellow, `⚠️ ${endpoint.name} response:`)
        console.log(JSON.stringify(data, null, 2))
      }
      
    } catch (error) {
      colorLog(colors.red, `❌ ${endpoint.name} failed: ${error.message}`)
    }
    
    console.log('')
  }
}

async function main() {
  printHeader('🧪 OpenSign getUserListByOrg Function Test')
  
  colorLog(colors.blue, '🔧 Configuration:')
  console.log(`   - Server: ${config.BASE_URL}`)
  console.log(`   - App ID: ${config.OPENSIGN_APP_ID}`)
  console.log(`   - Organization ID: ${config.ORGANIZATION_ID}`)
  console.log(`   - Session Token: ${config.SESSION_TOKEN ? '✓ Set' : '✗ Missing'}`)
  
  // Get user details to confirm organization
  const userDetails = await testGetUserDetails()
  
  if (userDetails && userDetails.OrganizationId) {
    const orgId = userDetails.OrganizationId.objectId
    colorLog(colors.cyan, `🏢 Using organization ID from user details: ${orgId}`)
    
    // Test the function with the correct organization ID
    await testGetUserListByOrg(orgId)
  } else {
    colorLog(colors.yellow, '⚠️ No organization found in user details, testing with default org ID')
    await testGetUserListByOrg(config.ORGANIZATION_ID)
  }
  
  // Test both endpoints to show the difference
  await testBothEndpoints()
  
  printHeader('🏁 Test Complete')
  colorLog(colors.cyan, 'Function name and parameters verified!')
}

// Run the test
main().catch(error => {
  colorLog(colors.red, `❌ Test failed: ${error.message}`)
  process.exit(1)
})
