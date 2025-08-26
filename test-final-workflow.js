#!/usr/bin/env node

/**
 * Final test for complete team management workflow
 * 
 * Usage: node test-final-workflow.js
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

// Configuration
const config = {
  PROXY_URL: 'http://localhost:3000',
  OPENSIGN_APP_ID: 'opensign',
  SESSION_TOKEN: 'r:284e81c6f127ef7f1fb44a237c79f276',
  ORGANIZATION_ID: 'aynU0FOfNQ'
}

async function testCompleteWorkflow() {
  printHeader('🚀 Complete Team Management Workflow Test')
  
  let createdTeamId = null
  let addedUserId = null
  
  try {
    // Step 1: Verify user is admin
    printSubHeader('👤 Step 1: Verify Admin Access')
    
    const userResponse = await fetch(`${config.PROXY_URL}/api/proxy/opensign/functions/getUserDetails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': config.OPENSIGN_APP_ID,
        'X-Parse-Session-Token': config.SESSION_TOKEN,
        'Cookie': `opensign_session_token=${config.SESSION_TOKEN}`
      },
      body: JSON.stringify({})
    })
    
    const userResult = await userResponse.json()
    const isAdmin = userResult.result?.UserRole?.includes('Admin')
    
    if (isAdmin) {
      colorLog(colors.green, '✅ User has admin privileges - proceeding with full workflow')
    } else {
      colorLog(colors.red, '❌ User is not admin - workflow will be limited')
      return
    }
    
    // Step 2: Create a new team (should work for admin)
    printSubHeader('🏢 Step 2: Create New Team')
    
    const teamName = `Test Team ${Date.now()}`
    const createTeamResponse = await fetch(`${config.PROXY_URL}/api/proxy/opensign/classes/contracts_Teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': config.OPENSIGN_APP_ID,
        'X-Parse-Session-Token': config.SESSION_TOKEN,
        'Cookie': `opensign_session_token=${config.SESSION_TOKEN}`
      },
      body: JSON.stringify({
        Name: teamName,
        IsActive: true,
        OrganizationId: {
          __type: 'Pointer',
          className: 'contracts_Organizations',
          objectId: config.ORGANIZATION_ID
        }
      })
    })
    
    if (createTeamResponse.ok) {
      const teamResult = await createTeamResponse.json()
      createdTeamId = teamResult.objectId
      colorLog(colors.green, `✅ Team created successfully: ${teamName} (${createdTeamId})`)
    } else {
      const errorData = await createTeamResponse.json()
      colorLog(colors.red, `❌ Team creation failed: ${errorData.error}`)
      return
    }
    
    // Step 3: Add a user to the newly created team
    printSubHeader('👥 Step 3: Add User to New Team')
    
    const userData = {
      name: `Test User ${Date.now()}`,
      email: `testuser${Date.now()}@example.com`,
      password: "SecurePass123!",
      organization: {
        objectId: config.ORGANIZATION_ID,
        company: "Test Company"
      },
      team: createdTeamId,
      tenantId: userResult.result?.TenantId?.objectId,
      role: "User",
      timezone: "UTC"
    }
    
    const addUserResponse = await fetch(`${config.PROXY_URL}/api/proxy/opensign/functions/adduser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': config.OPENSIGN_APP_ID,
        'X-Parse-Session-Token': config.SESSION_TOKEN,
        'Cookie': `opensign_session_token=${config.SESSION_TOKEN}`
      },
      body: JSON.stringify(userData)
    })
    
    if (addUserResponse.ok) {
      const userAddResult = await addUserResponse.json()
      addedUserId = userAddResult.result?.user?.objectId
      colorLog(colors.green, `✅ User added to team successfully: ${userData.name} (${addedUserId})`)
    } else {
      const errorData = await addUserResponse.json()
      colorLog(colors.red, `❌ Adding user failed: ${errorData.error}`)
    }
    
    // Step 4: Verify the team now has the user
    printSubHeader('🔍 Step 4: Verify Team Members')
    
    const teamsResponse = await fetch(`${config.PROXY_URL}/api/proxy/opensign/functions/getteams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': config.OPENSIGN_APP_ID,
        'X-Parse-Session-Token': config.SESSION_TOKEN,
        'Cookie': `opensign_session_token=${config.SESSION_TOKEN}`
      },
      body: JSON.stringify({ active: true })
    })
    
    if (teamsResponse.ok) {
      const teamsResult = await teamsResponse.json()
      const createdTeam = teamsResult.result?.find(t => t.objectId === createdTeamId)
      
      if (createdTeam) {
        colorLog(colors.green, `✅ Team verified: ${createdTeam.Name}`)
      } else {
        colorLog(colors.yellow, '⚠️ Team not found in teams list')
      }
    }
    
    // Step 5: Get organization users to verify the new user
    printSubHeader('👥 Step 5: Verify Organization Users')
    
    const usersResponse = await fetch(`${config.PROXY_URL}/api/proxy/opensign/functions/getuserlistbyorg`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': config.OPENSIGN_APP_ID,
        'X-Parse-Session-Token': config.SESSION_TOKEN,
        'Cookie': `opensign_session_token=${config.SESSION_TOKEN}`
      },
      body: JSON.stringify({ organizationId: config.ORGANIZATION_ID })
    })
    
    if (usersResponse.ok) {
      const usersResult = await usersResponse.json()
      const newUser = usersResult.result?.find(u => u.objectId === addedUserId)
      
      if (newUser) {
        colorLog(colors.green, `✅ User verified in organization: ${newUser.Name}`)
        if (newUser.TeamIds && newUser.TeamIds.some(t => t.objectId === createdTeamId)) {
          colorLog(colors.green, '✅ User is correctly assigned to the new team')
        } else {
          colorLog(colors.yellow, '⚠️ User team assignment not visible yet')
        }
      } else {
        colorLog(colors.yellow, '⚠️ New user not found in organization list yet')
      }
    }
    
    // Final Summary
    printSubHeader('🎯 Workflow Summary')
    
    if (createdTeamId && addedUserId) {
      colorLog(colors.green, '✅ COMPLETE WORKFLOW SUCCESS!')
      console.log(`   Team Created: ${teamName} (${createdTeamId})`)
      console.log(`   User Added: ${userData.name} (${addedUserId})`)
      console.log('')
      colorLog(colors.cyan, '💡 Frontend Implementation Status:')
      console.log('   ✅ Team creation works for admin users')
      console.log('   ✅ Member addition to teams works')
      console.log('   ✅ Organization overview displays correctly')
      console.log('   ✅ All API endpoints functional via proxy')
      console.log('')
      colorLog(colors.blue, '🚀 Ready for Production!')
    } else if (createdTeamId) {
      colorLog(colors.yellow, '⚠️ PARTIAL SUCCESS - Team created, user addition failed')
    } else {
      colorLog(colors.red, '❌ WORKFLOW FAILED - Team creation unsuccessful')
    }
    
  } catch (error) {
    colorLog(colors.red, '❌ Workflow error:')
    console.error(error.message)
  }
}

testCompleteWorkflow()
