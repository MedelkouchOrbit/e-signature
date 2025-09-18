"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { AuthGuard } from "@/app/components/auth/AuthGuard"
import { PDFViewer } from "@/app/components/documents/PDFViewer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Plus, X, ArrowUp, ArrowDown } from "lucide-react"

interface Signer {
  id: string
  name: string
  email: string
  color: string
  order: number
}

interface TemplateEditData {
  id: string
  name: string
  description: string
  url: string
  note: string
  sendInOrder: boolean
  timeToCompleteDays: number
  allowModifications: boolean
  isEnableOTP: boolean
  notifyOnSignatures: boolean
  signers: Signer[]
}

const SIGNER_COLORS = [
  "#93a3db", "#e8a87c", "#c77dff", "#f72585", 
  "#4cc9f0", "#7209b7", "#f77f00", "#fcbf49"
]

interface SignerData {
  objectId: string
  Name: string
  Email: string
  [key: string]: unknown
}

export default function EditTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [template, setTemplate] = useState<TemplateEditData | null>(null)
  const [activeTab, setActiveTab] = useState("details")

  // Form states
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [note, setNote] = useState("")
  const [sendInOrder, setSendInOrder] = useState(true)
  const [timeToCompleteDays, setTimeToCompleteDays] = useState(15)
  const [allowModifications, setAllowModifications] = useState(false)
  const [isEnableOTP, setIsEnableOTP] = useState(false)
  const [notifyOnSignatures, setNotifyOnSignatures] = useState(true)
  const [signers, setSigners] = useState<Signer[]>([])

  const loadTemplate = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Call getTemplate API with the correct format
      const sessionToken = localStorage.getItem('opensign_session_token')
      const response = await fetch('http://94.249.71.89:9000/api/app/functions/getTemplate', {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'X-Parse-Application-Id': 'opensign',
          'sessiontoken': sessionToken || '',
        },
        body: JSON.stringify({
          templateId: templateId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch template')
      }

      const data = await response.json()
      const templateData = data.result

      // Transform the API response to our format
      const transformedTemplate: TemplateEditData = {
        id: templateData.objectId,
        name: templateData.Name || '',
        description: templateData.Description || '',
        url: templateData.URL || '',
        note: templateData.Note || '',
        sendInOrder: templateData.SendinOrder || false,
        timeToCompleteDays: templateData.TimeToCompleteDays || 15,
        allowModifications: templateData.AllowModifications || false,
        isEnableOTP: templateData.IsEnableOTP || false,
        notifyOnSignatures: templateData.NotifyOnSignatures || true,
        signers: (templateData.Signers || []).map((signer: SignerData, index: number) => ({
          id: signer.objectId,
          name: signer.Name,
          email: signer.Email,
          color: SIGNER_COLORS[index % SIGNER_COLORS.length],
          order: index + 1
        }))
      }

      setTemplate(transformedTemplate)
      setName(transformedTemplate.name)
      setDescription(transformedTemplate.description)
      setNote(transformedTemplate.note)
      setSendInOrder(transformedTemplate.sendInOrder)
      setTimeToCompleteDays(transformedTemplate.timeToCompleteDays)
      setAllowModifications(transformedTemplate.allowModifications)
      setIsEnableOTP(transformedTemplate.isEnableOTP)
      setNotifyOnSignatures(transformedTemplate.notifyOnSignatures)
      setSigners(transformedTemplate.signers)

    } catch (error) {
      console.error('Error loading template:', error)
      toast.error('Failed to load template')
      router.push('/templates')
    } finally {
      setIsLoading(false)
    }
  }, [templateId, router])

  useEffect(() => {
    loadTemplate()
  }, [loadTemplate])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      const sessionToken = localStorage.getItem('opensign_session_token')
      if (!sessionToken) {
        toast.error('No session token found')
        return
      }

      // First, we need to create contacts for new signers
      const processedSigners = []
      
      for (const signer of signers) {
        if (signer.id.startsWith('signer-')) {
          // This is a new signer, we need to create a contact first
          try {
            const contactResponse = await fetch('http://94.249.71.89:9000/api/app/classes/contracts_Contactbook', {
              method: 'POST',
              headers: {
                'Accept': '*/*',
                'Content-Type': 'text/plain',
                'Origin': 'http://94.249.71.89:9000',
              },
              body: JSON.stringify({
                Name: signer.name,
                Email: signer.email,
                _ApplicationId: "opensign",
                _ClientVersion: "js6.1.1",
                _InstallationId: "5b57e02d-5015-4c69-bede-06310ad8bae9",
                _SessionToken: sessionToken
              })
            })
            
            if (contactResponse.ok) {
              const contactResult = await contactResponse.json()
              processedSigners.push({
                __type: "Pointer",
                className: "contracts_Contactbook",
                objectId: contactResult.objectId
              })
            } else {
              console.error('Failed to create contact for signer:', signer.name)
            }
          } catch (error) {
            console.error('Error creating contact:', error)
          }
        } else {
          // Existing signer
          processedSigners.push({
            __type: "Pointer",
            className: "contracts_Contactbook",
            objectId: signer.id
          })
        }
      }

      // Prepare the update data
      const updateData = {
        Name: name,
        Description: description,
        Note: note,
        SendinOrder: sendInOrder,
        TimeToCompleteDays: timeToCompleteDays,
        AllowModifications: allowModifications,
        IsEnableOTP: isEnableOTP,
        NotifyOnSignatures: notifyOnSignatures,
        Signers: processedSigners,
        _ApplicationId: "opensign",
        _ClientVersion: "js6.1.1",
        _InstallationId: "5b57e02d-5015-4c69-bede-06310ad8bae9",
        _SessionToken: sessionToken
      }

      // Update the template using PUT request
      const response = await fetch(`http://94.249.71.89:9000/api/app/classes/contracts_Template/${templateId}`, {
        method: 'PUT',
        headers: {
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Content-Type': 'text/plain',
          'Origin': 'http://94.249.71.89:9000',
          'Pragma': 'no-cache',
          'Referer': 'http://94.249.71.89:9000/form/template',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        throw new Error(`Failed to update template: ${response.status}`)
      }

      const result = await response.json()
      console.log('Template updated successfully:', result)
      
      toast.success('Template updated successfully')
      router.push('/templates')
    } catch (error) {
      console.error('Error updating template:', error)
      toast.error('Failed to update template')
    } finally {
      setIsSaving(false)
    }
  }

  const addSigner = () => {
    const newSigner: Signer = {
      id: `signer-${Date.now()}`,
      name: '',
      email: '',
      color: SIGNER_COLORS[signers.length % SIGNER_COLORS.length],
      order: signers.length + 1
    }
    setSigners([...signers, newSigner])
  }

  const removeSigner = (signerId: string) => {
    setSigners(signers.filter(s => s.id !== signerId))
  }

  const updateSigner = (signerId: string, field: 'name' | 'email', value: string) => {
    setSigners(signers.map(s => 
      s.id === signerId ? { ...s, [field]: value } : s
    ))
  }

  const moveSignerUp = (index: number) => {
    if (index === 0) return
    const newSigners = [...signers]
    ;[newSigners[index], newSigners[index - 1]] = [newSigners[index - 1], newSigners[index]]
    // Update order numbers
    newSigners.forEach((signer, idx) => {
      signer.order = idx + 1
    })
    setSigners(newSigners)
  }

  const moveSignerDown = (index: number) => {
    if (index === signers.length - 1) return
    const newSigners = [...signers]
    ;[newSigners[index], newSigners[index + 1]] = [newSigners[index + 1], newSigners[index]]
    // Update order numbers
    newSigners.forEach((signer, idx) => {
      signer.order = idx + 1
    })
    setSigners(newSigners)
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="p-8 mx-auto max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#47a3ad]"></div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!template) {
    return (
      <AuthGuard>
        <div className="p-8 mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-red-600">Template not found</p>
            <Button onClick={() => router.push('/templates')} className="mt-4">
              Back to Templates
            </Button>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="p-8 mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/templates')}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Edit Template
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Modify template settings and signers
              </p>
            </div>
          </div>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#47a3ad] hover:bg-[#3a8892] text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Template Details</TabsTrigger>
            <TabsTrigger value="signers">Signers</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Template Details Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Template Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter template name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter template description"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="note">Signing Note</Label>
                    <Textarea
                      id="note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Note for signers"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="days">Days to Complete</Label>
                    <Input
                      id="days"
                      type="number"
                      value={timeToCompleteDays}
                      onChange={(e) => setTimeToCompleteDays(Number(e.target.value))}
                      min={1}
                      max={365}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="sendInOrder"
                        checked={sendInOrder}
                        onChange={(e) => setSendInOrder(e.target.checked)}
                        className="border-gray-300 rounded"
                      />
                      <Label htmlFor="sendInOrder">Send in Order</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="allowModifications"
                        checked={allowModifications}
                        onChange={(e) => setAllowModifications(e.target.checked)}
                        className="border-gray-300 rounded"
                      />
                      <Label htmlFor="allowModifications">Allow Modifications</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isEnableOTP"
                        checked={isEnableOTP}
                        onChange={(e) => setIsEnableOTP(e.target.checked)}
                        className="border-gray-300 rounded"
                      />
                      <Label htmlFor="isEnableOTP">Enable OTP</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="notifyOnSignatures"
                        checked={notifyOnSignatures}
                        onChange={(e) => setNotifyOnSignatures(e.target.checked)}
                        className="border-gray-300 rounded"
                      />
                      <Label htmlFor="notifyOnSignatures">Notify on Signatures</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* PDF Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Document Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[500px] border rounded">
                    <PDFViewer fileUrl={template.url} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="signers" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Signers</CardTitle>
                <Button onClick={addSigner} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Signer
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {signers.map((signer, index) => (
                    <div
                      key={signer.id}
                      className="flex items-center p-4 space-x-4 border rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      <div className="flex flex-col space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveSignerUp(index)}
                          disabled={index === 0}
                          className="w-6 h-6 p-0"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveSignerDown(index)}
                          disabled={index === signers.length - 1}
                          className="w-6 h-6 p-0"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <Badge 
                        style={{ backgroundColor: signer.color }}
                        className="text-white min-w-[30px] h-6 flex items-center justify-center"
                      >
                        {index + 1}
                      </Badge>

                      <div className="grid flex-1 grid-cols-2 gap-4">
                        <Input
                          placeholder="Signer name"
                          value={signer.name}
                          onChange={(e) => updateSigner(signer.id, 'name', e.target.value)}
                        />
                        <Input
                          placeholder="Signer email"
                          type="email"
                          value={signer.email}
                          onChange={(e) => updateSigner(signer.id, 'email', e.target.value)}
                        />
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSigner(signer.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  {signers.length === 0 && (
                    <div className="py-8 text-center text-gray-500">
                      No signers added yet. Click &quot;Add Signer&quot; to get started.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  )
}