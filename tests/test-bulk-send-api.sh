#!/bin/bash

echo "🚀 Bulk Send API Endpoints Test"
echo "==============================="
echo

# Configuration
API_BASE_URL="http://94.249.71.89:9000"
LOGIN_EMAIL="medelkouchorbit@gmail.com"
LOGIN_PASSWORD="Tarik2020@"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Global variables
SESSION_TOKEN=""
TEMPLATE_ID=""
BULK_SEND_ID=""
TEST_COUNT=0
PASS_COUNT=0
FAIL_COUNT=0

# Helper functions
log_test() {
    local status=$1
    local test_name=$2
    local message=$3
    
    TEST_COUNT=$((TEST_COUNT + 1))
    
    case $status in
        "PASS")
            echo -e "${GREEN}✅ $test_name: $message${NC}"
            PASS_COUNT=$((PASS_COUNT + 1))
            ;;
        "FAIL")
            echo -e "${RED}❌ $test_name: $message${NC}"
            FAIL_COUNT=$((FAIL_COUNT + 1))
            ;;
        "SKIP")
            echo -e "${YELLOW}⏭️  $test_name: $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $test_name: $message${NC}"
            ;;
    esac
}

log_section() {
    echo
    echo -e "${BLUE}==================================================${NC}"
    echo -e "${BLUE}🧪 $1${NC}"
    echo -e "${BLUE}==================================================${NC}"
}

# Test functions
test_login() {
    log_section "Authentication Test"
    
    echo "📝 Testing login with credentials..."
    
    local response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "X-Parse-Application-Id: opensign" \
        -d "{\"email\":\"$LOGIN_EMAIL\",\"password\":\"$LOGIN_PASSWORD\"}" \
        "$API_BASE_URL/app/functions/loginuser")
    
    local http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    local body=$(echo "$response" | sed '/HTTP_STATUS/d')
    
    if [[ $http_status == "200" ]]; then
        SESSION_TOKEN=$(echo "$body" | jq -r '.result.sessionToken // empty' 2>/dev/null)
        if [[ -n "$SESSION_TOKEN" && "$SESSION_TOKEN" != "null" ]]; then
            log_test "PASS" "Login" "Successfully authenticated (token: ${SESSION_TOKEN:0:20}...)"
            return 0
        else
            log_test "FAIL" "Login" "No session token in response"
            echo "Response: $body"
            return 1
        fi
    else
        log_test "FAIL" "Login" "Authentication failed - HTTP $http_status"
        echo "Response: $body"
        return 1
    fi
}

test_get_templates() {
    log_section "Template Discovery"
    
    if [[ -z "$SESSION_TOKEN" ]]; then
        log_test "SKIP" "Get Templates" "No session token available"
        return 1
    fi
    
    echo "📄 Getting available templates..."
    
    local response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "X-Parse-Application-Id: opensign" \
        -H "X-Parse-Session-Token: $SESSION_TOKEN" \
        -d "{\"reportId\":\"6TeaPr321t\",\"limit\":10,\"skip\":0}" \
        "$API_BASE_URL/app/functions/getReport")
    
    local http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    local body=$(echo "$response" | sed '/HTTP_STATUS/d')
    
    if [[ $http_status == "200" ]]; then
        TEMPLATE_ID=$(echo "$body" | jq -r '.[0].objectId // empty' 2>/dev/null)
        local template_name=$(echo "$body" | jq -r '.[0].Name // empty' 2>/dev/null)
        local template_count=$(echo "$body" | jq '. | length' 2>/dev/null)
        
        if [[ -n "$TEMPLATE_ID" && "$TEMPLATE_ID" != "null" ]]; then
            log_test "PASS" "Get Templates" "Found $template_count templates (using: $template_name)"
            return 0
        else
            log_test "FAIL" "Get Templates" "No templates found in response"
            echo "Response: $body"
            return 1
        fi
    else
        log_test "FAIL" "Get Templates" "Failed to get templates - HTTP $http_status"
        echo "Response: $body"
        return 1
    fi
}

test_get_bulk_sends() {
    log_section "Bulk Send Retrieval Test"
    
    if [[ -z "$SESSION_TOKEN" ]]; then
        log_test "SKIP" "Get Bulk Sends" "No session token available"
        return 1
    fi
    
    echo "📦 Testing getBulkSend function..."
    
    local response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "X-Parse-Application-Id: opensign" \
        -H "X-Parse-Session-Token: $SESSION_TOKEN" \
        -d "{\"limit\":10,\"skip\":0,\"searchTerm\":\"\"}" \
        "$API_BASE_URL/app/functions/getBulkSend")
    
    local http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    local body=$(echo "$response" | sed '/HTTP_STATUS/d')
    
    if [[ $http_status == "200" ]]; then
        local has_results=$(echo "$body" | jq 'has("results")' 2>/dev/null)
        local error_msg=$(echo "$body" | jq -r '.error // empty' 2>/dev/null)
        
        if [[ "$has_results" == "true" ]]; then
            local count=$(echo "$body" | jq '.results | length' 2>/dev/null)
            log_test "PASS" "Get Bulk Sends" "Found $count bulk sends"
            return 0
        elif [[ -n "$error_msg" && "$error_msg" != "null" ]]; then
            log_test "FAIL" "Get Bulk Sends" "API error: $error_msg"
            return 1
        else
            log_test "FAIL" "Get Bulk Sends" "Unexpected response format"
            echo "Response: $body"
            return 1
        fi
    else
        log_test "FAIL" "Get Bulk Sends" "HTTP error: $http_status"
        echo "Response: $body"
        return 1
    fi
}

test_create_bulk_send() {
    log_section "Bulk Send Creation Test"
    
    if [[ -z "$SESSION_TOKEN" ]]; then
        log_test "SKIP" "Create Bulk Send" "No session token available"
        return 1
    fi
    
    if [[ -z "$TEMPLATE_ID" ]]; then
        log_test "SKIP" "Create Bulk Send" "No template ID available"
        return 1
    fi
    
    echo "🆕 Creating new bulk send..."
    
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
    local bulk_send_data=$(cat << EOF
{
    "templateId": "$TEMPLATE_ID",
    "name": "Test Bulk Send $timestamp",
    "signers": [
        {
            "name": "John Doe",
            "email": "john@example.com",
            "role": "signer",
            "order": 1
        },
        {
            "name": "Jane Smith",
            "email": "jane@example.com",
            "role": "signer",
            "order": 2
        }
    ],
    "sendInOrder": true,
    "message": "Please sign this test document - Automated Test"
}
EOF
    )
    
    local response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "X-Parse-Application-Id: opensign" \
        -H "X-Parse-Session-Token: $SESSION_TOKEN" \
        -d "$bulk_send_data" \
        "$API_BASE_URL/app/functions/createBulkSend")
    
    local http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    local body=$(echo "$response" | sed '/HTTP_STATUS/d')
    
    if [[ $http_status == "200" ]]; then
        BULK_SEND_ID=$(echo "$body" | jq -r '.objectId // empty' 2>/dev/null)
        local success=$(echo "$body" | jq -r '.success // empty' 2>/dev/null)
        local error_msg=$(echo "$body" | jq -r '.error // empty' 2>/dev/null)
        
        if [[ -n "$BULK_SEND_ID" && "$BULK_SEND_ID" != "null" ]]; then
            log_test "PASS" "Create Bulk Send" "Successfully created (ID: $BULK_SEND_ID)"
            return 0
        elif [[ -n "$error_msg" && "$error_msg" != "null" ]]; then
            log_test "FAIL" "Create Bulk Send" "API error: $error_msg"
            return 1
        else
            log_test "FAIL" "Create Bulk Send" "No object ID in response"
            echo "Response: $body"
            return 1
        fi
    else
        log_test "FAIL" "Create Bulk Send" "HTTP error: $http_status"
        echo "Response: $body"
        return 1
    fi
}

test_get_bulk_send_details() {
    log_section "Bulk Send Details Test"
    
    if [[ -z "$SESSION_TOKEN" ]]; then
        log_test "SKIP" "Get Bulk Send Details" "No session token available"
        return 1
    fi
    
    if [[ -z "$BULK_SEND_ID" ]]; then
        log_test "SKIP" "Get Bulk Send Details" "No bulk send ID available"
        return 1
    fi
    
    echo "🔍 Getting bulk send details..."
    
    local response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" \
        -X GET \
        -H "Content-Type: application/json" \
        -H "X-Parse-Application-Id: opensign" \
        -H "X-Parse-Session-Token: $SESSION_TOKEN" \
        "$API_BASE_URL/app/classes/contracts_BulkSend/$BULK_SEND_ID?include=TemplateId")
    
    local http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    local body=$(echo "$response" | sed '/HTTP_STATUS/d')
    
    if [[ $http_status == "200" ]]; then
        local object_id=$(echo "$body" | jq -r '.objectId // empty' 2>/dev/null)
        local name=$(echo "$body" | jq -r '.Name // empty' 2>/dev/null)
        
        if [[ -n "$object_id" && "$object_id" != "null" ]]; then
            log_test "PASS" "Get Bulk Send Details" "Retrieved details for: $name"
            return 0
        else
            log_test "FAIL" "Get Bulk Send Details" "No object ID in response"
            echo "Response: $body"
            return 1
        fi
    else
        log_test "FAIL" "Get Bulk Send Details" "HTTP error: $http_status"
        echo "Response: $body"
        return 1
    fi
}

test_send_bulk_send() {
    log_section "Bulk Send Sending Test"
    
    if [[ -z "$SESSION_TOKEN" ]]; then
        log_test "SKIP" "Send Bulk Send" "No session token available"
        return 1
    fi
    
    if [[ -z "$BULK_SEND_ID" ]]; then
        log_test "SKIP" "Send Bulk Send" "No bulk send ID available"
        return 1
    fi
    
    echo "📤 Sending bulk send..."
    
    local response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "X-Parse-Application-Id: opensign" \
        -H "X-Parse-Session-Token: $SESSION_TOKEN" \
        -d "{\"bulkSendId\":\"$BULK_SEND_ID\"}" \
        "$API_BASE_URL/app/functions/sendBulkSend")
    
    local http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    local body=$(echo "$response" | sed '/HTTP_STATUS/d')
    
    if [[ $http_status == "200" ]]; then
        local success=$(echo "$body" | jq -r '.success // empty' 2>/dev/null)
        local message=$(echo "$body" | jq -r '.message // empty' 2>/dev/null)
        local error_msg=$(echo "$body" | jq -r '.error // empty' 2>/dev/null)
        
        if [[ "$success" == "true" || (-n "$message" && "$message" != "null") ]]; then
            log_test "PASS" "Send Bulk Send" "Successfully initiated: ${message:-'Bulk send started'}"
            return 0
        elif [[ -n "$error_msg" && "$error_msg" != "null" ]]; then
            log_test "FAIL" "Send Bulk Send" "API error: $error_msg"
            return 1
        else
            log_test "FAIL" "Send Bulk Send" "Unexpected response"
            echo "Response: $body"
            return 1
        fi
    else
        log_test "FAIL" "Send Bulk Send" "HTTP error: $http_status"
        echo "Response: $body"
        return 1
    fi
}

test_delete_bulk_send() {
    log_section "Bulk Send Deletion Test"
    
    if [[ -z "$SESSION_TOKEN" ]]; then
        log_test "SKIP" "Delete Bulk Send" "No session token available"
        return 1
    fi
    
    if [[ -z "$BULK_SEND_ID" ]]; then
        log_test "SKIP" "Delete Bulk Send" "No bulk send ID available"
        return 1
    fi
    
    echo "🗑️  Deleting bulk send..."
    
    local response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "X-Parse-Application-Id: opensign" \
        -H "X-Parse-Session-Token: $SESSION_TOKEN" \
        -d "{\"bulkSendId\":\"$BULK_SEND_ID\"}" \
        "$API_BASE_URL/app/functions/deleteBulkSend")
    
    local http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    local body=$(echo "$response" | sed '/HTTP_STATUS/d')
    
    if [[ $http_status == "200" ]]; then
        local success=$(echo "$body" | jq -r '.success // empty' 2>/dev/null)
        local message=$(echo "$body" | jq -r '.message // empty' 2>/dev/null)
        local error_msg=$(echo "$body" | jq -r '.error // empty' 2>/dev/null)
        
        if [[ "$success" == "true" || (-n "$message" && "$message" != "null") ]]; then
            log_test "PASS" "Delete Bulk Send" "Successfully deleted: ${message:-'Bulk send deleted'}"
            return 0
        elif [[ -n "$error_msg" && "$error_msg" != "null" ]]; then
            log_test "FAIL" "Delete Bulk Send" "API error: $error_msg"
            return 1
        else
            log_test "FAIL" "Delete Bulk Send" "Unexpected response"
            echo "Response: $body"
            return 1
        fi
    else
        log_test "FAIL" "Delete Bulk Send" "HTTP error: $http_status"
        echo "Response: $body"
        return 1
    fi
}

# Main test execution
main() {
    echo "🚀 Starting Bulk Send API Test Suite"
    echo "📡 Testing against: $API_BASE_URL"
    echo "👤 Test user: $LOGIN_EMAIL"
    echo "🕒 Started at: $(date)"
    echo
    
    # Check if jq is available
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}❌ Error: jq is required but not installed${NC}"
        echo "Install with: brew install jq (macOS) or apt-get install jq (Ubuntu)"
        exit 1
    fi
    
    # Run tests in sequence
    test_login
    test_get_templates  
    test_get_bulk_sends
    test_create_bulk_send
    test_get_bulk_send_details
    test_send_bulk_send
    test_delete_bulk_send
    
    # Summary
    log_section "Test Results Summary"
    local skip_count=$((TEST_COUNT - PASS_COUNT - FAIL_COUNT))
    echo "📊 Total Tests: $TEST_COUNT"
    echo -e "${GREEN}✅ Passed: $PASS_COUNT${NC}"
    echo -e "${RED}❌ Failed: $FAIL_COUNT${NC}"
    echo -e "${YELLOW}⏭️  Skipped: $skip_count${NC}"
    
    if [[ $TEST_COUNT -gt 0 ]]; then
        local success_rate=$(( (PASS_COUNT * 100) / TEST_COUNT ))
        echo "📈 Success Rate: $success_rate%"
    fi
    
    if [[ $FAIL_COUNT -gt 0 ]]; then
        echo
        echo "🔧 Troubleshooting:"
        echo "• Check if OpenSign server is running on port 9000"
        echo "• Verify credentials are correct"
        echo "• Ensure bulk send cloud functions are deployed"
        echo "• Check Parse Server logs for errors"
        echo "• Verify database migration was applied"
    fi
    
    echo
    echo "🏁 Test completed at: $(date)"
    
    # Exit with error code if tests failed
    exit $FAIL_COUNT
}

# Run the tests
main "$@"
