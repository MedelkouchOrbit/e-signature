#!/bin/bash

# Templates API Testing Script
# This script tests all template endpoints with multiple scenarios

echo "🧪 Starting comprehensive Templates API testing..."
echo "================================================="

# Configuration
BASE_URL="http://localhost:3000"
API_URL="${BASE_URL}/api/proxy/opensign"
SESSION_TOKEN="r:fa85df0cfcdec34b5c0db2b44a0bb1da" # Update this with your session token

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run test and check result
run_test() {
    local test_name="$1"
    local expected_status="$2"
    local response_file="/tmp/api_response.json"
    
    echo -e "\n${BLUE}🔍 Testing: ${test_name}${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Execute the curl command passed as remaining arguments
    shift 2
    local curl_output
    curl_output=$("$@" -w "\n%{http_code}" -o "$response_file" 2>/dev/null)
    local actual_status=$(echo "$curl_output" | tail -n1)
    
    # Show request details
    echo "   Request: $*"
    echo "   Expected Status: $expected_status"
    echo "   Actual Status: $actual_status"
    
    # Check status code
    if [ "$actual_status" = "$expected_status" ]; then
        echo -e "   ${GREEN}✅ Status Code: PASS${NC}"
        
        # Try to parse and display response
        if [ -f "$response_file" ]; then
            local response_content
            response_content=$(cat "$response_file")
            
            # Check if response is valid JSON
            if echo "$response_content" | jq . >/dev/null 2>&1; then
                echo -e "   ${GREEN}✅ Valid JSON Response${NC}"
                
                # Show response summary
                local result_count
                result_count=$(echo "$response_content" | jq '.result | length?' 2>/dev/null || echo "N/A")
                if [ "$result_count" != "N/A" ] && [ "$result_count" != "null" ]; then
                    echo "   📊 Result Count: $result_count"
                fi
                
                # Check for errors in response
                local error_msg
                error_msg=$(echo "$response_content" | jq -r '.error?' 2>/dev/null)
                if [ "$error_msg" != "null" ] && [ "$error_msg" != "" ]; then
                    echo -e "   ${YELLOW}⚠️  API Error: $error_msg${NC}"
                fi
                
                PASSED_TESTS=$((PASSED_TESTS + 1))
            else
                echo -e "   ${RED}❌ Invalid JSON Response${NC}"
                echo "   Response: $response_content"
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
        fi
    else
        echo -e "   ${RED}❌ Status Code: FAIL${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        
        # Show error response if available
        if [ -f "$response_file" ]; then
            local response_content
            response_content=$(cat "$response_file")
            echo "   Error Response: $response_content"
        fi
    fi
    
    # Cleanup
    rm -f "$response_file"
}

echo -e "\n${YELLOW}📋 Test Configuration:${NC}"
echo "   Base URL: $BASE_URL"
echo "   API URL: $API_URL"
echo "   Session Token: ${SESSION_TOKEN:0:20}..."

# Test 1: Check if development server is running
echo -e "\n${YELLOW}🚀 Testing Development Server Availability${NC}"
run_test "Development Server Health Check" "200" \
    curl -s "$BASE_URL"

# Test 2: Test OpenSign proxy connectivity
echo -e "\n${YELLOW}🔗 Testing OpenSign Proxy Connectivity${NC}"
run_test "OpenSign Proxy Base Endpoint" "200" \
    curl -s -X GET "$API_URL/classes/contracts_Template" \
    -H "Content-Type: application/json" \
    -H "X-Parse-Application-Id: opensign" \
    -H "X-Parse-Session-Token: $SESSION_TOKEN"

# Test 3: Get Templates List (Main endpoint)
echo -e "\n${YELLOW}📋 Testing Templates List Endpoint${NC}"
run_test "Get Templates List" "200" \
    curl -s -X POST "$API_URL/functions/getReport" \
    -H "Content-Type: application/json" \
    -H "X-Parse-Application-Id: opensign" \
    -H "X-Parse-Session-Token: $SESSION_TOKEN" \
    -d '{
        "reportId": "6TeaPr321t",
        "limit": 10,
        "skip": 0,
        "searchTerm": ""
    }'

# Test 4: Get Templates with Search
echo -e "\n${YELLOW}🔍 Testing Templates Search${NC}"
run_test "Get Templates with Search" "200" \
    curl -s -X POST "$API_URL/functions/getReport" \
    -H "Content-Type: application/json" \
    -H "X-Parse-Application-Id: opensign" \
    -H "X-Parse-Session-Token: $SESSION_TOKEN" \
    -d '{
        "reportId": "6TeaPr321t",
        "limit": 5,
        "skip": 0,
        "searchTerm": "test"
    }'

# Test 5: Get Templates with Pagination
echo -e "\n${YELLOW}📄 Testing Templates Pagination${NC}"
run_test "Get Templates with Pagination" "200" \
    curl -s -X POST "$API_URL/functions/getReport" \
    -H "Content-Type: application/json" \
    -H "X-Parse-Application-Id: opensign" \
    -H "X-Parse-Session-Token: $SESSION_TOKEN" \
    -d '{
        "reportId": "6TeaPr321t",
        "limit": 3,
        "skip": 5,
        "searchTerm": ""
    }'

# Test 6: Get Single Template (we'll need to get a template ID first)
echo -e "\n${YELLOW}📄 Testing Single Template Retrieval${NC}"

# First get templates list to extract an ID
TEMPLATE_ID=$(curl -s -X POST "$API_URL/functions/getReport" \
    -H "Content-Type: application/json" \
    -H "X-Parse-Application-Id: opensign" \
    -H "X-Parse-Session-Token: $SESSION_TOKEN" \
    -d '{
        "reportId": "6TeaPr321t",
        "limit": 1,
        "skip": 0,
        "searchTerm": ""
    }' | jq -r '.result[0].objectId?' 2>/dev/null)

if [ "$TEMPLATE_ID" != "null" ] && [ "$TEMPLATE_ID" != "" ]; then
    echo "   Using Template ID: $TEMPLATE_ID"
    run_test "Get Single Template" "200" \
        curl -s -X POST "$API_URL/functions/GetTemplate" \
        -H "Content-Type: application/json" \
        -H "X-Parse-Application-Id: opensign" \
        -H "X-Parse-Session-Token: $SESSION_TOKEN" \
        -d "{
            \"templateId\": \"$TEMPLATE_ID\"
        }"
else
    echo "   ⚠️  No template ID available for single template test"
fi

# Test 7: Create Template (Direct Parse API)
echo -e "\n${YELLOW}➕ Testing Template Creation${NC}"
run_test "Create New Template" "201" \
    curl -s -X POST "$API_URL/classes/contracts_Template" \
    -H "Content-Type: application/json" \
    -H "X-Parse-Application-Id: opensign" \
    -H "X-Parse-Session-Token: $SESSION_TOKEN" \
    -d '{
        "Name": "Test Template API",
        "Description": "Created via API test",
        "SendinOrder": false,
        "IsEnableOTP": false,
        "AutomaticReminders": false,
        "TimeToCompleteDays": 15
    }'

# Test 8: Test Invalid Endpoints
echo -e "\n${YELLOW}❌ Testing Invalid Endpoints${NC}"
run_test "Invalid Function Name" "404" \
    curl -s -X POST "$API_URL/functions/nonExistentFunction" \
    -H "Content-Type: application/json" \
    -H "X-Parse-Application-Id: opensign" \
    -H "X-Parse-Session-Token: $SESSION_TOKEN" \
    -d '{}'

# Test 9: Test Unauthorized Access
echo -e "\n${YELLOW}🔒 Testing Unauthorized Access${NC}"
run_test "Access without Session Token" "401" \
    curl -s -X POST "$API_URL/functions/getReport" \
    -H "Content-Type: application/json" \
    -H "X-Parse-Application-Id: opensign" \
    -d '{
        "reportId": "6TeaPr321t",
        "limit": 10,
        "skip": 0
    }'

# Test 10: Test Invalid Session Token
echo -e "\n${YELLOW}🔑 Testing Invalid Session Token${NC}"
run_test "Access with Invalid Token" "209" \
    curl -s -X POST "$API_URL/functions/getReport" \
    -H "Content-Type: application/json" \
    -H "X-Parse-Application-Id: opensign" \
    -H "X-Parse-Session-Token: invalid_token_12345" \
    -d '{
        "reportId": "6TeaPr321t",
        "limit": 10,
        "skip": 0
    }'

# Test 11: Test saveAsTemplate function
echo -e "\n${YELLOW}💾 Testing Save As Template Function${NC}"
run_test "Save Document as Template" "200" \
    curl -s -X POST "$API_URL/functions/saveastemplate" \
    -H "Content-Type: application/json" \
    -H "X-Parse-Application-Id: opensign" \
    -H "X-Parse-Session-Token: $SESSION_TOKEN" \
    -d '{
        "docId": "test_document_id"
    }'

# Test 12: Test createDuplicate function
echo -e "\n${YELLOW}📋 Testing Duplicate Template Function${NC}"
if [ "$TEMPLATE_ID" != "null" ] && [ "$TEMPLATE_ID" != "" ]; then
    run_test "Duplicate Template" "200" \
        curl -s -X POST "$API_URL/functions/createDuplicate" \
        -H "Content-Type: application/json" \
        -H "X-Parse-Application-Id: opensign" \
        -H "X-Parse-Session-Token: $SESSION_TOKEN" \
        -d "{
            \"templateId\": \"$TEMPLATE_ID\"
        }"
else
    echo "   ⚠️  No template ID available for duplicate test"
fi

# Test Summary
echo -e "\n${YELLOW}📊 Test Summary${NC}"
echo "================================================="
echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Check the output above for details.${NC}"
    exit 1
fi
