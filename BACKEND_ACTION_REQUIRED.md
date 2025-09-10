**URGENT: Backend Team Action Required**

## Issue Summary
Document signing is failing with error: `Parse Server API not accessible`

## Root Cause  
The OpenSign server at `http://94.249.71.89:9000` is **only serving frontend HTML** - the Parse Server API endpoints are not accessible.

## Required Fix
Mount Parse Server properly to expose API endpoints:

```javascript
// Add this to your server configuration
const ParseServer = require('parse-server').ParseServer;
const api = new ParseServer({
  databaseURI: 'your-mongodb-uri',
  cloud: './cloud/main.js',
  appId: 'opensign',
  masterKey: 'XnAadwKxxByMr',
  serverURL: 'http://94.249.71.89:9000/1'
});

// Mount Parse API on /1 path
app.use('/1', api);
```

## Test After Fix
```bash
# This should return JSON, not HTML:
curl -X POST http://94.249.71.89:9000/1/login \
  -H "X-Parse-Application-Id: opensign" \
  -H "Content-Type: application/json" \
  -d '{"username":"joe@joe.com","password":"Meticx12@"}'
```

## Verification
- Open: http://localhost:3000/api-test.html
- Click "Test Login" - should show ✅ success
- Click "Test Document Signing" - should access cloud functions

## Priority: CRITICAL
Document signing is completely broken until Parse Server API is accessible.

**Contact:** Frontend implementation is complete - waiting for backend API access.
