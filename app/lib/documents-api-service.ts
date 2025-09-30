import { openSignApiService } from "./api-service"

// Document status types matching OpenSign enhanced backend
export type DocumentStatus = 'waiting' | 'signed' | 'partially_signed' | 'drafted' | 'declined' | 'expired'

// Request parameters interface
export interface GetDocumentsParams {
  limit?: number
  skip?: number
  searchTerm?: string
  status?: DocumentStatus | 'all' | 'inbox'
  assignedToMe?: boolean
  page?: number
}

// Document interfaces based on OpenSign contracts_Document class
export interface OpenSignDocument {
  objectId: string
  Name: string
  URL?: string
  SignedUrl?: string
  CertificateUrl?: string
  Note?: string
  Description?: string
  createdAt: string
  updatedAt: string
  ExpiryDate?: {
    iso: string
    __type: "Date"
  }
  TimeToCompleteDays?: number
  IsCompleted?: boolean
  IsDeclined?: boolean
  IsSignyourself?: boolean
  IsEnableOTP?: boolean
  IsTour?: boolean
  SendinOrder?: boolean
  Status?: string // Backend should set: "waiting", "signed", "declined", "expired"
  DeclineReason?: string
  Signers?: OpenSignSigner[]
  Placeholders?: OpenSignPlaceholder[]
  CreatedBy?: {
    objectId: string
    className: string
  }
  ExtUserPtr?: {
    objectId: string
    Name?: string
    Email?: string
    TenantId?: {
      objectId: string
      className: string
    }
  }
  TemplateId?: {
    objectId: string
    className: string
  }
}

export interface OpenSignSigner {
  objectId: string
  Name: string
  Email: string
  UserId?: {
    objectId: string
    className: string
  }
  ExtUserPtr?: {
    objectId: string
    className: string
  }
  status?: 'waiting' | 'signed' | 'declined'
  signedAt?: string
}

export interface OpenSignPlaceholder {
  id: string
  type: string
  label?: string
  required?: boolean
  width?: number
  height?: number
  x?: number
  y?: number
  page?: number
  signerRole?: string
  email: string
  signerPtr: Record<string, unknown>
  signerObjId?: string
  status?: 'waiting' | 'signed' | 'declined' // ✅ Backend now provides status
  signedAt?: string // ✅ Backend provides signing timestamp in ISO format
  signedUrl?: string // ✅ Backend provides signed PDF URL
  ipAddress?: string // ✅ Backend provides signer IP address for audit
  order?: number // For sequential signing (SendinOrder)
}

// Our internal document interface for the frontend
export interface Document {
  objectId: string
  name: string
  fileName: string
  url?: string
  signedUrl?: string
  note?: string
  description?: string
  status: DocumentStatus
  createdAt: string
  updatedAt: string
  expiryDate?: string
  timeToCompleteDays?: number
  isOtpEnabled?: boolean
  isTourEnabled?: boolean
  sendInOrder?: boolean
  declineReason?: string
  signers: DocumentSigner[]
  placeholders: DocumentPlaceholder[]
  createdBy: {
    id: string
    name: string
    email: string
  }
  assignedTo?: {
    id: string
    name: string
    email: string
  }
  templateId?: string
  // UI-specific properties
  senderName: string
  senderEmail: string
  receiverNames: string[]
  hasUserSigned: boolean
  canUserSign: boolean
  isCurrentUserCreator: boolean
  userRole?: string
}

export interface DocumentSigner {
  id: string
  name: string
  email: string
  role?: string
  color?: string
  status: 'waiting' | 'signed' | 'declined'
  signedAt?: string
  userId?: string
  contactId?: string
  order?: number
}

export interface DocumentPlaceholder {
  id: string
  signerObjId: string
  role: string
  email: string
  color: string
  status?: 'waiting' | 'signed' | 'declined' // ✅ Enhanced: Status tracking from backend
  signedAt?: string // ✅ Enhanced: Signing timestamp from backend
  signedUrl?: string // ✅ Enhanced: Signed PDF URL from backend  
  ipAddress?: string // ✅ Enhanced: IP address for audit trail
  fields: Array<{
    page: number
    x: number
    y: number
    width: number
    height: number
    type: string
    name?: string
    required?: boolean
    defaultValue?: string
  }>
}

// API request/response interfaces
export interface GetDocumentsParams {
  limit?: number
  skip?: number
  searchTerm?: string
  status?: DocumentStatus | 'all' | 'inbox'
  assignedToMe?: boolean
  page?: number
}

export interface DocumentListResponse {
  results: Document[]
  count: number
}

export interface CreateDocumentRequest {
  name: string
  description?: string
  note?: string
  templateId?: string
  signers: Array<{
    name: string
    email: string
    phone?: string
    role?: string
    order?: number
  }>
  sendInOrder?: boolean
  otpEnabled?: boolean
  tourEnabled?: boolean
  timeToCompleteDays?: number
  expiryDate?: string
}

export interface SignDocumentRequest {
  documentId: string
  userId: string // Required: User ID of the signer (dynamically retrieved from auth system)
  signature: string // Required: Base64 signature data (e.g., "data:image/png;base64,...")
  signatureData?: {
    positions: Array<{
      x: number
      y: number
      width: number
      height: number
      page: number
    }>
    signerInfo: {
      name: string
      email: string
    }
  }
}

// Enhanced response interface matching backend implementation
export interface EnhancedSignResponse {
  status: 'success' | 'error' | 'partial_success'
  code?: number
  message?: string
  data?: {
    documentId?: string
    newStatus?: 'waiting' | 'signed' | 'partially_signed'
    signedPlaceholder?: {
      id: string
      email: string
      signedAt: string
      type: string
    }
    remainingSigners?: string[]
    signedUrl?: string
  }
  document?: OpenSignDocument
}

// Document API Service Class
class DocumentsApiService {
  
  /**
   * Enhanced document retrieval using the improved backend with status filtering
   * Now supports proper document visibility for assignees and improved permissions
   * WORKAROUND: Also queries documents where user is mentioned as signer
   */
  async getDocumentsEnhanced(params: GetDocumentsParams = {}): Promise<DocumentListResponse> {
    try {
      const { status, limit = 10, skip = 0, searchTerm = '' } = params;

      console.log('📄 Fetching documents with enhanced backend API + workaround:', { status, limit, skip, searchTerm });

      // First try the enhanced getReport API
      let reportDocuments: Document[] = [];
      try {
        // Get user's extended information for proper report ID
        let userExtendedId: string | null = null;
        if (typeof window !== 'undefined') {
          try {
            const authData = localStorage.getItem('auth-storage');
            if (authData) {
              const parsed = JSON.parse(authData);
              userExtendedId = parsed.state?.user?.extendedId || 'ByHuevtCFY'; // Fallback to default
            }
          } catch {
            console.warn('Could not get user extended ID, using default');
            userExtendedId = 'ByHuevtCFY';
          }
        }

        const reportParams: Record<string, unknown> = {
          reportId: userExtendedId || 'ByHuevtCFY',
          limit,
          skip
        };

        // Add status filtering - backend now supports this
        if (status && status !== 'all' && status !== 'inbox') {
          const statusMapping: Record<DocumentStatus, string> = {
            'drafted': 'draft',
            'waiting': 'waiting', 
            'signed': 'signed',
            'partially_signed': 'partially_signed', // ✅ Enhanced: Support new backend status
            'declined': 'declined',
            'expired': 'expired'
          };
          reportParams.status = statusMapping[status] || status;
        }

        console.log('📊 Enhanced getReport parameters:', reportParams);

        const response = await openSignApiService.post<{
          result?: Record<string, unknown>[]
          error?: string
        }>("functions/getReport", reportParams);

        if (!response.error && response.result) {
          reportDocuments = (response.result || []).map(result => {
            try {
              return transformOpenSignDocumentFromReport(result);
            } catch (transformError) {
              console.warn('⚠️ Failed to transform document:', result, transformError);
              return null;
            }
          }).filter((doc): doc is Document => doc !== null);
        }
      } catch (reportError) {
        console.warn('📊 getReport failed, will use direct query workaround:', reportError);
      }

      // WORKAROUND: Since backend ExtUserPtr isn't set, also query documents directly
      // where user is mentioned as signer or in placeholders
      let directDocuments: Document[] = [];
      try {
        // Get current user email for signer matching
        let userEmail: string | null = null;
        if (typeof window !== 'undefined') {
          try {
            const authData = localStorage.getItem('auth-storage');
            if (authData) {
              const parsed = JSON.parse(authData);
              userEmail = parsed.state?.user?.email;
            }
          } catch {
            console.warn('Could not get user email from auth store');
          }
        }

        if (userEmail) {
          console.log('� Querying documents where user is signer:', userEmail);

          // Query documents where user email appears in Signers or Placeholders
          const queryParams = new URLSearchParams({
            limit: limit.toString(),
            skip: skip.toString(),
            include: 'CreatedBy,ExtUserPtr,Signers,Placeholders',
            order: '-createdAt'
          });

          // Add status filter if specified
          if (status && status !== 'all' && status !== 'inbox') {
            const statusMapping: Record<DocumentStatus, string> = {
              'drafted': 'draft',
              'waiting': 'waiting',
              'signed': 'signed', 
              'partially_signed': 'partially_signed', // ✅ Enhanced: Support new backend status
              'declined': 'declined',
              'expired': 'expired'
            };
            const mappedStatus = statusMapping[status] || status;
            queryParams.append('where', JSON.stringify({
              Status: mappedStatus
            }));
          }

          const directResponse = await openSignApiService.get<{
            results: OpenSignDocument[]
            count: number
          }>(`classes/contracts_Document?${queryParams.toString()}`);

          if (directResponse.results) {
            // Filter documents where user is mentioned as signer or in placeholders
            const filteredDocuments = directResponse.results.filter(doc => {
              // Check if user is in Signers array
              const isInSigners = doc.Signers?.some((signer: { Email?: string; email?: string }) => 
                signer.Email === userEmail || signer.email === userEmail
              );

              // Check if user is in Placeholders array  
              const isInPlaceholders = doc.Placeholders?.some((placeholder: { Email?: string; email?: string }) =>
                placeholder.Email === userEmail || placeholder.email === userEmail
              );

              // Check if user created the document
              const isCreator = doc.CreatedBy?.objectId && typeof window !== 'undefined' && (() => {
                try {
                  const authData = localStorage.getItem('auth-storage');
                  if (authData) {
                    const parsed = JSON.parse(authData);
                    return doc.CreatedBy?.objectId === parsed.state?.user?.id;
                  }
                } catch {
                  // ignore
                }
                return false;
              })();

              return isInSigners || isInPlaceholders || isCreator;
            });

            directDocuments = filteredDocuments.map(doc => transformOpenSignDocument(doc));
          }
        }
      } catch (directError) {
        console.warn('🔍 Direct document query failed:', directError);
      }

      // Merge and deduplicate documents from both sources
      const allDocuments: Document[] = [];
      const seenIds = new Set<string>();

      // Add report documents first (these are "officially" accessible)
      reportDocuments.forEach(doc => {
        if (!seenIds.has(doc.objectId)) {
          seenIds.add(doc.objectId);
          allDocuments.push(doc);
        }
      });

      // Add direct documents (workaround for missing ExtUserPtr)
      directDocuments.forEach(doc => {
        if (!seenIds.has(doc.objectId)) {
          seenIds.add(doc.objectId);
          allDocuments.push(doc);
        }
      });

      // Apply search filter if specified
      let finalDocuments = allDocuments;
      if (searchTerm) {
        finalDocuments = allDocuments.filter(doc =>
          doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.signers.some(signer => 
            signer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            signer.email.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      }

      console.log(`✅ Found ${finalDocuments.length} documents (${reportDocuments.length} from getReport + ${directDocuments.length} from direct query)`);

      return {
        results: finalDocuments,
        count: finalDocuments.length
      };
    } catch (error) {
      console.error('[Documents API] Enhanced document fetching error:', error);
      // Fallback to original method if enhanced version fails
      console.log('🔄 Falling back to original getDocuments method...');
      return this.getDocuments(params);
    }
  }

  /**
   * Get documents using OpenSign getDrive function (enhanced with OpenSign patterns)
   * Uses the getDrive cloud function for document listing with folder support
   */
  async getDocuments(params: GetDocumentsParams = {}): Promise<DocumentListResponse> {
    try {
      const { status, limit = 50, skip = 0, searchTerm = '', assignedToMe = false } = params;

      console.log('📄 Fetching documents using getDrive function:', { status, limit, skip, searchTerm, assignedToMe });

      // Use getDrive function (OpenSign's primary document listing method)
      const driveResponse = await openSignApiService.callFunction<Document[]>(
        'getDrive',
        {
          docId: null, // null for root level documents
          skip,
          limit,
          searchTerm
        }
      );

      console.log('📥 getDrive response received:', driveResponse);

      if (!driveResponse || !Array.isArray(driveResponse)) {
        console.warn('⚠️ Invalid getDrive response format, falling back to getReport...');
        
        // Fallback to getReport method for compatibility
        return this.getDocumentsWithReport(params);
      }

      // Transform OpenSign document format to our internal format
      let documents = driveResponse.map(doc => {
        try {
          return transformOpenSignDocument(doc as unknown as OpenSignDocument);
        } catch (error) {
          console.warn('⚠️ Error transforming document:', doc, error);
          return null;
        }
      }).filter(Boolean) as Document[];

      console.log(`📊 Transformed ${documents.length} documents from getDrive`);

      // Apply status filtering if needed
      if (status && status !== 'all') {
        if (status === 'inbox') {
          // For inbox, show documents where user can sign or is assigned
          documents = documents.filter(doc => doc.canUserSign || doc.userRole === 'assignee');
        } else {
          // Filter by specific status
          documents = documents.filter(doc => doc.status === status);
        }
      }

      // Apply assignedToMe filter
      if (assignedToMe) {
        documents = documents.filter(doc => doc.canUserSign || doc.userRole === 'assignee');
      }

      // Apply search filter
      if (searchTerm?.trim()) {
        const search = searchTerm.toLowerCase().trim();
        documents = documents.filter(doc => 
          doc.name?.toLowerCase().includes(search) ||
          doc.description?.toLowerCase().includes(search) ||
          doc.senderEmail?.toLowerCase().includes(search) ||
          doc.receiverNames?.some(name => name.toLowerCase().includes(search))
        );
      }

      console.log(`✅ Filtered to ${documents.length} documents (status: ${status}, search: "${searchTerm}")`);

      return {
        results: documents,
        count: documents.length
      };

    } catch (error) {
      console.error('❌ Error in getDrive documents:', error);
      
      // Fallback to getReport method
      console.log('🔄 Falling back to getReport method...');
      return this.getDocumentsWithReport(params);
    }
  }

  /**
   * Fallback method using getReport function (original implementation)
   * Uses the correct report ID based on status filter
   */
  private async getDocumentsWithReport(params: GetDocumentsParams = {}): Promise<DocumentListResponse> {
    try {
      const { status, limit = 10, skip = 0, searchTerm = '' } = params;

      console.log('📄 Fetching documents using getReport function:', { status, limit, skip, searchTerm });

      let allDocuments: Document[] = [];

      if (status === 'all') {
        // For "All" filter, fetch from ALL status reports and combine them
        console.log('📊 Fetching documents from ALL status reports...');
        
        const allReportIds = [
          { id: '1MwEuxLEkF', status: 'waiting' },
          { id: 'ByHuevtCFY', status: 'drafted' },
          { id: 'kQUoW4hUXz', status: 'signed' },
          { id: 'UPr2Fm5WY3', status: 'declined' },
          { id: 'zNqBHXHsYH', status: 'expired' },
          { id: '4Hhwbp482K', status: 'partially_signed' }
        ];

        // Fetch documents from all reports in parallel
        const reportPromises = allReportIds.map(async (report) => {
          try {
            console.log(`📊 Fetching from ${report.status} report (${report.id})...`);
            
            const response = await openSignApiService.callFunction<{
              result?: Record<string, unknown>[]
              error?: string
            }>('getReport', {
              reportId: report.id,
              skip: 0, // Get all from each report, we'll handle pagination later
              limit: 100 // Use a larger limit to get more documents from each report
            });

            if (response.error) {
              console.warn(`⚠️ Error fetching ${report.status} documents:`, response.error);
              return [];
            }

            // Transform documents
            const documents = (response.result || []).map(result => {
              try {
                return transformOpenSignDocumentFromReport(result);
              } catch (transformError) {
                console.warn('⚠️ Failed to transform document:', result, transformError);
                return null;
              }
            }).filter((doc): doc is Document => doc !== null);

            console.log(`✅ Found ${documents.length} documents in ${report.status} report`);
            return documents;
          } catch (error) {
            console.warn(`⚠️ Failed to fetch ${report.status} documents:`, error);
            return [];
          }
        });

        // Wait for all requests to complete
        const reportResults = await Promise.all(reportPromises);
        
        // Combine all documents from all reports
        allDocuments = reportResults.flat();
        
        // Remove duplicates based on objectId (in case a document appears in multiple reports)
        const uniqueDocuments = new Map<string, Document>();
        allDocuments.forEach(doc => {
          uniqueDocuments.set(doc.objectId, doc);
        });
        allDocuments = Array.from(uniqueDocuments.values());

        // Sort by creation date (newest first)
        allDocuments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        console.log(`📊 Combined ${allDocuments.length} unique documents from all reports`);

      } else {
        // Handle specific status filters (existing logic)
        let reportId: string;
        
        if (status === 'inbox') {
          // For "Inbox" filter, we want documents waiting for current user's signature
          // We'll fetch from waiting documents and filter by user permission
          reportId = 'ByHuevtCFY'; // waiting documents
        } else if (status) {
          // For specific status filters, use the corresponding report ID
          const statusToReportId: Record<DocumentStatus, string> = {
            'waiting': '1MwEuxLEkF',
            'drafted': 'ByHuevtCFY', 
            'signed': 'kQUoW4hUXz',
            'declined': 'UPr2Fm5WY3',
            'expired': 'zNqBHXHsYH',
            'partially_signed': '4Hhwbp482K'
          };
          reportId = statusToReportId[status];
        } else {
          // Default case (no status specified)
          reportId = 'ByHuevtCFY'; // drafted documents
        }

        // Fetch from single report
        const reportParams = {
          reportId: reportId,
          skip,
          limit
        };

        console.log('📊 getReport parameters:', reportParams);

        const response = await openSignApiService.callFunction<{
          result?: Record<string, unknown>[]
          error?: string
        }>('getReport', reportParams);

        if (response.error) {
          console.error('❌ getReport function error:', response.error);
          throw new Error(`OpenSign getReport Error: ${response.error}`);
        }

        console.log('📄 getReport response received, processing documents...');

        // Transform OpenSign document format to our internal format
        allDocuments = (response.result || []).map(result => {
          try {
            return transformOpenSignDocumentFromReport(result);
          } catch (transformError) {
            console.warn('⚠️ Failed to transform document:', result, transformError);
            return null;
          }
        }).filter((doc): doc is Document => doc !== null);
      }

      // Apply inbox filter if specified (filter by documents assigned to current user)
      if (status === 'inbox') {
        allDocuments = allDocuments.filter(doc => doc.canUserSign);
        console.log(`📥 Filtered to ${allDocuments.length} inbox documents (can user sign)`);
      }

      // Apply search filter if specified (client-side filtering)
      let filteredDocuments = allDocuments;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredDocuments = allDocuments.filter(doc => 
          doc.name.toLowerCase().includes(searchLower) ||
          doc.description?.toLowerCase().includes(searchLower)
        );
      }

      // Apply pagination for "all" filter (since we fetched everything)
      if (status === 'all') {
        const startIndex = skip;
        const endIndex = skip + limit;
        filteredDocuments = filteredDocuments.slice(startIndex, endIndex);
      }

      console.log(`✅ Successfully processed ${filteredDocuments.length} documents from ${status || 'default'} report(s)`);

      return {
        results: filteredDocuments,
        count: status === 'all' ? allDocuments.length : filteredDocuments.length // Total count before pagination
      };
    } catch (error) {
      console.error('[Documents API] Error fetching documents with getReport:', error);
      throw error;
    }
  }
  
  /**
   * Get single document by ID using OpenSign's getDocument cloud function
   */
  async getDocument(documentId: string): Promise<any> {
    try {
      console.log('📄 Fetching single document using getDocument function:', documentId);
      
      // Use getDocument cloud function (OpenSign's method for single document retrieval)
      const response = await openSignApiService.callFunction(
        'getDocument',
        {
          docId: documentId,
        }
      );
      
      console.log('📥 getDocument response received:', response);
      
      if (!response) {
        throw new Error('Document not found');
      }


      return (response as any).result
    } catch (error) {
      console.error('Error fetching document:', error)
      throw error
    }
  }
  
  /**
   * Create a new document (usually from template)
   */
  async createDocument(data: CreateDocumentRequest): Promise<Document> {
    try {
      console.log('📄 Creating document with automatic contact book management...');

      // Get current user information for CreatedBy field
      let currentUserId: string | null = null;
      if (typeof window !== 'undefined') {
        try {
          const authData = localStorage.getItem('auth-storage');
          if (authData) {
            const parsed = JSON.parse(authData);
            currentUserId = parsed.state?.user?.id;
          }
        } catch {
          console.warn('Could not get user ID from auth store');
        }
      }

      if (!currentUserId) {
        throw new Error('User authentication required to create documents');
      }

      // Use the enhanced batchdocuments API that automatically manages contact book
      const batchData = {
        Documents: [{
          Name: data.name,
          Description: data.description || '',
          Note: data.note || '',
          TimeToCompleteDays: data.timeToCompleteDays || 30,
          IsEnableOTP: data.otpEnabled || false,
          IsTour: data.tourEnabled || false,
          SendinOrder: data.sendInOrder || false,
          ExpiryDate: data.expiryDate ? {
            __type: "Date",
            iso: data.expiryDate
          } : undefined,
          Signers: data.signers.map((signer, index) => ({
            Name: signer.name,
            Email: signer.email,
            Phone: signer.phone || '', // Add phone if available
            Role: signer.role || `Signer ${index + 1}`,
            order: signer.order || index + 1
          })),
          CreatedBy: {
            __type: "Pointer",
            className: "_User",
            objectId: currentUserId
          },
          TemplateId: data.templateId ? {
            __type: "Pointer",
            className: "contracts_Template",
            objectId: data.templateId
          } : undefined
        }]
      };

      console.log('📤 Sending batch document creation request...');

      const response = await openSignApiService.post<{
        result?: string
        error?: string
      }>("functions/batchdocuments", batchData);

      if (response.error) {
        console.error('❌ Batch documents API error:', response.error);
        throw new Error(`Failed to create document: ${response.error}`);
      }

      if (response.result !== 'success') {
        console.error('❌ Unexpected batch documents response:', response);
        throw new Error('Document creation failed - unexpected response');
      }

      console.log('✅ Document created successfully with automatic contact book management');

      // Since batchdocuments doesn't return the created document details,
      // we'll need to fetch the latest documents to get the created document
      // For now, return a placeholder document - this should be improved
      const placeholderDocument: Document = {
        objectId: 'temp-' + Date.now(), // Temporary ID
        name: data.name,
        fileName: data.name,
        status: 'drafted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        signers: data.signers.map((signer, index) => ({
          id: `temp-signer-${index}`,
          name: signer.name,
          email: signer.email,
          role: signer.role || `Signer ${index + 1}`,
          status: 'waiting',
          order: signer.order || index + 1
        })),
        placeholders: [],
        createdBy: {
          id: currentUserId,
          name: 'Current User', // This should be fetched from user details
          email: '' // This should be fetched from user details
        },
        senderName: 'Current User',
        senderEmail: '',
        receiverNames: data.signers.map(s => s.name),
        hasUserSigned: false,
        canUserSign: false,
        isCurrentUserCreator: true, // User is creating this document
        userRole: 'Creator'
      };

      return placeholderDocument;
    } catch (error) {
      console.error('❌ Error creating document with batch API:', error);
      throw error;
    }
  }
  
  /**
   * Sign a document (server-side PDF approach - let server fetch PDF internally)
   */
  async signDocument(data: SignDocumentRequest): Promise<Document> {
    try {
      console.log('🖊️ === DOCUMENT SIGNING DEBUG START ===');
      console.log('📄 Document ID:', data.documentId);
      console.log('🔍 Signature data provided:', !!data.signature);
      console.log('📧 SignatureData email:', data.signatureData?.signerInfo?.email);
      
      // Get the current user's email dynamically from authentication system
      let userEmail = data.signatureData?.signerInfo?.email;
      
      // If no email provided in signature data, get it from auth storage
      if (!userEmail) {
        console.log('📦 No email in signature data, checking auth storage...');
        if (typeof window !== 'undefined') {
          try {
            const authData = localStorage.getItem('auth-storage');
            if (authData) {
              const parsed = JSON.parse(authData);
              userEmail = parsed.state?.user?.email;
              console.log('✅ Found email in auth storage:', userEmail);
              console.log('🔍 Full auth storage user data:', parsed.state?.user);
            } else {
              console.warn('❌ No auth-storage found in localStorage');
            }
          } catch (authError) {
            console.error('❌ Error parsing auth storage:', authError);
          }
        } else {
          console.warn('⚠️ Window is undefined (server-side)');
        }
      } else {
        console.log('✅ Using email from signature data:', userEmail);
      }
      
      // Additional email fallback checks
      if (!userEmail && typeof window !== 'undefined') {
        console.log('🔍 Trying additional email sources...');
        
        // Check opensign_session_token for user info
        const sessionToken = localStorage.getItem('opensign_session_token');
        console.log('🔑 Session token found:', !!sessionToken);
        
        // Check opensign_user storage
        const opensignUser = localStorage.getItem('opensign_user');
        if (opensignUser) {
          try {
            const user = JSON.parse(opensignUser);
            if (user.email && !userEmail) {
              userEmail = user.email;
              console.log('✅ Found email in opensign_user storage:', userEmail);
            }
          } catch (e) {
            console.error('❌ Error parsing opensign_user:', e);
          }
        }
        
        // Check currentUserId and try to get user info
        const currentUserId = localStorage.getItem('currentUserId');
        console.log('👤 Current user ID:', currentUserId);
      }
      
      // If still no email, try to get from session token or throw error
      if (!userEmail) {
        console.error('❌ NO EMAIL FOUND ANYWHERE!');
        console.log('🔍 All localStorage keys:', Object.keys(localStorage));
        throw new Error('User email is required for signing. Please ensure you are logged in.');
      }
      
      console.log('📧 FINAL EMAIL TO USE FOR SIGNING:', userEmail);
      console.log('� DOCUMENT ID TO SIGN:', data.documentId);
      
      // AUTHORIZATION PRE-CHECK: Verify user can sign this document
      console.log('🔒 Performing authorization pre-check...');
      try {
        const docResponse = await openSignApiService.get<{
          Signers?: Array<{ Email: string; Name: string }>;
          Placeholders?: Array<{ email: string; signerRole: string }>;
          Status?: string;
          Name?: string;
        }>(`classes/contracts_Document/${data.documentId}?include=Signers,Placeholders`);
        
        console.log('📄 Document authorization data:', {
          name: docResponse.Name,
          status: docResponse.Status,
          signers: docResponse.Signers?.map(s => s.Email),
          placeholders: docResponse.Placeholders?.map(p => p.email)
        });
        
        // Check if user email is in authorized signers
        const authorizedEmails = [
          ...(docResponse.Signers?.map(s => s.Email.toLowerCase()) || []),
          ...(docResponse.Placeholders?.map(p => p.email.toLowerCase()) || [])
        ];
        
        const isAuthorized = authorizedEmails.includes(userEmail.toLowerCase());
        console.log('🔒 Authorized emails:', authorizedEmails);
        console.log('📧 User email (lowercase):', userEmail.toLowerCase());
        console.log('✅ Is user authorized?', isAuthorized);
        
        if (!isAuthorized) {
          throw new Error(`User ${userEmail} is not authorized to sign this document. Authorized emails: ${authorizedEmails.join(', ')}`);
        }
        
        if (docResponse.Status === 'signed') {
          throw new Error('Document is already fully signed');
        }
        
      } catch (authError) {
        console.error('❌ Authorization pre-check failed:', authError);
        throw authError;
      }
      
      console.log('�🖊️ Signing document with server-side PDF approach:', {
        docId: data.documentId,
        email: userEmail,
        signature: data.signature?.substring(0, 50) + '...'
      });
      
      // Debug: Log the current user information
      if (typeof window !== 'undefined') {
        try {
          const authData = localStorage.getItem('auth-storage');
          console.log('🔍 Current auth storage:', authData ? JSON.parse(authData) : 'No auth data');
        } catch (e) {
          console.log('🔍 Auth storage parse error:', e);
        }
      }
      
      console.log('📤 Making signPdf API call...');
      
      // SOLUTION: Don't send PDF content - let server fetch it internally
      // The server will use docId to fetch the PDF content from its own storage
      const response = await openSignApiService.post<{
        result: EnhancedSignResponse
      }>(
        "functions/signPdf",
        {
          docId: data.documentId,
          signature: data.signature,
          email: userEmail
          // NO pdfFile parameter - server will fetch PDF internally using docId
        }
      );
      
      console.log('📥 Received signPdf response:', response);
      
      // Extract the actual response from Parse Server's result wrapper
      const signResult = response.result;
      
      if (signResult.status === 'success' && signResult.document) {
        console.log('✅ Document signed successfully:', {
          documentId: signResult.data?.documentId,
          newStatus: signResult.data?.newStatus,
          signedPlaceholder: signResult.data?.signedPlaceholder
        })
        console.log('🖊️ === DOCUMENT SIGNING DEBUG END - SUCCESS ===');
        return transformOpenSignDocument(signResult.document);
      } else if (signResult.status === 'partial_success' && signResult.document) {
        console.log('⚠️ Document partially signed (signature processed):', {
          message: signResult.message,
          code: signResult.code
        })
        console.log('🖊️ === DOCUMENT SIGNING DEBUG END - PARTIAL SUCCESS ===');
        return transformOpenSignDocument(signResult.document);
      } else {
        console.error('❌ Signing failed, response:', signResult);
        console.log('🖊️ === DOCUMENT SIGNING DEBUG END - FAILED ===');
        throw new Error(signResult.message || 'Failed to sign document');
      }
      
    } catch (error: unknown) {
      console.error('❌ Error signing document:', error);
      console.log('🖊️ === DOCUMENT SIGNING DEBUG END - ERROR ===');
      const errorObj = error as { code?: number; message?: string };
      
      if (errorObj.code === 119) {
        throw new Error(`Signing Order Error: ${errorObj.message || 'Document must be signed in order'}`);
      } else if (errorObj.message?.includes('terminated') || errorObj.message?.includes('SocketError')) {
        throw new Error('Network error: Server cannot handle large request. Document signing failed.');
      } else {
        throw new Error(errorObj.message || 'Failed to sign document. Please try again.');
      }
    }
  }

  /**
   * Fallback method: Sign document with PDF content (original approach)
   * Used when server-side PDF retrieval is not available
   */
  private async signDocumentWithPdfContent(data: SignDocumentRequest): Promise<Document> {
    try {
      console.log('📄 Using fallback approach with PDF content in request...');
      
      // Get the PDF file content for signing (original approach)
      const pdfResponse = await openSignApiService.post<{result: {content?: string, fileContent?: string}}>(
        "functions/getfilecontent", 
        { docId: data.documentId }
      );
      
      // Handle both content and fileContent response formats
      const pdfContent = pdfResponse.result?.content || pdfResponse.result?.fileContent;
      if (!pdfContent) {
        throw new Error('Failed to get PDF content for signing');
      }

      // Check PDF size and warn if it's large
      if (pdfContent.length > 100000) {
        console.warn(`⚠️ Large PDF content detected: ${pdfContent.length} bytes - this may cause request timeout issues`);
      }

      // Get the correct contracts_Users ID for the current user
      let userEmail = data.signatureData?.signerInfo?.email;
      
      // If no email provided in signature data, get it from auth storage
      if (!userEmail) {
        if (typeof window !== 'undefined') {
          try {
            const authData = localStorage.getItem('auth-storage');
            if (authData) {
              const parsed = JSON.parse(authData);
              userEmail = parsed.state?.user?.email;
            }
          } catch {
            console.warn('Could not get user email from auth store');
          }
        }
      }
      
      // If still no email, throw error instead of using hardcoded fallback
      if (!userEmail) {
        throw new Error('User email is required for signing. Please ensure you are logged in.');
      }
      const contractsUserResponse = await openSignApiService.get<{
        results: Array<{objectId: string}>
      }>(`classes/contracts_Users?where=${encodeURIComponent(JSON.stringify({"Email": userEmail}))}`);
      
      const contractsUserId = contractsUserResponse.results?.[0]?.objectId;
      if (!contractsUserId) {
        // Fallback: try the original approach without userId parameter
        console.warn(`No contracts_Users record found for email ${userEmail}, proceeding without userId`);
        
        try {
          const response = await openSignApiService.post<{
            result: EnhancedSignResponse
          }>(
            "functions/signPdf",
            {
              docId: data.documentId,
              signature: data.signature,
              pdfFile: pdfContent, // PDF content is required by the signPdf function
              email: userEmail
            }
          );
          
          // Extract the actual response from Parse Server's result wrapper
          const signResult = response.result;
          
          if (signResult.status === 'success' && signResult.document) {
            console.log('✅ Document signed successfully (fallback mode):', {
              documentId: signResult.data?.documentId,
              newStatus: signResult.data?.newStatus,
              signedPlaceholder: signResult.data?.signedPlaceholder
            })
            return transformOpenSignDocument(signResult.document);
          } else if (signResult.status === 'partial_success' && signResult.document) {
            console.log('⚠️ Document partially signed (fallback mode):', {
              message: signResult.message,
              code: signResult.code
            })
            return transformOpenSignDocument(signResult.document);
          } else {
            // Log the actual response for debugging
            console.error('❌ Unexpected signPdf response (fallback):', signResult)
            
            // Handle error response or unexpected format
            if (signResult.status === 'error' || signResult.message) {
              throw new Error(`Signing failed: ${signResult.message || 'Unknown error'}`);
            }
            
            // Try to handle as legacy response
            if (signResult.document) {
              console.log('🔄 Handling as legacy response...')
              return transformOpenSignDocument(signResult.document);
            }
            
            throw new Error(`Signing failed: Unexpected response format`);
          }
        } catch (fallbackError: unknown) {
          // Handle signing order errors and other backend errors
          const error = fallbackError as { code?: number; message?: string };
          if (error.code === 119) {
            throw new Error(`Signing Order Error: ${error.message || 'Document must be signed in order'}`);
          }
          throw fallbackError;
        }
      }

      // Backend API has been fixed and enhanced - now using improved signPdf parameters
      // ✅ API endpoints now return JSON (not HTML)
      // ✅ Enhanced signPdf function with better status tracking
      // ✅ Proper document status progression (waiting → partially_signed → signed)
      
      // Get position and page from signature data (use first position if multiple)
      const firstPosition = data.signatureData?.positions?.[0];
      const xyPosition = firstPosition ? 
        { x: firstPosition.x, y: firstPosition.y } : 
        { x: 100, y: 100 };
      const pageNo = firstPosition?.page || 1;
      
      const response = await openSignApiService.post<{
        result: EnhancedSignResponse
      }>(
        "functions/signPdf",
        {
          docId: data.documentId,
          userId: contractsUserId, // Dynamic contracts_Users ID
          signatureBase64: data.signature, // Updated parameter name for enhanced backend
          xyPosition: xyPosition,
          isDragSign: false,
          pageNo: pageNo,
          ipAddress: '127.0.0.1', // Can be enhanced later with actual IP detection
          pdfFile: pdfContent // PDF content is required by the signPdf function
        }
      )
      
      // Extract the actual response from Parse Server's result wrapper
      const signResult = response.result;
      
      // Backend now returns enhanced response structure with detailed status info
      if (signResult.status === 'success' && signResult.document) {
        console.log('✅ Document signed successfully with enhanced backend:', {
          documentId: signResult.data?.documentId,
          newStatus: signResult.data?.newStatus,
          isCompleted: signResult.document.IsCompleted,
          signedPlaceholder: signResult.data?.signedPlaceholder,
          remainingSigners: signResult.data?.remainingSigners,
          signedUrl: signResult.data?.signedUrl,
          responseMessage: signResult.message
        })
        
        // Update document status in UI based on new backend status
        if (signResult.data?.newStatus) {
          console.log(`📊 Document status updated to: ${signResult.data.newStatus}`);
        }
        
        return transformOpenSignDocument(signResult.document)
      } else if (signResult.status === 'partial_success' && signResult.document) {
        console.log('⚠️ Document partially signed (enhanced backend response):', {
          documentId: signResult.data?.documentId,
          message: signResult.message,
          code: signResult.code,
          newStatus: signResult.data?.newStatus,
          remainingSigners: signResult.data?.remainingSigners
        })
        
        // Even with partial success, the document signing worked with enhanced backend
        return transformOpenSignDocument(signResult.document)
      } else {
        // Log the actual response for debugging - should now be proper JSON
        console.error('❌ Unexpected signPdf response (enhanced backend):', signResult)
        
        // Handle error response with enhanced backend error format
        if (signResult.status === 'error' || signResult.message) {
          throw new Error(`Signing failed: ${signResult.message || 'Unknown error'}`);
        }
        
        // Try to handle legacy response format
        if (signResult.document || (signResult as unknown as OpenSignDocument).Status) {
          console.log('🔄 Handling legacy response format...')
          return transformOpenSignDocument(
            (signResult as unknown as { document: OpenSignDocument }).document || 
            signResult as unknown as OpenSignDocument
          )
        }
        
        throw new Error(`Signing failed: Unexpected response format`)
      }
    } catch (error: unknown) {
      console.error('Error signing document:', error)
      
      // Handle enhanced error responses from backend
      const parseError = error as { code?: number; message?: string };
      
      // Handle signing order validation errors (Parse error code 119)
      if (parseError.code === 119) {
        throw new Error(`Signing Order Error: ${parseError.message || 'Document must be signed in order'}`);
      }
      
      // Handle other specific error codes
      if (parseError.message?.includes('not authorized')) {
        throw new Error('You are not authorized to sign this document');
      }
      
      if (parseError.message?.includes('already signed')) {
        throw new Error('This document has already been signed by you');
      }
      
      throw error
    }
  }
  
  /**
   * Share document with recipients
   */
  async shareDocument(documentId: string, recipients: string[], message?: string): Promise<void> {
    try {
      await openSignApiService.post("functions/shareDocument", {
        documentId,
        recipients,
        message
      })
    } catch (error) {
      console.error('Error sharing document:', error)
      throw error
    }
  }
  
  /**
   * Download document (signed or unsigned)
   */
  /**
   * Clean and validate file URL from backend response
   * Fixes malformed URLs with double query parameters
   */
  private cleanFileUrl(url: string): string {
    try {
      // Fix double query parameter issue: ?param1=value1?param2=value2 -> ?param1=value1&param2=value2
      let cleanedUrl = url;
      
      // Count question marks
      const questionMarkCount = (url.match(/\?/g) || []).length;
      
      if (questionMarkCount > 1) {
        console.log('🔧 Fixing malformed URL with multiple query separators');
        
        // Find the first ? and replace subsequent ? with &
        const firstQuestionIndex = url.indexOf('?');
        if (firstQuestionIndex !== -1) {
          const beforeQuery = url.substring(0, firstQuestionIndex + 1);
          const afterQuery = url.substring(firstQuestionIndex + 1);
          
          // Replace remaining ? with &
          const fixedQuery = afterQuery.replace(/\?/g, '&');
          cleanedUrl = beforeQuery + fixedQuery;
          
          console.log('🔧 URL fixed:', cleanedUrl);
        }
      }
      
      // Validate the URL
      new URL(cleanedUrl);
      return cleanedUrl;
    } catch (error: unknown) {
      console.error('❌ Invalid URL format:', url, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Invalid file URL format: ${errorMessage}`);
    }
  }

  /**
   * Download document URL - gets the actual file URL for PDF viewing
   * Now uses the working backend endpoints with base64 content as primary method
   */
  async downloadDocument(documentId: string, signed = false): Promise<string> {
    try {
      console.log('📄 Attempting to get document file for:', documentId);
      
      // SKIP getfilecontent for now if it's not working properly
      // TODO: Re-enable once backend properly implements base64 content delivery
      
      // Try the direct getFileUrl endpoint as primary (but with conflict detection)
      try {
        console.log('📄 Trying getfileurl endpoint for JWT URL...');
        const directResponse = await this.getDocument(documentId);

        console.log('📄 getfileurl response:', directResponse);


          const fileUrl = directResponse.CertificateUrl;

          // Check for conflicting authentication (AWS + JWT token)
          if (fileUrl.includes('X-Amz-') && fileUrl.includes('&token=')) {
            console.warn('📄 Skipping getfileurl - conflicting authentication detected (AWS + JWT)');
            console.warn('📄 This URL would cause 403 errors:', fileUrl);
            // Don't return this URL, continue to other methods
          } else {
            const cleanedUrl = this.cleanFileUrl(fileUrl);
            console.log('📄 Direct file URL found and cleaned:', cleanedUrl);
            return cleanedUrl;
          }
      } catch (directError) {
        console.warn('📄 getfileurl endpoint failed:', directError);
      }

      console.warn('📄 All endpoints failed to provide usable file URLs for document:', documentId);
      throw new Error('PDF preview unavailable: Backend URLs have conflicting authentication (AWS + JWT). This causes 403 errors. Backend team needs to fix URL generation to use either AWS signatures OR JWT tokens, not both.');
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  }
  
  /**
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      await openSignApiService.delete(`classes/contracts_Document/${documentId}`)
    } catch (error) {
      console.error('Error deleting document:', error)
      throw error
    }
  }
  
  /**
   * Decline document with reason
   */
  async declineDocument(documentId: string, reason: string): Promise<Document> {
    try {
      const response = await openSignApiService.put<OpenSignDocument>(
        `classes/contracts_Document/${documentId}`,
        {
          IsDeclined: true,
          DeclineReason: reason
        }
      )
      
      return transformOpenSignDocument(response)
    } catch (error) {
      console.error('Error declining document:', error)
      throw error
    }
  }
}

// Check user permission to sign a specific document
export async function checkUserSignPermission(document: Document): Promise<boolean> {
  try {
    // Get current user email from auth
    let currentUserEmail = null
    if (typeof window !== 'undefined') {
      try {
        const authData = localStorage.getItem('auth-storage')
        if (authData) {
          const auth = JSON.parse(authData)
          currentUserEmail = auth.state?.user?.email
        }
      } catch {
        return false
      }
    }

    if (!currentUserEmail) {
      return false
    }

    // Get current user's contracts_Users data
    const userResponse = await openSignApiService.get<{results: Array<{objectId: string, Email: string}>}>(
      `classes/contracts_Users?where=${encodeURIComponent(JSON.stringify({ Email: currentUserEmail }))}`
    )

    if (!userResponse.results || userResponse.results.length === 0) {
      return false
    }

    const currentUserObjectId = userResponse.results[0].objectId

    // Get the document data to check signers
    const docResponse = await openSignApiService.get<OpenSignDocument>(
      `classes/contracts_Document/${document.objectId}`
    )

    if (!docResponse.Signers || !Array.isArray(docResponse.Signers)) {
      return false
    }

    // Check if user is authorized to sign by objectId or email
    const isAuthorizedSigner = docResponse.Signers.some((signer: OpenSignSigner) => 
      signer.objectId === currentUserObjectId || signer.Email === currentUserEmail
    )

    // Also check placeholders for additional authorization
    if (!isAuthorizedSigner && docResponse.Placeholders && Array.isArray(docResponse.Placeholders)) {
      const isAuthorizedInPlaceholders = docResponse.Placeholders.some((placeholder: OpenSignPlaceholder) => 
        placeholder.signerObjId === currentUserObjectId || 
        placeholder.email === currentUserEmail
      )
      return isAuthorizedInPlaceholders
    }

    return isAuthorizedSigner
  } catch (error) {
    console.error('Error checking user sign permission:', error)
    return false
  }
}

// Transform OpenSign document to our internal format
function transformOpenSignDocument(doc: OpenSignDocument): Document {
  // Determine document status based on OpenSign fields
  let status: DocumentStatus = 'waiting'
  
  // Prefer explicit Status field from backend if available
  if (doc.Status) {
    // Map backend status values to our types
    const statusMap: Record<string, DocumentStatus> = {
      'waiting': 'waiting',
      'signed': 'signed', 
      'partially_signed': 'partially_signed', // ✅ Enhanced: Support new backend status
      'declined': 'declined',
      'expired': 'expired',
      'drafted': 'drafted'
    }
    status = statusMap[doc.Status] || 'waiting'
  } else {
    // Fallback to legacy logic for backwards compatibility
    if (doc.IsDeclined) {
      status = 'declined'
    } else if (doc.IsCompleted) {
      status = 'signed'
    } else if (!doc.SignedUrl && !doc.Signers?.length) {
      status = 'drafted'
    } else if (doc.ExpiryDate) {
      const expiryDate = new Date(doc.ExpiryDate.iso)
      const now = new Date()
      if (now > expiryDate) {
        status = 'expired'
      }
    }
  }
  
  // Transform placeholders as signers/receivers (this is where the actual recipients are)
  const uniqueEmails = new Set<string>()
  const signers: DocumentSigner[] = []
  
  // Extract unique emails from placeholders
  if (doc.Placeholders) {
    doc.Placeholders.forEach((placeholder: OpenSignPlaceholder, index) => {
      if (placeholder.email && !uniqueEmails.has(placeholder.email)) {
        uniqueEmails.add(placeholder.email)
        
        // Extract name from placeholder if available, otherwise use email
        const signerPtrName = (placeholder.signerPtr as { Name?: string })?.Name
        const name = signerPtrName || 
                    placeholder.email.split('@')[0] || 
                    `Signer ${signers.length + 1}`
        
        signers.push({
          id: placeholder.id || `placeholder-${index}`,
          name: name,
          email: placeholder.email,
          role: placeholder.signerRole || 'Signer',
          color: getSignerColor(signers.length),
          // Use enhanced backend status if available, otherwise fallback to legacy logic
          status: placeholder.status || (doc.IsCompleted ? 'signed' : 'waiting'),
          // Use backend-provided signedAt timestamp if available
          signedAt: placeholder.signedAt,
          userId: placeholder?.TenantUserId?.objectId,
          contactId: placeholder.signerObjId,
          // Use backend-provided order for sequential signing
          order: placeholder.order || (signers.length + 1)
        })
      }
    })
  }
  
  // Fallback to Signers array if no placeholders
  if (signers.length === 0 && doc.Signers) {
    doc.Signers.forEach((signer, index) => {
      signers.push({
        id: signer.objectId,
        name: signer.Name,
        email: signer.Email,
        role: `Signer ${index + 1}`,
        color: getSignerColor(index),
        status: doc.IsCompleted ? 'signed' : 'waiting',
        userId: signer.UserId?.objectId,
        contactId: signer.objectId,
        order: index + 1
      })
    })
  }
  
  // Transform placeholders for field positioning with enhanced status tracking
  const placeholders: DocumentPlaceholder[] = (doc.Placeholders || []).map((placeholder: OpenSignPlaceholder) => ({
    id: placeholder.id,
    signerObjId: placeholder.signerObjId || '', // Handle optional field
    role: placeholder.signerRole || 'Signer',
    email: placeholder.email,
    color: '#3B82F6', // Default blue color
    status: placeholder.status || 'waiting', // ✅ Enhanced: Include status from backend
    signedAt: placeholder.signedAt, // ✅ Enhanced: Include signing timestamp
    signedUrl: placeholder.signedUrl, // ✅ Enhanced: Include signed PDF URL
    ipAddress: placeholder.ipAddress, // ✅ Enhanced: Include IP for audit trail
    fields: [{
      page: placeholder.page || 1,
      x: placeholder.x || 0,
      y: placeholder.y || 0,
      width: placeholder.width || 100,
      height: placeholder.height || 50,
      type: placeholder.type,
      name: placeholder.label || placeholder.type,
      required: placeholder.required || false,
      defaultValue: ''
    }]
  }))
  
  // Get current user ID and email from localStorage (if available)
  const currentUserId = typeof window !== 'undefined' 
    ? localStorage.getItem('currentUserId') 
    : null
  
  let currentUserEmail = null
  if (typeof window !== 'undefined') {
    try {
      const authData = localStorage.getItem('auth-storage')
      if (authData) {
        const auth = JSON.parse(authData)
        currentUserEmail = auth.state?.user?.email
      }
    } catch {
      // Ignore parsing errors
    }
  }
  
  // Check if current user can sign or has signed
  // Look for user by ID first, then by email
  let userSigner = signers.find(s => s.userId === currentUserId)
  if (!userSigner && currentUserEmail) {
    userSigner = signers.find(s => s.email === currentUserEmail)
  }
  
  const hasUserSigned = userSigner?.status === 'signed'
  
  // Check if user can sign considering order
  let canUserSign = false
  if (userSigner && userSigner.status === 'waiting' && status !== 'signed' && status !== 'declined') {
    if (doc.SendinOrder && userSigner.order) {
      // If sending in order, check if all previous signers have signed
      const previousSigners = signers.filter(s => s.order && s.order < userSigner.order!)
      const allPreviousSignersSigned = previousSigners.every(s => s.status === 'signed')
      canUserSign = allPreviousSignersSigned
    } else {
      // If not sending in order, user can sign anytime
      canUserSign = true
    }
  }
  
  return {
    objectId: doc.objectId,
    name: doc.Name,
    fileName: doc.Name,
    url: doc.URL,
    signedUrl: doc.SignedUrl,
    note: doc.Note,
    description: doc.Description,
    status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    expiryDate: doc.ExpiryDate?.iso,
    timeToCompleteDays: doc.TimeToCompleteDays,
    isOtpEnabled: doc.IsEnableOTP || false,
    isTourEnabled: doc.IsTour || false,
    sendInOrder: doc.SendinOrder || false,
    declineReason: doc.DeclineReason,
    signers,
    placeholders,
    createdBy: {
      id: doc.CreatedBy?.objectId || doc.ExtUserPtr?.objectId || '',
      name: doc.ExtUserPtr?.Name || 'Unknown',
      email: doc.ExtUserPtr?.Email || ''
    },
    assignedTo: userSigner ? {
      id: userSigner.id,
      name: userSigner.name,
      email: userSigner.email
    } : undefined,
    templateId: doc.TemplateId?.objectId,
    // UI-specific properties
    senderName: doc.ExtUserPtr?.Name || 'Unknown',
    senderEmail: doc.ExtUserPtr?.Email || '',
    receiverNames: signers.map(s => s.name),
    hasUserSigned,
    canUserSign,
    isCurrentUserCreator: (doc.ExtUserPtr?.Email === currentUserEmail) || (doc.CreatedBy?.objectId === currentUserId),
    userRole: userSigner?.role
  }
}

// Transform our format to OpenSign format for creation


// Get signer color based on index (matching OpenSign style)
function getSignerColor(index: number): string {
  const colors = [
    '#3b82f6', // Blue for TK
    '#10b981', // Green for SM  
    '#f59e0b', // Orange for TU
    '#ef4444', // Red for HS
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f97316', // Orange
    '#ec4899', // Pink
    '#6366f1', // Indigo
  ]
  return colors[index % colors.length]
}

/**
 * Transform OpenSign document from getReport response format to our internal Document format
 * The getReport function returns documents in a different structure than direct Parse queries
 */
function transformOpenSignDocumentFromReport(reportResult: Record<string, unknown>): Document {
  // Extract basic document info
  const objectId = reportResult.objectId as string || reportResult.id as string || '';
  const name = reportResult.Name as string || reportResult.name as string || 'Untitled Document';
  const note = reportResult.Note as string || reportResult.note as string || '';
  const description = reportResult.Description as string || reportResult.description as string || '';

  // Extract URLs
  const url = reportResult.URL as string || reportResult.url as string || '';
  const signedUrl = reportResult.SignedUrl as string || reportResult.signedUrl as string || '';

  // Extract status information
  const isCompleted = reportResult.IsCompleted as boolean || reportResult.isCompleted as boolean || false;
  const isDeclined = reportResult.IsDeclined as boolean || reportResult.isDeclined as boolean || false;
  const signedUrlExists = !!signedUrl;

  // Determine status based on backend logic
  let status: DocumentStatus;
  if (isDeclined) {
    status = 'declined';
  } else if (isCompleted) {
    status = 'signed';
  } else if (signedUrlExists) {
    status = 'waiting';
  } else {
    status = 'drafted';
  }

  // Extract dates
  const createdAt = reportResult.createdAt as string || new Date().toISOString();
  const updatedAt = reportResult.updatedAt as string || createdAt;

  // Extract expiry date
  let expiryDate: string | undefined;
  if (reportResult.ExpiryDate) {
    if (typeof reportResult.ExpiryDate === 'object' && reportResult.ExpiryDate !== null) {
      expiryDate = (reportResult.ExpiryDate as { iso: string }).iso;
    } else {
      expiryDate = reportResult.ExpiryDate as string;
    }
  }

  // Extract signers from report format
  const signers: DocumentSigner[] = [];
  const signersData = reportResult.Signers as unknown[] || reportResult.signers as unknown[] || [];

  if (Array.isArray(signersData)) {
    signersData.forEach((signerData, index) => {
      if (typeof signerData === 'object' && signerData !== null) {
        const signer = signerData as Record<string, unknown>;
        const email = signer.Email as string || signer.email as string || '';
        const signerName = signer.Name as string || signer.name as string || '';

        if (email) {
          signers.push({
            id: signer.objectId as string || `signer-${index}`,
            name: signerName || email.split('@')[0],
            email: email,
            role: signer.Role as string || signer.role as string || `Signer ${index + 1}`,
            status: 'waiting', // Default status, will be updated based on document status
            signedAt: undefined,
            userId: undefined,
            contactId: signer.objectId as string,
            order: index + 1
          });
        }
      }
    });
  }

  // Extract placeholders
  const placeholders: DocumentPlaceholder[] = [];
  const placeholdersData = reportResult.Placeholders as unknown[] || reportResult.placeholders as unknown[] || [];

  if (Array.isArray(placeholdersData)) {
    placeholdersData.forEach((placeholderData, index) => {
      if (typeof placeholderData === 'object' && placeholderData !== null) {
        const placeholder = placeholderData as Record<string, unknown>;
        const email = placeholder.email as string || placeholder.Email as string || '';

        if (email) {
          placeholders.push({
            id: placeholder.id as string || `placeholder-${index}`,
            signerObjId: placeholder.signerObjId as string || (placeholder.signerPtr as Record<string, unknown>)?.objectId as string || '',
            role: placeholder.signerRole as string || placeholder.role as string || 'Signer',
            email: email,
            color: getSignerColor(index),
            fields: [] // Placeholder fields would need to be extracted from the full document
          });
        }
      }
    });
  }

  // Extract creator information - prioritize ExtUserPtr over CreatedBy
  let createdBy = {
    id: '',
    name: 'Unknown User',
    email: ''
  };

  // First try to get sender info from ExtUserPtr (this is the actual sender/document creator)
  if (reportResult.ExtUserPtr) {
    if (typeof reportResult.ExtUserPtr === 'object' && reportResult.ExtUserPtr !== null) {
      const extUser = reportResult.ExtUserPtr as Record<string, unknown>;
      createdBy = {
        id: extUser.objectId as string || extUser.id as string || '',
        name: extUser.Name as string || extUser.name as string || 'Unknown User',
        email: extUser.Email as string || extUser.email as string || ''
      };
      console.log('📧 Extracted sender from ExtUserPtr:', createdBy);
    }
  }
  // Fallback to CreatedBy if ExtUserPtr is not available
  else if (reportResult.CreatedBy) {
    if (typeof reportResult.CreatedBy === 'object' && reportResult.CreatedBy !== null) {
      const creator = reportResult.CreatedBy as Record<string, unknown>;
      createdBy = {
        id: creator.objectId as string || creator.id as string || '',
        name: creator.Name as string || creator.name as string || 'Unknown User',
        email: creator.Email as string || creator.email as string || ''
      };
      console.log('📧 Extracted sender from CreatedBy (fallback):', createdBy);
    }
  } else {
    console.warn('⚠️ No ExtUserPtr or CreatedBy found in report result');
  }

  // Build the document object
  const document: Document = {
    objectId,
    name,
    fileName: name,
    url: url || undefined,
    signedUrl: signedUrl || undefined,
    note: note || undefined,
    description: description || undefined,
    status,
    createdAt,
    updatedAt,
    expiryDate,
    timeToCompleteDays: reportResult.TimeToCompleteDays as number || undefined,
    isOtpEnabled: reportResult.IsEnableOTP as boolean || false,
    isTourEnabled: reportResult.IsTour as boolean || false,
    sendInOrder: reportResult.SendinOrder as boolean || false,
    declineReason: reportResult.DeclineReason as string || undefined,
    signers,
    placeholders,
    createdBy,
    assignedTo: undefined, // Will be determined based on current user context
    templateId: reportResult.TemplateId as string || undefined,
    // UI-specific properties
    senderName: createdBy.name,
    senderEmail: createdBy.email,
    receiverNames: signers.map(s => s.name),
    hasUserSigned: status === 'signed',
    canUserSign: status === 'waiting',
    isCurrentUserCreator: false, // This will be updated in context where current user is known
    userRole: 'Signer' // Default role, will be updated based on context
  };

  return document;
}

// Enhanced user profile interface
export interface EnhancedUserProfile {
  name: string
  email: string
  company: string
  role: string
  organizationId?: string
  teamIds?: string[]
  extendedId: string
}

/**
 * Enhanced user details service using the improved backend
 */
class UserDetailsService {
  /**
   * Get comprehensive user details using the enhanced getUserDetails backend function
   */
  async getEnhancedUserProfile(): Promise<EnhancedUserProfile | null> {
    try {
      // Get user extended ID from local storage
      let userExtendedId: string | null = null;
      if (typeof window !== 'undefined') {
        try {
          const authData = localStorage.getItem('auth-storage');
          if (authData) {
            const parsed = JSON.parse(authData);
            userExtendedId = parsed.state?.user?.extendedId;
          }
        } catch {
          console.warn('Could not get user extended ID from auth store');
        }
      }

      if (!userExtendedId) {
        console.warn('No extended user ID available for profile loading');
        return null;
      }

      console.log('👤 Loading enhanced user profile for ExtUserPtr:', userExtendedId);

      const response = await openSignApiService.post<{
        result?: {
          Name?: string
          Email?: string
          Company?: string
          UserRole?: string
          OrganizationId?: { objectId: string }
          TeamIds?: Array<{ objectId: string }>
          UserId?: { objectId: string }
        }
        error?: string
      }>("functions/getUserDetails", {
        ExtUserPtr: userExtendedId
      });

      if (response.error) {
        console.error('❌ getUserDetails API error:', response.error);
        return null;
      }

      if (!response.result) {
        console.warn('⚠️ getUserDetails returned empty result');
        return null;
      }

      const userDetails = response.result;

      const profile: EnhancedUserProfile = {
        name: userDetails.Name || 'Unknown User',
        email: userDetails.Email || '',
        company: userDetails.Company || '',
        role: userDetails.UserRole || 'User',
        organizationId: userDetails.OrganizationId?.objectId,
        teamIds: userDetails.TeamIds?.map(team => team.objectId) || [],
        extendedId: userExtendedId
      };

      console.log('✅ Enhanced user profile loaded:', profile);

      // Update localStorage with enhanced profile data
      if (typeof window !== 'undefined') {
        try {
          const authData = localStorage.getItem('auth-storage');
          if (authData) {
            const parsed = JSON.parse(authData);
            parsed.state.user.profile = profile;
            localStorage.setItem('auth-storage', JSON.stringify(parsed));
          }
        } catch {
          console.warn('Could not update auth store with enhanced profile');
        }
      }

      return profile;
    } catch (error) {
      console.error('[User Details] Error fetching enhanced user profile:', error);
      return null;
    }
  }

  /**
   * Get user profile from localStorage or fetch from backend
   */
  async getUserProfile(): Promise<EnhancedUserProfile | null> {
    // Try to get cached profile first
    if (typeof window !== 'undefined') {
      try {
        const authData = localStorage.getItem('auth-storage');
        if (authData) {
          const parsed = JSON.parse(authData);
          if (parsed.state?.user?.profile) {
            console.log('📋 Using cached user profile');
            return parsed.state.user.profile;
          }
        }
      } catch {
        console.warn('Could not get cached profile from auth store');
      }
    }

    // Fetch fresh profile from backend
    return this.getEnhancedUserProfile();
  }
}

export const userDetailsService = new UserDetailsService()

export const documentsApiService = new DocumentsApiService()
