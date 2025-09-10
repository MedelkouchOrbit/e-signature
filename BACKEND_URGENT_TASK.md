# 🚨 URGENT: Backend Task - Fix Parse Server API Accessibility Issue

## Problem Statement
**CRITICAL BUG**: Document signing is completely broken due to Parse Server API not being accessible.

**Error in Frontend**: 
```
ApiError: Parse Server API not accessible
    at handleResponse (webpack-internal:///(app-pages-browser)/./app/lib/api-service.ts:70:15)
    at async DocumentsApiService.signDocument (webpack-internal:///(app-pages-browser)/./app/lib/documents-api-service.ts:441:30)
```

## Root Cause Analysis
The OpenSign server at `http://94.249.71.89:9000` is **ONLY serving the frontend application** (HTML pages) and is **NOT exposing Parse Server API endpoints**.

### What's Happening:
- ❌ All API calls to `http://94.249.71.89:9000/1/login` return HTML frontend
- ❌ All API calls to `http://94.249.71.89:9000/1/functions/signPdf` return HTML frontend  
- ❌ All API calls to `http://94.249.71.89:9000/1/classes/*` return HTML frontend
- ✅ Frontend application loads correctly at `http://94.249.71.89:9000`

### Expected Behavior:
- ✅ API calls should return JSON responses from Parse Server
- ✅ Authentication endpoints should be accessible
- ✅ Cloud functions should be callable via API

## Backend Team Tasks

### 🎯 **TASK 1: Mount Parse Server API (CRITICAL)**
Your Parse Server is not properly mounted or exposed. You need to:

1. **Configure Express App to mount Parse Server on `/1` path:**
```javascript
const express = require('express');
const ParseServer = require('parse-server').ParseServer;
const app = express();

// Configure Parse Server
const api = new ParseServer({
  databaseURI: process.env.DATABASE_URI || 'mongodb://localhost:27017/opensign',
  cloud: './cloud/main.js', // Your cloud functions
  appId: 'opensign',
  masterKey: 'XnAadwKxxByMr',
  serverURL: 'http://94.249.71.89:9000/1', // IMPORTANT: Must match your domain
  allowClientClassCreation: false,
  enableAnonymousUsers: false
});

// 🔥 CRITICAL: Mount Parse API on /1 path BEFORE static files
app.use('/1', api);

// Serve static frontend files AFTER API mounting
app.use('/', express.static('public')); // or wherever your frontend is

const port = process.env.PORT || 9000;
app.listen(port, () => {
  console.log('✅ Parse Server running on http://94.249.71.89:9000/1');
  console.log('✅ Frontend running on http://94.249.71.89:9000');
});
```

### 🎯 **TASK 2: Verify Cloud Functions are Accessible**
Ensure these functions work via API:

1. **Check `signPdf` function exists in `cloud/main.js`:**
```javascript
// In your cloud/main.js
Parse.Cloud.define("signPdf", async (request) => {
  // Your existing signPdf implementation
  console.log("✅ signPdf function called via API");
  return { status: "success", message: "Function accessible" };
});

Parse.Cloud.define("getfilecontent", async (request) => {
  // Your existing getfilecontent implementation  
  console.log("✅ getfilecontent function called via API");
  return { status: "success", message: "Function accessible" };
});
```

### 🎯 **TASK 3: Test API Endpoints After Fix**
Run these commands to verify the fix works:

```bash
# Test 1: Authentication endpoint should return JSON (not HTML)
curl -X POST http://94.249.71.89:9000/1/login \
  -H "X-Parse-Application-Id: opensign" \
  -H "Content-Type: application/json" \
  -d '{"username":"joe@joe.com","password":"Meticx12@"}'

# Expected response: {"sessionToken":"r:xxx","objectId":"xxx","email":"joe@joe.com"}
# ❌ Current response: HTML frontend page

# Test 2: Classes endpoint should return JSON
curl -H "X-Parse-Application-Id: opensign" \
  http://94.249.71.89:9000/1/classes/contracts_Document

# Expected response: {"results":[...],"count":0}  
# ❌ Current response: HTML frontend page

# Test 3: Functions endpoint should be accessible
curl -X POST http://94.249.71.89:9000/1/functions/signPdf \
  -H "X-Parse-Application-Id: opensign" \
  -H "X-Parse-Session-Token: SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"docId":"test"}'

# Expected response: {"result":{"status":"success"}}
# ❌ Current response: HTML frontend page
```

### 🎯 **TASK 4: Update Server Configuration**
Make sure your server configuration follows this order:

```javascript
const express = require('express');
const app = express();

// 1. FIRST: Mount Parse Server API
app.use('/1', parseServerAPI);

// 2. THEN: Add other API routes if any
app.use('/api', otherRoutes);

// 3. LAST: Serve static frontend files
app.use('/', express.static('frontend-build-folder'));

// 4. Catch-all for frontend routing (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend-build-folder/index.html'));
});
```

## Verification Steps

### ✅ **How to Know You Fixed It:**

1. **Run this test command:**
```bash
curl -I http://94.249.71.89:9000/1/login
```
**Expected result:** `Content-Type: application/json`
**Current result:** `Content-Type: text/html`

2. **Check Parse Server startup logs:**
```
✅ Parse Server running on http://94.249.71.89:9000/1
✅ API endpoints accessible at /1/*
✅ Cloud functions loaded
```

3. **Test in frontend:**
   - Open: http://localhost:3000/api-test.html
   - Click "Test Login" → Should show ✅ success
   - Document signing should work without errors

## Common Issues & Solutions

### 🔧 **Issue 1: Route Order**
**Problem:** Static file serving catches all routes before Parse Server
**Solution:** Mount Parse Server BEFORE static files

### 🔧 **Issue 2: Missing Parse Server Mount**
**Problem:** Parse Server not mounted on any path
**Solution:** Add `app.use('/1', parseServerAPI)`

### 🔧 **Issue 3: Wrong Server URL**
**Problem:** Parse Server `serverURL` doesn't match actual URL
**Solution:** Set `serverURL: 'http://94.249.71.89:9000/1'`

### 🔧 **Issue 4: Cloud Functions Not Loading**
**Problem:** `cloud` parameter pointing to wrong file
**Solution:** Verify `cloud: './cloud/main.js'` path is correct

## Success Criteria

✅ **API endpoints return JSON (not HTML)**
✅ **Authentication works: `POST /1/login`**
✅ **Classes accessible: `GET /1/classes/contracts_Document`**  
✅ **Functions callable: `POST /1/functions/signPdf`**
✅ **Frontend document signing works without errors**

## Timeline
**Priority:** 🚨 **CRITICAL** - Document signing is completely broken
**Estimate:** 30 minutes to fix server configuration
**Testing:** 15 minutes to verify all endpoints

## Contact
- **Frontend Status:** ✅ Complete and ready - waiting for backend API
- **Issue Location:** Server configuration at `http://94.249.71.89:9000`
- **Verification Tools:** Already created and ready for testing

---

**Please confirm when you've implemented the fix so we can test the document signing functionality.**
