#!/usr/bin/env node

// Test script for dynamic assignee functionality
// Tests the getSigners and savecontact OpenSign endpoints

const API_BASE_URL = "http://94.249.71.89:8080/app"
const OPENSIGN_APP_ID = "opensign"

// Session token - we'll extract this from our working authentication
const SESSION_TOKEN = "r:7bfcfaf8a98647027978f93b33c2a42e" // Replace with current valid session

async function testDynamicAssignees() {
  console.log("🧪 Testing Dynamic Assignee Functionality\n")
  
  const headers = {
    "Content-Type": "application/json",
    "X-Parse-Application-Id": OPENSIGN_APP_ID,
    "X-Parse-Session-Token": SESSION_TOKEN,
  }

  console.log("1️⃣ Testing getSigners endpoint (search contacts)...")
  try {
    const response = await fetch(`${API_BASE_URL}/functions/getsigners`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ search: '' }) // Empty search to get all contacts
    })
    
    const data = await response.json()
    
    if (response.ok && data.result) {
      console.log(`✅ getSigners: Found ${data.result.length} contacts`)
      if (data.result.length > 0) {
        console.log("📋 Sample contacts:")
        data.result.slice(0, 3).forEach((contact, i) => {
          console.log(`   ${i + 1}. ${contact.Name} (${contact.Email})`)
        })
      }
    } else {
      console.log(`❌ getSigners failed: ${data.error || response.statusText}`)
    }
  } catch (error) {
    console.log(`❌ getSigners error: ${error.message}`)
  }

  console.log("\n2️⃣ Testing getSigners with search term...")
  try {
    const response = await fetch(`${API_BASE_URL}/functions/getsigners`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ search: 'test' }) // Search for 'test'
    })
    
    const data = await response.json()
    
    if (response.ok && data.result) {
      console.log(`✅ getSigners search: Found ${data.result.length} contacts matching 'test'`)
    } else {
      console.log(`❌ getSigners search failed: ${data.error || response.statusText}`)
    }
  } catch (error) {
    console.log(`❌ getSigners search error: ${error.message}`)
  }

  console.log("\n3️⃣ Testing contacts_Contactbook class (alternative approach)...")
  try {
    const response = await fetch(`${API_BASE_URL}/classes/contracts_Contactbook?limit=5`, {
      method: 'GET',
      headers
    })
    
    const data = await response.json()
    
    if (response.ok && data.results) {
      console.log(`✅ Contactbook class: Found ${data.results.length} contacts`)
      if (data.results.length > 0) {
        console.log("📋 Direct class access contacts:")
        data.results.forEach((contact, i) => {
          console.log(`   ${i + 1}. ${contact.Name || 'No Name'} (${contact.Email || 'No Email'})`)
        })
      }
    } else {
      console.log(`❌ Contactbook class failed: ${data.error || response.statusText}`)
    }
  } catch (error) {
    console.log(`❌ Contactbook class error: ${error.message}`)
  }

  console.log("\n4️⃣ Testing savecontact endpoint (create new contact)...")
  const testContact = {
    name: `Test Contact ${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    phone: "+1234567890"
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/functions/savecontact`, {
      method: 'POST',
      headers,
      body: JSON.stringify(testContact)
    })
    
    const data = await response.json()
    
    if (response.ok && data.result) {
      console.log(`✅ savecontact: Successfully created contact`)
      console.log(`   📝 Name: ${data.result.Name}`)
      console.log(`   📧 Email: ${data.result.Email}`)
      console.log(`   🆔 ID: ${data.result.objectId}`)
    } else {
      console.log(`❌ savecontact failed: ${data.error || response.statusText}`)
      if (data.error && data.error.includes('Contact already exists')) {
        console.log("   ℹ️  This is expected if testing multiple times")
      }
    }
  } catch (error) {
    console.log(`❌ savecontact error: ${error.message}`)
  }

  console.log("\n5️⃣ Testing initials generation...")
  const testContacts = [
    { Name: "John Doe", Email: "john@example.com" },
    { Name: "Sarah Johnson", Email: "sarah@example.com" },
    { Name: "Alex", Email: "alex@example.com" },
    { Name: "María García López", Email: "maria@example.com" }
  ]

  console.log("📝 Initials generation examples:")
  testContacts.forEach(contact => {
    const words = contact.Name.trim().split(/\s+/)
    let initials
    
    if (words.length >= 2) {
      initials = (words[0][0] + words[words.length - 1][0]).toUpperCase()
    } else if (words.length === 1 && words[0].length >= 2) {
      initials = words[0].substring(0, 2).toUpperCase()
    } else {
      initials = contact.Name.substring(0, 2).toUpperCase()
    }
    
    console.log(`   ${contact.Name} → ${initials}`)
  })

  console.log("\n✅ Dynamic assignee functionality testing complete!")
}

// Check if session token is provided
if (!SESSION_TOKEN) {
  console.log("❌ Please set SESSION_TOKEN in the script")
  console.log("   You can get this from localStorage or authentication response")
  process.exit(1)
}

// Run the test
testDynamicAssignees().catch(console.error)
