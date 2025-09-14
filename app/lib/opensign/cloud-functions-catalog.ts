/**
 * ✅ OpenSign Cloud Functions Catalog
 * Comprehensive list of all Parse Server cloud functions found in OpenSign
 * Source: /Users/medelkouch/Projects/orbit/OpenSign/apps/OpenSignServer/cloud/parsefunction/
 */

export interface OpenSignCloudFunction {
  name: string
  description: string
  params: string[]
  returns: string
  requiresAuth: boolean
  filePath: string
  implementationNotes: string[]
}

/**
 * Complete catalog of OpenSign Parse Cloud Functions
 * Extracted from the OpenSignServer/cloud/main.js and parsefunction/ directory
 */
export const OPENSIGN_CLOUD_FUNCTIONS: OpenSignCloudFunction[] = [
  // === Authentication & User Management ===
  {
    name: 'usersignup',
    description: 'Register new user with tenant setup and role assignment',
    params: ['userDetails.email', 'userDetails.password', 'userDetails.name', 'userDetails.role', 'userDetails.company', 'userDetails.phone', 'userDetails.jobTitle', 'userDetails.timezone'],
    returns: 'User object with tenant and extended user info',
    requiresAuth: false,
    filePath: 'parsefunction/usersignup.js',
    implementationNotes: [
      'Creates Parse User, partners_Tenant, and contracts_Users records',
      'Handles existing user login via /loginAs endpoint',
      'Sets up ACL permissions for created records',
      'Returns user with session token for automatic login'
    ]
  },
  {
    name: 'loginuser',
    description: 'Authenticate user with email and password',
    params: ['email', 'password'],
    returns: 'User object with session token',
    requiresAuth: false,
    filePath: 'parsefunction/loginUser.js',
    implementationNotes: [
      'Uses Parse.User.logIn() method',
      'Returns full user JSON with session token',
      'Handles invalid credentials with proper error codes'
    ]
  },
  {
    name: 'AuthLoginAsMail',
    description: 'Login user by email only (magic link authentication)',
    params: ['email'],
    returns: 'Session token for email-based authentication',
    requiresAuth: false,
    filePath: 'parsefunction/AuthLoginAsMail.js',
    implementationNotes: [
      'Uses /loginAs endpoint with master key',
      'Bypasses password requirement',
      'Used for email verification workflows'
    ]
  },
  {
    name: 'SendOTPMailV1',
    description: 'Send OTP email for two-factor authentication',
    params: ['email', 'otp'],
    returns: 'Email sending status',
    requiresAuth: false,
    filePath: 'parsefunction/SendOTPMailV1.js',
    implementationNotes: [
      'Sends OTP via configured email adapter',
      'Used in secure document signing flows'
    ]
  },
  {
    name: 'getUserId',
    description: 'Get user ID by email address',
    params: ['email'],
    returns: 'User object with ID',
    requiresAuth: true,
    filePath: 'parsefunction/getUserId.js',
    implementationNotes: [
      'Searches Parse User by email',
      'Used for contact creation and user linking'
    ]
  },
  {
    name: 'getUserDetails',
    description: 'Get current user extended details',
    params: [],
    returns: 'Extended user info from contracts_Users',
    requiresAuth: true,
    filePath: 'parsefunction/getUserDetails.js',
    implementationNotes: [
      'Returns contracts_Users record for authenticated user',
      'Includes tenant and role information'
    ]
  },
  {
    name: 'adduser',
    description: 'Add new user to organization/tenant',
    params: ['name', 'email', 'role', 'phone'],
    returns: 'Created user record',
    requiresAuth: true,
    filePath: 'parsefunction/addUser.js',
    implementationNotes: [
      'Creates user within existing tenant',
      'Sets up proper ACL permissions',
      'Links to requesting user\'s organization'
    ]
  },

  // === Document Management ===
  {
    name: 'getDocument',
    description: 'Retrieve document details with related data',
    params: ['docId', 'include?'],
    returns: 'Complete document object with signers, placeholders, audit trail',
    requiresAuth: true,
    filePath: 'parsefunction/getDocument.js',
    implementationNotes: [
      'Includes Signers, Placeholders, AuditTrail, CreatedBy',
      'Handles OTP-enabled documents with authentication check',
      'Returns signed URLs for document access',
      'Excludes archived documents'
    ]
  },
  {
    name: 'signPdf',
    description: 'Sign PDF document with signature data',
    params: ['docId', 'userId', 'signature', 'signatureData', 'ipAddress'],
    returns: 'Signed document with updated status',
    requiresAuth: true,
    filePath: 'parsefunction/signPdf.js (main signing function)',
    implementationNotes: [
      'Processes signature placement and PDF modification',
      'Updates document and signer status',
      'Handles sequential signing order validation',
      'Creates audit trail entries',
      'Generates signed PDF with certificates'
    ]
  },
  {
    name: 'getDrive',
    description: 'Get document folder/drive structure',
    params: ['docId?', 'limit', 'skip'],
    returns: 'Folder contents and document hierarchy',
    requiresAuth: true,
    filePath: 'parsefunction/getDrive.js',
    implementationNotes: [
      'Returns documents in folder or root level',
      'Supports pagination with limit/skip',
      'Includes folder relationships'
    ]
  },
  {
    name: 'getReport',
    description: 'Generate reports and analytics',
    params: ['reportType', 'filters'],
    returns: 'Report data and statistics',
    requiresAuth: true,
    filePath: 'parsefunction/getReport.js',
    implementationNotes: [
      'Provides document statistics and insights',
      'Supports various report types and filters'
    ]
  },
  {
    name: 'createduplicate',
    description: 'Create duplicate copy of document',
    params: ['docId'],
    returns: 'Duplicated document object',
    requiresAuth: true,
    filePath: 'parsefunction/createDuplicate.js',
    implementationNotes: [
      'Copies document with all placeholders and settings',
      'Resets signing status for new document'
    ]
  },
  {
    name: 'forwarddoc',
    description: 'Forward document to new signers',
    params: ['docId', 'newSigners'],
    returns: 'Updated document with new signers',
    requiresAuth: true,
    filePath: 'parsefunction/forwardDoc.js',
    implementationNotes: [
      'Adds new signers to existing document',
      'Preserves existing signatures and status'
    ]
  },
  {
    name: 'recreatedoc',
    description: 'Recreate document with new settings',
    params: ['docId', 'newSettings'],
    returns: 'Recreated document object',
    requiresAuth: true,
    filePath: 'parsefunction/recreateDocument.js',
    implementationNotes: [
      'Rebuilds document with modified configuration',
      'Maintains document history and references'
    ]
  },
  {
    name: 'filterdocs',
    description: 'Filter documents by criteria',
    params: ['filters', 'sort', 'limit', 'skip'],
    returns: 'Filtered document list',
    requiresAuth: true,
    filePath: 'parsefunction/filterDocs.js',
    implementationNotes: [
      'Advanced document filtering and search',
      'Supports multiple filter criteria and sorting'
    ]
  },

  // === Contact Management ===
  {
    name: 'getSigners',
    description: 'Search contacts/signers with text matching',
    params: ['search'],
    returns: 'Array of matching contacts',
    requiresAuth: true,
    filePath: 'parsefunction/getSigners.js',
    implementationNotes: [
      'Searches by name and email with regex',
      'Combines multiple query conditions with OR',
      'Excludes deleted contacts',
      'Used for signer selection in documents'
    ]
  },
  {
    name: 'savecontact',
    description: 'Save new contact to address book',
    params: ['name', 'email', 'phone?', 'company?', 'jobTitle?', 'tenantId?'],
    returns: 'Created contact object',
    requiresAuth: true,
    filePath: 'parsefunction/savecontact.js',
    implementationNotes: [
      'Creates contracts_Contactbook entry',
      'Links to existing user if email matches',
      'Sets up proper ACL for contact sharing',
      'Handles duplicate contact prevention'
    ]
  },
  {
    name: 'editcontact',
    description: 'Update existing contact information',
    params: ['contactId', 'name', 'email', 'phone?', 'company?', 'jobTitle?'],
    returns: 'Updated contact object',
    requiresAuth: true,
    filePath: 'parsefunction/editContact.js',
    implementationNotes: [
      'Updates contracts_Contactbook record',
      'Handles user linking if email changed',
      'Maintains ACL permissions'
    ]
  },
  {
    name: 'createbatchcontact',
    description: 'Bulk create multiple contacts',
    params: ['contacts[]'],
    returns: 'Array of created contacts',
    requiresAuth: true,
    filePath: 'parsefunction/createBatchContact.js',
    implementationNotes: [
      'Processes CSV/bulk contact imports',
      'Handles duplicate detection and validation'
    ]
  },

  // === Template Management ===
  {
    name: 'gettemplate',
    description: 'Retrieve template details',
    params: ['templateId'],
    returns: 'Template object with placeholders',
    requiresAuth: true,
    filePath: 'parsefunction/getTemplate.js',
    implementationNotes: [
      'Returns contracts_Template with all related data',
      'Includes placeholder configuration'
    ]
  },
  {
    name: 'savetemplate',
    description: 'Save new template or update existing',
    params: ['templateData', 'placeholders', 'signers'],
    returns: 'Saved template object',
    requiresAuth: true,
    filePath: 'parsefunction/saveTemplate.js',
    implementationNotes: [
      'Creates contracts_Template with full configuration',
      'Handles placeholder and signer setup'
    ]
  },
  {
    name: 'saveastemplate',
    description: 'Convert document to reusable template',
    params: ['docId', 'templateName'],
    returns: 'Created template object',
    requiresAuth: true,
    filePath: 'parsefunction/saveAsTemplate.js',
    implementationNotes: [
      'Extracts document configuration as template',
      'Preserves placeholder layout and settings'
    ]
  },
  {
    name: 'gettemplates',
    description: 'List user templates with pagination',
    params: ['limit?', 'skip?', 'search?'],
    returns: 'Array of user templates',
    requiresAuth: true,
    filePath: 'parsefunction/getTemplates.js',
    implementationNotes: [
      'Returns contracts_Template objects for user',
      'Supports search and pagination'
    ]
  },

  // === Organization & Team Management ===
  {
    name: 'getuserlistbyorg',
    description: 'Get all users in organization',
    params: ['tenantId?'],
    returns: 'Array of organization users',
    requiresAuth: true,
    filePath: 'parsefunction/getUserListByOrg.js',
    implementationNotes: [
      'Returns contracts_Users for tenant',
      'Used for team management and permissions'
    ]
  },
  {
    name: 'updatetenant',
    description: 'Update tenant/organization settings',
    params: ['tenantData'],
    returns: 'Updated tenant object',
    requiresAuth: true,
    filePath: 'parsefunction/updateTenant.js',
    implementationNotes: [
      'Updates partners_Tenant configuration',
      'Handles organization-wide settings'
    ]
  },

  // === Email & Notifications ===
  {
    name: 'sendmailv3',
    description: 'Send email notifications for documents',
    params: ['recipientEmail', 'subject', 'body', 'documentId'],
    returns: 'Email sending status',
    requiresAuth: true,
    filePath: 'parsefunction/sendmailv3.js',
    implementationNotes: [
      'Handles document signing notifications',
      'Supports custom email templates',
      'Integrates with configured email adapter'
    ]
  },
  {
    name: 'senddeleterequest',
    description: 'Send account deletion request email',
    params: ['userEmail'],
    returns: 'Email sending status',
    requiresAuth: true,
    filePath: 'parsefunction/sendDeleteUserMail.js',
    implementationNotes: [
      'Handles GDPR/account deletion workflows',
      'Sends confirmation emails'
    ]
  },

  // === User Preferences ===
  {
    name: 'updatesignaturetype',
    description: 'Update user signature preferences',
    params: ['SignatureType[]'],
    returns: 'Updated user preferences',
    requiresAuth: true,
    filePath: 'parsefunction/updatesignaturetype.js',
    implementationNotes: [
      'Updates contracts_Users signature settings',
      'Handles multiple signature type preferences'
    ]
  },
  {
    name: 'updatepreferences',
    description: 'Update user notification and timezone preferences',
    params: ['NotifyOnSignatures?', 'Timezone?', 'SignatureType[]?'],
    returns: 'Updated user preferences',
    requiresAuth: true,
    filePath: 'parsefunction/updatePreferences.js',
    implementationNotes: [
      'Updates contracts_Users preference settings',
      'Handles notification and timezone configuration'
    ]
  },
  {
    name: 'updatetourstatus',
    description: 'Update user onboarding tour status',
    params: ['tourCompleted'],
    returns: 'Updated tour status',
    requiresAuth: true,
    filePath: 'parsefunction/updateTourStatus.js',
    implementationNotes: [
      'Tracks user onboarding progress',
      'Updates tour completion flags'
    ]
  },

  // === File & Certificate Management ===
  {
    name: 'fileupload',
    description: 'Handle secure file upload and URL generation',
    params: ['url'],
    returns: 'Secure file URL',
    requiresAuth: true,
    filePath: 'parsefunction/fileUpload.js',
    implementationNotes: [
      'Generates signed URLs for file access',
      'Handles secure file storage integration'
    ]
  },
  {
    name: 'generatecertificate',
    description: 'Generate completion certificate for signed document',
    params: ['docId'],
    returns: 'Certificate URL and data',
    requiresAuth: true,
    filePath: 'parsefunction/generateCertificatebydocId.js',
    implementationNotes: [
      'Creates PDF certificate for completed documents',
      'Includes signature validation and timestamps'
    ]
  },

  // === Utility Functions ===
  {
    name: 'Newsletter',
    description: 'Subscribe user to newsletter',
    params: ['name', 'email', 'domain'],
    returns: 'Subscription status',
    requiresAuth: false,
    filePath: 'parsefunction/Newsletter.js',
    implementationNotes: [
      'Handles newsletter subscription via external API',
      'Connects to OpenSign Labs newsletter service'
    ]
  }
]

/**
 * Cloud functions requiring special implementation or integration
 */
export const CRITICAL_CLOUD_FUNCTIONS = [
  'signPdf',           // Core signing functionality
  'getDocument',       // Document retrieval with security
  'getSigners',        // Contact/signer search
  'usersignup',        // User registration
  'loginuser',         // Authentication
  'savecontact',       // Contact management
  'sendmailv3',        // Email notifications
  'getUserDetails',    // User profile data
  'getReport'          // Analytics and reporting
]

/**
 * Parse Server Classes used in cloud functions
 */
export const OPENSIGN_PARSE_CLASSES = [
  'contracts_Document',      // Main document storage
  'contracts_Template',      // Document templates
  'contracts_Users',         // Extended user information
  'contracts_Contactbook',   // Contact address book
  'contracts_Signature',     // Signature data
  'contracts_Teams',         // Team management
  'partners_Tenant',         // Organization/tenant data
  '_User'                    // Parse built-in user class
]

/**
 * Common Parse Query patterns used in OpenSign
 */
export const PARSE_QUERY_PATTERNS = {
  // User-scoped queries
  userScoped: 'query.equalTo("CreatedBy", { __type: "Pointer", className: "_User", objectId: userId })',
  
  // Tenant-scoped queries  
  tenantScoped: 'query.equalTo("TenantId", { __type: "Pointer", className: "partners_Tenant", objectId: tenantId })',
  
  // Include relationships
  includeRelations: 'query.include(["ExtUserPtr", "CreatedBy", "Signers", "Placeholders"])',
  
  // Exclude archived
  excludeArchived: 'query.notEqualTo("IsArchive", true)',
  
  // Text search
  textSearch: 'query.matches("fieldName", new RegExp(searchTerm, "i"))',
  
  // OR queries
  orQuery: 'Parse.Query.or(query1, query2)',
  
  // ACL setup
  aclSetup: 'acl.setReadAccess(userId, true); acl.setWriteAccess(userId, true)'
}
