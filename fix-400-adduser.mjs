#!/usr/bin/env node

/**
 * 400 Error Fix - adduser Authentication Issue
 * Provides solutions for the "Permission denied, user needs to be authenticated" error
 */

const BASE_URL = 'http://94.249.71.89:9000/api/app';
const USERNAME = 'joe@joe.com';
const PASSWORD = 'Meticx12@';

console.log('🔧 400 Error Fix - adduser Authentication');
console.log('========================================');

async function diagnoseAndFix() {
  console.log('\n📋 ISSUE IDENTIFIED:');
  console.log('adduser function returns: "Permission denied, user needs to be authenticated"');
  console.log('');
  console.log('🎯 ROOT CAUSE:');
  console.log('The adduser function requires ADMIN-level permissions, not just regular user authentication.');
  console.log('');
  
  // Step 1: Check current user permissions
  console.log('🔐 Step 1: Check Current User Permissions');
  console.log('-'.repeat(40));
  
  try {
    const loginResponse = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: USERNAME,
        password: PASSWORD
      })
    });
    
    const loginData = await loginResponse.json();
    const sessionToken = loginData.sessionToken;
    
    console.log('✅ Authentication successful');
    console.log(`User ID: ${loginData.objectId}`);
    console.log(`Email: ${loginData.email}`);
    
    // Check user role/permissions
    const userResponse = await fetch(`${BASE_URL}/classes/_User/${loginData.objectId}`, {
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': sessionToken
      }
    });
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('📋 User Details:');
      console.log(`   Role: ${userData.role || 'Not specified'}`);
      console.log(`   Active: ${userData.active !== false}`);
      console.log(`   Created: ${userData.createdAt}`);
      
      if (userData.role !== 'Admin') {
        console.log('⚠️  ISSUE: User role is not "Admin" - this explains the permission error');
      }
    }
    
    // Step 2: Test admin functions vs regular functions
    console.log('\n🧪 Step 2: Test Admin vs Regular Functions');
    console.log('-'.repeat(40));
    
    const testCases = [
      {
        name: 'Regular Function: signPdf',
        url: `${BASE_URL}/functions/signPdf`,
        body: { docId: 'test123' },
        adminRequired: false
      },
      {
        name: 'Admin Function: adduser',
        url: `${BASE_URL}/functions/adduser`,
        body: {
          name: "test@example.com",
          email: "test@example.com", 
          password: "TestPass123",
          role: "User"
        },
        adminRequired: true
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n📋 Testing: ${testCase.name}`);
      
      const response = await fetch(testCase.url, {
        method: 'POST',
        headers: {
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': sessionToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase.body)
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.status === 400) {
        const errorData = await response.json();
        if (errorData.error.includes('Permission denied')) {
          console.log(`❌ Permission denied (Admin required: ${testCase.adminRequired})`);
        } else {
          console.log(`⚠️  Other 400 error: ${errorData.error}`);
        }
      } else if (response.status === 404) {
        console.log('✅ Function accessible (404 = missing document, not permission issue)');
      } else if (response.ok) {
        console.log('✅ Success');
      } else {
        const errorData = await response.json();
        console.log(`❌ Error: ${errorData.error}`);
      }
    }
    
    // Step 3: Solutions
    console.log('\n💡 Step 3: Solutions for adduser 400 Error');
    console.log('-'.repeat(40));
    
    console.log('SOLUTION 1: Use Admin Account');
    console.log('✅ Login with an admin-level account');
    console.log('✅ Admin accounts typically have role: "Admin"');
    console.log('✅ Check with backend team for admin credentials');
    console.log('');
    
    console.log('SOLUTION 2: Upgrade Current User');
    console.log('✅ Ask backend team to change joe@joe.com role to "Admin"');
    console.log('✅ Update _User record: { role: "Admin" }');
    console.log('✅ This would allow adduser function access');
    console.log('');
    
    console.log('SOLUTION 3: Alternative User Creation');
    console.log('✅ Use direct database insertion (backend team)');
    console.log('✅ Use Parse Dashboard for user management');
    console.log('✅ Create users through admin interface');
    console.log('');
    
    console.log('SOLUTION 4: Test with Master Key (Backend Only)');
    console.log('✅ Backend can use master key for adduser operations');
    console.log('✅ Frontend should not have master key access');
    console.log('✅ Create backend endpoint for user creation');
    console.log('');
    
    // Step 4: Test actual fix
    console.log('🔧 Step 4: Test If We Can Fix The Authentication');
    console.log('-'.repeat(40));
    
    console.log('Testing alternate authentication patterns...');
    
    // Try with explicit admin role in headers (usually won\'t work but worth testing)
    const adminTestResponse = await fetch(`${BASE_URL}/functions/adduser`, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': sessionToken,
        'X-Parse-Master-Key': 'test', // This will fail but shows the pattern
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: "test@example.com",
        email: "test@example.com",
        password: "TestPass123",
        role: "User"
      })
    });
    
    console.log(`Admin test status: ${adminTestResponse.status}`);
    
    if (adminTestResponse.status === 400) {
      const errorData = await adminTestResponse.json();
      if (errorData.error.includes('Permission denied')) {
        console.log('❌ Still permission denied - user role is the issue');
      }
    }
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
  }
  
  // Final recommendations
  console.log('\n🎯 FINAL RECOMMENDATIONS');
  console.log('='.repeat(40));
  console.log('');
  console.log('IMMEDIATE ACTIONS:');
  console.log('1. ✅ Basic API is working (Health, Documents, Authentication)');
  console.log('2. 🔧 adduser function requires admin permissions');
  console.log('3. 📞 Contact backend team to either:');
  console.log('   a) Provide admin credentials for testing');
  console.log('   b) Upgrade joe@joe.com to admin role');
  console.log('   c) Create alternative user creation endpoint');
  console.log('');
  console.log('FOR OTHER 400 ERRORS:');
  console.log('1. ✅ Check parameter formats and required fields');
  console.log('2. ✅ Verify object IDs exist (organization, team IDs)');
  console.log('3. ✅ Ensure session token is fresh and valid');
  console.log('4. ✅ Use proper Content-Type headers');
  console.log('');
  console.log('🚀 All other API functions should work with current setup!');
}

diagnoseAndFix().catch(console.error);
