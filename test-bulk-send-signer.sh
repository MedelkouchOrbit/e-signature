#!/bin/bash

# Simple Bulk Send Signer Test using curl
# Usage: ./test-bulk-send-signer.sh DOCUMENT_ID

DOCUMENT_ID=$1
API_BASE_URL="http://localhost:3000/api/proxy/opensign"

if [ -z "$DOCUMENT_ID" ]; then
    echo "❌ Please provide a document ID"
    echo "Usage: ./test-bulk-send-signer.sh DOCUMENT_ID"
    exit 1
fi

echo "🧪 Testing Bulk Send Signer Addition"
echo "===================================="
echo "Document ID: $DOCUMENT_ID"
echo "API Base URL: $API_BASE_URL"
echo ""

# Test signer data
SIGNER_NAME="Mohammed Elkouch"
SIGNER_EMAIL="mohammed.elkouch1998@gmail.com"
SIGNER_PHONE="+1234567890"

echo "📋 Step 1: Check document exists and is bulk send..."
echo "GET $API_BASE_URL/classes/contracts_Document/$DOCUMENT_ID?include=Placeholders,Signers"

DOCUMENT_RESPONSE=$(curl -s \
  -X GET \
  -H "Content-Type: application/json" \
  -H "X-Parse-Application-Id: opensign" \
  "$API_BASE_URL/classes/contracts_Document/$DOCUMENT_ID?include=Placeholders,Signers")

echo "Document Response:"
echo "$DOCUMENT_RESPONSE" | jq .

# Check if document name contains "Bulk Send:"
DOCUMENT_NAME=$(echo "$DOCUMENT_RESPONSE" | jq -r '.Name // empty')
if [[ "$DOCUMENT_NAME" == *"Bulk Send:"* ]]; then
    echo "✅ Document is a bulk send document: $DOCUMENT_NAME"
else
    echo "❌ Document is not a bulk send document: $DOCUMENT_NAME"
    exit 1
fi

CURRENT_PLACEHOLDERS=$(echo "$DOCUMENT_RESPONSE" | jq '.Placeholders | length // 0')
CURRENT_SIGNERS=$(echo "$DOCUMENT_RESPONSE" | jq '.Signers | length // 0')
echo "📋 Current placeholders: $CURRENT_PLACEHOLDERS"
echo "📋 Current signers: $CURRENT_SIGNERS"

echo ""
echo "📋 Step 2: Create contact directly..."
echo "POST $API_BASE_URL/classes/contracts_Contactbook"

CONTACT_RESPONSE=$(curl -s \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-Parse-Application-Id: opensign" \
  -d "{
    \"Name\": \"$SIGNER_NAME\",
    \"Email\": \"$SIGNER_EMAIL\",
    \"Phone\": \"$SIGNER_PHONE\"
  }" \
  "$API_BASE_URL/classes/contracts_Contactbook")

echo "Contact Response:"
echo "$CONTACT_RESPONSE" | jq .

# Extract contact ID
CONTACT_ID=$(echo "$CONTACT_RESPONSE" | jq -r '.objectId // empty')
if [ -z "$CONTACT_ID" ]; then
    echo "❌ Failed to create contact"
    exit 1
fi

echo "✅ Contact created: $CONTACT_ID"

echo ""
echo "📋 Step 3: Update document placeholders and signers..."

# Get current arrays
PLACEHOLDERS=$(echo "$DOCUMENT_RESPONSE" | jq '.Placeholders // []')
SIGNERS=$(echo "$DOCUMENT_RESPONSE" | jq '.Signers // []')

# Update existing placeholders that have the signer email but no signerObjId
UPDATED_PLACEHOLDERS=$(echo "$PLACEHOLDERS" | jq --arg email "$SIGNER_EMAIL" --arg contactId "$CONTACT_ID" '
  map(
    if .email == $email and (.signerObjId == "" or .signerObjId == null) then
      . + {
        "signerObjId": $contactId,
        "signerPtr": {
          "__type": "Pointer",
          "className": "contracts_Contactbook",
          "objectId": $contactId
        }
      }
    else
      .
    end
  )
')

# Create new signer
NEW_SIGNER=$(cat << EOF
{
  "__type": "Pointer",
  "className": "contracts_Contactbook",
  "objectId": "$CONTACT_ID"
}
EOF
)

# Add to signers array
UPDATED_SIGNERS=$(echo "$SIGNERS" | jq ". + [$NEW_SIGNER]")

echo "📝 Updating document with:"
echo "  - Placeholders: $(echo "$UPDATED_PLACEHOLDERS" | jq 'length')"
echo "  - Signers: $(echo "$UPDATED_SIGNERS" | jq 'length')"

# Update document
UPDATE_RESPONSE=$(curl -s \
  -X PUT \
  -H "Content-Type: application/json" \
  -H "X-Parse-Application-Id: opensign" \
  -d "{
    \"Placeholders\": $UPDATED_PLACEHOLDERS,
    \"Signers\": $UPDATED_SIGNERS
  }" \
  "$API_BASE_URL/classes/contracts_Document/$DOCUMENT_ID")

echo "Update Response:"
echo "$UPDATE_RESPONSE" | jq .

echo ""
echo "📋 Step 4: Verify the update..."

VERIFICATION_RESPONSE=$(curl -s \
  -X GET \
  -H "Content-Type: application/json" \
  -H "X-Parse-Application-Id: opensign" \
  "$API_BASE_URL/classes/contracts_Document/$DOCUMENT_ID?include=Placeholders,Signers")

FINAL_PLACEHOLDERS=$(echo "$VERIFICATION_RESPONSE" | jq '.Placeholders | length // 0')
FINAL_SIGNERS=$(echo "$VERIFICATION_RESPONSE" | jq '.Signers | length // 0')

echo "📋 Final placeholders: $FINAL_PLACEHOLDERS"
echo "📋 Final signers: $FINAL_SIGNERS"

# Check if our signer is in placeholders
SIGNER_IN_PLACEHOLDERS=$(echo "$VERIFICATION_RESPONSE" | jq -r ".Placeholders[] | select(.email == \"$SIGNER_EMAIL\" and .signerObjId == \"$CONTACT_ID\") | .signerObjId" | head -1)

if [ "$SIGNER_IN_PLACEHOLDERS" = "$CONTACT_ID" ]; then
    echo "✅ Signer found in placeholders with correct contact ID: $CONTACT_ID"
    echo "🎉 Test completed successfully!"
    echo "📧 User $SIGNER_EMAIL should now be able to see this document"
    
    # Show all signers for verification
    echo ""
    echo "📋 All signers in document:"
    echo "$VERIFICATION_RESPONSE" | jq -r '.Placeholders[] | select(.signerObjId != "" and .signerObjId != null) | "  - \(.email): \(.signerObjId)"'
else
    echo "❌ Signer not found in placeholders or contact ID mismatch"
    echo "Expected: $CONTACT_ID"
    echo "Found: $SIGNER_IN_PLACEHOLDERS"
fi
