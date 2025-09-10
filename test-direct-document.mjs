// Test script to fetch document using proxy API
const documentId = 'GQPB5IAUV1'

async function testProxyDocumentAccess() {
  try {
    console.log('Testing proxy API for document:', documentId)
    
    // Try to get document using proxy API
    const response = await fetch(`http://localhost:3000/api/proxy/opensign/classes/contracts_Document/${documentId}`, {
      method: 'GET',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': 'r:af90807d45364664e3707e4fe9a1a99c' // admin token
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Proxy document response:', JSON.stringify(result, null, 2))
      
      if (result.URL) {
        console.log('📄 Document URL found:', result.URL)
        
        // Test if the URL is accessible
        try {
          const urlTest = await fetch(result.URL, { method: 'HEAD' })
          console.log('📋 URL accessibility test:', urlTest.status, urlTest.statusText)
        } catch (urlError) {
          console.log('❌ URL not accessible:', urlError.message)
        }
      } else {
        console.log('❌ No URL found in proxy response')
        console.log('Available fields:', Object.keys(result))
      }
    } else {
      console.error('❌ Proxy API call failed:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error details:', errorText)
    }
  } catch (error) {
    console.error('❌ Network error:', error)
  }
}

// Run the test
testProxyDocumentAccess()
