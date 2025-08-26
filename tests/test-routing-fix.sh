#!/bin/bash

# Quick test script for routing fix verification
echo "🔧 Verifying routing fix for Arabic/English pages..."

# Test public routes
echo "Testing public routes:"
echo "English pricing: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/en/pricing)"
echo "Arabic pricing: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ar/pricing)"
echo "English features: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/en/features)" 
echo "Arabic features: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ar/features)"

# Test protected routes (should redirect)
echo "Testing protected routes (should be 307 redirects):"
echo "English billing-info: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/en/settings/billing-info)"
echo "Arabic billing-info: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ar/settings/billing-info)"
echo "English dashboard: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/en/dashboard)"
echo "Arabic dashboard: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ar/dashboard)"

echo "✅ All routes tested. Public routes should return 200, protected routes should return 307 (redirect to login)"
