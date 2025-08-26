"use client"

import { useState, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { FileText, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Configure PDF.js worker - same as working documents folder
if (typeof window !== 'undefined') {
  // Try local worker first, fallback to CDN
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
}

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

interface TemplatePDFViewerProps {
  fileUrl: string
  className?: string
  onFieldPlacement?: (x: number, y: number, page: number) => void
  fieldPlacements?: FieldPlacement[]
  selectedFieldType?: string | null
}

export function TemplatePDFViewer({ 
  fileUrl, 
  className,
  onFieldPlacement,
  fieldPlacements = [],
  selectedFieldType
}: TemplatePDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsLoading(true)
    setError(null)
  }, [fileUrl])

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
    
    setIsLoading(false)
    setError('Failed to load PDF. Please check the file URL or try again.')
  }

  const onPageLoadSuccess = () => {
    setIsLoading(false)
  }

  const onPageLoadError = (error: Error) => {
    console.error('Page load error:', error)
    setError(`Failed to load page ${pageNumber}`)
  }

  const handlePageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onFieldPlacement || !selectedFieldType) return

    const pageRect = event.currentTarget.getBoundingClientRect()
    
    // Calculate relative position within the page
    const x = ((event.clientX - pageRect.left) / pageRect.width) * 100
    const y = ((event.clientY - pageRect.top) / pageRect.height) * 100
    
    onFieldPlacement(x, y, pageNumber)
  }

  const zoomIn = () => setScale(prev => Math.min(3.0, prev + 0.25))
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.25))

  const goToPrevPage = () => setPageNumber(prev => Math.max(1, prev - 1))
  const goToNextPage = () => setPageNumber(prev => Math.min(numPages, prev + 1))

  if (!fileUrl) {
    return (
      <div className={cn("flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300", className)}>
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">No document uploaded</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full bg-white border rounded-lg", className)}>
      {/* PDF Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm">
            Page {pageNumber} of {numPages}
          </span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={zoomIn}
            disabled={scale >= 3.0}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 p-4 overflow-auto bg-gray-100">
        <div className="flex justify-center">
          <div 
            ref={containerRef}
            className="relative"
            style={{ cursor: selectedFieldType ? 'crosshair' : 'default' }}
          >
            {isLoading && (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
                  <p className="text-gray-600">Loading PDF...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="mb-2 text-red-600">Error loading PDF</p>
                  <p className="text-sm text-gray-600">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => window.open(fileUrl, '_blank')}
                  >
                    Open in new tab
                  </Button>
                </div>
              </div>
            )}

            {!error && (
              <Document
                file={fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={null}
                error={null}
              >
                <div className="relative" onClick={handlePageClick}>
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    onLoadSuccess={onPageLoadSuccess}
                    onLoadError={onPageLoadError}
                    loading={null}
                    error={null}
                  />
                  
                  {/* Field placement overlays for current page */}
                  {fieldPlacements
                    .filter(field => field.page === pageNumber)
                    .map((field) => (
                      <div
                        key={field.id}
                        className="absolute transition-colors bg-opacity-50 border-2 border-blue-500 border-dashed rounded cursor-pointer bg-blue-50 hover:bg-blue-100"
                        style={{
                          left: `${field.x}%`,
                          top: `${field.y}%`,
                          width: `${field.width}%`,
                          height: `${field.height}%`,
                        }}
                      >
                        <div className="flex items-center justify-center h-full text-xs font-medium text-blue-600">
                          {field.type}
                        </div>
                      </div>
                    ))}
                </div>
              </Document>
            )}
          </div>
        </div>
      </div>
      
      {selectedFieldType && (
        <div className="p-3 border-t bg-blue-50">
          <p className="text-sm text-center text-blue-600">
            Click on the document to place a <strong>{selectedFieldType}</strong> field
          </p>
        </div>
      )}
    </div>
  )
}
