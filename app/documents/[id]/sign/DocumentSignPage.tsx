"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  X, 
  FileText, 
  Plus,
  GripVertical,
  Check
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { documentsApiService, type Document, type DocumentSigner } from "@/app/lib/documents-api-service"
import { documentSignersApiService } from "@/app/lib/document-signers-api-service"

interface DocumentSignPageProps {
  documentId: string
}

// Signer Avatar Component
function SignerAvatar({ 
  name, 
  color, 
  size = "md",
  isSelected = false,
  onClick 
}: { 
  name: string
  color?: string
  size?: "sm" | "md" | "lg"
  isSelected?: boolean
  onClick?: () => void
}) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm", 
    lg: "h-12 w-12 text-base"
  }
  
  const bgColor = color || "#3b82f6"
  
  return (
    <div 
      className={cn(
        "relative cursor-pointer transition-all",
        isSelected && "ring-2 ring-blue-500 ring-offset-2"
      )}
      onClick={onClick}
    >
      <Avatar 
        className={cn(sizeClasses[size])}
        style={{ backgroundColor: bgColor }}
      >
        <AvatarFallback 
          className="text-white font-medium"
          style={{ backgroundColor: bgColor }}
        >
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      {isSelected && (
        <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
          <Check className="h-3 w-3" />
        </div>
      )}
    </div>
  )
}

// Add Signer Form
function AddSignerForm({ 
  onAdd, 
  onCancel 
}: { 
  onAdd: (signer: { name: string; email: string; role: string }) => void
  onCancel: () => void 
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("Signer")
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name && email) {
      onAdd({ name, email, role })
      setName("")
      setEmail("")
      setRole("Signer")
    }
  }
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Add New Signer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter signer name"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter signer email"
          />
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Enter signer role"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" onClick={handleSubmit} size="sm">
            Add Signer
          </Button>
          <Button type="button" onClick={onCancel} variant="outline" size="sm">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function DocumentSignPage({ documentId }: DocumentSignPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  // State
  const [document, setDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSigners, setSelectedSigners] = useState<string[]>([])
  const [signerOrder, setSignerOrder] = useState<DocumentSigner[]>([])
  const [showAddSigner, setShowAddSigner] = useState(false)
  const [sendInOrder, setSendInOrder] = useState(false)
  
  // Load document
  const loadDocument = useCallback(async () => {
    try {
      setIsLoading(true)
      const doc = await documentsApiService.getDocument(documentId)
      setDocument(doc)
      setSignerOrder(doc.signers)
      setSelectedSigners(doc.signers.map(s => s.id))
    } catch (error) {
      console.error('Error loading document:', error)
      toast({
        title: "Error",
        description: "Failed to load document",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [documentId, toast])
  
  useEffect(() => {
    loadDocument()
  }, [loadDocument])
  
  // Signer selection
  const toggleSigner = (signerId: string) => {
    setSelectedSigners(prev => 
      prev.includes(signerId) 
        ? prev.filter(id => id !== signerId)
        : [...prev, signerId]
    )
  }
  
  // Add new signer
  const addSigner = async (signerData: { name: string; email: string; role: string }) => {
    try {
      console.log('🔄 Adding signer to document:', signerData)
      
      // Use the document signers service to properly add the signer
      const result = await documentSignersApiService.addSignerToDocument(documentId, {
        name: signerData.name,
        email: signerData.email
      })
      
      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to add signer",
          variant: "destructive"
        })
        return
      }
      
      // Reload the document to get updated signers
      await loadDocument()
      
      setShowAddSigner(false)
      
      toast({
        title: "Signer Added",
        description: `${signerData.name} has been added to the document and will receive a signing invitation`
      })
      
    } catch (error) {
      console.error('❌ Error adding signer:', error)
      toast({
        title: "Error",
        description: "Failed to add signer. Please try again.",
        variant: "destructive"
      })
    }
  }
  
  // Remove signer
  const removeSigner = async (signerId: string) => {
    try {
      // Find the signer to get their contact ID
      const signer = signerOrder.find(s => s.id === signerId)
      if (!signer || !signer.contactId) {
        // If no contact ID, just remove from local state (for placeholders)
        setSignerOrder(prev => prev.filter(s => s.id !== signerId))
        setSelectedSigners(prev => prev.filter(id => id !== signerId))
        return
      }
      
      console.log('🗑️ Removing signer from document:', signer)
      
      const result = await documentSignersApiService.removeSignerFromDocument(documentId, signer.contactId)
      
      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to remove signer",
          variant: "destructive"
        })
        return
      }
      
      // Reload the document to get updated signers
      await loadDocument()
      
      toast({
        title: "Signer Removed",
        description: `${signer.name} has been removed from the document`
      })
      
    } catch (error) {
      console.error('❌ Error removing signer:', error)
      toast({
        title: "Error",
        description: "Failed to remove signer. Please try again.",
        variant: "destructive"
      })
    }
  }
  
  // Reorder signers (basic implementation)
  const moveSignerUp = (index: number) => {
    if (index > 0) {
      const newOrder = [...signerOrder]
      const temp = newOrder[index]
      newOrder[index] = newOrder[index - 1]
      newOrder[index - 1] = temp
      
      // Update order numbers
      newOrder.forEach((signer, idx) => {
        signer.order = idx + 1
      })
      
      setSignerOrder(newOrder)
    }
  }
  
  // Continue to next step
  const handleContinue = () => {
    const finalSigners = signerOrder.filter(s => selectedSigners.includes(s.id))
    
    if (finalSigners.length === 0) {
      toast({
        title: "No Signers Selected",
        description: "Please select at least one signer to continue",
        variant: "destructive"
      })
      return
    }
    
    // Here you would typically update the document with new signers and proceed to the next step
    console.log('Final signers:', finalSigners)
    console.log('Send in order:', sendInOrder)
    
    toast({
      title: "Document Updated",
      description: `Document prepared with ${finalSigners.length} signer(s)`
    })
    
    // Navigate back to documents or to the next step
    router.push('/documents')
  }
  
  // Get signer color based on index
  const getSignerColor = (index: number): string => {
    const colors = [
      '#3b82f6', // Blue
      '#10b981', // Green  
      '#f59e0b', // Orange
      '#ef4444', // Red
      '#06b6d4', // Cyan
      '#84cc16', // Lime
      '#f97316', // Orange
      '#ec4899', // Pink
    ]
    return colors[index % colors.length]
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p>Loading document...</p>
        </div>
      </div>
    )
  }
  
  if (!document) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p>Document not found</p>
          <Button onClick={() => router.push('/documents')} className="mt-4">
            Back to Documents
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/documents')}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <div>
                <h1 className="text-lg font-semibold">{document.name}</h1>
                <p className="text-sm text-gray-500">Add signers and configure signing order</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                Done
              </Button>
              <Button onClick={handleContinue} size="sm" className="bg-teal-600 hover:bg-teal-700">
                Continue
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document Preview */}
          <div className="lg:col-span-2">
            <Card className="h-[800px]">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <span className="font-medium">{document.name}</span>
                </div>
              </CardHeader>
              <CardContent className="h-full">
                <div className="bg-gray-100 h-full flex items-center justify-center rounded-lg">
                  <div className="text-center text-gray-500">
                    <FileText className="h-16 w-16 mx-auto mb-4" />
                    <p>PDF document preview would be displayed here</p>
                    <p className="text-sm mt-2">Document: {document.fileName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Add Signers Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Add Signers
                  <Badge variant="outline" className="text-xs">
                    {selectedSigners.length} selected
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-500">
                  Add the people who will sign this document.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Assignees Section */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Assignees</Label>
                  <div className="flex gap-2 flex-wrap">
                    {signerOrder.map((signer) => (
                      <SignerAvatar
                        key={signer.id}
                        name={signer.name}
                        color={signer.color}
                        size="md"
                        isSelected={selectedSigners.includes(signer.id)}
                        onClick={() => toggleSigner(signer.id)}
                      />
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 w-10 rounded-full p-0"
                      onClick={() => setShowAddSigner(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Add Signer Form */}
                {showAddSigner && (
                  <AddSignerForm
                    onAdd={addSigner}
                    onCancel={() => setShowAddSigner(false)}
                  />
                )}
                
                {/* Individual Signers List */}
                <div className="space-y-2">
                  {signerOrder.map((signer) => (
                    <div 
                      key={signer.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg border transition-colors",
                        selectedSigners.includes(signer.id) 
                          ? "bg-blue-50 border-blue-200" 
                          : "bg-white hover:bg-gray-50"
                      )}
                    >
                      <Checkbox
                        checked={selectedSigners.includes(signer.id)}
                        onCheckedChange={() => toggleSigner(signer.id)}
                      />
                      <SignerAvatar
                        name={signer.name}
                        color={signer.color}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{signer.name}</p>
                        <p className="text-xs text-gray-500 truncate">{signer.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => removeSigner(signer.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Order of Signers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Order of Signers</CardTitle>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={sendInOrder}
                    onCheckedChange={(checked) => setSendInOrder(checked === true)}
                  />
                  <Label className="text-sm">Send in order</Label>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {signerOrder
                  .filter(signer => selectedSigners.includes(signer.id))
                  .map((signer, index) => (
                    <div 
                      key={signer.id}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => moveSignerUp(index)}
                          disabled={index === 0}
                        >
                          <GripVertical className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <SignerAvatar
                        name={signer.name}
                        color={signer.color}
                        size="sm"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{signer.name}</p>
                        <p className="text-xs text-gray-500 truncate">{signer.email}</p>
                      </div>
                      
                      <Badge variant="outline" className="text-xs">
                        {index + 1}
                      </Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
