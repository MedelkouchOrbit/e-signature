#!/usr/bin/env node

/**
 * Test script for Teams API endpoints
 * 
 * This script validates the OpenSign Teams API integration by testing:
 * 1. Authentication
 * 2. getTeams cloud function
 * 3. getUserListByOrg cloud function  
 * 4. adduser cloud function (if user confirms)
 * 5. getUserDetails cloud function
 * 
 * Usage: node test-teams-api.js
 */

import { teamsApiService } from './app/lib/templates-api-service.js'

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

// Helper function to print colored output
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

async function testUserDetails() {
  printSubHeader('🔍 Testing User Details Retrieval')
  
  try {
    const userDetails = await teamsApiService.getCurrentUserDetails()
    
    if (userDetails.organization && userDetails.tenantId) {
      colorLog(colors.green, '✅ User details retrieved successfully')
      console.log('📋 Details:')
      console.log(`   - Organization: ${userDetails.organization.company} (${userDetails.organization.objectId})`)
      console.log(`   - Tenant ID: ${userDetails.tenantId}`)
      console.log(`   - Role: ${userDetails.role || 'N/A'}`)
      return userDetails
    } else {
      colorLog(colors.yellow, '⚠️  User details incomplete')
      console.log('📋 Available details:', userDetails)
      return userDetails
    }
  } catch (error) {
    colorLog(colors.red, '❌ Failed to get user details')
    console.error(`   Error: ${error.message}`)
    return null
  }
}

async function testGetTeams() {
  printSubHeader('🏢 Testing Teams Retrieval')
  
  try {
    const teams = await teamsApiService.getTeams()
    
    if (teams && teams.length > 0) {
      colorLog(colors.green, `✅ Successfully retrieved ${teams.length} teams`)
      console.log('📋 Teams:')
      teams.forEach((team, index) => {
        console.log(`   ${index + 1}. ${team.Name} (${team.objectId}) - Active: ${team.IsActive}`)
      })
      return teams
    } else {
      colorLog(colors.yellow, '⚠️  No teams found')
      return []
    }
  } catch (error) {
    colorLog(colors.red, '❌ Failed to get teams')
    console.error(`   Error: ${error.message}`)
    return null
  }
}

async function testGetTeamMembers() {
  printSubHeader('👥 Testing Team Members Retrieval')
  
  try {
    const members = await teamsApiService.getTeamMembers()
    
    if (members && members.length > 0) {
      colorLog(colors.green, `✅ Successfully retrieved ${members.length} team members`)
      console.log('📋 Team Members:')
      members.forEach((member, index) => {
        console.log(`   ${index + 1}. ${member.Name || 'Unknown'} (${member.Email})`)
        console.log(`      - Role: ${member.UserRole || 'N/A'}`)
        console.log(`      - Job Title: ${member.JobTitle || 'N/A'}`)
        console.log(`      - Company: ${member.Company || 'N/A'}`)
        console.log(`      - Phone: ${member.Phone || 'N/A'}`)
        console.log(`      - Status: ${member.IsDisabled ? 'Disabled' : 'Active'}`)
        console.log(`      - Teams: ${member.TeamIds?.length || 0} team(s)`)
        console.log('')
      })
      return members
    } else {
      colorLog(colors.yellow, '⚠️  No team members found')
      return []
    }
  } catch (error) {
    colorLog(colors.red, '❌ Failed to get team members')
    console.error(`   Error: ${error.message}`)
    return null
  }
}

async function testPasswordGeneration() {
  printSubHeader('🔐 Testing Password Generation')
  
  try {
    const password = teamsApiService.generatePassword(12)
    
    if (password && password.length === 12) {
      colorLog(colors.green, '✅ Password generation successful')
      console.log(`   Generated password: ${password}`)
      console.log(`   Length: ${password.length} characters`)
      return true
    } else {
      colorLog(colors.red, '❌ Password generation failed')
      return false
    }
  } catch (error) {
    colorLog(colors.red, '❌ Password generation error')
    console.error(`   Error: ${error.message}`)
    return false
  }
}

async function askUserConfirmation(question) {
  const readline = await import('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  return new Promise((resolve) => {
    rl.question(`${colors.yellow}${question} (y/N): ${colors.reset}`, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

async function testCreateTeamMember(userDetails, teams) {
  printSubHeader('👤 Testing Team Member Creation')
  
  if (!userDetails?.organization || !userDetails?.tenantId) {
    colorLog(colors.red, '❌ Cannot test member creation: missing organization or tenant info')
    return false
  }
  
  if (!teams || teams.length === 0) {
    colorLog(colors.red, '❌ Cannot test member creation: no teams available')
    return false
  }
  
  const shouldTest = await askUserConfirmation(
    '⚠️  This will create a test team member. Do you want to proceed?'
  )
  
  if (!shouldTest) {
    colorLog(colors.yellow, '⏭️  Skipping team member creation test')
    return false
  }
  
  try {
    const testMemberData = {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      phone: '+1234567890',
      password: teamsApiService.generatePassword(),
      jobTitle: 'Test Developer',
      role: 'User',
      team: teams[0].objectId, // Use first available team
      organization: userDetails.organization,
      tenantId: userDetails.tenantId,
      timezone: 'UTC'
    }
    
    colorLog(colors.blue, '📤 Creating test team member...')
    console.log('📋 Test member data:')
    console.log(`   - Name: ${testMemberData.name}`)
    console.log(`   - Email: ${testMemberData.email}`)
    console.log(`   - Job Title: ${testMemberData.jobTitle}`)
    console.log(`   - Role: ${testMemberData.role}`)
    console.log(`   - Team: ${teams.find(t => t.objectId === testMemberData.team)?.Name}`)
    
    const newMember = await teamsApiService.createTeamMember(testMemberData)
    
    if (newMember && newMember.objectId) {
      colorLog(colors.green, '✅ Team member created successfully')
      console.log(`   - Member ID: ${newMember.objectId}`)
      console.log(`   - Name: ${newMember.Name}`)
      console.log(`   - Email: ${newMember.Email}`)
      return newMember
    } else {
      colorLog(colors.red, '❌ Team member creation failed - no valid response')
      return null
    }
  } catch (error) {
    colorLog(colors.red, '❌ Failed to create team member')
    console.error(`   Error: ${error.message}`)
    return null
  }
}

async function runTeamsApiTests() {
  printHeader('🧪 TEAMS API TESTING SUITE')
  
  console.log(`${colors.cyan}Testing OpenSign Teams API integration...${colors.reset}`)
  console.log(`${colors.blue}Environment: ${process.env.NODE_ENV || 'development'}${colors.reset}`)
  
  let testResults = {
    userDetails: false,
    teams: false,
    teamMembers: false,
    passwordGeneration: false,
    createMember: false
  }
  
  // Test 1: Get current user details
  const userDetails = await testUserDetails()
  testResults.userDetails = !!userDetails
  
  // Test 2: Get teams
  const teams = await testGetTeams()
  testResults.teams = Array.isArray(teams)
  
  // Test 3: Get team members
  const teamMembers = await testGetTeamMembers()
  testResults.teamMembers = Array.isArray(teamMembers)
  
  // Test 4: Password generation
  testResults.passwordGeneration = await testPasswordGeneration()
  
  // Test 5: Create team member (optional, requires confirmation)
  const newMember = await testCreateTeamMember(userDetails, teams)
  testResults.createMember = !!newMember
  
  // Print summary
  printHeader('📊 TEST RESULTS SUMMARY')
  
  console.log('🎯 Test Results:')
  console.log(`   ${testResults.userDetails ? '✅' : '❌'} User Details Retrieval`)
  console.log(`   ${testResults.teams ? '✅' : '❌'} Teams Retrieval`)
  console.log(`   ${testResults.teamMembers ? '✅' : '❌'} Team Members Retrieval`)
  console.log(`   ${testResults.passwordGeneration ? '✅' : '❌'} Password Generation`)
  console.log(`   ${testResults.createMember ? '✅' : '⏭️'} Team Member Creation ${!testResults.createMember ? '(skipped or failed)' : ''}`)
  
  const passedTests = Object.values(testResults).filter(Boolean).length
  const totalTests = Object.values(testResults).length
  
  console.log(`\n📈 Overall Score: ${passedTests}/${totalTests} tests passed`)
  
  if (passedTests === totalTests) {
    colorLog(colors.green, '🎉 All tests passed! Teams API is working correctly.')
  } else if (passedTests >= totalTests - 1) {
    colorLog(colors.yellow, '⚠️  Most tests passed. Teams API is mostly functional.')
  } else {
    colorLog(colors.red, '❌ Multiple tests failed. Check your OpenSign configuration.')
  }
  
  console.log(`\n${colors.blue}💡 Next steps:`)
  console.log(`   1. Test the Teams UI at http://localhost:3000/en/team`)
  console.log(`   2. Try adding a new team member through the interface`)
  console.log(`   3. Check that all team member data displays correctly`)
  console.log(`${colors.reset}`)
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTeamsApiTests().catch(error => {
    colorLog(colors.red, '💥 Test suite crashed!')
    console.error(error)
    process.exit(1)
  })
}

export { runTeamsApiTests }
