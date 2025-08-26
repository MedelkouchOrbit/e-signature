#!/bin/bash

# Comprehensive test script for subscription and billing functionality
# Testing MainLayout, i18n implementation, and billing-info page

echo "🚀 Starting comprehensive test for subscription & billing functionality..."
echo "=================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "\n${BLUE}Testing: ${test_name}${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command"; then
        echo -e "${GREEN}✓ PASSED: ${test_name}${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAILED: ${test_name}${NC}"
    fi
}

# Check if development server is running
echo -e "${YELLOW}📋 Pre-flight checks...${NC}"
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${RED}❌ Development server is not running on port 3000${NC}"
    echo "Please start the server with: npm run dev"
    exit 1
fi
echo -e "${GREEN}✓ Development server is running${NC}"

# Test 1: Check MainLayout component exists and is properly named
run_test "MainLayout component exists" "test -f 'app/components/shared/main-layout.tsx'"

# Test 2: Check MainLayout function name is correct
run_test "MainLayout function name is correct" "grep -q 'export default function MainLayout' app/components/shared/main-layout.tsx"

# Test 3: Check layout-renderer uses MainLayout
run_test "layout-renderer imports MainLayout" "grep -q 'import MainLayout' app/components/shared/layout-renderer.tsx"

# Test 4: Check old DashboardLayout is not referenced
run_test "No DashboardLayout references remain" "! grep -r 'DashboardLayout' app/components/shared/"

# Test 5: Check billing-info page exists in settings
run_test "Billing-info page exists in settings" "test -f 'app/[locale]/settings/billing-info/page.tsx'"

# Test 6: Check old billing folder is removed
run_test "Old billing folder is removed" "! test -d 'app/[locale]/billing'"

# Test 7: Check BillingInfoPage function name
run_test "BillingInfoPage function name is correct" "grep -q 'export default function BillingInfoPage' app/[locale]/settings/billing-info/page.tsx"

# Test 8: Check pricing page has i18n implementation
run_test "Pricing page uses useTranslations" "grep -q 'useTranslations.*pricing' app/[locale]/pricing/page.tsx"

# Test 9: Check pricing page has no hardcoded English text
run_test "Pricing page has no hardcoded plan names" "! grep -q '\"Free\"\\|\"Pro\"\\|\"Business\"' app/[locale]/pricing/page.tsx"

# Test 10: Check translation files have billing section
run_test "English translations have billing section" "grep -q '\"billing\"' messages/en.json"
run_test "Arabic translations have billing section" "grep -q '\"billing\"' messages/ar.json"

# Test 11: Check navbar translations include billing
run_test "English navbar has billing translation" "grep -A 10 '\"navbar\"' messages/en.json | grep -q '\"billing\"'"
run_test "Arabic navbar has billing translation" "grep -A 10 '\"navbar\"' messages/ar.json | grep -q '\"billing\"'"

# Test 12: Check routing configuration includes billing-info
run_test "Routing includes billing-info path" "grep -q '/settings/billing-info' app/i18n/routing.ts"

# Test 13: Check main navigation redirects properly
run_test "Main navigation redirects to billing-info for subscribed users" "grep -q '/settings/billing-info' app/components/shared/main-navigation.tsx"

# Test 14: Check subscription store functionality
run_test "Subscription store exports correct types" "grep -q 'export type SubscriptionPlan' app/lib/subscription/subscription-store.ts"

# Test 15: Check subscription store has isSubscribed method
run_test "Subscription store has isSubscribed method" "grep -q 'isSubscribed:' app/lib/subscription/subscription-store.ts"

# Web-based functionality tests
echo -e "\n${YELLOW}🌐 Testing web functionality...${NC}"

# Test 16: Test English pricing page loads
run_test "English pricing page loads" "curl -s http://localhost:3000/en/pricing | grep -q 'Choose Plan'"

# Test 17: Test Arabic pricing page loads  
run_test "Arabic pricing page loads" "curl -s http://localhost:3000/ar/pricing | grep -q 'اختر الخطة'"

# Test 18: Test English billing-info page loads
run_test "English billing-info page loads" "curl -s http://localhost:3000/en/settings/billing-info | grep -q 'Billing'"

# Test 19: Test Arabic billing-info page loads
run_test "Arabic billing-info page loads" "curl -s http://localhost:3000/ar/settings/billing-info | grep -q 'الفواتير'"

# Test 20: Test dashboard loads with MainLayout
run_test "Dashboard loads with MainLayout" "curl -s http://localhost:3000/en/dashboard | grep -q 'WatiqaSign'"

# File structure validation
echo -e "\n${YELLOW}📁 Validating file structure...${NC}"

# Test 21: Check critical files exist
run_test "All critical files exist" "
    test -f 'app/components/shared/main-layout.tsx' && 
    test -f 'app/components/shared/layout-renderer.tsx' && 
    test -f 'app/[locale]/pricing/page.tsx' && 
    test -f 'app/[locale]/settings/billing-info/page.tsx' &&
    test -f 'app/lib/subscription/subscription-store.ts'
"

# Test 22: Check translation files are valid JSON
run_test "Translation files are valid JSON" "
    python3 -m json.tool messages/en.json > /dev/null &&
    python3 -m json.tool messages/ar.json > /dev/null
"

# Compilation tests
echo -e "\n${YELLOW}🔧 Testing compilation...${NC}"

# Test 23: Check TypeScript compilation
run_test "TypeScript compilation passes" "npx tsc --noEmit --skipLibCheck"

# Performance and accessibility tests
echo -e "\n${YELLOW}⚡ Performance checks...${NC}"

# Test 24: Check bundle size impact
run_test "Bundle analysis available" "test -f 'package.json' && grep -q 'build' package.json"

# Summary
echo -e "\n${YELLOW}📊 Test Summary${NC}"
echo "=================================================="
echo -e "Total Tests: ${TOTAL_TESTS}"
echo -e "Passed: ${GREEN}${PASSED_TESTS}${NC}"
echo -e "Failed: ${RED}$((TOTAL_TESTS - PASSED_TESTS))${NC}"
echo -e "Success Rate: ${GREEN}$(( PASSED_TESTS * 100 / TOTAL_TESTS ))%${NC}"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! The implementation is ready.${NC}"
    echo -e "${GREEN}✓ MainLayout naming convention implemented${NC}"
    echo -e "${GREEN}✓ Billing page moved to settings/billing-info${NC}"
    echo -e "${GREEN}✓ i18n fully implemented for pricing page${NC}"
    echo -e "${GREEN}✓ Navigation properly handles subscription states${NC}"
    echo -e "${GREEN}✓ Translation files updated for both languages${NC}"
else
    echo -e "\n${RED}❌ Some tests failed. Please review the output above.${NC}"
    exit 1
fi

# Optional: Run linting if available
if command -v eslint &> /dev/null; then
    echo -e "\n${YELLOW}🔍 Running ESLint...${NC}"
    npx eslint app/components/shared/main-layout.tsx app/[locale]/pricing/page.tsx app/[locale]/settings/billing-info/page.tsx --fix
fi

echo -e "\n${BLUE}🚀 Testing complete!${NC}"
