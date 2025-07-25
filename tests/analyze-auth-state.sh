#!/bin/bash

echo "🔍 Detailed Authentication Analysis"
echo "=================================="
echo

echo "📱 Testing dashboard content to understand current auth state..."
response=$(curl -s http://localhost:3000/en/dashboard)

echo "🔍 Checking for authentication indicators in response..."

if echo "$response" | grep -q "Authentication Required"; then
    echo "✅ PERFECT: AuthGuard is blocking access (showing 'Authentication Required')"
elif echo "$response" | grep -q "Redirecting to login"; then
    echo "✅ PERFECT: AuthGuard is redirecting to login"
elif echo "$response" | grep -q "Access Denied"; then
    echo "✅ PERFECT: AuthGuard is denying access"
elif echo "$response" | grep -q "Dashboard\|Welcome\|Documents\|Templates"; then
    echo "⚠️  Dashboard content IS visible - this means:"
    echo "   1. You have a valid session token in localStorage, OR"
    echo "   2. The auth protection needs adjustment"
    
    echo
    echo "🔍 Let's analyze what content is being served..."
    echo "First 10 lines of response:"
    echo "$response" | head -10
    echo "..."
    echo "Looking for specific dashboard elements:"
    
    if echo "$response" | grep -q -i "document\|template\|contact\|user"; then
        echo "   📋 Found dashboard-specific content (documents, templates, etc.)"
        echo "   💡 This suggests you currently HAVE a valid session token"
    fi
    
    if echo "$response" | grep -q -i "loading\|skeleton"; then
        echo "   ⏳ Found loading/skeleton content"
        echo "   💡 This suggests authentication check is in progress"
    fi
    
else
    echo "🤔 Unclear response content. Let's examine it:"
    echo "Response length: $(echo "$response" | wc -c) characters"
    echo "First 20 lines:"
    echo "$response" | head -20
fi

echo
echo "🔧 To test the authentication protection, try these steps:"
echo "1. Open your browser to http://localhost:3000/en/dashboard"
echo "2. Open DevTools (F12) → Application → Local Storage"
echo "3. Look for 'opensign_session_token' key"
echo "4. Delete that key if it exists"
echo "5. Refresh the page - it should redirect to login immediately"
echo
echo "🎯 Expected behavior:"
echo "   - WITH token: Dashboard content loads"
echo "   - WITHOUT token: Immediate redirect to /en/auth/login"
