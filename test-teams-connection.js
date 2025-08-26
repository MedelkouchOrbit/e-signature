#!/usr/bin/env node

/**
 * Simple Teams API connectivity test
 * Tests basic authentication and API connectivity to OpenSign
 */

import { openSignApiService } from './app/lib/api-service.js'

async function testConnection() {
  console.log('🔧 Testing OpenSign Teams API connectivity...\n')
  
  try {
    // Test basic authentication and getUserDetails
    console.log('1. Testing authentication and user details...')
    const response = await openSignApiService.post("functions/getUserDetails", {})
    
    if (response && response.result) {
      console.log('✅ Authentication successful!')
      console.log('📋 User details:', {
        email: response.result.Email,
        role: response.result.UserRole,
        organizationId: response.result.OrganizationId?.objectId,
        tenantId: response.result.TenantId?.objectId
      })
    } else {
      console.log('❌ Authentication failed or no user details')
      return false
    }
    
    // Test getteams function
    console.log('\n2. Testing teams retrieval...')
    const teamsResponse = await openSignApiService.post("functions/getteams", { active: true })
    
    if (teamsResponse && teamsResponse.result) {
      console.log(`✅ Teams retrieved successfully! Found ${teamsResponse.result.length} teams`)
      teamsResponse.result.forEach((team, index) => {
        console.log(`   ${index + 1}. ${team.Name} (${team.objectId})`)
      })
    } else {
      console.log('❌ Failed to retrieve teams')
      return false
    }
    
    // Test getUserListByOrg function (if we have organization)
    if (response.result.OrganizationId?.objectId) {
      console.log('\n3. Testing team members retrieval...')
      const membersResponse = await openSignApiService.post("functions/getUserListByOrg", {
        organizationId: response.result.OrganizationId.objectId
      })
      
      if (membersResponse && membersResponse.result) {
        console.log(`✅ Team members retrieved successfully! Found ${membersResponse.result.length} members`)
        membersResponse.result.forEach((member, index) => {
          console.log(`   ${index + 1}. ${member.Name} (${member.Email}) - ${member.UserRole}`)
        })
      } else {
        console.log('❌ Failed to retrieve team members')
        return false
      }
    } else {
      console.log('\n3. ⏭️  Skipping team members test (no organization ID)')
    }
    
    console.log('\n🎉 All connectivity tests passed!')
    console.log('💡 You can now test the Teams UI at: http://localhost:3000/en/team')
    return true
    
  } catch (error) {
    console.log('❌ Connection test failed!')
    console.error('Error:', error.message)
    
    if (error.message.includes('INVALID_SESSION_TOKEN')) {
      console.log('\n💡 Tip: Make sure you are logged in to the application first')
      console.log('   Visit: http://localhost:3000/en/auth/signin')
    }
    
    return false
  }
}

testConnection()
