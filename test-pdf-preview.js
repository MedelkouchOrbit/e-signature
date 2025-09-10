// Test script to verify PDF preview functionality with the working backend endpoints
// This can be run in the browser console to test the endpoints directly

async function testPDFPreview() {
  const documentId = 'GQPB5IAUV1'
  console.log('🧪 Testing PDF Preview with Working Backend Endpoints...\n')
  
  try {
    // Test our frontend downloadDocument method
    console.log('📄 Testing frontend downloadDocument method...')
    
    // Note: This assumes you're logged in and have the documents API service available
    if (typeof window !== 'undefined' && window.documentsApiService) {
      const url = await window.documentsApiService.downloadDocument(documentId)
      console.log('✅ Frontend method success! URL:', url)
      
      // Test the URL by creating a temporary link
      const testLink = document.createElement('a')
      testLink.href = url
      testLink.target = '_blank'
      testLink.textContent = 'Test PDF URL'
      testLink.style.cssText = 'position:fixed;top:10px;right:10px;z-index:9999;background:green;color:white;padding:10px;border-radius:5px;text-decoration:none;'
      document.body.appendChild(testLink)
      
      console.log('🎯 Test link added to page (top-right corner)')
      
      // Auto-remove after 30 seconds
      setTimeout(() => {
        document.body.removeChild(testLink)
      }, 30000)
      
      return { success: true, url }
    } else {
      console.log('ℹ️ Not in document context - testing endpoints directly...')
      
      // Direct endpoint test
      const sessionToken = localStorage.getItem('opensign_session_token') || 'r:221eda7b28d3636792967b3857d74ab5'
      
      const response = await fetch('/api/proxy/opensign/functions/getfileurl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': sessionToken
        },
        body: JSON.stringify({ docId: documentId })
      })
      
      const data = await response.json()
      console.log('📄 Direct endpoint response:', data)
      
      if (data.result?.fileUrl) {
        console.log('✅ PDF URL found:', data.result.fileUrl)
        return { success: true, url: data.result.fileUrl }
      } else {
        console.log('❌ No PDF URL in response')
        return { success: false, error: 'No URL found' }
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error)
    return { success: false, error: error.message }
  }
}

// Auto-run test
if (typeof window !== 'undefined') {
  console.log('🧪 PDF Preview Test Loaded!')
  console.log('Run testPDFPreview() to test the integration')
  
  // Make available globally
  window.testPDFPreview = testPDFPreview
}

export { testPDFPreview }
