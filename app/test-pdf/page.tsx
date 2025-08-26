"use client"

import { PDFViewerWrapper } from "@/app/components/documents/PDFViewerWrapper"

export default function TestPDFPage() {
  // Using a publicly available PDF for testing
  const testPdfUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">PDF Viewer Test</h1>
      <div className="w-full max-w-4xl mx-auto">
        <PDFViewerWrapper 
          fileUrl={testPdfUrl}
          signatures={[]}
          onSignatureAdd={(signature) => console.log('Signature added:', signature)}
          onSignatureRemove={(id) => console.log('Signature removed:', id)}
        />
      </div>
    </div>
  )
}
