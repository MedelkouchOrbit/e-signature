import { SimpleBulkSendTest } from "@/app/components/documents/SimpleBulkSendTest"

interface BulkSendTestPageProps {
  params: { id: string }
}

export default function BulkSendTestPage({ params }: BulkSendTestPageProps) {
  const documentId = params.id
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          🎯 Bulk Send Signer Test
        </h1>
        
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="font-semibold text-blue-800 mb-2">Quick Instructions:</h2>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Enter your bulk send document ID below (or use URL: /documents/DOCUMENT_ID/bulk-test)</li>
            <li>Check if the document is a valid bulk send document</li>
            <li>Add a signer - it will create a contact and update the Placeholders array</li>
            <li>The signer (e.g., mohammed.elkouch1998@gmail.com) should now see the document in their filtered list</li>
          </ol>
        </div>

        <SimpleBulkSendTest documentId={documentId} />
        
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Testing Notes:</h3>
          <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
            <li>This test directly calls the backend functions that bulk send documents use</li>
            <li>It mimics the exact behavior of the linkContactToDoc cloud function</li>
            <li>Check browser console for detailed logs of the process</li>
            <li>After adding a signer, test document visibility with the assigned user email</li>
          </ul>
        </div>
        
        <div className="mt-6 text-center">
          <a 
            href={`/documents/${documentId}/sign`}
            className="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            ← Back to Document Sign Page
          </a>
        </div>
      </div>
    </div>
  )
}
