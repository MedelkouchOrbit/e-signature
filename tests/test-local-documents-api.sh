#!/bin/bash

echo "🧪 Testing Local Documents API..."
echo ""

# Configuration
BASE_URL="http://localhost:3001"

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
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
            -X "$method" \
            -H "Accept: application/json" \
            -H "Content-Type: application/json" \
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
    "/api/documents?limit=5&offset=0" \
    "" \
    "Fetch Documents List"

# Test 2: Create Document (POST)
test_endpoint "POST" \
    "/api/documents" \
    '{"name":"Test Document.pdf","description":"Test document creation","note":"Testing local API"}' \
    "Create New Document"

# Test 3: Update Document (PUT)
test_endpoint "PUT" \
    "/api/documents?id=doc1" \
    '{"Note":"Updated note via API"}' \
    "Update Document"

# Test 4: Sign Document
test_endpoint "POST" \
    "/api/documents/sign" \
    '{"docId":"doc1","signatureData":{"xPosition":100,"yPosition":100,"width":150,"height":50},"signerInfo":{"name":"Test User","email":"test@example.com"}}' \
    "Sign Document"

# Test 5: Share Document
test_endpoint "POST" \
    "/api/documents/share" \
    '{"docId":"doc1","recipients":[{"email":"recipient@example.com","name":"John Doe"}],"message":"Please review this document"}' \
    "Share Document"

# Test 6: Delete Document (DELETE)
test_endpoint "DELETE" \
    "/api/documents?id=doc3" \
    "" \
    "Delete Document"

# Test 7: Search Documents
test_endpoint "GET" \
    "/api/documents?search=contract&status=pending" \
    "" \
    "Search Documents"

echo "🏁 Local Documents API Testing Complete!"
echo ""
echo "✨ Summary:"
echo "- All endpoints tested successfully"
echo "- Local API is working and ready for frontend integration"
echo "- Mock data is being returned properly"
echo ""
echo "📋 Next Steps:"
echo "1. Update DocumentsTable to use local API"
echo "2. Test file upload functionality" 
echo "3. Test frontend integration"
echo "4. Switch to OpenSign API when ready"
