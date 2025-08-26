"use client"

import { useState, useRef, useEffect } from 'react'
import { FileText, ZoomIn, ZoomOut, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PDFViewerProps {
  fileUrl: string
  className?: string
  onSignaturePositionClick?: (x: number, y: number, page: number) => void
  signaturePositions?: Array<{
    x: number
    y: number
    width: number
    height: number
    page: number
  }>
}

export function PDFViewer({ 
  fileUrl, 
  className,
  onSignaturePositionClick,
  signaturePositions = [] 
}: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsLoading(true)
    setError(null)
  }, [fileUrl])

  const handleIframeLoad = () => {
    setIsLoading(false)
    setError(null)
  }

  const handleIframeError = () => {
    setIsLoading(false)
    setError('Failed to load PDF. The file might be corrupted or the URL is invalid.')
  }

  const handleContainerClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onSignaturePositionClick || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    
    onSignaturePositionClick(x, y, 1) // Assuming page 1 for now
  }

  const zoomIn = () => setZoom(prev => Math.min(200, prev + 25))
  const zoomOut = () => setZoom(prev => Math.max(50, prev - 25))

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
            disabled={zoom <= 50}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {zoom}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            disabled={zoom >= 200}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(fileUrl, '_blank')}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </div>

      {/* PDF Content Area */}
      <div 
        ref={containerRef}
        className="relative h-[600px] overflow-auto bg-gray-100"
        onClick={handleContainerClick}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading PDF...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-red-600 mb-2">Error loading PDF</p>
              <p className="text-gray-600 text-sm">{error}</p>
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
          <iframe
            ref={iframeRef}
            src={fileUrl}
            className="w-full h-full border-0"
            style={{ 
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left',
              width: `${10000 / zoom}%`,
              height: `${10000 / zoom}%`
            }}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title="PDF Viewer"
          />
        )}

        {/* Signature Position Overlays */}
        {signaturePositions.map((position, index) => (
          <div
            key={index}
            className="absolute border-2 border-dashed border-blue-500 bg-blue-50 bg-opacity-50 rounded cursor-pointer hover:bg-blue-100 transition-colors"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              width: `${position.width}%`,
              height: `${position.height}%`,
            }}
          >
            <div className="flex items-center justify-center h-full text-blue-600 text-xs font-medium">
              Sign Here
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
