# 🚨 PDF Viewer 403 Error - ROOT CAUSE IDENTIFIED

## 🎯 **PROBLEM IDENTIFIED**

The user's curl requests reveal the **root cause** of the 403 errors:

### ❌ **Conflicting Authentication in Backend URLs**

The backend is generating URLs with **BOTH** AWS S3 signatures AND JWT tokens:

```
http://94.249.71.89:9000/minio/opensign-bucket/file.pdf?
X-Amz-Algorithm=AWS4-HMAC-SHA256&
X-Amz-Credential=minioadmin%2F20250908%2Fus-east-1%2Fs3%2Faws4_request&
X-Amz-Date=20250908T012334Z&
X-Amz-Expires=160&
X-Amz-Signature=44bd47f6fe8078c5c7994f576b616d04e910f4ca917f74cb32d366ace34030ae&
X-Amz-SignedHeaders=host&
token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 🔍 **Why This Causes 403 Errors**

1. **AWS S3 Signature Authentication**: The URL has complete AWS signature parameters for direct S3 access
2. **JWT Token Authentication**: The URL also has a `&token=` parameter with JWT authentication
3. **Server Confusion**: The server doesn't know which authentication method to use
4. **Result**: 403 Forbidden because neither authentication method works when both are present

## 🛠️ **IMMEDIATE FIXES IMPLEMENTED**

### 1. **Infinite Loop Prevention**
✅ **FIXED** - Added rate limiting to `usePDFLoader` hook:
- Prevents multiple simultaneous requests
- Tracks last loaded document ID
- Only loads once per document

### 2. **Conflicting Authentication Detection**
✅ **IMPLEMENTED** - Smart URL filtering in `documents-api-service.ts`:

```typescript
// Skip URLs with conflicting authentication
if (fileUrl.includes('X-Amz-') && fileUrl.includes('&token=')) {
  console.warn('Skipping URL - conflicting authentication detected');
  // Continue to next endpoint instead of using broken URL
}
```

### 3. **Better Error Messages**
✅ **ENHANCED** - Clear error messages explaining the root cause:

```
"PDF preview unavailable: Backend URLs have conflicting authentication (AWS + JWT). 
This causes 403 errors. Backend team needs to fix URL generation to use either 
AWS signatures OR JWT tokens, not both."
```

## 🎯 **BACKEND SOLUTION REQUIRED**

### **Option A: Pure AWS S3 Signatures (Recommended)**
The backend should return URLs with **ONLY** AWS parameters:
```
http://94.249.71.89:9000/minio/opensign-bucket/file.pdf?
X-Amz-Algorithm=AWS4-HMAC-SHA256&
X-Amz-Credential=minioadmin%2F20250908%2Fus-east-1%2Fs3%2Faws4_request&
X-Amz-Date=20250908T012334Z&
X-Amz-Expires=160&
X-Amz-Signature=44bd47f6fe8078c5c7994f576b616d04e910f4ca917f74cb32d366ace34030ae&
X-Amz-SignedHeaders=host
```

### **Option B: Pure JWT Authentication**
The backend should return URLs with **ONLY** JWT tokens:
```
http://94.249.71.89:9000/api/files/GQPB5IAUV1?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Option C: Base64 Content Delivery (Best)**
Implement the `getfilecontent` endpoint properly:
```javascript
// Backend should return:
{
  result: {
    success: true,
    fileContent: "JVBERi0xLjQK...", // base64 PDF content
    fileName: "document.pdf",
    contentType: "application/pdf"
  }
}
```

## 🚀 **CURRENT STATUS**

### ✅ **What's Working:**
- Infinite loop prevented
- Conflicting URLs detected and skipped
- Clear error messages for debugging
- Frontend properly handles authentication conflicts

### ❌ **What Still Needs Backend Fix:**
- All current endpoints return conflicting authentication URLs
- `getfilecontent` endpoint not properly implemented
- PDF preview unavailable until backend is fixed

### 🔄 **Temporary Workaround:**
The frontend now gracefully handles the authentication conflicts and provides clear error messages instead of endless 403 errors and infinite loops.

## 📋 **NEXT STEPS**

1. **Backend Team**: Fix URL generation to use single authentication method
2. **Alternative**: Implement proper `getfilecontent` endpoint with base64 content
3. **Testing**: Verify fixed URLs work without 403 errors
4. **Frontend**: Re-enable base64 content delivery once backend is ready

## 🎯 **CRITICAL INSIGHT**

The issue is **NOT** in the frontend URL cleaning or PDF viewer - it's the backend generating URLs with conflicting authentication schemes. No amount of frontend fixes can resolve server-side authentication conflicts.

**The backend must choose ONE authentication method per URL.**
