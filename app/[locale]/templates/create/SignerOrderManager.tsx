'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  User, 
  UserCheck,
  AlertCircle 
} from 'lucide-react'
import { TemplateSigner } from '@/app/lib/templates-store'

// Predefined signer colors for visual distinction
const SIGNER_COLORS = [
  '#ef4444', // red-500
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
]

const SIGNER_ROLES = [
  'Signer',
  'Approver', 
  'Reviewer',
  'Witness',
  'Notary',
  'CC (Copy)'
]

interface SignerOrderManagerProps {
  signers: TemplateSigner[]
  onSignersChange: (signers: TemplateSigner[]) => void
  sendInOrder: boolean
  onSendInOrderChange: (sendInOrder: boolean) => void
  onNext?: () => void
  onBack?: () => void
}

interface DragItem {
  id: string
  index: number
}

interface DraggableSignerProps {
  signer: TemplateSigner
  index: number
  onUpdate: (id: string, updates: Partial<TemplateSigner>) => void
  onRemove: (id: string) => void
  moveCard: (dragIndex: number, hoverIndex: number) => void
}

function DraggableSigner({ signer, index, onUpdate, onRemove, moveCard }: DraggableSignerProps) {
  const t = useTranslations('templates')
  
  const [{ isDragging }, drag] = useDrag({
    type: 'signer',
    item: { id: signer.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [, drop] = useDrop({
    accept: 'signer',
    hover: (item: DragItem) => {
      if (item.index !== index) {
        moveCard(item.index, index)
        item.index = index
      }
    },
  })

  const connectDragAndDrop = (element: HTMLDivElement | null) => {
    drag(drop(element))
  }

  return (
    <Card 
      ref={connectDragAndDrop}
      className={`mb-3 cursor-move transition-opacity ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Drag Handle */}
          <div className="flex items-center gap-3">
            <GripVertical className="w-5 h-5 text-gray-400" />
            <div 
              className="flex items-center justify-center w-8 h-8 text-sm font-medium text-white rounded-full"
              style={{ backgroundColor: signer.color }}
            >
              {signer.order}
            </div>
          </div>

          {/* Signer Details */}
          <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor={`role-${signer.id}`} className="text-sm font-medium">
                {t('signers.role')}
              </Label>
              <Select
                value={signer.role}
                onValueChange={(value) => onUpdate(signer.id, { role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('signers.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  {SIGNER_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor={`name-${signer.id}`} className="text-sm font-medium">
                {t('signers.name')} <span className="text-gray-400">({t('signers.optional')})</span>
              </Label>
              <Input
                id={`name-${signer.id}`}
                value={signer.name || ''}
                onChange={(e) => onUpdate(signer.id, { name: e.target.value })}
                placeholder={t('signers.namePlaceholder')}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor={`email-${signer.id}`} className="text-sm font-medium">
                {t('signers.email')} <span className="text-gray-400">({t('signers.optional')})</span>
              </Label>
              <Input
                id={`email-${signer.id}`}
                type="email"
                value={signer.email || ''}
                onChange={(e) => onUpdate(signer.id, { email: e.target.value })}
                placeholder={t('signers.emailPlaceholder')}
                className="mt-1"
              />
            </div>
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(signer.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
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

  const getNextAvailableColor = () => {
    const usedColors = signers.map(s => s.color)
    return SIGNER_COLORS.find(color => !usedColors.includes(color)) || SIGNER_COLORS[0]
  }

  const addSigner = () => {
    const newSigner: TemplateSigner = {
      id: crypto.randomUUID(),
      role: 'Signer',
      color: getNextAvailableColor(),
      order: signers.length + 1,
      status: 'pending'
    }
    onSignersChange([...signers, newSigner])
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

  const moveCard = (dragIndex: number, hoverIndex: number) => {
    const draggedSigner = signers[dragIndex]
    const newSigners = [...signers]
    
    // Remove dragged item
    newSigners.splice(dragIndex, 1)
    // Insert at new position
    newSigners.splice(hoverIndex, 0, draggedSigner)
    
    // Update order numbers
    const reorderedSigners = newSigners.map((signer, index) => ({
      ...signer,
      order: index + 1
    }))
    
    onSignersChange(reorderedSigners)
  }

  const validateSigners = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (signers.length === 0) {
      newErrors.signers = t('errors.noSigners')
    } else {
      // Check for duplicate roles in same order (if sendInOrder is false)
      if (!sendInOrder) {
        const roleCount = signers.reduce((acc, signer) => {
          acc[signer.role] = (acc[signer.role] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        
        const duplicateRoles = Object.entries(roleCount)
          .filter(([, count]) => count > 1)
          .map(([role]) => role)
        
        if (duplicateRoles.length > 0) {
          newErrors.duplicateRoles = t('errors.duplicateRoles', { roles: duplicateRoles.join(', ') })
        }
      }
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
    <DndProvider backend={HTML5Backend}>
      <div className="max-w-4xl p-6 mx-auto">
        {/* Progress indicator - Step 2 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 text-gray-400">
              <div className="flex items-center justify-center w-8 h-8 font-medium text-white bg-teal-600 rounded-full">
                ✓
              </div>
              <span className="font-medium">{t('createSteps.upload')}</span>
            </div>
            <div className="flex items-center space-x-2 text-teal-600">
              <div className="flex items-center justify-center w-8 h-8 font-medium text-white bg-teal-600 rounded-full">
                2
              </div>
              <span className="font-medium">{t('createSteps.addSigners')}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <div className="flex items-center justify-center w-8 h-8 font-medium text-gray-500 bg-gray-200 rounded-full">
                3
              </div>
              <span className="font-medium">{t('createSteps.placeFields')}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <div className="flex items-center justify-center w-8 h-8 font-medium text-gray-500 bg-gray-200 rounded-full">
                4
              </div>
              <span className="font-medium">{t('createSteps.review')}</span>
            </div>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-teal-600 rounded-full" style={{ width: '50%' }}></div>
          </div>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  {t('signers.title')}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {t('signers.description')}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {/* Signing Order Settings */}
            <div className="p-4 mb-6 rounded-lg bg-gray-50">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="sendInOrder"
                  checked={sendInOrder}
                  onCheckedChange={onSendInOrderChange}
                />
                <div className="flex-1">
                  <Label htmlFor="sendInOrder" className="text-sm font-medium text-gray-700">
                    {t('signers.sendInOrder')}
                  </Label>
                  <p className="mt-1 text-xs text-gray-500">
                    {t('signers.sendInOrderDescription')}
                  </p>
                </div>
              </div>
            </div>

            {/* Signers List */}
            <div className="space-y-3">
              {signers.length === 0 ? (
                <div className="py-8 text-center">
                  <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    {t('signers.noSigners')}
                  </h3>
                  <p className="mb-4 text-gray-600">
                    {t('signers.noSignersDescription')}
                  </p>
                </div>
              ) : (
                signers.map((signer, index) => (
                  <DraggableSigner
                    key={signer.id}
                    signer={signer}
                    index={index}
                    onUpdate={updateSigner}
                    onRemove={removeSigner}
                    moveCard={moveCard}
                  />
                ))
              )}
            </div>

            {/* Add Signer Button */}
            <Button
              onClick={addSigner}
              variant="outline"
              className="w-full mt-4 border-2 border-dashed hover:border-teal-400 hover:bg-teal-50"
              disabled={signers.length >= SIGNER_COLORS.length}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('signers.addSigner')}
            </Button>

            {/* Errors */}
            {Object.keys(errors).length > 0 && (
              <div className="p-3 mt-4 border border-red-200 rounded-lg bg-red-50">
                {Object.values(errors).map((error, index) => (
                  <div key={index} className="flex items-center text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {error}
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-6 mt-6 border-t">
              {onBack && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="px-6"
                >
                  {t('actions.back')}
                </Button>
              )}
              
              <Button
                onClick={handleNext}
                disabled={signers.length === 0}
                className="px-8 ml-auto bg-teal-600 hover:bg-teal-700"
              >
                {t('actions.next')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DndProvider>
  )
}
