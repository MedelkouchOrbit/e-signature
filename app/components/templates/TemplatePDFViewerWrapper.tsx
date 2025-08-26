"use client"

import dynamic from 'next/dynamic'
import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FieldPlacement {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  page: number
  required: boolean
}

interface TemplatePDFViewerWrapperProps {
  fileUrl: string
  className?: string
  onFieldPlacement?: (x: number, y: number, page: number) => void
  fieldPlacements?: FieldPlacement[]
  selectedFieldType?: string | null
}

// Dynamic import with no SSR to avoid PDF.js issues
const TemplatePDFViewerComponent = dynamic(
  () => import('./TemplatePDFViewer').then((mod) => mod.TemplatePDFViewer),
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

export function TemplatePDFViewerWrapper({ 
  fileUrl, 
  className,
  onFieldPlacement,
  fieldPlacements = [],
  selectedFieldType
}: TemplatePDFViewerWrapperProps) {
  if (!fileUrl) {
    return (
      <div className={cn("flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300", className)}>
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No document uploaded</p>
        </div>
      </div>
    )
  }

  return (
    <TemplatePDFViewerComponent
      fileUrl={fileUrl}
      className={className}
      onFieldPlacement={onFieldPlacement}
      fieldPlacements={fieldPlacements}
      selectedFieldType={selectedFieldType}
    />
  )
}
