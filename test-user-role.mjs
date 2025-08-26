#!/usr/bin/env node

/**
 * Test script to demonstrate Teams module authentication requirements
 * 
 * Note: This script will show "User is not authenticated" error, which is expected.
 * The Teams module requires web-based authentication to function properly.
 * 
 * To test role-based access control:
 * 1. Login at http://localhost:3000/auth/login  
 * 2. Navigate to http://localhost:3000/team
 * 3. Use the "🧪 Test API" button on the Teams page
 */

import fetch from 'node-fetch'

async function testUserRole() {
  console.log('🧪 Testing Teams Module API Authentication...\n')
  
  try {
    console.log('📋 Testing User Details API (Direct Call)...')
    const response = await fetch('http://localhost:3000/api/proxy/opensign/functions/getUserDetails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    })
    
    const data = await response.json()
    console.log('Response:', JSON.stringify(data, null, 2))
    
    if (data.error && data.error.includes('not authenticated')) {
      console.log('\n✅ EXPECTED RESULT: Authentication required for API access')
      console.log('\n🔐 Security Check Passed:')
      console.log('   - Direct API calls are properly blocked')
      console.log('   - User authentication is enforced')
      console.log('   - Teams module security is working correctly')
      
      console.log('\n🧪 To Test Role-Based Access Control:')
      console.log('   1. Open browser and login: http://localhost:3000/auth/login')
      console.log('   2. Navigate to Teams: http://localhost:3000/team')
      console.log('   3. Click "🧪 Test API" button for authenticated testing')
      console.log('   4. Check browser console for detailed role analysis')
      
      console.log('\n📋 Expected Behavior by Role:')
      console.log('   ADMIN: Can add team members, assign all roles')
      console.log('   MANAGER: Can add team members, assign User role only')  
      console.log('   USER: View-only access, Add button hidden')
      
      return
    }
    
    // If we get here, authentication worked
    const userRole = data.result?.UserRole
    console.log('\n🎭 User authenticated! Role:', userRole || 'No role defined')
    
  } catch (error) {
    console.error('❌ Network error:', error.message)
    console.log('\n💡 Make sure the development server is running:')
    console.log('   npm run dev')
  }
}

// Run the test
testUserRole()
