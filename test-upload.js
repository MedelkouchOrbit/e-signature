// Test file upload using the new method
const testFileUpload = async () => {
  try {
    console.log('Testing file upload with fileupload function...')
    
    // Create a test file content
    const testContent = 'Test PDF content for upload testing'
    const base64Data = Buffer.from(testContent).toString('base64')
    const fileName = `test-${Date.now()}.pdf`
    
    const response = await fetch('http://localhost:3001/api/proxy/opensign/functions/fileupload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': 'r:20fec308b4ae76427abe4377e4941561',
      },
      body: JSON.stringify({
        fileName: fileName,
        fileData: base64Data
      }),
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} - ${await response.text()}`)
    }

    const result = await response.json()
    console.log('✅ Upload successful!')
    console.log('Response:', JSON.stringify(result, null, 2))
    
    return result
  } catch (error) {
    console.error('❌ Upload failed:', error)
    return null
  }
}

// Run the test
testFileUpload()
