#!/bin/bash

echo "🔍 Session Token Debugging Script"
echo "=================================="

# First, let's try to authenticate and get a fresh session token
OPENSIGN_BASE_URL="http://94.249.71.89:8080"
APP_ID="opensign"

# Try different endpoints to find working authentication
echo "🔐 Attempting authentication..."

for mount_path in "/app" "/1" "/api/1" "/parse/1" "/parse" "/api" ""; do
    login_url="${OPENSIGN_BASE_URL}${mount_path}/login"
    echo "Trying login at: $login_url"
    
    response=$(curl -s -X POST "$login_url" \
        -H "Content-Type: application/json" \
        -H "X-Parse-Application-Id: $APP_ID" \
        -d '{
            "username": "test@example.com",
            "password": "password123"
        }' 2>/dev/null)
    
    echo "Response: $response"
    
    # Check if we got a session token
    session_token=$(echo "$response" | jq -r '.sessionToken?' 2>/dev/null)
    if [ "$session_token" != "null" ] && [ "$session_token" != "" ]; then
        echo "✅ Found session token: $session_token"
        
        # Test the token immediately
        echo "🧪 Testing session token..."
        test_response=$(curl -s -X POST "http://localhost:3000/api/proxy/opensign/functions/getReport" \
            -H "Content-Type: application/json" \
            -H "X-Parse-Application-Id: opensign" \
            -H "X-Parse-Session-Token: $session_token" \
            -d '{
                "reportId": "6TeaPr321t",
                "limit": 1,
                "skip": 0,
                "searchTerm": ""
            }')
        
        echo "Test response: $test_response"
        exit 0
    fi
done

echo "❌ Could not authenticate with test credentials"
echo ""
echo "📋 Next steps:"
echo "1. Check your OpenSign instance credentials"
echo "2. Get session token from browser developer tools:"
echo "   - Open browser developer tools (F12)"
echo "   - Go to Application/Storage tab"
echo "   - Check Local Storage for opensign_session_token"
echo "   - Or check Network tab for X-Parse-Session-Token header"
echo "3. Update the session token in the test script"

# Try to get session token from the proxy endpoint itself
echo ""
echo "🔄 Testing proxy authentication..."
proxy_response=$(curl -s -X GET "http://localhost:3000/api/proxy/opensign/users/me" \
    -H "Content-Type: application/json" \
    -H "X-Parse-Application-Id: opensign")

echo "Proxy response: $proxy_response"
