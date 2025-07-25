#!/bin/bash

echo "Testing OpenSign Server Connectivity"
echo "===================================="

# Test direct connection to OpenSign server
echo "1. Testing direct HTTP connection to OpenSign server..."
curl -X GET \
  "http://94.249.71.89:9000" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s --connect-timeout 10 | head -20

echo ""
echo "2. Testing OpenSign Parse Server app endpoint..."
curl -X GET \
  "http://94.249.71.89:9000/app" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s --connect-timeout 10 | head -20

echo ""
echo "3. Testing Parse Server classes endpoint..."
curl -X GET \
  "http://94.249.71.89:9000/app/classes/contracts_Document?limit=1" \
  -H "X-Parse-Application-Id: opensign" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s --connect-timeout 10 | head -20

echo ""
echo "4. Testing proxy endpoint (requires dev server to be running)..."
curl -X GET \
  "http://localhost:3000/api/proxy/opensign/classes/contracts_Document?limit=1" \
  -H "X-Parse-Application-Id: opensign" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s --connect-timeout 5 | head -20

echo ""
echo "Troubleshooting Info:"
echo "- If direct OpenSign connection fails, check if the server is running"
echo "- If Parse Server endpoint fails, verify the mount path and app ID"
echo "- If proxy fails, make sure 'npm run dev' is running"
