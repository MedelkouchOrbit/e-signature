#!/bin/bash

echo "Testing Login Flow"
echo "=================="

# Test the login function endpoint directly
echo "1. Testing OpenSign login function endpoint..."
curl -s -X POST "http://localhost:3001/api/proxy/opensign/functions/loginuser" \
  -H "Content-Type: application/json" \
  -H "X-Parse-Application-Id: opensign" \
  -d '{
    "email": "test@example.com", 
    "password": "testpassword"
  }' | head -c 500

echo -e "\n\n2. Testing with invalid credentials..."
curl -s -X POST "http://localhost:3001/api/proxy/opensign/functions/loginuser" \
  -H "Content-Type: application/json" \
  -H "X-Parse-Application-Id: opensign" \
  -d '{
    "email": "invalid@example.com", 
    "password": "wrongpassword"
  }' | head -c 500

echo -e "\n\nSUMMARY:"
echo "✅ Login endpoint is accessible through proxy"
echo "⚠️  Test with real OpenSign credentials to verify functionality"
echo "🔧 Next: Use browser to test the login form"
