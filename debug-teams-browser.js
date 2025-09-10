// Debug script to check session token and test API calls from browser
console.log('🔍 Debugging TeamsAndMembers component...')

// Check if session token exists in localStorage
const sessionToken = localStorage.getItem('opensign_session_token')
console.log('🔑 Session token in localStorage:', sessionToken ? 'EXISTS' : 'MISSING')
console.log('🔑 Session token value:', sessionToken)

// Check if openSignApiService can get the token
if (window.openSignApiService) {
  const apiToken = window.openSignApiService.getSessionToken()
  console.log('🔑 API service token:', apiToken)
} else {
  console.log('❌ openSignApiService not available in window')
}

// Test API calls manually
if (sessionToken) {
  console.log('🧪 Testing manual API calls...')
  
  // Test getteams
  fetch('/api/proxy/opensign/functions/getteams', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Parse-Application-Id': 'opensign',
      'X-Parse-Session-Token': sessionToken,
    },
    body: JSON.stringify({ active: true })
  })
  .then(response => response.json())
  .then(data => {
    console.log('✅ Manual getteams result:', data)
  })
  .catch(error => {
    console.error('❌ Manual getteams error:', error)
  })
  
  // Test getUserDetails
  fetch('/api/proxy/opensign/functions/getUserDetails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Parse-Application-Id': 'opensign',
      'X-Parse-Session-Token': sessionToken,
    },
    body: JSON.stringify({})
  })
  .then(response => response.json())
  .then(data => {
    console.log('✅ Manual getUserDetails result:', data)
  })
  .catch(error => {
    console.error('❌ Manual getUserDetails error:', error)
  })
} else {
  console.log('❌ No session token found, cannot test API calls')
  console.log('💡 You may need to log in first')
}
