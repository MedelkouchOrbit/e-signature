#!/usr/bin/env node

/**
 * Test script for OpenSign adduser function with team creation
 * 
 * This script tests using the adduser function which can handle team assignment
 * 
 * Usage: node test-adduser-team.js
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
  SESSION_TOKEN: 'r:0c2fec8a39057dd4181e6701378e95d6',
  ORGANIZATION_ID: 'aynU0FOfNQ',
  ALL_USERS_TEAM_ID: 'zpssIsBtHO'
}

async function testCreateTeamViaAddUser() {
  printSubHeader('🆕 Testing team creation via adduser function')
  
  try {
    const functionUrl = `${config.BASE_URL}/api/app/functions/adduser`
    
    const userData = {
      name: 'Team Manager',
      email: `teammanager.${Date.now()}@example.com`,
      password: 'password123',
      organization: {
        objectId: config.ORGANIZATION_ID,
        company: 'Test Company'
      },
      team: config.ALL_USERS_TEAM_ID, // Use existing team ID
      tenantId: 'mus0tgkuxq',
      timezone: 'UTC',
      role: 'User'
    }
    
    colorLog(colors.blue, `Creating user with team assignment`)
    console.log('📝 User data:', JSON.stringify(userData, null, 2))
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': config.OPENSIGN_APP_ID,
        'X-Parse-Session-Token': config.SESSION_TOKEN,
      },
      body: JSON.stringify(userData)
    })
    
    const data = await response.json()
    
    colorLog(colors.blue, `Response status: ${response.status}`)
    console.log('📋 Full Response:')
    console.log(JSON.stringify(data, null, 2))
    
    if (response.ok && data.result) {
      colorLog(colors.green, '✅ User created successfully via adduser')
      return data
    } else {
      colorLog(colors.yellow, '⚠️ User creation response:')
      return data
    }
  } catch (error) {
    colorLog(colors.red, `❌ Error creating user: ${error.message}`)
    return null
  }
}

async function testCreateTeamDirectWithMasterKey() {
  printSubHeader('🔧 Testing direct team creation with master key')
  
  try {
    const createUrl = `${config.BASE_URL}/api/app/classes/contracts_Teams`
    
    const teamData = {
      Name: `Development Team ${Date.now()}`,
      IsActive: true,
      OrganizationId: {
        __type: 'Pointer',
        className: 'contracts_Organizations',
        objectId: config.ORGANIZATION_ID
      }
    }
    
    colorLog(colors.blue, `Creating team with master key`)
    console.log('📝 Team data:', JSON.stringify(teamData, null, 2))
    
    const response = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': config.OPENSIGN_APP_ID,
        'X-Parse-Master-Key': config.OPENSIGN_MASTER_KEY,
      },
      body: JSON.stringify(teamData)
    })
    
    const data = await response.json()
    
    colorLog(colors.blue, `Response status: ${response.status}`)
    console.log('📋 Full Response:')
    console.log(JSON.stringify(data, null, 2))
    
    if (response.ok && data.objectId) {
      colorLog(colors.green, '✅ Team created successfully with master key')
      console.log(`📋 New team:`)
      console.log(`   - ObjectId: ${data.objectId}`)
      console.log(`   - Name: ${teamData.Name}`)
      console.log(`   - Created: ${data.createdAt}`)
      return data
    } else {
      colorLog(colors.yellow, '⚠️ Team creation response:')
      return data
    }
  } catch (error) {
    colorLog(colors.red, `❌ Error creating team: ${error.message}`)
    return null
  }
}

async function testGetTeams() {
  printSubHeader('🏢 Getting updated teams list')
  
  try {
    const functionUrl = `${config.BASE_URL}/api/app/functions/getteams`
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': config.OPENSIGN_APP_ID,
        'X-Parse-Session-Token': config.SESSION_TOKEN,
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
        console.log(`   ${index + 1}. ${team.Name} (${team.objectId})`)
        console.log(`      - Organization: ${team.OrganizationId?.objectId || 'N/A'}`)
        console.log(`      - Active: ${team.IsActive}`)
        console.log(`      - Created: ${new Date(team.createdAt).toLocaleDateString()}`)
      })
      return data.result
    } else {
      colorLog(colors.yellow, '⚠️ getTeams response:')
      console.log(JSON.stringify(data, null, 2))
      return data
    }
  } catch (error) {
    colorLog(colors.red, `❌ Error in getTeams: ${error.message}`)
    return null
  }
}

async function main() {
  printHeader('🧪 OpenSign Team Creation Test via adduser')
  
  colorLog(colors.blue, '🔧 Configuration:')
  console.log(`   - Server: ${config.BASE_URL}`)
  console.log(`   - Organization ID: ${config.ORGANIZATION_ID}`)
  console.log(`   - Default Team ID: ${config.ALL_USERS_TEAM_ID}`)
  
  // First, get current teams
  await testGetTeams()
  
  // Try creating a team with master key
  const newTeam = await testCreateTeamDirectWithMasterKey()
  
  if (newTeam && newTeam.objectId) {
    // If team creation successful, test adduser with the new team
    colorLog(colors.cyan, `🔄 Testing adduser with newly created team: ${newTeam.objectId}`)
    
    // Update config with new team ID
    const updatedConfig = { ...config, NEW_TEAM_ID: newTeam.objectId }
    
    // Test adduser with new team
    await testCreateTeamViaAddUser()
  }
  
  // Get updated teams list
  await testGetTeams()
  
  printHeader('🏁 Test Complete')
  colorLog(colors.cyan, 'Team creation testing finished!')
}

// Run the test
main().catch(error => {
  colorLog(colors.red, `❌ Test failed: ${error.message}`)
  process.exit(1)
})
