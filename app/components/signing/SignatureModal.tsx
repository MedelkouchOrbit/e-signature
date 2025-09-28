"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Image from 'next/image'

interface SignatureModalProps {
  isOpen: boolean
  onClose: () => void
  onSignature: (signatureData: string) => void
  fieldInfo?: {
    label: string
    required: boolean
  }
}

export function SignatureModal({ isOpen, onClose, onSignature, fieldInfo }: SignatureModalProps) {
  const [activeTab, setActiveTab] = useState('draw')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [typedSignature, setTypedSignature] = useState('')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [autoSignAll, setAutoSignAll] = useState(false)

  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const generateTypedSignature = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 100
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return ''

    ctx.fillStyle = '#000000'
    ctx.font = '32px cursive'
    ctx.textAlign = 'center'
    ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2 + 10)
    
    return canvas.toDataURL()
  }

  const handleDone = () => {
    let signatureData = ''

    switch (activeTab) {
      case 'draw':
        const canvas = canvasRef.current
        if (canvas) {
          signatureData = canvas.toDataURL()
        }
        break
      case 'upload':
        signatureData = uploadedImage || ''
        break
      case 'type':
        signatureData = generateTypedSignature()
        break
    }

    if (signatureData) {
      onSignature(signatureData)
      onClose()
    }
  }

  // Setup canvas when component mounts
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {fieldInfo?.label || 'signature'}
            {fieldInfo?.required && <span className="text-red-500 ml-1">*</span>}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="draw" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Draw
            </TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Upload image
            </TabsTrigger>
            <TabsTrigger value="type" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Type
            </TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="space-y-4">
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <canvas
                ref={canvasRef}
                width={500}
                height={200}
                className="border border-gray-200 bg-white cursor-crosshair w-full"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="mb-4"
              />
              {uploadedImage && (
                <div className="border border-gray-200 bg-white p-4 rounded">
                  <Image
                    src={uploadedImage}
                    alt="Uploaded signature"
                    width={200}
                    height={100}
                    className="max-h-32 mx-auto"
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="type" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="typed-signature">Type your signature</Label>
                <Input
                  id="typed-signature"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder="Enter your full name"
                  className="text-xl"
                />
              </div>
              {typedSignature && (
                <div className="border border-gray-200 bg-white p-4 rounded text-center">
                  <div style={{ fontFamily: 'cursive', fontSize: '32px' }}>
                    {typedSignature}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Options */}
        <div className="flex items-center space-x-4 py-2">
          <div className="text-sm text-blue-600">Options</div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="auto-sign-all"
              checked={autoSignAll}
              onChange={(e) => setAutoSignAll(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="auto-sign-all" className="text-sm">
              Auto sign all
            </Label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4">
          <Button
            variant="outline"
            onClick={clearCanvas}
            disabled={activeTab !== 'draw'}
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            Clear
          </Button>

          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500">
              1 of 1 fields left
            </div>
            <Button
              onClick={handleDone}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={
                (activeTab === 'draw' && !canvasRef.current) ||
                (activeTab === 'upload' && !uploadedImage) ||
                (activeTab === 'type' && !typedSignature.trim())
              }
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}