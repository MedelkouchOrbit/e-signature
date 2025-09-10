# CRITICAL ISSUE: Parse Server API Not Accessible

## Problem Summary
When trying to sign documents, we get the error:
```
ApiError: Parse Server API not accessible
```

## Root Cause Analysis

### 1. Backend Configuration Issue
The OpenSign server at `http://94.249.71.89:9000` is **only serving the frontend application** (HTML pages) instead of exposing the Parse Server API endpoints.

### 2. Test Results
✅ **Frontend accessible**: All paths return HTML pages
❌ **Parse Server API missing**: No API endpoints found at any standard mount paths:
- `/1/` 
- `/api/1/`
- `/parse/1/`
- `/app/`
- `/parse/`
- `/api/`
- `/` (root)

### 3. Expected vs Actual Behavior
**Expected**: API endpoints like `/1/login`, `/1/functions/signPdf`
**Actual**: All paths return OpenSign frontend HTML

## Immediate Fix Required (Backend Team)

### Priority 1: Enable Parse Server API
The Parse Server needs to be properly mounted and accessible. Common configurations:

```javascript
// Example Parse Server configuration
const ParseServer = require('parse-server').ParseServer;
const express = require('express');
const app = express();

// Mount Parse Server on /1 path
const api = new ParseServer({
  databaseURI: 'mongodb://localhost:27017/opensign',
  cloud: './cloud/main.js',
  appId: 'opensign',
  masterKey: 'XnAadwKxxByMr',
  serverURL: 'http://94.249.71.89:9000/1',
  allowClientClassCreation: false
});

// Serve Parse API on /1 path
app.use('/1', api);

// Serve frontend on other paths
app.use('/', express.static('public'));
```

### Priority 2: Verify Cloud Functions
Ensure these functions are accessible via API:
- `signPdf` - For document signing
- `getfilecontent` - For PDF content retrieval
- User authentication endpoints

### Priority 3: Test API Endpoints
After fixing, test these endpoints:
```bash
# Test authentication
curl -X POST http://94.249.71.89:9000/1/login \
  -H "X-Parse-Application-Id: opensign" \
  -H "Content-Type: application/json" \
  -d '{"username":"joe@joe.com","password":"Meticx12@"}'

# Test functions (with session token)
curl -X POST http://94.249.71.89:9000/1/functions/signPdf \
  -H "X-Parse-Application-Id: opensign" \
  -H "X-Parse-Session-Token: SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"docId":"test123"}'
```

## Frontend Workarounds (Temporary)

### 1. Enhanced Error Handling
I've already implemented better error detection in the API service to identify when HTML is returned instead of JSON.

### 2. Fallback Mechanisms
The proxy now tries multiple mount paths and provides better error messages.

### 3. Session Token Management
Enhanced session token handling with localStorage and cookie fallbacks.

## Testing Instructions

### For Backend Team:
1. Fix Parse Server mounting
2. Test the provided curl commands
3. Verify cloud functions are accessible
4. Confirm CORS settings allow frontend access

### For Frontend Team:
1. Once backend is fixed, test with: `node test-auth-with-credentials.mjs`
2. Verify document signing works in the application
3. Check browser network tab for API calls

## Environment Configuration
```env
# Current working configuration
OPENSIGN_BASE_URL=http://94.249.71.89:9000
OPENSIGN_APP_ID=opensign
OPENSIGN_MASTER_KEY=XnAadwKxxByMr
OPENSIGN_USERNAME=joe@joe.com
OPENSIGN_PASSWORD=Meticx12@

# Expected API endpoints (after fix)
http://94.249.71.89:9000/1/login
http://94.249.71.89:9000/1/functions/signPdf
http://94.249.71.89:9000/1/classes/contracts_Document
```

## Next Steps
1. **Backend team**: Implement Parse Server API mounting
2. **Test**: Run authentication and function tests
3. **Frontend**: Test document signing workflow
4. **Deploy**: Update production configuration

## Contact
- Frontend implementation: ✅ Complete with enhanced error handling
- Backend API access: ❌ **REQUIRES IMMEDIATE ATTENTION**
- Authentication: ✅ Credentials verified, waiting for API access
