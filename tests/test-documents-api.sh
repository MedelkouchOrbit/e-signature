#!/bin/bash

echo "📄 Testing Documents API Endpoints..."
echo ""

# Configuration
BASE_URL="http://localhost:3001"
PROXY_BASE="/api/proxy/opensign"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${BLUE}Testing: $description${NC}"
    echo "→ $method $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
            -H "Accept: application/json" \
            -H "Content-Type: application/json" \
            -H "X-Parse-Application-Id: opensign" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
            -X "$method" \
            -H "Accept: application/json" \
            -H "Content-Type: application/json" \
            -H "X-Parse-Application-Id: opensign" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi
    
    # Extract HTTP status
    http_status=$(echo "$response" | tail -n1 | sed 's/.*HTTP_STATUS://')
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_status" -ge 200 ] && [ "$http_status" -lt 300 ]; then
        echo -e "${GREEN}✅ Success (Status: $http_status)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    elif [ "$http_status" -ge 400 ] && [ "$http_status" -lt 500 ]; then
        echo -e "${YELLOW}⚠️  Client Error (Status: $http_status)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ Server Error (Status: $http_status)${NC}"
        echo "$body"
    fi
    
    echo ""
    echo "================================================="
    echo ""
}

# Test 1: Fetch Documents (GET)
test_endpoint "GET" \
    "$PROXY_BASE/functions/filterdocs?limit=5&offset=0&order=-createdAt" \
    "" \
    "Fetch Documents List"

# Test 2: Test File Upload Endpoint
test_endpoint "GET" \
    "$PROXY_BASE/file_upload" \
    "" \
    "Check File Upload Endpoint"

# Test 3: Test Save File Function
test_endpoint "POST" \
    "$PROXY_BASE/functions/savefile" \
    '{"name":"test-document.pdf","description":"Test document","signers":[]}' \
    "Test Save File Function"

# Test 4: Test Sign PDF Function
test_endpoint "POST" \
    "$PROXY_BASE/functions/signPdf" \
    '{"docId":"test123","signatureData":{"x":100,"y":100}}' \
    "Test Sign PDF Function"

# Test 5: Test Document Classes Endpoint
test_endpoint "GET" \
    "$PROXY_BASE/classes/contracts_Document?limit=1" \
    "" \
    "Test Document Classes Endpoint"

# Test 6: Test Decline Document Function
test_endpoint "POST" \
    "$PROXY_BASE/functions/declinedoc" \
    '{"docId":"test123","reason":"Testing decline functionality"}' \
    "Test Decline Document Function"

# Test 7: Test Forward Document Function
test_endpoint "POST" \
    "$PROXY_BASE/functions/forwarddoc" \
    '{"docId":"test123","email":"test@example.com"}' \
    "Test Forward Document Function"

# Test 8: Test Create Duplicate Function
test_endpoint "POST" \
    "$PROXY_BASE/functions/createduplicate" \
    '{"docId":"test123"}' \
    "Test Create Duplicate Function"

# Test 9: Test Recreate Document Function
test_endpoint "POST" \
    "$PROXY_BASE/functions/recreatedoc" \
    '{"docId":"test123"}' \
    "Test Recreate Document Function"

echo "🏁 Documents API Testing Complete!"
echo ""
echo "💡 Analysis:"
echo "- 200-299: Successful API calls"
echo "- 400-499: Client errors (usually authentication or parameter issues)"
echo "- 500+: Server errors (proxy or OpenSign server issues)"
echo ""
echo "📋 Next Steps:"
echo "1. If you see 401/403 errors, check OpenSign credentials in .env"
echo "2. If you see 404 errors, the OpenSign endpoint structure may be different"
echo "3. If you see 500 errors, check OpenSign server connectivity"
echo "4. If successful, the documents module should work properly"
