#!/bin/bash

# Backend Team: Run this to test if your Parse Server API is working

echo "🔍 Testing OpenSign Parse Server API..."
echo "======================================"

# Test 1: Login endpoint
echo ""
echo "🧪 Test 1: Login API endpoint"
echo "URL: http://94.249.71.89:9000/1/login"
response=$(curl -s -H "X-Parse-Application-Id: opensign" -H "Content-Type: application/json" \
  -d '{"username":"joe@joe.com","password":"Meticx12@"}' \
  http://94.249.71.89:9000/1/login)

if [[ $response == *"<!DOCTYPE html>"* ]]; then
    echo "❌ FAILED: Returns HTML frontend (not API)"
    echo "🔧 FIX: Mount Parse Server on /1 path"
elif [[ $response == *"sessionToken"* ]]; then
    echo "✅ SUCCESS: API working correctly"
else
    echo "⚠️  Response: $response"
fi

# Test 2: Classes endpoint  
echo ""
echo "🧪 Test 2: Classes API endpoint"
echo "URL: http://94.249.71.89:9000/1/classes/contracts_Document"
response=$(curl -s -H "X-Parse-Application-Id: opensign" \
  http://94.249.71.89:9000/1/classes/contracts_Document)

if [[ $response == *"<!DOCTYPE html>"* ]]; then
    echo "❌ FAILED: Returns HTML frontend (not API)"
    echo "🔧 FIX: Mount Parse Server on /1 path"
elif [[ $response == *"results"* ]] || [[ $response == *"error"* ]]; then
    echo "✅ SUCCESS: API working correctly"
else
    echo "⚠️  Response: $response"
fi

echo ""
echo "======================================"
echo "📝 If tests FAILED, add this to your server.js:"
echo "   app.use('/1', parseServerAPI);"
echo "   app.use('/', express.static('public'));"
echo ""
echo "🧪 After fixing, run this script again to verify"
echo "📞 Contact frontend team when tests show SUCCESS"
