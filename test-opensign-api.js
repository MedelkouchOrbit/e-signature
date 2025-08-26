// Test OpenSign API connectivity and permissions
async function testOpenSignAPI() {
  const baseUrl = 'http://localhost:3000/api/proxy/opensign'
  
  // Get session token from browser cookies
  const sessionToken = 'r:4ef4c84786275cc27b05a6d0c03e42a8' // From your curl command
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Parse-Application-Id': 'opensign',
    'X-Parse-Session-Token': sessionToken
  }

  console.log('🔍 Testing OpenSign API endpoints...\n')

  // Test 1: Check session validity
  try {
    console.log('1️⃣ Testing session token validity...')
    const response = await fetch(`${baseUrl}/users/me`, {
      headers
    })
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Session valid. User:', data.name || data.email)
      console.log('📧 Email:', data.email)
      console.log('🆔 ObjectId:', data.objectId)
    } else {
      console.log('❌ Session invalid:', data)
    }
  } catch (error) {
    console.log('❌ Session test failed:', error.message)
  }

  // Test 2: Check available classes/endpoints
  console.log('\n2️⃣ Testing available endpoints...')
  
  const endpointsToTest = [
    'classes/contracts_Template',
    'classes/contracts_Document', 
    'classes/contracts_Users',
    'functions/gettemplate',
    'functions/getdocuments',
    'functions/gettemplates'
  ]

  for (const endpoint of endpointsToTest) {
    try {
      console.log(`Testing: ${endpoint}`)
      const response = await fetch(`${baseUrl}/${endpoint}?limit=1`, {
        headers
      })
      const data = await response.json()
      
      if (response.ok) {
        console.log(`✅ ${endpoint}: Available (${data.results?.length || 0} items)`)
      } else {
        console.log(`❌ ${endpoint}: ${data.error || 'Failed'} (Code: ${data.code || response.status})`)
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`)
    }
  }

  // Test 3: Check specific template functions
  console.log('\n3️⃣ Testing template-specific functions...')
  
  const templateFunctions = [
    'functions/gettemplate',
    'functions/savetemplate',
    'functions/saveastemplate'
  ]

  for (const func of templateFunctions) {
    try {
      const response = await fetch(`${baseUrl}/${func}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({})
      })
      const data = await response.json()
      
      if (response.ok || data.code !== 119) { // Not a permission error
        console.log(`✅ ${func}: Available`)
      } else {
        console.log(`❌ ${func}: ${data.error} (Code: ${data.code})`)
      }
    } catch (error) {
      console.log(`❌ ${func}: ${error.message}`)
    }
  }
}

// Run the test
testOpenSignAPI()
