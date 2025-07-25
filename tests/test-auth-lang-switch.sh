#!/bin/bash

echo "🧪 Testing Auth Language Switch Functionality"
echo "=============================================="

# Test 1: Check if auth page loads correctly
echo "📝 Test 1: Loading English auth page..."
response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3001/en/auth/login)
if [ "$response" = "200" ]; then
    echo "✅ English auth page loads successfully"
else
    echo "❌ English auth page failed to load (HTTP $response)"
fi

# Test 2: Check if Arabic auth page loads correctly
echo "📝 Test 2: Loading Arabic auth page..."
response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3001/ar/auth/login)
if [ "$response" = "200" ]; then
    echo "✅ Arabic auth page loads successfully"
else
    echo "❌ Arabic auth page failed to load (HTTP $response)"
fi

# Test 3: Check if language button is present
echo "📝 Test 3: Checking for language button in English page..."
button_check=$(curl -s http://localhost:3001/en/auth/login | grep -o 'globe.*AR' | head -1)
if [ ! -z "$button_check" ]; then
    echo "✅ Language button found: $button_check"
else
    echo "❌ Language button not found"
fi

# Test 4: Check if Arabic page has EN button
echo "📝 Test 4: Checking for language button in Arabic page..."
button_check_ar=$(curl -s http://localhost:3001/ar/auth/login | grep -o 'globe.*EN' | head -1)
if [ ! -z "$button_check_ar" ]; then
    echo "✅ Arabic page has EN button: $button_check_ar"
else
    echo "❌ Arabic page EN button not found"
fi

echo ""
echo "🔍 Manual Testing Instructions:"
echo "1. Open http://localhost:3001/en/auth/login in browser"
echo "2. Open Developer Tools (F12)"
echo "3. Go to Console tab"
echo "4. Click the language button (globe icon + AR)"
echo "5. Check console for debug messages"
echo "6. Verify if page switches to Arabic (/ar/auth/login)"

echo ""
echo "Expected console output when clicking language button:"
echo "🌐 AuthNavigation: Language switch initiated"
echo "🌐 Current locale: en"
echo "🌐 Current pathname: /auth/login"
echo "🌐 Target locale: ar"
echo "🔄 AuthNavigation: Attempting router.push with locale..."
echo "✅ AuthNavigation: router.push completed"
