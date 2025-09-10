#!/usr/bin/env node

/**
 * Comprehensive test for enhanced backend integration
 * Tests the new signPdf function with status updates and enhanced response format
 */

const BASE_URL = 'http://94.249.71.89:9000';
const SESSION_TOKEN = 'r:cb552b4c0b21281759308cfbd99f9898';

// Test document we know exists
const TEST_DOC_ID = 'avtOApfK8d';
const TEST_USER_ID = '4apCqg38VG'; 
const TEST_EMAIL = 'joe@joe.com';

// Sample signature data
const SAMPLE_SIGNATURE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAXNSR0IArs4c6Q';

console.log('🧪 Testing Enhanced Backend Integration');
console.log('======================================\n');

/**
 * Get document before signing to verify initial state
 */
async function getDocumentBefore() {
  console.log('📋 Getting document status BEFORE signing...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/app/classes/contracts_Document/${TEST_DOC_ID}?include=Placeholders`, {
      method: 'GET',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': SESSION_TOKEN,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('📊 Document BEFORE signing:');
    console.log(`   Status: ${data.Status || 'unknown'}`);
    console.log(`   IsCompleted: ${data.IsCompleted || false}`);
    console.log(`   Placeholders count: ${data.Placeholders?.length || 0}`);
    
    if (data.Placeholders && data.Placeholders.length > 0) {
      console.log('   Placeholder status:');
      data.Placeholders.forEach((p, i) => {
        console.log(`     ${i + 1}. ${p.email}: ${p.status || 'no status'} ${p.signedAt ? `(signed: ${p.signedAt})` : ''}`);
      });
    }
    
    console.log('');
    return data;
    
  } catch (error) {
    console.error('❌ Failed to get document before:', error.message);
    return null;
  }
}

/**
 * Test the enhanced signPdf function
 */
async function testSignPdf() {
  console.log('✍️  Testing signPdf function with enhanced response...');
  
  try {
    // First get PDF content (required by signPdf)
    const pdfResponse = await fetch(`${BASE_URL}/api/app/functions/getfilecontent`, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': SESSION_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        docId: TEST_DOC_ID
      })
    });

    if (!pdfResponse.ok) {
      throw new Error(`PDF fetch failed: ${pdfResponse.status}`);
    }

    const pdfData = await pdfResponse.json();
    const pdfContent = pdfData.result?.content || pdfData.result?.fileContent;
    
    if (!pdfContent) {
      throw new Error('No PDF content found');
    }

    console.log('   ✅ PDF content retrieved successfully');

    // Now test the enhanced signPdf function
    console.log('   📝 Calling enhanced signPdf...');
    
    const signResponse = await fetch(`${BASE_URL}/api/app/functions/signPdf`, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': SESSION_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        docId: TEST_DOC_ID,
        userId: TEST_USER_ID,
        signature: SAMPLE_SIGNATURE,
        pdfFile: pdfContent
      })
    });

    if (!signResponse.ok) {
      const errorText = await signResponse.text();
      throw new Error(`SignPdf failed: ${signResponse.status} - ${errorText}`);
    }

    const signData = await signResponse.json();
    
    console.log('🎉 SignPdf Response Analysis:');
    console.log('============================');
    console.log(`   Status: ${signData.status || 'unknown'}`);
    console.log(`   Code: ${signData.code || 'none'}`);
    console.log(`   Message: ${signData.message || 'none'}`);
    
    if (signData.data) {
      console.log('   Enhanced Data:');
      console.log(`     Document ID: ${signData.data.documentId || 'none'}`);
      console.log(`     New Status: ${signData.data.newStatus || 'none'}`);
      console.log(`     Signed URL: ${signData.data.signedUrl || 'none'}`);
      
      if (signData.data.signedPlaceholder) {
        console.log('     Signed Placeholder:');
        console.log(`       ID: ${signData.data.signedPlaceholder.id}`);
        console.log(`       Email: ${signData.data.signedPlaceholder.email}`);
        console.log(`       Signed At: ${signData.data.signedPlaceholder.signedAt}`);
        console.log(`       Type: ${signData.data.signedPlaceholder.type}`);
      }
      
      if (signData.data.remainingSigners) {
        console.log(`     Remaining Signers: ${signData.data.remainingSigners.length}`);
        signData.data.remainingSigners.forEach(signer => {
          console.log(`       - ${signer}`);
        });
      }
    }
    
    if (signData.document) {
      console.log('   Updated Document:');
      console.log(`     Status: ${signData.document.Status}`);
      console.log(`     IsCompleted: ${signData.document.IsCompleted}`);
      console.log(`     SignedUrl: ${signData.document.SignedUrl || 'none'}`);
    }
    
    console.log('');
    return signData;
    
  } catch (error) {
    console.error('❌ SignPdf test failed:', error.message);
    return null;
  }
}

/**
 * Get document after signing to verify changes
 */
async function getDocumentAfter() {
  console.log('📋 Getting document status AFTER signing...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/app/classes/contracts_Document/${TEST_DOC_ID}?include=Placeholders`, {
      method: 'GET',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': SESSION_TOKEN,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('📊 Document AFTER signing:');
    console.log(`   Status: ${data.Status || 'unknown'}`);
    console.log(`   IsCompleted: ${data.IsCompleted || false}`);
    console.log(`   SignedUrl: ${data.SignedUrl || 'none'}`);
    console.log(`   Last Updated: ${data.updatedAt}`);
    
    if (data.Placeholders && data.Placeholders.length > 0) {
      console.log('   Placeholder status:');
      data.Placeholders.forEach((p, i) => {
        console.log(`     ${i + 1}. ${p.email}: ${p.status || 'no status'}`);
        if (p.signedAt) console.log(`        Signed at: ${p.signedAt}`);
        if (p.signerObjId) console.log(`        Signer ID: ${p.signerObjId}`);
        if (p.signedUrl) console.log(`        Signed URL: ${p.signedUrl}`);
        if (p.ipAddress) console.log(`        IP: ${p.ipAddress}`);
      });
    }
    
    console.log('');
    return data;
    
  } catch (error) {
    console.error('❌ Failed to get document after:', error.message);
    return null;
  }
}

/**
 * Verify the implementation meets requirements
 */
function verifyRequirements(before, signResponse, after) {
  console.log('✅ Requirement Verification:');
  console.log('============================');
  
  const checks = [
    {
      name: 'Document Status Updated',
      condition: after?.Status !== before?.Status,
      expected: 'Status should change from waiting → signed',
      actual: `${before?.Status || 'unknown'} → ${after?.Status || 'unknown'}`
    },
    {
      name: 'IsCompleted Field Set', 
      condition: after?.IsCompleted === true,
      expected: 'IsCompleted should be true',
      actual: `IsCompleted: ${after?.IsCompleted}`
    },
    {
      name: 'Enhanced Response Format',
      condition: signResponse?.status && signResponse?.data && signResponse?.document,
      expected: 'Response should have status, data, and document fields',
      actual: `Has: ${Object.keys(signResponse || {}).join(', ')}`
    },
    {
      name: 'Placeholder Status Tracking',
      condition: after?.Placeholders?.some(p => p.status === 'signed'),
      expected: 'At least one placeholder should have status: "signed"',
      actual: `Placeholder statuses: ${after?.Placeholders?.map(p => p.status).join(', ') || 'none'}`
    },
    {
      name: 'SignedAt Timestamp',
      condition: after?.Placeholders?.some(p => p.signedAt),
      expected: 'Signed placeholders should have signedAt timestamp',
      actual: `Timestamps: ${after?.Placeholders?.filter(p => p.signedAt).length || 0} found`
    },
    {
      name: 'Signer ID Tracking',
      condition: after?.Placeholders?.some(p => p.signerObjId),
      expected: 'Signed placeholders should have signerObjId',
      actual: `Signer IDs: ${after?.Placeholders?.filter(p => p.signerObjId).length || 0} found`
    }
  ];
  
  let passCount = 0;
  checks.forEach(check => {
    const status = check.condition ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${status} ${check.name}`);
    console.log(`      Expected: ${check.expected}`);
    console.log(`      Actual: ${check.actual}`);
    console.log('');
    
    if (check.condition) passCount++;
  });
  
  console.log(`🎯 Overall Result: ${passCount}/${checks.length} checks passed`);
  
  if (passCount === checks.length) {
    console.log('🎉 ALL REQUIREMENTS MET! Backend integration is working perfectly!');
  } else {
    console.log('⚠️  Some requirements not met. Backend may need additional fixes.');
  }
  
  return passCount === checks.length;
}

/**
 * Main test execution
 */
async function runTests() {
  console.log(`🔧 Testing with document: ${TEST_DOC_ID}`);
  console.log(`👤 User: ${TEST_EMAIL} (ID: ${TEST_USER_ID})`);
  console.log('');
  
  const before = await getDocumentBefore();
  const signResponse = await testSignPdf();
  const after = await getDocumentAfter();
  
  if (before && after) {
    const success = verifyRequirements(before, signResponse, after);
    
    console.log('\n🏁 Test Complete!');
    console.log('==================');
    
    if (success) {
      console.log('✅ Enhanced backend integration is working perfectly!');
      console.log('✅ Frontend can now receive proper status updates');
      console.log('✅ Document signing workflow is production-ready');
    } else {
      console.log('❌ Some issues detected in backend implementation');
      console.log('❌ Frontend integration may have issues');
    }
  } else {
    console.log('❌ Test failed - could not retrieve document data');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Test execution failed:', error.message);
  process.exit(1);
});
