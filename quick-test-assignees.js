#!/usr/bin/env node

// Quick test for getSigners endpoint
const API_BASE_URL = "http://94.249.71.89:8080/app"
const OPENSIGN_APP_ID = "opensign"
const SESSION_TOKEN = "r:7bfcfaf8a98647027978f93b33c2a42e"

async function quickTest() {
  console.log("🔍 Testing getSigners endpoint...")
  
  try {
    const response = await fetch(`${API_BASE_URL}/functions/getsigners`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "X-Parse-Application-Id": OPENSIGN_APP_ID,
        "X-Parse-Session-Token": SESSION_TOKEN,
      },
      body: JSON.stringify({ search: '' })
    })
    
    const data = await response.json()
    
    console.log("Response status:", response.status)
    console.log("Response data:", JSON.stringify(data, null, 2))
    
    if (data.result && Array.isArray(data.result)) {
      console.log(`✅ Found ${data.result.length} contacts`)
      
      // Test initials generation
      data.result.slice(0, 3).forEach(contact => {
        const words = contact.Name?.trim().split(/\s+/) || []
        let initials = 'UN'
        
        if (words.length >= 2) {
          initials = (words[0][0] + words[words.length - 1][0]).toUpperCase()
        } else if (words.length === 1 && words[0].length >= 2) {
          initials = words[0].substring(0, 2).toUpperCase()
        } else if (contact.Name && contact.Name.length >= 2) {
          initials = contact.Name.substring(0, 2).toUpperCase()
        }
        
        console.log(`   ${contact.Name} (${contact.Email}) → ${initials}`)
      })
    }
    
  } catch (error) {
    console.error("Error:", error.message)
  }
}

quickTest()
