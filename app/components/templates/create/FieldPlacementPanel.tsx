'use client'

import React from 'react'
import { X, Settings } from 'lucide-react'
import { FieldPlacement, Signer } from './types'
import { FIELD_TYPES } from './fieldConfig'

interface FieldPlacementPanelProps {
  fieldPlacements: FieldPlacement[]
  selectedSigners: Signer[]
  selectedFieldType: string | null
  onFieldTypeSelect: (type: string | null) => void
  onFieldRemove: (fieldId: string) => void
  onFieldUpdate: (fieldId: string, updates: Partial<FieldPlacement>) => void
  selectedField?: FieldPlacement | null
}

const FieldPlacementPanel: React.FC<FieldPlacementPanelProps> = ({
  fieldPlacements,
  selectedSigners,
  selectedFieldType,
  onFieldTypeSelect,
  onFieldRemove,
  onFieldUpdate,
  selectedField
}) => {
  const getInitials = (name: string | undefined, email: string | undefined) => {
    if (name && name.trim()) {
      return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    }
    if (email) {
      return email.split('@')[0].slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  const getAvatarColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500']
    return colors[index % colors.length]
  }

  return (
    <div className="space-y-6">
      {/* Field Types */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Field Types</h3>
        <div className="grid grid-cols-2 gap-2">
          {FIELD_TYPES.map((fieldType) => {
            const Icon = fieldType.icon
            const isSelected = selectedFieldType === fieldType.type
            
            return (
              <button
                key={fieldType.type}
                onClick={() => onFieldTypeSelect(isSelected ? null : fieldType.type)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className={`p-1.5 rounded ${fieldType.color} text-white`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{fieldType.label}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Field Properties */}
      {selectedField && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Field Properties</h3>
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Type
              </label>
              <p className="text-sm text-gray-900 capitalize">{selectedField.type}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Placeholder Text
              </label>
              <input
                type="text"
                value={selectedField.placeholder || ''}
                onChange={(e) => onFieldUpdate(selectedField.id, { placeholder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter placeholder text"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign to Signer
              </label>
              <select
                value={selectedField.assignedSigner || ''}
                onChange={(e) => onFieldUpdate(selectedField.id, { assignedSigner: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a signer</option>
                {selectedSigners.map((signer, index) => (
                  <option key={signer.objectId} value={signer.Name || signer.Email}>
                    {signer.Name || signer.Email} (Order {index + 1})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="required"
                checked={selectedField.required}
                onChange={(e) => onFieldUpdate(selectedField.id, { required: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="required" className="ml-2 text-sm text-gray-700">
                Required field
              </label>
            </div>

            <button
              onClick={() => onFieldRemove(selectedField.id)}
              className="w-full px-4 py-2 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              Remove Field
            </button>
          </div>
        </div>
      )}

      {/* Placed Fields List */}
      {fieldPlacements.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Placed Fields ({fieldPlacements.length})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {fieldPlacements.map((field) => {
              const fieldTypeConfig = FIELD_TYPES.find(type => type.type === field.type)
              const Icon = fieldTypeConfig?.icon || Settings
              const isSelected = selectedField?.id === field.id
              
              return (
                <div
                  key={field.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => onFieldUpdate(field.id, {})} // This will trigger selection
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-1.5 rounded ${fieldTypeConfig?.color || 'bg-gray-500'} text-white`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {field.type}
                        </p>
                        <p className="text-xs text-gray-500">
                          Page {field.page} • {field.assignedSigner || 'Unassigned'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onFieldRemove(field.id)
                      }}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Signer Assignment Helper */}
      {selectedSigners.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Signers</h3>
          <div className="space-y-2">
            {selectedSigners.map((signer, index) => (
              <div key={signer.objectId} className="flex items-center p-2 bg-gray-50 rounded-lg">
                <div className={`flex items-center justify-center w-6 h-6 text-white rounded-full text-xs font-medium ${getAvatarColor(index)}`}>
                  {getInitials(signer.Name, signer.Email)}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">{signer.Name || signer.Email}</p>
                  <p className="text-xs text-gray-500">Order {index + 1}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FieldPlacementPanel