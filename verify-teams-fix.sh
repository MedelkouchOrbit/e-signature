#!/bin/bash

echo "🔧 Verifying Teams page fix..."
echo ""

# Check if development server is running
echo "1. Checking development server..."
DEV_SERVER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")

if [ "$DEV_SERVER_STATUS" = "200" ] || [ "$DEV_SERVER_STATUS" = "307" ]; then
    echo "✅ Development server is running"
else
    echo "❌ Development server not running (status: $DEV_SERVER_STATUS)"
    echo "💡 Please run: npm run dev"
    exit 1
fi

echo ""
echo "2. Testing the Teams API directly..."

# Test the API endpoint directly with POST
TEAMS_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/proxy/opensign/1/functions/getteams" \
  -H "Content-Type: application/json" \
  -H "X-Parse-Application-Id: opensign" \
  -H "X-Parse-Session-Token: r:01735791c43b8e2954da0f884d5f575e" \
  -d '{"active": true}' \
  --connect-timeout 10 --max-time 30)

echo "API Response: $TEAMS_RESPONSE"

if echo "$TEAMS_RESPONSE" | grep -q '"result"'; then
    echo "✅ Teams API is working correctly"
    TEAM_COUNT=$(echo "$TEAMS_RESPONSE" | grep -o '"objectId"' | wc -l)
    echo "📊 Found $TEAM_COUNT teams"
else
    echo "❌ Teams API returned unexpected response"
fi

echo ""
echo "3. Instructions for browser testing:"
echo "   - Open: http://localhost:3000/en/team"
echo "   - Open Developer Tools (F12)"
echo "   - Check Console tab for debug logs"
echo "   - Look for logs starting with 🔄, 🔑, 📊, etc."
echo ""
echo "4. If you still see 400 errors in the browser:"
echo "   - Open Console and run this command:"
echo "   localStorage.setItem('opensign_session_token', 'r:01735791c43b8e2954da0f884d5f575e'); location.reload();"
echo ""
echo "✅ Verification complete!"
