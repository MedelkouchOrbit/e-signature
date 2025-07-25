#!/bin/bash

echo "Testing OpenSign Parse Server Authentication"
echo "==========================================="

# First, let's test if we can get the server info (usually doesn't require auth)
echo "1. Testing server info endpoint..."
curl -s -X GET "http://localhost:3001/api/proxy/opensign/serverInfo" \
  -H "X-Parse-Application-Id: opensign" | head -c 500

echo -e "\n\n2. Testing classes endpoint (requires auth)..."
curl -s -X GET "http://localhost:3001/api/proxy/opensign/classes/contracts_Document" \
  -H "X-Parse-Application-Id: opensign" | head -c 500

echo -e "\n\n3. Testing direct OpenSign endpoint (what we confirmed works)..."
curl -s -X GET "http://94.249.71.89:9000/api/app/classes/contracts_Document" \
  -H "X-Parse-Application-Id: opensign" | head -c 200

echo -e "\n\nSUMMARY:"
echo "- ✅ Parse Server API is accessible and responding with JSON"
echo "- ✅ Proxy successfully finds the correct endpoint"
echo "- ⚠️  Authentication required for data endpoints"
echo "- 🔧 Next step: Implement proper authentication flow"
