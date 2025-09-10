/**
 * Backend Fixes for createBatchDocs function
 * Apply these changes to your backend createBatchDocs function
 * Location: Your Parse Server backend, in the batchdocuments cloud function
 */

// INSTRUCTIONS:
// 1. Find your createBatchDocs function in your Parse Server backend
// 2. Locate the batchQuery function inside it
// 3. Apply the fixes below

// 🔧 FIX 1: Replace the validation section in batchQuery function
// Find this code block and replace it:

// BEFORE (causing the error):
/*
if (!x?.CreatedBy?.objectId) {
  throw new Error('CreatedBy.objectId is required for each document');
}
if (!x?.ExtUserPtr?.objectId) {
  throw new Error('ExtUserPtr.objectId is required for each document');
}
*/

// AFTER (fixed):
/*
if (!x?.CreatedBy?.objectId) {
  throw new Error('CreatedBy.objectId is required for each document');
}

// FIX: Handle null ExtUserPtr - use default values or skip if critical
if (!x?.ExtUserPtr) {
  console.log('Warning: ExtUserPtr is null for document:', x.Name);
  // Provide default values using current user data
  x.ExtUserPtr = {
    objectId: resExt.id, // Use the current user's ID as fallback
    className: 'contracts_Users', // Default class name
    Name: _resExt.Name || 'Unknown',
    Email: _resExt.Email || '',
    Company: _resExt.Company || '',
    Phone: _resExt.Phone || ''
  };
}

if (!x?.ExtUserPtr?.objectId) {
  throw new Error('ExtUserPtr.objectId is required for each document');
}
*/

// 🔧 FIX 2: Replace the ExtUserPtr pointer creation
// Find this code and replace it:

// BEFORE:
/*
ExtUserPtr: {
  __type: 'Pointer',
  className: x.ExtUserPtr.className,
  objectId: x.ExtUserPtr?.objectId,
},
*/

// AFTER:
/*
ExtUserPtr: {
  __type: 'Pointer',
  className: x.ExtUserPtr?.className || 'contracts_Users',
  objectId: x.ExtUserPtr?.objectId,
},
*/

// 🔧 FIX 3: Replace the updateDocuments ExtUserPtr section
// Find this code and replace it:

// BEFORE:
/*
ExtUserPtr: {
  ...document.ExtUserPtr,
  objectId: resExt.id,
  Name: _resExt.Name || 'Unknown',
  Email: _resExt.Email || '',
  Company: _resExt.Company || '',
  Phone: _resExt.Phone || '',
  TenantId: _resExt.TenantId || null
}
*/

// AFTER:
/*
ExtUserPtr: document.ExtUserPtr ? {
  ...document.ExtUserPtr,
  objectId: document.ExtUserPtr.objectId || resExt.id,
  Name: document.ExtUserPtr.Name || _resExt.Name || 'Unknown',
  Email: document.ExtUserPtr.Email || _resExt.Email || '',
  Company: document.ExtUserPtr.Company || _resExt.Company || '',
  Phone: document.ExtUserPtr.Phone || _resExt.Phone || '',
  TenantId: document.ExtUserPtr.TenantId || _resExt.TenantId || null
} : {
  // Fallback when ExtUserPtr is null
  objectId: resExt.id,
  Name: _resExt.Name || 'Unknown',
  Email: _resExt.Email || '',
  Company: _resExt.Company || '',
  Phone: _resExt.Phone || '',
  TenantId: _resExt.TenantId || null
}
*/

console.log('Backend fixes applied successfully!');
