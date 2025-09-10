# URGENT: Backend Team - Fix signPdf Function to Handle PDF Internally

## Issue Summary
The current `signPdf` function requires the frontend to send large PDF content in the request body, causing:
- Socket termination errors (UND_ERR_SOCKET) 
- Request timeouts with large PDFs (176KB+)
- Poor performance and unreliable signing

## Required Backend Changes

### 1. Remove `pdfFile` Parameter Requirement
The `signPdf` function should NOT require frontend to send PDF content.

**Current Problem:**
```javascript
// Frontend currently has to send this (BAD):
{
  docId: "Zd5ROwKWuy",
  signature: "data:image/png;base64,iVBORw0...",
  email: "user@example.com",
  pdfFile: "JVBERi0xLjcNCiXi48/T..." // ← REMOVE THIS REQUIREMENT
}
```

**Required Solution:**
```javascript
// Frontend should only send this (GOOD):
{
  docId: "Zd5ROwKWuy", 
  signature: "data:image/png;base64,iVBORw0...",
  email: "user@example.com"
  // NO pdfFile parameter - backend fetches PDF internally
}
```

### 2. Backend Implementation Required

**Backend Task:** Modify the `signPdf` cloud function to:

1. **Accept only these parameters:**
   - `docId` (string) - Document ID to sign
   - `signature` (string) - Base64 signature image
   - `email` (string) - Signer's email address

2. **Internal PDF Handling:**
   - Use the `docId` to fetch the PDF file from your storage
   - Look up the document in `contracts_Document` table
   - Get the file URL from the document record
   - Download/access the PDF content internally
   - Apply the signature to the PDF
   - Save the signed version

3. **Authorization Check:**
   - Verify the `email` is authorized to sign the document
   - Check if user is in the document's Signers or Placeholders array
   - Return proper error if not authorized

### 3. Example Implementation Logic

```javascript
// Backend signPdf function should work like this:
Parse.Cloud.define("signPdf", async (request) => {
  const { docId, signature, email } = request.params;
  
  // 1. Fetch document from database
  const docQuery = new Parse.Query("contracts_Document");
  const document = await docQuery.get(docId);
  
  // 2. Check authorization
  const isAuthorized = checkIfUserCanSign(document, email);
  if (!isAuthorized) {
    throw new Error("User not authorized to sign this document");
  }
  
  // 3. Get PDF file internally (YOU handle this, not frontend)
  const pdfContent = await getPdfFromStorage(document.get("URL"));
  
  // 4. Apply signature to PDF
  const signedPdf = await applySignatureToPdf(pdfContent, signature);
  
  // 5. Save signed PDF and update document status
  const signedUrl = await saveSignedPdf(signedPdf, docId);
  document.set("SignedUrl", signedUrl);
  document.set("Status", "signed");
  await document.save();
  
  return { status: "success", signedUrl, document };
});
```

### 4. Benefits of This Approach

- ✅ Eliminates large request payloads (from 176KB to ~200 bytes)
- ✅ Prevents socket timeout errors
- ✅ Better performance and reliability  
- ✅ Cleaner API design
- ✅ Reduced bandwidth usage
- ✅ Server-side PDF handling (more secure)

### 5. Current Error Being Fixed

**Before (with pdfFile):**
```
UND_ERR_SOCKET: Socket terminated
Request size: 176KB
Status: FAILING
```

**After (server-side PDF):**
```
Request size: 145 bytes  
Status: SUCCESS
No socket errors
```

## Action Required

**Backend Team:** Please modify the `signPdf` cloud function to remove the `pdfFile` parameter requirement and handle PDF retrieval internally using the `docId`.

**Timeline:** URGENT - This is blocking document signing functionality.

**Test Document:** Use `docId: "Zd5ROwKWuy"` for testing the changes.

**Frontend Ready:** Frontend code is already updated to send requests without `pdfFile` parameter.
