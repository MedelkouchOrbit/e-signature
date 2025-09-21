"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { AuthGuard } from "@/app/components/auth/AuthGuard"
import { bulkSendApiService } from "@/app/lib/bulk-send-api-service"
import { teamsApiService, type OpenSignTeamMember } from "@/app/lib/templates-api-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Users, Check, X } from "lucide-react"
import { toast } from "sonner"
import type { OpenSignDocument, OpenSignDocumentsResponse, OpenSignPlaceholder, OpenSignSigner, OpenSignApiResponse } from "@/types/shared"

interface Signer {
  id: string
  name: string
  email: string
  role: string
  order: number
  status?: string
  documentId?: string
}

export default function EditBulkSendPage() {
  const params = useParams()
  const router = useRouter()
  const bulkSendId = params.id as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [bulkSendData, setBulkSendData] = useState<{
    id: string
    name: string
    templateName: string
    status: 'draft' | 'sending' | 'completed' | 'failed'
    totalRecipients: number
    completedCount: number
    createdAt: string
    sentAt?: string
    completedAt?: string
    message?: string
    sendInOrder: boolean
    documents: Array<{
      id: string
      recipientName: string
      recipientEmail: string
      status: 'pending' | 'sent' | 'viewed' | 'signed' | 'completed' | 'declined' | 'expired'
      sentAt?: string
      viewedAt?: string
      signedAt?: string
      completedAt?: string
      order: number
    }>
  } | null>(null)
  const [signers, setSigners] = useState<Signer[]>([])
  const [teamMembers, setTeamMembers] = useState<OpenSignTeamMember[]>([])
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false)
  const [memberSearch, setMemberSearch] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())

  // Load bulk send details
  const loadBulkSendDetails = useCallback(async () => {
    try {
      setIsLoading(true)
      const details = await bulkSendApiService.getBulkSendDetails(bulkSendId)
      if (!details) {
        toast.error('Bulk send not found')
        router.back()
        return
      }
      
      setBulkSendData(details)
      
      // Convert documents to signers format
      const convertedSigners: Signer[] = details.documents.map((doc, index) => ({
        id: doc.id,
        name: doc.recipientName,
        email: doc.recipientEmail,
        role: "signer",
        order: doc.order || index + 1,
        status: doc.status,
        documentId: doc.id
      }))
      
      setSigners(convertedSigners)
    } catch (error) {
      console.error('Error loading bulk send details:', error)
      toast.error('Failed to load bulk send details')
      router.back()
    } finally {
      setIsLoading(false)
    }
  }, [bulkSendId, router])

  // Load team members
  const loadTeamMembers = useCallback(async () => {
    try {
      setLoadingTeamMembers(true)
      const fetchedTeamMembers = await teamsApiService.getTeamMembers()
      setTeamMembers(fetchedTeamMembers)
      
      // Mark existing signers as selected
      const existingSignerEmails = new Set(signers.map(s => s.email))
      const selectedMemberIds = new Set(
        fetchedTeamMembers
          .filter(member => existingSignerEmails.has(member.Email))
          .map(member => member.objectId)
      )
      setSelectedMembers(selectedMemberIds)
    } catch (error) {
      console.error('Error loading team members:', error)
      toast.error('Failed to load team members')
      setTeamMembers([])
    } finally {
      setLoadingTeamMembers(false)
    }
  }, [signers])

  useEffect(() => {
    loadBulkSendDetails()
  }, [loadBulkSendDetails])

  useEffect(() => {
    if (signers.length > 0) {
      loadTeamMembers()
    }
  }, [signers, loadTeamMembers])

  // Add team member to signers - Actually assign to documents immediately
  const addMemberAsSigner = async (member: OpenSignTeamMember) => {
    if (signers.some(s => s.email === member.Email)) {
      toast.error("Team member already added as signer")
      return
    }

    try {
      // Show loading state
      const tempSignerId = `temp-${Date.now()}-${member.objectId}`
      const tempSigner: Signer = {
        id: tempSignerId,
        name: member.Name,
        email: member.Email,
        role: "signer",
        order: signers.length + 1,
        status: "assigning"
      }
      
      setSigners([...signers, tempSigner])
      setSelectedMembers(new Set([...selectedMembers, member.objectId]))

      // Get all bulk send documents that need this signer
      const { openSignApiService } = await import("@/app/lib/api-service")
      const documentsResponse = await openSignApiService.get('classes/contracts_Document?include=Placeholders,Signers&limit=1000') as OpenSignDocumentsResponse
      const documents = documentsResponse?.results || []
      
      console.log(`📋 Found ${documents.length} total documents`)
      
      // Filter to bulk send documents that need this signer
      const bulkSendDocs = documents.filter((doc: OpenSignDocument) => {
        const isBulkSend = doc.Name?.includes('Bulk Send:')
        const hasPlaceholders = doc.Placeholders && doc.Placeholders.length > 0
        
        // Log placeholder details for debugging
        if (isBulkSend && hasPlaceholders) {
          console.log(`🔍 Checking placeholders for document: ${doc.Name}`)
          doc.Placeholders?.forEach((p: OpenSignPlaceholder, index: number) => {
            console.log(`  Placeholder ${index}: email="${p.email}" signerObjId="${p.signerObjId}" (looking for: ${member.Email})`)
          })
        }
        
        const needsSigner = doc.Placeholders?.some((p: OpenSignPlaceholder) => {
          const emailMatch = p.email === member.Email
          const noSignerAssigned = (!p.signerObjId || p.signerObjId === '')
          console.log(`    Email match: ${emailMatch}, No signer: ${noSignerAssigned}`)
          return emailMatch && noSignerAssigned
        })
        
        console.log(`📄 Doc: ${doc.Name} | BulkSend: ${isBulkSend} | HasPlaceholders: ${hasPlaceholders} | NeedsSigner: ${needsSigner}`)
        
        return isBulkSend && hasPlaceholders && needsSigner
      })

      console.log(`🎯 Found ${bulkSendDocs.length} bulk send documents that need signer ${member.Email}`)

      // If no documents found, also try to find documents with empty placeholders we can assign to
      let fallbackDocs: OpenSignDocument[] = []
      if (bulkSendDocs.length === 0) {
        fallbackDocs = documents.filter((doc: OpenSignDocument) => {
          const isBulkSend = doc.Name?.includes('Bulk Send:')
          const hasPlaceholders = doc.Placeholders && doc.Placeholders.length > 0
          const hasEmptyPlaceholder = doc.Placeholders?.some((p: OpenSignPlaceholder) => 
            !p.email || p.email === '' || (!p.signerObjId || p.signerObjId === '')
          )
          
          if (isBulkSend && hasPlaceholders) {
            console.log(`🔄 Checking fallback for: ${doc.Name} - Has empty placeholder: ${hasEmptyPlaceholder}`)
          }
          
          return isBulkSend && hasPlaceholders && hasEmptyPlaceholder
        })
        
        console.log(`🔄 Found ${fallbackDocs.length} fallback documents with empty placeholders`)
      }

      const documentsToProcess = bulkSendDocs.length > 0 ? bulkSendDocs : fallbackDocs

      if (documentsToProcess.length === 0) {
        // Check if we should create a test bulk send document
        console.log('❓ No bulk send documents found. Available documents:')
        documents.slice(0, 3).forEach((doc: OpenSignDocument) => {
          console.log(`  - ${doc.objectId}: ${doc.Name} (Placeholders: ${doc.Placeholders?.length || 0})`)
        })
        
        // Remove temp signer and show error
        setSigners(prev => prev.filter(s => s.id !== tempSignerId))
        setSelectedMembers(prev => new Set([...prev].filter(id => id !== member.objectId)))
        toast.error(`No bulk send documents found for ${member.Email}. Check console for details.`)
        return
      }

      // Directly create contact and update documents with PUT requests
      let successCount = 0
      for (const doc of documentsToProcess) {
        try {
          console.log(`🔄 Assigning ${member.Email} to document ${doc.objectId}...`)
          
          // Step 1: Create contact in contracts_Contactbook
          const contactResponse = await openSignApiService.post('classes/contracts_Contactbook', {
            Name: member.Name,
            Email: member.Email,
            Phone: '' // Default phone
          }) as { objectId: string }

          if (!contactResponse?.objectId) {
            throw new Error('Failed to create contact')
          }

          const contactId = contactResponse.objectId
          console.log(`📝 Created contact: ${contactId}`)

          // Step 2: Update document placeholders with signerObjId
          const currentPlaceholders = doc.Placeholders || []
          const updatedPlaceholders = currentPlaceholders.map((placeholder: OpenSignPlaceholder) => {
            // Match by email OR use the first empty placeholder
            const isTargetPlaceholder = 
              (placeholder.email === member.Email && (!placeholder.signerObjId || placeholder.signerObjId === '')) ||
              (!placeholder.email || placeholder.email === '' || (!placeholder.signerObjId || placeholder.signerObjId === ''))
            
            if (isTargetPlaceholder) {
              console.log(`📝 Updating placeholder: ${placeholder.email || 'empty'} -> ${member.Email}`)
              return {
                ...placeholder,
                email: member.Email, // Set email if it was empty
                signerObjId: contactId,
                signerPtr: {
                  __type: 'Pointer',
                  className: 'contracts_Contactbook',
                  objectId: contactId
                }
              }
            }
            return placeholder
          })

          // Step 3: Add contact pointer to signers array
          const currentSigners = doc.Signers || []
          const newSignerPointer = {
            __type: 'Pointer',
            className: 'contracts_Contactbook',
            objectId: contactId
          }
          const updatedSigners = [...currentSigners, newSignerPointer]

          // Step 4: PUT the updated document
          console.log(`📤 Updating document ${doc.objectId} with placeholders and signers...`)
          await openSignApiService.put(`classes/contracts_Document/${doc.objectId}`, {
            Placeholders: updatedPlaceholders,
            Signers: updatedSigners
          })
          
          console.log(`✅ Successfully assigned ${member.Email} to document ${doc.objectId}`)
          successCount++
        } catch (error) {
          console.error(`❌ Failed to assign ${member.Email} to ${doc.objectId}:`, error)
        }
      }

      // Update the temporary signer to final state
      const finalSigner: Signer = {
        id: `signer-${Date.now()}-${member.objectId}`,
        name: member.Name,
        email: member.Email,
        role: "signer",
        order: signers.length + 1,
        status: successCount > 0 ? "assigned" : "failed"
      }
      
      setSigners(prev => prev.map(s => s.id === tempSignerId ? finalSigner : s))

      if (successCount > 0) {
        toast.success(`✅ ${member.Name} assigned to ${successCount} document(s)!`)
      } else {
        toast.error(`❌ Failed to assign ${member.Name} to documents`)
      }

    } catch (error) {
      console.error('Error adding member as signer:', error)
      // Remove failed assignment
      setSigners(prev => prev.filter(s => s.email !== member.Email))
      setSelectedMembers(prev => new Set([...prev].filter(id => id !== member.objectId)))
      toast.error(`Failed to assign ${member.Name}`)
    }
  }

  // Remove team member from signers - Actually remove from documents
  const removeMemberFromSigners = async (memberId: string) => {
    const member = teamMembers.find(m => m.objectId === memberId)
    if (!member) return

    try {
      // Show loading state for the member being removed
      const signerToUpdate = signers.find(s => s.email === member.Email)
      if (signerToUpdate) {
        setSigners(prev => prev.map(s => 
          s.email === member.Email ? { ...s, status: "removing" } : s
        ))
      }

      // Get all bulk send documents that have this signer
      const { openSignApiService } = await import("@/app/lib/api-service")
      const documentsResponse = await openSignApiService.get('classes/contracts_Document?include=Placeholders,Signers&limit=1000') as OpenSignApiResponse<OpenSignDocument>
      const documents = documentsResponse?.results || []
      
      // Filter to bulk send documents that have this signer assigned
      const bulkSendDocs = documents.filter((doc: OpenSignDocument) => 
        doc.Name?.includes('Bulk Send:') && 
        doc.Placeholders && doc.Placeholders.length > 0 &&
        doc.Placeholders.some((p: OpenSignPlaceholder) => 
          p.email === member.Email && p.signerObjId && p.signerObjId !== ''
        )
      )

      if (bulkSendDocs.length === 0) {
        // Just remove from local state if no documents found
        setSigners(prev => prev.filter(s => s.email !== member.Email))
        setSelectedMembers(prev => new Set([...prev].filter(id => id !== memberId)))
        toast.success(`${member.Name} removed from signers`)
        return
      }

      // Remove signer from each document
      let successCount = 0
      for (const doc of bulkSendDocs) {
        try {
          // Find the placeholder with this signer's email
          const placeholderIndex = doc.Placeholders?.findIndex((p: OpenSignPlaceholder) => p.email === member.Email) ?? -1
          
          if (placeholderIndex !== -1 && doc.Placeholders) {
            // Clear the signer assignment from placeholder
            const updatedPlaceholders = [...doc.Placeholders]
            updatedPlaceholders[placeholderIndex] = {
              ...updatedPlaceholders[placeholderIndex],
              signerObjId: '',
              signerPtr: undefined
            }

            // Update the document
            await openSignApiService.put(`classes/contracts_Document/${doc.objectId}`, {
              Placeholders: updatedPlaceholders
            })

            // Also remove from Signers array if present
            if (doc.Signers && doc.Signers.length > 0) {
              const updatedSigners = doc.Signers.filter((s: OpenSignSigner) => s.Email !== member.Email)
              await openSignApiService.put(`classes/contracts_Document/${doc.objectId}`, {
                Signers: updatedSigners
              })
            }

            successCount++
          }
        } catch (error) {
          console.error(`Failed to remove ${member.Email} from ${doc.objectId}:`, error)
        }
      }

      // Update local state
      setSigners(prev => prev.filter(s => s.email !== member.Email))
      setSelectedMembers(prev => new Set([...prev].filter(id => id !== memberId)))

      if (successCount > 0) {
        toast.success(`✅ ${member.Name} removed from ${successCount} document(s)!`)
      } else {
        toast.error(`❌ Failed to remove ${member.Name} from documents`)
      }

    } catch (error) {
      console.error('Error removing member from signers:', error)
      // Reset status on error
      setSigners(prev => prev.map(s => 
        s.email === member.Email ? { ...s, status: "assigned" } : s
      ))
      toast.error(`Failed to remove ${member.Name}`)
    }
  }

  // Remove signer - Actually remove from documents
  const handleRemoveSigner = async (signerId: string) => {
    const signerToRemove = signers.find(s => s.id === signerId)
    if (!signerToRemove) return

    try {
      // Show loading state
      setSigners(prev => prev.map(s => 
        s.id === signerId ? { ...s, status: "removing" } : s
      ))

      // Get all bulk send documents that have this signer
      const { openSignApiService } = await import("@/app/lib/api-service")
      const documentsResponse = await openSignApiService.get('classes/contracts_Document?include=Placeholders,Signers&limit=1000') as OpenSignApiResponse<OpenSignDocument>
      const documents = documentsResponse?.results || []
      
      // Filter to bulk send documents that have this signer assigned
      const bulkSendDocs = documents.filter((doc: OpenSignDocument) => 
        doc.Name?.includes('Bulk Send:') && 
        doc.Placeholders && doc.Placeholders.length > 0 &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        doc.Placeholders.some((p: any) => 
          p.email === signerToRemove.email && p.signerObjId && p.signerObjId !== ''
        )
      )

      // Remove signer from each document
      let successCount = 0
      for (const doc of bulkSendDocs) {
        try {
          // Find the placeholder with this signer's email
          const placeholderIndex = doc.Placeholders?.findIndex((p: OpenSignPlaceholder) => p.email === signerToRemove.email) ?? -1
          
          if (placeholderIndex !== -1 && doc.Placeholders) {
            // Clear the signer assignment from placeholder
            const updatedPlaceholders = [...doc.Placeholders]
            updatedPlaceholders[placeholderIndex] = {
              ...updatedPlaceholders[placeholderIndex],
              signerObjId: '',
              signerPtr: undefined
            }

            // Update the document
            await openSignApiService.put(`classes/contracts_Document/${doc.objectId}`, {
              Placeholders: updatedPlaceholders
            })

            // Also remove from Signers array if present
            if (doc.Signers && doc.Signers.length > 0) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const updatedSigners = doc.Signers.filter((s: any) => s.Email !== signerToRemove.email)
              await openSignApiService.put(`classes/contracts_Document/${doc.objectId}`, {
                Signers: updatedSigners
              })
            }

            successCount++
          }
        } catch (error) {
          console.error(`Failed to remove ${signerToRemove.email} from ${doc.objectId}:`, error)
        }
      }

      // Update local state - remove signer and reorder
      const updatedSigners = signers
        .filter(s => s.id !== signerId)
        .map((s, index) => ({ ...s, order: index + 1 }))
      setSigners(updatedSigners)
      
      // Also remove from selected members
      const member = teamMembers.find(m => m.Email === signerToRemove.email)
      if (member) {
        setSelectedMembers(prev => new Set([...prev].filter(id => id !== member.objectId)))
      }

      if (successCount > 0) {
        toast.success(`✅ ${signerToRemove.name} removed from ${successCount} document(s)!`)
      } else {
        toast.success(`${signerToRemove.name} removed from signers`)
      }

    } catch (error) {
      console.error('Error removing signer:', error)
      // Reset status on error
      setSigners(prev => prev.map(s => 
        s.id === signerId ? { ...s, status: "assigned" } : s
      ))
      toast.error(`Failed to remove ${signerToRemove.name}`)
    }
  }

  // Filter team members based on search
  const filteredMembers = teamMembers.filter(member =>
    member.Name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    member.Email.toLowerCase().includes(memberSearch.toLowerCase()) ||
    (member.Company && member.Company.toLowerCase().includes(memberSearch.toLowerCase()))
  )

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

  // Save changes - Just navigate back since assignments happen in real-time
  const handleSave = async () => {
    router.back()
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto border-b-2 border-green-600 rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-600">Loading bulk send details...</p>
          </div>
        </div>
      </AuthGuard>
    )
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
                    Edit Bulk Send: {bulkSendData?.name}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Modify or add assignees • {signers.length} signers
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSave}
                className="text-white bg-green-600 hover:bg-green-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Done
              </Button>
            </div>
          </div>
        </div>

        <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Add Team Members */}
            <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add Team Members</h3>
                <span className="text-sm text-gray-500">{signers.length} total signers</span>
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

            {/* Current Signers */}
            <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Current Signers</h3>
                <span className="text-sm text-gray-500">{signers.length} signers</span>
              </div>

              {signers.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">No signers added yet</p>
                  <p className="text-xs text-gray-400">Select team members from the left to add signers</p>
                </div>
              ) : (
                <div className="space-y-2 overflow-y-auto max-h-96">
                  {signers.map((signer, index) => (
                    <div key={signer.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-6 h-6 text-xs font-medium text-white bg-green-600 rounded-full">
                          {index + 1}
                        </div>
                        <div className={`w-8 h-8 rounded-full ${getAvatarColor(signer.email)} flex items-center justify-center text-white text-xs font-medium`}>
                          {getInitials(signer.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{signer.name}</p>
                          <p className="text-xs text-gray-500 truncate">{signer.email}</p>
                          {signer.status && (
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              signer.status === 'signed' ? 'bg-green-100 text-green-800' :
                              signer.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                              signer.status === 'assigned' ? 'bg-green-100 text-green-800' :
                              signer.status === 'assigning' ? 'bg-yellow-100 text-yellow-800' :
                              signer.status === 'removing' ? 'bg-red-100 text-red-800' :
                              signer.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {signer.status === 'assigning' ? (
                                <div className="flex items-center">
                                  <div className="w-3 h-3 mr-1 border-b-2 border-yellow-600 rounded-full animate-spin"></div>
                                  assigning...
                                </div>
                              ) : signer.status === 'removing' ? (
                                <div className="flex items-center">
                                  <div className="w-3 h-3 mr-1 border-b-2 border-red-600 rounded-full animate-spin"></div>
                                  removing...
                                </div>
                              ) : signer.status}
                            </span>
                          )}
                        </div>
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
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
