import { TestAddSigner, TestGetSigners } from "@/app/components/documents/TestAddSigner"
import { BulkSendSignerTest } from "@/app/components/documents/BulkSendSignerTest"

interface TestPageProps {
  params: { id: string }
  searchParams: { test?: string }
}

export default function TestSignerPage({ params, searchParams }: TestPageProps) {
  const documentId = params.id
  const isTestMode = searchParams.test === 'true'
  
  if (!isTestMode) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Test Mode</h1>
          <p className="text-gray-600 mb-4">
            Add <code>?test=true</code> to the URL to access the test interface.
          </p>
          <a 
            href={`/documents/${documentId}/test?test=true`}
            className="text-blue-600 hover:underline"
          >
            Enable Test Mode
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          🧪 Document Signer Testing
        </h1>
        
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h2 className="font-semibold text-yellow-800 mb-2">Testing Instructions:</h2>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>Use the form below to add a signer to document: <code>{documentId}</code></li>
            <li>Check console logs for detailed debug information</li>
            <li>Use &ldquo;Get Document Signers&rdquo; to verify the signer was added</li>
            <li>Test with email: <code>mohammed.elkouch1998@gmail.com</code></li>
            <li>Then check if that user can see the document in their filtered list</li>
          </ol>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">🧪 Comprehensive Bulk Send Test</h2>
            <BulkSendSignerTest documentId={documentId} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Add Signer</h2>
              <TestAddSigner 
                documentId={documentId}
                onSignerAdded={() => {
                  console.log('✅ Signer added, you can now check the signers list or test document visibility')
                }}
              />
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">View Signers</h2>
              <TestGetSigners documentId={documentId} />
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Expected Behavior:</h3>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Adding a signer should create a contact in contracts_Contactbook</li>
            <li>The contact should be linked to the document properly</li>
            <li>The signer should appear in both Signers and Placeholders arrays</li>
            <li>The assigned user should be able to see the document in their filtered list</li>
            <li>Console should show the contact ID and success messages</li>
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
