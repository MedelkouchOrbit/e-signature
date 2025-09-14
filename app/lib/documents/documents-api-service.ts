import { openSignApiService } from "../api-service"
import { getReportIdForStatus, getUserExtendedId } from "./document-status-utils"
import type { 
  GetDocumentsParams, 
  DocumentListResponse, 
  CreateDocumentRequest,
  Document,
  DocumentStatus,
  DocumentSigner,
  DocumentPlaceholder
} from "./documents-types"

/**
 * ✅ CORRECTED: Documents API Service using OpenSign function names
 * Based on OpenSign backend analysis: Parse.Cloud.define functions
 */
export const documentsApiService = {
  
  /**
   * Get documents using OpenSign's getReport function
   * ✅ CORRECTED: Remove /functions/ prefix, use direct function name
   */
  async getDocuments(params: GetDocumentsParams = {}): Promise<DocumentListResponse> {
    try {
      const { status, limit = 10, skip = 0, searchTerm = '' } = params;

      console.log('📄 Getting documents via OpenSign getReport function with status:', status);

      // ✅ NEW: Use status-specific reportId for better document filtering
      const reportId = status ? getReportIdForStatus(status) : getUserExtendedId();

      console.log('📊 Using reportId:', reportId, 'for status:', status || 'default');

      const reportParams = {
        reportId,
        limit,
        skip,
        searchTerm
      };

      // ✅ CORRECTED: Use direct function name without /functions/ prefix
      const response = await openSignApiService.post<{
        result?: Document[]
        error?: string
      }>("getReport", reportParams);

      if (response.error) {
        throw new Error(response.error);
      }

      const documents: Document[] = (response.result || []).map(transformOpenSignDocument);

      return {
        results: documents,
        count: documents.length
      };

    } catch (error) {
      console.error('❌ Error fetching documents:', error);
      throw error;
    }
  },

  /**
   * Get single document using OpenSign's getDocument function
   * ✅ CORRECTED: Remove /functions/ prefix, use direct function name
   */
  async getDocument(documentId: string): Promise<Document> {
    try {
      console.log('📄 Getting single document via OpenSign getDocument function');

      // ✅ CORRECTED: Use direct function name without /functions/ prefix
      const response = await openSignApiService.post<{
        result?: any
        error?: string
      }>("getDocument", { docId: documentId });

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.result) {
        throw new Error('Document not found');
      }

      return transformOpenSignDocument(response.result);

    } catch (error) {
      console.error('❌ Error fetching document:', error);
      throw error;
    }
  },

  /**
   * Create document - this might need to use Parse classes directly
   * since OpenSign doesn't seem to have a createDocument function
   */
  async createDocument(data: CreateDocumentRequest): Promise<Document> {
    try {
      console.log('📄 Creating document via Parse classes');

      // This might need to be implemented using Parse classes
      // since OpenSign doesn't expose a createDocument function
      const response = await openSignApiService.post<any>("classes/contracts_Document", {
        Name: data.name,
        Description: data.description,
        Note: data.note,
        TimeToCompleteDays: data.timeToCompleteDays,
        SendinOrder: data.sendInOrder,
        IsEnableOTP: data.otpEnabled,
        IsTour: data.tourEnabled,
        // Add other fields as needed
      });

      return transformOpenSignDocument(response);

    } catch (error) {
      console.error('❌ Error creating document:', error);
      throw error;
    }
  },

  /**
   * Delete document using Parse classes
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      console.log('📄 Deleting document via Parse classes');

      await openSignApiService.delete(`classes/contracts_Document/${documentId}`);

    } catch (error) {
      console.error('❌ Error deleting document:', error);
      throw error;
    }
  },

  /**
   * Sign document using OpenSign's signPdf function
   * ✅ CORRECTED: Remove /functions/ prefix, use direct function name
   */
  async signDocument(documentId: string, signatureData: any): Promise<any> {
    try {
      console.log('📄 Signing document via OpenSign signPdf function');

      // ✅ CORRECTED: Use direct function name without /functions/ prefix
      const response = await openSignApiService.post("signPdf", {
        docId: documentId,
        ...signatureData
      });

      return response;

    } catch (error) {
      console.error('❌ Error signing document:', error);
      throw error;
    }
  },

  /**
   * Get documents using filterdocs function for search
   * ✅ CORRECTED: Remove /functions/ prefix, use direct function name
   */
  async searchDocuments(searchTerm: string): Promise<Document[]> {
    try {
      console.log('📄 Searching documents via OpenSign filterdocs function');

      // ✅ CORRECTED: Use direct function name without /functions/ prefix
      const response = await openSignApiService.post<{
        result?: any[]
        error?: string
      }>("filterdocs", { 
        searchTerm,
        limit: 50 
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return (response.result || []).map(transformOpenSignDocument);

    } catch (error) {
      console.error('❌ Error searching documents:', error);
      throw error;
    }
  }
};

/**
 * Transform OpenSign document format to our internal format
 */
function transformOpenSignDocument(openSignDoc: any): Document {
  return {
    objectId: openSignDoc.objectId || '',
    name: openSignDoc.Name || '',
    description: openSignDoc.Description || '',
    note: openSignDoc.Note || '',
    status: mapOpenSignStatus(openSignDoc.Status),
    url: openSignDoc.URL || '',
    signedUrl: openSignDoc.SignedUrl || '',
    certificateUrl: openSignDoc.CertificateUrl || '',
    createdAt: openSignDoc.createdAt || '',
    updatedAt: openSignDoc.updatedAt || '',
    expiryDate: openSignDoc.ExpiryDate?.iso || '',
    timeToCompleteDays: openSignDoc.TimeToCompleteDays || 0,
    isCompleted: openSignDoc.IsCompleted || false,
    isDeclined: openSignDoc.IsDeclined || false,
    isSignyourself: openSignDoc.IsSignyourself || false,
    isEnableOTP: openSignDoc.IsEnableOTP || false,
    isTour: openSignDoc.IsTour || false,
    sendInOrder: openSignDoc.SendinOrder || false,
    declineReason: openSignDoc.DeclineReason || '',
    signers: (openSignDoc.Signers || []).map(transformSigner),
    placeholders: (openSignDoc.Placeholders || []).map(transformPlaceholder),
    createdBy: {
      objectId: openSignDoc.CreatedBy?.objectId || '',
      name: openSignDoc.CreatedBy?.Name || '',
      email: openSignDoc.CreatedBy?.Email || '',
    },
    assignedTo: openSignDoc.ExtUserPtr ? {
      objectId: openSignDoc.ExtUserPtr.objectId || '',
      name: openSignDoc.ExtUserPtr.Name || '',
      email: openSignDoc.ExtUserPtr.Email || '',
    } : undefined,
    templateId: openSignDoc.TemplateId?.objectId || undefined,
  };
}

function mapOpenSignStatus(status?: string): DocumentStatus {
  switch (status) {
    case 'waiting': return 'waiting';
    case 'signed': return 'signed';
    case 'partially_signed': return 'partially_signed';
    case 'draft': return 'drafted';
    case 'declined': return 'declined';
    case 'expired': return 'expired';
    default: return 'waiting';
  }
}

function transformSigner(signer: any): any {
  return {
    objectId: signer.objectId || '',
    name: signer.Name || '',
    email: signer.Email || '',
    phone: signer.Phone || '',
    role: signer.Role || '',
    order: signer.Order || 0,
    color: getSignerColor(signer.Order || 0),
    status: signer.status || 'waiting',
    signedAt: signer.signedAt || '',
  };
}

function transformPlaceholder(placeholder: any): any {
  return {
    id: placeholder.id || '',
    signerObjId: placeholder.signerObjId || '',
    role: placeholder.signerRole || '',
    email: placeholder.email || '',
    color: getSignerColor(0),
    status: placeholder.status || 'waiting',
    signedAt: placeholder.signedAt || '',
    signedUrl: placeholder.signedUrl || '',
    ipAddress: placeholder.ipAddress || '',
    fields: placeholder.fields || [],
  };
}

function getSignerColor(index: number): string {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#6366F1', '#06B6D4'
  ];
  return colors[index % colors.length];
}
