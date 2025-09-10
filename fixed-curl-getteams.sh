#!/bin/bash

echo "🔧 Fixed curl command with fresh admin session token:"
echo ""

# Get fresh token first
echo "curl 'http://localhost:3000/api/proxy/opensign/functions/getteams' \\"
echo "  -H 'Accept: */*' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'X-Parse-Application-Id: opensign' \\"
echo "  -H 'X-Parse-Session-Token: r:070d7a08eb51c47d38d0c10d18e4b695' \\"
echo "  --data-raw '{\"active\":true}'"

echo ""
echo "🎯 The key changes:"
echo "1. ✅ Use fresh session token: r:070d7a08eb51c47d38d0c10d18e4b695"
echo "2. ✅ Remove the cookie header (not needed with X-Parse-Session-Token)"
echo "3. ✅ Keep the X-Parse-Application-Id header"
echo ""
echo "📊 Expected result: Teams data with 2 teams (test, Admin Team)"
