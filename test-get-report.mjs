// Test script to fetch document details directly
const documentId = 'GQPB5IAUV1'

async function testGetReport() {
  try {
    console.log('Testing getReport API for document:', documentId)
    
    const response = await fetch('http://94.249.71.89:9000/api/app/functions/getReport', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': 'r:af90807d45364664e3707e4fe9a1a99c' // admin token
      },
      body: JSON.stringify({
        objectId: documentId
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ getReport response:', JSON.stringify(result, null, 2))
      
      if (result.result?.URL) {
        console.log('📄 Document URL found:', result.result.URL)
      } else {
        console.log('❌ No URL found in response')
      }
    } else {
      console.error('❌ API call failed:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error details:', errorText)
    }
  } catch (error) {
    console.error('❌ Network error:', error)
  }
}

// Run the test
testGetReport()
