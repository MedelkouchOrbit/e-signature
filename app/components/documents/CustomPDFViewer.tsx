"use client"

import { useState, useRef, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { FileText, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  // Try local worker first, fallback to CDN
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
}

interface Signature {
  x: number
  y: number
  width: number
  height: number
  page: number
  id: string
}

interface CustomPDFViewerProps {
  fileUrl: string
  className?: string
  onSignatureAdd?: (signature: Signature) => void
  onSignatureRemove?: (signatureId: string) => void
  signatures?: Signature[]
}

export function CustomPDFViewer({ 
  fileUrl, 
  className,
  onSignatureAdd,
  onSignatureRemove,
  signatures = [] 
}: CustomPDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const pageRef = useRef<HTMLDivElement>(null)

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setIsLoading(false)
    setError(null)
  }

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error)
    
    // If worker failed, try alternative worker setup
    if (error.message.includes('worker')) {
      console.log('Trying alternative worker configuration...')
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
    }
    
    setError('Failed to load PDF document')
    setIsLoading(false)
  }

  const handlePageClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!pageRef.current || !onSignatureAdd) return

    const rect = pageRef.current.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    const newSignature: Signature = {
      x,
      y,
      width: 15,
      height: 8,
      page: pageNumber,
      id: `signature-${Date.now()}-${Math.random()}`
    }

    onSignatureAdd(newSignature)
  }, [pageNumber, onSignatureAdd])

  const handleSignatureClick = (signatureId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (onSignatureRemove) {
      onSignatureRemove(signatureId)
    }
  }

  const zoomIn = () => setScale(prev => Math.min(2.0, prev + 0.25))
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.25))

  const currentPageSignatures = signatures.filter(sig => sig.page === pageNumber)

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
    <div className={cn("relative bg-white rounded-lg border overflow-hidden", className)}>
      {/* PDF Viewer Controls */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            disabled={scale >= 2.0}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {pageNumber} / {numPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
            disabled={pageNumber >= numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Content Area */}
      <div className="relative h-[600px] overflow-auto bg-gray-100 flex items-center justify-center">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading PDF...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-red-600 mb-2">Error loading PDF</p>
              <p className="text-gray-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {!error && (
          <div 
            ref={pageRef}
            className="relative"
            onClick={handlePageClick}
            style={{ cursor: 'crosshair' }}
          >
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading=""
              error=""
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>

            {/* Signature Overlays */}
            {currentPageSignatures.map((signature) => (
              <div
                key={signature.id}
                className="absolute border-2 border-dashed border-blue-500 bg-blue-50 bg-opacity-50 rounded cursor-pointer hover:bg-blue-100 transition-colors flex items-center justify-center"
                style={{
                  left: `${signature.x}%`,
                  top: `${signature.y}%`,
                  width: `${signature.width}%`,
                  height: `${signature.height}%`,
                }}
                onClick={(e) => handleSignatureClick(signature.id, e)}
              >
                <div className="text-blue-600 text-xs font-medium">
                  Sign Here
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
