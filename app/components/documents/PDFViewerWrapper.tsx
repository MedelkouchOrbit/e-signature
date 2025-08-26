"use client"

import dynamic from 'next/dynamic'
import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Signature {
  x: number
  y: number
  width: number
  height: number
  page: number
  id: string
}

interface PDFViewerWrapperProps {
  fileUrl: string
  className?: string
  onSignatureAdd?: (signature: Signature) => void
  onSignatureRemove?: (signatureId: string) => void
  signatures?: Signature[]
}

// Dynamic import with no SSR to avoid PDF.js issues
const PDFViewerComponent = dynamic(
  () => import('./CustomPDFViewer').then((mod) => mod.CustomPDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PDF viewer...</p>
        </div>
      </div>
    )
  }
)

export function PDFViewerWrapper({ 
  fileUrl, 
  className,
  onSignatureAdd,
  onSignatureRemove,
  signatures = [] 
}: PDFViewerWrapperProps) {
  if (!fileUrl) {
    return (
      <div className={cn("flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300", className)}>
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No document selected</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      <PDFViewerComponent
        fileUrl={fileUrl}
        signatures={signatures}
        onSignatureAdd={onSignatureAdd}
        onSignatureRemove={onSignatureRemove}
      />
    </div>
  )
}
