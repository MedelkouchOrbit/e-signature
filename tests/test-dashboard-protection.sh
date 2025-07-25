#!/bin/bash

echo "🔒 Testing Dashboard Protection"
echo "=============================="

# Start the development server in background
echo "Starting development server..."
npm run dev &
SERVER_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
sleep 10

# Test 1: Clear localStorage and try to access dashboard
echo ""
echo "📋 Test 1: Accessing dashboard without token"
echo "-------------------------------------------"

# Use curl to check if we get redirected or blocked
RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "http://localhost:3001/en/dashboard")
echo "HTTP Response Code: $RESPONSE"

if [ "$RESPONSE" = "200" ]; then
    echo "❌ FAIL: Dashboard accessible without token (should be blocked or redirected)"
else
    echo "✅ PASS: Dashboard properly protected (HTTP $RESPONSE)"
fi

# Test 2: Check what happens in browser (manual test instructions)
echo ""
echo "📋 Test 2: Manual Browser Test"
echo "-----------------------------"
echo "1. Open browser and navigate to: http://localhost:3001/en/dashboard"
echo "2. Open Developer Tools > Application > Local Storage"
echo "3. Clear all localStorage entries"
echo "4. Refresh the page"
echo "5. You should see either:"
echo "   - A loading skeleton that doesn't resolve"
echo "   - Immediate redirect to login page"
echo "   - No dashboard content visible"
echo ""
echo "Expected: No dashboard content should be visible without token"

# Test 3: Login flow test
echo ""
echo "📋 Test 3: Complete Authentication Flow"
echo "--------------------------------------"
echo "1. Navigate to: http://localhost:3001/en/auth/login"
echo "2. Login with valid credentials"
echo "3. Should be redirected to dashboard automatically"
echo "4. Dashboard content should load properly"
echo "5. Check localStorage for session token"

echo ""
echo "🔧 Manual Debug Instructions:"
echo "1. Open browser console"
echo "2. Look for AuthGuard log messages:"
echo "   - 'AuthGuard: No session token found, blocking access immediately'"
echo "   - 'AuthGuard: No session token found in localStorage.'"
echo "3. Check Network tab for any unexpected API calls"

# Cleanup
echo ""
echo "Stopping development server..."
kill $SERVER_PID

echo ""
echo "✅ Test script completed. Please run manual browser tests above."
