# 🖊️ URGENT: Document Signing Implementation Required

## 📋 **SITUATION OVERVIEW**

**User**: joe@joe.com needs to sign document "Bulk Send: Test - Joe" (ID: GQPB5IAUV1)

**Current Status**: 
- ✅ Frontend signing interface is complete and working
- ✅ User is correctly assigned as signer in the document
- ❌ Backend `signPdf` endpoint is missing (returns 404)
- ❌ Signer status is `undefined` instead of `waiting`

---

## 🚨 **IMMEDIATE BACKEND REQUIREMENTS**

### 1. **FIX SIGNER STATUS FIELD**
**Problem**: Signer status is `undefined` instead of `waiting`
```javascript
// Current (BROKEN):
{
  "name": "joe",
  "email": "joe@joe.com", 
  "status": undefined  // ❌ This should be "waiting"
}

// Required (FIXED):
{
  "name": "joe", 
  "email": "joe@joe.com",
  "status": "waiting"  // ✅ Correct initial status
}
```

### 2. **IMPLEMENT signPdf ENDPOINT**
**Required Path**: `/functions/signPdf`
**Method**: POST
**Expected Payload**:
```javascript
{
  "documentId": "GQPB5IAUV1",
  "signatureData": {
    "positions": [{
      "x": 100,        // X coordinate on PDF page
      "y": 100,        // Y coordinate on PDF page
      "width": 150,    // Signature width in points
      "height": 50,    // Signature height in points
      "page": 1        // Page number (1-based)
    }],
    "signerInfo": {
      "name": "joe",
      "email": "joe@joe.com"
    }
  }
}
```

### 3. **SIGNATURE BINARY INSERTION LOGIC**
The `signPdf` endpoint must:

#### Step 1: Validate Signing Permission
```javascript
// Check if user can sign
if (signer.status !== 'waiting') {
  throw new Error('User not authorized to sign');
}

// Check signing order (if enabled)
if (document.SendInOrder) {
  const previousSigners = document.Signers
    .filter(s => s.order < currentSigner.order)
    .every(s => s.status === 'signed');
  
  if (!previousSigners) {
    throw new Error('Previous signers must complete first');
  }
}
```

#### Step 2: Get PDF Binary File
```javascript
// Retrieve original PDF from Minio storage
const pdfBuffer = await getFileFromMinio(document.fileUrl);
```

#### Step 3: Insert Signature Token
```javascript
// Use PDF manipulation library (pdf-lib recommended)
import { PDFDocument, rgb } from 'pdf-lib';

const pdfDoc = await PDFDocument.load(pdfBuffer);
const pages = pdfDoc.getPages();
const targetPage = pages[signatureData.positions[0].page - 1];

// Insert signature (could be text, image, or drawn signature)
targetPage.drawText(signatureData.signerInfo.name, {
  x: signatureData.positions[0].x,
  y: signatureData.positions[0].y,
  size: 12,
  color: rgb(0, 0, 0)
});

const signedPdfBytes = await pdfDoc.save();
```

#### Step 4: Save Updated PDF
```javascript
// Save signed PDF back to Minio
const signedFileUrl = await saveSignedPdfToMinio(signedPdfBytes, documentId);

// Update document with signed file URL
await updateDocument(documentId, {
  signedFileUrl: signedFileUrl,
  // Keep original file for reference
});
```

#### Step 5: Update Statuses
```javascript
// Update signer status
await updateSigner(signerId, {
  status: 'signed',
  signedAt: new Date().toISOString()
});

// Check if all signers completed
const allSigned = document.Signers.every(s => s.status === 'signed');
if (allSigned) {
  await updateDocument(documentId, {
    status: 'completed',
    completedAt: new Date().toISOString()
  });
}
```

---

## 🔍 **BACKEND SYSTEM SEARCH TASKS**

Please search your OpenSign system for:

### 1. **Existing PDF Manipulation**
- Look for pdf-lib, PyPDF2, or similar libraries
- Search for existing signature insertion code
- Check how PDF modifications are currently handled

### 2. **File Storage Management**
- How are signed PDFs stored vs original PDFs?
- What is the file naming convention for signed documents?
- How are file URLs updated after signing?

### 3. **Signature Format**
- How are signatures currently stored? (text, image, drawn paths?)
- Is there an existing signature generation system?
- What format should the signature token be in the PDF?

### 4. **Notification System**
- How are signers notified when it's their turn?
- Is there an existing email notification system?
- How is signing order enforced in other parts of the system?

---

## 🧪 **TESTING INFORMATION**

### Test Document
- **ID**: `GQPB5IAUV1`
- **Name**: "Bulk Send: Test - Joe"
- **Status**: `waiting`
- **Signer**: joe@joe.com
- **Send in Order**: `false` (so order validation not needed for this test)

### Test Session
- **Base URL**: `http://localhost:3000/api/proxy/opensign`
- **Session Token**: `r:fc16b73c981e796f56d4bab8de6cc628`
- **Frontend URL**: `http://localhost:3000/en/documents/GQPB5IAUV1/sign`

### Expected Response from signPdf
```javascript
{
  "result": {
    "objectId": "GQPB5IAUV1",
    "Name": "Bulk Send: Test - Joe",
    "Status": "waiting", // or "completed" if last signer
    "Signers": [{
      "name": "joe",
      "email": "joe@joe.com", 
      "status": "signed",      // ✅ Updated status
      "signedAt": "2025-09-08T03:00:00.000Z"
    }],
    "signedFileUrl": "https://minio.../signed_document.pdf" // New signed file
  }
}
```

---

## 🚀 **IMPLEMENTATION PRIORITY**

1. **HIGH PRIORITY** - Fix signer status field (currently `undefined`)
2. **HIGH PRIORITY** - Implement basic `signPdf` endpoint structure  
3. **MEDIUM PRIORITY** - Add PDF binary signature insertion
4. **LOW PRIORITY** - Implement signing order validation (not needed for current test)

---

## ✅ **FRONTEND STATUS**

The frontend is **100% ready** and includes:
- ✅ Document loading and validation
- ✅ Signer authentication check
- ✅ PDF preview (with base64 content handling)
- ✅ Signature form with validation
- ✅ Proper error handling and user feedback
- ✅ Integration with `documentsApiService.signDocument()`

**Frontend will work immediately** once backend implements the `signPdf` endpoint.

---

## 📞 **NEXT STEPS**

1. **Backend team** implements `signPdf` endpoint
2. **Test** with document GQPB5IAUV1 and user joe@joe.com
3. **Verify** PDF signature insertion and status updates
4. **Expand** to handle signing order and notifications

**🎯 Goal**: joe@joe.com should be able to sign the document and see the updated PDF with their signature inserted.**
