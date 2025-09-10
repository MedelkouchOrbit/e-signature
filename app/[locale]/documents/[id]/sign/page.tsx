import { SimpleDocumentSign } from "@/app/components/documents/SimpleDocumentSign"
import { redirect } from 'next/navigation'

interface SignPageProps {
  params: Promise<{ 
    id: string
    locale: string
  }>
}

interface DocumentSigner {
  Email: string;
  Name: string;
}

interface DocumentPlaceholder {
  email: string;
  signerRole: string;
}

interface DocumentData {
  objectId: string;
  Name: string;
  Status: string;
  Signers?: DocumentSigner[];
  Placeholders?: DocumentPlaceholder[];
}

// Function to check if user is authorized to sign the document
async function checkSigningAuthorization(documentId: string) {
  try {
    console.log('🔍 Checking signing authorization for document:', documentId);
    
    const response = await fetch(
      `http://94.249.71.89:9000/1/classes/contracts_Document/${documentId}?include=Signers,Placeholders`,
      {
        headers: {
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Master-Key': 'XnAadwKxxByMr',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error('❌ Failed to fetch document for authorization check:', response.status);
      return { authorized: false, error: 'Document not found', document: null };
    }

    const document: DocumentData = await response.json();
    console.log('📄 Document data for authorization:', {
      objectId: document.objectId,
      name: document.Name,
      status: document.Status,
      signers: document.Signers?.map((s) => ({ email: s.Email, name: s.Name })),
      placeholders: document.Placeholders?.map((p) => ({ email: p.email, signerRole: p.signerRole }))
    });

    // Extract authorized emails from both Signers and Placeholders
    const authorizedEmails = new Set<string>();
    
    // Add emails from Signers array
    if (document.Signers) {
      document.Signers.forEach((signer) => {
        if (signer.Email) {
          authorizedEmails.add(signer.Email.toLowerCase());
        }
      });
    }
    
    // Add emails from Placeholders array
    if (document.Placeholders) {
      document.Placeholders.forEach((placeholder) => {
        if (placeholder.email) {
          authorizedEmails.add(placeholder.email.toLowerCase());
        }
      });
    }

    console.log('✅ Authorized emails for document:', Array.from(authorizedEmails));
    console.log('📊 Document status:', document.Status);

    return { 
      authorized: true, 
      error: null, 
      document,
      authorizedEmails: Array.from(authorizedEmails),
      status: document.Status
    };

  } catch (error) {
    console.error('❌ Error checking signing authorization:', error);
    return { authorized: false, error: 'Authorization check failed', document: null };
  }
}

export default async function SignPage({ params }: SignPageProps) {
  const { id } = await params
  
  // Check authorization before rendering the sign component
  const authCheck = await checkSigningAuthorization(id);
  
  if (!authCheck.authorized) {
    console.error(`❌ Authorization check failed for document ${id}:`, authCheck.error);
    redirect('/documents?error=authorization-failed');
  }

  if (authCheck.status === 'signed') {
    console.log(`📝 Document ${id} is already signed, redirecting to view mode`);
    redirect(`/documents/${id}?status=already-signed`);
  }

  console.log(`✅ Authorization passed for document ${id}, rendering sign component`);
  console.log(`📧 Authorized emails:`, authCheck.authorizedEmails);
  
  return <SimpleDocumentSign 
    documentId={id}
  />
}
