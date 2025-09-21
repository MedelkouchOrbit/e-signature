'use client'

import React, { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import dynamic from 'next/dynamic'
import { FieldPlacement } from './types'
import { getFieldTypeConfig } from './fieldConfig'

// Dynamic imports for PDF components to avoid SSR issues
const Document = dynamic(() => import('react-pdf').then(mod => ({ default: mod.Document })), { ssr: false })
const Page = dynamic(() => import('react-pdf').then(mod => ({ default: mod.Page })), { ssr: false })

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  import('react-pdf').then(({ pdfjs }) => {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
  })
}

interface PDFViewerProps {
  fileUrl: string | null
  fieldPlacements: FieldPlacement[]
  selectedFieldType: string | null
  onFieldPlaced: (placement: Partial<FieldPlacement>) => void
  onFieldSelected: (field: FieldPlacement) => void
  selectedField?: FieldPlacement | null
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  fileUrl,
  fieldPlacements,
  selectedFieldType,
  onFieldPlaced,
  onFieldSelected,
  selectedField
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1)

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setCurrentPage(1)
  }, [])

  const onPageClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedFieldType) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    const placement: Partial<FieldPlacement> = {
      id: `field_${Date.now()}`,
      type: selectedFieldType,
      x,
      y,
      width: 15, // Default width as percentage
      height: 8,  // Default height as percentage
      page: currentPage,
      required: true,
      placeholder: `Enter ${selectedFieldType}`
    }

    onFieldPlaced(placement)
  }, [selectedFieldType, currentPage, onFieldPlaced])

  const handleFieldClick = useCallback((field: FieldPlacement, event: React.MouseEvent) => {
    event.stopPropagation()
    onFieldSelected(field)
  }, [onFieldSelected])

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3))
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5))

  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1))
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, numPages))

  if (!fileUrl) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <p className="text-gray-500">No document selected</p>
          <p className="text-sm text-gray-400">Upload a PDF to start placing fields</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
        <div className="flex items-center space-x-4">
          <button
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {numPages}
          </span>
          <button
            onClick={goToNextPage}
            disabled={currentPage >= numPages}
            className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={zoomOut}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-600">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="relative overflow-auto bg-gray-100 rounded-lg" style={{ maxHeight: '70vh' }}>
        <div className="flex justify-center p-4">
          <div 
            className="relative"
            onClick={onPageClick}
            style={{ cursor: selectedFieldType ? 'crosshair' : 'default' }}
          >
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              className="border shadow-lg"
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            </Document>
            
            {/* Field Overlays */}
            {fieldPlacements
              .filter(field => field.page === currentPage)
              .map(field => {
                const config = getFieldTypeConfig(field.type)
                const isSelected = selectedField?.id === field.id
                
                return (
                  <div
                    key={field.id}
                    onClick={(e) => handleFieldClick(field, e)}
                    className={`absolute border-2 flex items-center justify-center text-xs font-medium cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                    }`}
                    style={{
                      left: `${field.x}%`,
                      top: `${field.y}%`,
                      width: `${field.width}%`,
                      height: `${field.height}%`,
                      backgroundColor: config.bgColor,
                      borderColor: config.borderColor,
                      color: config.textColor,
                      transform: `scale(${scale})`,
                      transformOrigin: 'top left'
                    }}
                  >
                    {field.type}
                    {field.assignedSigner && (
                      <span className="ml-1 text-xs">({field.assignedSigner})</span>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      </div>
      
      {selectedFieldType && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            Click on the document to place a <strong>{selectedFieldType}</strong> field
          </p>
        </div>
      )}
    </div>
  )
}

export default PDFViewer