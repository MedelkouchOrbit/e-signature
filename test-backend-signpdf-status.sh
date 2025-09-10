#!/bin/bash

# Test script to verify backend signPdf status updates and signing order
# Run this after the backend team implements the requirements

echo "🧪 Testing Backend signPdf Status Updates and Signing Order"
echo "==========================================================="

# Configuration
BASE_URL="http://localhost:3000/api/proxy/opensign"
SESSION_TOKEN="r:cb552b4c0b21281759308cfbd99f9898"
DOC_ID="avtOApfK8d"
USER_ID="4apCqg38VG"

# Test signature data (base64 encoded signature)
SIGNATURE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAXNSR0IArs4c6QAA"

# Test PDF content (truncated for brevity)
PDF_CONTENT="JVBERi0xLjQKJeTjz9IKMyAwIG9iago8PC9UeXBlIC9QYWdlCi9QYXJlbnQgMSAwIFIK"

echo "📋 Test 1: Check document status BEFORE signing"
echo "----------------------------------------------"
curl -s "${BASE_URL}/classes/contracts_Document/${DOC_ID}" \
  -H "X-Parse-Application-Id: opensign" \
  -H "X-Parse-Session-Token: ${SESSION_TOKEN}" | \
  jq '.IsCompleted, .Status, .Placeholders[].status' 2>/dev/null || echo "❌ Failed to get document status"

echo -e "\n🖋️  Test 2: Perform signing operation"
echo "------------------------------------"
SIGN_RESPONSE=$(curl -s "${BASE_URL}/functions/signPdf" \
  -H "Content-Type: application/json" \
  -H "X-Parse-Application-Id: opensign" \
  -H "X-Parse-Session-Token: ${SESSION_TOKEN}" \
  --data '{
    "docId":"'${DOC_ID}'",
    "userId":"'${USER_ID}'",
    "signature":"'${SIGNATURE}'",
    "pdfFile":"'${PDF_CONTENT}'"
  }')

echo "Sign Response: $SIGN_RESPONSE" | jq '.' 2>/dev/null || echo "Response: $SIGN_RESPONSE"

echo -e "\n✅ Test 3: Verify status updates AFTER signing"
echo "----------------------------------------------"
AFTER_STATUS=$(curl -s "${BASE_URL}/classes/contracts_Document/${DOC_ID}" \
  -H "X-Parse-Application-Id: opensign" \
  -H "X-Parse-Session-Token: ${SESSION_TOKEN}")

echo "Document status after signing:"
echo "$AFTER_STATUS" | jq '{
  IsCompleted: .IsCompleted,
  Status: .Status,
  SendinOrder: .SendinOrder,
  placeholderStatuses: [.Placeholders[]? | {email: .email, status: .status, signedAt: .signedAt}]
}' 2>/dev/null || echo "❌ Failed to parse response"

echo -e "\n🔄 Test 4: Test signing order validation (if SendinOrder=true)"
echo "------------------------------------------------------------"
# This test would require a different user trying to sign out of order
echo "To test signing order:"
echo "1. Create document with SendinOrder: true"
echo "2. Have first signer sign successfully"
echo "3. Try to have third signer sign before second"
echo "4. Should return error about signing order"

echo -e "\n📊 Test 5: Verify frontend document list refresh"
echo "-----------------------------------------------"
curl -s "${BASE_URL}/functions/getmydocuments" \
  -H "Content-Type: application/json" \
  -H "X-Parse-Application-Id: opensign" \
  -H "X-Parse-Session-Token: ${SESSION_TOKEN}" \
  --data '{"status": "all"}' | \
  jq '.result[] | select(.objectId == "'${DOC_ID}'") | {name: .Name, status: .Status, isCompleted: .IsCompleted}' 2>/dev/null || echo "❌ Failed to get document list"

echo -e "\n🎯 Backend Requirements Checklist:"
echo "=================================="
echo "□ IsCompleted field updated to true when all signers complete"
echo "□ Status field set to 'signed' when document fully signed"
echo "□ Placeholders[].status updated to 'signed' for current signer"
echo "□ Placeholders[].signedAt timestamp added"
echo "□ SendinOrder validation prevents out-of-order signing"
echo "□ Clear error messages for invalid signing attempts"
echo "□ Updated document returned in response"

echo -e "\n💡 Next Steps:"
echo "============="
echo "1. Backend team implements status update logic in signPdf function"
echo "2. Test with this script to verify implementation"
echo "3. Frontend will automatically show updated statuses"
echo "4. Test signing order with multiple users"
