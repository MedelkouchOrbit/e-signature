// Test script to verify teams and members API calls work
const API_BASE_URL = "http://94.249.71.89:9000"
const OPENSIGN_APP_ID = "opensign"
const SESSION_TOKEN = "r:af90807d45364664e3707e4fe9a1a99c"

async function testTeamsAPI() {
  console.log('🧪 Testing Teams and Members API...')
  
  try {
    // Test getteams
    console.log('\n1. Testing getteams...')
    const teamsResponse = await fetch(`${API_BASE_URL}/api/app/functions/getteams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': OPENSIGN_APP_ID,
        'X-Parse-Session-Token': SESSION_TOKEN,
      },
      body: JSON.stringify({ active: true })
    })
    
    const teamsData = await teamsResponse.json()
    console.log('✅ Teams response:', JSON.stringify(teamsData, null, 2))
    
    // Extract organization ID from teams
    let organizationId = null
    if (teamsData.result && teamsData.result.length > 0) {
      const firstTeam = teamsData.result[0]
      if (firstTeam.OrganizationId && firstTeam.OrganizationId.objectId) {
        organizationId = firstTeam.OrganizationId.objectId
        console.log('🏢 Found organization ID:', organizationId)
      }
    }
    
    if (organizationId) {
      // Test getuserlistbyorg
      console.log('\n2. Testing getuserlistbyorg...')
      const membersResponse = await fetch(`${API_BASE_URL}/api/app/functions/getuserlistbyorg`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Parse-Application-Id': OPENSIGN_APP_ID,
          'X-Parse-Session-Token': SESSION_TOKEN,
        },
        body: JSON.stringify({ organizationId })
      })
      
      const membersData = await membersResponse.json()
      console.log('✅ Members response:', JSON.stringify(membersData, null, 2))
      
      // Show summary
      console.log('\n📊 Summary:')
      console.log(`- Found ${teamsData.result?.length || 0} teams`)
      console.log(`- Found ${membersData.result?.length || 0} organization members`)
      
      if (teamsData.result?.length > 0) {
        console.log('\n🏢 Teams:')
        teamsData.result.forEach((team, index) => {
          console.log(`  ${index + 1}. ${team.Name} (${team.IsActive ? 'Active' : 'Inactive'})`)
        })
      }
      
      if (membersData.result?.length > 0) {
        console.log('\n👥 Members:')
        membersData.result.forEach((member, index) => {
          const userName = member.UserId?.name || member.Name || 'Unknown User'
          const userRole = member.UserRole || 'User'
          console.log(`  ${index + 1}. ${userName} (${userRole})`)
        })
      }
    } else {
      console.log('❌ No organization ID found in teams data')
    }
    
  } catch (error) {
    console.error('❌ Error testing APIs:', error)
  }
}

// Run the test
testTeamsAPI()
