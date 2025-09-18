import { SimpleDocumentSign } from "@/app/components/documents/SimpleDocumentSign"
import { redirect } from 'next/navigation'
import { documentsApiService, type Document } from '@/app/lib/documents-api-service'

interface SignPageProps {
  params: Promise<{ 
    id: string
    locale: string
  }>
}

interface AuthorizationResult {
  authorized: boolean
  error: string | null
  document: Document | null
  redirectToView?: boolean
}

// Function to check if user is authorized to sign the document
async function checkSigningAuthorization(documentId: string): Promise<AuthorizationResult> {
  try {
    console.log('🔍 Checking signing authorization for document:', documentId);
    
    // Use the proper documents API service instead of direct Parse Server calls
    const document = await documentsApiService.getDocument(documentId);
    
    console.log('📄 Document data for authorization:', {
      objectId: document.objectId,
      name: document.name,
      status: document.status,
      signers: document.signers?.map((s) => ({ email: s.email, name: s.name })),
      canUserSign: document.canUserSign,
      isCurrentUserCreator: document.isCurrentUserCreator
    });

    // Check if the document exists and has proper status
    if (!document) {
      return { authorized: false, error: 'Document not found', document: null };
    }

    // Check if document is in a signable state
    if (document.status === 'signed') {
      return { authorized: false, error: 'Document already signed', document, redirectToView: true };
    }

    if (document.status === 'declined') {
      return { authorized: false, error: 'Document has been declined', document };
    }

    if (document.status === 'expired') {
      return { authorized: false, error: 'Document has expired', document };
    }

    // Check if current user can sign this document
    if (!document.canUserSign) {
      return { authorized: false, error: 'User not authorized to sign this document', document };
    }

    console.log('✅ Authorization passed for document:', documentId);
    console.log('📊 Document status:', document.status);

    return { 
      authorized: true, 
      error: null, 
      document
    };

  } catch (error) {
    console.error('❌ Error checking signing authorization:', error);
    return { authorized: false, error: 'Authorization check failed', document: null };
  }
}

export default async function SignPage({ params }: SignPageProps) {
  const { id } = await params
  
  console.log(`🔄 Sign page loaded for document: ${id}`);
  
  // Check authorization before rendering the sign component
  const authCheck = await checkSigningAuthorization(id);
  
  if (!authCheck.authorized) {
    console.error(`❌ Authorization check failed for document ${id}:`, authCheck.error);
    
    if (authCheck.redirectToView) {
      redirect(`/documents/${id}?status=already-signed`);
    }
    
    redirect('/documents?error=authorization-failed');
  }

  console.log(`✅ Authorization passed for document ${id}, rendering sign component`);
  
  return <SimpleDocumentSign 
    documentId={id}
  />
}
