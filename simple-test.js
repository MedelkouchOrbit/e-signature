// Simple login test to verify connectivity
console.log("Testing OpenSign connectivity...")

fetch("http://94.249.71.89:8080/app/functions/loginuser", {
  method: 'POST',
  headers: {
    "Content-Type": "application/json",
    "X-Parse-Application-Id": "opensign",
  },
  body: JSON.stringify({
    email: "m.elkouch@orbitech.jo",
    password: "123123"
  })
}).then(async (response) => {
  const data = await response.json()
  console.log("✅ Login response:", {
    status: response.status,
    hasSessionToken: !!(data.result?.sessionToken),
    sessionToken: data.result?.sessionToken?.substring(0, 10) + "...",
    userEmail: data.result?.email
  })
  
  if (data.result?.sessionToken) {
    // Test getSigners
    console.log("\n🔍 Testing getSigners...")
    const signersResponse = await fetch("http://94.249.71.89:8080/app/functions/getsigners", {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "X-Parse-Application-Id": "opensign",
        "X-Parse-Session-Token": data.result.sessionToken,
      },
      body: JSON.stringify({ search: '' })
    })
    
    const signersData = await signersResponse.json()
    console.log("✅ getSigners response:", {
      status: signersResponse.status,
      contactCount: signersData.result?.length || 0,
      hasContacts: Array.isArray(signersData.result),
      error: signersData.error
    })
    
    if (signersData.result && signersData.result.length > 0) {
      console.log("\n📋 Sample contacts:")
      signersData.result.slice(0, 3).forEach((contact, i) => {
        // Generate initials
        const words = contact.Name?.trim().split(/\s+/) || []
        let initials = 'UN'
        
        if (words.length >= 2) {
          initials = (words[0][0] + words[words.length - 1][0]).toUpperCase()
        } else if (words.length === 1 && words[0].length >= 2) {
          initials = words[0].substring(0, 2).toUpperCase()
        } else if (contact.Name && contact.Name.length >= 2) {
          initials = contact.Name.substring(0, 2).toUpperCase()
        }
        
        console.log(`   ${i + 1}. ${initials} - ${contact.Name} (${contact.Email})`)
      })
    }
  }
  
}).catch(error => {
  console.error("❌ Error:", error.message)
})
