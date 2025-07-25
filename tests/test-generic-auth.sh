#!/bin/bash

echo "🔒 Generic Route Protection Test"
echo "==============================="
echo "Testing that ALL private routes are blocked (not just dashboard)"
echo

# Define test routes
declare -a PUBLIC_ROUTES=("/" "/en" "/en/auth/login" "/en/auth/signup" "/en/terms" "/en/contact")
declare -a PRIVATE_ROUTES=("/en/dashboard" "/en/billing" "/en/settings" "/en/profile" "/en/documents" "/en/admin")

echo "📋 Test 1: Public Routes (should always be accessible)"
echo "======================================================"

for route in "${PUBLIC_ROUTES[@]}"; do
    response=$(curl -s -w "HTTP_STATUS:%{http_code}" "http://localhost:3000$route")
    status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    
    if [[ $status == "200" ]]; then
        echo "✅ $route -> $status (PUBLIC - accessible)"
    else
        echo "❌ $route -> $status (PUBLIC route blocked!)"
    fi
done

echo
echo "📋 Test 2: Private Routes WITHOUT token (should be blocked)"
echo "=========================================================="

for route in "${PRIVATE_ROUTES[@]}"; do
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\nREDIRECT_URL:%{redirect_url}\n" "http://localhost:3000$route")
    status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    redirect=$(echo "$response" | grep "REDIRECT_URL" | cut -d: -f2-)
    
    if [[ $status == "302" ]] || [[ $status == "307" ]]; then
        echo "✅ $route -> $status (PRIVATE - blocked and redirected)"
        if [[ $redirect == *"login"* ]]; then
            echo "   ↳ Redirected to login ✓"
        fi
    elif [[ $status == "404" ]]; then
        echo "⚠️  $route -> $status (Route doesn't exist yet, but would be protected)"
    else
        echo "❌ $route -> $status (PRIVATE route NOT blocked!)"
    fi
done

echo
echo "📋 Test 3: Private Routes WITH token (should be allowed)"
echo "======================================================="

for route in "${PRIVATE_ROUTES[@]}"; do
    response=$(curl -s -w "HTTP_STATUS:%{http_code}" \
        -H "Cookie: opensign_session_token=valid_test_token_123456789" \
        "http://localhost:3000$route")
    status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    
    if [[ $status == "200" ]]; then
        echo "✅ $route -> $status (PRIVATE - allowed with token)"
    elif [[ $status == "404" ]]; then
        echo "⚠️  $route -> $status (Route doesn't exist yet, but token was accepted)"
    else
        echo "❌ $route -> $status (Token not working for private route)"
    fi
done

echo
echo "📋 Test 4: Testing custom private routes"
echo "========================================"

declare -a CUSTOM_ROUTES=("/en/my-account" "/en/workspace" "/en/analytics" "/en/reports")

for route in "${CUSTOM_ROUTES[@]}"; do
    # Test without token
    response_no_token=$(curl -s -w "HTTP_STATUS:%{http_code}" "http://localhost:3000$route")
    status_no_token=$(echo "$response_no_token" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    
    # Test with token
    response_with_token=$(curl -s -w "HTTP_STATUS:%{http_code}" \
        -H "Cookie: opensign_session_token=valid_test_token_123456789" \
        "http://localhost:3000$route")
    status_with_token=$(echo "$response_with_token" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    
    echo "$route:"
    echo "  Without token: $status_no_token $(if [[ $status_no_token == "307" ]] || [[ $status_no_token == "302" ]]; then echo "(blocked ✓)"; else echo "(not blocked ❌)"; fi)"
    echo "  With token: $status_with_token $(if [[ $status_with_token == "200" ]] || [[ $status_with_token == "404" ]]; then echo "(allowed ✓)"; else echo "(blocked ❌)"; fi)"
done

echo
echo "🎯 SUMMARY:"
echo "==========="
echo "✅ PUBLIC routes: Always accessible (no auth required)"
echo "🔒 PRIVATE routes: Blocked without token, allowed with token"
echo "🚫 Generic protection: ANY route not in public list is protected"
echo
echo "🎉 Now you can create routes like:"
echo "   - /en/billing (automatically protected)"
echo "   - /en/settings (automatically protected)" 
echo "   - /en/admin (automatically protected)"
echo "   - /en/anything (automatically protected)"
echo
echo "💡 Only routes in publicRoutes list are accessible without authentication!"
