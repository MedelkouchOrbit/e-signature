# Backend Requirements: Document Signing Implementation

## 🔍 Current Backend Analysis Results

Based on our testing, here's what exists and what's needed:

### ✅ Existing Endpoints:
- `/functions/getDocument` - ✅ Works (needs correct parameters)
- `/functions/signPdf` - ✅ **EXISTS** but returns "Document not found" 
- `/classes/Document` - ✅ Exists (permission issues)

### ❌ Missing Endpoints:
- `/functions/signDocument` - Does not exist
- `/functions/addSignature` - Does not exist

## 🎯 Key Discovery: signPdf Endpoint EXISTS!

**Important:** `/functions/signPdf` returns a different error than non-existent functions:
- Non-existent: `"Invalid function: functionName"`
- signPdf: `"Document not found"` ← This means the function exists!

## 📋 Backend Team Requirements

### 1. Fix signPdf Endpoint Parameters
The `signPdf` function exists but needs correct parameters. Please provide:

**Required:**
- Correct parameter format for document `GQPB5IAUV1`
- Example working request body
- Expected response format

**Current Frontend Call:**
```javascript
fetch('/api/proxy/opensign/functions/signPdf', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Parse-Application-Id': 'opensign',
    'X-Parse-Session-Token': 'r:fc16b73c981e796f56d4bab8de6cc628'
  },
  body: JSON.stringify({
    documentId: 'GQPB5IAUV1',
    signerEmail: 'joe@joe.com',
    signatureData: {
      x: 100, y: 100, width: 150, height: 50, page: 1
    }
  })
})
```

### 2. Document Access Issues
Document `GQPB5IAUV1` is returning "Document not found" errors.

**Please verify:**
- Does document `GQPB5IAUV1` exist in the database?
- Are there permission issues preventing access?
- What's the correct way to reference this document?

### 3. Signer Status Field Issue
When fetching document data, signer status shows as `undefined` instead of `"waiting"`.

**Please fix:**
- Update signer status field to show correct values
- Ensure status transitions work: `waiting` → `signed` → `completed`

### 4. Complete signPdf Implementation
The `signPdf` function should:

**Input:**
```javascript
{
  documentId: "GQPB5IAUV1",
  signerEmail: "joe@joe.com", 
  signatureData: {
    x: 100,
    y: 100,
    width: 150,
    height: 50,
    page: 1
  }
}
```

**Expected Output:**
```javascript
{
  success: true,
  signedDocumentUrl: "https://...",
  documentStatus: "signed",
  signerStatus: "signed"
}
```

**Required Backend Logic:**
1. Validate signer has permission to sign document
2. Insert signature into PDF binary at specified coordinates
3. Update document status to "signed"
4. Update signer status to "signed"  
5. Return URL to signed PDF

### 5. Alternative Implementation
If `signPdf` cannot be fixed, please implement one of these:
- `/functions/signDocument`
- `/functions/addSignature`
- `/functions/completeSign`

## 🔧 Test Cases for Backend Team

### Test 1: Document Access
```bash
curl -X POST http://localhost:3000/api/proxy/opensign/functions/getDocument \
  -H "Content-Type: application/json" \
  -H "X-Parse-Application-Id: opensign" \
  -H "X-Parse-Session-Token: r:fc16b73c981e796f56d4bab8de6cc628" \
  -d '{"documentId": "GQPB5IAUV1"}'
```
**Expected:** Document data with correct signer status

### Test 2: Sign Document
```bash
curl -X POST http://localhost:3000/api/proxy/opensign/functions/signPdf \
  -H "Content-Type: application/json" \
  -H "X-Parse-Application-Id: opensign" \
  -H "X-Parse-Session-Token: r:fc16b73c981e796f56d4bab8de6cc628" \
  -d '{
    "documentId": "GQPB5IAUV1",
    "signerEmail": "joe@joe.com",
    "signatureData": {
      "x": 100, "y": 100, "width": 150, "height": 50, "page": 1
    }
  }'
```
**Expected:** Successful signing with signed PDF URL

## ⏰ Priority: HIGH

**Blocking Issue:** Frontend document signing is completely blocked until backend provides:
1. Working `signPdf` endpoint parameters
2. Document access fix for `GQPB5IAUV1`
3. Signer status field corrections

## 🤝 Next Steps

**Backend Team:**
1. Fix `signPdf` endpoint parameters and documentation
2. Verify document `GQPB5IAUV1` exists and is accessible
3. Fix signer status field (undefined → waiting/signed)
4. Test complete signing workflow

**Frontend Team:**
1. Update implementation based on corrected backend API
2. Test signing with joe@joe.com
3. Verify PDF binary modification works correctly

---
**Created:** September 8, 2025  
**Status:** Waiting for backend team response  
**Contact:** Frontend team ready to implement once backend provides correct API format
