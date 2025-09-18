'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { 
  Pen, 
  Type, 
  Upload, 
  RotateCcw, 
  Save, 
  X
} from 'lucide-react'
import Image from 'next/image'
import { cn } from "@/lib/utils"

export interface SignatureData {
  type: 'draw' | 'type' | 'upload'
  dataUrl: string
  width: number
  height: number
  color?: string
  fontSize?: number
  fontFamily?: string
  text?: string
}

interface SignatureModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (signature: SignatureData) => void
  title?: string
  defaultTab?: 'draw' | 'type' | 'upload'
}

// Available fonts for typed signatures
const SIGNATURE_FONTS = [
  { name: 'Handlee', label: 'Handlee', class: 'font-handwriting' },
  { name: 'Dancing Script', label: 'Dancing Script', class: 'font-script' },
  { name: 'Kalam', label: 'Kalam', class: 'font-casual' },
  { name: 'Caveat', label: 'Caveat', class: 'font-elegant' }
]

// Available colors for signatures
const SIGNATURE_COLORS = [
  '#000000', // Black (default)
  '#1e40af', // Blue
  '#dc2626', // Red
  '#059669', // Green
  '#7c2d12', // Brown
  '#4c1d95', // Purple
]

export function SignatureModal({ 
  isOpen, 
  onClose, 
  onSave, 
  title = "Create Your Signature",
  defaultTab = 'draw'
}: SignatureModalProps) {
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>(defaultTab)
  const [signatureColor, setSignatureColor] = useState('#000000')
  const [signatureText, setSignatureText] = useState('')
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0])
  const [fontSize, setFontSize] = useState([24])
  const [isDrawing, setIsDrawing] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Canvas drawing setup
  useEffect(() => {
    if (activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.lineWidth = 3
        ctx.strokeStyle = signatureColor
        
        // Set canvas background to transparent
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }, [activeTab, signatureColor])

  // Drawing functions
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return
    
    setIsDrawing(true)
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
  }, [])

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  }, [isDrawing])

  const stopDrawing = useCallback(() => {
    setIsDrawing(false)
  }, [])

  // Clear canvas
  const clearCanvas = useCallback(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
  }, [])

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  // Generate signature data URL based on active tab
  const generateSignatureDataUrl = useCallback((): string | null => {
    switch (activeTab) {
      case 'draw':
        return canvasRef.current?.toDataURL('image/png') || null
        
      case 'type':
        if (!signatureText.trim()) return null
        
        // Create a temporary canvas for text signature
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = 400
        tempCanvas.height = 100
        const ctx = tempCanvas.getContext('2d')
        
        if (ctx) {
          ctx.font = `${fontSize[0]}px ${selectedFont.name}`
          ctx.fillStyle = signatureColor
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(signatureText, tempCanvas.width / 2, tempCanvas.height / 2)
        }
        
        return tempCanvas.toDataURL('image/png')
        
      case 'upload':
        return uploadedImage
        
      default:
        return null
    }
  }, [activeTab, signatureText, selectedFont, fontSize, signatureColor, uploadedImage])

  // Handle save signature
  const handleSave = useCallback(() => {
    const dataUrl = generateSignatureDataUrl()
    
    if (!dataUrl) {
      return // Could show error toast here
    }

    const signatureData: SignatureData = {
      type: activeTab,
      dataUrl,
      width: 150,
      height: 50,
      color: signatureColor,
      fontSize: fontSize[0],
      fontFamily: selectedFont.name,
      text: activeTab === 'type' ? signatureText : undefined
    }

    onSave(signatureData)
    onClose()
  }, [activeTab, generateSignatureDataUrl, signatureColor, fontSize, selectedFont, signatureText, onSave, onClose])

  // Reset form when tab changes
  useEffect(() => {
    if (activeTab === 'draw') {
      clearCanvas()
    } else if (activeTab === 'type') {
      setSignatureText('')
    } else if (activeTab === 'upload') {
      setUploadedImage(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [activeTab, clearCanvas])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pen className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col space-y-4">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="draw" className="flex items-center gap-2">
                <Pen className="w-4 h-4" />
                Draw
              </TabsTrigger>
              <TabsTrigger value="type" className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                Type
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload
              </TabsTrigger>
            </TabsList>

            {/* Color Selector - Available for all tabs */}
            <div className="flex items-center gap-2 mt-4">
              <Label className="text-sm font-medium">Color:</Label>
              <div className="flex gap-2">
                {SIGNATURE_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSignatureColor(color)}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-all",
                      signatureColor === color ? "border-gray-900 scale-110" : "border-gray-300"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <TabsContent value="draw" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center space-y-4">
                    <p className="text-sm text-gray-600">
                      Draw your signature in the box below
                    </p>
                    <div className="border border-gray-300 rounded-lg inline-block bg-white">
                      <canvas
                        ref={canvasRef}
                        width={500}
                        height={200}
                        className="cursor-crosshair"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearCanvas}
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="type" className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label htmlFor="signature-text">Enter your full name</Label>
                    <Input
                      id="signature-text"
                      value={signatureText}
                      onChange={(e) => setSignatureText(e.target.value)}
                      placeholder="Type your full name here..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Font Style</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {SIGNATURE_FONTS.map((font) => (
                        <Button
                          key={font.name}
                          variant={selectedFont.name === font.name ? "default" : "outline"}
                          onClick={() => setSelectedFont(font)}
                          className={cn("text-lg", font.class)}
                        >
                          {font.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Font Size: {fontSize[0]}px</Label>
                    <Slider
                      value={fontSize}
                      onValueChange={setFontSize}
                      max={48}
                      min={16}
                      step={2}
                      className="mt-2"
                    />
                  </div>

                  {signatureText && (
                    <div className="border border-gray-300 rounded-lg p-8 bg-white text-center">
                      <div
                        style={{
                          fontFamily: selectedFont.name,
                          fontSize: `${fontSize[0]}px`,
                          color: signatureColor,
                        }}
                      >
                        {signatureText}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label>Upload signature image</Label>
                    <div className="mt-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Choose Image File
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Supported formats: PNG, JPG, GIF
                    </p>
                  </div>

                  {uploadedImage && (
                    <div className="border border-gray-300 rounded-lg p-4 bg-white text-center">
                      <Image
                        src={uploadedImage}
                        alt="Uploaded signature"
                        width={200}
                        height={100}
                        className="max-w-full max-h-32 mx-auto object-contain"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Separator />

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!generateSignatureDataUrl()}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Signature
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}