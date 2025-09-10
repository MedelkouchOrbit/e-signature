// Test script for the new backend document file endpoints
// Run this to verify the backend integration is working

async function testBackendEndpoints() {
  const documentId = 'GQPB5IAUV1'
  const baseUrl = 'http://localhost:3000/api/proxy/opensign'
  
  console.log('🧪 Testing Backend Document File Endpoints...\n')
  
  // Get session token from localStorage
  const sessionToken = typeof window !== 'undefined' 
    ? localStorage.getItem('opensign_session_token') 
    : 'r:fc16b73c981e796f56d4bab8de6cc628' // fallback token
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Parse-Application-Id': 'opensign',
    'X-Parse-Session-Token': sessionToken || ''
  }

  // Test 1: Enhanced getDocument endpoint
  console.log('📋 Test 1: Enhanced getDocument endpoint')
  try {
    const response1 = await fetch(`${baseUrl}/functions/getDocument`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ docId: documentId })
    })
    
    const data1 = await response1.json()
    console.log('✅ getDocument Response:', JSON.stringify(data1, null, 2))
    
    if (data1.result?.primaryFileUrl) {
      console.log('🎯 Primary File URL Found:', data1.result.primaryFileUrl)
    } else if (data1.result?.fileUrls?.length > 0) {
      console.log('📎 File URLs Found:', data1.result.fileUrls.map(f => f.url))
    } else {
      console.log('⚠️ No file URLs found in response')
    }
  } catch (error) {
    console.error('❌ getDocument Test Failed:', error)
  }
  
  console.log('\n---\n')
  
  // Test 2: Dedicated getDocumentFile endpoint
  console.log('📋 Test 2: Dedicated getDocumentFile endpoint')
  try {
    const response2 = await fetch(`${baseUrl}/functions/getdocumentfile`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ docId: documentId })
    })
    
    const data2 = await response2.json()
    console.log('✅ getDocumentFile Response:', JSON.stringify(data2, null, 2))
    
    if (data2.document?.primaryFileUrl) {
      console.log('🎯 Primary File URL Found:', data2.document.primaryFileUrl)
    } else {
      console.log('⚠️ No primary file URL found')
    }
  } catch (error) {
    console.error('❌ getDocumentFile Test Failed:', error)
  }
  
  console.log('\n---\n')
  
  // Test 3: Direct getFileUrl endpoint
  console.log('📋 Test 3: Direct getFileUrl endpoint')
  try {
    const response3 = await fetch(`${baseUrl}/functions/getfileurl`, {
      method: 'POST', 
      headers,
      body: JSON.stringify({ docId: documentId })
    })
    
    const data3 = await response3.json()
    console.log('✅ getFileUrl Response:', JSON.stringify(data3, null, 2))
    
    if (data3.fileUrl) {
      console.log('🎯 File URL Found:', data3.fileUrl)
    } else {
      console.log('⚠️ No file URL found')
    }
  } catch (error) {
    console.error('❌ getFileUrl Test Failed:', error)
  }
  
  console.log('\n🎯 Backend Integration Test Complete!')
}

// Export for use in browser console or node
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testBackendEndpoints }
} else {
  // Make available in browser console
  window.testBackendEndpoints = testBackendEndpoints
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  console.log('🧪 Backend endpoints test function loaded!')
  console.log('Run testBackendEndpoints() in console to test')
}
