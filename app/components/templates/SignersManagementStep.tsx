"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, ChevronUp, ChevronDown, User } from 'lucide-react'

interface TemplateSigner {
  id: string
  name: string
  email: string
  role: string
  color: string
  order: number
}

interface SignersManagementStepProps {
  signers: TemplateSigner[]
  onSignersChange: (signers: TemplateSigner[]) => void
  onBack: () => void
  onContinue: () => void
}

const SIGNER_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green  
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
]

const SIGNER_ROLES = [
  'Signer',
  'Reviewer', 
  'Approver',
  'Witness',
  'CC'
]

export function SignersManagementStep({
  signers,
  onSignersChange,
  onBack,
  onContinue
}: SignersManagementStepProps) {
  const [localSigners, setLocalSigners] = useState<TemplateSigner[]>(signers)

  useEffect(() => {
    setLocalSigners(signers)
  }, [signers])

  const addSigner = () => {
    const newSigner: TemplateSigner = {
      id: crypto.randomUUID(),
      name: '',
      email: '',
      role: 'Signer',
      color: SIGNER_COLORS[localSigners.length % SIGNER_COLORS.length],
      order: localSigners.length + 1
    }
    
    const updatedSigners = [...localSigners, newSigner]
    setLocalSigners(updatedSigners)
    onSignersChange(updatedSigners)
  }

  const removeSigner = (signerId: string) => {
    const updatedSigners = localSigners
      .filter(s => s.id !== signerId)
      .map((signer, index) => ({ ...signer, order: index + 1 }))
    
    setLocalSigners(updatedSigners)
    onSignersChange(updatedSigners)
  }

  const updateSigner = (signerId: string, updates: Partial<TemplateSigner>) => {
    const updatedSigners = localSigners.map(signer =>
      signer.id === signerId ? { ...signer, ...updates } : signer
    )
    
    setLocalSigners(updatedSigners)
    onSignersChange(updatedSigners)
  }

  const moveSignerUp = (index: number) => {
    if (index === 0) return
    
    const updatedSigners = [...localSigners]
    const temp = updatedSigners[index]
    updatedSigners[index] = updatedSigners[index - 1]
    updatedSigners[index - 1] = temp
    
    // Update order numbers
    const reorderedSigners = updatedSigners.map((signer, idx) => ({
      ...signer,
      order: idx + 1
    }))

    setLocalSigners(reorderedSigners)
    onSignersChange(reorderedSigners)
  }

  const moveSignerDown = (index: number) => {
    if (index === localSigners.length - 1) return
    
    const updatedSigners = [...localSigners]
    const temp = updatedSigners[index]
    updatedSigners[index] = updatedSigners[index + 1]
    updatedSigners[index + 1] = temp
    
    // Update order numbers
    const reorderedSigners = updatedSigners.map((signer, idx) => ({
      ...signer,
      order: idx + 1
    }))

    setLocalSigners(reorderedSigners)
    onSignersChange(reorderedSigners)
  }

  const validateSigners = () => {
    return localSigners.every(signer => 
      signer.name.trim() !== '' && 
      signer.email.trim() !== '' && 
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signer.email)
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-4 py-4 mx-auto max-w-7xl">
          <h1 className="text-xl font-semibold text-gray-900">
            Add Signers
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Add the people who will sign this document.
          </p>
        </div>
      </div>

      <div className="p-6 mx-auto max-w-4xl">
        <div className="bg-white rounded-lg shadow">
          {/* Assignees Section */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Assignees</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{localSigners.length}</span>
                <User className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-3">
              {localSigners.map((signer, index) => (
                <div
                  key={signer.id}
                  className="flex items-center space-x-4 p-4 border rounded-lg bg-white"
                >
                  {/* Order Controls */}
                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => moveSignerUp(index)}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveSignerDown(index)}
                      disabled={index === localSigners.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Signer Avatar */}
                  <div 
                    className="flex items-center justify-center w-10 h-10 rounded-full text-white text-sm font-medium"
                    style={{ backgroundColor: signer.color }}
                  >
                    {signer.name ? signer.name.charAt(0).toUpperCase() : index + 1}
                  </div>

                  {/* Form Fields */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={signer.name}
                      onChange={(e) => updateSigner(signer.id, { name: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={signer.email}
                      onChange={(e) => updateSigner(signer.id, { email: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    
                    <select
                      value={signer.role}
                      onChange={(e) => updateSigner(signer.id, { role: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {SIGNER_ROLES.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  {/* Remove Button */}
                  {localSigners.length > 1 && (
                    <button
                      onClick={() => removeSigner(signer.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Signer Button */}
            <button
              onClick={addSigner}
              className="mt-4 flex items-center space-x-2 px-4 py-2 text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Signer</span>
            </button>
          </div>

          {/* Order of Signers */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order of Signers</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {localSigners.map((signer, index) => (
                <div key={signer.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div 
                    className="flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-medium"
                    style={{ backgroundColor: signer.color }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {signer.name || `Signer ${index + 1}`}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {signer.email || 'No email'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between p-6 border-t bg-gray-50">
            <Button
              variant="outline"
              onClick={onBack}
              className="px-6 py-2"
            >
              ← Back
            </Button>
            
            <Button
              onClick={onContinue}
              disabled={!validateSigners() || localSigners.length === 0}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
