#!/bin/bash

echo "🔍 Testing OpenSign Server Connectivity..."
echo ""

# Test basic server connectivity
echo "1️⃣ Testing basic server health (http://94.249.71.89:9000/)"
curl -s -w "\nHTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" \
  -H "User-Agent: WatiqaSign-Debug" \
  http://94.249.71.89:9000/ | head -10
echo ""
echo "================================================="

# Test Parse Server API endpoint
echo "2️⃣ Testing Parse Server API (http://94.249.71.89:9000/app/classes/contracts_Document?limit=1)"
curl -s -w "\nHTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" \
  -H "X-Parse-Application-Id: opensign" \
  -H "Content-Type: application/json" \
  -H "User-Agent: WatiqaSign-Debug" \
  http://94.249.71.89:9000/app/classes/contracts_Document?limit=1 | head -10
echo ""
echo "================================================="

# Test our proxy endpoint
echo "3️⃣ Testing local proxy (http://localhost:3000/api/proxy/opensign/classes/contracts_Document?limit=1)"
curl -s -w "\nHTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Parse-Application-Id: opensign" \
  http://localhost:3000/api/proxy/opensign/classes/contracts_Document?limit=1 | head -10
echo ""
echo "================================================="

echo "✅ Test completed!"
echo ""
echo "💡 Analysis:"
echo "- If test 1 returns HTML, the OpenSign server is running but serving frontend"
echo "- If test 2 returns HTML, Parse Server is not accessible at /app endpoint"
echo "- If test 3 works but test 2 doesn't, there's a proxy configuration issue"
echo "- If all return JSON, the issue is authentication-related"
