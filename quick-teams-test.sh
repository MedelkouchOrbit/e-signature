#!/bin/bash

echo "🔍 Testing your Teams page with current setup..."
echo ""

# Test 1: Check if your dev server is responding
echo "1. Testing dev server availability..."
curl -s -o /dev/null -w "HTTP %{http_code} in %{time_total}s" http://localhost:3000/en/team || echo "❌ Dev server not accessible"
echo ""

# Test 2: Test the API proxy with the working token
echo "2. Testing API proxy with working token..."
curl -X POST 'http://localhost:3000/api/proxy/opensign/functions/getteams' \
  -H 'Content-Type: application/json' \
  -H 'X-Parse-Application-Id: opensign' \
  -H 'X-Parse-Session-Token: r:01735791c43b8e2954da0f884d5f575e' \
  --data-raw '{"active":true}' \
  --max-time 10 \
  --silent \
  --write-out "\nHTTP Status: %{http_code}\n" || echo "❌ API proxy test failed"

echo ""
echo "💡 Next steps:"
echo "1. Open your Teams page: http://localhost:3000/en/team"
echo "2. Open Developer Tools (F12)"
echo "3. Check Console for debug logs from the updated components"
echo "4. If you still see 400 errors, run this command in browser console:"
echo ""
echo "localStorage.setItem('opensign_session_token', 'r:01735791c43b8e2954da0f884d5f575e'); location.reload();"
echo ""
