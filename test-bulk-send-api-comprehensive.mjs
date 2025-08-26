#!/usr/bin/env node

// Test script for Bulk Send API endpoints
import { bulkSendApiService } from './app/lib/bulk-send-api-service.js';
import { templatesApiService } from './app/lib/templates-api-service.js';

// Test configuration
const TEST_CONFIG = {
  sessionToken: 'r:4ef4c84786275cc27b05a6d0c03e42a8', // Update this with a valid session token
  testSigners: [
    {
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'signer',
      order: 1
    },
    {
      name: 'Jane Smith', 
      email: 'jane.smith@example.com',
      role: 'signer',
      order: 2
    }
  ]
};

// Set session token in localStorage (for Node.js testing)
if (typeof global !== 'undefined') {
  global.localStorage = {
    getItem: (key) => {
      if (key === 'opensign_session_token') {
        return TEST_CONFIG.sessionToken;
      }
      return null;
    },
    setItem: (key, value) => {
      // Mock implementation
    },
    removeItem: (key) => {
      // Mock implementation
    }
  };
}

async function testBulkSendAPI() {
  console.log('🧪 Testing Bulk Send API Endpoints...\n');
  
  let createdBulkSendId = null;
  let testTemplateId = null;

  try {
    // Step 1: Get available templates
    console.log('📋 Step 1: Getting available templates...');
    const templatesResponse = await templatesApiService.getTemplates();
    console.log(`✅ Found ${templatesResponse.results.length} templates`);
    
    if (templatesResponse.results.length === 0) {
      console.log('❌ No templates available. Please create a template first.');
      return;
    }
    
    testTemplateId = templatesResponse.results[0].id;
    console.log(`📄 Using template: ${templatesResponse.results[0].name} (ID: ${testTemplateId})`);

    // Step 2: Test getBulkSends (should be empty initially)
    console.log('\n📊 Step 2: Getting existing bulk sends...');
    const initialBulkSends = await bulkSendApiService.getBulkSends();
    console.log(`✅ Found ${initialBulkSends.results.length} existing bulk sends`);
    console.log(`📈 Total count: ${initialBulkSends.count}`);

    // Step 3: Create a new bulk send
    console.log('\n➕ Step 3: Creating new bulk send...');
    const newBulkSendData = {
      templateId: testTemplateId,
      name: `Test Bulk Send - ${new Date().toLocaleString()}`,
      signers: TEST_CONFIG.testSigners,
      sendInOrder: true,
      message: 'This is a test bulk send created by the API test script.'
    };

    const createdBulkSend = await bulkSendApiService.createBulkSend(newBulkSendData);
    createdBulkSendId = createdBulkSend.id;
    console.log(`✅ Created bulk send: ${createdBulkSend.name}`);
    console.log(`🆔 ID: ${createdBulkSend.id}`);
    console.log(`📊 Status: ${createdBulkSend.status}`);
    console.log(`👥 Total recipients: ${createdBulkSend.totalRecipients}`);
    console.log(`🔄 Send in order: ${createdBulkSend.sendInOrder}`);

    // Step 4: Get bulk sends again (should include the new one)
    console.log('\n📊 Step 4: Getting bulk sends after creation...');
    const updatedBulkSends = await bulkSendApiService.getBulkSends();
    console.log(`✅ Now found ${updatedBulkSends.results.length} bulk sends`);
    
    const ourBulkSend = updatedBulkSends.results.find(bs => bs.id === createdBulkSendId);
    if (ourBulkSend) {
      console.log(`✅ Our bulk send found in list: ${ourBulkSend.name}`);
    } else {
      console.log('⚠️ Our bulk send not found in list yet (may take time to sync)');
    }

    // Step 5: Get single bulk send details
    console.log('\n🔍 Step 5: Getting single bulk send details...');
    const singleBulkSend = await bulkSendApiService.getBulkSend(createdBulkSendId);
    console.log(`✅ Retrieved bulk send: ${singleBulkSend.name}`);
    console.log(`📄 Template: ${singleBulkSend.templateName}`);
    console.log(`👥 Signers: ${singleBulkSend.signers.length}`);
    singleBulkSend.signers.forEach((signer, index) => {
      console.log(`   ${index + 1}. ${signer.name} (${signer.email}) - ${signer.status}`);
    });

    // Step 6: Test search functionality
    console.log('\n🔍 Step 6: Testing search functionality...');
    const searchResults = await bulkSendApiService.getBulkSends(10, 0, 'Test Bulk Send');
    console.log(`✅ Search found ${searchResults.results.length} bulk sends with 'Test Bulk Send'`);

    // Step 7: Send the bulk send
    console.log('\n📤 Step 7: Sending bulk send...');
    await bulkSendApiService.sendBulkSend(createdBulkSendId);
    console.log('✅ Bulk send initiated successfully');

    // Step 8: Check status after sending
    console.log('\n📊 Step 8: Checking status after sending...');
    const sentBulkSend = await bulkSendApiService.getBulkSend(createdBulkSendId);
    console.log(`📊 Status: ${sentBulkSend.status}`);
    console.log(`📤 Sent count: ${sentBulkSend.sentCount}`);
    console.log(`✅ Completed count: ${sentBulkSend.completedCount}`);

    // Step 9: Test pagination
    console.log('\n📄 Step 9: Testing pagination...');
    const paginatedResults = await bulkSendApiService.getBulkSends(1, 0);
    console.log(`✅ Page 1: ${paginatedResults.results.length} results`);
    if (paginatedResults.results.length > 0) {
      const nextPage = await bulkSendApiService.getBulkSends(1, 1);
      console.log(`✅ Page 2: ${nextPage.results.length} results`);
    }

    console.log('\n🎉 All bulk send tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    
    // Print more details if it's an API error
    if (error.response) {
      console.error('API Response:', error.response);
    }
  } finally {
    // Cleanup: Delete the test bulk send if it was created
    if (createdBulkSendId) {
      try {
        console.log(`\n🗑️ Cleanup: Deleting test bulk send ${createdBulkSendId}...`);
        await bulkSendApiService.deleteBulkSend(createdBulkSendId);
        console.log('✅ Test bulk send deleted successfully');
      } catch (cleanupError) {
        console.error('⚠️ Failed to cleanup test bulk send:', cleanupError.message);
      }
    }
  }
}

// Run the test
console.log('🚀 Starting Bulk Send API Tests...\n');
testBulkSendAPI().catch(console.error);
