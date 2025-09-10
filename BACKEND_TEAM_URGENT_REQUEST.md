# URGENT: Backend Team - Document Signing Endpoint Analysis Required

## 🚨 Current Situation
Frontend team needs to implement document signing for user `joe@joe.com` on document `GQPB5IAUV1`, but we discovered critical gaps in the backend API.

## 🔍 What We've Discovered

### ✅ Working Endpoints:
- `/functions/getDocument` - ✅ EXISTS and works correctly

### ❌ Missing Endpoints:
- `/functions/signDocument` - ❌ "Invalid function" error
- `/functions/addSignature` - ❌ "Invalid function" error  
- `/functions/completeSign` - ❌ "Invalid function" error
- `/functions/signContract` - ❌ "Invalid function" error
- `/functions/sign` - ❌ "Invalid function" error
- `/functions/signDoc` - ❌ "Invalid function" error
- `/functions/addSign` - ❌ "Invalid function" error
- `/functions/createSign` - ❌ "Invalid function" error

### 🔍 Unclear Status:
- `/functions/signPdf` - Returns "Document not found" (different from "Invalid function")
  - This suggests the function exists but needs correct parameters
  - Need backend team to confirm if this endpoint exists and provide correct usage

## 🎯 URGENT QUESTIONS FOR BACKEND TEAM

### 1. Does signPdf endpoint actually exist?
Our frontend code calls `signPdf` but tests show conflicting results:
```javascript
// Our current implementation in documents-api-service.ts
async signDocument(documentId: string, signatureData: SignDocumentRequest): Promise<any> {
  const response = await fetch(`${this.baseUrl}/functions/signPdf`, {
    method: 'POST',
    headers: this.getHeaders(),
    body: JSON.stringify({
      documentId,
      ...signatureData
    })
  });
  return response.json();
}
```

**Question:** What is the correct endpoint name and parameter format for signing documents?

### 2. What signing endpoints DO exist?
We tested many common signing function names but found none. 

**Question:** Please provide the complete list of available signing-related endpoints with:
- Exact endpoint names
- Required parameters  
- Expected response format
- Example usage

### 3. Current Document Status Issue
When we fetch document `GQPB5IAUV1`, the signer status shows as `undefined` instead of `"waiting"`.

**Question:** 
- Is this a data issue or API issue?
- What should the signer status be for a document awaiting signature?
- How do we update signer status when document is signed?

## 📋 Required Information from Backend Team

Please provide:

1. **Complete API Documentation** for document signing workflow
2. **Exact endpoint names** that exist for signing
3. **Parameter formats** with examples
4. **Response formats** for success/error cases
5. **Database schema** for document and signer status fields
6. **Signing workflow** - step by step process

## 🔧 Test Environment Details

- Backend URL: `http://localhost:3000/api/proxy/opensign`
- Session Token: `r:fc16b73c981e796f56d4bab8de6cc628`
- Application ID: `opensign`
- Test Document: `GQPB5IAUV1`
- Test Signer: `joe@joe.com`

## 💡 Suggested Backend Response Format

```json
{
  "availableEndpoints": {
    "signing": [
      {
        "name": "/functions/actualSigningEndpoint",
        "method": "POST", 
        "parameters": {
          "documentId": "string",
          "signerEmail": "string",
          "signatureData": {
            "x": "number",
            "y": "number", 
            "width": "number",
            "height": "number",
            "page": "number"
          }
        },
        "response": {
          "success": true,
          "signedDocumentUrl": "string"
        }
      }
    ]
  },
  "databaseSchema": {
    "documentStatus": ["draft", "pending", "signed", "completed"],
    "signerStatus": ["waiting", "signed", "declined"]
  },
  "signingWorkflow": [
    "1. Frontend calls /functions/signDocument",
    "2. Backend validates signer permissions", 
    "3. Backend inserts signature into PDF binary",
    "4. Backend updates document/signer status",
    "5. Backend returns signed document URL"
  ]
}
```

## ⏰ Urgency Level: HIGH
Frontend implementation is blocked until we understand the correct backend API structure.

**Next Steps:**
1. Backend team provides complete signing API documentation
2. Frontend team updates implementation based on actual endpoints
3. Test complete signing workflow with joe@joe.com
4. Deploy working document signing feature

---
**Created:** September 8, 2025  
**Frontend Team Contact:** Please respond with complete API documentation
**Priority:** Blocking - Cannot proceed without backend clarification
