#!/usr/bin/env node

/**
 * Test script for OpenSign team creation and permissions
 * 
 * This script tests team creation permissions and explores alternatives
 * 
 * Usage: node test-team-creation.js
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
  ORGANIZATION_ID: 'aynU0FOfNQ',
  PROXY_URL: 'http://localhost:3000'
}

async function testDirectTeamCreation() {
  printSubHeader('🏢 Testing Direct Team Creation via REST API')
  
  const requestData = {
    "Name": "Test Team Backend",
    "IsActive": true,
    "OrganizationId": {
      "__type": "Pointer",
      "className": "contracts_Organizations",
      "objectId": config.ORGANIZATION_ID
    }
  }
  
  try {
    const response = await fetch(`${config.BASE_URL}/classes/contracts_Teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': config.OPENSIGN_APP_ID,
        'X-Parse-Session-Token': config.SESSION_TOKEN
      },
      body: JSON.stringify(requestData)
    })
    
    const result = await response.json()
    
    if (response.ok) {
      colorLog(colors.green, '✅ Direct team creation successful!')
      console.log('Team ID:', result.objectId)
      return result.objectId
    } else {
      colorLog(colors.red, '❌ Direct team creation failed!')
      console.log('Error Code:', result.code)
      console.log('Error Message:', result.error)
      return null
    }
  } catch (error) {
    colorLog(colors.red, '❌ Request failed:')
    console.error(error.message)
    return null
  }
}

async function testProxyTeamCreation() {
  printSubHeader('🔄 Testing Team Creation via Proxy')
  
  const requestData = {
    "Name": "Test Team Proxy",
    "IsActive": true,
    "OrganizationId": {
      "__type": "Pointer",
      "className": "contracts_Organizations",
      "objectId": config.ORGANIZATION_ID
    }
  }
  
  try {
    const response = await fetch(`${config.PROXY_URL}/api/proxy/opensign/classes/contracts_Teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': config.OPENSIGN_APP_ID,
        'X-Parse-Session-Token': config.SESSION_TOKEN,
        'Cookie': `opensign_session_token=${config.SESSION_TOKEN}`
      },
      body: JSON.stringify(requestData)
    })
    
    const result = await response.json()
    
    if (response.ok) {
      colorLog(colors.green, '✅ Proxy team creation successful!')
      console.log('Team ID:', result.objectId)
      return result.objectId
    } else {
      colorLog(colors.red, '❌ Proxy team creation failed!')
      console.log('Error Code:', result.code)
      console.log('Error Message:', result.error)
      return null
    }
  } catch (error) {
    colorLog(colors.red, '❌ Request failed:')
    console.error(error.message)
    return null
  }
}

async function testGetCurrentUserRole() {
  printSubHeader('👤 Testing Current User Role and Permissions')
  
  try {
    // Test getUserDetails function
    const response = await fetch(`${config.BASE_URL}/functions/getUserDetails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': config.OPENSIGN_APP_ID,
        'X-Parse-Session-Token': config.SESSION_TOKEN
      },
      body: JSON.stringify({})
    })
    
    const result = await response.json()
    
    if (response.ok && result.result) {
      colorLog(colors.green, '✅ User details retrieved!')
      console.log('User Name:', result.result.name)
      console.log('User Email:', result.result.email)
      console.log('User Role:', result.result.UserRole || 'Not specified')
      console.log('Organization ID:', result.result.OrganizationId)
      console.log('Is Admin?', result.result.UserRole?.includes('Admin') || false)
      return result.result
    } else {
      colorLog(colors.red, '❌ Failed to get user details!')
      console.log('Response:', result)
      return null
    }
  } catch (error) {
    colorLog(colors.red, '❌ Request failed:')
    console.error(error.message)
    return null
  }
}

async function testAddUserToTeam(teamId) {
  printSubHeader('➕ Testing Add User to Team via adduser function')
  
  if (!teamId) {
    colorLog(colors.yellow, '⚠️ No team ID provided, skipping adduser test')
    return
  }
  
  const userData = {
    name: "Test User Backend",
    email: "testuser@backend.com",
    password: "password123",
    organization: {
      objectId: config.ORGANIZATION_ID,
      company: "Test Company"
    },
    team: teamId,
    tenantId: "Q7xsDCPJle", // You might need to get this from getUserDetails
    role: "User",
    timezone: "UTC"
  }
  
  try {
    const response = await fetch(`${config.BASE_URL}/functions/adduser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': config.OPENSIGN_APP_ID,
        'X-Parse-Session-Token': config.SESSION_TOKEN
      },
      body: JSON.stringify(userData)
    })
    
    const result = await response.json()
    
    if (response.ok && result.result) {
      colorLog(colors.green, '✅ User added to team successfully!')
      console.log('New User ID:', result.result.user?.objectId)
      console.log('New User Email:', result.result.user?.email)
      return result.result
    } else {
      colorLog(colors.red, '❌ Failed to add user to team!')
      console.log('Error:', result.error || result)
      return null
    }
  } catch (error) {
    colorLog(colors.red, '❌ Request failed:')
    console.error(error.message)
    return null
  }
}

async function main() {
  printHeader('🧪 OpenSign Team Creation & Permissions Test')
  
  // Test 1: Get current user role and permissions
  const userDetails = await testGetCurrentUserRole()
  
  // Test 2: Try direct team creation
  let teamId = await testDirectTeamCreation()
  
  // Test 3: Try proxy team creation if direct failed
  if (!teamId) {
    teamId = await testProxyTeamCreation()
  }
  
  // Test 4: If we have a team, try adding a user to it
  if (teamId) {
    await testAddUserToTeam(teamId)
  }
  
  // Summary
  printSubHeader('📋 Summary and Recommendations')
  
  if (userDetails?.UserRole?.includes('Admin')) {
    colorLog(colors.green, '✅ Current user has admin role - team creation should work')
  } else {
    colorLog(colors.yellow, '⚠️ Current user is not admin - team creation restricted')
    colorLog(colors.cyan, '💡 Recommendation: Use adduser function to add members to existing teams')
    colorLog(colors.cyan, '💡 Alternative: Request admin to create teams, then add members')
  }
  
  if (teamId) {
    colorLog(colors.green, '✅ Team creation successful - full workflow available')
  } else {
    colorLog(colors.red, '❌ Team creation failed - implement member-only workflow')
  }
}

main().catch(console.error)
