#!/bin/bash

echo "🔍 Advanced OpenSign API Diagnosis..."
echo ""

# Test different potential API endpoints
echo "1️⃣ Testing root API endpoint (http://94.249.71.89:9000/api)"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "X-Parse-Application-Id: opensign" \
  -H "Content-Type: application/json" \
  http://94.249.71.89:9000/api/classes/contracts_Document?limit=1 | head -5
echo "================================================="

echo "2️⃣ Testing /parse endpoint (http://94.249.71.89:9000/parse)"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "X-Parse-Application-Id: opensign" \
  -H "Content-Type: application/json" \
  http://94.249.71.89:9000/parse/classes/contracts_Document?limit=1 | head -5
echo "================================================="

echo "3️⃣ Testing server info endpoint (http://94.249.71.89:9000/app/serverInfo)"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "X-Parse-Application-Id: opensign" \
  -H "Content-Type: application/json" \
  http://94.249.71.89:9000/app/serverInfo | head -5
echo "================================================="

echo "4️⃣ Testing health endpoint (http://94.249.71.89:9000/app/health)"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "X-Parse-Application-Id: opensign" \
  -H "Content-Type: application/json" \
  http://94.249.71.89:9000/app/health | head -5
echo "================================================="

echo "5️⃣ Testing schemas endpoint (http://94.249.71.89:9000/app/schemas)"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "X-Parse-Application-Id: opensign" \
  -H "Content-Type: application/json" \
  http://94.249.71.89:9000/app/schemas | head -5
echo "================================================="

echo "6️⃣ Testing with different app ID (http://94.249.71.89:9000/app/classes/contracts_Document)"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "X-Parse-Application-Id: test" \
  -H "Content-Type: application/json" \
  http://94.249.71.89:9000/app/classes/contracts_Document?limit=1 | head -5
echo "================================================="

echo "✅ Advanced diagnosis completed!"
