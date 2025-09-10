#!/bin/bash

echo "🔐 Getting fresh admin session token..."

# Get fresh admin token
TOKEN_RESPONSE=$(curl -s 'http://94.249.71.89:9000/1/login' \
  -H 'Content-Type: application/json' \
  -H 'X-Parse-Application-Id: opensign' \
  --data-raw '{"username":"admin@admin.com","password":"admin@123"}')

# Extract token using basic text manipulation (works on macOS)
TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"sessionToken":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo "✅ Fresh admin token obtained:"
    echo "$TOKEN"
    echo ""
    echo "🔧 Use this token in your API requests:"
    echo "X-Parse-Session-Token: $TOKEN"
    echo ""
    echo "📋 Ready-to-use curl command:"
    echo "curl 'http://localhost:3000/api/proxy/opensign/functions/getteams' \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -H 'X-Parse-Application-Id: opensign' \\"
    echo "  -H 'X-Parse-Session-Token: $TOKEN' \\"
    echo "  --data-raw '{\"active\":true}'"
else
    echo "❌ Failed to get token. Response:"
    echo "$TOKEN_RESPONSE"
fi
