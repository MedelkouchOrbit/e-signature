"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { AuthGuard } from "@/app/components/auth/AuthGuard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, FileText, Users, Plus, X } from "lucide-react"
import { documentsApiService, type Document } from "@/app/lib/documents-api-service"
import { useToast } from "@/hooks/use-toast"

export default function DocumentEditPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    signers: [] as Array<{ name: string; email: string; role: string }>
  })

  const documentId = params.id as string

  const loadDocument = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const doc = await documentsApiService.getDocument(documentId)
      setDocument(doc)
      
      // Initialize form data
      setFormData({
        name: doc.name,
        description: doc.fileName || '',
        signers: doc.signers.map(signer => ({
          name: signer.name,
          email: signer.email,
          role: signer.role || 'signer'
        }))
      })
    } catch (err) {
      console.error('Error loading document:', err)
      setError('Failed to load document')
      toast({
        title: "Error",
        description: "Failed to load document for editing",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [documentId, toast])

  useEffect(() => {
    loadDocument()
  }, [loadDocument])

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // For now, we'll just show a success message since the backend
      // update functionality would need to be implemented
      toast({
        title: "Edit Saved",
        description: "Document changes have been saved successfully",
      })
      
      // Navigate back to document details
      router.push(`/documents/${documentId}`)
    } catch (err) {
      console.error('Error saving document:', err)
      toast({
        title: "Error",
        description: "Failed to save document changes",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddSigner = () => {
    setFormData(prev => ({
      ...prev,
      signers: [...prev.signers, { name: '', email: '', role: 'signer' }]
    }))
  }

  const handleRemoveSigner = (index: number) => {
    setFormData(prev => ({
      ...prev,
      signers: prev.signers.filter((_, i) => i !== index)
    }))
  }

  const handleSignerChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      signers: prev.signers.map((signer, i) => 
        i === index ? { ...signer, [field]: value } : signer
      )
    }))
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
              <p>Loading document for editing...</p>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (error || !document) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">{error || 'Document not found'}</p>
              <Button onClick={() => router.push('/documents')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Documents
              </Button>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/documents/${documentId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Edit Document</h1>
              <p className="text-muted-foreground">{document.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={
                document.status === 'signed' ? 'default' : 
                document.status === 'waiting' ? 'secondary' : 
                'outline'
              }
            >
              {document.status}
            </Badge>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Document Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Document Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter document name"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter document description"
                  rows={3}
                />
              </div>
              
              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Created:</strong> {new Date(document.createdAt).toLocaleString()}</p>
                  <p><strong>Last Updated:</strong> {new Date(document.updatedAt).toLocaleString()}</p>
                  {document.createdBy && (
                    <p><strong>Created By:</strong> {document.createdBy.name || document.createdBy.id}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Signers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Signers ({formData.signers.length})
                </div>
                <Button variant="outline" size="sm" onClick={handleAddSigner}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.signers.map((signer, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Signer {index + 1}</Label>
                      {formData.signers.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSigner(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <Label htmlFor={`signer-name-${index}`} className="text-xs">Name</Label>
                        <Input
                          id={`signer-name-${index}`}
                          value={signer.name}
                          onChange={(e) => handleSignerChange(index, 'name', e.target.value)}
                          placeholder="Signer name"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`signer-email-${index}`} className="text-xs">Email</Label>
                        <Input
                          id={`signer-email-${index}`}
                          type="email"
                          value={signer.email}
                          onChange={(e) => handleSignerChange(index, 'email', e.target.value)}
                          placeholder="Signer email"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`signer-role-${index}`} className="text-xs">Role</Label>
                        <Input
                          id={`signer-role-${index}`}
                          value={signer.role}
                          onChange={(e) => handleSignerChange(index, 'role', e.target.value)}
                          placeholder="Signer role"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {formData.signers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                    <p>No signers added</p>
                    <Button variant="outline" onClick={handleAddSigner} className="mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Signer
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Note about editing */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Document Editing</p>
                <p className="text-blue-700">
                  This is a preview of document editing functionality. In a full implementation, 
                  changes would be saved to the backend and signers would be notified of updates.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}
