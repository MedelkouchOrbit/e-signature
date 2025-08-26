#!/bin/bash

# Test PDF Signing Workflow with Real Document
# This script demonstrates the complete workflow

echo "🚀 Testing OpenSign PDF Workflow..."
echo "======================================"

# Use the correct port (server is running on 3001)
BASE_URL="http://localhost:3001"
SESSION_TOKEN="r:20fec308b4ae76427abe4377e4941561"

echo ""
echo "Step 1: Upload a PDF document..."
echo "--------------------------------"

# Create a simple test PDF in base64 format
TEST_PDF_BASE64="JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPJ4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgo3MiA3MjAgVGQKKFRlc3QgUERGIGZvciBTaWduaW5nKSBUagpFVApzdHJlYW0KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDc0IDAwMDAwIG4gCjAwMDAwMDAxMjAgMDAwMDAgbiAKMDAwMDAwMDI5MSAwMDAwMCBuIAowMDAwMDAwMzY4IDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNgovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDg2CiUlRU9G"

# Upload the PDF document
UPLOAD_RESPONSE=$(curl -s "${BASE_URL}/api/proxy/opensign/functions/base64fileupload" \
  -H 'Accept: */*' \
  -H 'Content-Type: application/json' \
  -H "X-Parse-Application-Id: opensign" \
  -H "X-Parse-Session-Token: ${SESSION_TOKEN}" \
  -b "opensign_session_token=${SESSION_TOKEN}" \
  --data-raw "{
    \"fileBase64\": \"${TEST_PDF_BASE64}\",
    \"fileName\": \"test-document-$(date +%s).pdf\",
    \"mimeType\": \"application/pdf\"
  }")

echo "Upload Response:"
echo "$UPLOAD_RESPONSE" | jq '.' 2>/dev/null || echo "$UPLOAD_RESPONSE"

# Extract file URL from upload response
FILE_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.result.fileUrl // .fileUrl // empty' 2>/dev/null)

if [ -z "$FILE_URL" ] || [ "$FILE_URL" = "null" ]; then
    echo "❌ Failed to upload PDF. Response:"
    echo "$UPLOAD_RESPONSE"
    exit 1
fi

echo ""
echo "✅ PDF uploaded successfully!"
echo "File URL: $FILE_URL"

echo ""
echo "Step 2: Create document record..."
echo "--------------------------------"

# Create document record in OpenSign
DOC_RESPONSE=$(curl -s "${BASE_URL}/api/proxy/opensign/classes/contracts_Document" \
  -H 'Accept: */*' \
  -H 'Content-Type: application/json' \
  -H "X-Parse-Application-Id: opensign" \
  -H "X-Parse-Session-Token: ${SESSION_TOKEN}" \
  -b "opensign_session_token=${SESSION_TOKEN}" \
  --data-raw "{
    \"Name\": \"Test Document $(date +%s)\",
    \"URL\": \"${FILE_URL}\",
    \"Type\": \"application/pdf\",
    \"IsCompleted\": false,
    \"IsDraft\": false
  }")

echo "Document Creation Response:"
echo "$DOC_RESPONSE" | jq '.' 2>/dev/null || echo "$DOC_RESPONSE"

# Extract document ID
DOC_ID=$(echo "$DOC_RESPONSE" | jq -r '.objectId // .result.objectId // empty' 2>/dev/null)

if [ -z "$DOC_ID" ] || [ "$DOC_ID" = "null" ]; then
    echo "❌ Failed to create document. Response:"
    echo "$DOC_RESPONSE"
    exit 1
fi

echo ""
echo "✅ Document created successfully!"
echo "Document ID: $DOC_ID"

echo ""
echo "Step 3: Sign the PDF document..."
echo "--------------------------------"

# Now sign the PDF with the real document ID
SIGN_RESPONSE=$(curl -s "${BASE_URL}/api/proxy/opensign/functions/signPdf" \
  -H 'Accept: */*' \
  -H 'Content-Type: application/json' \
  -H "X-Parse-Application-Id: opensign" \
  -H "X-Parse-Session-Token: ${SESSION_TOKEN}" \
  -b "opensign_session_token=${SESSION_TOKEN}" \
  --data-raw "{
    \"docId\": \"${DOC_ID}\",
    \"signaturePositions\": [{
      \"x\": 200,
      \"y\": 300,
      \"width\": 150,
      \"height\": 50,
      \"page\": 1,
      \"id\": \"signature-$(date +%s)-0.123\"
    }],
    \"signerDetails\": {
      \"name\": \"Test User\",
      \"email\": \"test@example.com\"
    },
    \"signerInfo\": {
      \"name\": \"Test User\",
      \"email\": \"test@example.com\"
    }
  }")

echo "Signing Response:"
echo "$SIGN_RESPONSE" | jq '.' 2>/dev/null || echo "$SIGN_RESPONSE"

if echo "$SIGN_RESPONSE" | grep -q "error"; then
    echo ""
    echo "❌ Signing failed. Check the response above."
    exit 1
else
    echo ""
    echo "✅ PDF signed successfully!"
    echo ""
    echo "🎉 Complete workflow test successful!"
    echo "You can now use Document ID: $DOC_ID for further operations"
fi

echo ""
echo "======================================"
echo "✅ Test completed!"
