#!/bin/bash

echo "🔍 Port and Configuration Testing..."
echo ""

# Test different ports
for port in 8080 9000 3000; do
  echo "Testing port $port..."
  
  # Test basic connectivity
  echo "  Basic health check:"
  curl -s -m 5 -w "    HTTP Status: %{http_code} | Time: %{time_total}s\n" \
    http://94.249.71.89:$port/ > /dev/null 2>&1
  
  # Test API endpoint
  echo "  API endpoint test:"
  curl -s -m 5 -w "    HTTP Status: %{http_code} | Time: %{time_total}s\n" \
    -H "X-Parse-Application-Id: opensign" \
    -H "Content-Type: application/json" \
    http://94.249.71.89:$port/app/classes/contracts_Document?limit=1 > /dev/null 2>&1
  
  echo ""
done

echo "================================================="
echo "🔍 Testing localhost (in case it's only accessible locally)..."

for port in 8080 9000; do
  echo "Testing localhost:$port..."
  
  # Test basic connectivity
  echo "  Basic health check:"
  curl -s -m 5 -w "    HTTP Status: %{http_code} | Time: %{time_total}s\n" \
    http://localhost:$port/ > /dev/null 2>&1
  
  # Test API endpoint  
  echo "  API endpoint test:"
  curl -s -m 5 -w "    HTTP Status: %{http_code} | Time: %{time_total}s\n" \
    -H "X-Parse-Application-Id: opensign" \
    -H "Content-Type: application/json" \
    http://localhost:$port/app/classes/contracts_Document?limit=1 > /dev/null 2>&1
  
  echo ""
done

echo "✅ Port testing completed!"
