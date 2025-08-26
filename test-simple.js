// Built-in fetch in Node.js 18+
const API_BASE_URL = "http://94.249.71.89:8080/app"
const OPENSIGN_APP_ID = "opensign"
const SESSION_TOKEN = "r:7bfcfaf8a98647027978f93b33c2a42e"

async function test() {
  console.log("Testing authentication first...")
  
  try {
    // Test auth
    const authResponse = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        "Content-Type": "application/json",
        "X-Parse-Application-Id": OPENSIGN_APP_ID,
        "X-Parse-Session-Token": SESSION_TOKEN,
      }
    })
    
    const authData = await authResponse.json()
    console.log("Auth status:", authResponse.status)
    console.log("Auth data:", authData)
    
    if (authResponse.ok) {
      console.log("✅ Authentication successful")
      
      // Test getSigners
      console.log("\nTesting getSigners...")
      const signersResponse = await fetch(`${API_BASE_URL}/functions/getsigners`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "X-Parse-Application-Id": OPENSIGN_APP_ID,
          "X-Parse-Session-Token": SESSION_TOKEN,
        },
        body: JSON.stringify({ search: '' })
      })
      
      const signersData = await signersResponse.json()
      console.log("Signers status:", signersResponse.status)
      console.log("Signers data:", signersData)
      
    } else {
      console.log("❌ Authentication failed")
    }
    
  } catch (error) {
    console.error("Error:", error.message)
  }
}

test()
