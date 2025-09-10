#!/usr/bin/env node

/**
 * Test OpenSign API authentication with provided credentials
 */

const OPENSIGN_BASE_URL = 'http://94.249.71.89:9000'
const OPENSIGN_APP_ID = 'opensign'
const USERNAME = 'joe@joe.com'
const PASSWORD = 'Meticx12@'

// Test different Parse Server mount paths
const MOUNT_PATHS = ['/1', '/api/1', '/parse/1', '/app', '/parse', '/api', '']

async function testAuthentication() {
  console.log('🔐 Testing OpenSign API authentication...')
  console.log(`📧 Username: ${USERNAME}`)
  console.log(`🌐 Base URL: ${OPENSIGN_BASE_URL}`)
  
  for (const mountPath of MOUNT_PATHS) {
    const loginUrl = `${OPENSIGN_BASE_URL}${mountPath}/login`
    console.log(`\n🔍 Trying login endpoint: ${loginUrl}`)
    
    try {
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'X-Parse-Application-Id': OPENSIGN_APP_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: USERNAME,
          password: PASSWORD,
        }),
      })
      
      console.log(`📊 Status: ${response.status} ${response.statusText}`)
      console.log(`📋 Content-Type: ${response.headers.get('content-type')}`)
      
      const responseText = await response.text()
      
      // Check if we got HTML (frontend) instead of API
      if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html')) {
        console.log(`❌ Got HTML frontend instead of API response`)
        continue
      }
      
      // Try to parse as JSON
      try {
        const data = JSON.parse(responseText)
        
        if (response.ok && data.sessionToken) {
          console.log(`✅ LOGIN SUCCESS!`)
          console.log(`🎫 Session Token: ${data.sessionToken.substring(0, 20)}...`)
          console.log(`👤 User ID: ${data.objectId}`)
          console.log(`📧 Email: ${data.email}`)
          
          // Test a Parse Server function with this token
          await testFunction(mountPath, data.sessionToken)
          return { mountPath, sessionToken: data.sessionToken }
        } else {
          console.log(`❌ Login failed:`, data)
        }
      } catch (parseError) {
        console.log(`❌ Failed to parse JSON response:`, responseText.substring(0, 200))
      }
      
    } catch (error) {
      console.log(`❌ Request failed:`, error.message)
    }
  }
  
  console.log(`\n❌ No working authentication endpoint found!`)
  return null
}

async function testFunction(mountPath, sessionToken) {
  console.log(`\n🧪 Testing Parse Server function with session token...`)
  
  const functionUrl = `${OPENSIGN_BASE_URL}${mountPath}/functions/getfilecontent`
  
  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': OPENSIGN_APP_ID,
        'X-Parse-Session-Token': sessionToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        docId: 'test123'
      }),
    })
    
    console.log(`📊 Function Status: ${response.status} ${response.statusText}`)
    
    const responseText = await response.text()
    
    try {
      const data = JSON.parse(responseText)
      console.log(`✅ Function response:`, data)
    } catch {
      console.log(`❌ Function response (not JSON):`, responseText.substring(0, 200))
    }
    
  } catch (error) {
    console.log(`❌ Function test failed:`, error.message)
  }
}

async function testProxyEndpoint() {
  console.log(`\n🔗 Testing local proxy endpoint...`)
  
  const proxyUrl = 'http://localhost:3000/api/proxy/opensign/classes/contracts_Document'
  
  try {
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    console.log(`📊 Proxy Status: ${response.status} ${response.statusText}`)
    console.log(`📋 Proxy Content-Type: ${response.headers.get('content-type')}`)
    
    const responseText = await response.text()
    
    if (responseText.includes('<!DOCTYPE html>')) {
      console.log(`❌ Proxy returned HTML frontend`)
    } else {
      try {
        const data = JSON.parse(responseText)
        console.log(`✅ Proxy response:`, data)
      } catch {
        console.log(`❌ Proxy response (not JSON):`, responseText.substring(0, 200))
      }
    }
    
  } catch (error) {
    console.log(`❌ Proxy test failed:`, error.message)
  }
}

// Run tests
async function main() {
  console.log('🚀 Starting OpenSign API connectivity tests...\n')
  
  const authResult = await testAuthentication()
  await testProxyEndpoint()
  
  if (authResult) {
    console.log(`\n✅ SUCCESS: Found working API endpoint at ${authResult.mountPath}`)
    console.log(`🎫 Session token obtained successfully`)
    console.log(`\n💡 Recommendation: Update proxy to use mount path: ${authResult.mountPath}`)
  } else {
    console.log(`\n❌ FAILURE: No working API endpoint found`)
    console.log(`\n🔧 BACKEND TEAM ACTION REQUIRED:`)
    console.log(`   1. Verify Parse Server is running and accessible`)
    console.log(`   2. Check Parse Server mount path configuration`)
    console.log(`   3. Ensure API endpoints are exposed (not just frontend)`)
    console.log(`   4. Verify CORS configuration for client access`)
  }
}

main().catch(console.error)
