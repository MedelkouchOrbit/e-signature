'use client'

import React, { useRef, useState } from 'react'
import { X, Upload } from 'lucide-react'
import dynamic from 'next/dynamic'
import { SignatureType, SignatureCanvasRef } from './types'

// Dynamically import SignatureCanvas to avoid SSR issues  
const SignatureCanvas = dynamic(() => import('react-signature-canvas'), { 
  ssr: false,
  loading: () => <div className="p-4">Loading signature pad...</div>
}) as React.ComponentType<{
  ref?: React.RefObject<SignatureCanvasRef | null>
  penColor?: string
  canvasProps?: {
    width: number
    height: number
    className: string
  }
}>

interface SignatureModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (signatureData: string) => void
  title?: string
}

const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title = "Create Signature"
}) => {
  const sigCanvasRef = useRef<SignatureCanvasRef>(null)
  const [signatureType, setSignatureType] = useState<SignatureType>('draw')
  const [typedSignature, setTypedSignature] = useState('')

  const clearSignature = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear()
    }
  }

  const handleSave = () => {
    let signatureData = ''
    
    if (signatureType === 'draw') {
      if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
        signatureData = sigCanvasRef.current.toDataURL()
      }
    } else if (signatureType === 'type') {
      if (typedSignature.trim()) {
        // For typed signatures, we'll create a simple data URL representation
        signatureData = `data:text/plain;base64,${btoa(typedSignature)}`
      }
    }
    
    if (signatureData) {
      onSave(signatureData)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        onSave(result)
      }
      reader.readAsDataURL(file)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {/* Signature Type Selector */}
          <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg mb-6">
            <button
              onClick={() => setSignatureType('draw')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                signatureType === 'draw'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Draw
            </button>
            <button
              onClick={() => setSignatureType('type')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                signatureType === 'type'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Type
            </button>
            <button
              onClick={() => setSignatureType('upload')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                signatureType === 'upload'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Upload
            </button>
          </div>

          {/* Signature Canvas */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white min-h-[200px] flex items-center justify-center">
            {signatureType === 'draw' && (
              <div className="relative w-full h-full">
                <SignatureCanvas
                  ref={sigCanvasRef}
                  penColor="black"
                  canvasProps={{
                    width: 600,
                    height: 200,
                    className: 'w-full h-full'
                  }}
                />
                <div className="absolute bottom-2 right-2">
                  <button
                    onClick={clearSignature}
                    className="px-3 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
            
            {signatureType === 'type' && (
              <div className="w-full p-4">
                <input
                  type="text"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder="Type your name here"
                  className="w-full px-3 py-2 text-2xl bg-transparent border-none outline-none font-script"
                  style={{ fontFamily: 'Dancing Script, cursive' }}
                />
              </div>
            )}
            
            {signatureType === 'upload' && (
              <div className="p-8 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="signature-upload"
                />
                <label
                  htmlFor="signature-upload"
                  className="text-gray-600 cursor-pointer hover:text-gray-900"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto bg-gray-100 rounded-full">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-sm font-medium">Click to upload signature</span>
                      <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                    </div>
                  </div>
                </label>
              </div>
            )}
          </div>
          
          <p className="mt-2 text-xs text-gray-500">
            {signatureType === 'draw' && 'Draw your signature in the box above'}
            {signatureType === 'type' && 'Type your name as it will appear as a signature'}
            {signatureType === 'upload' && 'Upload an image of your signature'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end p-6 space-x-3 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={
              signatureType === 'draw' ? sigCanvasRef.current?.isEmpty() : 
              signatureType === 'type' ? !typedSignature.trim() : false
            }
            className="px-8 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Save Signature
          </button>
        </div>
      </div>
    </div>
  )
}

export default SignatureModal