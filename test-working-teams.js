#!/usr/bin/env node

/**
 * Test existing teams and create a working solution
 * 
 * Usage: node test-working-teams.js
 */

// ANSI color codes
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

// Configuration using local proxy (server seems down)
const config = {
  PROXY_URL: 'http://localhost:3000',
  OPENSIGN_APP_ID: 'opensign',
  SESSION_TOKEN: 'r:284e81c6f127ef7f1fb44a237c79f276', // From your curl request
  ORGANIZATION_ID: 'aynU0FOfNQ'
}

async function testProxyGetTeams() {
  printSubHeader('📋 Testing Get Teams via Proxy')
  
  try {
    const response = await fetch(`${config.PROXY_URL}/api/proxy/opensign/functions/getteams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': config.OPENSIGN_APP_ID,
        'X-Parse-Session-Token': config.SESSION_TOKEN,
        'Cookie': `opensign_session_token=${config.SESSION_TOKEN}`
      },
      body: JSON.stringify({ active: true })
    })
    
    const result = await response.json()
    
    if (response.ok && result.result) {
      colorLog(colors.green, '✅ Teams retrieved successfully!')
      console.log('Number of teams:', result.result.length)
      
      result.result.forEach((team, index) => {
        console.log(`\nTeam ${index + 1}:`)
        console.log('  ID:', team.objectId)
        console.log('  Name:', team.Name)
        console.log('  Active:', team.IsActive)
        console.log('  Created:', new Date(team.createdAt).toLocaleDateString())
      })
      
      return result.result
    } else {
      colorLog(colors.red, '❌ Failed to get teams!')
      console.log('Response:', result)
      return []
    }
  } catch (error) {
    colorLog(colors.red, '❌ Request failed:')
    console.error(error.message)
    return []
  }
}

async function testProxyGetUserDetails() {
  printSubHeader('👤 Testing Get User Details via Proxy')
  
  try {
    const response = await fetch(`${config.PROXY_URL}/api/proxy/opensign/functions/getUserDetails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': config.OPENSIGN_APP_ID,
        'X-Parse-Session-Token': config.SESSION_TOKEN,
        'Cookie': `opensign_session_token=${config.SESSION_TOKEN}`
      },
      body: JSON.stringify({})
    })
    
    const result = await response.json()
    
    if (response.ok && result.result) {
      colorLog(colors.green, '✅ User details retrieved!')
      console.log('User Name:', result.result.name)
      console.log('User Email:', result.result.email)
      console.log('User Role:', result.result.UserRole || 'Not specified')
      console.log('Organization ID:', result.result.OrganizationId?.objectId)
      console.log('Tenant ID:', result.result.TenantId?.objectId)
      console.log('Company:', result.result.Company)
      
      const isAdmin = result.result.UserRole?.includes('Admin')
      console.log('Is Admin:', isAdmin)
      
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

async function testProxyGetUserList() {
  printSubHeader('👥 Testing Get User List via Proxy')
  
  try {
    const response = await fetch(`${config.PROXY_URL}/api/proxy/opensign/functions/getuserlistbyorg`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': config.OPENSIGN_APP_ID,
        'X-Parse-Session-Token': config.SESSION_TOKEN,
        'Cookie': `opensign_session_token=${config.SESSION_TOKEN}`
      },
      body: JSON.stringify({ organizationId: config.ORGANIZATION_ID })
    })
    
    const result = await response.json()
    
    if (response.ok && result.result) {
      colorLog(colors.green, '✅ User list retrieved!')
      console.log('Number of users:', result.result.length)
      
      result.result.forEach((user, index) => {
        console.log(`\nUser ${index + 1}:`)
        console.log('  ID:', user.objectId)
        console.log('  Name:', user.Name)
        console.log('  Email:', user.Email)
        console.log('  Role:', user.UserRole || 'Not specified')
        console.log('  Company:', user.Company)
        if (user.TeamIds && user.TeamIds.length > 0) {
          console.log('  Teams:', user.TeamIds.map(t => t.objectId).join(', '))
        }
      })
      
      return result.result
    } else {
      colorLog(colors.red, '❌ Failed to get user list!')
      console.log('Response:', result)
      return []
    }
  } catch (error) {
    colorLog(colors.red, '❌ Request failed:')
    console.error(error.message)
    return []
  }
}

async function testAddUserToExistingTeam(teamId, userDetails) {
  printSubHeader('➕ Testing Add User to Existing Team via Proxy')
  
  if (!teamId) {
    colorLog(colors.yellow, '⚠️ No team ID provided, skipping test')
    return
  }
  
  const userData = {
    name: "Test User via Proxy",
    email: "testproxy@example.com",
    password: "SecurePass123!",
    organization: {
      objectId: config.ORGANIZATION_ID,
      company: userDetails.Company || "Test Company"
    },
    team: teamId,
    tenantId: userDetails.TenantId?.objectId,
    role: "User",
    timezone: "UTC"
  }
  
  try {
    const response = await fetch(`${config.PROXY_URL}/api/proxy/opensign/functions/adduser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': config.OPENSIGN_APP_ID,
        'X-Parse-Session-Token': config.SESSION_TOKEN,
        'Cookie': `opensign_session_token=${config.SESSION_TOKEN}`
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
  printHeader('🔧 Working Teams Solution Test')
  
  // Test 1: Get user details to understand current context
  const userDetails = await testProxyGetUserDetails()
  
  // Test 2: Get existing teams
  const teams = await testProxyGetTeams()
  
  // Test 3: Get user list
  const users = await testProxyGetUserList()
  
  // Test 4: If we have teams, try adding a user to the first team
  if (teams.length > 0 && userDetails) {
    const firstTeam = teams[0]
    console.log(`\n${colors.cyan}Testing with first team: ${firstTeam.Name} (${firstTeam.objectId})${colors.reset}`)
    await testAddUserToExistingTeam(firstTeam.objectId, userDetails)
  }
  
  // Summary and recommendations
  printSubHeader('📋 Working Solution Summary')
  
  if (userDetails?.UserRole?.includes('Admin')) {
    colorLog(colors.green, '✅ Current user has admin role')
    colorLog(colors.cyan, '💡 Solution: Create teams using master key on backend')
  } else {
    colorLog(colors.yellow, '⚠️ Current user is not admin')
    colorLog(colors.cyan, '💡 Solution: Only allow adding members to existing teams')
  }
  
  if (teams.length > 0) {
    colorLog(colors.green, `✅ Found ${teams.length} existing teams to work with`)
    colorLog(colors.cyan, '💡 Users can be added to existing teams using adduser function')
  } else {
    colorLog(colors.red, '❌ No existing teams found')
    colorLog(colors.cyan, '💡 Admin needs to create teams first')
  }
  
  colorLog(colors.blue, '\n🔧 Implementation Recommendations:')
  console.log('1. Hide "Create Team" button for non-admin users')
  console.log('2. Focus on "Add Members" functionality using adduser function')
  console.log('3. Show list of existing teams and allow member addition')
  console.log('4. Use proxy endpoints for all API calls')
}

main().catch(console.error)
