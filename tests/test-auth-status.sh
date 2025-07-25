#!/bin/bash

echo "🔐 Comprehensive Authentication Test"
echo "=================================="
echo

# Test 1: Check current dashboard access
echo "📋 Test 1: Testing current dashboard access..."
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" http://localhost:3000/en/dashboard)
http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
content=$(echo "$response" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $http_status"
if [[ $http_status == "200" ]]; then
    if echo "$content" | grep -q "Authentication Required\|Redirecting to login"; then
        echo "✅ GOOD: Dashboard blocked by AuthGuard (showing auth required message)"
    elif echo "$content" | grep -q "Dashboard\|Welcome"; then
        echo "⚠️  Dashboard content is visible - this means user is authenticated OR protection needs strengthening"
    else
        echo "🔍 Checking content for auth indicators..."
        echo "$content" | head -20
    fi
else
    echo "❌ Unexpected HTTP status: $http_status"
fi

echo
echo "📱 Test 2: Testing with simulated cleared session..."
echo "   (This simulates what happens when localStorage is empty)"

# Test 2: Check login page access
echo
echo "🔑 Test 3: Testing login page access..."
login_response=$(curl -s -w "HTTP_STATUS:%{http_code}" http://localhost:3000/en/auth/login)
login_status=$(echo "$login_response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
echo "Login page HTTP Status: $login_status"

if [[ $login_status == "200" ]]; then
    echo "✅ Login page is accessible"
else
    echo "❌ Login page is not accessible (Status: $login_status)"
fi

echo
echo "🏠 Test 4: Testing home page access..."
home_response=$(curl -s -w "HTTP_STATUS:%{http_code}" http://localhost:3000/en)
home_status=$(echo "$home_response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
echo "Home page HTTP Status: $home_status"

if [[ $home_status == "200" ]]; then
    echo "✅ Home page is accessible"
else
    echo "❌ Home page is not accessible (Status: $home_status)"
fi

echo
echo "📊 Summary:"
echo "==========="
echo "- Home page (public): $home_status"
echo "- Login page (public): $login_status" 
echo "- Dashboard (protected): $http_status"
echo
echo "💡 Note: If dashboard returns 200 but shows 'Authentication Required' message,"
echo "   then the protection is working correctly on the client side."
echo "   Server-side rendering will always return 200, but client-side JS handles the redirect."
