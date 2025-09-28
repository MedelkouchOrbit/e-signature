import { RecipientSignPage } from '@/app/components/signing/RecipientSignPage'
import { signingApiService } from '@/app/lib/signing-api-service'
import { redirect } from 'next/navigation'

interface SignPageProps {
  params: Promise<{ 
    docId: string
    contactId: string
  }>
}

export default async function Page({ params }: SignPageProps) {
  const { docId, contactId } = await params
  
  console.log(`🔄 Recipient sign page loaded for document: ${docId}, contact: ${contactId}`)
  
  try {
    // Validate that the document and contact exist
    const [documentResponse, contactResponse] = await Promise.all([
      signingApiService.getDocument(docId),
      signingApiService.getContact(contactId)
    ])
    
    if (!documentResponse.success || !documentResponse.result) {
      console.error('❌ Document not found:', docId)
      redirect('/documents?error=document-not-found')
    }
    
    if (!contactResponse.success || !contactResponse.result) {
      console.error('❌ Contact not found:', contactId)  
      redirect('/documents?error=contact-not-found')
    }
    
    console.log('✅ Document and contact validated, rendering sign page')
    
    return (
      <RecipientSignPage 
        docId={docId}
        contactId={contactId}
      />
    )
  } catch (error) {
    console.error('❌ Error loading sign page:', error)
    redirect('/documents?error=page-load-failed')
  }
}