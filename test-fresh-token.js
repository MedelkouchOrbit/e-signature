// Get fresh session token for testing
const API_BASE_URL = "http://94.249.71.89:8080/app"
const OPENSIGN_APP_ID = "opensign"

async function getSessionToken() {
  console.log("🔐 Getting fresh session token...")
  
  try {
    const response = await fetch(`${API_BASE_URL}/functions/loginuser`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "X-Parse-Application-Id": OPENSIGN_APP_ID,
      },
      body: JSON.stringify({
        email: "m.elkouch@orbitech.jo",
        password: "123123"
      })
    })
    
    const data = await response.json()
    
    if (response.ok && data.result && data.result.sessionToken) {
      console.log("✅ Fresh session token:", data.result.sessionToken)
      
      // Now test getSigners with fresh token
      console.log("\n🔍 Testing getSigners with fresh token...")
      const signersResponse = await fetch(`${API_BASE_URL}/functions/getsigners`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "X-Parse-Application-Id": OPENSIGN_APP_ID,
          "X-Parse-Session-Token": data.result.sessionToken,
        },
        body: JSON.stringify({ search: '' })
      })
      
      const signersData = await signersResponse.json()
      console.log("Status:", signersResponse.status)
      console.log("Data:", JSON.stringify(signersData, null, 2))
      
      if (signersData.result && Array.isArray(signersData.result)) {
        console.log(`\n✅ Found ${signersData.result.length} contacts available as assignees`)
        
        // Show sample contacts with generated initials
        signersData.result.slice(0, 5).forEach(contact => {
          const words = contact.Name?.trim().split(/\s+/) || []
          let initials = 'UN'
          
          if (words.length >= 2) {
            initials = (words[0][0] + words[words.length - 1][0]).toUpperCase()
          } else if (words.length === 1 && words[0].length >= 2) {
            initials = words[0].substring(0, 2).toUpperCase()
          } else if (contact.Name && contact.Name.length >= 2) {
            initials = contact.Name.substring(0, 2).toUpperCase()
          }
          
          console.log(`   ${initials} - ${contact.Name} (${contact.Email})`)
        })
      }
      
    } else {
      console.log("❌ Login failed:", data)
    }
    
  } catch (error) {
    console.error("Error:", error.message)
  }
}

getSessionToken()
