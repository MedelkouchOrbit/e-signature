#!/usr/bin/env node

/**
 * Simple test script for bulk send signer functionality
 * Usage: node test-bulk-send-signer.mjs DOCUMENT_ID
 */

import { openSignApiService } from './app/lib/api-service.js'

const DOCUMENT_ID = process.argv[2]
const TEST_SIGNER = {
  name: 'Mohammed Elkouch',
  email: 'mohammed.elkouch1998@gmail.com',
  phone: '+1234567890'
}

if (!DOCUMENT_ID) {
  console.log('❌ Please provide a document ID')
  console.log('Usage: node test-bulk-send-signer.mjs DOCUMENT_ID')
  process.exit(1)
}

console.log('🧪 Testing Bulk Send Signer Addition')
console.log('=====================================')
console.log('Document ID:', DOCUMENT_ID)
console.log('Test Signer:', TEST_SIGNER)
console.log('')

async function testBulkSendSigner() {
  try {
    // Step 1: Check document
    console.log('📋 Step 1: Checking document...')
    const document = await openSignApiService.get(`classes/contracts_Document/${DOCUMENT_ID}?include=Placeholders,Signers`)
    
    if (!document) {
      console.log('❌ Document not found')
      return
    }

    const isBulkSend = document.Name?.includes('Bulk Send:')
    console.log(`✅ Document found: "${document.Name}"`)
    console.log(`📋 Type: ${isBulkSend ? 'Bulk Send' : 'Regular'} document`)
    console.log(`📋 Current placeholders: ${document.Placeholders?.length || 0}`)
    console.log(`📋 Current signers: ${document.Signers?.length || 0}`)
    
    if (!isBulkSend) {
      console.log('❌ This is not a bulk send document')
      return
    }

    // Step 2: Create contact
    console.log('\n📋 Step 2: Creating contact...')
    const contactResponse = await openSignApiService.post('functions/savecontact', {
      name: TEST_SIGNER.name,
      email: TEST_SIGNER.email.toLowerCase().trim(),
      phone: TEST_SIGNER.phone
    })

    if (contactResponse.error || !contactResponse.result?.objectId) {
      console.log('❌ Failed to create contact:', contactResponse.error)
      return
    }

    const contactId = contactResponse.result.objectId
    console.log('✅ Contact created:', contactId)

    // Step 3: Update placeholders and signers
    console.log('\n📋 Step 3: Updating placeholders and signers...')
    const placeholders = document.Placeholders || []
    const signers = document.Signers || []

    // Find empty slot or add new one
    let targetIndex = placeholders.findIndex(p => !p.signerObjId && !p.email)
    
    if (targetIndex === -1) {
      targetIndex = placeholders.length
      placeholders.push({
        id: `placeholder-${Date.now()}`,
        email: TEST_SIGNER.email,
        Role: 'signer',
        signerRole: 'signer',
        order: targetIndex + 1
      })
    }

    // Update placeholder
    placeholders[targetIndex] = {
      ...placeholders[targetIndex],
      email: TEST_SIGNER.email,
      signerObjId: contactId,
      signerPtr: {
        __type: 'Pointer',
        className: 'contracts_Contactbook',
        objectId: contactId
      }
    }

    // Add to signers
    const signerObj = {
      __type: 'Pointer',
      className: 'contracts_Contactbook',
      objectId: contactId
    }
    signers.splice(targetIndex, 0, signerObj)

    console.log('📝 Will update:')
    console.log('  - Placeholders:', placeholders.length)
    console.log('  - Signers:', signers.length)
    console.log('  - Target index:', targetIndex)

    // Step 4: Save document
    console.log('\n📋 Step 4: Saving document...')
    await openSignApiService.put(`classes/contracts_Document/${DOCUMENT_ID}`, {
      Placeholders: placeholders,
      Signers: signers
    })

    console.log('✅ Document updated successfully!')
    
    // Step 5: Verify
    console.log('\n📋 Step 5: Verifying changes...')
    const updatedDoc = await openSignApiService.get(`classes/contracts_Document/${DOCUMENT_ID}?include=Placeholders,Signers`)
    console.log(`📋 Updated placeholders: ${updatedDoc.Placeholders?.length || 0}`)
    console.log(`📋 Updated signers: ${updatedDoc.Signers?.length || 0}`)
    
    // Check if our signer is in placeholders
    const ourPlaceholder = updatedDoc.Placeholders?.find(p => p.email === TEST_SIGNER.email)
    if (ourPlaceholder) {
      console.log('✅ Signer found in placeholders:', {
        email: ourPlaceholder.email,
        signerObjId: ourPlaceholder.signerObjId,
        hasSignerPtr: !!ourPlaceholder.signerPtr
      })
    } else {
      console.log('❌ Signer not found in placeholders')
    }

    console.log('\n🎉 Test completed successfully!')
    console.log('📧 User', TEST_SIGNER.email, 'should now be able to see this document')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    if (error.response) {
      console.error('Response:', error.response.data)
    }
  }
}

// Run the test
testBulkSendSigner()
