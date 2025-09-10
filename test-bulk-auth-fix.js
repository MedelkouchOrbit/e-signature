/**
 * Test script to verify bulk send authentication fix
 */

// Mock localStorage for Node.js environment
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    getItem: (key) => {
      if (key === 'auth-storage') {
        return JSON.stringify({
          state: {
            sessionToken: 'test-session-token-123',
            user: {
              id: 'test-user-id-456',
              email: 'test@example.com'
            }
          }
        })
      }
      return null
    },
    setItem: () => {},
    removeItem: () => {}
  }
}

// Import the utility functions
const { getCurrentUser, getCurrentSessionToken } = require('./app/lib/utils/current-user.ts')

console.log('🧪 Testing bulk send authentication utilities...\n')

// Test getCurrentSessionToken
const sessionToken = getCurrentSessionToken()
console.log('Session Token:', sessionToken)
console.log('✅ Session token retrieved successfully:', !!sessionToken)

// Test getCurrentUser
const currentUser = getCurrentUser()
console.log('\nCurrent User:', currentUser)
console.log('✅ User ID retrieved:', !!currentUser.id)
console.log('✅ User email retrieved:', !!currentUser.email)

// Test authentication requirements
if (sessionToken && currentUser.id) {
  console.log('\n🎉 Authentication requirements met for bulk send!')
  console.log('✅ Session token available')
  console.log('✅ User ID available')
  console.log('✅ Ready to create bulk send documents')
} else {
  console.log('\n❌ Authentication requirements NOT met:')
  console.log('- Session token:', !!sessionToken)
  console.log('- User ID:', !!currentUser.id)
}
