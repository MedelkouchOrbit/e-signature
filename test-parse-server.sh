#!/bin/bash

echo "Testing Parse Server mount paths on port 9000..."

# Test different mount paths
for path in "/1" "/parse" "/api" "/app" "/parse/api" "/api/1" ""; do
    echo "Testing mount path: $path"
    response=$(curl -s -m 3 "http://94.249.71.89:9000${path}/classes/contracts_Template" \
        -H "X-Parse-Application-Id: opensign" 2>&1)
    
    # Check if response contains HTML or JSON
    if echo "$response" | grep -q "DOCTYPE html"; then
        echo "  ❌ HTML response (frontend)"
    elif echo "$response" | grep -q "code"; then
        echo "  ✅ Parse Server API found! (API response)"
        echo "  Response: $response"
        echo ""
        echo "Testing functions endpoint..."
        func_response=$(curl -s -m 3 "http://94.249.71.89:9000${path}/functions/getReport" \
            -H "X-Parse-Application-Id: opensign" \
            -H "Content-Type: application/json" \
            -X POST \
            -d '{"reportId": "6TeaPr321t", "limit": 1}' 2>&1)
        echo "  Functions response: $func_response"
        break
    else
        echo "  ❓ Other response: $response"
    fi
done
