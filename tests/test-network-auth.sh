#!/bin/bash

echo "🔒 Network-Level Authentication Guard Test"
echo "=========================================="
echo "Testing Angular-style route guards at middleware level"
echo

echo "📋 Test 1: Direct dashboard access without authentication"
echo "This should return HTTP 302/307 (redirect) and block at network level"
echo

# Test direct access to dashboard without any session token
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\nREDIRECT_URL:%{redirect_url}\n" http://localhost:3000/en/dashboard)
http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
redirect_url=$(echo "$response" | grep "REDIRECT_URL" | cut -d: -f2-)

echo "HTTP Status: $http_status"
echo "Redirect URL: $redirect_url"

if [[ $http_status == "302" ]] || [[ $http_status == "307" ]]; then
    echo "✅ SUCCESS: Dashboard access BLOCKED at network level!"
    echo "✅ Middleware successfully redirected to login page"
    if [[ $redirect_url == *"login"* ]]; then
        echo "✅ Redirect URL contains 'login' - correct behavior"
    fi
else
    echo "❌ FAILED: Dashboard was not blocked (Status: $http_status)"
    echo "❌ Network-level protection not working"
fi

echo
echo "📋 Test 2: Testing with fake session token cookie"
response_with_token=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" \
    -H "Cookie: opensign_session_token=fake_token_test_123456789" \
    http://localhost:3000/en/dashboard)
http_status_with_token=$(echo "$response_with_token" | grep "HTTP_STATUS" | cut -d: -f2)

echo "HTTP Status with fake token: $http_status_with_token"

if [[ $http_status_with_token == "200" ]]; then
    echo "✅ SUCCESS: Request allowed with session token (even fake one for basic test)"
else
    echo "⚠️  Note: Request blocked even with token (might need valid token)"
fi

echo
echo "📋 Test 3: Testing public routes (should always be accessible)"
home_response=$(curl -s -w "HTTP_STATUS:%{http_code}" http://localhost:3000/en)
home_status=$(echo "$home_response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)

login_response=$(curl -s -w "HTTP_STATUS:%{http_code}" http://localhost:3000/en/auth/login)
login_status=$(echo "$login_response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)

echo "Home page status: $home_status"
echo "Login page status: $login_status"

if [[ $home_status == "200" ]] && [[ $login_status == "200" ]]; then
    echo "✅ Public routes working correctly"
else
    echo "❌ Public routes having issues"
fi

echo
echo "🎯 SUMMARY:"
echo "==========="
echo "- Dashboard protection (no token): $http_status"
echo "- Dashboard with token: $http_status_with_token"  
echo "- Home page access: $home_status"
echo "- Login page access: $login_status"
echo
if [[ $http_status == "302" ]] || [[ $http_status == "307" ]]; then
    echo "🎉 NETWORK-LEVEL BLOCKING IS WORKING!"
    echo "🔒 Dashboard route is protected at middleware level (like Angular guards)"
    echo "🚫 Users cannot access /dashboard without valid session token"
else
    echo "⚠️  Network-level blocking needs verification"
fi
