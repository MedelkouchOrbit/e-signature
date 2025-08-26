'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Menu,
  Plus, 
  AlertCircle,
  X,
  Search,
  Loader2,
  Users
} from 'lucide-react'
import { TemplateSigner } from '@/app/lib/templates-store'
import { getAssignees, createAssignee, generateAssigneeInitials, type OpenSignContact } from '@/app/lib/templates-api-service'

// Predefined signer colors exactly like OpenSign
const SIGNER_COLORS = [
  '#3b82f6', // Blue for TU
  '#10b981', // Green for SM  
  '#8b5cf6', // Purple for TK
  '#f59e0b', // Orange for HS
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#ec4899', // Pink
  '#6366f1', // Indigo
]

interface SignerOrderManagerProps {
  signers: TemplateSigner[]
  onSignersChange: (signers: TemplateSigner[]) => void
  sendInOrder: boolean
  onSendInOrderChange: (sendInOrder: boolean) => void
  onNext?: () => void
  onBack?: () => void
}

export default function SignerOrderManager({
  signers,
  onSignersChange,
  sendInOrder,
  onSendInOrderChange,
  onNext,
  onBack
}: SignerOrderManagerProps) {
  const t = useTranslations('templates')
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Dynamic assignee state
  const [availableAssignees, setAvailableAssignees] = useState<OpenSignContact[]>([])
  const [isLoadingAssignees, setIsLoadingAssignees] = useState(false)
  const [assigneeSearchTerm, setAssigneeSearchTerm] = useState('')
  const [showAddAssignee, setShowAddAssignee] = useState(false)
  const [newAssignee, setNewAssignee] = useState({ name: '', email: '', phone: '' })
  const [isCreatingAssignee, setIsCreatingAssignee] = useState(false)

  // Load assignees from backend on component mount
  useEffect(() => {
    loadAssignees()
  }, [])

  // Reload assignees when search term changes (with debouncing)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (assigneeSearchTerm.length > 0) {
        loadAssignees(assigneeSearchTerm)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [assigneeSearchTerm])

  const loadAssignees = async (search: string = '') => {
    setIsLoadingAssignees(true)
    try {
      const contacts = await getAssignees(search)
      setAvailableAssignees(contacts)
    } catch (error) {
      console.error('Error loading assignees:', error)
      // Show user-friendly error - could add toast notification here
    } finally {
      setIsLoadingAssignees(false)
    }
  }

  const addSignerFromAssignee = (contact: OpenSignContact) => {
    const initials = generateAssigneeInitials(contact)
    const colorIndex = signers.length % SIGNER_COLORS.length
    const newSigner: TemplateSigner = {
      id: crypto.randomUUID(),
      role: initials,
      name: contact.Name,
      email: contact.Email,
      color: SIGNER_COLORS[colorIndex],
      order: signers.length + 1,
      status: 'pending'
    }
    onSignersChange([...signers, newSigner])
  }

  const handleCreateAssignee = async () => {
    if (!newAssignee.name.trim() || !newAssignee.email.trim()) {
      return
    }

    setIsCreatingAssignee(true)
    try {
      const created = await createAssignee({
        name: newAssignee.name.trim(),
        email: newAssignee.email.trim(),
        phone: newAssignee.phone.trim()
      })

      if (created) {
        // Add the new assignee to our list and immediately add as signer
        setAvailableAssignees(prev => [created, ...prev])
        addSignerFromAssignee(created)
        
        // Reset form
        setNewAssignee({ name: '', email: '', phone: '' })
        setShowAddAssignee(false)
      }
    } catch (error) {
      console.error('Error creating assignee:', error)
      // Show user-friendly error - could add toast notification here
    } finally {
      setIsCreatingAssignee(false)
    }
  }

  const updateSigner = (id: string, updates: Partial<TemplateSigner>) => {
    onSignersChange(
      signers.map(signer => 
        signer.id === id ? { ...signer, ...updates } : signer
      )
    )
  }

  const removeSigner = (id: string) => {
    const updatedSigners = signers
      .filter(signer => signer.id !== id)
      .map((signer, index) => ({ ...signer, order: index + 1 }))
    onSignersChange(updatedSigners)
  }

  const moveSignerUp = (index: number) => {
    if (index === 0) return
    const newSigners = [...signers]
    const temp = newSigners[index]
    newSigners[index] = newSigners[index - 1]
    newSigners[index - 1] = temp
    
    // Update order numbers
    const reorderedSigners = newSigners.map((signer, idx) => ({
      ...signer,
      order: idx + 1
    }))
    onSignersChange(reorderedSigners)
  }

  const moveSignerDown = (index: number) => {
    if (index === signers.length - 1) return
    const newSigners = [...signers]
    const temp = newSigners[index]
    newSigners[index] = newSigners[index + 1]
    newSigners[index + 1] = temp
    
    // Update order numbers
    const reorderedSigners = newSigners.map((signer, idx) => ({
      ...signer,
      order: idx + 1
    }))
    onSignersChange(reorderedSigners)
  }

  const validateSigners = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (signers.length === 0) {
      newErrors.signers = t('errors.noSigners')
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateSigners() && onNext) {
      onNext()
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress indicator - Step 2 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 text-gray-400">
            <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-medium">
              ✓
            </div>
            <span className="font-medium">{t('createSteps.upload')}</span>
          </div>
          <div className="flex items-center space-x-2 text-teal-600">
            <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-medium">
              2
            </div>
            <span className="font-medium">{t('createSteps.addSigners')}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center font-medium">
              3
            </div>
            <span className="font-medium">{t('createSteps.placeFields')}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center font-medium">
              4
            </div>
            <span className="font-medium">{t('createSteps.review')}</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-teal-600 h-2 rounded-full" style={{ width: '50%' }}></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side - Document Preview (Placeholder) */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Document.pdf</h3>
            <Button variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Document preview placeholder */}
          <div className="aspect-[8.5/11] bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 mb-2">📄</div>
              <p className="text-sm text-gray-500">Document Preview</p>
            </div>
          </div>
          
          {/* Document status indicators like in OpenSign */}
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-400"></div>
              Waiting
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              Signing
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              Waiting
            </span>
          </div>
        </div>

        {/* Right Side - Add Signers */}
        <div className="space-y-6">
          {/* Add Signers Section */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium">Add Signers</CardTitle>
              <p className="text-sm text-gray-600">Add the people who will sign the document.</p>
            </CardHeader>
            <CardContent>
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  <Users className="w-4 h-4 inline mr-2" />
                  {t('signers.assignees.title')}
                </Label>
                
                {/* Search and add assignee section */}
                <div className="space-y-3 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder={t('signers.assignees.searchPlaceholder')}
                      value={assigneeSearchTerm}
                      onChange={(e) => setAssigneeSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Quick add new assignee button */}
                  {!showAddAssignee && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddAssignee(true)}
                      className="w-full border-dashed"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t('signers.assignees.addNewContact')}
                    </Button>
                  )}
                  
                  {/* Add new assignee form */}
                  {showAddAssignee && (
                    <div className="border rounded-lg p-3 space-y-3 bg-gray-50">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder={t('signers.assignees.createContact.namePlaceholder')}
                          value={newAssignee.name}
                          onChange={(e) => setNewAssignee(prev => ({ ...prev, name: e.target.value }))}
                        />
                        <Input
                          placeholder={t('signers.assignees.createContact.emailPlaceholder')}
                          type="email"
                          value={newAssignee.email}
                          onChange={(e) => setNewAssignee(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <Input
                        placeholder={t('signers.assignees.createContact.phonePlaceholder')}
                        value={newAssignee.phone}
                        onChange={(e) => setNewAssignee(prev => ({ ...prev, phone: e.target.value }))}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleCreateAssignee}
                          disabled={isCreatingAssignee || !newAssignee.name.trim() || !newAssignee.email.trim()}
                        >
                          {isCreatingAssignee && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          {isCreatingAssignee ? t('signers.assignees.createContact.adding') : t('signers.assignees.createContact.addAndAssign')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowAddAssignee(false)
                            setNewAssignee({ name: '', email: '', phone: '' })
                          }}
                        >
                          {t('signers.assignees.createContact.cancel')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Available assignees list */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {isLoadingAssignees ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('signers.assignees.loadingContacts')}
                    </div>
                  ) : availableAssignees.length > 0 ? (
                    availableAssignees.slice(0, 8).map((contact, index) => {
                      const initials = generateAssigneeInitials(contact)
                      const isUsed = signers.some(s => s.email === contact.Email)
                      return (
                        <div key={contact.objectId} className="group relative">
                          <button
                            onClick={() => !isUsed && addSignerFromAssignee(contact)}
                            disabled={isUsed}
                            className={`w-10 h-10 rounded-full text-white text-xs font-medium transition-all ${
                              isUsed 
                                ? 'opacity-50 cursor-not-allowed' 
                                : 'hover:scale-110 cursor-pointer shadow-lg hover:shadow-xl'
                            }`}
                            style={{ backgroundColor: SIGNER_COLORS[index % SIGNER_COLORS.length] }}
                            title={isUsed ? t('signers.assignees.alreadyAssigned') : t('signers.assignees.clickToAssign')}
                          >
                            {initials}
                          </button>
                          
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            <div dangerouslySetInnerHTML={{ 
                              __html: t('signers.assignees.contactTooltip', { 
                                name: contact.Name, 
                                email: contact.Email 
                              }) 
                            }} />
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      {t('signers.assignees.noContactsFound')}
                    </div>
                  )}
                  
                  {/* Show more indicator */}
                  {availableAssignees.length > 8 && (
                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-500">
                      {t('signers.assignees.showMore', { count: availableAssignees.length - 8 })}
                    </div>
                  )}
                </div>

                {/* Selected signers display */}
                {signers.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('signers.selectedSigners')}</Label>
                    {signers.slice(0, 4).map((signer) => (
                      <div key={signer.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                        <div 
                          className="w-6 h-6 rounded-full text-white text-xs font-medium flex items-center justify-center"
                          style={{ backgroundColor: signer.color }}
                        >
                          {signer.role}
                        </div>
                        <Input
                          placeholder="Enter email address"
                          value={signer.email || ''}
                          onChange={(e) => updateSigner(signer.id, { email: e.target.value })}
                          className="flex-1 h-8 text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSigner(signer.id)}
                          className="text-gray-400 hover:text-red-500 h-6 w-6 p-0"
                        >
                          ✓
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order of Signers Section */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium">Order of Signers</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Send in order toggle */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="sendInOrder"
                    checked={sendInOrder}
                    onCheckedChange={onSendInOrderChange}
                  />
                  <div className="flex-1">
                    <Label htmlFor="sendInOrder" className="text-sm font-medium text-gray-700">
                      Send in Order
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      {sendInOrder 
                        ? "Signers must sign in the specified order. Each signer can only sign after the previous one completes."
                        : "All signers can sign simultaneously in any order."
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Signers order list */}
              <div className="space-y-2">
                {signers.map((signer, index) => (
                  <div key={signer.id} className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 cursor-grab"
                    >
                      <Menu className="h-4 w-4 text-gray-400" />
                    </Button>
                    
                    <div 
                      className="w-6 h-6 rounded-full text-white text-xs font-medium flex items-center justify-center"
                      style={{ backgroundColor: signer.color }}
                    >
                      {signer.role}
                    </div>
                    
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {signer.email || `${signer.role}@example.com`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {sendInOrder && index > 0 && (
                          <span className="text-orange-600">
                            ⏳ Waiting for {signers[index - 1].role} to sign
                          </span>
                        )}
                        {sendInOrder && index === 0 && (
                          <span className="text-green-600">
                            ✅ Can sign immediately
                          </span>
                        )}
                        {!sendInOrder && (
                          <span className="text-blue-600">
                            📝 Can sign anytime
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Order control buttons */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSignerUp(index)}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSignerDown(index)}
                        disabled={index === signers.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        ↓
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Errors */}
              {Object.keys(errors).length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  {Object.values(errors).map((error, index) => (
                    <div key={index} className="flex items-center text-red-700 text-sm">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {error}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            {onBack && (
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="px-6"
              >
                Cancel
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              disabled={signers.length === 0}
              className="px-8 bg-[#47a3ad] hover:bg-[#3a8892] text-white ml-auto"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
