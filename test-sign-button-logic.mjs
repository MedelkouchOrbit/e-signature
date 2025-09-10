// Test script to verify sign button logic
console.log('🧪 Testing Sign Button Logic...\n')

// Mock document data to test different scenarios
const testDocuments = [
  {
    name: "Test Document 1 - No Order",
    objectId: "doc1",
    status: "waiting",
    SendinOrder: false,
    signers: [
      { id: "1", email: "admin@test.com", status: "waiting", order: 1, userId: "user1" },
      { id: "2", email: "joe@joe.com", status: "waiting", order: 2, userId: "user2" }
    ],
    createdBy: { id: "creator1", email: "admin@test.com" }
  },
  {
    name: "Test Document 2 - With Order",
    objectId: "doc2", 
    status: "waiting",
    SendinOrder: true,
    signers: [
      { id: "1", email: "admin@test.com", status: "signed", order: 1, userId: "user1" },
      { id: "2", email: "joe@joe.com", status: "waiting", order: 2, userId: "user2" },
      { id: "3", email: "jane@test.com", status: "waiting", order: 3, userId: "user3" }
    ],
    createdBy: { id: "creator1", email: "admin@test.com" }
  },
  {
    name: "Test Document 3 - Order Not Ready",
    objectId: "doc3",
    status: "waiting", 
    SendinOrder: true,
    signers: [
      { id: "1", email: "admin@test.com", status: "waiting", order: 1, userId: "user1" },
      { id: "2", email: "joe@joe.com", status: "waiting", order: 2, userId: "user2" }
    ],
    createdBy: { id: "creator1", email: "admin@test.com" }
  }
]

// Mock current users to test with
const testUsers = [
  { userId: "user1", email: "admin@test.com", name: "Admin User" },
  { userId: "user2", email: "joe@joe.com", name: "Joe User" },
  { userId: "user3", email: "jane@test.com", name: "Jane User" }
]

// Function to simulate the canUserSign logic
function checkCanUserSign(document, currentUser) {
  const { userId, email } = currentUser
  
  // Find user signer by ID first, then by email
  let userSigner = document.signers.find(s => s.userId === userId)
  if (!userSigner) {
    userSigner = document.signers.find(s => s.email === email)
  }
  
  if (!userSigner || userSigner.status !== 'waiting' || document.status !== 'waiting') {
    return false
  }
  
  if (document.SendinOrder && userSigner.order) {
    // Check if all previous signers have signed
    const previousSigners = document.signers.filter(s => s.order && s.order < userSigner.order)
    return previousSigners.every(s => s.status === 'signed')
  }
  
  return true
}

// Test each scenario
testUsers.forEach(user => {
  console.log(`📋 Testing for user: ${user.name} (${user.email})`)
  console.log('=' .repeat(50))
  
  testDocuments.forEach(doc => {
    const canSign = checkCanUserSign(doc, user)
    const userSigner = doc.signers.find(s => s.userId === user.userId || s.email === user.email)
    const isCreator = doc.createdBy.email === user.email
    
    console.log(`📄 ${doc.name}`)
    console.log(`   SendInOrder: ${doc.SendinOrder}`)
    console.log(`   User is creator: ${isCreator}`)
    console.log(`   User is signer: ${!!userSigner}`)
    if (userSigner) {
      console.log(`   Signer order: ${userSigner.order}, status: ${userSigner.status}`)
    }
    console.log(`   ✅ Can sign: ${canSign}`)
    console.log(`   🎯 Should show Sign button: ${canSign && !isCreator}`)
    console.log('')
  })
  
  console.log('')
})

console.log('✅ Test completed!')
