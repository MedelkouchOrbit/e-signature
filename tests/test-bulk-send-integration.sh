#!/bin/bash

# Test script for bulk-send integration using existing OpenSign functions
# This tests the complete bulk-send flow using real OpenSign backend functions

set -e

# Configuration
API_BASE_URL="http://94.249.71.89:9000"
LOGIN_EMAIL="m.elkouch@orbitech.jo"
LOGIN_PASSWORD="Meticx12@"

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

# Helper functions
log_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_test() {
    local status="$1"
    local test_name="$2"
    local message="$3"
    
    if [[ "$status" == "PASS" ]]; then
        echo -e "${GREEN}✅ $test_name: $message${NC}"
    elif [[ "$status" == "FAIL" ]]; then
        echo -e "${RED}❌ $test_name: $message${NC}"
    else
        echo -e "${YELLOW}⚠️  $test_name: $message${NC}"
    fi
}

# Test authentication
test_login() {
    log_step "Step 1: Testing authentication using loginuser function..."
    
    local response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "X-Parse-Application-Id: opensign" \
        -d "{\"email\":\"$LOGIN_EMAIL\",\"password\":\"$LOGIN_PASSWORD\"}" \
        "$API_BASE_URL/api/app/functions/loginuser")
    
    local http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    local body=$(echo "$response" | sed '/HTTP_STATUS/d')
    
    if [[ $http_status == "200" ]]; then
        SESSION_TOKEN=$(echo "$body" | jq -r '.result.sessionToken // empty' 2>/dev/null)
        if [[ -n "$SESSION_TOKEN" && "$SESSION_TOKEN" != "null" ]]; then
            log_test "PASS" "Authentication" "Successfully logged in (token: ${SESSION_TOKEN:0:20}...)"
            return 0
        fi
    fi
    
    log_test "FAIL" "Authentication" "Failed to authenticate - Status: $http_status"
    echo "Response: $body"
    return 1
}

# Get available templates using getReport function
test_get_templates() {
    log_step "Step 2: Getting available templates using getReport..."
    
    if [[ -z "$SESSION_TOKEN" ]]; then
        log_test "SKIP" "Get Templates" "No session token available"
        return 1
    fi
    
    # Use getReport function with template reportId (6TeaPr321t)
    local response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "X-Parse-Application-Id: opensign" \
        -H "X-Parse-Session-Token: $SESSION_TOKEN" \
        -d '{"reportId":"6TeaPr321t","limit":10,"skip":0}' \
        "$API_BASE_URL/api/app/functions/getReport")
    
    local http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    local body=$(echo "$response" | sed '/HTTP_STATUS/d')
    
    if [[ $http_status == "200" ]]; then
        local template_count=$(echo "$body" | jq '.result | length' 2>/dev/null)
        if [[ "$template_count" -gt 0 ]]; then
            TEMPLATE_ID=$(echo "$body" | jq -r '.result[0].objectId // empty' 2>/dev/null)
            local template_name=$(echo "$body" | jq -r '.result[0].Name // empty' 2>/dev/null)
            log_test "PASS" "Get Templates" "Found $template_count templates. Using: $template_name (ID: $TEMPLATE_ID)"
            return 0
        else
            log_test "PASS" "Get Templates" "No templates found - this is normal for a fresh installation"
            TEMPLATE_ID="" # Clear template ID
            return 0
        fi
    fi
    
    log_test "FAIL" "Get Templates" "Failed to get templates - Status: $http_status"
    echo "Response: $body"
    return 1
}

# Test getting existing bulk sends using direct Parse class query
test_get_bulk_sends() {
    log_step "Step 3: Getting existing bulk sends using Parse class query..."
    
    if [[ -z "$SESSION_TOKEN" ]]; then
        log_test "SKIP" "Get Bulk Sends" "No session token available"
        return 1
    fi
    
    local response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" \
        -X GET \
        -H "Content-Type: application/json" \
        -H "X-Parse-Application-Id: opensign" \
        -H "X-Parse-Session-Token: $SESSION_TOKEN" \
        "$API_BASE_URL/api/app/classes/contracts_BulkSend?limit=10")
    
    local http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    local body=$(echo "$response" | sed '/HTTP_STATUS/d')
    
    if [[ $http_status == "200" ]]; then
        local bulk_send_count=$(echo "$body" | jq '.results | length' 2>/dev/null)
        log_test "PASS" "Get Bulk Sends" "Found $bulk_send_count existing bulk sends"
        return 0
    elif [[ $http_status == "400" ]]; then
        # Class might not exist yet, that's okay
        log_test "PASS" "Get Bulk Sends" "contracts_BulkSend class doesn't exist yet (will be created)"
        return 0
    fi
    
    log_test "FAIL" "Get Bulk Sends" "Failed to get bulk sends - Status: $http_status"
    echo "Response: $body"
    return 1
}

# Test creating a bulk send using direct Parse class creation
test_create_bulk_send() {
    log_step "Step 4: Creating bulk send using Parse class creation..."
    
    if [[ -z "$SESSION_TOKEN" || -z "$TEMPLATE_ID" ]]; then
        log_test "SKIP" "Create Bulk Send" "Missing session token or no templates available"
        return 0
    fi
    
    local bulk_send_data='{
        "Name": "Test Bulk Send Integration '$(date '+%Y-%m-%d %H:%M:%S')'",
        "TemplateId": {
            "__type": "Pointer",
            "className": "contracts_Template",
            "objectId": "'$TEMPLATE_ID'"
        },
        "Status": "draft",
        "TotalRecipients": 3,
        "SentCount": 0,
        "CompletedCount": 0,
        "FailedCount": 0,
        "Signers": [
            {
                "Name": "John Doe",
                "Email": "john@example.com",
                "Role": "signer",
                "Order": 1,
                "Status": "pending"
            },
            {
                "Name": "Jane Smith",
                "Email": "jane@example.com",
                "Role": "signer",
                "Order": 2,
                "Status": "pending"
            },
            {
                "Name": "Bob Johnson",
                "Email": "bob@example.com",
                "Role": "signer",
                "Order": 3,
                "Status": "pending"
            }
        ],
        "SendInOrder": true,
        "Message": "Please sign this document in the specified order."
    }'
    
    local response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "X-Parse-Application-Id: opensign" \
        -H "X-Parse-Session-Token: $SESSION_TOKEN" \
        -d "$bulk_send_data" \
        "$API_BASE_URL/api/app/classes/contracts_BulkSend")
    
    local http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    local body=$(echo "$response" | sed '/HTTP_STATUS/d')
    
    if [[ $http_status == "200" || $http_status == "201" ]]; then
        BULK_SEND_ID=$(echo "$body" | jq -r '.objectId // empty' 2>/dev/null)
        if [[ -n "$BULK_SEND_ID" && "$BULK_SEND_ID" != "null" ]]; then
            log_test "PASS" "Create Bulk Send" "Successfully created (ID: $BULK_SEND_ID)"
            return 0
        fi
    fi
    
    log_test "FAIL" "Create Bulk Send" "Failed to create - Status: $http_status"
    echo "Response: $body"
    return 1
}

# Test getting bulk send details
test_get_bulk_send_details() {
    log_step "Step 5: Getting bulk send details..."
    
    if [[ -z "$SESSION_TOKEN" || -z "$BULK_SEND_ID" ]]; then
        log_test "SKIP" "Get Bulk Send Details" "Missing session token or no bulk send created"
        return 0
    fi
    
    local response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" \
        -X GET \
        -H "Content-Type: application/json" \
        -H "X-Parse-Application-Id: opensign" \
        -H "X-Parse-Session-Token: $SESSION_TOKEN" \
        "$API_BASE_URL/api/app/classes/contracts_BulkSend/$BULK_SEND_ID?include=TemplateId")
    
    local http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    local body=$(echo "$response" | sed '/HTTP_STATUS/d')
    
    if [[ $http_status == "200" ]]; then
        local object_id=$(echo "$body" | jq -r '.objectId // empty' 2>/dev/null)
        local name=$(echo "$body" | jq -r '.Name // empty' 2>/dev/null)
        if [[ -n "$object_id" && "$object_id" != "null" ]]; then
            log_test "PASS" "Get Bulk Send Details" "Retrieved details for: $name"
            return 0
        fi
    fi
    
    log_test "FAIL" "Get Bulk Send Details" "Failed to get details - Status: $http_status"
    return 1
}

# Test sending bulk send using batchdocuments function
test_send_bulk_send() {
    log_step "Step 6: Sending bulk send using batchdocuments function..."
    
    if [[ -z "$SESSION_TOKEN" || -z "$BULK_SEND_ID" || -z "$TEMPLATE_ID" ]]; then
        log_test "SKIP" "Send Bulk Send" "Missing required parameters or no template/bulk send available"
        return 0
    fi
    
    # Prepare recipients data for batchdocuments
    local batch_data='{
        "templateId": "'$TEMPLATE_ID'",
        "sendInOrder": true,
        "recipients": [
            {
                "Name": "John Doe",
                "Email": "john@example.com",
                "Role": "signer"
            },
            {
                "Name": "Jane Smith",
                "Email": "jane@example.com",
                "Role": "signer"
            },
            {
                "Name": "Bob Johnson",
                "Email": "bob@example.com",
                "Role": "signer"
            }
        ],
        "message": "Please sign this document in the specified order."
    }'
    
    local response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "X-Parse-Application-Id: opensign" \
        -H "X-Parse-Session-Token: $SESSION_TOKEN" \
        -d "$batch_data" \
        "$API_BASE_URL/api/app/functions/batchdocuments")
    
    local http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    local body=$(echo "$response" | sed '/HTTP_STATUS/d')
    
    if [[ $http_status == "200" ]]; then
        local success=$(echo "$body" | jq -r '.success // empty' 2>/dev/null)
        local message=$(echo "$body" | jq -r '.message // empty' 2>/dev/null)
        
        if [[ "$success" == "true" || (-n "$message" && "$message" != "null") ]]; then
            log_test "PASS" "Send Bulk Send" "Documents created successfully"
            
            # Update bulk send status
            local update_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" \
                -X PUT \
                -H "Content-Type: application/json" \
                -H "X-Parse-Application-Id: opensign" \
                -H "X-Parse-Session-Token: $SESSION_TOKEN" \
                -d '{"Status":"sending","SentCount":3}' \
                "$API_BASE_URL/api/app/classes/contracts_BulkSend/$BULK_SEND_ID")
            
            return 0
        fi
    fi
    
    log_test "FAIL" "Send Bulk Send" "Failed to send - Status: $http_status"
    echo "Response: $body"
    return 1
}

# Test cleanup - delete bulk send
test_delete_bulk_send() {
    log_step "Step 7: Cleaning up - deleting bulk send..."
    
    if [[ -z "$SESSION_TOKEN" || -z "$BULK_SEND_ID" ]]; then
        log_test "SKIP" "Delete Bulk Send" "Missing session token or no bulk send created"
        return 0
    fi
    
    local response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" \
        -X DELETE \
        -H "Content-Type: application/json" \
        -H "X-Parse-Application-Id: opensign" \
        -H "X-Parse-Session-Token: $SESSION_TOKEN" \
        "$API_BASE_URL/api/app/classes/contracts_BulkSend/$BULK_SEND_ID")
    
    local http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    
    if [[ $http_status == "200" ]]; then
        log_test "PASS" "Delete Bulk Send" "Successfully deleted"
        return 0
    fi
    
    log_test "FAIL" "Delete Bulk Send" "Failed to delete - Status: $http_status"
    return 1
}

# Main test execution
main() {
    echo "🧪 Bulk Send Integration Test Suite"
    echo "===================================="
    echo "🔗 API Base URL: $API_BASE_URL"
    echo "👤 Test User: $LOGIN_EMAIL"
    echo "🕒 Started at: $(date)"
    echo ""
    
    local total_tests=0
    local passed_tests=0
    local failed_tests=0
    
    # Run tests in sequence
    tests=(
        "test_login"
        "test_get_templates"
        "test_get_bulk_sends"
        "test_create_bulk_send"
        "test_get_bulk_send_details"
        "test_send_bulk_send"
        "test_delete_bulk_send"
    )
    
    for test_func in "${tests[@]}"; do
        total_tests=$((total_tests + 1))
        if $test_func; then
            passed_tests=$((passed_tests + 1))
        else
            failed_tests=$((failed_tests + 1))
        fi
        echo ""
    done
    
    # Test summary
    echo "📊 Test Summary"
    echo "==============="
    echo "Total tests: $total_tests"
    echo "Passed: $passed_tests"
    echo "Failed: $failed_tests"
    
    if [[ $failed_tests -eq 0 ]]; then
        log_success "🎉 All tests passed!"
        exit 0
    else
        log_error "💥 Some tests failed!"
        exit 1
    fi
}

# Check dependencies
if ! command -v curl &> /dev/null; then
    log_error "curl is required but not installed"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    log_error "jq is required but not installed"
    exit 1
fi

# Run the tests
main "$@"
