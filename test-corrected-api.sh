#!/bin/bash

echo "🎯 FINAL VERIFICATION: Testing your exact API with the correct token"
echo ""

echo "✅ Using your VALID cookie token: r:01735791c43b8e2954da0f884d5f575e"
echo "❌ NOT using your EXPIRED header token: r:af90807d45364664e3707e4fe9a1a99c"
echo ""

echo "🧪 Testing the corrected curl command..."
echo ""

curl 'http://localhost:3000/api/proxy/opensign/functions/getteams' \
  -H 'Content-Type: application/json' \
  -H 'X-Parse-Application-Id: opensign' \
  -H 'X-Parse-Session-Token: r:01735791c43b8e2954da0f884d5f575e' \
  --data-raw '{"active":true}' \
  --max-time 10 \
  --connect-timeout 5 \
  --silent \
  --show-error \
  --write-out "\n\nHTTP Status: %{http_code}\nTime: %{time_total}s\n" \
  || echo "❌ Request failed - check if Next.js dev server is running"

echo ""
echo "💡 If this works, your API is 100% functional!"
echo "💡 If it still fails, restart your dev server: npm run dev"
