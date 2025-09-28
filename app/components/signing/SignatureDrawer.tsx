"use client"

import React, { useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Palette, Type, RotateCcw, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SignatureDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSave: (signatureData: string, type: 'draw' | 'upload' | 'type') => void
  fieldName?: string
}

export function SignatureDrawer({ isOpen, onClose, onSave, fieldName }: SignatureDrawerProps) {
  const sigCanvas = useRef<SignatureCanvas>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<'draw' | 'upload' | 'type'>('draw')
  const [typedSignature, setTypedSignature] = useState('')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [penColor, setPenColor] = useState('#000000')
  const [penSize, setPenSize] = useState(2)

  const handleClear = useCallback(() => {
    if (sigCanvas.current) {
      sigCanvas.current.clear()
    }
  }, [])

  const handleSave = useCallback(() => {
    let signatureData = ''
    
    switch (activeTab) {
      case 'draw':
        if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
          signatureData = sigCanvas.current.toDataURL()
        }
        break
      case 'upload':
        signatureData = uploadedImage || ''
        break
      case 'type':
        if (typedSignature.trim()) {
          // Create a canvas to render the typed signature
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (ctx) {
            canvas.width = 400
            canvas.height = 100
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, 400, 100)
            ctx.fillStyle = penColor
            ctx.font = '24px "Dancing Script", cursive'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(typedSignature, 200, 50)
            signatureData = canvas.toDataURL()
          }
        }
        break
    }

    if (signatureData) {
      onSave(signatureData, activeTab)
      onClose()
    }
  }, [activeTab, typedSignature, uploadedImage, penColor, onSave, onClose])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const penColors = ['#000000', '#0066cc', '#cc0000', '#009900', '#cc6600']
  const penSizes = [1, 2, 3, 4, 5]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl mx-4 bg-white">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {fieldName ? `Sign ${fieldName}` : 'Add Signature'}
            </h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'draw' | 'upload' | 'type')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="draw" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Draw
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload image
              </TabsTrigger>
              <TabsTrigger value="type" className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                Type
              </TabsTrigger>
            </TabsList>

            <TabsContent value="draw" className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Label>Color:</Label>
                  <div className="flex gap-1">
                    {penColors.map((color) => (
                      <button
                        key={color}
                        className={cn(
                          "w-6 h-6 rounded-full border-2",
                          penColor === color ? "border-gray-400" : "border-gray-200"
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setPenColor(color)}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Size:</Label>
                  <div className="flex gap-1">
                    {penSizes.map((size) => (
                      <button
                        key={size}
                        className={cn(
                          "w-6 h-6 rounded border flex items-center justify-center text-xs",
                          penSize === size ? "bg-blue-500 text-white" : "bg-gray-200"
                        )}
                        onClick={() => setPenSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleClear}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg">
                <SignatureCanvas
                  ref={sigCanvas}
                  canvasProps={{
                    width: 600,
                    height: 200,
                    className: 'signature-canvas'
                  }}
                  penColor={penColor}
                  minWidth={penSize}
                  maxWidth={penSize}
                />
              </div>
              <p className="text-sm text-gray-500 text-center">
                Draw your signature above
              </p>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadedImage ? (
                  <Image 
                    src={uploadedImage} 
                    alt="Uploaded signature" 
                    width={300}
                    height={100}
                    className="max-h-32 mx-auto object-contain"
                  />
                ) : (
                  <div>
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600">Click to upload an image</p>
                    <p className="text-sm text-gray-400">PNG, JPG up to 2MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </TabsContent>

            <TabsContent value="type" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="typed-signature">Type your signature</Label>
                <Input
                  id="typed-signature"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder="Enter your full name"
                  className="text-lg"
                />
              </div>
              {typedSignature && (
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <p 
                    className="text-2xl text-center"
                    style={{ 
                      fontFamily: '"Dancing Script", cursive',
                      color: penColor 
                    }}
                  >
                    {typedSignature}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex items-center gap-2 mt-6">
            <div className="flex-1">
              <p className="text-sm text-gray-500">
                1 of 1 fields left
              </p>
            </div>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Check className="w-4 h-4 mr-1" />
              Done
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}