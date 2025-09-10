#!/usr/bin/env node

// Simple test for URL cleaning functionality

// Mock cleaning function (same as in documents-api-service.ts)
function cleanFileUrl(url) {
  if (!url || typeof url !== 'string') return url;
  
  try {
    // Check if URL has multiple question marks
    const questionMarkCount = (url.match(/\?/g) || []).length;
    if (questionMarkCount > 1) {
      console.log('🧹 Cleaning malformed URL with multiple query parameters');
      // Replace all '?' after the first one with '&'
      let isFirstQuestion = true;
      const cleanedUrl = url.replace(/\?/g, (match) => {
        if (isFirstQuestion) {
          isFirstQuestion = false;
          return match;
        }
        return '&';
      });
      console.log('🧹 Original URL:', url);
      console.log('🧹 Cleaned URL:', cleanedUrl);
      return cleanedUrl;
    }
    
    // Validate URL structure
    new URL(url);
    return url;
  } catch (error) {
    console.warn('⚠️ Invalid URL format:', url, error.message);
    return url; // Return original URL if cleaning fails
  }
}

// Test cases based on user's example
const testUrls = [
  // User's example of malformed URL
  'https://s3.amazonaws.com/bucket/file.pdf?AWSParams=values?token=jwt123',
  
  // More test cases
  'https://s3.amazonaws.com/bucket/file.pdf?AWSAccessKeyId=key&Expires=1234567890&Signature=sig?token=jwt456',
  
  // Already valid URL
  'https://s3.amazonaws.com/bucket/file.pdf?AWSAccessKeyId=key&Expires=1234567890&Signature=sig&token=jwt789',
  
  // Multiple issues
  'https://example.com/file.pdf?param1=value1?param2=value2?token=jwt',
  
  // Edge case - no query params
  'https://example.com/file.pdf',
  
  // Edge case - single param
  'https://example.com/file.pdf?token=jwt'
];

console.log('🧪 Testing URL Cleaning Logic');
console.log('=============================\n');

testUrls.forEach((url, index) => {
  console.log(`Test ${index + 1}:`);
  console.log(`Input:  ${url}`);
  
  const cleaned = cleanFileUrl(url);
  console.log(`Output: ${cleaned}`);
  
  // Validate cleaned URL
  try {
    new URL(cleaned);
    console.log('✅ Valid URL format');
  } catch (error) {
    console.log('❌ Invalid URL format:', error.message);
  }
  
  console.log('---\n');
});

console.log('🎯 URL Cleaning Logic Test Complete!');
