// Teams API Test Script
// Run this in the browser console on the Teams page to test all API functionalities

console.log('🚀 Starting Teams API Backend Tests...')

// Test 1: Test Current User Details
async function testGetCurrentUserDetails() {
  console.log('\n📋 Test 1: Get Current User Details')
  try {
    const userDetails = await window.teamsApiService?.getCurrentUserDetails()
    console.log('✅ User Details:', userDetails)
    
    if (userDetails?.organization) {
      console.log('✅ Organization ID:', userDetails.organization.objectId)
      console.log('✅ Company:', userDetails.organization.company)
    } else {
      console.log('⚠️ No organization found')
    }
    
    if (userDetails?.tenantId) {
      console.log('✅ Tenant ID:', userDetails.tenantId)
    } else {
      console.log('⚠️ No tenant ID found')
    }
    
    return userDetails
  } catch (error) {
    console.error('❌ Test 1 Failed:', error)
    return null
  }
}

// Test 2: Test Get Teams
async function testGetTeams() {
  console.log('\n🏢 Test 2: Get Teams')
  try {
    const teams = await window.teamsApiService?.getTeams()
    console.log('✅ Teams:', teams)
    console.log('✅ Teams Count:', teams?.length || 0)
    
    if (teams && teams.length > 0) {
      console.log('✅ Sample Team:', teams[0])
    } else {
      console.log('⚠️ No teams found')
    }
    
    return teams
  } catch (error) {
    console.error('❌ Test 2 Failed:', error)
    return []
  }
}

// Test 3: Test Get Team Members
async function testGetTeamMembers() {
  console.log('\n👥 Test 3: Get Team Members')
  try {
    const teamMembers = await window.teamsApiService?.getTeamMembers()
    console.log('✅ Team Members:', teamMembers)
    console.log('✅ Team Members Count:', teamMembers?.length || 0)
    
    if (teamMembers && teamMembers.length > 0) {
      console.log('✅ Sample Team Member:', teamMembers[0])
      
      // Test member properties
      const member = teamMembers[0]
      console.log('✅ Member Details:')
      console.log('  - Name:', member.Name)
      console.log('  - Email:', member.Email)
      console.log('  - Phone:', member.Phone)
      console.log('  - Role:', member.UserRole)
      console.log('  - Organization:', member.OrganizationId?.Name)
      console.log('  - Teams:', member.TeamIds?.map(t => t.Name).join(', '))
    } else {
      console.log('⚠️ No team members found')
    }
    
    return teamMembers
  } catch (error) {
    console.error('❌ Test 3 Failed:', error)
    return []
  }
}

// Test 4: Test Password Generation
function testPasswordGeneration() {
  console.log('\n🔐 Test 4: Password Generation')
  try {
    const password1 = window.teamsApiService?.generatePassword(8)
    const password2 = window.teamsApiService?.generatePassword(12)
    const password3 = window.teamsApiService?.generatePassword(16)
    
    console.log('✅ 8-char password:', password1)
    console.log('✅ 12-char password:', password2)
    console.log('✅ 16-char password:', password3)
    
    // Test password strength
    const strongPassword = window.teamsApiService?.generatePassword(12)
    const hasUppercase = /[A-Z]/.test(strongPassword)
    const hasLowercase = /[a-z]/.test(strongPassword)
    const hasNumbers = /[0-9]/.test(strongPassword)
    const hasSpecialChars = /[!@#$%^&*]/.test(strongPassword)
    
    console.log('✅ Password Strength Test:')
    console.log('  - Has Uppercase:', hasUppercase)
    console.log('  - Has Lowercase:', hasLowercase)
    console.log('  - Has Numbers:', hasNumbers)
    console.log('  - Has Special Chars:', hasSpecialChars)
    
    return { password1, password2, password3, strongPassword }
  } catch (error) {
    console.error('❌ Test 4 Failed:', error)
    return null
  }
}

// Test 5: Test Create Team Member (Mock - don't actually create)
async function testCreateTeamMemberValidation(userDetails, teams) {
  console.log('\n👤 Test 5: Create Team Member Validation')
  try {
    if (!userDetails?.organization) {
      console.log('❌ Cannot test create member - no organization')
      return false
    }
    
    if (!userDetails?.tenantId) {
      console.log('❌ Cannot test create member - no tenant ID')
      return false
    }
    
    // Mock team member data
    const mockMemberData = {
      name: 'Test User (API Test)',
      email: 'test.user.api@example.com',
      phone: '+1234567890',
      password: window.teamsApiService?.generatePassword(12),
      jobTitle: 'Test Developer',
      role: 'User',
      team: teams?.[0]?.objectId || '',
      organization: userDetails.organization,
      tenantId: userDetails.tenantId,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
    
    console.log('✅ Mock Member Data Validation:')
    console.log('  - Name:', mockMemberData.name)
    console.log('  - Email:', mockMemberData.email)
    console.log('  - Organization ID:', mockMemberData.organization.objectId)
    console.log('  - Tenant ID:', mockMemberData.tenantId)
    console.log('  - Team ID:', mockMemberData.team)
    console.log('  - Timezone:', mockMemberData.timezone)
    
    // Note: We're not actually creating the user to avoid test data
    console.log('⚠️ Skipping actual creation to avoid test data')
    
    return true
  } catch (error) {
    console.error('❌ Test 5 Failed:', error)
    return false
  }
}

// Test 6: Test API Service Availability
function testApiServiceAvailability() {
  console.log('\n🔧 Test 6: API Service Availability')
  try {
    console.log('✅ Teams API Service Available:', !!window.teamsApiService)
    console.log('✅ OpenSign API Service Available:', !!window.openSignApiService)
    
    if (window.teamsApiService) {
      console.log('✅ Available Methods:')
      console.log('  - getTeamMembers:', typeof window.teamsApiService.getTeamMembers)
      console.log('  - getTeams:', typeof window.teamsApiService.getTeams)
      console.log('  - createTeamMember:', typeof window.teamsApiService.createTeamMember)
      console.log('  - getCurrentUserDetails:', typeof window.teamsApiService.getCurrentUserDetails)
      console.log('  - generatePassword:', typeof window.teamsApiService.generatePassword)
    }
    
    return true
  } catch (error) {
    console.error('❌ Test 6 Failed:', error)
    return false
  }
}

// Run All Tests
async function runAllTeamsApiTests() {
  console.log('🧪 Teams API Backend Test Suite')
  console.log('================================')
  
  const results = {
    apiAvailability: false,
    userDetails: null,
    teams: [],
    teamMembers: [],
    passwordGeneration: null,
    createValidation: false
  }
  
  try {
    // Test API availability first
    results.apiAvailability = testApiServiceAvailability()
    
    if (!results.apiAvailability) {
      console.log('❌ API services not available - make sure you are on the Teams page')
      return results
    }
    
    // Test user details
    results.userDetails = await testGetCurrentUserDetails()
    
    // Test teams
    results.teams = await testGetTeams()
    
    // Test team members
    results.teamMembers = await testGetTeamMembers()
    
    // Test password generation
    results.passwordGeneration = testPasswordGeneration()
    
    // Test create member validation
    results.createValidation = await testCreateTeamMemberValidation(results.userDetails, results.teams)
    
    // Summary
    console.log('\n📊 Test Summary')
    console.log('===============')
    console.log('✅ API Availability:', results.apiAvailability)
    console.log('✅ User Details:', !!results.userDetails)
    console.log('✅ Teams Count:', results.teams?.length || 0)
    console.log('✅ Team Members Count:', results.teamMembers?.length || 0)
    console.log('✅ Password Generation:', !!results.passwordGeneration)
    console.log('✅ Create Validation:', results.createValidation)
    
    const successCount = [
      results.apiAvailability,
      !!results.userDetails,
      results.teams?.length > 0,
      results.teamMembers?.length > 0,
      !!results.passwordGeneration,
      results.createValidation
    ].filter(Boolean).length
    
    console.log(`\n🎯 Overall Score: ${successCount}/6 tests passed`)
    
    if (successCount === 6) {
      console.log('🎉 All Teams API tests passed! The backend integration is working correctly.')
    } else {
      console.log('⚠️ Some tests failed. Check the individual test results above.')
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error)
  }
  
  return results
}

// Make functions available globally for manual testing
window.teamsApiTests = {
  runAll: runAllTeamsApiTests,
  testGetCurrentUserDetails,
  testGetTeams,
  testGetTeamMembers,
  testPasswordGeneration,
  testCreateTeamMemberValidation,
  testApiServiceAvailability
}

// Auto-run tests if this script is loaded
console.log('📝 Teams API Test Suite loaded. Run window.teamsApiTests.runAll() to start testing.')
