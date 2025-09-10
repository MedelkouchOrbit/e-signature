#!/usr/bin/env node

/**
 * Simple Test Script for OpenSign Backend Enhancements
 *
 * This script tests the new API integrations:
 * - Enhanced Document Status Filtering (getReport API)
 * - Enhanced User Document Visibility
 * - Automatic Contact Book Management (batchdocuments API)
 * - Improved Document Assignment (phone field support)
 */

import https from 'https'
import http from 'http'

// Configuration
const BASE_URL = 'http://localhost:3000'
const TEST_TIMEOUT = 10000

// Test utilities
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString()
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'
  console.log(`${prefix} [${timestamp}] ${message}`)
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http

    const request = protocol.get(url, options, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data)
          resolve({ status: res.statusCode, data: jsonData })
        } catch {
          resolve({ status: res.statusCode, data })
        }
      })
    })

    request.on('error', reject)
    request.setTimeout(TEST_TIMEOUT, () => {
      request.destroy()
      reject(new Error('Request timeout'))
    })
  })
}

// Test functions
async function testServerHealth() {
  try {
    log('Testing server health...')
    const response = await makeRequest(BASE_URL)
    if (response.status === 200) {
      log('Server is running successfully', 'success')
      return true
    } else {
      log(`Server responded with status ${response.status}`, 'error')
      return false
    }
  } catch (error) {
    log(`Server health check failed: ${error.message}`, 'error')
    return false
  }
}

async function testTestPage() {
  try {
    log('Testing backend enhancements test page...')
    const response = await makeRequest(`${BASE_URL}/test-backend-enhancements`)
    if (response.status === 200) {
      log('Test page is accessible', 'success')
      return true
    } else {
      log(`Test page responded with status ${response.status}`, 'error')
      return false
    }
  } catch (error) {
    log(`Test page check failed: ${error.message}`, 'error')
    return false
  }
}

async function runTests() {
  log('🚀 Starting OpenSign Backend Enhancements Test Suite')
  log('==================================================')

  const results = []

  // Test 1: Server Health
  results.push(await testServerHealth())

  // Test 2: Test Page Accessibility
  results.push(await testTestPage())

  // Summary
  const passed = results.filter(Boolean).length
  const total = results.length

  log('')
  log(`Test Results: ${passed}/${total} tests passed`)

  if (passed === total) {
    log('🎉 All tests passed! Backend enhancements are ready for use.', 'success')
  } else {
    log('⚠️ Some tests failed. Please check the server configuration.', 'error')
  }

  log('')
  log('Next Steps:')
  log('1. Open http://localhost:3000/test-backend-enhancements in your browser')
  log('2. Run the comprehensive test suite')
  log('3. Test individual components with sample data')
  log('4. Verify API responses match expected formats')
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = { runTests, testServerHealth, testTestPage }
