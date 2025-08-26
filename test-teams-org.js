#!/usr/bin/env node

/**
 * Test script for OpenSign team/organization functions
 * 
 * This script tests creating teams and understanding the organization structure
 * Uses the remote OpenSign server and session token for authentication
 * 
 * Usage: node test-teams-org.js
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
  SESSION_TOKEN: 'r:0c2fec8a39057dd4181e6701378e95d6'
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
      
      if (data.result.OrganizationId) {
        console.log(`   - Organization Name: ${data.result.OrganizationId.Name}`)
      }
      
      if (data.result.TeamIds && data.result.TeamIds.length > 0) {
        console.log(`   - Teams: ${data.result.TeamIds.length} teams`)
        data.result.TeamIds.forEach((team, index) => {
          console.log(`     ${index + 1}. ${team.Name} (${team.objectId})`)
        })
      }
      
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

async function testGetTeams() {
  printSubHeader('🏢 Testing getTeams function')
  
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
    
    colorLog(colors.blue, `Response status: ${response.status}`)
    console.log('📋 Full Response:')
    console.log(JSON.stringify(data, null, 2))
    
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
      return data
    }
  } catch (error) {
    colorLog(colors.red, `❌ Error in getTeams: ${error.message}`)
    return null
  }
}

async function testCreateTeamDirect(organizationId, teamName) {
  printSubHeader('🆕 Testing direct team creation via Parse API')
  
  try {
    // Try to create a team directly using Parse REST API
    const createUrl = `${config.BASE_URL}/api/app/classes/contracts_Teams`
    
    const teamData = {
      Name: teamName,
      IsActive: true,
      OrganizationId: {
        __type: 'Pointer',
        className: 'contracts_Organizations',
        objectId: organizationId
      }
    }
    
    colorLog(colors.blue, `Creating team: ${teamName}`)
    console.log('📝 Team data:', JSON.stringify(teamData, null, 2))
    
    const response = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': config.OPENSIGN_APP_ID,
        'X-Parse-Session-Token': config.SESSION_TOKEN,
      },
      body: JSON.stringify(teamData)
    })
    
    const data = await response.json()
    
    colorLog(colors.blue, `Response status: ${response.status}`)
    console.log('📋 Full Response:')
    console.log(JSON.stringify(data, null, 2))
    
    if (response.ok && data.objectId) {
      colorLog(colors.green, '✅ Team created successfully')
      console.log(`📋 New team:`)
      console.log(`   - ObjectId: ${data.objectId}`)
      console.log(`   - Name: ${teamName}`)
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

async function testUpdateUserAsAdmin() {
  printSubHeader('🔧 Testing updateuserasadmin to create organization')
  
  try {
    const functionUrl = `${config.BASE_URL}/api/app/functions/updateuserasadmin`
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': config.OPENSIGN_APP_ID,
      },
      body: JSON.stringify({
        email: config.ADMIN_EMAIL,
        masterkey: config.OPENSIGN_MASTER_KEY
      })
    })
    
    const data = await response.json()
    
    colorLog(colors.blue, `Response status: ${response.status}`)
    console.log('📋 Full Response:')
    console.log(JSON.stringify(data, null, 2))
    
    if (response.ok) {
      colorLog(colors.green, '✅ updateuserasadmin successful')
      return data
    } else {
      colorLog(colors.yellow, '⚠️ updateuserasadmin response:')
      return data
    }
  } catch (error) {
    colorLog(colors.red, `❌ Error in updateuserasadmin: ${error.message}`)
    return null
  }
}

async function main() {
  printHeader('🧪 OpenSign Teams & Organization Test')
  
  colorLog(colors.blue, '🔧 Configuration:')
  console.log(`   - Server: ${config.BASE_URL}`)
  console.log(`   - App ID: ${config.OPENSIGN_APP_ID}`)
  console.log(`   - Admin Email: ${config.ADMIN_EMAIL}`)
  console.log(`   - Session Token: ${config.SESSION_TOKEN ? '✓ Set' : '✗ Missing'}`)
  
  // Get user details first
  const userDetails = await testGetUserDetails()
  
  if (!userDetails) {
    colorLog(colors.red, '❌ Cannot proceed without user details')
    return
  }
  
  // If no organization, try to create one
  if (!userDetails.OrganizationId) {
    colorLog(colors.yellow, '⚠️ No organization found, attempting to create...')
    await testUpdateUserAsAdmin()
    
    // Re-fetch user details
    colorLog(colors.blue, '🔄 Re-fetching user details after organization setup...')
    const updatedUserDetails = await testGetUserDetails()
    
    if (updatedUserDetails?.OrganizationId) {
      colorLog(colors.green, '✅ Organization created successfully!')
      userDetails.OrganizationId = updatedUserDetails.OrganizationId
    }
  }
  
  // Get existing teams
  const teams = await testGetTeams()
  
  // Try to create a new team if we have an organization
  if (userDetails.OrganizationId) {
    const newTeamName = `Development Team ${Date.now()}`
    await testCreateTeamDirect(userDetails.OrganizationId.objectId, newTeamName)
    
    // Re-fetch teams to see the new one
    colorLog(colors.blue, '🔄 Re-fetching teams after creation...')
    await testGetTeams()
  } else {
    colorLog(colors.yellow, '⚠️ Cannot create team without organization')
  }
  
  printHeader('🏁 Test Complete')
  colorLog(colors.cyan, 'Teams and organization structure tested!')
}

// Run the test
main().catch(error => {
  colorLog(colors.red, `❌ Test failed: ${error.message}`)
  process.exit(1)
})
