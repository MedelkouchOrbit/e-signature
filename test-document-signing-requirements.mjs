#!/usr/bin/env node

/**
 * 🖊️ DOCUMENT SIGNING IMPLEMENTATION TEST & BACKEND REQUIREMENTS
 * 
 * This test demonstrates the current document signing flow and identifies
 * what the backend team needs to implement for proper signature functionality.
 * 
 * CURRENT USER: joe@joe.com needs to sign document GQPB5IAUV1
 */

import { readFileSync } from 'fs';
import fetch from 'node-fetch';

// Simple env loader
function loadEnv() {
  try {
    const envContent = readFileSync('.env.local', 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...values] = line.split('=');
        if (key && values.length) {
          envVars[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
    return envVars;
  } catch (error) {
    console.log('No .env.local file found, using defaults');
    return {};
  }
}

const env = loadEnv();
const BASE_URL = 'http://localhost:3000/api/proxy/opensign';
const DOCUMENT_ID = 'GQPB5IAUV1'; // The document from the screenshot
const SIGNER_EMAIL = 'joe@joe.com'; // The user who needs to sign
const SESSION_TOKEN = 'r:fc16b73c981e796f56d4bab8de6cc628'; // From the user's curl

console.log('🖊️ DOCUMENT SIGNING IMPLEMENTATION TEST');
console.log('=====================================\n');

async function analyzeBinaryFileInsertion() {
  console.log('📄 BINARY FILE SIGNATURE INSERTION ANALYSIS');
  console.log('-------------------------------------------\n');
  
  console.log('🎯 REQUIREMENT: Insert signature token into PDF binary file');
  console.log('Current frontend approach:');
  console.log('1. User enters name: "joe"');
  console.log('2. Frontend calls signPdf endpoint with:');
  console.log('   - documentId: GQPB5IAUV1');
  console.log('   - signatureData: { positions, signerInfo }');
  console.log('3. Backend needs to:');
  console.log('   a) Validate user can sign (order, status, permissions)');
  console.log('   b) Insert signature into PDF binary at specified coordinates');
  console.log('   c) Update document status and signer status');
  console.log('   d) Return updated document');
  console.log('');
  
  console.log('📋 SIGNATURE DATA STRUCTURE:');
  console.log(JSON.stringify({
    documentId: DOCUMENT_ID,
    signatureData: {
      positions: [{
        x: 100,        // X coordinate on PDF page
        y: 100,        // Y coordinate on PDF page  
        width: 150,    // Signature width in points
        height: 50,    // Signature height in points
        page: 1        // Page number (1-based)
      }],
      signerInfo: {
        name: 'joe',
        email: SIGNER_EMAIL
      }
    }
  }, null, 2));
  console.log('');
}

async function testSigningOrder() {
  console.log('📝 SIGNING ORDER & VALIDATION TEST');
  console.log('----------------------------------\n');
  
  try {
    // Get document to check signing order
    const response = await fetch(`${BASE_URL}/classes/contracts_Document/${DOCUMENT_ID}?include=Signers,Placeholders`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': SESSION_TOKEN
      }
    });

    if (!response.ok) {
      console.error('❌ Failed to get document:', response.status);
      return;
    }

    const document = await response.json();
    console.log('📄 Document Name:', document.Name);
    console.log('📄 Document Status:', document.Status);
    console.log('📄 Signers Count:', document.Signers?.length || 0);
    console.log('📄 Send in Order:', document.SendInOrder || false);
    
    if (document.Signers && document.Signers.length > 0) {
      console.log('\n👥 SIGNERS LIST:');
      document.Signers.forEach((signer, index) => {
        const isCurrentUser = signer.email === SIGNER_EMAIL || signer.Email === SIGNER_EMAIL;
        console.log(`${index + 1}. ${signer.name || signer.Name || 'Unknown'} <${signer.email || signer.Email}>`);
        console.log(`   - Status: ${signer.status || signer.Status || 'Unknown'}`);
        console.log(`   - Order: ${signer.order || signer.Order || 'None'}`);
        console.log(`   - Can Sign: ${isCurrentUser ? '✅ YES (Current User)' : '❌ Not current user'}`);
        console.log('');
      });
      
      // Check if joe@joe.com can sign
      const joeSigner = document.Signers.find(s => 
        (s.email === SIGNER_EMAIL || s.Email === SIGNER_EMAIL)
      );
      
      if (joeSigner) {
        console.log('🎯 SIGNING VALIDATION FOR joe@joe.com:');
        console.log(`✅ Found in signers list`);
        console.log(`📋 Status: ${joeSigner.status || joeSigner.Status}`);
        console.log(`📋 Order: ${joeSigner.order || joeSigner.Order || 'None'}`);
        
        const canSign = (joeSigner.status === 'waiting' || joeSigner.Status === 'waiting') && 
                       (document.Status === 'waiting');
        console.log(`📋 Can Sign: ${canSign ? '✅ YES' : '❌ NO'}`);
        
        if (document.SendInOrder) {
          console.log('⚠️ ORDERED SIGNING ENABLED - Need to check previous signers');
        }
      } else {
        console.log('❌ joe@joe.com NOT FOUND in signers list');
        console.log('🔧 Backend needs to add joe@joe.com as a signer first');
      }
    }
    
  } catch (error) {
    console.error('💥 Error checking signing order:', error.message);
  }
}

async function testCurrentSignPdfEndpoint() {
  console.log('\n🔧 TESTING CURRENT signPdf ENDPOINT');
  console.log('-----------------------------------\n');
  
  try {
    console.log('📤 Calling signPdf endpoint...');
    
    const signatureData = {
      documentId: DOCUMENT_ID,
      signatureData: {
        positions: [{
          x: 100,
          y: 100, 
          width: 150,
          height: 50,
          page: 1
        }],
        signerInfo: {
          name: 'joe',
          email: SIGNER_EMAIL
        }
      }
    };
    
    console.log('📝 Signature payload:', JSON.stringify(signatureData, null, 2));
    
    const response = await fetch(`${BASE_URL}/functions/signPdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': SESSION_TOKEN
      },
      body: JSON.stringify(signatureData)
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ signPdf endpoint responded successfully');
      console.log('📄 Response:', JSON.stringify(result, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ signPdf endpoint failed');
      console.log('📄 Error response:', errorText);
    }
    
  } catch (error) {
    console.error('💥 Error testing signPdf endpoint:', error.message);
  }
}

async function generateBackendRequirements() {
  console.log('\n📋 BACKEND TEAM REQUIREMENTS');
  console.log('============================\n');
  
  console.log('🎯 **IMMEDIATE TASKS FOR BACKEND TEAM:**\n');
  
  console.log('1. **VERIFY signPdf ENDPOINT EXISTS**');
  console.log('   - Path: /functions/signPdf');
  console.log('   - Method: POST');
  console.log('   - Expected payload structure (see above)');
  console.log('');
  
  console.log('2. **IMPLEMENT SIGNATURE BINARY INSERTION**');
  console.log('   - Get original PDF binary from Minio storage');
  console.log('   - Insert signature token/image at specified coordinates');
  console.log('   - Use PDF manipulation library (pdf-lib, PyPDF2, etc.)');
  console.log('   - Save updated PDF back to storage');
  console.log('');
  
  console.log('3. **IMPLEMENT SIGNING ORDER VALIDATION**');
  console.log('   - Check if document.SendInOrder is true');
  console.log('   - If true, validate all previous signers have signed');
  console.log('   - Only allow current signer if their turn');
  console.log('   - Example: If order is [A=1, B=2, C=3], B can only sign after A');
  console.log('');
  
  console.log('4. **UPDATE DOCUMENT & SIGNER STATUS**');
  console.log('   - Change signer status from "waiting" to "signed"');
  console.log('   - Add signed timestamp');
  console.log('   - If all signers complete, change document status to "completed"');
  console.log('   - Send notifications to next signer (if ordered signing)');
  console.log('');
  
  console.log('5. **BACKEND SYSTEM SEARCH TASKS**');
  console.log('   - Search for existing PDF manipulation utilities');
  console.log('   - Check how signatures are currently stored/managed');
  console.log('   - Identify signature token/image generation system');
  console.log('   - Review notification system for signing order');
  console.log('');
  
  console.log('📞 **QUESTIONS FOR BACKEND TEAM:**');
  console.log('1. Does signPdf endpoint already exist? What does it currently do?');
  console.log('2. How are signatures stored? (Image files, drawn paths, text tokens?)');
  console.log('3. What PDF manipulation library is currently used?');
  console.log('4. How is signing order currently enforced?');
  console.log('5. Are there existing notification systems for signers?');
  console.log('');
  
  console.log('🔧 **TESTING ENDPOINTS:**');
  console.log(`- Document: ${BASE_URL}/classes/contracts_Document/${DOCUMENT_ID}`);
  console.log(`- Sign PDF: ${BASE_URL}/functions/signPdf`);
  console.log(`- Test User: ${SIGNER_EMAIL}`);
  console.log(`- Session Token: ${SESSION_TOKEN}`);
}

// Run all tests
async function runSigningAnalysis() {
  await analyzeBinaryFileInsertion();
  await testSigningOrder();
  await testCurrentSignPdfEndpoint();
  await generateBackendRequirements();
  
  console.log('\n🎉 ANALYSIS COMPLETE!');
  console.log('📧 Please share this output with the backend team');
  console.log('🔧 Frontend is ready - waiting for backend implementation');
}

runSigningAnalysis();
