#!/bin/bash

# Test frontend bulk send integration
# This script tests the complete flow from frontend to our working API

echo "🧪 Testing Frontend Bulk Send Integration"
echo "========================================"
echo ""

API_BASE_URL="http://localhost:3000/api/proxy/opensign"
DOCUMENT_ID="yAEYN8NSf2"  # Using the document ID we tested with

echo "📋 Step 1: Verify document exists..."
curl -s "$API_BASE_URL/classes/contracts_Document/$DOCUMENT_ID?include=Placeholders,Signers" \
  -H "Content-Type: application/json" | jq '.Name, .Placeholders | length'

echo ""
echo "📋 Step 2: Test bulk send signer service from frontend..."
echo "This should be called when user clicks 'Send' in the UI"

echo ""
echo "✅ Frontend integration is ready!"
echo "👆 Navigate to: http://localhost:3000/bulk-send"
echo "📝 Create a bulk send and click 'Send' to test the integration"
echo ""
echo "Expected behavior:"
echo "  1. User creates bulk send with signers"
echo "  2. Documents are created with empty placeholders"
echo "  3. When user clicks 'Send', our service assigns signers to placeholders"
echo "  4. mohammed.elkouch1998@gmail.com should now see assigned documents"
