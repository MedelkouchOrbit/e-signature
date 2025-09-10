"use client"

import { useState, useEffect, useCallback } from "react"
import { AuthGuard } from "@/app/components/auth/AuthGuard"
import { useBulkSendStore } from "@/app/lib/bulk-send-store"
import { bulkSendApiService } from "@/app/lib/bulk-send-api-service"
import { templatesApiService, type OpenSignTeamMember } from "@/app/lib/templates-api-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, ArrowLeft, Send, Users, Check, FileText, Search, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Template {
  id: string
  name: string
  description?: string
}

interface Signer {
  id: string
  name: string
  email: string
  role: string
  order: number
}

export default function CreateBulkSendPage() {
  const router = useRouter()
  const { addBulkSend, setLoading } = useBulkSendStore()
  
  // Tab navigation
  const [activeTab, setActiveTab] = useState("template")
  
  const [templates, setTemplates] = useState<Template[]>([])
  const [teamMembers, setTeamMembers] = useState<OpenSignTeamMember[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false)
  
  // Form state
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [bulkSendName, setBulkSendName] = useState("")
  const [signers, setSigners] = useState<Signer[]>([])
  const [sendInOrder, setSendInOrder] = useState(true)
  const [message, setMessage] = useState("")
  
  // Team member search and selection
  const [memberSearch, setMemberSearch] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  
  // New signer form state (removed manual add functionality)
  // const [newSignerName, setNewSignerName] = useState("")
  // const [newSignerEmail, setNewSignerEmail] = useState("")
  // const [newSignerRole, setNewSignerRole] = useState("signer")
  // const [isAddingToBackend, setIsAddingToBackend] = useState(false)
  
  // Validation state
  // const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load templates from contracts_Template class
  const loadTemplates = useCallback(async () => {
    try {
      setLoadingTemplates(true)
      const response = await templatesApiService.getTemplates()
      
      // Check if we got a valid response
      if (!response || !response.results) {
        console.warn('Templates API returned invalid response, using empty list')
        setTemplates([])
        return
      }
      
      // Get existing bulk sends to filter out already used templates
      const existingBulkSends = await bulkSendApiService.getBulkSends()
      const usedTemplateIds = new Set(existingBulkSends.map(bs => bs.templateId))
      
      // Filter out templates that are already used in bulk sends
      const availableTemplates = response.results.filter(t => !usedTemplateIds.has(t.id))
      
      setTemplates(availableTemplates.map(t => ({ 
        id: t.id, 
        name: t.name,
        description: t.description 
      })))
    } catch (error) {
      console.error('Error loading templates:', error)
      setTemplates([]) // Set empty array to prevent undefined errors
      toast.error('Failed to load templates. Please check your connection and try again.')
    } finally {
      setLoadingTemplates(false)
    }
  }, [])

  // Load team members from contracts_Users class via OpenSign API
  const loadTeamMembers = useCallback(async () => {
    try {
      setLoadingTeamMembers(true)
      console.log('🔄 Loading team members from OpenSign API...')
      
      // Force set the working session token
      const { openSignApiService } = await import("@/app/lib/api-service")
      const workingToken = 'r:af90807d45364664e3707e4fe9a1a99c'
      openSignApiService.setSessionToken(workingToken)
      console.log('🔑 Set working session token for bulk send:', workingToken)
      
      // Try to get organization members first
      let teamMembers: OpenSignTeamMember[] = []
      
      try {
        // First get teams to extract organization ID
        console.log('🔍 Getting teams to find organization ID...')
        const teamsResponse = await openSignApiService.post("functions/getteams", {
          active: true
        }) as {
          result?: Array<{
            OrganizationId?: { objectId: string }
          }>
          error?: string
        }
        
        if (teamsResponse.result && teamsResponse.result.length > 0 && teamsResponse.result[0].OrganizationId) {
          const organizationId = teamsResponse.result[0].OrganizationId.objectId
          console.log('🏢 Found organization ID:', organizationId)
          
          // Get organization members
          console.log('👥 Getting organization members...')
          const membersResponse = await openSignApiService.post("functions/getuserlistbyorg", {
            organizationId
          }) as {
            result?: Array<{
              objectId: string
              Name?: string
              Email?: string
              UserRole?: string
              UserId?: { name?: string, email?: string }
            }>
            error?: string
          }
          
          if (membersResponse.result) {
            teamMembers = membersResponse.result.map(member => ({
              objectId: member.objectId,
              Name: member.Name || 
                   (member.UserId?.name) || 
                   'Unknown User',
              Email: member.Email || 
                    (member.UserId?.email) || 
                    'unknown@example.com',
              UserRole: member.UserRole || 'User',
              IsDisabled: false,
              TeamIds: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }))
            console.log(`✅ Loaded ${teamMembers.length} organization members`)
          }
        }
      } catch (orgError) {
        console.warn('⚠️ Organization members fetch failed:', orgError)
      }
      
      // Fallback: Use getsigners to get contacts
      if (teamMembers.length === 0) {
        console.log('🔄 Falling back to getsigners...')
        const signersResponse = await openSignApiService.post("functions/getsigners", {
          search: ''
        }) as {
          result?: Array<{
            objectId: string
            Name: string
            Email: string
            UserRole?: string
          }>
          error?: string
        }
        
        if (signersResponse.result) {
          teamMembers = signersResponse.result
            .filter(contact => contact.Email && contact.Name)
            .map(contact => ({
              objectId: contact.objectId,
              Name: contact.Name,
              Email: contact.Email,
              UserRole: contact.UserRole || 'User',
              IsDisabled: false,
              TeamIds: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }))
          console.log(`✅ Loaded ${teamMembers.length} contacts from getsigners`)
        }
      }
      
      setTeamMembers(teamMembers)
      console.log(`✅ Total team members available for assignment: ${teamMembers.length}`)
      
    } catch (error) {
      console.error('❌ Error loading team members:', error)
      toast.error('Failed to load team members')
      setTeamMembers([]) // Set empty array on error
    } finally {
      setLoadingTeamMembers(false)
    }
  }, [])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  useEffect(() => {
    if (activeTab === "assignees") {
      loadTeamMembers()
    }
  }, [activeTab, loadTeamMembers])

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId)
    const template = templates.find(t => t.id === templateId)
    setSelectedTemplate(template || null)
    
    if (template && !bulkSendName) {
      setBulkSendName(`Bulk Send - ${template.name}`)
    }
  }

  // Navigate to next tab
  const goToNextTab = () => {
    if (activeTab === "template" && selectedTemplateId) {
      setActiveTab("assignees")
    } else if (activeTab === "assignees" && signers.length > 0) {
      setActiveTab("review")
    }
  }

  // Add team member to signers
  const addMemberAsSigner = (member: OpenSignTeamMember) => {
    if (signers.some(s => s.email === member.Email)) {
      toast.error("Team member already added as signer")
      return
    }

    const newSigner: Signer = {
      id: `signer-${Date.now()}-${member.objectId}`,
      name: member.Name,
      email: member.Email,
      role: "signer",
      order: signers.length + 1
    }
    
    setSigners([...signers, newSigner])
    setSelectedMembers(new Set([...selectedMembers, member.objectId]))
    toast.success(`${member.Name} added as signer`)
  }

  // Remove team member from signers
  const removeMemberFromSigners = (memberId: string) => {
    const member = teamMembers.find(m => m.objectId === memberId)
    if (member) {
      setSigners(signers.filter(s => s.email !== member.Email))
      setSelectedMembers(new Set([...selectedMembers].filter(id => id !== memberId)))
    }
  }

  // Filter team members based on search
  const filteredMembers = teamMembers.filter(member =>
    member.Name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    member.Email.toLowerCase().includes(memberSearch.toLowerCase()) ||
    (member.Company && member.Company.toLowerCase().includes(memberSearch.toLowerCase()))
  )

  // Remove signer
  const handleRemoveSigner = (signerId: string) => {
    const updatedSigners = signers
      .filter(s => s.id !== signerId)
      .map((s, index) => ({ ...s, order: index + 1 }))
    setSigners(updatedSigners)
  }

  // Generate initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Generate random color for avatar
  const getAvatarColor = (email: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500'
    ]
    const index = email.charCodeAt(0) % colors.length
    return colors[index]
  }

  // Submit form - Creates multiple contracts_Document instances via batchdocuments
  const handleSubmit = async () => {
    if (signers.length === 0) {
      toast.error("Please add at least one signer")
      return
    }
    
    if (!selectedTemplateId) {
      toast.error("Please select a template")
      return
    }
    
    if (!bulkSendName.trim()) {
      toast.error("Please enter a name for this bulk send")
      return
    }
    
    try {
      setIsSubmitting(true)
      setLoading(true)
      
      const bulkSendData = {
        templateId: selectedTemplateId,
        name: bulkSendName.trim(),
        signers: signers.map(s => ({
          name: s.name,
          email: s.email,
          role: s.role,
          order: s.order
        })),
        sendInOrder,
        message: message.trim() || undefined
      }
      
      // Clear any existing toasts and create bulk send
      toast.dismiss() // Clear any existing toasts
      const loadingToastId = toast.loading("Creating documents using OpenSign's batchdocuments function...")
      
      try {
        const newBulkSend = await bulkSendApiService.createBulkSend(bulkSendData)
        addBulkSend(newBulkSend)
        
        toast.dismiss(loadingToastId)
        toast.success(`🎉 Bulk send "${bulkSendName}" created successfully! ${signers.length} documents created.`)
        router.push("/bulk-send")
      } catch (bulkSendError) {
        toast.dismiss(loadingToastId)
        throw bulkSendError // Re-throw to be caught by outer catch
      }
    } catch (error) {
      console.error('Error creating bulk send:', error)
      toast.error("Failed to create bulk send. Please try again.")
    } finally {
      setIsSubmitting(false)
      setLoading(false)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Bulk Send - {selectedTemplate?.name || "Select Template"}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Create multiple documents from template • {signers.length} signers added
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>

        <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="template" disabled={false}>
                1. Select Template
              </TabsTrigger>
              <TabsTrigger value="assignees" disabled={!selectedTemplateId}>
                2. Add Signers
              </TabsTrigger>
              <TabsTrigger value="review" disabled={signers.length === 0}>
                3. Review & Send
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Template Selection */}
            <TabsContent value="template" className="mt-6">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <h3 className="mb-4 text-lg font-medium text-gray-900">Choose Template</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="template" className="text-sm font-medium text-gray-900">
                        Template (contracts_Template)
                      </Label>
                      <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder={loadingTemplates ? "Loading templates..." : "Select a template"} />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {templates.length === 0 && !loadingTemplates && (
                        <p className="mt-1 text-xs text-yellow-600">
                          No available templates found. All templates may already be used in existing bulk sends.
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="name" className="text-sm font-medium text-gray-900">
                        Bulk Send Name
                      </Label>
                      <Input
                        id="name"
                        value={bulkSendName}
                        onChange={(e) => setBulkSendName(e.target.value)}
                        placeholder="Enter a name for this bulk send"
                        className="mt-1"
                      />
                    </div>

                    <Button
                      onClick={goToNextTab}
                      disabled={!selectedTemplateId || !bulkSendName.trim()}
                      className="w-full text-white bg-green-600 hover:bg-green-700"
                    >
                      Continue to Add Signers
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>

                {selectedTemplate && (
                  <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex items-center mb-4 space-x-3">
                      <FileText className="w-8 h-8 text-blue-500" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{selectedTemplate.name}</h3>
                        <p className="text-sm text-gray-500">
                          {selectedTemplate.description || "Template selected for bulk sending"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4 text-sm leading-relaxed text-gray-700">
                      <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                        <h4 className="mb-2 font-medium text-green-700">How Bulk Send Works with OpenSign</h4>
                        <ul className="space-y-2 text-green-600">
                          <li className="flex items-start space-x-2">
                            <div className="flex-shrink-0 w-2 h-2 mt-2 bg-green-500 rounded-full"></div>
                            <span>Uses existing <code className="px-1 bg-green-100 rounded">contracts_Template</code> class</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <div className="flex-shrink-0 w-2 h-2 mt-2 bg-green-500 rounded-full"></div>
                            <span>Creates multiple <code className="px-1 bg-green-100 rounded">contracts_Document</code> instances</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <div className="flex-shrink-0 w-2 h-2 mt-2 bg-green-500 rounded-full"></div>
                            <span>Uses OpenSign&apos;s <code className="px-1 bg-green-100 rounded">batchdocuments</code> function</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <div className="flex-shrink-0 w-2 h-2 mt-2 bg-green-500 rounded-full"></div>
                            <span>No custom backend classes needed - leverages existing infrastructure</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tab 2: Add Signers */}
            <TabsContent value="assignees" className="mt-6">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Contacts List */}
                <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Add Signers from Team</h3>
                    <span className="text-sm text-gray-500">{signers.length} selected</span>
                  </div>

                  {/* Search */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                      <Input
                        placeholder="Search team members..."
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Team Members List */}
                  <div className="space-y-2 overflow-y-auto max-h-96">
                    {loadingTeamMembers ? (
                      <div className="py-8 text-center">
                        <div className="w-8 h-8 mx-auto border-b-2 border-green-600 rounded-full animate-spin"></div>
                        <p className="mt-2 text-sm text-gray-500">Loading team members...</p>
                      </div>
                    ) : filteredMembers.length === 0 ? (
                      <div className="py-8 text-center">
                        <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm text-gray-500">No team members found</p>
                      </div>
                    ) : (
                      filteredMembers.map((member) => {
                        const isSelected = selectedMembers.has(member.objectId)
                        return (
                          <div
                            key={member.objectId}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-gray-50 ${
                              isSelected ? 'bg-green-50 border-green-300' : 'border-gray-200'
                            }`}
                            onClick={() => {
                              if (isSelected) {
                                removeMemberFromSigners(member.objectId)
                              } else {
                                addMemberAsSigner(member)
                              }
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-full ${getAvatarColor(member.Email)} flex items-center justify-center text-white text-sm font-medium`}>
                                {getInitials(member.Name)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{member.Name}</p>
                                <p className="text-sm text-gray-500">{member.Email}</p>
                                {member.Company && (
                                  <p className="text-xs text-gray-400">{member.Company}</p>
                                )}
                                {member.UserRole && (
                                  <p className="text-xs text-green-600">{member.UserRole}</p>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* Selected Signers */}
                <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Order of Signers</h3>
                    <span className="text-sm text-gray-500">{signers.length} signers</span>
                  </div>

                  {signers.length === 0 ? (
                    <div className="py-8 text-center">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm text-gray-500">No signers added yet</p>
                      <p className="text-xs text-gray-400">Select contacts from the left to add signers</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {signers.map((signer, index) => (
                        <div key={signer.id} className="flex items-center p-3 space-x-3 rounded-lg bg-gray-50">
                          <div className="flex items-center justify-center w-6 h-6 text-xs font-medium text-white bg-green-600 rounded-full">
                            {index + 1}
                          </div>
                          <div className={`w-8 h-8 rounded-full ${getAvatarColor(signer.email)} flex items-center justify-center text-white text-xs font-medium`}>
                            {getInitials(signer.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{signer.name}</p>
                            <p className="text-xs text-gray-500 truncate">{signer.email}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSigner(signer.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {signers.length > 0 && (
                    <div className="pt-6 mt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium text-gray-900">Send in Order</Label>
                          <p className="text-xs text-gray-500">Send documents sequentially</p>
                        </div>
                        <Button
                          variant={sendInOrder ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSendInOrder(!sendInOrder)}
                          className={sendInOrder ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                        >
                          {sendInOrder ? "Sequential" : "Parallel"}
                        </Button>
                      </div>

                      <Button
                        onClick={goToNextTab}
                        disabled={signers.length === 0}
                        className="w-full mt-4 text-white bg-green-600 hover:bg-green-700"
                      >
                        Continue to Review
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tab 3: Review & Send */}
            <TabsContent value="review" className="mt-6">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <h3 className="mb-4 text-lg font-medium text-gray-900">Review Details</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-900">Template</Label>
                      <p className="text-sm text-gray-600">{selectedTemplate?.name}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-900">Bulk Send Name</Label>
                      <p className="text-sm text-gray-600">{bulkSendName}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-900">Number of Documents</Label>
                      <p className="text-sm text-gray-600">{signers.length} documents will be created</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-900">Send Order</Label>
                      <p className="text-sm text-gray-600">{sendInOrder ? "Sequential" : "Parallel"}</p>
                    </div>

                    <div>
                      <Label htmlFor="message" className="text-sm font-medium text-gray-900">
                        Optional Message
                      </Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Add a message for all recipients..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <h3 className="mb-4 text-lg font-medium text-gray-900">Signers List</h3>
                  
                  <div className="space-y-2 overflow-y-auto max-h-64">
                    {signers.map((signer, index) => (
                      <div key={signer.id} className="flex items-center p-3 space-x-3 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-center w-6 h-6 text-xs font-medium text-white bg-green-600 rounded-full">
                          {index + 1}
                        </div>
                        <div className={`w-8 h-8 rounded-full ${getAvatarColor(signer.email)} flex items-center justify-center text-white text-xs font-medium`}>
                          {getInitials(signer.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{signer.name}</p>
                          <p className="text-xs text-gray-500 truncate">{signer.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex mt-6 space-x-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setActiveTab("assignees")}
                    >
                      Back to Edit
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || signers.length === 0}
                      className="flex-1 text-white bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-b-2 border-white rounded-full animate-spin"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Create Bulk Send
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  )
}
