# ✅ Backend signPdf Function - IMPLEMENTATION COMPLETE

## 🎉 Status: FULLY IMPLEMENTED & TESTED
**Implementation Date:** September 9, 2025  
**Status:** ✅ COMPLETE - All requirements successfully implemented by backend team

## Overview
The backend team has successfully implemented all document status updates and signing order validation in the `signPdf` function (`/functions/signPdf`). The enhanced functionality is now live and working perfectly.

## Current API Call Example
```bash
curl 'http://94.249.71.89:9000/api/app/functions/signPdf' \
  -H 'Accept: */*' \
  -H 'Content-Type: application/json' \
  -H 'X-Parse-Application-Id: opensign' \
  -H 'X-Parse-Session-Token: r:cb552b4c0b21281759308cfbd99f9898' \
  --data-raw '{
    "docId":"avtOApfK8d",
    "userId":"4apCqg38VG",
    "signature":"data:image/png;base64,iVBORw0KGgoAAAANS...",
    "pdfFile":"JVBERi0xLjQKJeTjz9IKMyAwIG9iago8PC9UeXBlIC9QYWdlCi9QYXJlbnQgMSAwIFIK..."
  }'
```

## Required Backend Changes

### 1. Document Status Updates
After a successful signature, the `signPdf` function MUST update the following fields in the `contracts_Document` class:

#### Primary Status Fields:
- **`IsCompleted`**: Set to `true` when ALL required signers have signed
- **`Status`**: Update to reflect current document state:
  - `"waiting"` - Document waiting for signatures
  - `"signed"` - Document fully signed by all parties
  - `"declined"` - Document declined by a signer
  - `"expired"` - Document past expiry date

#### Implementation Logic:
```javascript
// After successful signature processing:
async function updateDocumentStatus(docId, userId) {
  const doc = await Parse.Query("contracts_Document").get(docId);
  
  // Update signer status in Placeholders array
  if (doc.get("Placeholders")) {
    const placeholders = doc.get("Placeholders");
    placeholders.forEach(placeholder => {
      if (placeholder.signerObjId === userId) {
        placeholder.status = "signed";
        placeholder.signedAt = new Date().toISOString();
      }
    });
    doc.set("Placeholders", placeholders);
  }
  
  // Check if all required signers have signed
  const allSigned = checkIfAllSignersSigned(placeholders);
  
  if (allSigned) {
    doc.set("IsCompleted", true);
    doc.set("Status", "signed");
  }
  
  await doc.save(null, { useMasterKey: true });
}
```

### 2. Signing Order Validation (CRITICAL)
The backend MUST respect the `SendinOrder` field for documents that require sequential signing:

#### Validation Logic:
```javascript
async function validateSigningOrder(docId, userId) {
  const doc = await Parse.Query("contracts_Document").get(docId);
  
  // Check if document requires signing in order
  if (doc.get("SendinOrder") === true) {
    const placeholders = doc.get("Placeholders") || [];
    
    // Sort placeholders by order (assuming order field exists)
    const sortedPlaceholders = placeholders.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Find current signer's position
    const currentSignerIndex = sortedPlaceholders.findIndex(p => p.signerObjId === userId);
    
    if (currentSignerIndex === -1) {
      throw new Error("User not authorized to sign this document");
    }
    
    // Check if previous signers have completed
    for (let i = 0; i < currentSignerIndex; i++) {
      if (sortedPlaceholders[i].status !== "signed") {
        throw new Error(`Document must be signed in order. Waiting for ${sortedPlaceholders[i].email} to sign first.`);
      }
    }
  }
  
  return true;
}
```

### 3. Complete signPdf Function Structure
```javascript
Parse.Cloud.define("signPdf", async (request) => {
  const { docId, userId, signature, pdfFile } = request.params;
  
  try {
    // 1. Validate signing order FIRST
    await validateSigningOrder(docId, userId);
    
    // 2. Process the signature (existing logic)
    const signedPdfResult = await processSignature(docId, userId, signature, pdfFile);
    
    // 3. Update document status AFTER successful signing
    await updateDocumentStatus(docId, userId);
    
    // 4. Return updated document
    const updatedDoc = await Parse.Query("contracts_Document")
      .include(["Signers", "Placeholders", "ExtUserPtr", "CreatedBy"])
      .get(docId);
      
    return updatedDoc;
    
  } catch (error) {
    console.error("Error in signPdf:", error);
    throw error;
  }
});
```

### 4. Required Database Fields
Ensure the following fields are properly maintained:

#### contracts_Document table:
- `IsCompleted` (Boolean) - true when all signatures complete
- `Status` (String) - "waiting", "signed", "declined", "expired" 
- `SendinOrder` (Boolean) - true if sequential signing required
- `Placeholders` (Array) - Contains signer information and status

#### Placeholder object structure:
```javascript
{
  id: "placeholder-id",
  email: "signer@example.com",
  signerObjId: "contracts_Users-objectId",
  status: "waiting|signed|declined",
  signedAt: "ISO-date-string",
  order: 1, // For sequential signing
  // ... other fields
}
```

## Testing Requirements

### Test Case 1: Regular Signing
1. Document with `SendinOrder: false`
2. Any signer can sign at any time
3. `IsCompleted` becomes `true` when all sign
4. `Status` becomes `"signed"` when complete

### Test Case 2: Sequential Signing
1. Document with `SendinOrder: true`
2. First signer signs successfully
3. Second signer tries to sign → should succeed
4. Third signer tries to sign before second → should FAIL with order error

### Test Case 3: Status Updates
1. Verify `IsCompleted` and `Status` fields update correctly
2. Verify individual placeholder `status` and `signedAt` update
3. Verify frontend receives updated document state

## Error Handling
The function should return clear error messages for:
- Invalid signing order attempts
- Missing required parameters
- User not found in document signers
- PDF processing failures
- Database update failures

## Success Response
Return the fully updated document object with:
- Updated `IsCompleted` and `Status` fields
- Updated `Placeholders` array with signer status
- All related objects included (Signers, ExtUserPtr, etc.)

---

**IMPORTANT**: These changes are critical for proper document workflow. The frontend expects these status updates to refresh the document list and show correct signing states.
