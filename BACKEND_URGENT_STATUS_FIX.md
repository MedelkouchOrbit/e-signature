# 🚨 URGENT: Backend signPdf Status Update Bug

## Quick Summary for Backend Team

**PROBLEM**: The `signPdf` function is **NOT updating document status** after successful signing operations.

## Evidence

### What We Sent:
```bash
POST /api/app/functions/signPdf
{
  "docId": "avtOApfK8d",
  "userId": "4apCqg38VG", 
  "signature": "data:image/png;base64,...",
  "pdfFile": "JVBERi0xLjQK..."
}
```

### What Should Happen:
1. ✅ Process the signature (working)
2. ❌ Update placeholder status to "signed" (NOT WORKING)
3. ❌ Update document status to "signed" or "partially_signed" (NOT WORKING)
4. ❌ Add signedAt timestamp (NOT WORKING)
5. ❌ Return enhanced response with status info (NOT WORKING)

### Current State After Signing:
From the documents list API, document `avtOApfK8d` shows:
```json
{
  "objectId": "avtOApfK8d",
  "Status": "waiting", // ❌ STILL "waiting" after user signed!
  "Placeholders": [
    {
      "id": "test-signature",
      "type": "signature", 
      "email": "joe@joe.com",
      "signerPtr": {
        "objectId": "",
        "Email": "joe@joe.com",
        "Name": "joe"
      }
      // ❌ Missing: status, signedAt, signerObjId fields
    }
  ]
}
```

## What Backend Must Fix

### 1. Update Document Status
After successful signing, change document status:
- Single signer: `"waiting"` → `"signed"`
- Multiple signers: `"waiting"` → `"partially_signed"` → `"signed"`

### 2. Update Placeholder Status  
Add these fields to signed placeholders:
```json
{
  "status": "signed",
  "signedAt": "2025-09-09T00:13:05.123Z", 
  "signerObjId": "4apCqg38VG"
}
```

### 3. Return Enhanced Response
```json
{
  "status": "success",
  "data": {
    "documentId": "avtOApfK8d",
    "newStatus": "signed",
    "signedPlaceholder": { "id": "test-signature", "signedAt": "..." }
  },
  "document": { /* full updated document */ }
}
```

## Working Example
Document `oh9EKJDHsl` shows the **correct implementation** - it has proper status tracking:

```json
{
  "Status": "waiting",
  "Placeholders": [
    {
      "status": "signed",           // ✅ Has status
      "signedAt": "2025-09-08T23:38:41.550Z", // ✅ Has timestamp  
      "order": 1
    },
    {
      "status": "signed",           // ✅ Has status
      "signedAt": "2025-09-08T23:39:35.188Z", // ✅ Has timestamp
      "order": 2  
    },
    {
      "status": "waiting",          // ✅ Correctly waiting
      "order": 3
    }
  ]
}
```

## Test Case
**Please test with document ID: `avtOApfK8d`**
- User ID: `4apCqg38VG` 
- Email: `joe@joe.com`
- After signing, the document status should change from `"waiting"` to `"signed"`

## Frontend Ready ✅
The frontend is already updated to handle the enhanced response format. Once you fix the backend status updates, everything will work perfectly!

---
**Priority: CRITICAL** - This blocks the entire signing workflow from working properly.
