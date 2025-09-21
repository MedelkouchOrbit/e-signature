'use client'

import React, { useCallback, useState } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import { CreateTemplateFormData } from './types'

interface DocumentUploadProps {
  templateData: CreateTemplateFormData
  onTemplateDataChange: (updates: Partial<CreateTemplateFormData>) => void
  onNext: () => void
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  templateData,
  onTemplateDataChange,
  onNext
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileUpload = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file')
      return
    }

    setIsUploading(true)
    try {
      // Create a blob URL for the uploaded file
      const fileUrl = URL.createObjectURL(file)
      onTemplateDataChange({ fileUrl })
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }, [onTemplateDataChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [handleFileUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [handleFileUpload])

  const removeFile = () => {
    onTemplateDataChange({ fileUrl: null })
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Template</h1>
        <p className="text-gray-600">Upload a document to get started</p>
      </div>

      {!templateData.fileUrl ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          
          <div className="space-y-4">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gray-100 rounded-full">
              <Upload className="w-8 h-8 text-gray-600" />
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isUploading ? 'Uploading...' : 'Drop your PDF here'}
              </p>
              <p className="text-gray-600">
                or <span className="text-green-600 font-medium">browse files</span>
              </p>
            </div>
            
            <p className="text-sm text-gray-500">
              Supports: PDF files up to 50MB
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg">
              <FileText className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">PDF Document</p>
              <p className="text-sm text-gray-500">Document uploaded successfully</p>
            </div>
            <button
              onClick={removeFile}
              className="p-2 text-gray-400 hover:text-red-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {templateData.fileUrl && (
        <div className="flex justify-end">
          <button
            onClick={onNext}
            className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  )
}

export default DocumentUpload